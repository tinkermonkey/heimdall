# Product

[← Back to README](../README.md)

Product features, capabilities, personas, and milestones.

## Report Index

- [Layer Introduction](#layer-introduction)
- [Intra-Layer Relationships](#intra-layer-relationships)
- [Inter-Layer Dependencies](#inter-layer-dependencies)
- [Inter-Layer Relationships Table](#inter-layer-relationships-table)
- [Element Reference](#element-reference)

## Layer Introduction

| Metric                    | Count |
| ------------------------- | ----- |
| Elements                  | 31    |
| Intra-Layer Relationships | 8     |
| Inter-Layer Relationships | 127   |
| Inbound Relationships     | 96    |
| Outbound Relationships    | 31    |

**Cross-Layer References**:

- **Upstream layers**: [API](./07-api-layer-report.md), [Application](./05-application-layer-report.md), [Testing](./13-testing-layer-report.md)
- **Downstream layers**: [Business](./02-business-layer-report.md), [Motivation](./01-motivation-layer-report.md)

## Intra-Layer Relationships

*This layer has >30 elements. Summary table shown instead of diagram.*

| Element                                                               | Type                 | Relationships |
| --------------------------------------------------------------------- | -------------------- | ------------- |
| `product.feature.edge-selection-and-inspection`                       | `feature`            | 0             |
| `product.feature.fullscreen-canvas`                                   | `feature`            | 0             |
| `product.feature.layout-progress-indicator`                           | `feature`            | 0             |
| `product.feature.live-draggable-galaxy-simulation`                    | `feature`            | 2             |
| `product.feature.node-and-edge-tooltips-and-popovers`                 | `feature`            | 2             |
| `product.feature.progressive-disclosure-via-node-collapseexpand`      | `feature`            | 2             |
| `product.feature.viewport-history-and-restore`                        | `feature`            | 0             |
| `product.persona.application-developer-embedding-a-graph-view`        | `persona`            | 1             |
| `product.persona.end-user-exploring-a-rendered-graph`                 | `persona`            | 2             |
| `product.softwarecapability.app-navigation`                           | `softwarecapability` | 0             |
| `product.softwarecapability.app-shell`                                | `softwarecapability` | 0             |
| `product.softwarecapability.charting`                                 | `softwarecapability` | 0             |
| `product.softwarecapability.chat-ui`                                  | `softwarecapability` | 0             |
| `product.softwarecapability.clustered-force-layout-community-bubbles` | `softwarecapability` | 2             |
| `product.softwarecapability.data-display`                             | `softwarecapability` | 0             |
| `product.softwarecapability.force-directed-graph-layout`              | `softwarecapability` | 2             |
| `product.softwarecapability.form-input`                               | `softwarecapability` | 0             |
| `product.softwarecapability.galaxy-radial-orbit-layout`               | `softwarecapability` | 1             |
| `product.softwarecapability.interactive-graph-exploration`            | `softwarecapability` | 2             |
| `product.softwarecapability.layer-lanes-layout`                       | `softwarecapability` | 0             |
| `product.softwarecapability.layered-graph-visualization`              | `softwarecapability` | 0             |
| `product.softwarecapability.organic-graph-layout`                     | `softwarecapability` | 0             |
| `product.softwarecapability.orthogonal-graph-layout`                  | `softwarecapability` | 0             |
| `product.softwarecapability.overlays-and-dialogs`                     | `softwarecapability` | 0             |
| `product.softwarecapability.page-patterns`                            | `softwarecapability` | 0             |
| `product.softwarecapability.planning-and-scheduling`                  | `softwarecapability` | 0             |
| `product.softwarecapability.radial-tree-layout`                       | `softwarecapability` | 0             |
| `product.softwarecapability.responsive-layout`                        | `softwarecapability` | 0             |
| `product.softwarecapability.run-history-and-observability-views`      | `softwarecapability` | 0             |
| `product.softwarecapability.ui-primitives`                            | `softwarecapability` | 0             |
| `product.softwarecapability.ux-navigation-tree-layout`                | `softwarecapability` | 0             |

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
  api --> product
  application --> product
  product --> business
  product --> motivation
  testing --> product
  class product current
```

## Inter-Layer Relationships Table

| Relationship ID                                                      | Source Node                                                                                                                           | Dest Node                                                                                   | Dest Layer   | Predicate    | Cardinality  | Strength |
| -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | ------------ | ------------ | ------------ | -------- |
| `api.operation.exposes.product.feature`                              | `api.operation.graph-canvas`                                                                                                          | `product.feature.edge-selection-and-inspection`                                             | `product`    | `exposes`    | many-to-many | medium   |
| `api.operation.exposes.product.feature`                              | `api.operation.graph-canvas`                                                                                                          | `product.feature.layout-progress-indicator`                                                 | `product`    | `exposes`    | many-to-many | medium   |
| `api.operation.exposes.product.feature`                              | `api.operation.graph-canvas`                                                                                                          | `product.feature.live-draggable-galaxy-simulation`                                          | `product`    | `exposes`    | many-to-many | medium   |
| `api.operation.exposes.product.feature`                              | `api.operation.graph-canvas`                                                                                                          | `product.feature.node-and-edge-tooltips-and-popovers`                                       | `product`    | `exposes`    | many-to-many | medium   |
| `api.operation.exposes.product.feature`                              | `api.operation.graph-canvas`                                                                                                          | `product.feature.progressive-disclosure-via-node-collapseexpand`                            | `product`    | `exposes`    | many-to-many | medium   |
| `api.operation.exposes.product.feature`                              | `api.operation.graph-canvas`                                                                                                          | `product.feature.viewport-history-and-restore`                                              | `product`    | `exposes`    | many-to-many | medium   |
| `api.operation.exposes.product.feature`                              | `api.operation.graph-collapse-control`                                                                                                | `product.feature.progressive-disclosure-via-node-collapseexpand`                            | `product`    | `exposes`    | many-to-many | medium   |
| `api.operation.exposes.product.feature`                              | `api.operation.graph-edge-inspector`                                                                                                  | `product.feature.edge-selection-and-inspection`                                             | `product`    | `exposes`    | many-to-many | medium   |
| `api.operation.exposes.product.feature`                              | `api.operation.graph-toolbar`                                                                                                         | `product.feature.fullscreen-canvas`                                                         | `product`    | `exposes`    | many-to-many | medium   |
| `api.operation.exposes.product.feature`                              | `api.operation.graph-toolbar`                                                                                                         | `product.feature.live-draggable-galaxy-simulation`                                          | `product`    | `exposes`    | many-to-many | medium   |
| `application.applicationservice.realizes.product.softwarecapability` | `application.applicationservice.app-shell-components`                                                                                 | `product.softwarecapability.app-shell`                                                      | `product`    | `realizes`   | many-to-many | medium   |
| `application.applicationservice.realizes.product.softwarecapability` | `application.applicationservice.chart-components`                                                                                     | `product.softwarecapability.charting`                                                       | `product`    | `realizes`   | many-to-many | medium   |
| `application.applicationservice.realizes.product.softwarecapability` | `application.applicationservice.chat-components`                                                                                      | `product.softwarecapability.chat-ui`                                                        | `product`    | `realizes`   | many-to-many | medium   |
| `application.applicationservice.realizes.product.softwarecapability` | `application.applicationservice.data-display-components`                                                                              | `product.softwarecapability.data-display`                                                   | `product`    | `realizes`   | many-to-many | medium   |
| `application.applicationservice.realizes.product.softwarecapability` | `application.applicationservice.form-input-components`                                                                                | `product.softwarecapability.form-input`                                                     | `product`    | `realizes`   | many-to-many | medium   |
| `application.applicationservice.realizes.product.softwarecapability` | `application.applicationservice.graph-layout-engine-service`                                                                          | `product.softwarecapability.clustered-force-layout-community-bubbles`                       | `product`    | `realizes`   | many-to-many | medium   |
| `application.applicationservice.realizes.product.softwarecapability` | `application.applicationservice.graph-layout-engine-service`                                                                          | `product.softwarecapability.force-directed-graph-layout`                                    | `product`    | `realizes`   | many-to-many | medium   |
| `application.applicationservice.realizes.product.softwarecapability` | `application.applicationservice.graph-layout-engine-service`                                                                          | `product.softwarecapability.galaxy-radial-orbit-layout`                                     | `product`    | `realizes`   | many-to-many | medium   |
| `application.applicationservice.realizes.product.softwarecapability` | `application.applicationservice.graph-layout-engine-service`                                                                          | `product.softwarecapability.layer-lanes-layout`                                             | `product`    | `realizes`   | many-to-many | medium   |
| `application.applicationservice.realizes.product.softwarecapability` | `application.applicationservice.graph-layout-engine-service`                                                                          | `product.softwarecapability.organic-graph-layout`                                           | `product`    | `realizes`   | many-to-many | medium   |
| `application.applicationservice.realizes.product.softwarecapability` | `application.applicationservice.graph-layout-engine-service`                                                                          | `product.softwarecapability.orthogonal-graph-layout`                                        | `product`    | `realizes`   | many-to-many | medium   |
| `application.applicationservice.realizes.product.softwarecapability` | `application.applicationservice.graph-layout-engine-service`                                                                          | `product.softwarecapability.radial-tree-layout`                                             | `product`    | `realizes`   | many-to-many | medium   |
| `application.applicationservice.realizes.product.softwarecapability` | `application.applicationservice.graph-layout-engine-service`                                                                          | `product.softwarecapability.ux-navigation-tree-layout`                                      | `product`    | `realizes`   | many-to-many | medium   |
| `application.applicationservice.realizes.product.softwarecapability` | `application.applicationservice.interactive-graph-rendering`                                                                          | `product.softwarecapability.interactive-graph-exploration`                                  | `product`    | `realizes`   | many-to-many | medium   |
| `application.applicationservice.realizes.product.softwarecapability` | `application.applicationservice.layered-graph-visualization`                                                                          | `product.softwarecapability.layered-graph-visualization`                                    | `product`    | `realizes`   | many-to-many | medium   |
| `application.applicationservice.realizes.product.softwarecapability` | `application.applicationservice.layout-components`                                                                                    | `product.softwarecapability.responsive-layout`                                              | `product`    | `realizes`   | many-to-many | medium   |
| `application.applicationservice.realizes.product.feature`            | `application.applicationservice.live-galaxy-simulation-service`                                                                       | `product.feature.live-draggable-galaxy-simulation`                                          | `product`    | `realizes`   | many-to-many | medium   |
| `application.applicationservice.realizes.product.softwarecapability` | `application.applicationservice.navigation-components`                                                                                | `product.softwarecapability.app-navigation`                                                 | `product`    | `realizes`   | many-to-many | medium   |
| `application.applicationservice.realizes.product.softwarecapability` | `application.applicationservice.observability-view-components`                                                                        | `product.softwarecapability.run-history-and-observability-views`                            | `product`    | `realizes`   | many-to-many | medium   |
| `application.applicationservice.realizes.product.softwarecapability` | `application.applicationservice.overlay-components`                                                                                   | `product.softwarecapability.overlays-and-dialogs`                                           | `product`    | `realizes`   | many-to-many | medium   |
| `application.applicationservice.realizes.product.softwarecapability` | `application.applicationservice.page-pattern-components`                                                                              | `product.softwarecapability.page-patterns`                                                  | `product`    | `realizes`   | many-to-many | medium   |
| `application.applicationservice.realizes.product.softwarecapability` | `application.applicationservice.planning-components`                                                                                  | `product.softwarecapability.planning-and-scheduling`                                        | `product`    | `realizes`   | many-to-many | medium   |
| `application.applicationservice.realizes.product.softwarecapability` | `application.applicationservice.primitive-components`                                                                                 | `product.softwarecapability.ui-primitives`                                                  | `product`    | `realizes`   | many-to-many | medium   |
| `product.persona.references.motivation.stakeholder`                  | `product.persona.application-developer-embedding-a-graph-view`                                                                        | `motivation.stakeholder.embedding-application-developer-npm-consumer`                       | `motivation` | `references` | many-to-many | medium   |
| `product.persona.references.motivation.stakeholder`                  | `product.persona.end-user-exploring-a-rendered-graph`                                                                                 | `motivation.stakeholder.end-user-of-an-embedding-application`                               | `motivation` | `references` | many-to-many | medium   |
| `product.softwarecapability.supports.motivation.goal`                | `product.softwarecapability.app-navigation`                                                                                           | `motivation.goal.one-consistent-ide-density-ui-across-heimdall-based-tools`                 | `motivation` | `supports`   | many-to-many | medium   |
| `product.softwarecapability.supports.motivation.goal`                | `product.softwarecapability.app-shell`                                                                                                | `motivation.goal.one-consistent-ide-density-ui-across-heimdall-based-tools`                 | `motivation` | `supports`   | many-to-many | medium   |
| `product.softwarecapability.supports.motivation.goal`                | `product.softwarecapability.charting`                                                                                                 | `motivation.goal.one-consistent-ide-density-ui-across-heimdall-based-tools`                 | `motivation` | `supports`   | many-to-many | medium   |
| `product.softwarecapability.supports.motivation.goal`                | `product.softwarecapability.chat-ui`                                                                                                  | `motivation.goal.one-consistent-ide-density-ui-across-heimdall-based-tools`                 | `motivation` | `supports`   | many-to-many | medium   |
| `product.softwarecapability.realizes.business.businessfunction`      | `product.softwarecapability.clustered-force-layout-community-bubbles`                                                                 | `business.businessfunction.community-and-cluster-discovery-in-relationship-graphs`          | `business`   | `realizes`   | many-to-many | medium   |
| `product.softwarecapability.satisfies.motivation.requirement`        | `product.softwarecapability.clustered-force-layout-community-bubbles`                                                                 | `motivation.requirement.layout-engines-must-be-pluggable-without-breaking-existing-callers` | `motivation` | `satisfies`  | many-to-many | medium   |
| `product.softwarecapability.supports.motivation.goal`                | `product.softwarecapability.clustered-force-layout-community-bubbles`                                                                 | `motivation.goal.layout-algorithms-that-scale-to-large-dense-and-pathological-graphs`       | `motivation` | `supports`   | many-to-many | medium   |
| `product.softwarecapability.supports.motivation.goal`                | `product.softwarecapability.data-display`                                                                                             | `motivation.goal.one-consistent-ide-density-ui-across-heimdall-based-tools`                 | `motivation` | `supports`   | many-to-many | medium   |
| `product.softwarecapability.realizes.business.businessfunction`      | `product.softwarecapability.force-directed-graph-layout`                                                                              | `business.businessfunction.automatic-node-layout-computation`                               | `business`   | `realizes`   | many-to-many | medium   |
| `product.softwarecapability.supports.motivation.goal`                | `product.softwarecapability.force-directed-graph-layout`                                                                              | `motivation.goal.readable-layout-for-structurally-complex-graphs`                           | `motivation` | `supports`   | many-to-many | medium   |
| `product.softwarecapability.supports.motivation.goal`                | `product.softwarecapability.form-input`                                                                                               | `motivation.goal.one-consistent-ide-density-ui-across-heimdall-based-tools`                 | `motivation` | `supports`   | many-to-many | medium   |
| `product.softwarecapability.realizes.business.businessfunction`      | `product.softwarecapability.galaxy-radial-orbit-layout`                                                                               | `business.businessfunction.automatic-node-layout-computation`                               | `business`   | `realizes`   | many-to-many | medium   |
| `product.softwarecapability.supports.motivation.goal`                | `product.softwarecapability.galaxy-radial-orbit-layout`                                                                               | `motivation.goal.readable-layout-for-structurally-complex-graphs`                           | `motivation` | `supports`   | many-to-many | medium   |
| `product.softwarecapability.supports.motivation.goal`                | `product.softwarecapability.interactive-graph-exploration`                                                                            | `motivation.goal.readable-layout-for-structurally-complex-graphs`                           | `motivation` | `supports`   | many-to-many | medium   |
| `product.softwarecapability.realizes.business.businessfunction`      | `product.softwarecapability.layer-lanes-layout`                                                                                       | `business.businessfunction.automatic-node-layout-computation`                               | `business`   | `realizes`   | many-to-many | medium   |
| `product.softwarecapability.supports.motivation.goal`                | `product.softwarecapability.layered-graph-visualization`                                                                              | `motivation.goal.one-consistent-ide-density-ui-across-heimdall-based-tools`                 | `motivation` | `supports`   | many-to-many | medium   |
| `product.softwarecapability.supports.motivation.goal`                | `product.softwarecapability.layered-graph-visualization`                                                                              | `motivation.goal.readable-layout-for-structurally-complex-graphs`                           | `motivation` | `supports`   | many-to-many | medium   |
| `product.softwarecapability.realizes.business.businessfunction`      | `product.softwarecapability.organic-graph-layout`                                                                                     | `business.businessfunction.automatic-node-layout-computation`                               | `business`   | `realizes`   | many-to-many | medium   |
| `product.softwarecapability.realizes.business.businessfunction`      | `product.softwarecapability.orthogonal-graph-layout`                                                                                  | `business.businessfunction.automatic-node-layout-computation`                               | `business`   | `realizes`   | many-to-many | medium   |
| `product.softwarecapability.supports.motivation.goal`                | `product.softwarecapability.overlays-and-dialogs`                                                                                     | `motivation.goal.one-consistent-ide-density-ui-across-heimdall-based-tools`                 | `motivation` | `supports`   | many-to-many | medium   |
| `product.softwarecapability.supports.motivation.goal`                | `product.softwarecapability.page-patterns`                                                                                            | `motivation.goal.one-consistent-ide-density-ui-across-heimdall-based-tools`                 | `motivation` | `supports`   | many-to-many | medium   |
| `product.softwarecapability.supports.motivation.goal`                | `product.softwarecapability.planning-and-scheduling`                                                                                  | `motivation.goal.one-consistent-ide-density-ui-across-heimdall-based-tools`                 | `motivation` | `supports`   | many-to-many | medium   |
| `product.softwarecapability.realizes.business.businessfunction`      | `product.softwarecapability.radial-tree-layout`                                                                                       | `business.businessfunction.automatic-node-layout-computation`                               | `business`   | `realizes`   | many-to-many | medium   |
| `product.softwarecapability.supports.motivation.goal`                | `product.softwarecapability.radial-tree-layout`                                                                                       | `motivation.goal.readable-layout-for-structurally-complex-graphs`                           | `motivation` | `supports`   | many-to-many | medium   |
| `product.softwarecapability.supports.motivation.goal`                | `product.softwarecapability.responsive-layout`                                                                                        | `motivation.goal.one-consistent-ide-density-ui-across-heimdall-based-tools`                 | `motivation` | `supports`   | many-to-many | medium   |
| `product.softwarecapability.supports.motivation.goal`                | `product.softwarecapability.run-history-and-observability-views`                                                                      | `motivation.goal.one-consistent-ide-density-ui-across-heimdall-based-tools`                 | `motivation` | `supports`   | many-to-many | medium   |
| `product.softwarecapability.supports.motivation.goal`                | `product.softwarecapability.ui-primitives`                                                                                            | `motivation.goal.one-consistent-ide-density-ui-across-heimdall-based-tools`                 | `motivation` | `supports`   | many-to-many | medium   |
| `product.softwarecapability.realizes.business.businessfunction`      | `product.softwarecapability.ux-navigation-tree-layout`                                                                                | `business.businessfunction.automatic-node-layout-computation`                               | `business`   | `realizes`   | many-to-many | medium   |
| `product.softwarecapability.supports.motivation.goal`                | `product.softwarecapability.ux-navigation-tree-layout`                                                                                | `motivation.goal.readable-layout-for-structurally-complex-graphs`                           | `motivation` | `supports`   | many-to-many | medium   |
| `testing.testcasesketch.tests.product.feature`                       | `testing.testcasesketch.graph-canvas-hover-tooltip-placement-323-edge-tooltip-waits-for-tooltip-delay-before-showing`                 | `product.feature.node-and-edge-tooltips-and-popovers`                                       | `product`    | `tests`      | many-to-many | medium   |
| `testing.testcasesketch.tests.product.feature`                       | `testing.testcasesketch.graph-canvas-hover-tooltip-placement-323-labelled-edge-near-the-canvas-top-tooltip-flips-below-the-2326f2d8`  | `product.feature.node-and-edge-tooltips-and-popovers`                                       | `product`    | `tests`      | many-to-many | medium   |
| `testing.testcasesketch.tests.product.feature`                       | `testing.testcasesketch.graph-canvas-hover-tooltip-placement-323-labelled-edge-tooltip-sits-above-the-label-without-a1ce7be4`         | `product.feature.node-and-edge-tooltips-and-popovers`                                       | `product`    | `tests`      | many-to-many | medium   |
| `testing.testcasesketch.tests.product.feature`                       | `testing.testcasesketch.graph-canvas-hover-tooltip-placement-323-labelled-vertical-edge-tooltip-clears-the-label-and-stays-35a5e023`  | `product.feature.node-and-edge-tooltips-and-popovers`                                       | `product`    | `tests`      | many-to-many | medium   |
| `testing.testcasesketch.tests.product.feature`                       | `testing.testcasesketch.graph-canvas-hover-tooltip-placement-323-node-tooltip-uses-the-same-tooltip-delay`                            | `product.feature.node-and-edge-tooltips-and-popovers`                                       | `product`    | `tests`      | many-to-many | medium   |
| `testing.testcasesketch.tests.product.feature`                       | `testing.testcasesketch.graph-canvas-hover-tooltip-placement-323-tooltip-stays-clear-of-the-label-while-the-canvas-zooms`             | `product.feature.node-and-edge-tooltips-and-popovers`                                       | `product`    | `tests`      | many-to-many | medium   |
| `testing.testcasesketch.tests.product.feature`                       | `testing.testcasesketch.graph-canvas-hover-tooltip-placement-323-unlabelled-edge-tooltip-anchors-at-the-path-midpoint`                | `product.feature.node-and-edge-tooltips-and-popovers`                                       | `product`    | `tests`      | many-to-many | medium   |
| `testing.testcasesketch.tests.product.feature`                       | `testing.testcasesketch.graph-canvas-hover-tooltip-placement-layer-lanes-323-link-with-a-predicate-pill-tooltip-sits-beside-742ff016` | `product.feature.node-and-edge-tooltips-and-popovers`                                       | `product`    | `tests`      | many-to-many | medium   |
| `testing.testcasesketch.tests.product.feature`                       | `testing.testcasesketch.graph-canvas-hover-tooltip-placement-layer-lanes-323-link-without-a-pill-tooltip-anchors-on-the-208a5652`     | `product.feature.node-and-edge-tooltips-and-popovers`                                       | `product`    | `tests`      | many-to-many | medium   |
| `testing.testcasesketch.tests.product.feature`                       | `testing.testcasesketch.integration-graph-canvas-click-triggered-tooltips-accessibility-click-tooltips-edge-tooltip-1c7b4a8b`         | `product.feature.node-and-edge-tooltips-and-popovers`                                       | `product`    | `tests`      | many-to-many | medium   |
| `testing.testcasesketch.tests.product.feature`                       | `testing.testcasesketch.integration-graph-canvas-click-triggered-tooltips-accessibility-click-tooltips-node-tooltip-d96b5908`         | `product.feature.node-and-edge-tooltips-and-popovers`                                       | `product`    | `tests`      | many-to-many | medium   |
| `testing.testcasesketch.tests.product.feature`                       | `testing.testcasesketch.integration-graph-canvas-click-triggered-tooltips-edge-click-triggered-tooltip-edge-tooltip-010240b0`         | `product.feature.node-and-edge-tooltips-and-popovers`                                       | `product`    | `tests`      | many-to-many | medium   |
| `testing.testcasesketch.tests.product.feature`                       | `testing.testcasesketch.integration-graph-canvas-click-triggered-tooltips-edge-click-triggered-tooltip-edge-tooltip-8fa2ed26`         | `product.feature.node-and-edge-tooltips-and-popovers`                                       | `product`    | `tests`      | many-to-many | medium   |
| `testing.testcasesketch.tests.product.feature`                       | `testing.testcasesketch.integration-graph-canvas-click-triggered-tooltips-edge-click-triggered-tooltip-edge-tooltip-bba8bea1`         | `product.feature.node-and-edge-tooltips-and-popovers`                                       | `product`    | `tests`      | many-to-many | medium   |
| `testing.testcasesketch.tests.product.feature`                       | `testing.testcasesketch.integration-graph-canvas-click-triggered-tooltips-edge-click-triggered-tooltip-edge-tooltip-bddcdc0f`         | `product.feature.node-and-edge-tooltips-and-popovers`                                       | `product`    | `tests`      | many-to-many | medium   |
| `testing.testcasesketch.tests.product.feature`                       | `testing.testcasesketch.integration-graph-canvas-click-triggered-tooltips-edge-click-triggered-tooltip-edge-tooltip-d0be90d5`         | `product.feature.node-and-edge-tooltips-and-popovers`                                       | `product`    | `tests`      | many-to-many | medium   |
| `testing.testcasesketch.tests.product.feature`                       | `testing.testcasesketch.integration-graph-canvas-click-triggered-tooltips-edge-click-triggered-tooltip-edge-tooltip-d8faa9f5`         | `product.feature.node-and-edge-tooltips-and-popovers`                                       | `product`    | `tests`      | many-to-many | medium   |
| `testing.testcasesketch.tests.product.feature`                       | `testing.testcasesketch.integration-graph-canvas-click-triggered-tooltips-fallback-logic-verification-edge-tooltip-2824a7e1`          | `product.feature.node-and-edge-tooltips-and-popovers`                                       | `product`    | `tests`      | many-to-many | medium   |
| `testing.testcasesketch.tests.product.feature`                       | `testing.testcasesketch.integration-graph-canvas-click-triggered-tooltips-fallback-logic-verification-node-tooltip-92229b2c`          | `product.feature.node-and-edge-tooltips-and-popovers`                                       | `product`    | `tests`      | many-to-many | medium   |
| `testing.testcasesketch.tests.product.feature`                       | `testing.testcasesketch.integration-graph-canvas-click-triggered-tooltips-node-and-edge-click-interaction-clicking-a-node-36f273d4`   | `product.feature.node-and-edge-tooltips-and-popovers`                                       | `product`    | `tests`      | many-to-many | medium   |
| `testing.testcasesketch.tests.product.feature`                       | `testing.testcasesketch.integration-graph-canvas-click-triggered-tooltips-node-and-edge-click-interaction-clicking-an-edge-7c445a59`  | `product.feature.node-and-edge-tooltips-and-popovers`                                       | `product`    | `tests`      | many-to-many | medium   |
| `testing.testcasesketch.tests.product.feature`                       | `testing.testcasesketch.integration-graph-canvas-click-triggered-tooltips-node-click-triggered-tooltip-node-tooltip-139567d4`         | `product.feature.node-and-edge-tooltips-and-popovers`                                       | `product`    | `tests`      | many-to-many | medium   |
| `testing.testcasesketch.tests.product.feature`                       | `testing.testcasesketch.integration-graph-canvas-click-triggered-tooltips-node-click-triggered-tooltip-node-tooltip-1ad18bf2`         | `product.feature.node-and-edge-tooltips-and-popovers`                                       | `product`    | `tests`      | many-to-many | medium   |
| `testing.testcasesketch.tests.product.feature`                       | `testing.testcasesketch.integration-graph-canvas-click-triggered-tooltips-node-click-triggered-tooltip-node-tooltip-2f81a513`         | `product.feature.node-and-edge-tooltips-and-popovers`                                       | `product`    | `tests`      | many-to-many | medium   |
| `testing.testcasesketch.tests.product.feature`                       | `testing.testcasesketch.integration-graph-canvas-click-triggered-tooltips-node-click-triggered-tooltip-node-tooltip-4e5faaa0`         | `product.feature.node-and-edge-tooltips-and-popovers`                                       | `product`    | `tests`      | many-to-many | medium   |
| `testing.testcasesketch.tests.product.feature`                       | `testing.testcasesketch.integration-graph-canvas-click-triggered-tooltips-node-click-triggered-tooltip-node-tooltip-c1e53013`         | `product.feature.node-and-edge-tooltips-and-popovers`                                       | `product`    | `tests`      | many-to-many | medium   |
| `testing.testcasesketch.tests.product.feature`                       | `testing.testcasesketch.integration-graph-canvas-click-triggered-tooltips-visual-regression-dark-canvas-edge-tooltip-3ee5cdec`        | `product.feature.node-and-edge-tooltips-and-popovers`                                       | `product`    | `tests`      | many-to-many | medium   |
| `testing.testcasesketch.tests.product.feature`                       | `testing.testcasesketch.integration-graph-canvas-click-triggered-tooltips-visual-regression-dark-canvas-node-tooltip-ae769ce1`        | `product.feature.node-and-edge-tooltips-and-popovers`                                       | `product`    | `tests`      | many-to-many | medium   |
| `testing.testcasesketch.tests.product.feature`                       | `testing.testcasesketch.integration-graph-canvas-click-triggered-tooltips-visual-regression-light-canvas-edge-tooltip-586b3611`       | `product.feature.node-and-edge-tooltips-and-popovers`                                       | `product`    | `tests`      | many-to-many | medium   |
| `testing.testcasesketch.tests.product.feature`                       | `testing.testcasesketch.integration-graph-canvas-click-triggered-tooltips-visual-regression-light-canvas-node-tooltip-c7a8ef84`       | `product.feature.node-and-edge-tooltips-and-popovers`                                       | `product`    | `tests`      | many-to-many | medium   |
| `testing.testcasesketch.tests.product.feature`                       | `testing.testcasesketch.integration-graph-canvas-popover-components-accessibility-edge-popover-has-accessible-aria-label-on-958dbc53` | `product.feature.node-and-edge-tooltips-and-popovers`                                       | `product`    | `tests`      | many-to-many | medium   |
| `testing.testcasesketch.tests.product.feature`                       | `testing.testcasesketch.integration-graph-canvas-popover-components-accessibility-node-popover-has-accessible-aria-label-on-544f53ae` | `product.feature.node-and-edge-tooltips-and-popovers`                                       | `product`    | `tests`      | many-to-many | medium   |
| `testing.testcasesketch.tests.product.feature`                       | `testing.testcasesketch.integration-graph-canvas-popover-components-backward-compatibility-tooltips-edge-tooltip-still-d63b1bac`      | `product.feature.node-and-edge-tooltips-and-popovers`                                       | `product`    | `tests`      | many-to-many | medium   |
| `testing.testcasesketch.tests.product.feature`                       | `testing.testcasesketch.integration-graph-canvas-popover-components-backward-compatibility-tooltips-node-tooltip-still-22884350`      | `product.feature.node-and-edge-tooltips-and-popovers`                                       | `product`    | `tests`      | many-to-many | medium   |
| `testing.testcasesketch.tests.product.feature`                       | `testing.testcasesketch.integration-graph-canvas-popover-components-backward-compatibility-tooltips-only-one-tooltip-2e9122a7`        | `product.feature.node-and-edge-tooltips-and-popovers`                                       | `product`    | `tests`      | many-to-many | medium   |
| `testing.testcasesketch.tests.product.feature`                       | `testing.testcasesketch.integration-graph-canvas-popover-components-backward-compatibility-tooltips-tooltip-position-c11997c1`        | `product.feature.node-and-edge-tooltips-and-popovers`                                       | `product`    | `tests`      | many-to-many | medium   |
| `testing.testcasesketch.tests.product.feature`                       | `testing.testcasesketch.integration-graph-canvas-popover-components-edge-popover-edge-popover-closes-when-clicking-a-node`            | `product.feature.node-and-edge-tooltips-and-popovers`                                       | `product`    | `tests`      | many-to-many | medium   |
| `testing.testcasesketch.tests.product.feature`                       | `testing.testcasesketch.integration-graph-canvas-popover-components-edge-popover-edge-popover-closes-when-clicking-another-63b0fcf7`  | `product.feature.node-and-edge-tooltips-and-popovers`                                       | `product`    | `tests`      | many-to-many | medium   |
| `testing.testcasesketch.tests.product.feature`                       | `testing.testcasesketch.integration-graph-canvas-popover-components-edge-popover-edge-popover-contains-interactive-button`            | `product.feature.node-and-edge-tooltips-and-popovers`                                       | `product`    | `tests`      | many-to-many | medium   |
| `testing.testcasesketch.tests.product.feature`                       | `testing.testcasesketch.integration-graph-canvas-popover-components-edge-popover-edge-popover-displays-edge-label-and-743f38ad`       | `product.feature.node-and-edge-tooltips-and-popovers`                                       | `product`    | `tests`      | many-to-many | medium   |
| `testing.testcasesketch.tests.product.feature`                       | `testing.testcasesketch.integration-graph-canvas-popover-components-edge-popover-edge-popover-displays-weight-when-present`           | `product.feature.node-and-edge-tooltips-and-popovers`                                       | `product`    | `tests`      | many-to-many | medium   |
| `testing.testcasesketch.tests.product.feature`                       | `testing.testcasesketch.integration-graph-canvas-popover-components-edge-popover-edge-popover-renders-when-an-edge-is-938fe22f`       | `product.feature.node-and-edge-tooltips-and-popovers`                                       | `product`    | `tests`      | many-to-many | medium   |
| `testing.testcasesketch.tests.product.feature`                       | `testing.testcasesketch.integration-graph-canvas-popover-components-node-popover-node-popover-closes-when-clicking-the-d81099de`      | `product.feature.node-and-edge-tooltips-and-popovers`                                       | `product`    | `tests`      | many-to-many | medium   |
| `testing.testcasesketch.tests.product.feature`                       | `testing.testcasesketch.integration-graph-canvas-popover-components-node-popover-node-popover-contains-interactive-button`            | `product.feature.node-and-edge-tooltips-and-popovers`                                       | `product`    | `tests`      | many-to-many | medium   |
| `testing.testcasesketch.tests.product.feature`                       | `testing.testcasesketch.integration-graph-canvas-popover-components-node-popover-node-popover-contains-interactive-link`              | `product.feature.node-and-edge-tooltips-and-popovers`                                       | `product`    | `tests`      | many-to-many | medium   |
| `testing.testcasesketch.tests.product.feature`                       | `testing.testcasesketch.integration-graph-canvas-popover-components-node-popover-node-popover-displays-node-title-and-44358bc6`       | `product.feature.node-and-edge-tooltips-and-popovers`                                       | `product`    | `tests`      | many-to-many | medium   |
| `testing.testcasesketch.tests.product.feature`                       | `testing.testcasesketch.integration-graph-canvas-popover-components-node-popover-node-popover-renders-when-a-node-is-clicked`         | `product.feature.node-and-edge-tooltips-and-popovers`                                       | `product`    | `tests`      | many-to-many | medium   |
| `testing.testcasesketch.tests.product.feature`                       | `testing.testcasesketch.integration-graph-canvas-popover-components-node-popover-node-popover-tracks-pan-and-zoom-while-open`         | `product.feature.node-and-edge-tooltips-and-popovers`                                       | `product`    | `tests`      | many-to-many | medium   |
| `testing.testcasesketch.tests.product.feature`                       | `testing.testcasesketch.integration-graph-canvas-popover-components-popover-keyboard-outside-click-dismissal-edge-popover-dd4564ba`   | `product.feature.node-and-edge-tooltips-and-popovers`                                       | `product`    | `tests`      | many-to-many | medium   |
| `testing.testcasesketch.tests.product.feature`                       | `testing.testcasesketch.integration-graph-canvas-popover-components-popover-keyboard-outside-click-dismissal-node-popover-661e32ad`   | `product.feature.node-and-edge-tooltips-and-popovers`                                       | `product`    | `tests`      | many-to-many | medium   |
| `testing.testcasesketch.tests.product.feature`                       | `testing.testcasesketch.integration-graph-canvas-popover-components-popover-keyboard-outside-click-dismissal-node-popover-7d21f442`   | `product.feature.node-and-edge-tooltips-and-popovers`                                       | `product`    | `tests`      | many-to-many | medium   |
| `testing.testcasesketch.tests.product.feature`                       | `testing.testcasesketch.integration-graph-canvas-popover-components-popover-keyboard-outside-click-dismissal-node-popover-97016af2`   | `product.feature.node-and-edge-tooltips-and-popovers`                                       | `product`    | `tests`      | many-to-many | medium   |
| `testing.testcasesketch.tests.product.feature`                       | `testing.testcasesketch.integration-graph-canvas-popover-components-popover-keyboard-outside-click-dismissal-node-popover-f85a87d0`   | `product.feature.node-and-edge-tooltips-and-popovers`                                       | `product`    | `tests`      | many-to-many | medium   |
| `testing.testcasesketch.tests.product.feature`                       | `testing.testcasesketch.integration-graph-canvas-popover-components-tooltip-vs-popover-coexistence-hovering-tooltip-does-fb6f1d3c`    | `product.feature.node-and-edge-tooltips-and-popovers`                                       | `product`    | `tests`      | many-to-many | medium   |
| `testing.testcasesketch.tests.product.feature`                       | `testing.testcasesketch.integration-graph-canvas-popover-components-tooltip-vs-popover-coexistence-popover-remains-stable-cc31f11a`   | `product.feature.node-and-edge-tooltips-and-popovers`                                       | `product`    | `tests`      | many-to-many | medium   |
| `testing.testcasesketch.tests.product.feature`                       | `testing.testcasesketch.integration-graph-canvas-popover-components-visual-regression-dark-canvas-edge-popover-open-state-b4721989`   | `product.feature.node-and-edge-tooltips-and-popovers`                                       | `product`    | `tests`      | many-to-many | medium   |
| `testing.testcasesketch.tests.product.feature`                       | `testing.testcasesketch.integration-graph-canvas-popover-components-visual-regression-dark-canvas-node-popover-open-state-52aaca16`   | `product.feature.node-and-edge-tooltips-and-popovers`                                       | `product`    | `tests`      | many-to-many | medium   |
| `testing.testcasesketch.tests.product.feature`                       | `testing.testcasesketch.integration-graph-canvas-popover-components-visual-regression-dark-canvas-popover-with-interactive-27b51672`  | `product.feature.node-and-edge-tooltips-and-popovers`                                       | `product`    | `tests`      | many-to-many | medium   |
| `testing.testcasesketch.tests.product.feature`                       | `testing.testcasesketch.integration-graph-canvas-popover-components-visual-regression-light-canvas-edge-popover-open-state-5d301594`  | `product.feature.node-and-edge-tooltips-and-popovers`                                       | `product`    | `tests`      | many-to-many | medium   |
| `testing.testcasesketch.tests.product.feature`                       | `testing.testcasesketch.integration-graph-canvas-popover-components-visual-regression-light-canvas-node-popover-open-state-edd72184`  | `product.feature.node-and-edge-tooltips-and-popovers`                                       | `product`    | `tests`      | many-to-many | medium   |
| `testing.testcasesketch.tests.product.feature`                       | `testing.testcasesketch.integration-graph-canvas-popover-components-visual-regression-light-canvas-popover-with-interactive-505b383d` | `product.feature.node-and-edge-tooltips-and-popovers`                                       | `product`    | `tests`      | many-to-many | medium   |
| `testing.testcoveragetarget.covers.product.feature`                  | `testing.testcoveragetarget.galaxy-layout-and-live-simulation`                                                                        | `product.feature.live-draggable-galaxy-simulation`                                          | `product`    | `covers`     | many-to-many | medium   |
| `testing.testcoveragetarget.covers.product.feature`                  | `testing.testcoveragetarget.graph-canvas-rendering-and-interaction`                                                                   | `product.feature.node-and-edge-tooltips-and-popovers`                                       | `product`    | `covers`     | many-to-many | medium   |

## Element Reference

### Edge Selection and Inspection {#edge-selection-and-inspection}

**ID**: `product.feature.edge-selection-and-inspection`

**Type**: `feature`

Edges are hoverable and selectable like nodes, with tooltips and GraphEdgeInspector for the selected edge.

#### Attributes

| Name     | Value     |
| -------- | --------- |
| priority | medium    |
| status   | delivered |

#### Relationships

| Type        | Related Element                      | Predicate | Direction |
| ----------- | ------------------------------------ | --------- | --------- |
| inter-layer | `api.operation.graph-canvas`         | `exposes` | inbound   |
| inter-layer | `api.operation.graph-edge-inspector` | `exposes` | inbound   |

### Fullscreen Canvas {#fullscreen-canvas}

**ID**: `product.feature.fullscreen-canvas`

**Type**: `feature`

GraphToolbar toggles fullscreen on the canvas or on a caller-chosen container (fullscreenContainerRef), refitting the view after the change.

#### Attributes

| Name     | Value     |
| -------- | --------- |
| priority | medium    |
| status   | delivered |

#### Relationships

| Type        | Related Element               | Predicate | Direction |
| ----------- | ----------------------------- | --------- | --------- |
| inter-layer | `api.operation.graph-toolbar` | `exposes` | inbound   |

### Layout Progress Indicator {#layout-progress-indicator}

**ID**: `product.feature.layout-progress-indicator`

**Type**: `feature`

GraphCanvas reports idle/computing/simulating through onLayoutStateChange and can show a built-in indicator (showLayoutIndicator) while a large layout computes.

#### Attributes

| Name     | Value     |
| -------- | --------- |
| priority | medium    |
| status   | delivered |

#### Relationships

| Type        | Related Element              | Predicate | Direction |
| ----------- | ---------------------------- | --------- | --------- |
| inter-layer | `api.operation.graph-canvas` | `exposes` | inbound   |

### Live Draggable Galaxy Simulation {#live-draggable-galaxy-simulation}

**ID**: `product.feature.live-draggable-galaxy-simulation`

**Type**: `feature`

Opt-in continuous elastic simulation for galaxy layout, so dragging a node repositions its subtree in real time instead of freezing after one computed layout.

#### Attributes

| Name     | Value     |
| -------- | --------- |
| priority | medium    |
| size     | m         |
| status   | delivered |

#### Relationships

| Type        | Related Element                                                 | Predicate  | Direction |
| ----------- | --------------------------------------------------------------- | ---------- | --------- |
| inter-layer | `api.operation.graph-canvas`                                    | `exposes`  | inbound   |
| inter-layer | `api.operation.graph-toolbar`                                   | `exposes`  | inbound   |
| inter-layer | `application.applicationservice.live-galaxy-simulation-service` | `realizes` | inbound   |
| inter-layer | `testing.testcoveragetarget.galaxy-layout-and-live-simulation`  | `covers`   | inbound   |
| intra-layer | `product.softwarecapability.galaxy-radial-orbit-layout`         | `realizes` | outbound  |
| intra-layer | `product.persona.application-developer-embedding-a-graph-view`  | `serves`   | outbound  |

### Node and Edge Tooltips and Popovers {#node-and-edge-tooltips-and-popovers}

**ID**: `product.feature.node-and-edge-tooltips-and-popovers`

**Type**: `feature`

Render-prop tooltip/popover overlays anchored to a hovered/clicked node or edge, positioned via the canvas's own pan/zoom transform.

#### Attributes

| Name     | Value     |
| -------- | --------- |
| priority | low       |
| size     | s         |
| status   | delivered |

#### Relationships

| Type        | Related Element                                                                                                                       | Predicate  | Direction |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------- | ---------- | --------- |
| inter-layer | `api.operation.graph-canvas`                                                                                                          | `exposes`  | inbound   |
| inter-layer | `testing.testcasesketch.graph-canvas-hover-tooltip-placement-323-edge-tooltip-waits-for-tooltip-delay-before-showing`                 | `tests`    | inbound   |
| inter-layer | `testing.testcasesketch.graph-canvas-hover-tooltip-placement-323-labelled-edge-near-the-canvas-top-tooltip-flips-below-the-2326f2d8`  | `tests`    | inbound   |
| inter-layer | `testing.testcasesketch.graph-canvas-hover-tooltip-placement-323-labelled-edge-tooltip-sits-above-the-label-without-a1ce7be4`         | `tests`    | inbound   |
| inter-layer | `testing.testcasesketch.graph-canvas-hover-tooltip-placement-323-labelled-vertical-edge-tooltip-clears-the-label-and-stays-35a5e023`  | `tests`    | inbound   |
| inter-layer | `testing.testcasesketch.graph-canvas-hover-tooltip-placement-323-node-tooltip-uses-the-same-tooltip-delay`                            | `tests`    | inbound   |
| inter-layer | `testing.testcasesketch.graph-canvas-hover-tooltip-placement-323-tooltip-stays-clear-of-the-label-while-the-canvas-zooms`             | `tests`    | inbound   |
| inter-layer | `testing.testcasesketch.graph-canvas-hover-tooltip-placement-323-unlabelled-edge-tooltip-anchors-at-the-path-midpoint`                | `tests`    | inbound   |
| inter-layer | `testing.testcasesketch.graph-canvas-hover-tooltip-placement-layer-lanes-323-link-with-a-predicate-pill-tooltip-sits-beside-742ff016` | `tests`    | inbound   |
| inter-layer | `testing.testcasesketch.graph-canvas-hover-tooltip-placement-layer-lanes-323-link-without-a-pill-tooltip-anchors-on-the-208a5652`     | `tests`    | inbound   |
| inter-layer | `testing.testcasesketch.integration-graph-canvas-click-triggered-tooltips-accessibility-click-tooltips-edge-tooltip-1c7b4a8b`         | `tests`    | inbound   |
| inter-layer | `testing.testcasesketch.integration-graph-canvas-click-triggered-tooltips-accessibility-click-tooltips-node-tooltip-d96b5908`         | `tests`    | inbound   |
| inter-layer | `testing.testcasesketch.integration-graph-canvas-click-triggered-tooltips-edge-click-triggered-tooltip-edge-tooltip-010240b0`         | `tests`    | inbound   |
| inter-layer | `testing.testcasesketch.integration-graph-canvas-click-triggered-tooltips-edge-click-triggered-tooltip-edge-tooltip-8fa2ed26`         | `tests`    | inbound   |
| inter-layer | `testing.testcasesketch.integration-graph-canvas-click-triggered-tooltips-edge-click-triggered-tooltip-edge-tooltip-bba8bea1`         | `tests`    | inbound   |
| inter-layer | `testing.testcasesketch.integration-graph-canvas-click-triggered-tooltips-edge-click-triggered-tooltip-edge-tooltip-bddcdc0f`         | `tests`    | inbound   |
| inter-layer | `testing.testcasesketch.integration-graph-canvas-click-triggered-tooltips-edge-click-triggered-tooltip-edge-tooltip-d0be90d5`         | `tests`    | inbound   |
| inter-layer | `testing.testcasesketch.integration-graph-canvas-click-triggered-tooltips-edge-click-triggered-tooltip-edge-tooltip-d8faa9f5`         | `tests`    | inbound   |
| inter-layer | `testing.testcasesketch.integration-graph-canvas-click-triggered-tooltips-fallback-logic-verification-edge-tooltip-2824a7e1`          | `tests`    | inbound   |
| inter-layer | `testing.testcasesketch.integration-graph-canvas-click-triggered-tooltips-fallback-logic-verification-node-tooltip-92229b2c`          | `tests`    | inbound   |
| inter-layer | `testing.testcasesketch.integration-graph-canvas-click-triggered-tooltips-node-and-edge-click-interaction-clicking-a-node-36f273d4`   | `tests`    | inbound   |
| inter-layer | `testing.testcasesketch.integration-graph-canvas-click-triggered-tooltips-node-and-edge-click-interaction-clicking-an-edge-7c445a59`  | `tests`    | inbound   |
| inter-layer | `testing.testcasesketch.integration-graph-canvas-click-triggered-tooltips-node-click-triggered-tooltip-node-tooltip-139567d4`         | `tests`    | inbound   |
| inter-layer | `testing.testcasesketch.integration-graph-canvas-click-triggered-tooltips-node-click-triggered-tooltip-node-tooltip-1ad18bf2`         | `tests`    | inbound   |
| inter-layer | `testing.testcasesketch.integration-graph-canvas-click-triggered-tooltips-node-click-triggered-tooltip-node-tooltip-2f81a513`         | `tests`    | inbound   |
| inter-layer | `testing.testcasesketch.integration-graph-canvas-click-triggered-tooltips-node-click-triggered-tooltip-node-tooltip-4e5faaa0`         | `tests`    | inbound   |
| inter-layer | `testing.testcasesketch.integration-graph-canvas-click-triggered-tooltips-node-click-triggered-tooltip-node-tooltip-c1e53013`         | `tests`    | inbound   |
| inter-layer | `testing.testcasesketch.integration-graph-canvas-click-triggered-tooltips-visual-regression-dark-canvas-edge-tooltip-3ee5cdec`        | `tests`    | inbound   |
| inter-layer | `testing.testcasesketch.integration-graph-canvas-click-triggered-tooltips-visual-regression-dark-canvas-node-tooltip-ae769ce1`        | `tests`    | inbound   |
| inter-layer | `testing.testcasesketch.integration-graph-canvas-click-triggered-tooltips-visual-regression-light-canvas-edge-tooltip-586b3611`       | `tests`    | inbound   |
| inter-layer | `testing.testcasesketch.integration-graph-canvas-click-triggered-tooltips-visual-regression-light-canvas-node-tooltip-c7a8ef84`       | `tests`    | inbound   |
| inter-layer | `testing.testcasesketch.integration-graph-canvas-popover-components-accessibility-edge-popover-has-accessible-aria-label-on-958dbc53` | `tests`    | inbound   |
| inter-layer | `testing.testcasesketch.integration-graph-canvas-popover-components-accessibility-node-popover-has-accessible-aria-label-on-544f53ae` | `tests`    | inbound   |
| inter-layer | `testing.testcasesketch.integration-graph-canvas-popover-components-backward-compatibility-tooltips-edge-tooltip-still-d63b1bac`      | `tests`    | inbound   |
| inter-layer | `testing.testcasesketch.integration-graph-canvas-popover-components-backward-compatibility-tooltips-node-tooltip-still-22884350`      | `tests`    | inbound   |
| inter-layer | `testing.testcasesketch.integration-graph-canvas-popover-components-backward-compatibility-tooltips-only-one-tooltip-2e9122a7`        | `tests`    | inbound   |
| inter-layer | `testing.testcasesketch.integration-graph-canvas-popover-components-backward-compatibility-tooltips-tooltip-position-c11997c1`        | `tests`    | inbound   |
| inter-layer | `testing.testcasesketch.integration-graph-canvas-popover-components-edge-popover-edge-popover-closes-when-clicking-a-node`            | `tests`    | inbound   |
| inter-layer | `testing.testcasesketch.integration-graph-canvas-popover-components-edge-popover-edge-popover-closes-when-clicking-another-63b0fcf7`  | `tests`    | inbound   |
| inter-layer | `testing.testcasesketch.integration-graph-canvas-popover-components-edge-popover-edge-popover-contains-interactive-button`            | `tests`    | inbound   |
| inter-layer | `testing.testcasesketch.integration-graph-canvas-popover-components-edge-popover-edge-popover-displays-edge-label-and-743f38ad`       | `tests`    | inbound   |
| inter-layer | `testing.testcasesketch.integration-graph-canvas-popover-components-edge-popover-edge-popover-displays-weight-when-present`           | `tests`    | inbound   |
| inter-layer | `testing.testcasesketch.integration-graph-canvas-popover-components-edge-popover-edge-popover-renders-when-an-edge-is-938fe22f`       | `tests`    | inbound   |
| inter-layer | `testing.testcasesketch.integration-graph-canvas-popover-components-node-popover-node-popover-closes-when-clicking-the-d81099de`      | `tests`    | inbound   |
| inter-layer | `testing.testcasesketch.integration-graph-canvas-popover-components-node-popover-node-popover-contains-interactive-button`            | `tests`    | inbound   |
| inter-layer | `testing.testcasesketch.integration-graph-canvas-popover-components-node-popover-node-popover-contains-interactive-link`              | `tests`    | inbound   |
| inter-layer | `testing.testcasesketch.integration-graph-canvas-popover-components-node-popover-node-popover-displays-node-title-and-44358bc6`       | `tests`    | inbound   |
| inter-layer | `testing.testcasesketch.integration-graph-canvas-popover-components-node-popover-node-popover-renders-when-a-node-is-clicked`         | `tests`    | inbound   |
| inter-layer | `testing.testcasesketch.integration-graph-canvas-popover-components-node-popover-node-popover-tracks-pan-and-zoom-while-open`         | `tests`    | inbound   |
| inter-layer | `testing.testcasesketch.integration-graph-canvas-popover-components-popover-keyboard-outside-click-dismissal-edge-popover-dd4564ba`   | `tests`    | inbound   |
| inter-layer | `testing.testcasesketch.integration-graph-canvas-popover-components-popover-keyboard-outside-click-dismissal-node-popover-661e32ad`   | `tests`    | inbound   |
| inter-layer | `testing.testcasesketch.integration-graph-canvas-popover-components-popover-keyboard-outside-click-dismissal-node-popover-7d21f442`   | `tests`    | inbound   |
| inter-layer | `testing.testcasesketch.integration-graph-canvas-popover-components-popover-keyboard-outside-click-dismissal-node-popover-97016af2`   | `tests`    | inbound   |
| inter-layer | `testing.testcasesketch.integration-graph-canvas-popover-components-popover-keyboard-outside-click-dismissal-node-popover-f85a87d0`   | `tests`    | inbound   |
| inter-layer | `testing.testcasesketch.integration-graph-canvas-popover-components-tooltip-vs-popover-coexistence-hovering-tooltip-does-fb6f1d3c`    | `tests`    | inbound   |
| inter-layer | `testing.testcasesketch.integration-graph-canvas-popover-components-tooltip-vs-popover-coexistence-popover-remains-stable-cc31f11a`   | `tests`    | inbound   |
| inter-layer | `testing.testcasesketch.integration-graph-canvas-popover-components-visual-regression-dark-canvas-edge-popover-open-state-b4721989`   | `tests`    | inbound   |
| inter-layer | `testing.testcasesketch.integration-graph-canvas-popover-components-visual-regression-dark-canvas-node-popover-open-state-52aaca16`   | `tests`    | inbound   |
| inter-layer | `testing.testcasesketch.integration-graph-canvas-popover-components-visual-regression-dark-canvas-popover-with-interactive-27b51672`  | `tests`    | inbound   |
| inter-layer | `testing.testcasesketch.integration-graph-canvas-popover-components-visual-regression-light-canvas-edge-popover-open-state-5d301594`  | `tests`    | inbound   |
| inter-layer | `testing.testcasesketch.integration-graph-canvas-popover-components-visual-regression-light-canvas-node-popover-open-state-edd72184`  | `tests`    | inbound   |
| inter-layer | `testing.testcasesketch.integration-graph-canvas-popover-components-visual-regression-light-canvas-popover-with-interactive-505b383d` | `tests`    | inbound   |
| inter-layer | `testing.testcoveragetarget.graph-canvas-rendering-and-interaction`                                                                   | `covers`   | inbound   |
| intra-layer | `product.softwarecapability.interactive-graph-exploration`                                                                            | `realizes` | outbound  |
| intra-layer | `product.persona.end-user-exploring-a-rendered-graph`                                                                                 | `serves`   | outbound  |

### Progressive Disclosure via Node Collapse/Expand {#progressive-disclosure-via-node-collapse-expand}

**ID**: `product.feature.progressive-disclosure-via-node-collapseexpand`

**Type**: `feature`

Collapse a node to hide its structural descendants (and their edges) for dense hierarchies, with a hidden-descendant-count badge.

#### Attributes

| Name     | Value     |
| -------- | --------- |
| priority | medium    |
| size     | s         |
| status   | delivered |

#### Relationships

| Type        | Related Element                                            | Predicate  | Direction |
| ----------- | ---------------------------------------------------------- | ---------- | --------- |
| inter-layer | `api.operation.graph-canvas`                               | `exposes`  | inbound   |
| inter-layer | `api.operation.graph-collapse-control`                     | `exposes`  | inbound   |
| intra-layer | `product.softwarecapability.interactive-graph-exploration` | `realizes` | outbound  |
| intra-layer | `product.persona.end-user-exploring-a-rendered-graph`      | `serves`   | outbound  |

### Viewport History and Restore {#viewport-history-and-restore}

**ID**: `product.feature.viewport-history-and-restore`

**Type**: `feature`

Callers can restore a viewport (initialViewport), drive it imperatively (viewportRef handle) and keep back/forward history from dwell and navigate events.

#### Attributes

| Name     | Value     |
| -------- | --------- |
| priority | medium    |
| status   | delivered |

#### Relationships

| Type        | Related Element              | Predicate | Direction |
| ----------- | ---------------------------- | --------- | --------- |
| inter-layer | `api.operation.graph-canvas` | `exposes` | inbound   |

### Application Developer Embedding a Graph View {#application-developer-embedding-a-graph-view}

**ID**: `product.persona.application-developer-embedding-a-graph-view`

**Type**: `persona`

Inferred persona: a React/TypeScript developer integrating GraphCanvas into their own product, choosing layout mode and supplying data/callbacks.

#### Attributes

| Name        | Value    |
| ----------- | -------- |
| category    | primary  |
| proficiency | advanced |

#### Relationships

| Type        | Related Element                                                       | Predicate    | Direction |
| ----------- | --------------------------------------------------------------------- | ------------ | --------- |
| inter-layer | `motivation.stakeholder.embedding-application-developer-npm-consumer` | `references` | outbound  |
| intra-layer | `product.feature.live-draggable-galaxy-simulation`                    | `serves`     | inbound   |

### End User Exploring a Rendered Graph {#end-user-exploring-a-rendered-graph}

**ID**: `product.persona.end-user-exploring-a-rendered-graph`

**Type**: `persona`

Inferred persona: the person who ultimately interacts with the rendered graph (pan/zoom/select/hover/drag/collapse) without knowledge of the underlying library.

#### Attributes

| Name        | Value  |
| ----------- | ------ |
| category    | served |
| proficiency | novice |

#### Relationships

| Type        | Related Element                                                  | Predicate    | Direction |
| ----------- | ---------------------------------------------------------------- | ------------ | --------- |
| inter-layer | `motivation.stakeholder.end-user-of-an-embedding-application`    | `references` | outbound  |
| intra-layer | `product.feature.node-and-edge-tooltips-and-popovers`            | `serves`     | inbound   |
| intra-layer | `product.feature.progressive-disclosure-via-node-collapseexpand` | `serves`     | inbound   |

### App Navigation {#app-navigation}

**ID**: `product.softwarecapability.app-navigation`

**Type**: `softwarecapability`

Shipped capability: Nav items, sidebar, topbar and tab bar for moving between an app's areas.

#### Attributes

| Name   | Value     |
| ------ | --------- |
| status | delivered |

#### Relationships

| Type        | Related Element                                                             | Predicate  | Direction |
| ----------- | --------------------------------------------------------------------------- | ---------- | --------- |
| inter-layer | `application.applicationservice.navigation-components`                      | `realizes` | inbound   |
| inter-layer | `motivation.goal.one-consistent-ide-density-ui-across-heimdall-based-tools` | `supports` | outbound  |

### App Shell {#app-shell}

**ID**: `product.softwarecapability.app-shell`

**Type**: `softwarecapability`

Shipped capability: Titlebar, statusbar, app title and the ShellLayout that composes the IDE chrome.

#### Attributes

| Name   | Value     |
| ------ | --------- |
| status | delivered |

#### Relationships

| Type        | Related Element                                                             | Predicate  | Direction |
| ----------- | --------------------------------------------------------------------------- | ---------- | --------- |
| inter-layer | `application.applicationservice.app-shell-components`                       | `realizes` | inbound   |
| inter-layer | `motivation.goal.one-consistent-ide-density-ui-across-heimdall-based-tools` | `supports` | outbound  |

### Charting {#charting}

**ID**: `product.softwarecapability.charting`

**Type**: `softwarecapability`

Shipped capability: Sparklines, line, bar, stacked and donut charts, heatmaps, status timelines, progress bars and metric rows.

#### Attributes

| Name   | Value     |
| ------ | --------- |
| status | delivered |

#### Relationships

| Type        | Related Element                                                             | Predicate  | Direction |
| ----------- | --------------------------------------------------------------------------- | ---------- | --------- |
| inter-layer | `application.applicationservice.chart-components`                           | `realizes` | inbound   |
| inter-layer | `motivation.goal.one-consistent-ide-density-ui-across-heimdall-based-tools` | `supports` | outbound  |

### Chat UI {#chat-ui}

**ID**: `product.softwarecapability.chat-ui`

**Type**: `softwarecapability`

Shipped capability: Chat messages with tool and thinking blocks, markdown content, suggestions, composer and container.

#### Attributes

| Name   | Value     |
| ------ | --------- |
| status | delivered |

#### Relationships

| Type        | Related Element                                                             | Predicate  | Direction |
| ----------- | --------------------------------------------------------------------------- | ---------- | --------- |
| inter-layer | `application.applicationservice.chat-components`                            | `realizes` | inbound   |
| inter-layer | `motivation.goal.one-consistent-ide-density-ui-across-heimdall-based-tools` | `supports` | outbound  |

### Clustered Force Layout (Community Bubbles) {#clustered-force-layout-community-bubbles}

**ID**: `product.softwarecapability.clustered-force-layout-community-bubbles`

**Type**: `softwarecapability`

Shipped capability: nested-bubble layout grouping nodes by Louvain community structure.

#### Attributes

| Name   | Value     |
| ------ | --------- |
| status | delivered |

#### Relationships

| Type        | Related Element                                                                             | Predicate    | Direction |
| ----------- | ------------------------------------------------------------------------------------------- | ------------ | --------- |
| inter-layer | `application.applicationservice.graph-layout-engine-service`                                | `realizes`   | inbound   |
| inter-layer | `business.businessfunction.community-and-cluster-discovery-in-relationship-graphs`          | `realizes`   | outbound  |
| inter-layer | `motivation.requirement.layout-engines-must-be-pluggable-without-breaking-existing-callers` | `satisfies`  | outbound  |
| inter-layer | `motivation.goal.layout-algorithms-that-scale-to-large-dense-and-pathological-graphs`       | `supports`   | outbound  |
| intra-layer | `product.softwarecapability.force-directed-graph-layout`                                    | `aggregates` | outbound  |
| intra-layer | `product.softwarecapability.force-directed-graph-layout`                                    | `depends-on` | outbound  |

### Data Display {#data-display}

**ID**: `product.softwarecapability.data-display`

**Type**: `softwarecapability`

Shipped capability: Stat tiles and grids, tables, key-value grids, inspector panels, result and asset cards, and the map canvas.

#### Attributes

| Name   | Value     |
| ------ | --------- |
| status | delivered |

#### Relationships

| Type        | Related Element                                                             | Predicate  | Direction |
| ----------- | --------------------------------------------------------------------------- | ---------- | --------- |
| inter-layer | `application.applicationservice.data-display-components`                    | `realizes` | inbound   |
| inter-layer | `motivation.goal.one-consistent-ide-density-ui-across-heimdall-based-tools` | `supports` | outbound  |

### Force-Directed Graph Layout {#force-directed-graph-layout}

**ID**: `product.softwarecapability.force-directed-graph-layout`

**Type**: `softwarecapability`

Shipped capability: spring/repulsion-based automatic layout for arbitrary node/edge graphs.

#### Attributes

| Name   | Value     |
| ------ | --------- |
| status | delivered |

#### Relationships

| Type        | Related Element                                                       | Predicate    | Direction |
| ----------- | --------------------------------------------------------------------- | ------------ | --------- |
| inter-layer | `application.applicationservice.graph-layout-engine-service`          | `realizes`   | inbound   |
| inter-layer | `business.businessfunction.automatic-node-layout-computation`         | `realizes`   | outbound  |
| inter-layer | `motivation.goal.readable-layout-for-structurally-complex-graphs`     | `supports`   | outbound  |
| intra-layer | `product.softwarecapability.clustered-force-layout-community-bubbles` | `aggregates` | inbound   |
| intra-layer | `product.softwarecapability.clustered-force-layout-community-bubbles` | `depends-on` | inbound   |

### Form Input {#form-input}

**ID**: `product.softwarecapability.form-input`

**Type**: `softwarecapability`

Shipped capability: Text, number, select, tri-state and structured inputs (pickers, key-value and relationship editors) with field labels and errors.

#### Attributes

| Name   | Value     |
| ------ | --------- |
| status | delivered |

#### Relationships

| Type        | Related Element                                                             | Predicate  | Direction |
| ----------- | --------------------------------------------------------------------------- | ---------- | --------- |
| inter-layer | `application.applicationservice.form-input-components`                      | `realizes` | inbound   |
| inter-layer | `motivation.goal.one-consistent-ide-density-ui-across-heimdall-based-tools` | `supports` | outbound  |

### Galaxy Radial Orbit Layout {#galaxy-radial-orbit-layout}

**ID**: `product.softwarecapability.galaxy-radial-orbit-layout`

**Type**: `softwarecapability`

Shipped capability: radial hierarchy-of-orbits layout for structural trees/forests.

#### Attributes

| Name   | Value     |
| ------ | --------- |
| status | delivered |

#### Relationships

| Type        | Related Element                                                   | Predicate  | Direction |
| ----------- | ----------------------------------------------------------------- | ---------- | --------- |
| inter-layer | `application.applicationservice.graph-layout-engine-service`      | `realizes` | inbound   |
| inter-layer | `business.businessfunction.automatic-node-layout-computation`     | `realizes` | outbound  |
| inter-layer | `motivation.goal.readable-layout-for-structurally-complex-graphs` | `supports` | outbound  |
| intra-layer | `product.feature.live-draggable-galaxy-simulation`                | `realizes` | inbound   |

### Interactive Graph Exploration {#interactive-graph-exploration}

**ID**: `product.softwarecapability.interactive-graph-exploration`

**Type**: `softwarecapability`

What the canvas lets an end user do with a laid-out graph in place: hide and reveal structural descendants, and read node and edge detail on demand through tooltips and popovers. Inferred from GraphCanvas's collapsedNodeIds and renderTooltip/renderPopover props.

#### Attributes

| Name   | Value     |
| ------ | --------- |
| status | delivered |

#### Relationships

| Type        | Related Element                                                   | Predicate  | Direction |
| ----------- | ----------------------------------------------------------------- | ---------- | --------- |
| inter-layer | `application.applicationservice.interactive-graph-rendering`      | `realizes` | inbound   |
| inter-layer | `motivation.goal.readable-layout-for-structurally-complex-graphs` | `supports` | outbound  |
| intra-layer | `product.feature.node-and-edge-tooltips-and-popovers`             | `realizes` | inbound   |
| intra-layer | `product.feature.progressive-disclosure-via-node-collapseexpand`  | `realizes` | inbound   |

### Layer Lanes Layout {#layer-lanes-layout}

**ID**: `product.softwarecapability.layer-lanes-layout`

**Type**: `softwarecapability`

GraphCanvas layout layer-lanes: the layered-graph swimlane view inside GraphCanvas, one lane per layer, driven by useLayeredGraph.

#### Attributes

| Name   | Value     |
| ------ | --------- |
| status | delivered |

#### Relationships

| Type        | Related Element                                               | Predicate  | Direction |
| ----------- | ------------------------------------------------------------- | ---------- | --------- |
| inter-layer | `application.applicationservice.graph-layout-engine-service`  | `realizes` | inbound   |
| inter-layer | `business.businessfunction.automatic-node-layout-computation` | `realizes` | outbound  |

### Layered Graph Visualization {#layered-graph-visualization}

**ID**: `product.softwarecapability.layered-graph-visualization`

**Type**: `softwarecapability`

Shipped capability: Views of a graph whose nodes belong to layers: a 3D layer stack, swimlanes, adjacency matrix and hive plot, with reach, filtering and camera controls.

#### Attributes

| Name   | Value     |
| ------ | --------- |
| status | delivered |

#### Relationships

| Type        | Related Element                                                             | Predicate  | Direction |
| ----------- | --------------------------------------------------------------------------- | ---------- | --------- |
| inter-layer | `application.applicationservice.layered-graph-visualization`                | `realizes` | inbound   |
| inter-layer | `motivation.goal.one-consistent-ide-density-ui-across-heimdall-based-tools` | `supports` | outbound  |
| inter-layer | `motivation.goal.readable-layout-for-structurally-complex-graphs`           | `supports` | outbound  |

### Organic Graph Layout {#organic-graph-layout}

**ID**: `product.softwarecapability.organic-graph-layout`

**Type**: `softwarecapability`

GraphCanvas layout organic: stress-majorization layout, successor to force, with the node margin as a hard minimum gap.

#### Attributes

| Name   | Value     |
| ------ | --------- |
| status | delivered |

#### Relationships

| Type        | Related Element                                               | Predicate  | Direction |
| ----------- | ------------------------------------------------------------- | ---------- | --------- |
| inter-layer | `application.applicationservice.graph-layout-engine-service`  | `realizes` | inbound   |
| inter-layer | `business.businessfunction.automatic-node-layout-computation` | `realizes` | outbound  |

### Orthogonal Graph Layout {#orthogonal-graph-layout}

**ID**: `product.softwarecapability.orthogonal-graph-layout`

**Type**: `softwarecapability`

GraphCanvas layout orthogonal: nodes on a cell grid layered from a BFS spanning tree, edges routed at right angles through channels.

#### Attributes

| Name   | Value     |
| ------ | --------- |
| status | delivered |

#### Relationships

| Type        | Related Element                                               | Predicate  | Direction |
| ----------- | ------------------------------------------------------------- | ---------- | --------- |
| inter-layer | `application.applicationservice.graph-layout-engine-service`  | `realizes` | inbound   |
| inter-layer | `business.businessfunction.automatic-node-layout-computation` | `realizes` | outbound  |

### Overlays and Dialogs {#overlays-and-dialogs}

**ID**: `product.softwarecapability.overlays-and-dialogs`

**Type**: `softwarecapability`

Shipped capability: Modals, confirm dialogs, toasts, tooltips, popovers, drawers, the command palette and the workspace switcher.

#### Attributes

| Name   | Value     |
| ------ | --------- |
| status | delivered |

#### Relationships

| Type        | Related Element                                                             | Predicate  | Direction |
| ----------- | --------------------------------------------------------------------------- | ---------- | --------- |
| inter-layer | `application.applicationservice.overlay-components`                         | `realizes` | inbound   |
| inter-layer | `motivation.goal.one-consistent-ide-density-ui-across-heimdall-based-tools` | `supports` | outbound  |

### Page Patterns {#page-patterns}

**ID**: `product.softwarecapability.page-patterns`

**Type**: `softwarecapability`

Shipped capability: Page headers, filter bars, activity timelines, alert strips, quick-access tiles, config and pipeline cards, row menus.

#### Attributes

| Name   | Value     |
| ------ | --------- |
| status | delivered |

#### Relationships

| Type        | Related Element                                                             | Predicate  | Direction |
| ----------- | --------------------------------------------------------------------------- | ---------- | --------- |
| inter-layer | `application.applicationservice.page-pattern-components`                    | `realizes` | inbound   |
| inter-layer | `motivation.goal.one-consistent-ide-density-ui-across-heimdall-based-tools` | `supports` | outbound  |

### Planning and Scheduling {#planning-and-scheduling}

**ID**: `product.softwarecapability.planning-and-scheduling`

**Type**: `softwarecapability`

Shipped capability: Calendar, mini calendar and kanban board.

#### Attributes

| Name   | Value     |
| ------ | --------- |
| status | delivered |

#### Relationships

| Type        | Related Element                                                             | Predicate  | Direction |
| ----------- | --------------------------------------------------------------------------- | ---------- | --------- |
| inter-layer | `application.applicationservice.planning-components`                        | `realizes` | inbound   |
| inter-layer | `motivation.goal.one-consistent-ide-density-ui-across-heimdall-based-tools` | `supports` | outbound  |

### Radial Tree Layout {#radial-tree-layout}

**ID**: `product.softwarecapability.radial-tree-layout`

**Type**: `softwarecapability`

Shipped capability: concentric-ring radial tree layout with multi-trunk packing.

#### Attributes

| Name   | Value     |
| ------ | --------- |
| status | delivered |

#### Relationships

| Type        | Related Element                                                   | Predicate  | Direction |
| ----------- | ----------------------------------------------------------------- | ---------- | --------- |
| inter-layer | `application.applicationservice.graph-layout-engine-service`      | `realizes` | inbound   |
| inter-layer | `business.businessfunction.automatic-node-layout-computation`     | `realizes` | outbound  |
| inter-layer | `motivation.goal.readable-layout-for-structurally-complex-graphs` | `supports` | outbound  |

### Responsive Layout {#responsive-layout}

**ID**: `product.softwarecapability.responsive-layout`

**Type**: `softwarecapability`

Shipped capability: Panels, resizable split panes and media-query driven layout.

#### Attributes

| Name   | Value     |
| ------ | --------- |
| status | delivered |

#### Relationships

| Type        | Related Element                                                             | Predicate  | Direction |
| ----------- | --------------------------------------------------------------------------- | ---------- | --------- |
| inter-layer | `application.applicationservice.layout-components`                          | `realizes` | inbound   |
| inter-layer | `motivation.goal.one-consistent-ide-density-ui-across-heimdall-based-tools` | `supports` | outbound  |

### Run History and Observability Views {#run-history-and-observability-views}

**ID**: `product.softwarecapability.run-history-and-observability-views`

**Type**: `softwarecapability`

Shipped capability: Trace viewer, log stream, diff viewers, version timeline and lineage rail, with OTLP and X-Ray trace adapters.

#### Attributes

| Name   | Value     |
| ------ | --------- |
| status | delivered |

#### Relationships

| Type        | Related Element                                                             | Predicate  | Direction |
| ----------- | --------------------------------------------------------------------------- | ---------- | --------- |
| inter-layer | `application.applicationservice.observability-view-components`              | `realizes` | inbound   |
| inter-layer | `motivation.goal.one-consistent-ide-density-ui-across-heimdall-based-tools` | `supports` | outbound  |

### UI Primitives {#ui-primitives}

**ID**: `product.softwarecapability.ui-primitives`

**Type**: `softwarecapability`

Shipped capability: Icons, buttons, chips, badges, avatars and segmented controls every other component builds on.

#### Attributes

| Name   | Value     |
| ------ | --------- |
| status | delivered |

#### Relationships

| Type        | Related Element                                                             | Predicate  | Direction |
| ----------- | --------------------------------------------------------------------------- | ---------- | --------- |
| inter-layer | `application.applicationservice.primitive-components`                       | `realizes` | inbound   |
| inter-layer | `motivation.goal.one-consistent-ide-density-ui-across-heimdall-based-tools` | `supports` | outbound  |

### UX Navigation Tree Layout {#ux-navigation-tree-layout}

**ID**: `product.softwarecapability.ux-navigation-tree-layout`

**Type**: `softwarecapability`

Shipped capability: page-tree + view-fan layout for visualizing page/view navigation structures.

#### Attributes

| Name   | Value     |
| ------ | --------- |
| status | delivered |

#### Relationships

| Type        | Related Element                                                   | Predicate  | Direction |
| ----------- | ----------------------------------------------------------------- | ---------- | --------- |
| inter-layer | `application.applicationservice.graph-layout-engine-service`      | `realizes` | inbound   |
| inter-layer | `business.businessfunction.automatic-node-layout-computation`     | `realizes` | outbound  |
| inter-layer | `motivation.goal.readable-layout-for-structurally-complex-graphs` | `supports` | outbound  |

---

Generated: 2026-11-24T13:25:05.973Z | Model Version: 0.1.0
