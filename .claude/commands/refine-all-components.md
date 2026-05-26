# /refine-all-components

Run a full audit and auto-fix pass over every component in the Heimdall design system. Calls `/refine-component` for each of the 75 components in sequence.

**Usage:** `/refine-all-components`
**No arguments.**

---

## Your Task

Work through all 75 Heimdall components in the order listed below, running `/refine-component` for each one. Process them **sequentially** — complete each component's analysis and fixes before moving to the next.

**Note on co-located components:** Some components share a source file (e.g., StatusBadge is in Badge.tsx; ToolBlock and ThinkingBlock are in ChatMessage.tsx). `/refine-component` handles file resolution automatically — pass the component name as listed and it will find the correct file.

After all components are done, output the summary table described at the bottom.

---

## Canonical Component List (75 components)

Process in this exact order:

**Primitives (7)**
1. Icon
2. Button
3. Chip
4. Badge
5. StatusBadge
6. VersionPill
7. SegmentedControl

**Inputs (11)**
8. TextInput
9. TextArea
10. NumberInput
11. Select
12. TriState
13. Field
14. FilterDropdown
15. EntityPicker
16. KeyValueEditor
17. OrderedList
18. RelationshipBuilder

**Data Display (5)**
19. StatTile
20. StatGrid
21. Table
22. KVGrid
23. InspectorPanel

**Navigation (4)**
24. NavItem
25. Sidebar
26. Topbar
27. TabBar

**Shell (5)**
28. AppTitle
29. Titlebar
30. Statusbar
31. ShellLayout
32. Panel

**Overlays (6)**
33. Modal
34. ConfirmDialog
35. Toast
36. CommandPalette
37. WorkspaceSwitcherDialog
38. Drawer

**Layout (1)**
39. SplitPane

**Charts (12)**
40. Sparkline
41. LineChart
42. BarChart
43. BarV
44. BarH
45. StackedBar
46. Donut
47. PieChart
48. Heatmap
49. StatusTimeline
50. ProgressBar
51. MetricRow

**Page Patterns (10)**
52. PageHeader
53. FilterBar
54. ActivityTimeline
55. AlertStrip
56. QuickAccessGrid
57. QuickAccessTile
58. ConfigTile
59. PipelineCard
60. FormCallout
61. RowMenu

**Chat (7)**
62. ChatMessage
63. ToolBlock
64. ThinkingBlock
65. ChatDivider
66. ChatSuggestions
67. ChatComposer
68. ChatContainer

**Graph (7)**
69. GraphCanvas
70. GraphNode
71. GraphEdge
72. GraphInspector
73. TopologyNode
74. HierarchyRow
75. HierarchyTree

---

## Processing Instructions

For each component:
1. Invoke `/refine-component <ComponentName>`
2. Wait for it to complete (analysis + fixes applied)
3. Record the outcome: **✓ clean** (no Critical/High issues), **✅ fixed** (Critical/High issues were fixed), or **⚠ gaps** (only Medium/Low issues remain)
4. Note the top remaining issue (if any)
5. Move to the next component

Do not run components in parallel. Complete one before starting the next.

---

## Final Summary

After all components are processed, output:

```
## /refine-all-components — Full Audit Summary

| Component | Status | Top Remaining Issue |
|-----------|--------|---------------------|
| Icon | ✓ clean | — |
| Button | ✅ fixed | Medium: missing icon-only size variant |
| ... | ... | ... |

### Totals
- Clean (no issues): N
- Fixed (Critical/High resolved): N  
- Remaining gaps (Medium/Low only): N

### High-Impact Patterns Found
List any recurring issue types that appeared across multiple components.
These are candidates for a design system-wide improvement pass.
```
