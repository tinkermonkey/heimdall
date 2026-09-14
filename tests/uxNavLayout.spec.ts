import { test, expect } from "@playwright/test";
import { uxNavLayout } from "../src/utils/uxNavLayout";
import type { LayoutNode } from "../src/utils/graphLayout";
import type { HierarchyEdge } from "../src/utils/graphHierarchy";

test.describe("uxNavLayout", () => {
  const createNode = (id: string): LayoutNode => ({
    id,
    x: 0,
    y: 0,
    width: 138,
    height: 30,
  });

  const createDims = (
    ids: string[],
  ): Map<string, { width: number; height: number }> => {
    const dims = new Map<string, { width: number; height: number }>();
    for (const id of ids) {
      dims.set(id, { width: 138, height: 30 });
    }
    return dims;
  };

  test("returns empty map for empty nodes", () => {
    const nodes: LayoutNode[] = [];
    const edges: HierarchyEdge[] = [];
    const dims = new Map<string, { width: number; height: number }>();

    const positions = uxNavLayout(nodes, edges, dims, () => true);

    expect(positions.size).toBe(0);
  });

  test("positions single page node", () => {
    const nodes = [createNode("page1")];
    const edges: HierarchyEdge[] = [];
    const dims = createDims(["page1"]);

    const positions = uxNavLayout(nodes, edges, dims, (n) => n.id === "page1");

    expect(positions.has("page1")).toBe(true);
    const pos = positions.get("page1")!;
    expect(typeof pos.x).toBe("number");
    expect(typeof pos.y).toBe("number");
  });

  test("positions single view node relative to page parent", () => {
    const nodes = [createNode("page1"), createNode("view1")];
    const edges: HierarchyEdge[] = [
      { source: "page1", target: "view1", structural: true },
    ];
    const dims = createDims(["page1", "view1"]);

    const positions = uxNavLayout(nodes, edges, dims, (n) =>
      n.id.includes("page"),
    );

    expect(positions.has("page1")).toBe(true);
    expect(positions.has("view1")).toBe(true);

    const pagePos = positions.get("page1")!;
    const viewPos = positions.get("view1")!;

    // View should be positioned to the right of page (higher x)
    expect(viewPos.x).toBeGreaterThan(pagePos.x);
    // View should be at same y as page
    expect(viewPos.y).toBe(pagePos.y);
  });

  test("positions multiple views as horizontal fan", () => {
    const nodes = [
      createNode("page1"),
      createNode("view1"),
      createNode("view2"),
      createNode("view3"),
    ];
    const edges: HierarchyEdge[] = [
      { source: "page1", target: "view1", structural: true },
      { source: "page1", target: "view2", structural: true },
      { source: "page1", target: "view3", structural: true },
    ];
    const dims = createDims(["page1", "view1", "view2", "view3"]);

    const positions = uxNavLayout(nodes, edges, dims, (n) =>
      n.id.includes("page"),
    );

    const pagePos = positions.get("page1")!;
    const view1Pos = positions.get("view1")!;
    const view2Pos = positions.get("view2")!;
    const view3Pos = positions.get("view3")!;

    // All views should be at same y as page
    expect(view1Pos.y).toBe(pagePos.y);
    expect(view2Pos.y).toBe(pagePos.y);
    expect(view3Pos.y).toBe(pagePos.y);

    // Views should be ordered left to right
    expect(view1Pos.x).toBeLessThan(view2Pos.x);
    expect(view2Pos.x).toBeLessThan(view3Pos.x);

    // Views should be to the right of page
    expect(view1Pos.x).toBeGreaterThan(pagePos.x);
  });

  test("positions multi-level page tree (pages with child pages)", () => {
    const nodes = [
      createNode("page1"),
      createNode("page1_child"),
      createNode("page2"),
    ];
    const edges: HierarchyEdge[] = [
      { source: "page1", target: "page1_child", structural: true },
    ];
    const dims = createDims(["page1", "page1_child", "page2"]);

    const positions = uxNavLayout(nodes, edges, dims, (n) =>
      n.id.includes("page"),
    );

    const page1Pos = positions.get("page1")!;
    const childPos = positions.get("page1_child")!;

    // Child should be below parent (higher y in top-down tree)
    expect(childPos.y).toBeGreaterThan(page1Pos.y);
  });

  test("positions independent page trees with spacing", () => {
    const nodes = [createNode("page1"), createNode("page2")];
    const edges: HierarchyEdge[] = [];
    const dims = createDims(["page1", "page2"]);

    const positions = uxNavLayout(nodes, edges, dims, (n) =>
      n.id.includes("page"),
    );

    const page1Pos = positions.get("page1")!;
    const page2Pos = positions.get("page2")!;

    // Trees should be horizontally separated
    expect(Math.abs(page1Pos.x - page2Pos.x)).toBeGreaterThan(0);
    // Both should be at top level (similar y)
    expect(Math.abs(page1Pos.y - page2Pos.y)).toBeLessThan(50);
  });

  test("respects custom rowSpacing option", () => {
    const nodes = [
      createNode("page1"),
      createNode("page1_child"),
      createNode("page1_grandchild"),
    ];
    const edges: HierarchyEdge[] = [
      { source: "page1", target: "page1_child", structural: true },
      { source: "page1_child", target: "page1_grandchild", structural: true },
    ];
    const dims = createDims(["page1", "page1_child", "page1_grandchild"]);

    const positionsSmall = uxNavLayout(
      nodes,
      edges,
      dims,
      (n) => n.id.includes("page"),
      { rowSpacing: 40 },
    );

    const positionsLarge = uxNavLayout(
      nodes,
      edges,
      dims,
      (n) => n.id.includes("page"),
      { rowSpacing: 120 },
    );

    const child1Small = positionsSmall.get("page1_child")!;
    const child1Large = positionsLarge.get("page1_child")!;

    // Larger rowSpacing should result in greater vertical distance
    expect(child1Large.y).toBeGreaterThan(child1Small.y);
  });

  test("respects custom viewFanGap option", () => {
    const nodes = [createNode("page1"), createNode("view1")];
    const edges: HierarchyEdge[] = [
      { source: "page1", target: "view1", structural: true },
    ];
    const dims = createDims(["page1", "view1"]);

    const positionsSmall = uxNavLayout(
      nodes,
      edges,
      dims,
      (n) => n.id.includes("page"),
      { viewFanGap: 20 },
    );

    const positionsLarge = uxNavLayout(
      nodes,
      edges,
      dims,
      (n) => n.id.includes("page"),
      { viewFanGap: 60 },
    );

    const pageSmall = positionsSmall.get("page1")!;
    const view1Small = positionsSmall.get("view1")!;

    const pageLarge = positionsLarge.get("page1")!;
    const view1Large = positionsLarge.get("view1")!;

    // Larger gap should result in greater horizontal distance
    const gapSmall = view1Small.x - pageSmall.x;
    const gapLarge = view1Large.x - pageLarge.x;

    expect(gapLarge).toBeGreaterThan(gapSmall);
  });

  test("respects custom viewSpacing option", () => {
    const nodes = [
      createNode("page1"),
      createNode("view1"),
      createNode("view2"),
    ];
    const edges: HierarchyEdge[] = [
      { source: "page1", target: "view1", structural: true },
      { source: "page1", target: "view2", structural: true },
    ];
    const dims = createDims(["page1", "view1", "view2"]);

    const positionsSmall = uxNavLayout(
      nodes,
      edges,
      dims,
      (n) => n.id.includes("page"),
      { viewSpacing: 10 },
    );

    const positionsLarge = uxNavLayout(
      nodes,
      edges,
      dims,
      (n) => n.id.includes("page"),
      { viewSpacing: 50 },
    );

    const view1Small = positionsSmall.get("view1")!;
    const view2Small = positionsSmall.get("view2")!;

    const view1Large = positionsLarge.get("view1")!;
    const view2Large = positionsLarge.get("view2")!;

    // Spacing between views should increase with viewSpacing option
    const spacingSmall = Math.abs(view2Small.x - view1Small.x);
    const spacingLarge = Math.abs(view2Large.x - view1Large.x);

    expect(spacingLarge).toBeGreaterThan(spacingSmall);
  });

  test("ignores non-page nodes not in structural hierarchy", () => {
    const nodes = [createNode("page1"), createNode("orphan_view")];
    const edges: HierarchyEdge[] = [];
    const dims = createDims(["page1", "orphan_view"]);

    const positions = uxNavLayout(nodes, edges, dims, (n) =>
      n.id.includes("page"),
    );

    // page1 should be positioned
    expect(positions.has("page1")).toBe(true);
    // Orphan view not connected to any page should not be positioned
    expect(positions.has("orphan_view")).toBe(false);
  });

  test("handles mixed tree structures with multiple levels and views", () => {
    const nodes = [
      createNode("page1"),
      createNode("page1_child"),
      createNode("view1"),
      createNode("view2"),
      createNode("page2"),
    ];
    const edges: HierarchyEdge[] = [
      { source: "page1", target: "page1_child", structural: true },
      { source: "page1", target: "view1", structural: true },
      { source: "page1_child", target: "view2", structural: true },
    ];
    const dims = createDims([
      "page1",
      "page1_child",
      "view1",
      "view2",
      "page2",
    ]);

    const positions = uxNavLayout(nodes, edges, dims, (n) =>
      n.id.includes("page"),
    );

    // All nodes should be positioned
    expect(positions.size).toBeGreaterThan(0);
    expect(positions.has("page1")).toBe(true);
    expect(positions.has("page1_child")).toBe(true);
    expect(positions.has("view1")).toBe(true);
    expect(positions.has("view2")).toBe(true);
    expect(positions.has("page2")).toBe(true);

    const page1Pos = positions.get("page1")!;
    const childPos = positions.get("page1_child")!;
    const view1Pos = positions.get("view1")!;
    const view2Pos = positions.get("view2")!;

    // Child page below parent
    expect(childPos.y).toBeGreaterThan(page1Pos.y);
    // Views at same level as their parents
    expect(view1Pos.y).toBe(page1Pos.y);
    expect(view2Pos.y).toBe(childPos.y);
  });

  test("handles custom dimensions", () => {
    const nodes = [createNode("page1"), createNode("view1")];
    const edges: HierarchyEdge[] = [
      { source: "page1", target: "view1", structural: true },
    ];

    const dims = new Map<string, { width: number; height: number }>();
    dims.set("page1", { width: 200, height: 50 });
    dims.set("view1", { width: 150, height: 40 });

    const positions = uxNavLayout(nodes, edges, dims, (n) =>
      n.id.includes("page"),
    );

    expect(positions.has("page1")).toBe(true);
    expect(positions.has("view1")).toBe(true);

    const pagePos = positions.get("page1")!;
    const viewPos = positions.get("view1")!;

    // Should account for custom dimensions in fan placement
    expect(viewPos.x).toBeGreaterThan(pagePos.x);
  });

  test("uses default dimensions for nodes without custom dims", () => {
    const nodes = [createNode("page1"), createNode("view1")];
    const edges: HierarchyEdge[] = [
      { source: "page1", target: "view1", structural: true },
    ];

    // Only provide dims for page1, not view1
    const dims = new Map<string, { width: number; height: number }>();
    dims.set("page1", { width: 200, height: 50 });

    const positions = uxNavLayout(nodes, edges, dims, (n) =>
      n.id.includes("page"),
    );

    // Both should be positioned (view1 uses defaults)
    expect(positions.has("page1")).toBe(true);
    expect(positions.has("view1")).toBe(true);
  });

  test("respects trunkSpacing for independent trees", () => {
    const nodes = [
      createNode("page1"),
      createNode("page2"),
      createNode("page3"),
    ];
    const edges: HierarchyEdge[] = [];
    const dims = createDims(["page1", "page2", "page3"]);

    const positionsSmall = uxNavLayout(
      nodes,
      edges,
      dims,
      (n) => n.id.includes("page"),
      { trunkSpacing: 30 },
    );

    const positionsLarge = uxNavLayout(
      nodes,
      edges,
      dims,
      (n) => n.id.includes("page"),
      { trunkSpacing: 150 },
    );

    const page1Large = positionsLarge.get("page1")!;
    const page2Large = positionsLarge.get("page2")!;

    const page1Small = positionsSmall.get("page1")!;
    const page2Small = positionsSmall.get("page2")!;

    // Larger trunk spacing should result in greater separation
    const distLarge = Math.abs(page2Large.x - page1Large.x);
    const distSmall = Math.abs(page2Small.x - page1Small.x);

    expect(distLarge).toBeGreaterThan(distSmall);
  });

  test("positions all nodes without gaps", () => {
    const nodes = [
      createNode("page1"),
      createNode("page1_child1"),
      createNode("page1_child2"),
      createNode("view1"),
      createNode("view2"),
      createNode("view3"),
    ];
    const edges: HierarchyEdge[] = [
      { source: "page1", target: "page1_child1", structural: true },
      { source: "page1", target: "page1_child2", structural: true },
      { source: "page1", target: "view1", structural: true },
      { source: "page1_child1", target: "view2", structural: true },
      { source: "page1_child2", target: "view3", structural: true },
    ];
    const dims = createDims(nodes.map((n) => n.id));

    const positions = uxNavLayout(nodes, edges, dims, (n) =>
      n.id.includes("page"),
    );

    // All nodes should have valid positions
    for (const node of nodes) {
      expect(positions.has(node.id)).toBe(true);
      const pos = positions.get(node.id)!;
      expect(isFinite(pos.x)).toBe(true);
      expect(isFinite(pos.y)).toBe(true);
    }
  });

  test("handles deeply nested page hierarchies", () => {
    const nodes = [
      createNode("page1"),
      createNode("page1_child"),
      createNode("page1_child_grandchild"),
      createNode("page1_child_grandchild_great"),
    ];
    const edges: HierarchyEdge[] = [
      { source: "page1", target: "page1_child", structural: true },
      {
        source: "page1_child",
        target: "page1_child_grandchild",
        structural: true,
      },
      {
        source: "page1_child_grandchild",
        target: "page1_child_grandchild_great",
        structural: true,
      },
    ];
    const dims = createDims(nodes.map((n) => n.id));

    const positions = uxNavLayout(nodes, edges, dims, (n) =>
      n.id.includes("page"),
    );

    const page1 = positions.get("page1")!;
    const child = positions.get("page1_child")!;
    const grandchild = positions.get("page1_child_grandchild")!;
    const great = positions.get("page1_child_grandchild_great")!;

    // Each level should be deeper (higher y)
    expect(child.y).toBeGreaterThan(page1.y);
    expect(grandchild.y).toBeGreaterThan(child.y);
    expect(great.y).toBeGreaterThan(grandchild.y);
  });

  test("positions reused views under multiple parent pages", () => {
    const nodes = [
      createNode("page1"),
      createNode("page2"),
      createNode("sharedView"),
    ];
    const edges: HierarchyEdge[] = [
      { source: "page1", target: "sharedView", structural: true },
      { source: "page2", target: "sharedView", structural: true },
    ];
    const dims = createDims(["page1", "page2", "sharedView"]);

    const positions = uxNavLayout(nodes, edges, dims, (n) =>
      n.id.includes("page"),
    );

    expect(positions.has("page1")).toBe(true);
    expect(positions.has("page2")).toBe(true);
    expect(positions.has("sharedView")).toBe(true);

    const page1Pos = positions.get("page1")!;
    const sharedViewPos = positions.get("sharedView")!;

    // Shared view should be positioned relative to first parent
    // (positioned at first parent encountered in edge order)
    expect(sharedViewPos.x).toBeGreaterThan(page1Pos.x);
    // View should align with first parent's y position
    expect(sharedViewPos.y).toBe(page1Pos.y);
  });

  test("handles complex multi-parent view scenario", () => {
    const nodes = [
      createNode("page1"),
      createNode("page1_child"),
      createNode("page2"),
      createNode("view1"),
      createNode("view2"),
      createNode("sharedView"),
    ];
    const edges: HierarchyEdge[] = [
      { source: "page1", target: "page1_child", structural: true },
      { source: "page1", target: "view1", structural: true },
      { source: "page1", target: "sharedView", structural: true },
      { source: "page1_child", target: "view2", structural: true },
      { source: "page2", target: "sharedView", structural: true },
    ];
    const dims = createDims(nodes.map((n) => n.id));

    const positions = uxNavLayout(nodes, edges, dims, (n) =>
      n.id.includes("page"),
    );

    // All nodes should be positioned
    for (const node of nodes) {
      expect(positions.has(node.id)).toBe(true);
    }

    const page1Pos = positions.get("page1")!;
    const sharedViewPos = positions.get("sharedView")!;

    // Shared view should be positioned in fan of first parent
    expect(sharedViewPos.x).toBeGreaterThan(page1Pos.x);
    expect(sharedViewPos.y).toBe(page1Pos.y);
  });

  test("handles second-parent fan with shared and unique views (no phantom gap)", () => {
    const nodes = [
      createNode("page1"),
      createNode("page2"),
      createNode("sharedView"),
      createNode("uniqueView"),
    ];
    const edges: HierarchyEdge[] = [
      { source: "page1", target: "sharedView", structural: true },
      { source: "page2", target: "sharedView", structural: true },
      { source: "page2", target: "uniqueView", structural: true },
    ];
    const dims = createDims(["page1", "page2", "sharedView", "uniqueView"]);

    const positions = uxNavLayout(nodes, edges, dims, (n) =>
      n.id.includes("page"),
    );

    expect(positions.has("page1")).toBe(true);
    expect(positions.has("page2")).toBe(true);
    expect(positions.has("sharedView")).toBe(true);
    expect(positions.has("uniqueView")).toBe(true);

    const page1Pos = positions.get("page1")!;
    const page2Pos = positions.get("page2")!;
    const sharedViewPos = positions.get("sharedView")!;
    const uniqueViewPos = positions.get("uniqueView")!;

    // Shared view should be positioned under page1 (first parent encountered)
    expect(sharedViewPos.y).toBe(page1Pos.y);
    expect(sharedViewPos.x).toBeGreaterThan(page1Pos.x);

    // Unique view should be positioned under page2 with no phantom gap
    // It should be flush right of page2, not offset by sharedView's width
    expect(uniqueViewPos.y).toBe(page2Pos.y);
    expect(uniqueViewPos.x).toBeGreaterThan(page2Pos.x);

    // The offset from page2 to uniqueView should be approximately viewFanGap (40px default)
    // not viewFanGap + sharedView.width
    const page2DefaultOptions = { viewFanGap: 40 };
    const expectedMinX = page2Pos.x + dims.get("page2")!.width / 2 + page2DefaultOptions.viewFanGap;
    const uniqueViewOffset = uniqueViewPos.x - (page2Pos.x + dims.get("page2")!.width / 2);

    // Should be close to viewFanGap, not including sharedView width in calculation
    expect(uniqueViewOffset).toBeGreaterThan(page2DefaultOptions.viewFanGap * 0.8);
    expect(uniqueViewOffset).toBeLessThan(page2DefaultOptions.viewFanGap * 1.2);
  });
});
