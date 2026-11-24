# API

[← Back to README](../README.md)

REST APIs, operations, endpoints, and API integrations.

## Report Index

- [Layer Introduction](#layer-introduction)
- [Intra-Layer Relationships](#intra-layer-relationships)
- [Inter-Layer Dependencies](#inter-layer-dependencies)
- [Inter-Layer Relationships Table](#inter-layer-relationships-table)
- [Element Reference](#element-reference)

## Layer Introduction

| Metric                    | Count |
| ------------------------- | ----- |
| Elements                  | 19    |
| Intra-Layer Relationships | 18    |
| Inter-Layer Relationships | 111   |
| Inbound Relationships     | 59    |
| Outbound Relationships    | 52    |

**Cross-Layer References**:

- **Upstream layers**: [Testing](./13-testing-layer-report.md)
- **Downstream layers**: [Application](./05-application-layer-report.md), [Motivation](./01-motivation-layer-report.md), [Product](./03-product-layer-report.md)

## Intra-Layer Relationships

```mermaid
flowchart LR
  subgraph api
    api_operation_build_structural_forest["buildStructuralForest"]
    api_operation_clustered_force_layout["clusteredForceLayout"]
    api_operation_force_layout["forceLayout"]
    api_operation_galaxy_layout["galaxyLayout"]
    api_operation_graph_canvas["GraphCanvas"]
    api_operation_graph_collapse_control["GraphCollapseControl"]
    api_operation_graph_edge["GraphEdge"]
    api_operation_graph_edge_inspector["GraphEdgeInspector"]
    api_operation_graph_edge_shape["GraphEdgeShape"]
    api_operation_graph_inspector["GraphInspector"]
    api_operation_graph_node["GraphNode"]
    api_operation_graph_toolbar["GraphToolbar"]
    api_operation_louvain_cluster["louvainCluster"]
    api_operation_pack_clusters["packClusters"]
    api_operation_radial_tree_layout["radialTreeLayout"]
    api_operation_use_pan_zoom["usePanZoom"]
    api_operation_ux_nav_layout["uxNavLayout"]
    api_operation_visible_navigation_edge_ids["visibleNavigationEdgeIds"]
    api_tag_graph["graph"]
    api_operation_build_structural_forest -->|references| api_tag_graph
    api_operation_clustered_force_layout -->|references| api_tag_graph
    api_operation_force_layout -->|references| api_tag_graph
    api_operation_galaxy_layout -->|references| api_tag_graph
    api_operation_graph_canvas -->|references| api_tag_graph
    api_operation_graph_collapse_control -->|references| api_tag_graph
    api_operation_graph_edge_inspector -->|references| api_tag_graph
    api_operation_graph_edge -->|references| api_tag_graph
    api_operation_graph_edge_shape -->|references| api_tag_graph
    api_operation_graph_inspector -->|references| api_tag_graph
    api_operation_graph_node -->|references| api_tag_graph
    api_operation_graph_toolbar -->|references| api_tag_graph
    api_operation_louvain_cluster -->|references| api_tag_graph
    api_operation_pack_clusters -->|references| api_tag_graph
    api_operation_radial_tree_layout -->|references| api_tag_graph
    api_operation_use_pan_zoom -->|references| api_tag_graph
    api_operation_ux_nav_layout -->|references| api_tag_graph
    api_operation_visible_navigation_edge_ids -->|references| api_tag_graph
  end
```

## Inter-Layer Dependencies

```mermaid
flowchart TB
  classDef current fill:#f9f,stroke:#333,stroke-width:2px
  motivation["Motivation"]
  business["Business"]
  product["Product"]
  security["Security"]
  application["Application"]
  technology["Technology"]
  api["API"]
  data_model["Data Model"]
  data_store["Data Store"]
  ux["UX"]
  navigation["Navigation"]
  apm["APM"]
  testing["Testing"]
  api --> application
  api --> motivation
  api --> product
  testing --> api
  class api current
```

## Inter-Layer Relationships Table

| Relationship ID                                           | Source Node                                                          | Dest Node                                                                                   | Dest Layer    | Predicate    | Cardinality  | Strength |
| --------------------------------------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | ------------- | ------------ | ------------ | -------- |
| `api.operation.realizes.application.applicationfunction`  | `api.operation.build-structural-forest`                              | `application.applicationfunction.structural-forest-construction`                            | `application` | `realizes`   | many-to-many | medium   |
| `api.operation.references.application.applicationservice` | `api.operation.build-structural-forest`                              | `application.applicationservice.graph-layout-engine-service`                                | `application` | `references` | many-to-many | medium   |
| `api.operation.realizes.application.applicationfunction`  | `api.operation.clustered-force-layout`                               | `application.applicationfunction.clustered-force-layout-algorithm`                          | `application` | `realizes`   | many-to-many | medium   |
| `api.operation.references.application.applicationservice` | `api.operation.clustered-force-layout`                               | `application.applicationservice.graph-layout-engine-service`                                | `application` | `references` | many-to-many | medium   |
| `api.operation.realizes.application.applicationfunction`  | `api.operation.force-layout`                                         | `application.applicationfunction.force-directed-layout-algorithm`                           | `application` | `realizes`   | many-to-many | medium   |
| `api.operation.references.application.applicationservice` | `api.operation.force-layout`                                         | `application.applicationservice.graph-layout-engine-service`                                | `application` | `references` | many-to-many | medium   |
| `api.operation.realizes.application.applicationfunction`  | `api.operation.galaxy-layout`                                        | `application.applicationfunction.galaxy-radial-orbit-layout-algorithm`                      | `application` | `realizes`   | many-to-many | medium   |
| `api.operation.references.application.applicationservice` | `api.operation.galaxy-layout`                                        | `application.applicationservice.graph-layout-engine-service`                                | `application` | `references` | many-to-many | medium   |
| `api.operation.exposes.product.feature`                   | `api.operation.graph-canvas`                                         | `product.feature.edge-selection-and-inspection`                                             | `product`     | `exposes`    | many-to-many | medium   |
| `api.operation.exposes.product.feature`                   | `api.operation.graph-canvas`                                         | `product.feature.layout-progress-indicator`                                                 | `product`     | `exposes`    | many-to-many | medium   |
| `api.operation.exposes.product.feature`                   | `api.operation.graph-canvas`                                         | `product.feature.live-draggable-galaxy-simulation`                                          | `product`     | `exposes`    | many-to-many | medium   |
| `api.operation.exposes.product.feature`                   | `api.operation.graph-canvas`                                         | `product.feature.node-and-edge-tooltips-and-popovers`                                       | `product`     | `exposes`    | many-to-many | medium   |
| `api.operation.exposes.product.feature`                   | `api.operation.graph-canvas`                                         | `product.feature.progressive-disclosure-via-node-collapseexpand`                            | `product`     | `exposes`    | many-to-many | medium   |
| `api.operation.exposes.product.feature`                   | `api.operation.graph-canvas`                                         | `product.feature.viewport-history-and-restore`                                              | `product`     | `exposes`    | many-to-many | medium   |
| `api.operation.references.application.applicationservice` | `api.operation.graph-canvas`                                         | `application.applicationservice.graph-layout-engine-service`                                | `application` | `references` | many-to-many | medium   |
| `api.operation.references.application.applicationservice` | `api.operation.graph-canvas`                                         | `application.applicationservice.interactive-graph-rendering`                                | `application` | `references` | many-to-many | medium   |
| `api.operation.references.application.applicationservice` | `api.operation.graph-canvas`                                         | `application.applicationservice.live-galaxy-simulation-service`                             | `application` | `references` | many-to-many | medium   |
| `api.operation.satisfies.motivation.requirement`          | `api.operation.graph-canvas`                                         | `motivation.requirement.graph-nodes-and-edges-have-accessible-names`                        | `motivation`  | `satisfies`  | many-to-many | medium   |
| `api.operation.satisfies.motivation.requirement`          | `api.operation.graph-canvas`                                         | `motivation.requirement.large-layouts-do-not-block-the-first-paint`                         | `motivation`  | `satisfies`  | many-to-many | medium   |
| `api.operation.satisfies.motivation.requirement`          | `api.operation.graph-canvas`                                         | `motivation.requirement.layout-engines-must-be-pluggable-without-breaking-existing-callers` | `motivation`  | `satisfies`  | many-to-many | medium   |
| `api.operation.triggers.application.applicationevent`     | `api.operation.graph-canvas`                                         | `application.applicationevent.background-click-event`                                       | `application` | `triggers`   | many-to-many | medium   |
| `api.operation.triggers.application.applicationevent`     | `api.operation.graph-canvas`                                         | `application.applicationevent.collapse-toggle-event`                                        | `application` | `triggers`   | many-to-many | medium   |
| `api.operation.triggers.application.applicationevent`     | `api.operation.graph-canvas`                                         | `application.applicationevent.edge-hover-change-event`                                      | `application` | `triggers`   | many-to-many | medium   |
| `api.operation.triggers.application.applicationevent`     | `api.operation.graph-canvas`                                         | `application.applicationevent.edge-select-event`                                            | `application` | `triggers`   | many-to-many | medium   |
| `api.operation.triggers.application.applicationevent`     | `api.operation.graph-canvas`                                         | `application.applicationevent.layout-state-change-event`                                    | `application` | `triggers`   | many-to-many | medium   |
| `api.operation.triggers.application.applicationevent`     | `api.operation.graph-canvas`                                         | `application.applicationevent.node-drag-end-event`                                          | `application` | `triggers`   | many-to-many | medium   |
| `api.operation.triggers.application.applicationevent`     | `api.operation.graph-canvas`                                         | `application.applicationevent.node-hover-change-event`                                      | `application` | `triggers`   | many-to-many | medium   |
| `api.operation.triggers.application.applicationevent`     | `api.operation.graph-canvas`                                         | `application.applicationevent.viewport-dwell-event`                                         | `application` | `triggers`   | many-to-many | medium   |
| `api.operation.triggers.application.applicationevent`     | `api.operation.graph-canvas`                                         | `application.applicationevent.viewport-navigate-event`                                      | `application` | `triggers`   | many-to-many | medium   |
| `api.operation.exposes.product.feature`                   | `api.operation.graph-collapse-control`                               | `product.feature.progressive-disclosure-via-node-collapseexpand`                            | `product`     | `exposes`    | many-to-many | medium   |
| `api.operation.references.application.applicationservice` | `api.operation.graph-collapse-control`                               | `application.applicationservice.interactive-graph-rendering`                                | `application` | `references` | many-to-many | medium   |
| `api.operation.exposes.product.feature`                   | `api.operation.graph-edge-inspector`                                 | `product.feature.edge-selection-and-inspection`                                             | `product`     | `exposes`    | many-to-many | medium   |
| `api.operation.references.application.applicationservice` | `api.operation.graph-edge-inspector`                                 | `application.applicationservice.interactive-graph-rendering`                                | `application` | `references` | many-to-many | medium   |
| `api.operation.references.application.applicationservice` | `api.operation.graph-edge`                                           | `application.applicationservice.interactive-graph-rendering`                                | `application` | `references` | many-to-many | medium   |
| `api.operation.references.application.applicationservice` | `api.operation.graph-edge-shape`                                     | `application.applicationservice.interactive-graph-rendering`                                | `application` | `references` | many-to-many | medium   |
| `api.operation.references.application.applicationservice` | `api.operation.graph-inspector`                                      | `application.applicationservice.interactive-graph-rendering`                                | `application` | `references` | many-to-many | medium   |
| `api.operation.references.application.applicationservice` | `api.operation.graph-node`                                           | `application.applicationservice.interactive-graph-rendering`                                | `application` | `references` | many-to-many | medium   |
| `api.operation.satisfies.motivation.requirement`          | `api.operation.graph-node`                                           | `motivation.requirement.graph-nodes-and-edges-have-accessible-names`                        | `motivation`  | `satisfies`  | many-to-many | medium   |
| `api.operation.exposes.product.feature`                   | `api.operation.graph-toolbar`                                        | `product.feature.fullscreen-canvas`                                                         | `product`     | `exposes`    | many-to-many | medium   |
| `api.operation.exposes.product.feature`                   | `api.operation.graph-toolbar`                                        | `product.feature.live-draggable-galaxy-simulation`                                          | `product`     | `exposes`    | many-to-many | medium   |
| `api.operation.references.application.applicationservice` | `api.operation.graph-toolbar`                                        | `application.applicationservice.interactive-graph-rendering`                                | `application` | `references` | many-to-many | medium   |
| `api.operation.realizes.application.applicationfunction`  | `api.operation.louvain-cluster`                                      | `application.applicationfunction.louvain-community-clustering`                              | `application` | `realizes`   | many-to-many | medium   |
| `api.operation.references.application.applicationservice` | `api.operation.louvain-cluster`                                      | `application.applicationservice.graph-layout-engine-service`                                | `application` | `references` | many-to-many | medium   |
| `api.operation.realizes.application.applicationfunction`  | `api.operation.pack-clusters`                                        | `application.applicationfunction.cluster-circle-packing`                                    | `application` | `realizes`   | many-to-many | medium   |
| `api.operation.references.application.applicationservice` | `api.operation.pack-clusters`                                        | `application.applicationservice.graph-layout-engine-service`                                | `application` | `references` | many-to-many | medium   |
| `api.operation.realizes.application.applicationfunction`  | `api.operation.radial-tree-layout`                                   | `application.applicationfunction.radial-tree-layout-algorithm`                              | `application` | `realizes`   | many-to-many | medium   |
| `api.operation.references.application.applicationservice` | `api.operation.radial-tree-layout`                                   | `application.applicationservice.graph-layout-engine-service`                                | `application` | `references` | many-to-many | medium   |
| `api.operation.references.application.applicationservice` | `api.operation.use-pan-zoom`                                         | `application.applicationservice.interactive-graph-rendering`                                | `application` | `references` | many-to-many | medium   |
| `api.operation.realizes.application.applicationfunction`  | `api.operation.ux-nav-layout`                                        | `application.applicationfunction.ux-navigation-tree-layout-algorithm`                       | `application` | `realizes`   | many-to-many | medium   |
| `api.operation.references.application.applicationservice` | `api.operation.ux-nav-layout`                                        | `application.applicationservice.graph-layout-engine-service`                                | `application` | `references` | many-to-many | medium   |
| `api.operation.realizes.application.applicationfunction`  | `api.operation.visible-navigation-edge-ids`                          | `application.applicationfunction.ux-navigation-tree-layout-algorithm`                       | `application` | `realizes`   | many-to-many | medium   |
| `api.operation.references.application.applicationservice` | `api.operation.visible-navigation-edge-ids`                          | `application.applicationservice.interactive-graph-rendering`                                | `application` | `references` | many-to-many | medium   |
| `testing.testcoveragetarget.covers.api.operation`         | `testing.testcoveragetarget.center-on-select-tests`                  | `api.operation.graph-canvas`                                                                | `api`         | `covers`     | many-to-many | medium   |
| `testing.testcoveragetarget.covers.api.operation`         | `testing.testcoveragetarget.center-on-select-tests`                  | `api.operation.graph-node`                                                                  | `api`         | `covers`     | many-to-many | medium   |
| `testing.testcoveragetarget.covers.api.operation`         | `testing.testcoveragetarget.channel-router-tests`                    | `api.operation.graph-canvas`                                                                | `api`         | `covers`     | many-to-many | medium   |
| `testing.testcoveragetarget.covers.api.operation`         | `testing.testcoveragetarget.force-force-clustered-layout-algorithms` | `api.operation.force-layout`                                                                | `api`         | `covers`     | many-to-many | medium   |
| `testing.testcoveragetarget.covers.api.operation`         | `testing.testcoveragetarget.force-force-clustered-layout-algorithms` | `api.operation.graph-canvas`                                                                | `api`         | `covers`     | many-to-many | medium   |
| `testing.testcoveragetarget.covers.api.operation`         | `testing.testcoveragetarget.force-force-clustered-layout-algorithms` | `api.operation.graph-node`                                                                  | `api`         | `covers`     | many-to-many | medium   |
| `testing.testcoveragetarget.covers.api.operation`         | `testing.testcoveragetarget.fullscreen-container-ref-tests`          | `api.operation.graph-canvas`                                                                | `api`         | `covers`     | many-to-many | medium   |
| `testing.testcoveragetarget.covers.api.operation`         | `testing.testcoveragetarget.galaxy-layout-and-live-simulation`       | `api.operation.galaxy-layout`                                                               | `api`         | `covers`     | many-to-many | medium   |
| `testing.testcoveragetarget.covers.api.operation`         | `testing.testcoveragetarget.galaxy-layout-browser-tests`             | `api.operation.build-structural-forest`                                                     | `api`         | `covers`     | many-to-many | medium   |
| `testing.testcoveragetarget.covers.api.operation`         | `testing.testcoveragetarget.galaxy-layout-browser-tests`             | `api.operation.galaxy-layout`                                                               | `api`         | `covers`     | many-to-many | medium   |
| `testing.testcoveragetarget.covers.api.operation`         | `testing.testcoveragetarget.galaxy-layout-browser-tests`             | `api.operation.graph-canvas`                                                                | `api`         | `covers`     | many-to-many | medium   |
| `testing.testcoveragetarget.covers.api.operation`         | `testing.testcoveragetarget.galaxy-layout-collapse-tests`            | `api.operation.graph-collapse-control`                                                      | `api`         | `covers`     | many-to-many | medium   |
| `testing.testcoveragetarget.covers.api.operation`         | `testing.testcoveragetarget.galaxy-layout-collapse-tests`            | `api.operation.graph-node`                                                                  | `api`         | `covers`     | many-to-many | medium   |
| `testing.testcoveragetarget.covers.api.operation`         | `testing.testcoveragetarget.galaxy-layout-tests`                     | `api.operation.galaxy-layout`                                                               | `api`         | `covers`     | many-to-many | medium   |
| `testing.testcoveragetarget.covers.api.operation`         | `testing.testcoveragetarget.galaxy-live-drag-tests`                  | `api.operation.galaxy-layout`                                                               | `api`         | `covers`     | many-to-many | medium   |
| `testing.testcoveragetarget.covers.api.operation`         | `testing.testcoveragetarget.galaxy-live-drag-tests`                  | `api.operation.graph-canvas`                                                                | `api`         | `covers`     | many-to-many | medium   |
| `testing.testcoveragetarget.covers.api.operation`         | `testing.testcoveragetarget.graph-a11y-names-tests`                  | `api.operation.graph-canvas`                                                                | `api`         | `covers`     | many-to-many | medium   |
| `testing.testcoveragetarget.covers.api.operation`         | `testing.testcoveragetarget.graph-a11y-names-tests`                  | `api.operation.graph-edge-shape`                                                            | `api`         | `covers`     | many-to-many | medium   |
| `testing.testcoveragetarget.covers.api.operation`         | `testing.testcoveragetarget.graph-canvas-click-tooltip-tests`        | `api.operation.graph-canvas`                                                                | `api`         | `covers`     | many-to-many | medium   |
| `testing.testcoveragetarget.covers.api.operation`         | `testing.testcoveragetarget.graph-canvas-popover-tests`              | `api.operation.graph-canvas`                                                                | `api`         | `covers`     | many-to-many | medium   |
| `testing.testcoveragetarget.covers.api.operation`         | `testing.testcoveragetarget.graph-canvas-rendering-and-interaction`  | `api.operation.clustered-force-layout`                                                      | `api`         | `covers`     | many-to-many | medium   |
| `testing.testcoveragetarget.covers.api.operation`         | `testing.testcoveragetarget.graph-canvas-rendering-and-interaction`  | `api.operation.force-layout`                                                                | `api`         | `covers`     | many-to-many | medium   |
| `testing.testcoveragetarget.covers.api.operation`         | `testing.testcoveragetarget.graph-canvas-rendering-and-interaction`  | `api.operation.galaxy-layout`                                                               | `api`         | `covers`     | many-to-many | medium   |
| `testing.testcoveragetarget.covers.api.operation`         | `testing.testcoveragetarget.graph-canvas-rendering-and-interaction`  | `api.operation.graph-canvas`                                                                | `api`         | `covers`     | many-to-many | medium   |
| `testing.testcoveragetarget.covers.api.operation`         | `testing.testcoveragetarget.graph-canvas-rendering-and-interaction`  | `api.operation.graph-edge`                                                                  | `api`         | `covers`     | many-to-many | medium   |
| `testing.testcoveragetarget.covers.api.operation`         | `testing.testcoveragetarget.graph-canvas-rendering-and-interaction`  | `api.operation.graph-inspector`                                                             | `api`         | `covers`     | many-to-many | medium   |
| `testing.testcoveragetarget.covers.api.operation`         | `testing.testcoveragetarget.graph-canvas-rendering-and-interaction`  | `api.operation.graph-node`                                                                  | `api`         | `covers`     | many-to-many | medium   |
| `testing.testcoveragetarget.covers.api.operation`         | `testing.testcoveragetarget.graph-canvas-rendering-and-interaction`  | `api.operation.graph-toolbar`                                                               | `api`         | `covers`     | many-to-many | medium   |
| `testing.testcoveragetarget.covers.api.operation`         | `testing.testcoveragetarget.graph-edge-label-tests`                  | `api.operation.force-layout`                                                                | `api`         | `covers`     | many-to-many | medium   |
| `testing.testcoveragetarget.covers.api.operation`         | `testing.testcoveragetarget.graph-edge-label-tests`                  | `api.operation.graph-node`                                                                  | `api`         | `covers`     | many-to-many | medium   |
| `testing.testcoveragetarget.covers.api.operation`         | `testing.testcoveragetarget.graph-fit-boundaries-tests`              | `api.operation.graph-canvas`                                                                | `api`         | `covers`     | many-to-many | medium   |
| `testing.testcoveragetarget.covers.api.operation`         | `testing.testcoveragetarget.graph-layout-busy-tests`                 | `api.operation.graph-canvas`                                                                | `api`         | `covers`     | many-to-many | medium   |
| `testing.testcoveragetarget.covers.api.operation`         | `testing.testcoveragetarget.graph-node-measure-tests`                | `api.operation.graph-canvas`                                                                | `api`         | `covers`     | many-to-many | medium   |
| `testing.testcoveragetarget.covers.api.operation`         | `testing.testcoveragetarget.graph-tooltip-placement-tests`           | `api.operation.graph-canvas`                                                                | `api`         | `covers`     | many-to-many | medium   |
| `testing.testcoveragetarget.covers.api.operation`         | `testing.testcoveragetarget.graph-viewport-history-tests`            | `api.operation.graph-canvas`                                                                | `api`         | `covers`     | many-to-many | medium   |
| `testing.testcoveragetarget.covers.api.operation`         | `testing.testcoveragetarget.layer-lanes-tests`                       | `api.operation.graph-canvas`                                                                | `api`         | `covers`     | many-to-many | medium   |
| `testing.testcoveragetarget.covers.api.operation`         | `testing.testcoveragetarget.layered-async-layout-tests`              | `api.operation.graph-canvas`                                                                | `api`         | `covers`     | many-to-many | medium   |
| `testing.testcoveragetarget.covers.api.operation`         | `testing.testcoveragetarget.layered-matrix-tests`                    | `api.operation.graph-edge-inspector`                                                        | `api`         | `covers`     | many-to-many | medium   |
| `testing.testcoveragetarget.covers.api.operation`         | `testing.testcoveragetarget.layered-tests`                           | `api.operation.graph-canvas`                                                                | `api`         | `covers`     | many-to-many | medium   |
| `testing.testcoveragetarget.covers.api.operation`         | `testing.testcoveragetarget.layered-tests`                           | `api.operation.graph-edge`                                                                  | `api`         | `covers`     | many-to-many | medium   |
| `testing.testcoveragetarget.covers.api.operation`         | `testing.testcoveragetarget.map-canvas-tests`                        | `api.operation.use-pan-zoom`                                                                | `api`         | `covers`     | many-to-many | medium   |
| `testing.testcoveragetarget.covers.api.operation`         | `testing.testcoveragetarget.organic-layout-browser-tests`            | `api.operation.graph-canvas`                                                                | `api`         | `covers`     | many-to-many | medium   |
| `testing.testcoveragetarget.covers.api.operation`         | `testing.testcoveragetarget.organic-layout-tests`                    | `api.operation.graph-canvas`                                                                | `api`         | `covers`     | many-to-many | medium   |
| `testing.testcoveragetarget.covers.api.operation`         | `testing.testcoveragetarget.orthogonal-layout-browser-tests`         | `api.operation.graph-canvas`                                                                | `api`         | `covers`     | many-to-many | medium   |
| `testing.testcoveragetarget.covers.api.operation`         | `testing.testcoveragetarget.orthogonal-layout-tests`                 | `api.operation.graph-canvas`                                                                | `api`         | `covers`     | many-to-many | medium   |
| `testing.testcoveragetarget.covers.api.operation`         | `testing.testcoveragetarget.pan-inertia-tests`                       | `api.operation.use-pan-zoom`                                                                | `api`         | `covers`     | many-to-many | medium   |
| `testing.testcoveragetarget.covers.api.operation`         | `testing.testcoveragetarget.pan-zoom-tests`                          | `api.operation.graph-canvas`                                                                | `api`         | `covers`     | many-to-many | medium   |
| `testing.testcoveragetarget.covers.api.operation`         | `testing.testcoveragetarget.pan-zoom-tests`                          | `api.operation.use-pan-zoom`                                                                | `api`         | `covers`     | many-to-many | medium   |
| `testing.testcoveragetarget.covers.api.operation`         | `testing.testcoveragetarget.radial-tree-layout-algorithm`            | `api.operation.build-structural-forest`                                                     | `api`         | `covers`     | many-to-many | medium   |
| `testing.testcoveragetarget.covers.api.operation`         | `testing.testcoveragetarget.radial-tree-layout-algorithm`            | `api.operation.graph-canvas`                                                                | `api`         | `covers`     | many-to-many | medium   |
| `testing.testcoveragetarget.covers.api.operation`         | `testing.testcoveragetarget.radial-tree-layout-algorithm`            | `api.operation.radial-tree-layout`                                                          | `api`         | `covers`     | many-to-many | medium   |
| `testing.testcoveragetarget.covers.api.operation`         | `testing.testcoveragetarget.reach-inspector-tests`                   | `api.operation.graph-canvas`                                                                | `api`         | `covers`     | many-to-many | medium   |
| `testing.testcoveragetarget.covers.api.operation`         | `testing.testcoveragetarget.reach-inspector-tests`                   | `api.operation.graph-edge`                                                                  | `api`         | `covers`     | many-to-many | medium   |
| `testing.testcoveragetarget.covers.api.operation`         | `testing.testcoveragetarget.ux-nav-edge-visibility-tests`            | `api.operation.build-structural-forest`                                                     | `api`         | `covers`     | many-to-many | medium   |
| `testing.testcoveragetarget.covers.api.operation`         | `testing.testcoveragetarget.ux-nav-edge-visibility-tests`            | `api.operation.graph-canvas`                                                                | `api`         | `covers`     | many-to-many | medium   |
| `testing.testcoveragetarget.covers.api.operation`         | `testing.testcoveragetarget.ux-nav-edge-visibility-tests`            | `api.operation.graph-edge`                                                                  | `api`         | `covers`     | many-to-many | medium   |
| `testing.testcoveragetarget.covers.api.operation`         | `testing.testcoveragetarget.ux-nav-edge-visibility-tests`            | `api.operation.visible-navigation-edge-ids`                                                 | `api`         | `covers`     | many-to-many | medium   |
| `testing.testcoveragetarget.covers.api.operation`         | `testing.testcoveragetarget.ux-nav-layout-tests`                     | `api.operation.graph-canvas`                                                                | `api`         | `covers`     | many-to-many | medium   |
| `testing.testcoveragetarget.covers.api.operation`         | `testing.testcoveragetarget.ux-nav-layout-tests`                     | `api.operation.ux-nav-layout`                                                               | `api`         | `covers`     | many-to-many | medium   |

## Element Reference

### buildStructuralForest {#buildstructuralforest}

**ID**: `api.operation.build-structural-forest`

**Type**: `operation`

Exported function deriving a parent/child forest from structural edges.

#### Attributes

| Name        | Value                                             |
| ----------- | ------------------------------------------------- |
| operationId | buildStructuralForest                             |
| summary     | Build a structural parent/child forest from edges |
| tags        | graph                                             |

#### Relationships

| Type        | Related Element                                                  | Predicate    | Direction |
| ----------- | ---------------------------------------------------------------- | ------------ | --------- |
| inter-layer | `application.applicationfunction.structural-forest-construction` | `realizes`   | outbound  |
| inter-layer | `application.applicationservice.graph-layout-engine-service`     | `references` | outbound  |
| inter-layer | `testing.testcoveragetarget.galaxy-layout-browser-tests`         | `covers`     | inbound   |
| inter-layer | `testing.testcoveragetarget.radial-tree-layout-algorithm`        | `covers`     | inbound   |
| inter-layer | `testing.testcoveragetarget.ux-nav-edge-visibility-tests`        | `covers`     | inbound   |
| intra-layer | `api.tag.graph`                                                  | `references` | outbound  |

### clusteredForceLayout {#clusteredforcelayout}

**ID**: `api.operation.clustered-force-layout`

**Type**: `operation`

Exported function running the Louvain-clustered nested-bubble force layout.

#### Attributes

| Name        | Value                                      |
| ----------- | ------------------------------------------ |
| operationId | clusteredForceLayout                       |
| summary     | Compute a community-clustered force layout |
| tags        | graph                                      |

#### Relationships

| Type        | Related Element                                                     | Predicate    | Direction |
| ----------- | ------------------------------------------------------------------- | ------------ | --------- |
| inter-layer | `application.applicationfunction.clustered-force-layout-algorithm`  | `realizes`   | outbound  |
| inter-layer | `application.applicationservice.graph-layout-engine-service`        | `references` | outbound  |
| inter-layer | `testing.testcoveragetarget.graph-canvas-rendering-and-interaction` | `covers`     | inbound   |
| intra-layer | `api.tag.graph`                                                     | `references` | outbound  |

### forceLayout {#forcelayout}

**ID**: `api.operation.force-layout`

**Type**: `operation`

Exported function running the spring/repulsion force-directed layout algorithm.

#### Attributes

| Name        | Value                                               |
| ----------- | --------------------------------------------------- |
| operationId | forceLayout                                         |
| summary     | Compute a force-directed layout for a node/edge set |
| tags        | graph                                               |

#### Relationships

| Type        | Related Element                                                      | Predicate    | Direction |
| ----------- | -------------------------------------------------------------------- | ------------ | --------- |
| inter-layer | `application.applicationfunction.force-directed-layout-algorithm`    | `realizes`   | outbound  |
| inter-layer | `application.applicationservice.graph-layout-engine-service`         | `references` | outbound  |
| inter-layer | `testing.testcoveragetarget.force-force-clustered-layout-algorithms` | `covers`     | inbound   |
| inter-layer | `testing.testcoveragetarget.graph-canvas-rendering-and-interaction`  | `covers`     | inbound   |
| inter-layer | `testing.testcoveragetarget.graph-edge-label-tests`                  | `covers`     | inbound   |
| intra-layer | `api.tag.graph`                                                      | `references` | outbound  |

### galaxyLayout {#galaxylayout}

**ID**: `api.operation.galaxy-layout`

**Type**: `operation`

Exported function running the radial-orbit galaxy layout algorithm.

#### Attributes

| Name        | Value                                    |
| ----------- | ---------------------------------------- |
| operationId | galaxyLayout                             |
| summary     | Compute a radial-hierarchy galaxy layout |
| tags        | graph                                    |

#### Relationships

| Type        | Related Element                                                        | Predicate    | Direction |
| ----------- | ---------------------------------------------------------------------- | ------------ | --------- |
| inter-layer | `application.applicationfunction.galaxy-radial-orbit-layout-algorithm` | `realizes`   | outbound  |
| inter-layer | `application.applicationservice.graph-layout-engine-service`           | `references` | outbound  |
| inter-layer | `testing.testcoveragetarget.galaxy-layout-and-live-simulation`         | `covers`     | inbound   |
| inter-layer | `testing.testcoveragetarget.galaxy-layout-browser-tests`               | `covers`     | inbound   |
| inter-layer | `testing.testcoveragetarget.galaxy-layout-tests`                       | `covers`     | inbound   |
| inter-layer | `testing.testcoveragetarget.galaxy-live-drag-tests`                    | `covers`     | inbound   |
| inter-layer | `testing.testcoveragetarget.graph-canvas-rendering-and-interaction`    | `covers`     | inbound   |
| intra-layer | `api.tag.graph`                                                        | `references` | outbound  |

### GraphCanvas {#graphcanvas}

**ID**: `api.operation.graph-canvas`

**Type**: `operation`

Exported React component — the public entry point for rendering an interactive graph.

#### Attributes

| Name        | Value                                                                    |
| ----------- | ------------------------------------------------------------------------ |
| operationId | GraphCanvas                                                              |
| summary     | Render an interactive, pan/zoomable graph with a pluggable layout engine |
| tags        | graph                                                                    |

#### Relationships

| Type        | Related Element                                                                             | Predicate    | Direction |
| ----------- | ------------------------------------------------------------------------------------------- | ------------ | --------- |
| inter-layer | `product.feature.edge-selection-and-inspection`                                             | `exposes`    | outbound  |
| inter-layer | `product.feature.layout-progress-indicator`                                                 | `exposes`    | outbound  |
| inter-layer | `product.feature.live-draggable-galaxy-simulation`                                          | `exposes`    | outbound  |
| inter-layer | `product.feature.node-and-edge-tooltips-and-popovers`                                       | `exposes`    | outbound  |
| inter-layer | `product.feature.progressive-disclosure-via-node-collapseexpand`                            | `exposes`    | outbound  |
| inter-layer | `product.feature.viewport-history-and-restore`                                              | `exposes`    | outbound  |
| inter-layer | `application.applicationservice.graph-layout-engine-service`                                | `references` | outbound  |
| inter-layer | `application.applicationservice.interactive-graph-rendering`                                | `references` | outbound  |
| inter-layer | `application.applicationservice.live-galaxy-simulation-service`                             | `references` | outbound  |
| inter-layer | `motivation.requirement.graph-nodes-and-edges-have-accessible-names`                        | `satisfies`  | outbound  |
| inter-layer | `motivation.requirement.large-layouts-do-not-block-the-first-paint`                         | `satisfies`  | outbound  |
| inter-layer | `motivation.requirement.layout-engines-must-be-pluggable-without-breaking-existing-callers` | `satisfies`  | outbound  |
| inter-layer | `application.applicationevent.background-click-event`                                       | `triggers`   | outbound  |
| inter-layer | `application.applicationevent.collapse-toggle-event`                                        | `triggers`   | outbound  |
| inter-layer | `application.applicationevent.edge-hover-change-event`                                      | `triggers`   | outbound  |
| inter-layer | `application.applicationevent.edge-select-event`                                            | `triggers`   | outbound  |
| inter-layer | `application.applicationevent.layout-state-change-event`                                    | `triggers`   | outbound  |
| inter-layer | `application.applicationevent.node-drag-end-event`                                          | `triggers`   | outbound  |
| inter-layer | `application.applicationevent.node-hover-change-event`                                      | `triggers`   | outbound  |
| inter-layer | `application.applicationevent.viewport-dwell-event`                                         | `triggers`   | outbound  |
| inter-layer | `application.applicationevent.viewport-navigate-event`                                      | `triggers`   | outbound  |
| inter-layer | `testing.testcoveragetarget.center-on-select-tests`                                         | `covers`     | inbound   |
| inter-layer | `testing.testcoveragetarget.channel-router-tests`                                           | `covers`     | inbound   |
| inter-layer | `testing.testcoveragetarget.force-force-clustered-layout-algorithms`                        | `covers`     | inbound   |
| inter-layer | `testing.testcoveragetarget.fullscreen-container-ref-tests`                                 | `covers`     | inbound   |
| inter-layer | `testing.testcoveragetarget.galaxy-layout-browser-tests`                                    | `covers`     | inbound   |
| inter-layer | `testing.testcoveragetarget.galaxy-live-drag-tests`                                         | `covers`     | inbound   |
| inter-layer | `testing.testcoveragetarget.graph-a11y-names-tests`                                         | `covers`     | inbound   |
| inter-layer | `testing.testcoveragetarget.graph-canvas-click-tooltip-tests`                               | `covers`     | inbound   |
| inter-layer | `testing.testcoveragetarget.graph-canvas-popover-tests`                                     | `covers`     | inbound   |
| inter-layer | `testing.testcoveragetarget.graph-canvas-rendering-and-interaction`                         | `covers`     | inbound   |
| inter-layer | `testing.testcoveragetarget.graph-fit-boundaries-tests`                                     | `covers`     | inbound   |
| inter-layer | `testing.testcoveragetarget.graph-layout-busy-tests`                                        | `covers`     | inbound   |
| inter-layer | `testing.testcoveragetarget.graph-node-measure-tests`                                       | `covers`     | inbound   |
| inter-layer | `testing.testcoveragetarget.graph-tooltip-placement-tests`                                  | `covers`     | inbound   |
| inter-layer | `testing.testcoveragetarget.graph-viewport-history-tests`                                   | `covers`     | inbound   |
| inter-layer | `testing.testcoveragetarget.layer-lanes-tests`                                              | `covers`     | inbound   |
| inter-layer | `testing.testcoveragetarget.layered-async-layout-tests`                                     | `covers`     | inbound   |
| inter-layer | `testing.testcoveragetarget.layered-tests`                                                  | `covers`     | inbound   |
| inter-layer | `testing.testcoveragetarget.organic-layout-browser-tests`                                   | `covers`     | inbound   |
| inter-layer | `testing.testcoveragetarget.organic-layout-tests`                                           | `covers`     | inbound   |
| inter-layer | `testing.testcoveragetarget.orthogonal-layout-browser-tests`                                | `covers`     | inbound   |
| inter-layer | `testing.testcoveragetarget.orthogonal-layout-tests`                                        | `covers`     | inbound   |
| inter-layer | `testing.testcoveragetarget.pan-zoom-tests`                                                 | `covers`     | inbound   |
| inter-layer | `testing.testcoveragetarget.radial-tree-layout-algorithm`                                   | `covers`     | inbound   |
| inter-layer | `testing.testcoveragetarget.reach-inspector-tests`                                          | `covers`     | inbound   |
| inter-layer | `testing.testcoveragetarget.ux-nav-edge-visibility-tests`                                   | `covers`     | inbound   |
| inter-layer | `testing.testcoveragetarget.ux-nav-layout-tests`                                            | `covers`     | inbound   |
| intra-layer | `api.tag.graph`                                                                             | `references` | outbound  |

### GraphCollapseControl {#graphcollapsecontrol}

**ID**: `api.operation.graph-collapse-control`

**Type**: `operation`

Exported collapse/expand affordance button for a node with structural children.

#### Attributes

| Name        | Value                                              |
| ----------- | -------------------------------------------------- |
| operationId | GraphCollapseControl                               |
| summary     | Collapse/expand affordance for a hierarchical node |
| tags        | graph                                              |

#### Relationships

| Type        | Related Element                                                  | Predicate    | Direction |
| ----------- | ---------------------------------------------------------------- | ------------ | --------- |
| inter-layer | `product.feature.progressive-disclosure-via-node-collapseexpand` | `exposes`    | outbound  |
| inter-layer | `application.applicationservice.interactive-graph-rendering`     | `references` | outbound  |
| inter-layer | `testing.testcoveragetarget.galaxy-layout-collapse-tests`        | `covers`     | inbound   |
| intra-layer | `api.tag.graph`                                                  | `references` | outbound  |

### GraphEdge {#graphedge}

**ID**: `api.operation.graph-edge`

**Type**: `operation`

Exported standalone edge component for use outside GraphCanvas's own internal edge renderer.

#### Attributes

| Name        | Value                           |
| ----------- | ------------------------------- |
| operationId | GraphEdge                       |
| summary     | Standalone graph edge component |
| tags        | graph                           |

#### Relationships

| Type        | Related Element                                                     | Predicate    | Direction |
| ----------- | ------------------------------------------------------------------- | ------------ | --------- |
| inter-layer | `application.applicationservice.interactive-graph-rendering`        | `references` | outbound  |
| inter-layer | `testing.testcoveragetarget.graph-canvas-rendering-and-interaction` | `covers`     | inbound   |
| inter-layer | `testing.testcoveragetarget.layered-tests`                          | `covers`     | inbound   |
| inter-layer | `testing.testcoveragetarget.reach-inspector-tests`                  | `covers`     | inbound   |
| inter-layer | `testing.testcoveragetarget.ux-nav-edge-visibility-tests`           | `covers`     | inbound   |
| intra-layer | `api.tag.graph`                                                     | `references` | outbound  |

### GraphEdgeInspector {#graphedgeinspector}

**ID**: `api.operation.graph-edge-inspector`

**Type**: `operation`

Exported detail panel component for a selected edge's endpoints and metadata.

#### Attributes

| Name        | Value                                  |
| ----------- | -------------------------------------- |
| operationId | GraphEdgeInspector                     |
| summary     | Detail panel for a selected graph edge |
| tags        | graph                                  |

#### Relationships

| Type        | Related Element                                              | Predicate    | Direction |
| ----------- | ------------------------------------------------------------ | ------------ | --------- |
| inter-layer | `product.feature.edge-selection-and-inspection`              | `exposes`    | outbound  |
| inter-layer | `application.applicationservice.interactive-graph-rendering` | `references` | outbound  |
| inter-layer | `testing.testcoveragetarget.layered-matrix-tests`            | `covers`     | inbound   |
| intra-layer | `api.tag.graph`                                              | `references` | outbound  |

### GraphEdgeShape {#graphedgeshape}

**ID**: `api.operation.graph-edge-shape`

**Type**: `operation`

Exported low-level SVG edge-drawing primitive (line, markers, hit target, label pill), for fully custom renderEdge callbacks.

#### Attributes

| Name        | Value                              |
| ----------- | ---------------------------------- |
| operationId | GraphEdgeShape                     |
| summary     | Low-level SVG edge shape primitive |
| tags        | graph                              |

#### Relationships

| Type        | Related Element                                              | Predicate    | Direction |
| ----------- | ------------------------------------------------------------ | ------------ | --------- |
| inter-layer | `application.applicationservice.interactive-graph-rendering` | `references` | outbound  |
| inter-layer | `testing.testcoveragetarget.graph-a11y-names-tests`          | `covers`     | inbound   |
| intra-layer | `api.tag.graph`                                              | `references` | outbound  |

### GraphInspector {#graphinspector}

**ID**: `api.operation.graph-inspector`

**Type**: `operation`

Exported detail panel component for a selected node's metadata and relationships.

#### Attributes

| Name        | Value                                  |
| ----------- | -------------------------------------- |
| operationId | GraphInspector                         |
| summary     | Detail panel for a selected graph node |
| tags        | graph                                  |

#### Relationships

| Type        | Related Element                                                     | Predicate    | Direction |
| ----------- | ------------------------------------------------------------------- | ------------ | --------- |
| inter-layer | `application.applicationservice.interactive-graph-rendering`        | `references` | outbound  |
| inter-layer | `testing.testcoveragetarget.graph-canvas-rendering-and-interaction` | `covers`     | inbound   |
| intra-layer | `api.tag.graph`                                                     | `references` | outbound  |

### GraphNode {#graphnode}

**ID**: `api.operation.graph-node`

**Type**: `operation`

Exported default node renderer component, usable standalone or via GraphCanvas's renderNode.

#### Attributes

| Name        | Value                       |
| ----------- | --------------------------- |
| operationId | GraphNode                   |
| summary     | Default graph node renderer |
| tags        | graph                       |

#### Relationships

| Type        | Related Element                                                      | Predicate    | Direction |
| ----------- | -------------------------------------------------------------------- | ------------ | --------- |
| inter-layer | `application.applicationservice.interactive-graph-rendering`         | `references` | outbound  |
| inter-layer | `motivation.requirement.graph-nodes-and-edges-have-accessible-names` | `satisfies`  | outbound  |
| inter-layer | `testing.testcoveragetarget.center-on-select-tests`                  | `covers`     | inbound   |
| inter-layer | `testing.testcoveragetarget.force-force-clustered-layout-algorithms` | `covers`     | inbound   |
| inter-layer | `testing.testcoveragetarget.galaxy-layout-collapse-tests`            | `covers`     | inbound   |
| inter-layer | `testing.testcoveragetarget.graph-canvas-rendering-and-interaction`  | `covers`     | inbound   |
| inter-layer | `testing.testcoveragetarget.graph-edge-label-tests`                  | `covers`     | inbound   |
| intra-layer | `api.tag.graph`                                                      | `references` | outbound  |

### GraphToolbar {#graphtoolbar}

**ID**: `api.operation.graph-toolbar`

**Type**: `operation`

Exported floating zoom/pan/lock/fullscreen/live-simulation control cluster, for a custom toolbar placement.

#### Attributes

| Name        | Value                                            |
| ----------- | ------------------------------------------------ |
| operationId | GraphToolbar                                     |
| summary     | Zoom/pan/lock/fullscreen toolbar for GraphCanvas |
| tags        | graph                                            |

#### Relationships

| Type        | Related Element                                                     | Predicate    | Direction |
| ----------- | ------------------------------------------------------------------- | ------------ | --------- |
| inter-layer | `product.feature.fullscreen-canvas`                                 | `exposes`    | outbound  |
| inter-layer | `product.feature.live-draggable-galaxy-simulation`                  | `exposes`    | outbound  |
| inter-layer | `application.applicationservice.interactive-graph-rendering`        | `references` | outbound  |
| inter-layer | `testing.testcoveragetarget.graph-canvas-rendering-and-interaction` | `covers`     | inbound   |
| intra-layer | `api.tag.graph`                                                     | `references` | outbound  |

### louvainCluster {#louvaincluster}

**ID**: `api.operation.louvain-cluster`

**Type**: `operation`

Exported function running deterministic multi-level Louvain community clustering.

#### Attributes

| Name        | Value                                              |
| ----------- | -------------------------------------------------- |
| operationId | louvainCluster                                     |
| summary     | Compute a deterministic Louvain cluster dendrogram |
| tags        | graph                                              |

#### Relationships

| Type        | Related Element                                                | Predicate    | Direction |
| ----------- | -------------------------------------------------------------- | ------------ | --------- |
| inter-layer | `application.applicationfunction.louvain-community-clustering` | `realizes`   | outbound  |
| inter-layer | `application.applicationservice.graph-layout-engine-service`   | `references` | outbound  |
| intra-layer | `api.tag.graph`                                                | `references` | outbound  |

### packClusters {#packclusters}

**ID**: `api.operation.pack-clusters`

**Type**: `operation`

Exported function packing a cluster dendrogram into non-overlapping nested circles.

#### Attributes

| Name        | Value                                         |
| ----------- | --------------------------------------------- |
| operationId | packClusters                                  |
| summary     | Pack a cluster dendrogram into nested circles |
| tags        | graph                                         |

#### Relationships

| Type        | Related Element                                              | Predicate    | Direction |
| ----------- | ------------------------------------------------------------ | ------------ | --------- |
| inter-layer | `application.applicationfunction.cluster-circle-packing`     | `realizes`   | outbound  |
| inter-layer | `application.applicationservice.graph-layout-engine-service` | `references` | outbound  |
| intra-layer | `api.tag.graph`                                              | `references` | outbound  |

### radialTreeLayout {#radialtreelayout}

**ID**: `api.operation.radial-tree-layout`

**Type**: `operation`

Exported function running the radial-tree (concentric ring) layout algorithm.

#### Attributes

| Name        | Value                                         |
| ----------- | --------------------------------------------- |
| operationId | radialTreeLayout                              |
| summary     | Compute a radial-tree layout with depth rings |
| tags        | graph                                         |

#### Relationships

| Type        | Related Element                                                | Predicate    | Direction |
| ----------- | -------------------------------------------------------------- | ------------ | --------- |
| inter-layer | `application.applicationfunction.radial-tree-layout-algorithm` | `realizes`   | outbound  |
| inter-layer | `application.applicationservice.graph-layout-engine-service`   | `references` | outbound  |
| inter-layer | `testing.testcoveragetarget.radial-tree-layout-algorithm`      | `covers`     | inbound   |
| intra-layer | `api.tag.graph`                                                | `references` | outbound  |

### usePanZoom {#usepanzoom}

**ID**: `api.operation.use-pan-zoom`

**Type**: `operation`

Exported React hook implementing wheel/pinch/drag/keyboard pan-and-zoom with inertia.

#### Attributes

| Name        | Value                               |
| ----------- | ----------------------------------- |
| operationId | usePanZoom                          |
| summary     | Pan/zoom viewport hook with inertia |
| tags        | graph                               |

#### Relationships

| Type        | Related Element                                              | Predicate    | Direction |
| ----------- | ------------------------------------------------------------ | ------------ | --------- |
| inter-layer | `application.applicationservice.interactive-graph-rendering` | `references` | outbound  |
| inter-layer | `testing.testcoveragetarget.map-canvas-tests`                | `covers`     | inbound   |
| inter-layer | `testing.testcoveragetarget.pan-inertia-tests`               | `covers`     | inbound   |
| inter-layer | `testing.testcoveragetarget.pan-zoom-tests`                  | `covers`     | inbound   |
| intra-layer | `api.tag.graph`                                              | `references` | outbound  |

### uxNavLayout {#uxnavlayout}

**ID**: `api.operation.ux-nav-layout`

**Type**: `operation`

Exported function running the page/view navigation tree layout algorithm.

#### Attributes

| Name        | Value                                            |
| ----------- | ------------------------------------------------ |
| operationId | uxNavLayout                                      |
| summary     | Compute a page-tree + view-fan navigation layout |
| tags        | graph                                            |

#### Relationships

| Type        | Related Element                                                       | Predicate    | Direction |
| ----------- | --------------------------------------------------------------------- | ------------ | --------- |
| inter-layer | `application.applicationfunction.ux-navigation-tree-layout-algorithm` | `realizes`   | outbound  |
| inter-layer | `application.applicationservice.graph-layout-engine-service`          | `references` | outbound  |
| inter-layer | `testing.testcoveragetarget.ux-nav-layout-tests`                      | `covers`     | inbound   |
| intra-layer | `api.tag.graph`                                                       | `references` | outbound  |

### visibleNavigationEdgeIds {#visiblenavigationedgeids}

**ID**: `api.operation.visible-navigation-edge-ids`

**Type**: `operation`

Exported function computing which ux-navigation route edges should be visible for a given hover/collapse state.

#### Attributes

| Name        | Value                                                       |
| ----------- | ----------------------------------------------------------- |
| operationId | visibleNavigationEdgeIds                                    |
| summary     | Compute visible navigation-route edge ids for a hover state |
| tags        | graph                                                       |

#### Relationships

| Type        | Related Element                                                       | Predicate    | Direction |
| ----------- | --------------------------------------------------------------------- | ------------ | --------- |
| inter-layer | `application.applicationfunction.ux-navigation-tree-layout-algorithm` | `realizes`   | outbound  |
| inter-layer | `application.applicationservice.interactive-graph-rendering`          | `references` | outbound  |
| inter-layer | `testing.testcoveragetarget.ux-nav-edge-visibility-tests`             | `covers`     | inbound   |
| intra-layer | `api.tag.graph`                                                       | `references` | outbound  |

### graph {#graph}

**ID**: `api.tag.graph`

**Type**: `tag`

Graph visualization and layout portion of @tinkermonkey/heimdall-ui's public exported API surface (src/index.ts).

#### Relationships

| Type        | Related Element                             | Predicate    | Direction |
| ----------- | ------------------------------------------- | ------------ | --------- |
| intra-layer | `api.operation.build-structural-forest`     | `references` | inbound   |
| intra-layer | `api.operation.clustered-force-layout`      | `references` | inbound   |
| intra-layer | `api.operation.force-layout`                | `references` | inbound   |
| intra-layer | `api.operation.galaxy-layout`               | `references` | inbound   |
| intra-layer | `api.operation.graph-canvas`                | `references` | inbound   |
| intra-layer | `api.operation.graph-collapse-control`      | `references` | inbound   |
| intra-layer | `api.operation.graph-edge-inspector`        | `references` | inbound   |
| intra-layer | `api.operation.graph-edge`                  | `references` | inbound   |
| intra-layer | `api.operation.graph-edge-shape`            | `references` | inbound   |
| intra-layer | `api.operation.graph-inspector`             | `references` | inbound   |
| intra-layer | `api.operation.graph-node`                  | `references` | inbound   |
| intra-layer | `api.operation.graph-toolbar`               | `references` | inbound   |
| intra-layer | `api.operation.louvain-cluster`             | `references` | inbound   |
| intra-layer | `api.operation.pack-clusters`               | `references` | inbound   |
| intra-layer | `api.operation.radial-tree-layout`          | `references` | inbound   |
| intra-layer | `api.operation.use-pan-zoom`                | `references` | inbound   |
| intra-layer | `api.operation.ux-nav-layout`               | `references` | inbound   |
| intra-layer | `api.operation.visible-navigation-edge-ids` | `references` | inbound   |

---

Generated: 2026-11-24T13:25:05.973Z | Model Version: 0.1.0
