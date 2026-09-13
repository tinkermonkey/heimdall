import { test, expect } from '@playwright/test'
import { visibleNavigationEdgeIds } from '../src/utils/uxNavEdgeVisibility'
import { buildStructuralForest, type StructuralForest } from '../src/utils/graphHierarchy'
import type { GraphEdge } from '../src/components/GraphCanvas'

test.describe('visibleNavigationEdgeIds', () => {
  // Setup helper: create a simple structural forest
  const createForest = (edges: { source: string; target: string }[]): StructuralForest => {
    const hierarchyEdges = edges.map(e => ({ ...e, structural: true }))
    const nodeIds = new Set<string>()
    for (const edge of hierarchyEdges) {
      nodeIds.add(edge.source)
      nodeIds.add(edge.target)
    }
    return buildStructuralForest(Array.from(nodeIds), hierarchyEdges)
  }

  test('no hover: no navigation routes are visible', () => {
    const edges: GraphEdge[] = [
      { id: 'nav1', sourceId: 'page1', targetId: 'external1' },
      { id: 'nav2', sourceId: 'page2', targetId: 'external2' },
    ]
    const forest = createForest([])

    const visible = visibleNavigationEdgeIds(
      edges,
      undefined, // no hover
      () => true, // all are pages
      () => true, // all are navigation routes
      forest,
      new Set(),
    )

    expect(visible.size).toBe(0)
  })

  test('hovering a collapsed page: shows routes from page and child views', () => {
    const edges: GraphEdge[] = [
      { id: 'nav_page1', sourceId: 'page1', targetId: 'ext1' },
      { id: 'nav_view1', sourceId: 'view1', targetId: 'ext2' },
      { id: 'nav_subpage', sourceId: 'subpage1', targetId: 'ext3' },
    ]

    // page1 -> view1 (child view)
    // page1 -> subpage1 (child sub-page)
    const forest = createForest([
      { source: 'page1', target: 'view1' },
      { source: 'page1', target: 'subpage1' },
    ])

    const isPageNode = (nodeId: string) => nodeId.includes('page')

    const visible = visibleNavigationEdgeIds(
      edges,
      'page1', // hovering page1
      isPageNode,
      () => true, // all are navigation routes
      forest,
      new Set(['page1']), // page1 is collapsed
    )

    // Should include routes from page1 and view1, but not subpage1
    expect(visible.has('nav_page1')).toBe(true)
    expect(visible.has('nav_view1')).toBe(true)
    expect(visible.has('nav_subpage')).toBe(false)
  })

  test('hovering an expanded page: shows only page routes, not child view routes', () => {
    const edges: GraphEdge[] = [
      { id: 'nav_page1', sourceId: 'page1', targetId: 'ext1' },
      { id: 'nav_view1', sourceId: 'view1', targetId: 'ext2' },
    ]

    const forest = createForest([
      { source: 'page1', target: 'view1' },
    ])

    const isPageNode = (nodeId: string) => nodeId.includes('page')

    const visible = visibleNavigationEdgeIds(
      edges,
      'page1', // hovering page1
      isPageNode,
      () => true, // all are navigation routes
      forest,
      new Set(), // page1 is expanded (not collapsed)
    )

    // Should only include routes from page1, not view1
    expect(visible.has('nav_page1')).toBe(true)
    expect(visible.has('nav_view1')).toBe(false)
  })

  test('hovering a view: shows only that view routes', () => {
    const edges: GraphEdge[] = [
      { id: 'nav_page1', sourceId: 'page1', targetId: 'ext1' },
      { id: 'nav_view1', sourceId: 'view1', targetId: 'ext2' },
    ]

    const forest = createForest([
      { source: 'page1', target: 'view1' },
    ])

    const isPageNode = (nodeId: string) => nodeId.includes('page')

    const visible = visibleNavigationEdgeIds(
      edges,
      'view1', // hovering view1 (not a page)
      isPageNode,
      () => true, // all are navigation routes
      forest,
      new Set(),
    )

    // Should only include routes from view1
    expect(visible.has('nav_view1')).toBe(true)
    expect(visible.has('nav_page1')).toBe(false)
  })

  test('only edges matching isNavigationRoute predicate are considered', () => {
    const edges: GraphEdge[] = [
      { id: 'nav_route', sourceId: 'page1', targetId: 'ext1' },
      { id: 'structural_edge', sourceId: 'page1', targetId: 'page2' },
    ]

    const forest = createForest([
      { source: 'page1', target: 'page2' },
    ])

    const visible = visibleNavigationEdgeIds(
      edges,
      'page1',
      () => true,
      (edge) => edge.id === 'nav_route', // only nav_route is a navigation route
      forest,
      new Set(['page1']),
    )

    // Only nav_route should be visible (it's a navigation route)
    expect(visible.has('nav_route')).toBe(true)
    expect(visible.has('structural_edge')).toBe(false)
  })

  test('collapsed page with multiple views: includes all child views', () => {
    const edges: GraphEdge[] = [
      { id: 'nav_page', sourceId: 'page1', targetId: 'ext' },
      { id: 'nav_view1', sourceId: 'view1', targetId: 'ext' },
      { id: 'nav_view2', sourceId: 'view2', targetId: 'ext' },
    ]

    const forest = createForest([
      { source: 'page1', target: 'view1' },
      { source: 'page1', target: 'view2' },
    ])

    const isPageNode = (nodeId: string) => nodeId.includes('page')

    const visible = visibleNavigationEdgeIds(
      edges,
      'page1',
      isPageNode,
      () => true,
      forest,
      new Set(['page1']),
    )

    expect(visible.has('nav_page')).toBe(true)
    expect(visible.has('nav_view1')).toBe(true)
    expect(visible.has('nav_view2')).toBe(true)
  })
})
