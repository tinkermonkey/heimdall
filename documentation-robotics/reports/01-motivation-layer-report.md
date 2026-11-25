# Motivation

[← Back to README](../README.md)

Goals, requirements, drivers, and strategic outcomes of the architecture.

## Report Index

- [Layer Introduction](#layer-introduction)
- [Intra-Layer Relationships](#intra-layer-relationships)
- [Inter-Layer Dependencies](#inter-layer-dependencies)
- [Inter-Layer Relationships Table](#inter-layer-relationships-table)
- [Element Reference](#element-reference)

## Layer Introduction

| Metric                    | Count |
| ------------------------- | ----- |
| Elements                  | 38    |
| Intra-Layer Relationships | 42    |
| Inter-Layer Relationships | 255   |
| Inbound Relationships     | 255   |
| Outbound Relationships    | 0     |

**Cross-Layer References**:

- **Upstream layers**: [Application](./05-application-layer-report.md), [Business](./02-business-layer-report.md), [Product](./03-product-layer-report.md), [Testing](./13-testing-layer-report.md), [UX](./10-ux-layer-report.md)

## Intra-Layer Relationships

*This layer has >30 elements. Summary table shown instead of diagram.*

| Element                                                                                     | Type          | Relationships |
| ------------------------------------------------------------------------------------------- | ------------- | ------------- |
| `motivation.constraint.every-exported-component-is-covered-by-an-agent-skill`               | `constraint`  | 1             |
| `motivation.constraint.layer-stack-draws-links-as-batched-svg-paths-not-canvas`             | `constraint`  | 0             |
| `motivation.constraint.package-ships-esm-dist-and-agent-skills-only`                        | `constraint`  | 1             |
| `motivation.constraint.visual-changes-pass-per-os-screenshot-baselines`                     | `constraint`  | 0             |
| `motivation.driver.external-regression-gated-layout-quality-loop`                           | `driver`      | 5             |
| `motivation.goal.consistent-component-library-for-data-dense-ide-style-applications`        | `goal`        | 8             |
| `motivation.goal.layout-algorithms-that-scale-to-large-dense-and-pathological-graphs`       | `goal`        | 5             |
| `motivation.goal.low-friction-adoption-in-any-react-toolchain`                              | `goal`        | 6             |
| `motivation.goal.readable-layout-for-structurally-complex-graphs`                           | `goal`        | 5             |
| `motivation.goal.usable-by-every-end-user`                                                  | `goal`        | 3             |
| `motivation.principle.deterministic-reproducible-layout-output`                             | `principle`   | 2             |
| `motivation.principle.every-component-color-comes-from-a-token`                             | `principle`   | 2             |
| `motivation.principle.ide-density-and-terse-voice`                                          | `principle`   | 1             |
| `motivation.principle.two-surface-shell-and-canvas`                                         | `principle`   | 1             |
| `motivation.principle.zero-literal-node-overlap-guarantee`                                  | `principle`   | 4             |
| `motivation.requirement.a-mirror-can-restyle-the-library-from-one-file`                     | `requirement` | 3             |
| `motivation.requirement.consumers-bundle-only-the-components-they-import`                   | `requirement` | 3             |
| `motivation.requirement.dropdown-panels-render-in-a-portal-by-default`                      | `requirement` | 0             |
| `motivation.requirement.every-exported-path-resolves-in-the-published-tarball`              | `requirement` | 1             |
| `motivation.requirement.every-public-export-is-documented-for-agents`                       | `requirement` | 1             |
| `motivation.requirement.galaxy-keeps-orbits-even-over-round-systems`                        | `requirement` | 2             |
| `motivation.requirement.graph-nodes-and-edges-have-accessible-names`                        | `requirement` | 1             |
| `motivation.requirement.hive-plot-keeps-axis-angles-stable-when-a-layer-is-hidden`          | `requirement` | 0             |
| `motivation.requirement.large-layouts-do-not-block-the-first-paint`                         | `requirement` | 1             |
| `motivation.requirement.layout-engines-must-be-pluggable-without-breaking-existing-callers` | `requirement` | 2             |
| `motivation.requirement.layout-output-is-deterministic-for-a-given-input`                   | `requirement` | 1             |
| `motivation.requirement.live-galaxy-drag-stays-interactive`                                 | `requirement` | 1             |
| `motivation.requirement.motion-honours-reduced-motion-preference`                           | `requirement` | 1             |
| `motivation.requirement.navigation-routing-stays-within-its-time-budget`                    | `requirement` | 1             |
| `motivation.requirement.no-two-node-boxes-overlap-after-any-layout-engine-runs`             | `requirement` | 1             |
| `motivation.requirement.opt-in-component-stylesheets-are-load-order-independent`            | `requirement` | 1             |
| `motivation.requirement.package-loads-as-plain-esm-in-node-ssr-and-test-runners`            | `requirement` | 1             |
| `motivation.requirement.server-rendered-output-hydrates-without-mismatch`                   | `requirement` | 3             |
| `motivation.requirement.upstream-publishing-workflows-are-inert-in-a-mirror`                | `requirement` | 2             |
| `motivation.stakeholder.embedding-application-developer-npm-consumer`                       | `stakeholder` | 7             |
| `motivation.stakeholder.end-user-of-an-embedding-application`                               | `stakeholder` | 2             |
| `motivation.stakeholder.heimdall-layout-loop-quality-harness`                               | `stakeholder` | 2             |
| `motivation.stakeholder.mirror-maintainer`                                                  | `stakeholder` | 3             |

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
  application --> motivation
  business --> motivation
  product --> motivation
  testing --> motivation
  ux --> motivation
  class motivation current
```

## Inter-Layer Relationships Table

| Relationship ID                                                    | Source Node                                                                                                                           | Dest Node                                                                                   | Dest Layer   | Predicate    | Cardinality  | Strength |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | ------------ | ------------ | ------------ | -------- |
| `application.applicationfunction.satisfies.motivation.requirement` | `application.applicationfunction.clustered-force-layout-algorithm`                                                                    | `motivation.requirement.layout-engines-must-be-pluggable-without-breaking-existing-callers` | `motivation` | `satisfies`  | many-to-many | medium   |
| `application.applicationfunction.satisfies.motivation.requirement` | `application.applicationfunction.dropdown-portal-and-outside-click-containment`                                                       | `motivation.requirement.dropdown-panels-render-in-a-portal-by-default`                      | `motivation` | `satisfies`  | many-to-many | medium   |
| `application.applicationfunction.satisfies.motivation.requirement` | `application.applicationfunction.fixed-clock-date-formatting`                                                                         | `motivation.requirement.server-rendered-output-hydrates-without-mismatch`                   | `motivation` | `satisfies`  | many-to-many | medium   |
| `application.applicationfunction.satisfies.motivation.requirement` | `application.applicationfunction.force-directed-layout-algorithm`                                                                     | `motivation.requirement.layout-engines-must-be-pluggable-without-breaking-existing-callers` | `motivation` | `satisfies`  | many-to-many | medium   |
| `application.applicationfunction.satisfies.motivation.requirement` | `application.applicationfunction.force-directed-layout-algorithm`                                                                     | `motivation.requirement.no-two-node-boxes-overlap-after-any-layout-engine-runs`             | `motivation` | `satisfies`  | many-to-many | medium   |
| `application.applicationfunction.satisfies.motivation.requirement` | `application.applicationfunction.galaxy-live-simulation-step`                                                                         | `motivation.requirement.layout-output-is-deterministic-for-a-given-input`                   | `motivation` | `satisfies`  | many-to-many | medium   |
| `application.applicationfunction.satisfies.motivation.requirement` | `application.applicationfunction.galaxy-live-simulation-step`                                                                         | `motivation.requirement.live-galaxy-drag-stays-interactive`                                 | `motivation` | `satisfies`  | many-to-many | medium   |
| `application.applicationfunction.satisfies.motivation.requirement` | `application.applicationfunction.galaxy-radial-orbit-layout-algorithm`                                                                | `motivation.requirement.galaxy-keeps-orbits-even-over-round-systems`                        | `motivation` | `satisfies`  | many-to-many | medium   |
| `application.applicationfunction.satisfies.motivation.requirement` | `application.applicationfunction.galaxy-radial-orbit-layout-algorithm`                                                                | `motivation.requirement.no-two-node-boxes-overlap-after-any-layout-engine-runs`             | `motivation` | `satisfies`  | many-to-many | medium   |
| `application.applicationfunction.satisfies.motivation.requirement` | `application.applicationfunction.hive-plot-layout`                                                                                    | `motivation.requirement.hive-plot-keeps-axis-angles-stable-when-a-layer-is-hidden`          | `motivation` | `satisfies`  | many-to-many | medium   |
| `application.applicationfunction.satisfies.motivation.requirement` | `application.applicationfunction.louvain-community-clustering`                                                                        | `motivation.requirement.layout-output-is-deterministic-for-a-given-input`                   | `motivation` | `satisfies`  | many-to-many | medium   |
| `application.applicationfunction.satisfies.motivation.requirement` | `application.applicationfunction.navigation-edge-orthogonal-routing`                                                                  | `motivation.requirement.navigation-routing-stays-within-its-time-budget`                    | `motivation` | `satisfies`  | many-to-many | medium   |
| `application.applicationfunction.satisfies.motivation.requirement` | `application.applicationfunction.node-overlap-separation-pass`                                                                        | `motivation.requirement.no-two-node-boxes-overlap-after-any-layout-engine-runs`             | `motivation` | `satisfies`  | many-to-many | medium   |
| `application.applicationfunction.satisfies.motivation.requirement` | `application.applicationfunction.organic-layout-algorithm`                                                                            | `motivation.requirement.layout-output-is-deterministic-for-a-given-input`                   | `motivation` | `satisfies`  | many-to-many | medium   |
| `application.applicationfunction.satisfies.motivation.requirement` | `application.applicationfunction.organic-layout-algorithm`                                                                            | `motivation.requirement.no-two-node-boxes-overlap-after-any-layout-engine-runs`             | `motivation` | `satisfies`  | many-to-many | medium   |
| `application.applicationfunction.satisfies.motivation.requirement` | `application.applicationfunction.orthogonal-layout-algorithm`                                                                         | `motivation.requirement.layout-output-is-deterministic-for-a-given-input`                   | `motivation` | `satisfies`  | many-to-many | medium   |
| `application.applicationfunction.satisfies.motivation.requirement` | `application.applicationfunction.radial-tree-layout-algorithm`                                                                        | `motivation.requirement.no-two-node-boxes-overlap-after-any-layout-engine-runs`             | `motivation` | `satisfies`  | many-to-many | medium   |
| `application.applicationfunction.satisfies.motivation.requirement` | `application.applicationfunction.ssr-safe-media-query`                                                                                | `motivation.requirement.server-rendered-output-hydrates-without-mismatch`                   | `motivation` | `satisfies`  | many-to-many | medium   |
| `application.applicationservice.satisfies.motivation.requirement`  | `application.applicationservice.graph-layout-engine-service`                                                                          | `motivation.requirement.layout-engines-must-be-pluggable-without-breaking-existing-callers` | `motivation` | `satisfies`  | many-to-many | medium   |
| `application.applicationservice.satisfies.motivation.constraint`   | `application.applicationservice.layered-graph-visualization`                                                                          | `motivation.constraint.layer-stack-draws-links-as-batched-svg-paths-not-canvas`             | `motivation` | `satisfies`  | many-to-many | medium   |
| `business.businessactor.references.motivation.stakeholder`         | `business.businessactor.embedding-application-developer`                                                                              | `motivation.stakeholder.embedding-application-developer-npm-consumer`                       | `motivation` | `references` | many-to-many | medium   |
| `business.businessactor.references.motivation.stakeholder`         | `business.businessactor.end-user-exploring-a-graph-view`                                                                              | `motivation.stakeholder.end-user-of-an-embedding-application`                               | `motivation` | `references` | many-to-many | medium   |
| `business.businessservice.realizes.motivation.goal`                | `business.businessservice.hierarchical-and-navigation-structure-visualization`                                                        | `motivation.goal.readable-layout-for-structurally-complex-graphs`                           | `motivation` | `realizes`   | many-to-many | medium   |
| `business.businessservice.realizes.motivation.goal`                | `business.businessservice.large-graph-visualization`                                                                                  | `motivation.goal.layout-algorithms-that-scale-to-large-dense-and-pathological-graphs`       | `motivation` | `realizes`   | many-to-many | medium   |
| `product.feature.satisfies.motivation.requirement`                 | `product.feature.per-component-imports`                                                                                               | `motivation.requirement.consumers-bundle-only-the-components-they-import`                   | `motivation` | `satisfies`  | many-to-many | medium   |
| `product.feature.satisfies.motivation.requirement`                 | `product.feature.server-side-rendering-support`                                                                                       | `motivation.requirement.server-rendered-output-hydrates-without-mismatch`                   | `motivation` | `satisfies`  | many-to-many | medium   |
| `product.feature.satisfies.motivation.requirement`                 | `product.feature.theme-slot`                                                                                                          | `motivation.requirement.a-mirror-can-restyle-the-library-from-one-file`                     | `motivation` | `satisfies`  | many-to-many | medium   |
| `product.feature.satisfies.motivation.requirement`                 | `product.feature.theme-slot`                                                                                                          | `motivation.requirement.upstream-publishing-workflows-are-inert-in-a-mirror`                | `motivation` | `satisfies`  | many-to-many | medium   |
| `product.persona.references.motivation.stakeholder`                | `product.persona.application-developer-embedding-a-graph-view`                                                                        | `motivation.stakeholder.embedding-application-developer-npm-consumer`                       | `motivation` | `references` | many-to-many | medium   |
| `product.persona.references.motivation.stakeholder`                | `product.persona.end-user-exploring-a-rendered-graph`                                                                                 | `motivation.stakeholder.end-user-of-an-embedding-application`                               | `motivation` | `references` | many-to-many | medium   |
| `product.persona.references.motivation.stakeholder`                | `product.persona.mirror-maintainer-restyling-the-library`                                                                             | `motivation.stakeholder.mirror-maintainer`                                                  | `motivation` | `references` | many-to-many | medium   |
| `product.softwarecapability.supports.motivation.goal`              | `product.softwarecapability.app-navigation`                                                                                           | `motivation.goal.consistent-component-library-for-data-dense-ide-style-applications`        | `motivation` | `supports`   | many-to-many | medium   |
| `product.softwarecapability.supports.motivation.goal`              | `product.softwarecapability.app-shell`                                                                                                | `motivation.goal.consistent-component-library-for-data-dense-ide-style-applications`        | `motivation` | `supports`   | many-to-many | medium   |
| `product.softwarecapability.supports.motivation.goal`              | `product.softwarecapability.charting`                                                                                                 | `motivation.goal.consistent-component-library-for-data-dense-ide-style-applications`        | `motivation` | `supports`   | many-to-many | medium   |
| `product.softwarecapability.supports.motivation.goal`              | `product.softwarecapability.chat-ui`                                                                                                  | `motivation.goal.consistent-component-library-for-data-dense-ide-style-applications`        | `motivation` | `supports`   | many-to-many | medium   |
| `product.softwarecapability.satisfies.motivation.requirement`      | `product.softwarecapability.clustered-force-layout-community-bubbles`                                                                 | `motivation.requirement.layout-engines-must-be-pluggable-without-breaking-existing-callers` | `motivation` | `satisfies`  | many-to-many | medium   |
| `product.softwarecapability.supports.motivation.goal`              | `product.softwarecapability.clustered-force-layout-community-bubbles`                                                                 | `motivation.goal.layout-algorithms-that-scale-to-large-dense-and-pathological-graphs`       | `motivation` | `supports`   | many-to-many | medium   |
| `product.softwarecapability.supports.motivation.goal`              | `product.softwarecapability.data-display`                                                                                             | `motivation.goal.consistent-component-library-for-data-dense-ide-style-applications`        | `motivation` | `supports`   | many-to-many | medium   |
| `product.softwarecapability.supports.motivation.goal`              | `product.softwarecapability.force-directed-graph-layout`                                                                              | `motivation.goal.readable-layout-for-structurally-complex-graphs`                           | `motivation` | `supports`   | many-to-many | medium   |
| `product.softwarecapability.supports.motivation.goal`              | `product.softwarecapability.form-input`                                                                                               | `motivation.goal.consistent-component-library-for-data-dense-ide-style-applications`        | `motivation` | `supports`   | many-to-many | medium   |
| `product.softwarecapability.supports.motivation.goal`              | `product.softwarecapability.galaxy-radial-orbit-layout`                                                                               | `motivation.goal.readable-layout-for-structurally-complex-graphs`                           | `motivation` | `supports`   | many-to-many | medium   |
| `product.softwarecapability.supports.motivation.goal`              | `product.softwarecapability.interactive-graph-exploration`                                                                            | `motivation.goal.readable-layout-for-structurally-complex-graphs`                           | `motivation` | `supports`   | many-to-many | medium   |
| `product.softwarecapability.supports.motivation.goal`              | `product.softwarecapability.layered-graph-visualization`                                                                              | `motivation.goal.consistent-component-library-for-data-dense-ide-style-applications`        | `motivation` | `supports`   | many-to-many | medium   |
| `product.softwarecapability.supports.motivation.goal`              | `product.softwarecapability.layered-graph-visualization`                                                                              | `motivation.goal.layout-algorithms-that-scale-to-large-dense-and-pathological-graphs`       | `motivation` | `supports`   | many-to-many | medium   |
| `product.softwarecapability.supports.motivation.goal`              | `product.softwarecapability.layered-graph-visualization`                                                                              | `motivation.goal.readable-layout-for-structurally-complex-graphs`                           | `motivation` | `supports`   | many-to-many | medium   |
| `product.softwarecapability.supports.motivation.goal`              | `product.softwarecapability.organic-graph-layout`                                                                                     | `motivation.goal.readable-layout-for-structurally-complex-graphs`                           | `motivation` | `supports`   | many-to-many | medium   |
| `product.softwarecapability.supports.motivation.goal`              | `product.softwarecapability.orthogonal-graph-layout`                                                                                  | `motivation.goal.readable-layout-for-structurally-complex-graphs`                           | `motivation` | `supports`   | many-to-many | medium   |
| `product.softwarecapability.supports.motivation.goal`              | `product.softwarecapability.overlays-and-dialogs`                                                                                     | `motivation.goal.consistent-component-library-for-data-dense-ide-style-applications`        | `motivation` | `supports`   | many-to-many | medium   |
| `product.softwarecapability.supports.motivation.goal`              | `product.softwarecapability.page-patterns`                                                                                            | `motivation.goal.consistent-component-library-for-data-dense-ide-style-applications`        | `motivation` | `supports`   | many-to-many | medium   |
| `product.softwarecapability.supports.motivation.goal`              | `product.softwarecapability.planning-and-scheduling`                                                                                  | `motivation.goal.consistent-component-library-for-data-dense-ide-style-applications`        | `motivation` | `supports`   | many-to-many | medium   |
| `product.softwarecapability.supports.motivation.goal`              | `product.softwarecapability.radial-tree-layout`                                                                                       | `motivation.goal.readable-layout-for-structurally-complex-graphs`                           | `motivation` | `supports`   | many-to-many | medium   |
| `product.softwarecapability.supports.motivation.goal`              | `product.softwarecapability.responsive-layout`                                                                                        | `motivation.goal.consistent-component-library-for-data-dense-ide-style-applications`        | `motivation` | `supports`   | many-to-many | medium   |
| `product.softwarecapability.supports.motivation.goal`              | `product.softwarecapability.run-history-and-observability-views`                                                                      | `motivation.goal.consistent-component-library-for-data-dense-ide-style-applications`        | `motivation` | `supports`   | many-to-many | medium   |
| `product.softwarecapability.satisfies.motivation.requirement`      | `product.softwarecapability.ui-primitives`                                                                                            | `motivation.requirement.a-mirror-can-restyle-the-library-from-one-file`                     | `motivation` | `satisfies`  | many-to-many | medium   |
| `product.softwarecapability.supports.motivation.goal`              | `product.softwarecapability.ui-primitives`                                                                                            | `motivation.goal.consistent-component-library-for-data-dense-ide-style-applications`        | `motivation` | `supports`   | many-to-many | medium   |
| `product.softwarecapability.supports.motivation.goal`              | `product.softwarecapability.ux-navigation-tree-layout`                                                                                | `motivation.goal.readable-layout-for-structurally-complex-graphs`                           | `motivation` | `supports`   | many-to-many | medium   |
| `testing.testcasesketch.satisfies.motivation.requirement`          | `testing.testcasesketch.aspect-ratio-elliptical-warp-composes-with-separate-groups-group-boundaries-stay-non-overlapping-ff23cd4d`    | `motivation.requirement.no-two-node-boxes-overlap-after-any-layout-engine-runs`             | `motivation` | `satisfies`  | many-to-many | high     |
| `testing.testcasesketch.satisfies.motivation.requirement`          | `testing.testcasesketch.aspect-ratio-elliptical-warp-leaning-a-forest-wide-never-makes-galaxies-overlap`                              | `motivation.requirement.no-two-node-boxes-overlap-after-any-layout-engine-runs`             | `motivation` | `satisfies`  | many-to-many | high     |
| `testing.testcasesketch.satisfies.motivation.requirement`          | `testing.testcasesketch.channel-router-route-navigation-edges-applies-nudge-pass-to-spread-overlapping-segments`                      | `motivation.requirement.no-two-node-boxes-overlap-after-any-layout-engine-runs`             | `motivation` | `satisfies`  | many-to-many | high     |
| `testing.testcasesketch.satisfies.motivation.requirement`          | `testing.testcasesketch.channel-router-route-navigation-edges-nudges-overlapping-segments-while-maintaining-orthogonality`            | `motivation.requirement.no-two-node-boxes-overlap-after-any-layout-engine-runs`             | `motivation` | `satisfies`  | many-to-many | high     |
| `testing.testcasesketch.satisfies.motivation.requirement`          | `testing.testcasesketch.chart-fills-resolve-from-tokens`                                                                              | `motivation.requirement.a-mirror-can-restyle-the-library-from-one-file`                     | `motivation` | `satisfies`  | many-to-many | high     |
| `testing.testcasesketch.satisfies.motivation.requirement`          | `testing.testcasesketch.color-literal-check-rejects-a-component-literal`                                                              | `motivation.requirement.a-mirror-can-restyle-the-library-from-one-file`                     | `motivation` | `satisfies`  | many-to-many | high     |
| `testing.testcasesketch.satisfies.motivation.requirement`          | `testing.testcasesketch.force-layout-keeps-default-sized-chip-nodes-non-overlapping-in-a-simple-chain`                                | `motivation.requirement.no-two-node-boxes-overlap-after-any-layout-engine-runs`             | `motivation` | `satisfies`  | many-to-many | high     |
| `testing.testcasesketch.satisfies.motivation.requirement`          | `testing.testcasesketch.galaxy-layout-galaxies-in-a-busy-forest-never-overlap-packed-by-system-circles`                               | `motivation.requirement.no-two-node-boxes-overlap-after-any-layout-engine-runs`             | `motivation` | `satisfies`  | many-to-many | high     |
| `testing.testcasesketch.satisfies.motivation.requirement`          | `testing.testcasesketch.galaxy-layout-independent-galaxies-never-overlap-whatever-their-depth`                                        | `motivation.requirement.no-two-node-boxes-overlap-after-any-layout-engine-runs`             | `motivation` | `satisfies`  | many-to-many | high     |
| `testing.testcasesketch.satisfies.motivation.requirement`          | `testing.testcasesketch.galaxy-live-drag-287-a-flare-drag-frame-resolves-overlaps-with-grid-local-work-not-all-pairs-every-d4f70636`  | `motivation.requirement.no-two-node-boxes-overlap-after-any-layout-engine-runs`             | `motivation` | `satisfies`  | many-to-many | high     |
| `testing.testcasesketch.satisfies.motivation.requirement`          | `testing.testcasesketch.galaxy-live-drag-287-settles-with-no-overlapping-bodies-the-dropped-node-exactly-on-its-pin-its-e250ab4d`     | `motivation.requirement.no-two-node-boxes-overlap-after-any-layout-engine-runs`             | `motivation` | `satisfies`  | many-to-many | high     |
| `testing.testcasesketch.satisfies.motivation.requirement`          | `testing.testcasesketch.galaxy-simulation-step-a-held-drag-carries-its-subtree-settles-and-leaves-no-overlap`                         | `motivation.requirement.no-two-node-boxes-overlap-after-any-layout-engine-runs`             | `motivation` | `satisfies`  | many-to-many | high     |
| `testing.testcasesketch.satisfies.motivation.requirement`          | `testing.testcasesketch.integration-galaxy-layout-collapse-expand-cards-mode-renders-without-overlaps-after-collapse`                 | `motivation.requirement.no-two-node-boxes-overlap-after-any-layout-engine-runs`             | `motivation` | `satisfies`  | many-to-many | high     |
| `testing.testcasesketch.satisfies.motivation.requirement`          | `testing.testcasesketch.integration-galaxy-layout-collapse-expand-collapse-maintains-zero-overlap-guarantee-for-galaxy-f1dd0343`      | `motivation.requirement.no-two-node-boxes-overlap-after-any-layout-engine-runs`             | `motivation` | `satisfies`  | many-to-many | high     |
| `testing.testcasesketch.satisfies.motivation.requirement`          | `testing.testcasesketch.integration-galaxy-layout-collapse-expand-expand-after-collapse-maintains-zero-overlap-guarantee`             | `motivation.requirement.no-two-node-boxes-overlap-after-any-layout-engine-runs`             | `motivation` | `satisfies`  | many-to-many | high     |
| `testing.testcasesketch.satisfies.motivation.requirement`          | `testing.testcasesketch.integration-galaxy-layout-collapse-expand-multiple-collapses-maintain-zero-overlap-guarantee`                 | `motivation.requirement.no-two-node-boxes-overlap-after-any-layout-engine-runs`             | `motivation` | `satisfies`  | many-to-many | high     |
| `testing.testcasesketch.satisfies.motivation.requirement`          | `testing.testcasesketch.integration-galaxy-layout-collapse-expand-renders-every-node-with-no-overlapping-bounding-boxes`              | `motivation.requirement.no-two-node-boxes-overlap-after-any-layout-engine-runs`             | `motivation` | `satisfies`  | many-to-many | high     |
| `testing.testcasesketch.satisfies.motivation.requirement`          | `testing.testcasesketch.integration-galaxy-layout-lab-poc-dataset-stress-test-renders-every-node-with-no-overlapping-7d5e01b7`        | `motivation.requirement.no-two-node-boxes-overlap-after-any-layout-engine-runs`             | `motivation` | `satisfies`  | many-to-many | high     |
| `testing.testcasesketch.satisfies.motivation.requirement`          | `testing.testcasesketch.integration-graph-canvas-components-bus-view-edge-anchors-curvature-two-edges-between-the-same-node-0c36bb99` | `motivation.requirement.no-two-node-boxes-overlap-after-any-layout-engine-runs`             | `motivation` | `satisfies`  | many-to-many | high     |
| `testing.testcasesketch.satisfies.motivation.requirement`          | `testing.testcasesketch.integration-graph-canvas-components-galaxy-view-layout-relations-cards-mode-renders-substantial-13266211`     | `motivation.requirement.no-two-node-boxes-overlap-after-any-layout-engine-runs`             | `motivation` | `satisfies`  | many-to-many | high     |
| `testing.testcasesketch.satisfies.motivation.requirement`          | `testing.testcasesketch.integration-graph-canvas-components-galaxy-view-layout-relations-hovering-any-body-shows-its-orbit-378f0ade`  | `motivation.requirement.no-two-node-boxes-overlap-after-any-layout-engine-runs`             | `motivation` | `satisfies`  | many-to-many | high     |
| `testing.testcasesketch.satisfies.motivation.requirement`          | `testing.testcasesketch.integration-organic-layout-renders-every-node-without-overlapping-bounding-boxes`                             | `motivation.requirement.no-two-node-boxes-overlap-after-any-layout-engine-runs`             | `motivation` | `satisfies`  | many-to-many | high     |
| `testing.testcasesketch.satisfies.motivation.requirement`          | `testing.testcasesketch.integration-orthogonal-layout-renders-every-node-without-overlapping-bounding-boxes`                          | `motivation.requirement.no-two-node-boxes-overlap-after-any-layout-engine-runs`             | `motivation` | `satisfies`  | many-to-many | high     |
| `testing.testcasesketch.satisfies.motivation.requirement`          | `testing.testcasesketch.integration-trace-viewer-interactions-long-attribute-keys-values-truncate-no-overlap-with-a-hover-35742fa3`   | `motivation.requirement.no-two-node-boxes-overlap-after-any-layout-engine-runs`             | `motivation` | `satisfies`  | many-to-many | high     |
| `testing.testcasesketch.satisfies.motivation.requirement`          | `testing.testcasesketch.large-card-nodes-stay-non-overlapping-in-a-bushy-hub-and-spoke-topology`                                      | `motivation.requirement.no-two-node-boxes-overlap-after-any-layout-engine-runs`             | `motivation` | `satisfies`  | many-to-many | high     |
| `testing.testcasesketch.satisfies.motivation.requirement`          | `testing.testcasesketch.layout-lanes-stacks-bands-without-overlap-and-no-two-nodes-overlap`                                           | `motivation.requirement.no-two-node-boxes-overlap-after-any-layout-engine-runs`             | `motivation` | `satisfies`  | many-to-many | high     |
| `testing.testcasesketch.satisfies.motivation.requirement`          | `testing.testcasesketch.nudge-overlapping-segments-does-not-move-a-segment-onto-another-routes-line`                                  | `motivation.requirement.no-two-node-boxes-overlap-after-any-layout-engine-runs`             | `motivation` | `satisfies`  | many-to-many | high     |
| `testing.testcasesketch.satisfies.motivation.requirement`          | `testing.testcasesketch.organic-layout-never-overlaps-nodes-and-honors-minimum-node-distance-as-a-post-condition`                     | `motivation.requirement.no-two-node-boxes-overlap-after-any-layout-engine-runs`             | `motivation` | `satisfies`  | many-to-many | high     |
| `testing.testcasesketch.satisfies.motivation.requirement`          | `testing.testcasesketch.organic-layout-packs-disconnected-components-and-isolates-without-overlap`                                    | `motivation.requirement.no-two-node-boxes-overlap-after-any-layout-engine-runs`             | `motivation` | `satisfies`  | many-to-many | high     |
| `testing.testcasesketch.satisfies.motivation.requirement`          | `testing.testcasesketch.orthogonal-layout-channel-router-graphs-the-lattice-router-cannot-route-survives-a-one-node-drag-db1bbe53`    | `motivation.requirement.no-two-node-boxes-overlap-after-any-layout-engine-runs`             | `motivation` | `satisfies`  | many-to-many | high     |
| `testing.testcasesketch.satisfies.motivation.requirement`          | `testing.testcasesketch.orthogonal-layout-places-every-node-on-the-reported-cell-grid-with-no-overlaps`                               | `motivation.requirement.no-two-node-boxes-overlap-after-any-layout-engine-runs`             | `motivation` | `satisfies`  | many-to-many | high     |
| `testing.testcasesketch.satisfies.motivation.requirement`          | `testing.testcasesketch.place-edge-labels-places-in-priority-order-and-slides-along-the-edge-to-avoid-overlap`                        | `motivation.requirement.no-two-node-boxes-overlap-after-any-layout-engine-runs`             | `motivation` | `satisfies`  | many-to-many | high     |
| `testing.testcasesketch.satisfies.motivation.requirement`          | `testing.testcasesketch.radial-tree-layout-multi-level-single-trunk-does-not-overlap-sibling-nodes-at-the-same-depth`                 | `motivation.requirement.no-two-node-boxes-overlap-after-any-layout-engine-runs`             | `motivation` | `satisfies`  | many-to-many | high     |
| `testing.testcasesketch.satisfies.motivation.requirement`          | `testing.testcasesketch.radial-tree-layout-multiple-disconnected-trunks-arranges-multiple-trunks-without-overlap`                     | `motivation.requirement.no-two-node-boxes-overlap-after-any-layout-engine-runs`             | `motivation` | `satisfies`  | many-to-many | high     |
| `testing.testcasesketch.satisfies.motivation.requirement`          | `testing.testcasesketch.radial-tree-layout-ring-sizing-does-not-overlap-nodes-along-a-chain`                                          | `motivation.requirement.no-two-node-boxes-overlap-after-any-layout-engine-runs`             | `motivation` | `satisfies`  | many-to-many | high     |
| `testing.testcasesketch.satisfies.motivation.requirement`          | `testing.testcasesketch.radial-tree-layout-trunk-boundaries-does-not-overlap-boundaries-of-packed-trunks`                             | `motivation.requirement.no-two-node-boxes-overlap-after-any-layout-engine-runs`             | `motivation` | `satisfies`  | many-to-many | high     |
| `testing.testcasesketch.satisfies.motivation.requirement`          | `testing.testcasesketch.route-lane-gutters-at-dr-scale-synthetic-13-lanes-orientation-uses-about-as-many-gutter-tracks-as-997b2fe9`   | `motivation.requirement.no-two-node-boxes-overlap-after-any-layout-engine-runs`             | `motivation` | `satisfies`  | many-to-many | high     |
| `testing.testcasesketch.satisfies.motivation.requirement`          | `testing.testcasesketch.route-lane-gutters-gives-each-stub-its-own-gap-track-and-overlapping-routes-their-own-gutter-tracks-51c767b0` | `motivation.requirement.no-two-node-boxes-overlap-after-any-layout-engine-runs`             | `motivation` | `satisfies`  | many-to-many | high     |
| `testing.testcasesketch.satisfies.motivation.requirement`          | `testing.testcasesketch.theme-override-ships-after-the-tokens`                                                                        | `motivation.requirement.a-mirror-can-restyle-the-library-from-one-file`                     | `motivation` | `satisfies`  | many-to-many | high     |
| `testing.testcasesketch.satisfies.motivation.requirement`          | `testing.testcasesketch.ux-nav-layout-two-page-disconnected-views-do-not-overlap-each-other`                                          | `motivation.requirement.no-two-node-boxes-overlap-after-any-layout-engine-runs`             | `motivation` | `satisfies`  | many-to-many | high     |
| `testing.testcasesketch.satisfies.motivation.requirement`          | `testing.testcasesketch.ux-nav-layout-view-wider-than-2x-view-fan-gap-does-not-overlap-its-parent-page`                               | `motivation.requirement.no-two-node-boxes-overlap-after-any-layout-engine-runs`             | `motivation` | `satisfies`  | many-to-many | high     |
| `testing.testcoveragemodel.satisfies.motivation.constraint`        | `testing.testcoveragemodel.heimdall-graph-layout-test-coverage`                                                                       | `motivation.constraint.visual-changes-pass-per-os-screenshot-baselines`                     | `motivation` | `satisfies`  | many-to-many | medium   |
| `testing.testcoveragemodel.satisfies.motivation.principle`         | `testing.testcoveragemodel.heimdall-graph-layout-test-coverage`                                                                       | `motivation.principle.zero-literal-node-overlap-guarantee`                                  | `motivation` | `satisfies`  | many-to-many | high     |
| `testing.testcoveragemodel.satisfies.motivation.requirement`       | `testing.testcoveragemodel.heimdall-graph-layout-test-coverage`                                                                       | `motivation.requirement.no-two-node-boxes-overlap-after-any-layout-engine-runs`             | `motivation` | `satisfies`  | many-to-many | high     |
| `testing.testcoveragemodel.supports.motivation.goal`               | `testing.testcoveragemodel.heimdall-graph-layout-test-coverage`                                                                       | `motivation.goal.consistent-component-library-for-data-dense-ide-style-applications`        | `motivation` | `supports`   | many-to-many | high     |
| `ux.librarycomponent.satisfies.motivation.principle`               | `ux.librarycomponent.activity-timeline`                                                                                               | `motivation.principle.two-surface-shell-and-canvas`                                         | `motivation` | `satisfies`  | many-to-many | medium   |
| `ux.librarycomponent.satisfies.motivation.requirement`             | `ux.librarycomponent.activity-timeline`                                                                                               | `motivation.requirement.server-rendered-output-hydrates-without-mismatch`                   | `motivation` | `satisfies`  | many-to-many | medium   |
| `ux.librarycomponent.satisfies.motivation.principle`               | `ux.librarycomponent.adjacency-matrix`                                                                                                | `motivation.principle.two-surface-shell-and-canvas`                                         | `motivation` | `satisfies`  | many-to-many | medium   |
| `ux.librarycomponent.satisfies.motivation.principle`               | `ux.librarycomponent.alert-strip`                                                                                                     | `motivation.principle.two-surface-shell-and-canvas`                                         | `motivation` | `satisfies`  | many-to-many | medium   |
| `ux.librarycomponent.satisfies.motivation.principle`               | `ux.librarycomponent.app-title`                                                                                                       | `motivation.principle.every-component-color-comes-from-a-token`                             | `motivation` | `satisfies`  | many-to-many | medium   |
| `ux.librarycomponent.satisfies.motivation.principle`               | `ux.librarycomponent.app-title`                                                                                                       | `motivation.principle.two-surface-shell-and-canvas`                                         | `motivation` | `satisfies`  | many-to-many | medium   |
| `ux.librarycomponent.satisfies.motivation.principle`               | `ux.librarycomponent.asset-card`                                                                                                      | `motivation.principle.two-surface-shell-and-canvas`                                         | `motivation` | `satisfies`  | many-to-many | medium   |
| `ux.librarycomponent.satisfies.motivation.principle`               | `ux.librarycomponent.asset-grid`                                                                                                      | `motivation.principle.two-surface-shell-and-canvas`                                         | `motivation` | `satisfies`  | many-to-many | medium   |
| `ux.librarycomponent.satisfies.motivation.principle`               | `ux.librarycomponent.avatar`                                                                                                          | `motivation.principle.two-surface-shell-and-canvas`                                         | `motivation` | `satisfies`  | many-to-many | medium   |
| `ux.librarycomponent.satisfies.motivation.principle`               | `ux.librarycomponent.badge`                                                                                                           | `motivation.principle.two-surface-shell-and-canvas`                                         | `motivation` | `satisfies`  | many-to-many | medium   |
| `ux.librarycomponent.satisfies.motivation.principle`               | `ux.librarycomponent.bar-chart`                                                                                                       | `motivation.principle.every-component-color-comes-from-a-token`                             | `motivation` | `satisfies`  | many-to-many | medium   |
| `ux.librarycomponent.satisfies.motivation.principle`               | `ux.librarycomponent.bar-chart`                                                                                                       | `motivation.principle.two-surface-shell-and-canvas`                                         | `motivation` | `satisfies`  | many-to-many | medium   |
| `ux.librarycomponent.satisfies.motivation.principle`               | `ux.librarycomponent.bar-h`                                                                                                           | `motivation.principle.every-component-color-comes-from-a-token`                             | `motivation` | `satisfies`  | many-to-many | medium   |
| `ux.librarycomponent.satisfies.motivation.principle`               | `ux.librarycomponent.bar-h`                                                                                                           | `motivation.principle.two-surface-shell-and-canvas`                                         | `motivation` | `satisfies`  | many-to-many | medium   |
| `ux.librarycomponent.satisfies.motivation.principle`               | `ux.librarycomponent.bar-v`                                                                                                           | `motivation.principle.two-surface-shell-and-canvas`                                         | `motivation` | `satisfies`  | many-to-many | medium   |
| `ux.librarycomponent.satisfies.motivation.principle`               | `ux.librarycomponent.bridge-node-list`                                                                                                | `motivation.principle.two-surface-shell-and-canvas`                                         | `motivation` | `satisfies`  | many-to-many | medium   |
| `ux.librarycomponent.satisfies.motivation.principle`               | `ux.librarycomponent.button`                                                                                                          | `motivation.principle.two-surface-shell-and-canvas`                                         | `motivation` | `satisfies`  | many-to-many | medium   |
| `ux.librarycomponent.satisfies.motivation.principle`               | `ux.librarycomponent.calendar`                                                                                                        | `motivation.principle.two-surface-shell-and-canvas`                                         | `motivation` | `satisfies`  | many-to-many | medium   |
| `ux.librarycomponent.satisfies.motivation.requirement`             | `ux.librarycomponent.calendar`                                                                                                        | `motivation.requirement.server-rendered-output-hydrates-without-mismatch`                   | `motivation` | `satisfies`  | many-to-many | medium   |
| `ux.librarycomponent.satisfies.motivation.principle`               | `ux.librarycomponent.camera-controls`                                                                                                 | `motivation.principle.two-surface-shell-and-canvas`                                         | `motivation` | `satisfies`  | many-to-many | medium   |
| `ux.librarycomponent.satisfies.motivation.principle`               | `ux.librarycomponent.chart-wrapper`                                                                                                   | `motivation.principle.two-surface-shell-and-canvas`                                         | `motivation` | `satisfies`  | many-to-many | medium   |
| `ux.librarycomponent.satisfies.motivation.principle`               | `ux.librarycomponent.chat-composer`                                                                                                   | `motivation.principle.every-component-color-comes-from-a-token`                             | `motivation` | `satisfies`  | many-to-many | medium   |
| `ux.librarycomponent.satisfies.motivation.principle`               | `ux.librarycomponent.chat-composer`                                                                                                   | `motivation.principle.two-surface-shell-and-canvas`                                         | `motivation` | `satisfies`  | many-to-many | medium   |
| `ux.librarycomponent.satisfies.motivation.principle`               | `ux.librarycomponent.chat-container`                                                                                                  | `motivation.principle.every-component-color-comes-from-a-token`                             | `motivation` | `satisfies`  | many-to-many | medium   |
| `ux.librarycomponent.satisfies.motivation.principle`               | `ux.librarycomponent.chat-container`                                                                                                  | `motivation.principle.two-surface-shell-and-canvas`                                         | `motivation` | `satisfies`  | many-to-many | medium   |
| `ux.librarycomponent.satisfies.motivation.principle`               | `ux.librarycomponent.chat-divider`                                                                                                    | `motivation.principle.every-component-color-comes-from-a-token`                             | `motivation` | `satisfies`  | many-to-many | medium   |
| `ux.librarycomponent.satisfies.motivation.principle`               | `ux.librarycomponent.chat-divider`                                                                                                    | `motivation.principle.two-surface-shell-and-canvas`                                         | `motivation` | `satisfies`  | many-to-many | medium   |
| `ux.librarycomponent.satisfies.motivation.principle`               | `ux.librarycomponent.chat-markdown-content`                                                                                           | `motivation.principle.two-surface-shell-and-canvas`                                         | `motivation` | `satisfies`  | many-to-many | medium   |
| `ux.librarycomponent.satisfies.motivation.principle`               | `ux.librarycomponent.chat-message`                                                                                                    | `motivation.principle.every-component-color-comes-from-a-token`                             | `motivation` | `satisfies`  | many-to-many | medium   |
| `ux.librarycomponent.satisfies.motivation.principle`               | `ux.librarycomponent.chat-message`                                                                                                    | `motivation.principle.two-surface-shell-and-canvas`                                         | `motivation` | `satisfies`  | many-to-many | medium   |
| `ux.librarycomponent.satisfies.motivation.principle`               | `ux.librarycomponent.chat-suggestions`                                                                                                | `motivation.principle.every-component-color-comes-from-a-token`                             | `motivation` | `satisfies`  | many-to-many | medium   |
| `ux.librarycomponent.satisfies.motivation.principle`               | `ux.librarycomponent.chat-suggestions`                                                                                                | `motivation.principle.two-surface-shell-and-canvas`                                         | `motivation` | `satisfies`  | many-to-many | medium   |
| `ux.librarycomponent.satisfies.motivation.principle`               | `ux.librarycomponent.chip`                                                                                                            | `motivation.principle.two-surface-shell-and-canvas`                                         | `motivation` | `satisfies`  | many-to-many | medium   |
| `ux.librarycomponent.satisfies.motivation.principle`               | `ux.librarycomponent.command-palette`                                                                                                 | `motivation.principle.two-surface-shell-and-canvas`                                         | `motivation` | `satisfies`  | many-to-many | medium   |
| `ux.librarycomponent.satisfies.motivation.principle`               | `ux.librarycomponent.config-tile`                                                                                                     | `motivation.principle.two-surface-shell-and-canvas`                                         | `motivation` | `satisfies`  | many-to-many | medium   |
| `ux.librarycomponent.satisfies.motivation.principle`               | `ux.librarycomponent.confirm-dialog`                                                                                                  | `motivation.principle.two-surface-shell-and-canvas`                                         | `motivation` | `satisfies`  | many-to-many | medium   |
| `ux.librarycomponent.satisfies.motivation.principle`               | `ux.librarycomponent.detail-drawer`                                                                                                   | `motivation.principle.two-surface-shell-and-canvas`                                         | `motivation` | `satisfies`  | many-to-many | medium   |
| `ux.librarycomponent.satisfies.motivation.principle`               | `ux.librarycomponent.diff-viewer`                                                                                                     | `motivation.principle.every-component-color-comes-from-a-token`                             | `motivation` | `satisfies`  | many-to-many | medium   |
| `ux.librarycomponent.satisfies.motivation.principle`               | `ux.librarycomponent.diff-viewer`                                                                                                     | `motivation.principle.two-surface-shell-and-canvas`                                         | `motivation` | `satisfies`  | many-to-many | medium   |
| `ux.librarycomponent.satisfies.motivation.principle`               | `ux.librarycomponent.donut`                                                                                                           | `motivation.principle.every-component-color-comes-from-a-token`                             | `motivation` | `satisfies`  | many-to-many | medium   |
| `ux.librarycomponent.satisfies.motivation.principle`               | `ux.librarycomponent.donut`                                                                                                           | `motivation.principle.two-surface-shell-and-canvas`                                         | `motivation` | `satisfies`  | many-to-many | medium   |
| `ux.librarycomponent.satisfies.motivation.principle`               | `ux.librarycomponent.drawer`                                                                                                          | `motivation.principle.two-surface-shell-and-canvas`                                         | `motivation` | `satisfies`  | many-to-many | medium   |
| `ux.librarycomponent.satisfies.motivation.principle`               | `ux.librarycomponent.entity-picker`                                                                                                   | `motivation.principle.two-surface-shell-and-canvas`                                         | `motivation` | `satisfies`  | many-to-many | medium   |
| `ux.librarycomponent.satisfies.motivation.requirement`             | `ux.librarycomponent.entity-picker`                                                                                                   | `motivation.requirement.dropdown-panels-render-in-a-portal-by-default`                      | `motivation` | `satisfies`  | many-to-many | medium   |
| `ux.librarycomponent.satisfies.motivation.principle`               | `ux.librarycomponent.field`                                                                                                           | `motivation.principle.two-surface-shell-and-canvas`                                         | `motivation` | `satisfies`  | many-to-many | medium   |
| `ux.librarycomponent.satisfies.motivation.principle`               | `ux.librarycomponent.filter-bar`                                                                                                      | `motivation.principle.two-surface-shell-and-canvas`                                         | `motivation` | `satisfies`  | many-to-many | medium   |
| `ux.librarycomponent.satisfies.motivation.principle`               | `ux.librarycomponent.filter-dropdown`                                                                                                 | `motivation.principle.two-surface-shell-and-canvas`                                         | `motivation` | `satisfies`  | many-to-many | medium   |
| `ux.librarycomponent.satisfies.motivation.requirement`             | `ux.librarycomponent.filter-dropdown`                                                                                                 | `motivation.requirement.dropdown-panels-render-in-a-portal-by-default`                      | `motivation` | `satisfies`  | many-to-many | medium   |
| `ux.librarycomponent.satisfies.motivation.principle`               | `ux.librarycomponent.follow-control`                                                                                                  | `motivation.principle.two-surface-shell-and-canvas`                                         | `motivation` | `satisfies`  | many-to-many | medium   |
| `ux.librarycomponent.satisfies.motivation.principle`               | `ux.librarycomponent.form-callout`                                                                                                    | `motivation.principle.two-surface-shell-and-canvas`                                         | `motivation` | `satisfies`  | many-to-many | medium   |
| `ux.librarycomponent.satisfies.motivation.principle`               | `ux.librarycomponent.graph-canvas-ux`                                                                                                 | `motivation.principle.two-surface-shell-and-canvas`                                         | `motivation` | `satisfies`  | many-to-many | medium   |
| `ux.librarycomponent.satisfies.motivation.requirement`             | `ux.librarycomponent.graph-canvas-ux`                                                                                                 | `motivation.requirement.graph-nodes-and-edges-have-accessible-names`                        | `motivation` | `satisfies`  | many-to-many | medium   |
| `ux.librarycomponent.satisfies.motivation.requirement`             | `ux.librarycomponent.graph-canvas-ux`                                                                                                 | `motivation.requirement.large-layouts-do-not-block-the-first-paint`                         | `motivation` | `satisfies`  | many-to-many | medium   |
| `ux.librarycomponent.satisfies.motivation.requirement`             | `ux.librarycomponent.graph-canvas-ux`                                                                                                 | `motivation.requirement.layout-engines-must-be-pluggable-without-breaking-existing-callers` | `motivation` | `satisfies`  | many-to-many | medium   |
| `ux.librarycomponent.satisfies.motivation.requirement`             | `ux.librarycomponent.graph-canvas-ux`                                                                                                 | `motivation.requirement.motion-honours-reduced-motion-preference`                           | `motivation` | `satisfies`  | many-to-many | medium   |
| `ux.librarycomponent.satisfies.motivation.principle`               | `ux.librarycomponent.graph-collapse-control-ux`                                                                                       | `motivation.principle.two-surface-shell-and-canvas`                                         | `motivation` | `satisfies`  | many-to-many | medium   |
| `ux.librarycomponent.satisfies.motivation.principle`               | `ux.librarycomponent.graph-edge-inspector-ux`                                                                                         | `motivation.principle.two-surface-shell-and-canvas`                                         | `motivation` | `satisfies`  | many-to-many | medium   |
| `ux.librarycomponent.satisfies.motivation.principle`               | `ux.librarycomponent.graph-edge-shape-ux`                                                                                             | `motivation.principle.two-surface-shell-and-canvas`                                         | `motivation` | `satisfies`  | many-to-many | medium   |
| `ux.librarycomponent.satisfies.motivation.principle`               | `ux.librarycomponent.graph-edge-ux`                                                                                                   | `motivation.principle.two-surface-shell-and-canvas`                                         | `motivation` | `satisfies`  | many-to-many | medium   |
| `ux.librarycomponent.satisfies.motivation.principle`               | `ux.librarycomponent.graph-inspector-ux`                                                                                              | `motivation.principle.two-surface-shell-and-canvas`                                         | `motivation` | `satisfies`  | many-to-many | medium   |
| `ux.librarycomponent.satisfies.motivation.principle`               | `ux.librarycomponent.graph-node-ux`                                                                                                   | `motivation.principle.every-component-color-comes-from-a-token`                             | `motivation` | `satisfies`  | many-to-many | medium   |
| `ux.librarycomponent.satisfies.motivation.principle`               | `ux.librarycomponent.graph-node-ux`                                                                                                   | `motivation.principle.two-surface-shell-and-canvas`                                         | `motivation` | `satisfies`  | many-to-many | medium   |
| `ux.librarycomponent.satisfies.motivation.requirement`             | `ux.librarycomponent.graph-node-ux`                                                                                                   | `motivation.requirement.graph-nodes-and-edges-have-accessible-names`                        | `motivation` | `satisfies`  | many-to-many | medium   |
| `ux.librarycomponent.satisfies.motivation.principle`               | `ux.librarycomponent.graph-toolbar-ux`                                                                                                | `motivation.principle.two-surface-shell-and-canvas`                                         | `motivation` | `satisfies`  | many-to-many | medium   |
| `ux.librarycomponent.satisfies.motivation.principle`               | `ux.librarycomponent.hash-set-diff`                                                                                                   | `motivation.principle.two-surface-shell-and-canvas`                                         | `motivation` | `satisfies`  | many-to-many | medium   |
| `ux.librarycomponent.satisfies.motivation.principle`               | `ux.librarycomponent.heatmap`                                                                                                         | `motivation.principle.every-component-color-comes-from-a-token`                             | `motivation` | `satisfies`  | many-to-many | medium   |
| `ux.librarycomponent.satisfies.motivation.principle`               | `ux.librarycomponent.heatmap`                                                                                                         | `motivation.principle.two-surface-shell-and-canvas`                                         | `motivation` | `satisfies`  | many-to-many | medium   |
| `ux.librarycomponent.satisfies.motivation.principle`               | `ux.librarycomponent.hierarchy-row`                                                                                                   | `motivation.principle.two-surface-shell-and-canvas`                                         | `motivation` | `satisfies`  | many-to-many | medium   |
| `ux.librarycomponent.satisfies.motivation.principle`               | `ux.librarycomponent.hierarchy-tree`                                                                                                  | `motivation.principle.two-surface-shell-and-canvas`                                         | `motivation` | `satisfies`  | many-to-many | medium   |
| `ux.librarycomponent.satisfies.motivation.principle`               | `ux.librarycomponent.hive-plot`                                                                                                       | `motivation.principle.two-surface-shell-and-canvas`                                         | `motivation` | `satisfies`  | many-to-many | medium   |
| `ux.librarycomponent.satisfies.motivation.requirement`             | `ux.librarycomponent.hive-plot`                                                                                                       | `motivation.requirement.hive-plot-keeps-axis-angles-stable-when-a-layer-is-hidden`          | `motivation` | `satisfies`  | many-to-many | medium   |
| `ux.librarycomponent.satisfies.motivation.principle`               | `ux.librarycomponent.icon`                                                                                                            | `motivation.principle.two-surface-shell-and-canvas`                                         | `motivation` | `satisfies`  | many-to-many | medium   |
| `ux.librarycomponent.satisfies.motivation.principle`               | `ux.librarycomponent.inspector-panel`                                                                                                 | `motivation.principle.two-surface-shell-and-canvas`                                         | `motivation` | `satisfies`  | many-to-many | medium   |
| `ux.librarycomponent.satisfies.motivation.principle`               | `ux.librarycomponent.kanban-board`                                                                                                    | `motivation.principle.every-component-color-comes-from-a-token`                             | `motivation` | `satisfies`  | many-to-many | medium   |
| `ux.librarycomponent.satisfies.motivation.principle`               | `ux.librarycomponent.kanban-board`                                                                                                    | `motivation.principle.two-surface-shell-and-canvas`                                         | `motivation` | `satisfies`  | many-to-many | medium   |
| `ux.librarycomponent.satisfies.motivation.principle`               | `ux.librarycomponent.key-value-editor`                                                                                                | `motivation.principle.two-surface-shell-and-canvas`                                         | `motivation` | `satisfies`  | many-to-many | medium   |
| `ux.librarycomponent.satisfies.motivation.principle`               | `ux.librarycomponent.kvgrid`                                                                                                          | `motivation.principle.two-surface-shell-and-canvas`                                         | `motivation` | `satisfies`  | many-to-many | medium   |
| `ux.librarycomponent.satisfies.motivation.principle`               | `ux.librarycomponent.layer-list`                                                                                                      | `motivation.principle.two-surface-shell-and-canvas`                                         | `motivation` | `satisfies`  | many-to-many | medium   |
| `ux.librarycomponent.satisfies.motivation.principle`               | `ux.librarycomponent.layer-pair-list`                                                                                                 | `motivation.principle.two-surface-shell-and-canvas`                                         | `motivation` | `satisfies`  | many-to-many | medium   |
| `ux.librarycomponent.satisfies.motivation.principle`               | `ux.librarycomponent.layer-stack`                                                                                                     | `motivation.principle.two-surface-shell-and-canvas`                                         | `motivation` | `satisfies`  | many-to-many | medium   |
| `ux.librarycomponent.satisfies.motivation.principle`               | `ux.librarycomponent.layered-graph-context-ux`                                                                                        | `motivation.principle.two-surface-shell-and-canvas`                                         | `motivation` | `satisfies`  | many-to-many | medium   |
| `ux.librarycomponent.satisfies.motivation.principle`               | `ux.librarycomponent.layered-graph-explorer`                                                                                          | `motivation.principle.two-surface-shell-and-canvas`                                         | `motivation` | `satisfies`  | many-to-many | medium   |
| `ux.librarycomponent.satisfies.motivation.principle`               | `ux.librarycomponent.line-chart`                                                                                                      | `motivation.principle.every-component-color-comes-from-a-token`                             | `motivation` | `satisfies`  | many-to-many | medium   |
| `ux.librarycomponent.satisfies.motivation.principle`               | `ux.librarycomponent.line-chart`                                                                                                      | `motivation.principle.two-surface-shell-and-canvas`                                         | `motivation` | `satisfies`  | many-to-many | medium   |
| `ux.librarycomponent.satisfies.motivation.principle`               | `ux.librarycomponent.lineage-rail`                                                                                                    | `motivation.principle.two-surface-shell-and-canvas`                                         | `motivation` | `satisfies`  | many-to-many | medium   |
| `ux.librarycomponent.satisfies.motivation.principle`               | `ux.librarycomponent.link-category-filter`                                                                                            | `motivation.principle.two-surface-shell-and-canvas`                                         | `motivation` | `satisfies`  | many-to-many | medium   |
| `ux.librarycomponent.satisfies.motivation.principle`               | `ux.librarycomponent.log-stream`                                                                                                      | `motivation.principle.two-surface-shell-and-canvas`                                         | `motivation` | `satisfies`  | many-to-many | medium   |
| `ux.librarycomponent.satisfies.motivation.principle`               | `ux.librarycomponent.map-canvas`                                                                                                      | `motivation.principle.every-component-color-comes-from-a-token`                             | `motivation` | `satisfies`  | many-to-many | medium   |
| `ux.librarycomponent.satisfies.motivation.principle`               | `ux.librarycomponent.map-canvas`                                                                                                      | `motivation.principle.two-surface-shell-and-canvas`                                         | `motivation` | `satisfies`  | many-to-many | medium   |
| `ux.librarycomponent.satisfies.motivation.principle`               | `ux.librarycomponent.metric-row`                                                                                                      | `motivation.principle.two-surface-shell-and-canvas`                                         | `motivation` | `satisfies`  | many-to-many | medium   |
| `ux.librarycomponent.satisfies.motivation.principle`               | `ux.librarycomponent.mini-calendar`                                                                                                   | `motivation.principle.two-surface-shell-and-canvas`                                         | `motivation` | `satisfies`  | many-to-many | medium   |
| `ux.librarycomponent.satisfies.motivation.requirement`             | `ux.librarycomponent.mini-calendar`                                                                                                   | `motivation.requirement.server-rendered-output-hydrates-without-mismatch`                   | `motivation` | `satisfies`  | many-to-many | medium   |
| `ux.librarycomponent.satisfies.motivation.principle`               | `ux.librarycomponent.modal`                                                                                                           | `motivation.principle.two-surface-shell-and-canvas`                                         | `motivation` | `satisfies`  | many-to-many | medium   |
| `ux.librarycomponent.satisfies.motivation.principle`               | `ux.librarycomponent.nav-item`                                                                                                        | `motivation.principle.two-surface-shell-and-canvas`                                         | `motivation` | `satisfies`  | many-to-many | medium   |
| `ux.librarycomponent.satisfies.motivation.principle`               | `ux.librarycomponent.number-input`                                                                                                    | `motivation.principle.two-surface-shell-and-canvas`                                         | `motivation` | `satisfies`  | many-to-many | medium   |
| `ux.librarycomponent.satisfies.motivation.principle`               | `ux.librarycomponent.ordered-list`                                                                                                    | `motivation.principle.two-surface-shell-and-canvas`                                         | `motivation` | `satisfies`  | many-to-many | medium   |
| `ux.librarycomponent.satisfies.motivation.principle`               | `ux.librarycomponent.page-header`                                                                                                     | `motivation.principle.two-surface-shell-and-canvas`                                         | `motivation` | `satisfies`  | many-to-many | medium   |
| `ux.librarycomponent.satisfies.motivation.principle`               | `ux.librarycomponent.pane-rail`                                                                                                       | `motivation.principle.ide-density-and-terse-voice`                                          | `motivation` | `satisfies`  | many-to-many | medium   |
| `ux.librarycomponent.satisfies.motivation.principle`               | `ux.librarycomponent.pane-rail`                                                                                                       | `motivation.principle.two-surface-shell-and-canvas`                                         | `motivation` | `satisfies`  | many-to-many | medium   |
| `ux.librarycomponent.satisfies.motivation.requirement`             | `ux.librarycomponent.pane-rail`                                                                                                       | `motivation.requirement.every-public-export-is-documented-for-agents`                       | `motivation` | `satisfies`  | many-to-many | medium   |
| `ux.librarycomponent.satisfies.motivation.principle`               | `ux.librarycomponent.panel`                                                                                                           | `motivation.principle.two-surface-shell-and-canvas`                                         | `motivation` | `satisfies`  | many-to-many | medium   |
| `ux.librarycomponent.satisfies.motivation.principle`               | `ux.librarycomponent.pipeline-card`                                                                                                   | `motivation.principle.two-surface-shell-and-canvas`                                         | `motivation` | `satisfies`  | many-to-many | medium   |
| `ux.librarycomponent.satisfies.motivation.principle`               | `ux.librarycomponent.plane-layout-control`                                                                                            | `motivation.principle.two-surface-shell-and-canvas`                                         | `motivation` | `satisfies`  | many-to-many | medium   |
| `ux.librarycomponent.satisfies.motivation.principle`               | `ux.librarycomponent.popover`                                                                                                         | `motivation.principle.two-surface-shell-and-canvas`                                         | `motivation` | `satisfies`  | many-to-many | medium   |
| `ux.librarycomponent.satisfies.motivation.principle`               | `ux.librarycomponent.predicate-label-control`                                                                                         | `motivation.principle.two-surface-shell-and-canvas`                                         | `motivation` | `satisfies`  | many-to-many | medium   |
| `ux.librarycomponent.satisfies.motivation.principle`               | `ux.librarycomponent.progress-bar`                                                                                                    | `motivation.principle.two-surface-shell-and-canvas`                                         | `motivation` | `satisfies`  | many-to-many | medium   |
| `ux.librarycomponent.satisfies.motivation.principle`               | `ux.librarycomponent.quick-access-grid`                                                                                               | `motivation.principle.two-surface-shell-and-canvas`                                         | `motivation` | `satisfies`  | many-to-many | medium   |
| `ux.librarycomponent.satisfies.motivation.principle`               | `ux.librarycomponent.quick-access-tile`                                                                                               | `motivation.principle.two-surface-shell-and-canvas`                                         | `motivation` | `satisfies`  | many-to-many | medium   |
| `ux.librarycomponent.satisfies.motivation.principle`               | `ux.librarycomponent.reach-inspector`                                                                                                 | `motivation.principle.two-surface-shell-and-canvas`                                         | `motivation` | `satisfies`  | many-to-many | medium   |
| `ux.librarycomponent.satisfies.motivation.principle`               | `ux.librarycomponent.relationship-builder`                                                                                            | `motivation.principle.two-surface-shell-and-canvas`                                         | `motivation` | `satisfies`  | many-to-many | medium   |
| `ux.librarycomponent.satisfies.motivation.principle`               | `ux.librarycomponent.result-card`                                                                                                     | `motivation.principle.two-surface-shell-and-canvas`                                         | `motivation` | `satisfies`  | many-to-many | medium   |
| `ux.librarycomponent.satisfies.motivation.principle`               | `ux.librarycomponent.row-menu`                                                                                                        | `motivation.principle.two-surface-shell-and-canvas`                                         | `motivation` | `satisfies`  | many-to-many | medium   |
| `ux.librarycomponent.satisfies.motivation.requirement`             | `ux.librarycomponent.row-menu`                                                                                                        | `motivation.requirement.dropdown-panels-render-in-a-portal-by-default`                      | `motivation` | `satisfies`  | many-to-many | medium   |
| `ux.librarycomponent.satisfies.motivation.principle`               | `ux.librarycomponent.segmented-control`                                                                                               | `motivation.principle.two-surface-shell-and-canvas`                                         | `motivation` | `satisfies`  | many-to-many | medium   |
| `ux.librarycomponent.satisfies.motivation.principle`               | `ux.librarycomponent.select`                                                                                                          | `motivation.principle.two-surface-shell-and-canvas`                                         | `motivation` | `satisfies`  | many-to-many | medium   |
| `ux.librarycomponent.satisfies.motivation.requirement`             | `ux.librarycomponent.select`                                                                                                          | `motivation.requirement.dropdown-panels-render-in-a-portal-by-default`                      | `motivation` | `satisfies`  | many-to-many | medium   |
| `ux.librarycomponent.satisfies.motivation.principle`               | `ux.librarycomponent.shell-layout`                                                                                                    | `motivation.principle.ide-density-and-terse-voice`                                          | `motivation` | `satisfies`  | many-to-many | medium   |
| `ux.librarycomponent.satisfies.motivation.principle`               | `ux.librarycomponent.shell-layout`                                                                                                    | `motivation.principle.two-surface-shell-and-canvas`                                         | `motivation` | `satisfies`  | many-to-many | medium   |
| `ux.librarycomponent.satisfies.motivation.requirement`             | `ux.librarycomponent.shell-layout`                                                                                                    | `motivation.requirement.server-rendered-output-hydrates-without-mismatch`                   | `motivation` | `satisfies`  | many-to-many | medium   |
| `ux.librarycomponent.satisfies.motivation.principle`               | `ux.librarycomponent.side-by-side-diff`                                                                                               | `motivation.principle.two-surface-shell-and-canvas`                                         | `motivation` | `satisfies`  | many-to-many | medium   |
| `ux.librarycomponent.satisfies.motivation.principle`               | `ux.librarycomponent.sidebar`                                                                                                         | `motivation.principle.two-surface-shell-and-canvas`                                         | `motivation` | `satisfies`  | many-to-many | medium   |
| `ux.librarycomponent.satisfies.motivation.principle`               | `ux.librarycomponent.sparkline`                                                                                                       | `motivation.principle.every-component-color-comes-from-a-token`                             | `motivation` | `satisfies`  | many-to-many | medium   |
| `ux.librarycomponent.satisfies.motivation.principle`               | `ux.librarycomponent.sparkline`                                                                                                       | `motivation.principle.two-surface-shell-and-canvas`                                         | `motivation` | `satisfies`  | many-to-many | medium   |
| `ux.librarycomponent.satisfies.motivation.principle`               | `ux.librarycomponent.split-pane`                                                                                                      | `motivation.principle.two-surface-shell-and-canvas`                                         | `motivation` | `satisfies`  | many-to-many | medium   |
| `ux.librarycomponent.satisfies.motivation.principle`               | `ux.librarycomponent.stacked-bar`                                                                                                     | `motivation.principle.every-component-color-comes-from-a-token`                             | `motivation` | `satisfies`  | many-to-many | medium   |
| `ux.librarycomponent.satisfies.motivation.principle`               | `ux.librarycomponent.stacked-bar`                                                                                                     | `motivation.principle.two-surface-shell-and-canvas`                                         | `motivation` | `satisfies`  | many-to-many | medium   |
| `ux.librarycomponent.satisfies.motivation.principle`               | `ux.librarycomponent.stat-grid`                                                                                                       | `motivation.principle.two-surface-shell-and-canvas`                                         | `motivation` | `satisfies`  | many-to-many | medium   |
| `ux.librarycomponent.satisfies.motivation.principle`               | `ux.librarycomponent.stat-tile`                                                                                                       | `motivation.principle.two-surface-shell-and-canvas`                                         | `motivation` | `satisfies`  | many-to-many | medium   |
| `ux.librarycomponent.satisfies.motivation.principle`               | `ux.librarycomponent.status-badge`                                                                                                    | `motivation.principle.two-surface-shell-and-canvas`                                         | `motivation` | `satisfies`  | many-to-many | medium   |
| `ux.librarycomponent.satisfies.motivation.principle`               | `ux.librarycomponent.status-timeline`                                                                                                 | `motivation.principle.every-component-color-comes-from-a-token`                             | `motivation` | `satisfies`  | many-to-many | medium   |
| `ux.librarycomponent.satisfies.motivation.principle`               | `ux.librarycomponent.status-timeline`                                                                                                 | `motivation.principle.two-surface-shell-and-canvas`                                         | `motivation` | `satisfies`  | many-to-many | medium   |
| `ux.librarycomponent.satisfies.motivation.principle`               | `ux.librarycomponent.statusbar`                                                                                                       | `motivation.principle.two-surface-shell-and-canvas`                                         | `motivation` | `satisfies`  | many-to-many | medium   |
| `ux.librarycomponent.satisfies.motivation.requirement`             | `ux.librarycomponent.statusbar`                                                                                                       | `motivation.requirement.server-rendered-output-hydrates-without-mismatch`                   | `motivation` | `satisfies`  | many-to-many | medium   |
| `ux.librarycomponent.satisfies.motivation.principle`               | `ux.librarycomponent.tab-bar`                                                                                                         | `motivation.principle.two-surface-shell-and-canvas`                                         | `motivation` | `satisfies`  | many-to-many | medium   |
| `ux.librarycomponent.satisfies.motivation.principle`               | `ux.librarycomponent.table`                                                                                                           | `motivation.principle.two-surface-shell-and-canvas`                                         | `motivation` | `satisfies`  | many-to-many | medium   |
| `ux.librarycomponent.satisfies.motivation.principle`               | `ux.librarycomponent.text-area`                                                                                                       | `motivation.principle.two-surface-shell-and-canvas`                                         | `motivation` | `satisfies`  | many-to-many | medium   |
| `ux.librarycomponent.satisfies.motivation.principle`               | `ux.librarycomponent.text-input`                                                                                                      | `motivation.principle.two-surface-shell-and-canvas`                                         | `motivation` | `satisfies`  | many-to-many | medium   |
| `ux.librarycomponent.satisfies.motivation.principle`               | `ux.librarycomponent.thinking-block`                                                                                                  | `motivation.principle.two-surface-shell-and-canvas`                                         | `motivation` | `satisfies`  | many-to-many | medium   |
| `ux.librarycomponent.satisfies.motivation.principle`               | `ux.librarycomponent.titlebar`                                                                                                        | `motivation.principle.two-surface-shell-and-canvas`                                         | `motivation` | `satisfies`  | many-to-many | medium   |
| `ux.librarycomponent.satisfies.motivation.principle`               | `ux.librarycomponent.toast`                                                                                                           | `motivation.principle.two-surface-shell-and-canvas`                                         | `motivation` | `satisfies`  | many-to-many | medium   |
| `ux.librarycomponent.satisfies.motivation.principle`               | `ux.librarycomponent.tool-block`                                                                                                      | `motivation.principle.two-surface-shell-and-canvas`                                         | `motivation` | `satisfies`  | many-to-many | medium   |
| `ux.librarycomponent.satisfies.motivation.principle`               | `ux.librarycomponent.tooltip`                                                                                                         | `motivation.principle.two-surface-shell-and-canvas`                                         | `motivation` | `satisfies`  | many-to-many | medium   |
| `ux.librarycomponent.satisfies.motivation.principle`               | `ux.librarycomponent.topbar`                                                                                                          | `motivation.principle.two-surface-shell-and-canvas`                                         | `motivation` | `satisfies`  | many-to-many | medium   |
| `ux.librarycomponent.satisfies.motivation.requirement`             | `ux.librarycomponent.topbar`                                                                                                          | `motivation.requirement.server-rendered-output-hydrates-without-mismatch`                   | `motivation` | `satisfies`  | many-to-many | medium   |
| `ux.librarycomponent.satisfies.motivation.principle`               | `ux.librarycomponent.topology-node`                                                                                                   | `motivation.principle.every-component-color-comes-from-a-token`                             | `motivation` | `satisfies`  | many-to-many | medium   |
| `ux.librarycomponent.satisfies.motivation.principle`               | `ux.librarycomponent.topology-node`                                                                                                   | `motivation.principle.two-surface-shell-and-canvas`                                         | `motivation` | `satisfies`  | many-to-many | medium   |
| `ux.librarycomponent.satisfies.motivation.principle`               | `ux.librarycomponent.trace-viewer`                                                                                                    | `motivation.principle.every-component-color-comes-from-a-token`                             | `motivation` | `satisfies`  | many-to-many | medium   |
| `ux.librarycomponent.satisfies.motivation.principle`               | `ux.librarycomponent.trace-viewer`                                                                                                    | `motivation.principle.two-surface-shell-and-canvas`                                         | `motivation` | `satisfies`  | many-to-many | medium   |
| `ux.librarycomponent.satisfies.motivation.principle`               | `ux.librarycomponent.tri-state`                                                                                                       | `motivation.principle.two-surface-shell-and-canvas`                                         | `motivation` | `satisfies`  | many-to-many | medium   |
| `ux.librarycomponent.satisfies.motivation.principle`               | `ux.librarycomponent.version-pill`                                                                                                    | `motivation.principle.two-surface-shell-and-canvas`                                         | `motivation` | `satisfies`  | many-to-many | medium   |
| `ux.librarycomponent.satisfies.motivation.principle`               | `ux.librarycomponent.version-timeline`                                                                                                | `motivation.principle.two-surface-shell-and-canvas`                                         | `motivation` | `satisfies`  | many-to-many | medium   |
| `ux.librarycomponent.satisfies.motivation.requirement`             | `ux.librarycomponent.version-timeline`                                                                                                | `motivation.requirement.server-rendered-output-hydrates-without-mismatch`                   | `motivation` | `satisfies`  | many-to-many | medium   |
| `ux.librarycomponent.satisfies.motivation.principle`               | `ux.librarycomponent.view-switcher`                                                                                                   | `motivation.principle.two-surface-shell-and-canvas`                                         | `motivation` | `satisfies`  | many-to-many | medium   |
| `ux.librarycomponent.satisfies.motivation.principle`               | `ux.librarycomponent.workspace-switcher-dialog`                                                                                       | `motivation.principle.two-surface-shell-and-canvas`                                         | `motivation` | `satisfies`  | many-to-many | medium   |

## Element Reference

### Every Exported Component Is Covered by an Agent Skill {#every-exported-component-is-covered-by-an-agent-skill}

**ID**: `motivation.constraint.every-exported-component-is-covered-by-an-agent-skill`

**Type**: `constraint`

npm run check:skills (scripts/check-skill-coverage.mjs) fails CI when an export of src/index.ts is not documented in agent-skills/.

#### Attributes

| Name           | Value          |
| -------------- | -------------- |
| constraintType | organizational |

#### Relationships

| Type        | Related Element                                                       | Predicate         | Direction |
| ----------- | --------------------------------------------------------------------- | ----------------- | --------- |
| intra-layer | `motivation.stakeholder.embedding-application-developer-npm-consumer` | `associated-with` | inbound   |

### LayerStack Draws Links as Batched SVG Paths, Not Canvas {#layerstack-draws-links-as-batched-svg-paths-not-canvas}

**ID**: `motivation.constraint.layer-stack-draws-links-as-batched-svg-paths-not-canvas`

**Type**: `constraint`

Decision #379: links off the selection's reach are drawn as one &lt;path&gt; per style bucket; overlap compounding within a bucket and 0.1-unit width rounding are accepted.

#### Attributes

| Name           | Value     |
| -------------- | --------- |
| constraintType | technical |

#### Relationships

| Type        | Related Element                                              | Predicate   | Direction |
| ----------- | ------------------------------------------------------------ | ----------- | --------- |
| inter-layer | `application.applicationservice.layered-graph-visualization` | `satisfies` | inbound   |

### Package Ships ESM dist and agent-skills Only {#package-ships-esm-dist-and-agent-skills-only}

**ID**: `motivation.constraint.package-ships-esm-dist-and-agent-skills-only`

**Type**: `constraint`

Decision #343: files is \[dist, agent-skills\]; no src/, no CJS build; d3-delaunay, d3-hierarchy, react-markdown and remark-gfm are externalized and kept in dependencies; sideEffects limited to CSS. Checked in CI by check:package.

#### Attributes

| Name           | Value     |
| -------------- | --------- |
| constraintType | technical |

#### Relationships

| Type        | Related Element                                                       | Predicate         | Direction |
| ----------- | --------------------------------------------------------------------- | ----------------- | --------- |
| intra-layer | `motivation.stakeholder.embedding-application-developer-npm-consumer` | `associated-with` | inbound   |

### Visual Changes Pass Per-OS Screenshot Baselines {#visual-changes-pass-per-os-screenshot-baselines}

**ID**: `motivation.constraint.visual-changes-pass-per-os-screenshot-baselines`

**Type**: `constraint`

CI runs the Playwright suite against committed -linux.png baselines with maxDiffPixelRatio 1%; a visual change ships with regenerated baselines (CLAUDE.md, ci.yml, update-snapshots.yml).

#### Attributes

| Name           | Value     |
| -------------- | --------- |
| constraintType | technical |

#### Relationships

| Type        | Related Element                                                 | Predicate   | Direction |
| ----------- | --------------------------------------------------------------- | ----------- | --------- |
| inter-layer | `testing.testcoveragemodel.heimdall-graph-layout-test-coverage` | `satisfies` | inbound   |

### External Regression-Gated Layout Quality Loop {#external-regression-gated-layout-quality-loop}

**ID**: `motivation.driver.external-regression-gated-layout-quality-loop`

**Type**: `driver`

Inferred from CHANGELOG.md: forceLayout's resolveOverlaps fix was 'verified against a real 31-node/33-edge reference layer via the project's own layout-quality test loop... the first of 8 proposed changes to that loop's regression-gated test to actually pass it' — i.e. a sibling harness (this very heimdall-layout-loop repo) drives heimdall's own layout-algorithm changes.

#### Attributes

| Name     | Value         |
| -------- | ------------- |
| category | technological |

#### Relationships

| Type        | Related Element                                                                             | Predicate         | Direction |
| ----------- | ------------------------------------------------------------------------------------------- | ----------------- | --------- |
| intra-layer | `motivation.goal.layout-algorithms-that-scale-to-large-dense-and-pathological-graphs`       | `influence`       | outbound  |
| intra-layer | `motivation.goal.readable-layout-for-structurally-complex-graphs`                           | `influence`       | outbound  |
| intra-layer | `motivation.principle.zero-literal-node-overlap-guarantee`                                  | `influence`       | outbound  |
| intra-layer | `motivation.requirement.layout-engines-must-be-pluggable-without-breaking-existing-callers` | `influence`       | outbound  |
| intra-layer | `motivation.stakeholder.heimdall-layout-loop-quality-harness`                               | `associated-with` | inbound   |

### Consistent Component Library for Data-Dense IDE-Style Applications {#consistent-component-library-for-data-dense-ide-style-applications}

**ID**: `motivation.goal.consistent-component-library-for-data-dense-ide-style-applications`

**Type**: `goal`

One React component library, published as @tinkermonkey/heimdall-ui, that gives IDE-density applications a consistent look (two-surface shell and canvas, amber accent, Inter and JetBrains Mono) and behaviour across primitives, inputs, data display, charts, overlays, chat, observability and graph views. Stated in CLAUDE.md and README.md.

#### Attributes

| Name     | Value |
| -------- | ----- |
| priority | high  |

#### Relationships

| Type        | Related Element                                                              | Predicate   | Direction |
| ----------- | ---------------------------------------------------------------------------- | ----------- | --------- |
| inter-layer | `product.softwarecapability.app-navigation`                                  | `supports`  | inbound   |
| inter-layer | `product.softwarecapability.app-shell`                                       | `supports`  | inbound   |
| inter-layer | `product.softwarecapability.charting`                                        | `supports`  | inbound   |
| inter-layer | `product.softwarecapability.chat-ui`                                         | `supports`  | inbound   |
| inter-layer | `product.softwarecapability.data-display`                                    | `supports`  | inbound   |
| inter-layer | `product.softwarecapability.form-input`                                      | `supports`  | inbound   |
| inter-layer | `product.softwarecapability.layered-graph-visualization`                     | `supports`  | inbound   |
| inter-layer | `product.softwarecapability.overlays-and-dialogs`                            | `supports`  | inbound   |
| inter-layer | `product.softwarecapability.page-patterns`                                   | `supports`  | inbound   |
| inter-layer | `product.softwarecapability.planning-and-scheduling`                         | `supports`  | inbound   |
| inter-layer | `product.softwarecapability.responsive-layout`                               | `supports`  | inbound   |
| inter-layer | `product.softwarecapability.run-history-and-observability-views`             | `supports`  | inbound   |
| inter-layer | `product.softwarecapability.ui-primitives`                                   | `supports`  | inbound   |
| inter-layer | `testing.testcoveragemodel.heimdall-graph-layout-test-coverage`              | `supports`  | inbound   |
| intra-layer | `motivation.principle.ide-density-and-terse-voice`                           | `influence` | inbound   |
| intra-layer | `motivation.principle.two-surface-shell-and-canvas`                          | `influence` | inbound   |
| intra-layer | `motivation.requirement.a-mirror-can-restyle-the-library-from-one-file`      | `realizes`  | inbound   |
| intra-layer | `motivation.requirement.consumers-bundle-only-the-components-they-import`    | `realizes`  | inbound   |
| intra-layer | `motivation.requirement.every-public-export-is-documented-for-agents`        | `realizes`  | inbound   |
| intra-layer | `motivation.requirement.server-rendered-output-hydrates-without-mismatch`    | `realizes`  | inbound   |
| intra-layer | `motivation.requirement.upstream-publishing-workflows-are-inert-in-a-mirror` | `realizes`  | inbound   |
| intra-layer | `motivation.stakeholder.embedding-application-developer-npm-consumer`        | `influence` | inbound   |

### Layout Algorithms That Scale to Large, Dense, and Pathological Graphs {#layout-algorithms-that-scale-to-large-dense-and-pathological-graphs}

**ID**: `motivation.goal.layout-algorithms-that-scale-to-large-dense-and-pathological-graphs`

**Type**: `goal`

Inferred from graphLayout.ts's MACRO_EDGE_CAP handling of a measured 564-duplicate-edge pathological dense-cluster fixture, and FINAL_CLEANUP_MAX_PASSES's docs about an 18-large-card dense hub-and-spoke case.

#### Attributes

| Name     | Value |
| -------- | ----- |
| priority | high  |

#### Relationships

| Type        | Related Element                                                          | Predicate   | Direction |
| ----------- | ------------------------------------------------------------------------ | ----------- | --------- |
| inter-layer | `business.businessservice.large-graph-visualization`                     | `realizes`  | inbound   |
| inter-layer | `product.softwarecapability.clustered-force-layout-community-bubbles`    | `supports`  | inbound   |
| inter-layer | `product.softwarecapability.layered-graph-visualization`                 | `supports`  | inbound   |
| intra-layer | `motivation.driver.external-regression-gated-layout-quality-loop`        | `influence` | inbound   |
| intra-layer | `motivation.principle.deterministic-reproducible-layout-output`          | `influence` | inbound   |
| intra-layer | `motivation.requirement.large-layouts-do-not-block-the-first-paint`      | `realizes`  | inbound   |
| intra-layer | `motivation.requirement.live-galaxy-drag-stays-interactive`              | `realizes`  | inbound   |
| intra-layer | `motivation.requirement.navigation-routing-stays-within-its-time-budget` | `realizes`  | inbound   |

### Low-Friction Adoption in Any React Toolchain {#low-friction-adoption-in-any-react-toolchain}

**ID**: `motivation.goal.low-friction-adoption-in-any-react-toolchain`

**Type**: `goal`

A consumer can install the package and import only what it uses, in a browser bundle, an SSR build or a test runner, with paths that resolve and CSS it can load whole or per component.

#### Attributes

| Name     | Value |
| -------- | ----- |
| priority | high  |

#### Relationships

| Type        | Related Element                                                                  | Predicate   | Direction |
| ----------- | -------------------------------------------------------------------------------- | ----------- | --------- |
| intra-layer | `motivation.requirement.consumers-bundle-only-the-components-they-import`        | `realizes`  | inbound   |
| intra-layer | `motivation.requirement.every-exported-path-resolves-in-the-published-tarball`   | `realizes`  | inbound   |
| intra-layer | `motivation.requirement.opt-in-component-stylesheets-are-load-order-independent` | `realizes`  | inbound   |
| intra-layer | `motivation.requirement.package-loads-as-plain-esm-in-node-ssr-and-test-runners` | `realizes`  | inbound   |
| intra-layer | `motivation.requirement.server-rendered-output-hydrates-without-mismatch`        | `realizes`  | inbound   |
| intra-layer | `motivation.stakeholder.embedding-application-developer-npm-consumer`            | `influence` | inbound   |

### Readable Layout for Structurally Complex Graphs {#readable-layout-for-structurally-complex-graphs}

**ID**: `motivation.goal.readable-layout-for-structurally-complex-graphs`

**Type**: `goal`

Inferred from graphLayout.ts's resolveOverlaps/separationPass documentation and repeated CHANGELOG entries: minimize node overlap and edge crossings, and keep edge-length deviation / neighborhood preservation good, even for bushy hub-and-spoke or large-card-node topologies.

#### Attributes

| Name     | Value |
| -------- | ----- |
| priority | high  |

#### Relationships

| Type        | Related Element                                                                | Predicate   | Direction |
| ----------- | ------------------------------------------------------------------------------ | ----------- | --------- |
| inter-layer | `business.businessservice.hierarchical-and-navigation-structure-visualization` | `realizes`  | inbound   |
| inter-layer | `product.softwarecapability.force-directed-graph-layout`                       | `supports`  | inbound   |
| inter-layer | `product.softwarecapability.galaxy-radial-orbit-layout`                        | `supports`  | inbound   |
| inter-layer | `product.softwarecapability.interactive-graph-exploration`                     | `supports`  | inbound   |
| inter-layer | `product.softwarecapability.layered-graph-visualization`                       | `supports`  | inbound   |
| inter-layer | `product.softwarecapability.organic-graph-layout`                              | `supports`  | inbound   |
| inter-layer | `product.softwarecapability.orthogonal-graph-layout`                           | `supports`  | inbound   |
| inter-layer | `product.softwarecapability.radial-tree-layout`                                | `supports`  | inbound   |
| inter-layer | `product.softwarecapability.ux-navigation-tree-layout`                         | `supports`  | inbound   |
| intra-layer | `motivation.driver.external-regression-gated-layout-quality-loop`              | `influence` | inbound   |
| intra-layer | `motivation.requirement.galaxy-keeps-orbits-even-over-round-systems`           | `influence` | outbound  |
| intra-layer | `motivation.principle.zero-literal-node-overlap-guarantee`                     | `influence` | inbound   |
| intra-layer | `motivation.requirement.galaxy-keeps-orbits-even-over-round-systems`           | `realizes`  | inbound   |
| intra-layer | `motivation.stakeholder.end-user-of-an-embedding-application`                  | `influence` | inbound   |

### Usable by Every End User {#usable-by-every-end-user}

**ID**: `motivation.goal.usable-by-every-end-user`

**Type**: `goal`

Graph and component UI that works with keyboard and assistive technology and respects motion preferences.

#### Attributes

| Name     | Value |
| -------- | ----- |
| priority | high  |

#### Relationships

| Type        | Related Element                                                      | Predicate   | Direction |
| ----------- | -------------------------------------------------------------------- | ----------- | --------- |
| intra-layer | `motivation.requirement.graph-nodes-and-edges-have-accessible-names` | `realizes`  | inbound   |
| intra-layer | `motivation.requirement.motion-honours-reduced-motion-preference`    | `realizes`  | inbound   |
| intra-layer | `motivation.stakeholder.end-user-of-an-embedding-application`        | `influence` | inbound   |

### Deterministic, Reproducible Layout Output {#deterministic-reproducible-layout-output}

**ID**: `motivation.principle.deterministic-reproducible-layout-output`

**Type**: `principle`

Inferred from graphClustering.ts's header comment: louvainCluster never uses Math.random or wall-clock time, always iterates in a fixed order, and breaks every tie deterministically, because the layout loop's scoring depends on reproducible layouts across runs of the same input.

#### Attributes

| Name     | Value       |
| -------- | ----------- |
| category | development |

#### Relationships

| Type        | Related Element                                                                       | Predicate   | Direction |
| ----------- | ------------------------------------------------------------------------------------- | ----------- | --------- |
| intra-layer | `motivation.goal.layout-algorithms-that-scale-to-large-dense-and-pathological-graphs` | `influence` | outbound  |
| intra-layer | `motivation.requirement.layout-output-is-deterministic-for-a-given-input`             | `realizes`  | inbound   |

### Every Component Color Comes From a Token {#every-component-color-comes-from-a-token}

**ID**: `motivation.principle.every-component-color-comes-from-a-token`

**Type**: `principle`

Component CSS and TypeScript take colors only from design tokens (rgb(var(--token)) in both); no color literals outside src/tokens/, except pure black and white. npm run check:colors enforces it.

#### Attributes

| Name     | Value        |
| -------- | ------------ |
| category | architecture |

#### Relationships

| Type        | Related Element                                                         | Predicate         | Direction |
| ----------- | ----------------------------------------------------------------------- | ----------------- | --------- |
| inter-layer | `ux.librarycomponent.app-title`                                         | `satisfies`       | inbound   |
| inter-layer | `ux.librarycomponent.bar-chart`                                         | `satisfies`       | inbound   |
| inter-layer | `ux.librarycomponent.bar-h`                                             | `satisfies`       | inbound   |
| inter-layer | `ux.librarycomponent.chat-composer`                                     | `satisfies`       | inbound   |
| inter-layer | `ux.librarycomponent.chat-container`                                    | `satisfies`       | inbound   |
| inter-layer | `ux.librarycomponent.chat-divider`                                      | `satisfies`       | inbound   |
| inter-layer | `ux.librarycomponent.chat-message`                                      | `satisfies`       | inbound   |
| inter-layer | `ux.librarycomponent.chat-suggestions`                                  | `satisfies`       | inbound   |
| inter-layer | `ux.librarycomponent.diff-viewer`                                       | `satisfies`       | inbound   |
| inter-layer | `ux.librarycomponent.donut`                                             | `satisfies`       | inbound   |
| inter-layer | `ux.librarycomponent.graph-node-ux`                                     | `satisfies`       | inbound   |
| inter-layer | `ux.librarycomponent.heatmap`                                           | `satisfies`       | inbound   |
| inter-layer | `ux.librarycomponent.kanban-board`                                      | `satisfies`       | inbound   |
| inter-layer | `ux.librarycomponent.line-chart`                                        | `satisfies`       | inbound   |
| inter-layer | `ux.librarycomponent.map-canvas`                                        | `satisfies`       | inbound   |
| inter-layer | `ux.librarycomponent.sparkline`                                         | `satisfies`       | inbound   |
| inter-layer | `ux.librarycomponent.stacked-bar`                                       | `satisfies`       | inbound   |
| inter-layer | `ux.librarycomponent.status-timeline`                                   | `satisfies`       | inbound   |
| inter-layer | `ux.librarycomponent.topology-node`                                     | `satisfies`       | inbound   |
| inter-layer | `ux.librarycomponent.trace-viewer`                                      | `satisfies`       | inbound   |
| intra-layer | `motivation.requirement.a-mirror-can-restyle-the-library-from-one-file` | `realizes`        | inbound   |
| intra-layer | `motivation.stakeholder.mirror-maintainer`                              | `associated-with` | inbound   |

### IDE Density and Terse Voice {#ide-density-and-terse-voice}

**ID**: `motivation.principle.ide-density-and-terse-voice`

**Type**: `principle`

Components default to IDE density (14px body, 24px page H1, monospace identifiers and eyebrows) and a terse, impersonal voice: sentence-case headings, no exclamation marks or emoji, confirmations that state the consequence.

#### Attributes

| Name     | Value       |
| -------- | ----------- |
| category | development |

#### Relationships

| Type        | Related Element                                                                      | Predicate   | Direction |
| ----------- | ------------------------------------------------------------------------------------ | ----------- | --------- |
| inter-layer | `ux.librarycomponent.pane-rail`                                                      | `satisfies` | inbound   |
| inter-layer | `ux.librarycomponent.shell-layout`                                                   | `satisfies` | inbound   |
| intra-layer | `motivation.goal.consistent-component-library-for-data-dense-ide-style-applications` | `influence` | outbound  |

### Two-Surface Shell and Canvas {#two-surface-shell-and-canvas}

**ID**: `motivation.principle.two-surface-shell-and-canvas`

**Type**: `principle`

Every screen is built from two surfaces: an always-dark slate-navy shell and a canvas that is white or dark (the dark-canvas class on body). Every colour is a design token in src/tokens/tokens.css with an explicit dark-canvas override; filter() and invert() are never used.

#### Attributes

| Name     | Value        |
| -------- | ------------ |
| category | architecture |

#### Relationships

| Type        | Related Element                                                                      | Predicate   | Direction |
| ----------- | ------------------------------------------------------------------------------------ | ----------- | --------- |
| inter-layer | `ux.librarycomponent.activity-timeline`                                              | `satisfies` | inbound   |
| inter-layer | `ux.librarycomponent.adjacency-matrix`                                               | `satisfies` | inbound   |
| inter-layer | `ux.librarycomponent.alert-strip`                                                    | `satisfies` | inbound   |
| inter-layer | `ux.librarycomponent.app-title`                                                      | `satisfies` | inbound   |
| inter-layer | `ux.librarycomponent.asset-card`                                                     | `satisfies` | inbound   |
| inter-layer | `ux.librarycomponent.asset-grid`                                                     | `satisfies` | inbound   |
| inter-layer | `ux.librarycomponent.avatar`                                                         | `satisfies` | inbound   |
| inter-layer | `ux.librarycomponent.badge`                                                          | `satisfies` | inbound   |
| inter-layer | `ux.librarycomponent.bar-chart`                                                      | `satisfies` | inbound   |
| inter-layer | `ux.librarycomponent.bar-h`                                                          | `satisfies` | inbound   |
| inter-layer | `ux.librarycomponent.bar-v`                                                          | `satisfies` | inbound   |
| inter-layer | `ux.librarycomponent.bridge-node-list`                                               | `satisfies` | inbound   |
| inter-layer | `ux.librarycomponent.button`                                                         | `satisfies` | inbound   |
| inter-layer | `ux.librarycomponent.calendar`                                                       | `satisfies` | inbound   |
| inter-layer | `ux.librarycomponent.camera-controls`                                                | `satisfies` | inbound   |
| inter-layer | `ux.librarycomponent.chart-wrapper`                                                  | `satisfies` | inbound   |
| inter-layer | `ux.librarycomponent.chat-composer`                                                  | `satisfies` | inbound   |
| inter-layer | `ux.librarycomponent.chat-container`                                                 | `satisfies` | inbound   |
| inter-layer | `ux.librarycomponent.chat-divider`                                                   | `satisfies` | inbound   |
| inter-layer | `ux.librarycomponent.chat-markdown-content`                                          | `satisfies` | inbound   |
| inter-layer | `ux.librarycomponent.chat-message`                                                   | `satisfies` | inbound   |
| inter-layer | `ux.librarycomponent.chat-suggestions`                                               | `satisfies` | inbound   |
| inter-layer | `ux.librarycomponent.chip`                                                           | `satisfies` | inbound   |
| inter-layer | `ux.librarycomponent.command-palette`                                                | `satisfies` | inbound   |
| inter-layer | `ux.librarycomponent.config-tile`                                                    | `satisfies` | inbound   |
| inter-layer | `ux.librarycomponent.confirm-dialog`                                                 | `satisfies` | inbound   |
| inter-layer | `ux.librarycomponent.detail-drawer`                                                  | `satisfies` | inbound   |
| inter-layer | `ux.librarycomponent.diff-viewer`                                                    | `satisfies` | inbound   |
| inter-layer | `ux.librarycomponent.donut`                                                          | `satisfies` | inbound   |
| inter-layer | `ux.librarycomponent.drawer`                                                         | `satisfies` | inbound   |
| inter-layer | `ux.librarycomponent.entity-picker`                                                  | `satisfies` | inbound   |
| inter-layer | `ux.librarycomponent.field`                                                          | `satisfies` | inbound   |
| inter-layer | `ux.librarycomponent.filter-bar`                                                     | `satisfies` | inbound   |
| inter-layer | `ux.librarycomponent.filter-dropdown`                                                | `satisfies` | inbound   |
| inter-layer | `ux.librarycomponent.follow-control`                                                 | `satisfies` | inbound   |
| inter-layer | `ux.librarycomponent.form-callout`                                                   | `satisfies` | inbound   |
| inter-layer | `ux.librarycomponent.graph-canvas-ux`                                                | `satisfies` | inbound   |
| inter-layer | `ux.librarycomponent.graph-collapse-control-ux`                                      | `satisfies` | inbound   |
| inter-layer | `ux.librarycomponent.graph-edge-inspector-ux`                                        | `satisfies` | inbound   |
| inter-layer | `ux.librarycomponent.graph-edge-shape-ux`                                            | `satisfies` | inbound   |
| inter-layer | `ux.librarycomponent.graph-edge-ux`                                                  | `satisfies` | inbound   |
| inter-layer | `ux.librarycomponent.graph-inspector-ux`                                             | `satisfies` | inbound   |
| inter-layer | `ux.librarycomponent.graph-node-ux`                                                  | `satisfies` | inbound   |
| inter-layer | `ux.librarycomponent.graph-toolbar-ux`                                               | `satisfies` | inbound   |
| inter-layer | `ux.librarycomponent.hash-set-diff`                                                  | `satisfies` | inbound   |
| inter-layer | `ux.librarycomponent.heatmap`                                                        | `satisfies` | inbound   |
| inter-layer | `ux.librarycomponent.hierarchy-row`                                                  | `satisfies` | inbound   |
| inter-layer | `ux.librarycomponent.hierarchy-tree`                                                 | `satisfies` | inbound   |
| inter-layer | `ux.librarycomponent.hive-plot`                                                      | `satisfies` | inbound   |
| inter-layer | `ux.librarycomponent.icon`                                                           | `satisfies` | inbound   |
| inter-layer | `ux.librarycomponent.inspector-panel`                                                | `satisfies` | inbound   |
| inter-layer | `ux.librarycomponent.kanban-board`                                                   | `satisfies` | inbound   |
| inter-layer | `ux.librarycomponent.key-value-editor`                                               | `satisfies` | inbound   |
| inter-layer | `ux.librarycomponent.kvgrid`                                                         | `satisfies` | inbound   |
| inter-layer | `ux.librarycomponent.layer-list`                                                     | `satisfies` | inbound   |
| inter-layer | `ux.librarycomponent.layer-pair-list`                                                | `satisfies` | inbound   |
| inter-layer | `ux.librarycomponent.layer-stack`                                                    | `satisfies` | inbound   |
| inter-layer | `ux.librarycomponent.layered-graph-context-ux`                                       | `satisfies` | inbound   |
| inter-layer | `ux.librarycomponent.layered-graph-explorer`                                         | `satisfies` | inbound   |
| inter-layer | `ux.librarycomponent.line-chart`                                                     | `satisfies` | inbound   |
| inter-layer | `ux.librarycomponent.lineage-rail`                                                   | `satisfies` | inbound   |
| inter-layer | `ux.librarycomponent.link-category-filter`                                           | `satisfies` | inbound   |
| inter-layer | `ux.librarycomponent.log-stream`                                                     | `satisfies` | inbound   |
| inter-layer | `ux.librarycomponent.map-canvas`                                                     | `satisfies` | inbound   |
| inter-layer | `ux.librarycomponent.metric-row`                                                     | `satisfies` | inbound   |
| inter-layer | `ux.librarycomponent.mini-calendar`                                                  | `satisfies` | inbound   |
| inter-layer | `ux.librarycomponent.modal`                                                          | `satisfies` | inbound   |
| inter-layer | `ux.librarycomponent.nav-item`                                                       | `satisfies` | inbound   |
| inter-layer | `ux.librarycomponent.number-input`                                                   | `satisfies` | inbound   |
| inter-layer | `ux.librarycomponent.ordered-list`                                                   | `satisfies` | inbound   |
| inter-layer | `ux.librarycomponent.page-header`                                                    | `satisfies` | inbound   |
| inter-layer | `ux.librarycomponent.pane-rail`                                                      | `satisfies` | inbound   |
| inter-layer | `ux.librarycomponent.panel`                                                          | `satisfies` | inbound   |
| inter-layer | `ux.librarycomponent.pipeline-card`                                                  | `satisfies` | inbound   |
| inter-layer | `ux.librarycomponent.plane-layout-control`                                           | `satisfies` | inbound   |
| inter-layer | `ux.librarycomponent.popover`                                                        | `satisfies` | inbound   |
| inter-layer | `ux.librarycomponent.predicate-label-control`                                        | `satisfies` | inbound   |
| inter-layer | `ux.librarycomponent.progress-bar`                                                   | `satisfies` | inbound   |
| inter-layer | `ux.librarycomponent.quick-access-grid`                                              | `satisfies` | inbound   |
| inter-layer | `ux.librarycomponent.quick-access-tile`                                              | `satisfies` | inbound   |
| inter-layer | `ux.librarycomponent.reach-inspector`                                                | `satisfies` | inbound   |
| inter-layer | `ux.librarycomponent.relationship-builder`                                           | `satisfies` | inbound   |
| inter-layer | `ux.librarycomponent.result-card`                                                    | `satisfies` | inbound   |
| inter-layer | `ux.librarycomponent.row-menu`                                                       | `satisfies` | inbound   |
| inter-layer | `ux.librarycomponent.segmented-control`                                              | `satisfies` | inbound   |
| inter-layer | `ux.librarycomponent.select`                                                         | `satisfies` | inbound   |
| inter-layer | `ux.librarycomponent.shell-layout`                                                   | `satisfies` | inbound   |
| inter-layer | `ux.librarycomponent.side-by-side-diff`                                              | `satisfies` | inbound   |
| inter-layer | `ux.librarycomponent.sidebar`                                                        | `satisfies` | inbound   |
| inter-layer | `ux.librarycomponent.sparkline`                                                      | `satisfies` | inbound   |
| inter-layer | `ux.librarycomponent.split-pane`                                                     | `satisfies` | inbound   |
| inter-layer | `ux.librarycomponent.stacked-bar`                                                    | `satisfies` | inbound   |
| inter-layer | `ux.librarycomponent.stat-grid`                                                      | `satisfies` | inbound   |
| inter-layer | `ux.librarycomponent.stat-tile`                                                      | `satisfies` | inbound   |
| inter-layer | `ux.librarycomponent.status-badge`                                                   | `satisfies` | inbound   |
| inter-layer | `ux.librarycomponent.status-timeline`                                                | `satisfies` | inbound   |
| inter-layer | `ux.librarycomponent.statusbar`                                                      | `satisfies` | inbound   |
| inter-layer | `ux.librarycomponent.tab-bar`                                                        | `satisfies` | inbound   |
| inter-layer | `ux.librarycomponent.table`                                                          | `satisfies` | inbound   |
| inter-layer | `ux.librarycomponent.text-area`                                                      | `satisfies` | inbound   |
| inter-layer | `ux.librarycomponent.text-input`                                                     | `satisfies` | inbound   |
| inter-layer | `ux.librarycomponent.thinking-block`                                                 | `satisfies` | inbound   |
| inter-layer | `ux.librarycomponent.titlebar`                                                       | `satisfies` | inbound   |
| inter-layer | `ux.librarycomponent.toast`                                                          | `satisfies` | inbound   |
| inter-layer | `ux.librarycomponent.tool-block`                                                     | `satisfies` | inbound   |
| inter-layer | `ux.librarycomponent.tooltip`                                                        | `satisfies` | inbound   |
| inter-layer | `ux.librarycomponent.topbar`                                                         | `satisfies` | inbound   |
| inter-layer | `ux.librarycomponent.topology-node`                                                  | `satisfies` | inbound   |
| inter-layer | `ux.librarycomponent.trace-viewer`                                                   | `satisfies` | inbound   |
| inter-layer | `ux.librarycomponent.tri-state`                                                      | `satisfies` | inbound   |
| inter-layer | `ux.librarycomponent.version-pill`                                                   | `satisfies` | inbound   |
| inter-layer | `ux.librarycomponent.version-timeline`                                               | `satisfies` | inbound   |
| inter-layer | `ux.librarycomponent.view-switcher`                                                  | `satisfies` | inbound   |
| inter-layer | `ux.librarycomponent.workspace-switcher-dialog`                                      | `satisfies` | inbound   |
| intra-layer | `motivation.goal.consistent-component-library-for-data-dense-ide-style-applications` | `influence` | outbound  |

### Zero Literal Node-Overlap Guarantee {#zero-literal-node-overlap-guarantee}

**ID**: `motivation.principle.zero-literal-node-overlap-guarantee`

**Type**: `principle`

Inferred from repeated 'zero literal overlap' language across graphLayout.ts/galaxyLayout.ts (resolveOverlaps, FINAL_CLEANUP_MAX_PASSES, nodeMargin docs) — every layout engine runs an unpadded final cleanup pass specifically to guarantee this regardless of what padding options were requested.

#### Attributes

| Name     | Value        |
| -------- | ------------ |
| category | architecture |

#### Relationships

| Type        | Related Element                                                                 | Predicate         | Direction |
| ----------- | ------------------------------------------------------------------------------- | ----------------- | --------- |
| inter-layer | `testing.testcoveragemodel.heimdall-graph-layout-test-coverage`                 | `satisfies`       | inbound   |
| intra-layer | `motivation.driver.external-regression-gated-layout-quality-loop`               | `influence`       | inbound   |
| intra-layer | `motivation.goal.readable-layout-for-structurally-complex-graphs`               | `influence`       | outbound  |
| intra-layer | `motivation.requirement.no-two-node-boxes-overlap-after-any-layout-engine-runs` | `realizes`        | inbound   |
| intra-layer | `motivation.stakeholder.heimdall-layout-loop-quality-harness`                   | `associated-with` | inbound   |

### A Mirror Can Restyle the Library From One File {#a-mirror-can-restyle-the-library-from-one-file}

**ID**: `motivation.requirement.a-mirror-can-restyle-the-library-from-one-file`

**Type**: `requirement`

Every color the library paints must be reachable from one override file that upstream never edits (src/tokens/theme.css), so a mirror's palette survives each release-tag merge without conflicts. Default rendering stays pixel-identical upstream.

#### Attributes

| Name            | Value      |
| --------------- | ---------- |
| priority        | high       |
| requirementType | functional |

#### Relationships

| Type        | Related Element                                                                      | Predicate         | Direction |
| ----------- | ------------------------------------------------------------------------------------ | ----------------- | --------- |
| inter-layer | `product.feature.theme-slot`                                                         | `satisfies`       | inbound   |
| inter-layer | `product.softwarecapability.ui-primitives`                                           | `satisfies`       | inbound   |
| inter-layer | `testing.testcasesketch.chart-fills-resolve-from-tokens`                             | `satisfies`       | inbound   |
| inter-layer | `testing.testcasesketch.color-literal-check-rejects-a-component-literal`             | `satisfies`       | inbound   |
| inter-layer | `testing.testcasesketch.theme-override-ships-after-the-tokens`                       | `satisfies`       | inbound   |
| intra-layer | `motivation.goal.consistent-component-library-for-data-dense-ide-style-applications` | `realizes`        | outbound  |
| intra-layer | `motivation.principle.every-component-color-comes-from-a-token`                      | `realizes`        | outbound  |
| intra-layer | `motivation.stakeholder.mirror-maintainer`                                           | `associated-with` | inbound   |

### Consumers Bundle Only the Components They Import {#consumers-bundle-only-the-components-they-import}

**ID**: `motivation.requirement.consumers-bundle-only-the-components-they-import`

**Type**: `requirement`

An application that imports one component must bundle only that component and what it uses: the package is built one module per source file and its JS imports no CSS. Shipped in 0.13.0 (CHANGELOG.md: import \{ Button \} yields 365 B where 0.12 yielded 669 KB).

#### Attributes

| Name            | Value          |
| --------------- | -------------- |
| priority        | high           |
| requirementType | non-functional |

#### Relationships

| Type        | Related Element                                                                      | Predicate         | Direction |
| ----------- | ------------------------------------------------------------------------------------ | ----------------- | --------- |
| inter-layer | `product.feature.per-component-imports`                                              | `satisfies`       | inbound   |
| intra-layer | `motivation.goal.consistent-component-library-for-data-dense-ide-style-applications` | `realizes`        | outbound  |
| intra-layer | `motivation.goal.low-friction-adoption-in-any-react-toolchain`                       | `realizes`        | outbound  |
| intra-layer | `motivation.stakeholder.embedding-application-developer-npm-consumer`                | `associated-with` | inbound   |

### Dropdown Panels Render in a Portal by Default {#dropdown-panels-render-in-a-portal-by-default}

**ID**: `motivation.requirement.dropdown-panels-render-in-a-portal-by-default`

**Type**: `requirement`

Decision #328: every .dropdown-panel user (RowMenu, FilterDropdown, Select, EntityPicker) renders its panel in a portal positioned from the trigger rect, flipping when there is no room and repositioning or closing on scroll; portal=\{false\} keeps in-place rendering.

#### Attributes

| Name            | Value      |
| --------------- | ---------- |
| priority        | medium     |
| requirementType | functional |

#### Relationships

| Type        | Related Element                                                                 | Predicate   | Direction |
| ----------- | ------------------------------------------------------------------------------- | ----------- | --------- |
| inter-layer | `application.applicationfunction.dropdown-portal-and-outside-click-containment` | `satisfies` | inbound   |
| inter-layer | `ux.librarycomponent.entity-picker`                                             | `satisfies` | inbound   |
| inter-layer | `ux.librarycomponent.filter-dropdown`                                           | `satisfies` | inbound   |
| inter-layer | `ux.librarycomponent.row-menu`                                                  | `satisfies` | inbound   |
| inter-layer | `ux.librarycomponent.select`                                                    | `satisfies` | inbound   |

### Every Exported Path Resolves in the Published Tarball {#every-exported-path-resolves-in-the-published-tarball}

**ID**: `motivation.requirement.every-exported-path-resolves-in-the-published-tarball`

**Type**: `requirement`

Every path package.json gives consumers (exports, main, types) exists in what npm publishes; 0.9.0 and 0.9.1 shipped a './css' export that pointed at nothing (#303).

#### Attributes

| Name            | Value          |
| --------------- | -------------- |
| priority        | high           |
| requirementType | non-functional |

#### Relationships

| Type        | Related Element                                                | Predicate  | Direction |
| ----------- | -------------------------------------------------------------- | ---------- | --------- |
| intra-layer | `motivation.goal.low-friction-adoption-in-any-react-toolchain` | `realizes` | outbound  |

### Every Public Export Is Documented for Agents {#every-public-export-is-documented-for-agents}

**ID**: `motivation.requirement.every-public-export-is-documented-for-agents`

**Type**: `requirement`

Every component and non-component value exported from src/index.ts must have a section in its category skill under agent-skills/, with props tables that match the component types. Enforced in CI by npm run check:skills (scripts/check-skill-coverage.mjs).

#### Attributes

| Name            | Value   |
| --------------- | ------- |
| priority        | medium  |
| requirementType | quality |

#### Relationships

| Type        | Related Element                                                                      | Predicate   | Direction |
| ----------- | ------------------------------------------------------------------------------------ | ----------- | --------- |
| inter-layer | `ux.librarycomponent.pane-rail`                                                      | `satisfies` | inbound   |
| intra-layer | `motivation.goal.consistent-component-library-for-data-dense-ide-style-applications` | `realizes`  | outbound  |

### Galaxy Keeps Orbits Even Over Round Systems {#galaxy-keeps-orbits-even-over-round-systems}

**ID**: `motivation.requirement.galaxy-keeps-orbits-even-over-round-systems`

**Type**: `requirement`

Decision #288 (2026-11-09): for parents with many satellites or one dominant branch, even orbit slots win over round systems; the trade-off is documented next to SLOT_EVENNESS_BAND and the layout-loop gate is relaxed.

#### Attributes

| Name            | Value   |
| --------------- | ------- |
| priority        | medium  |
| requirementType | quality |

#### Relationships

| Type        | Related Element                                                        | Predicate   | Direction |
| ----------- | ---------------------------------------------------------------------- | ----------- | --------- |
| inter-layer | `application.applicationfunction.galaxy-radial-orbit-layout-algorithm` | `satisfies` | inbound   |
| intra-layer | `motivation.goal.readable-layout-for-structurally-complex-graphs`      | `influence` | inbound   |
| intra-layer | `motivation.goal.readable-layout-for-structurally-complex-graphs`      | `realizes`  | outbound  |

### Graph Nodes and Edges Have Accessible Names {#graph-nodes-and-edges-have-accessible-names}

**ID**: `motivation.requirement.graph-nodes-and-edges-have-accessible-names`

**Type**: `requirement`

Every focusable node, edge and control in a graph has an accessible name (edgeAccessibleName, aria-labels on collapse and toolbar buttons) and can be operated from the keyboard. Checked by tests/graph-a11y-names.spec.ts.

#### Attributes

| Name            | Value          |
| --------------- | -------------- |
| priority        | high           |
| requirementType | non-functional |

#### Relationships

| Type        | Related Element                            | Predicate   | Direction |
| ----------- | ------------------------------------------ | ----------- | --------- |
| inter-layer | `ux.librarycomponent.graph-canvas-ux`      | `satisfies` | inbound   |
| inter-layer | `ux.librarycomponent.graph-node-ux`        | `satisfies` | inbound   |
| intra-layer | `motivation.goal.usable-by-every-end-user` | `realizes`  | outbound  |

### HivePlot Keeps Axis Angles Stable When a Layer Is Hidden {#hiveplot-keeps-axis-angles-stable-when-a-layer-is-hidden}

**ID**: `motivation.requirement.hive-plot-keeps-axis-angles-stable-when-a-layer-is-hidden`

**Type**: `requirement`

Decision #337: a hidden layer leaves a gap and the other axes do not move.

#### Attributes

| Name            | Value      |
| --------------- | ---------- |
| priority        | low        |
| requirementType | functional |

#### Relationships

| Type        | Related Element                                    | Predicate   | Direction |
| ----------- | -------------------------------------------------- | ----------- | --------- |
| inter-layer | `application.applicationfunction.hive-plot-layout` | `satisfies` | inbound   |
| inter-layer | `ux.librarycomponent.hive-plot`                    | `satisfies` | inbound   |

### Large Layouts Do Not Block the First Paint {#large-layouts-do-not-block-the-first-paint}

**ID**: `motivation.requirement.large-layouts-do-not-block-the-first-paint`

**Type**: `requirement`

Engine layouts run only after the computing state has painted (yieldToPaint), and layered layouts above ASYNC_LAYOUT_MIN_NODES run in chunks (layoutLayersAsync), so the canvas and its busy indicator appear before heavy work.

#### Attributes

| Name            | Value   |
| --------------- | ------- |
| priority        | high    |
| requirementType | quality |

#### Relationships

| Type        | Related Element                                                                       | Predicate   | Direction |
| ----------- | ------------------------------------------------------------------------------------- | ----------- | --------- |
| inter-layer | `ux.librarycomponent.graph-canvas-ux`                                                 | `satisfies` | inbound   |
| intra-layer | `motivation.goal.layout-algorithms-that-scale-to-large-dense-and-pathological-graphs` | `realizes`  | outbound  |

### Layout Engines Must Be Pluggable Without Breaking Existing Callers {#layout-engines-must-be-pluggable-without-breaking-existing-callers}

**ID**: `motivation.requirement.layout-engines-must-be-pluggable-without-breaking-existing-callers`

**Type**: `requirement`

Inferred from clusteredForceLayout's own docs ('strictly additive/opt-in: it doesn't change forceLayout's behavior for any existing caller, and is only reached if a caller explicitly chooses it') and GraphCanvas's layout prop union growing over multiple CHANGELOG releases (force -&gt; galaxy -&gt; force-clustered -&gt; ux-navigation -&gt; radial-tree) without breaking earlier modes.

#### Attributes

| Name            | Value          |
| --------------- | -------------- |
| priority        | high           |
| requirementType | non-functional |

#### Relationships

| Type        | Related Element                                                       | Predicate         | Direction |
| ----------- | --------------------------------------------------------------------- | ----------------- | --------- |
| inter-layer | `application.applicationfunction.clustered-force-layout-algorithm`    | `satisfies`       | inbound   |
| inter-layer | `application.applicationfunction.force-directed-layout-algorithm`     | `satisfies`       | inbound   |
| inter-layer | `application.applicationservice.graph-layout-engine-service`          | `satisfies`       | inbound   |
| inter-layer | `product.softwarecapability.clustered-force-layout-community-bubbles` | `satisfies`       | inbound   |
| inter-layer | `ux.librarycomponent.graph-canvas-ux`                                 | `satisfies`       | inbound   |
| intra-layer | `motivation.driver.external-regression-gated-layout-quality-loop`     | `influence`       | inbound   |
| intra-layer | `motivation.stakeholder.embedding-application-developer-npm-consumer` | `associated-with` | inbound   |

### Layout Output Is Deterministic for a Given Input {#layout-output-is-deterministic-for-a-given-input}

**ID**: `motivation.requirement.layout-output-is-deterministic-for-a-given-input`

**Type**: `requirement`

The same nodes and edges produce the same positions on every run: no Math.random, no wall-clock stopping, fixed iteration order and tie-breaks (graphClustering.ts, organicLayout.ts headers; galaxyLayout.ts drag frames).

#### Attributes

| Name            | Value          |
| --------------- | -------------- |
| priority        | high           |
| requirementType | non-functional |

#### Relationships

| Type        | Related Element                                                 | Predicate   | Direction |
| ----------- | --------------------------------------------------------------- | ----------- | --------- |
| inter-layer | `application.applicationfunction.galaxy-live-simulation-step`   | `satisfies` | inbound   |
| inter-layer | `application.applicationfunction.louvain-community-clustering`  | `satisfies` | inbound   |
| inter-layer | `application.applicationfunction.organic-layout-algorithm`      | `satisfies` | inbound   |
| inter-layer | `application.applicationfunction.orthogonal-layout-algorithm`   | `satisfies` | inbound   |
| intra-layer | `motivation.principle.deterministic-reproducible-layout-output` | `realizes`  | outbound  |

### Live Galaxy Drag Stays Interactive {#live-galaxy-drag-stays-interactive}

**ID**: `motivation.requirement.live-galaxy-drag-stays-interactive`

**Type**: `requirement`

Dragging a satellite in live galaxy mode must keep per-frame layout time low and settle in few ticks after release, measured by scripts/bench-galaxy-drag.mjs (#287). No pass/fail threshold is encoded.

#### Attributes

| Name            | Value   |
| --------------- | ------- |
| priority        | medium  |
| requirementType | quality |

#### Relationships

| Type        | Related Element                                                                       | Predicate   | Direction |
| ----------- | ------------------------------------------------------------------------------------- | ----------- | --------- |
| inter-layer | `application.applicationfunction.galaxy-live-simulation-step`                         | `satisfies` | inbound   |
| intra-layer | `motivation.goal.layout-algorithms-that-scale-to-large-dense-and-pathological-graphs` | `realizes`  | outbound  |

### Motion Honours Reduced-Motion Preference {#motion-honours-reduced-motion-preference}

**ID**: `motivation.requirement.motion-honours-reduced-motion-preference`

**Type**: `requirement`

Animated transitions (useTween, viewport easing) skip or shorten motion when the user prefers reduced motion (REDUCED_MOTION_QUERY, usePrefersReducedMotion).

#### Attributes

| Name            | Value          |
| --------------- | -------------- |
| priority        | medium         |
| requirementType | non-functional |

#### Relationships

| Type        | Related Element                            | Predicate   | Direction |
| ----------- | ------------------------------------------ | ----------- | --------- |
| inter-layer | `ux.librarycomponent.graph-canvas-ux`      | `satisfies` | inbound   |
| intra-layer | `motivation.goal.usable-by-every-end-user` | `realizes`  | outbound  |

### Navigation Routing Stays Within Its Time Budget {#navigation-routing-stays-within-its-time-budget}

**ID**: `motivation.requirement.navigation-routing-stays-within-its-time-budget`

**Type**: `requirement`

routeNavigationEdges reruns on every re-measure and drag, so its median batch time must stay under 20/40/100/250 ms for 50/100/200/400 boxes with as many edges (bench:router --check). Not run in CI.

#### Attributes

| Name            | Value   |
| --------------- | ------- |
| priority        | medium  |
| requirementType | quality |

#### Relationships

| Type        | Related Element                                                                       | Predicate   | Direction |
| ----------- | ------------------------------------------------------------------------------------- | ----------- | --------- |
| inter-layer | `application.applicationfunction.navigation-edge-orthogonal-routing`                  | `satisfies` | inbound   |
| intra-layer | `motivation.goal.layout-algorithms-that-scale-to-large-dense-and-pathological-graphs` | `realizes`  | outbound  |

### No Two Node Boxes Overlap After Any Layout Engine Runs {#no-two-node-boxes-overlap-after-any-layout-engine-runs}

**ID**: `motivation.requirement.no-two-node-boxes-overlap-after-any-layout-engine-runs`

**Type**: `requirement`

Every engine finishes with a separation pass so rendered node rectangles do not overlap (resolveOverlaps / separationPass / FINAL_CLEANUP_MAX_PASSES in graphLayout.ts and galaxyLayout.ts).

#### Attributes

| Name            | Value   |
| --------------- | ------- |
| priority        | high    |
| requirementType | quality |

#### Relationships

| Type        | Related Element                                                                                                                       | Predicate   | Direction |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------- | ----------- | --------- |
| inter-layer | `application.applicationfunction.force-directed-layout-algorithm`                                                                     | `satisfies` | inbound   |
| inter-layer | `application.applicationfunction.galaxy-radial-orbit-layout-algorithm`                                                                | `satisfies` | inbound   |
| inter-layer | `application.applicationfunction.node-overlap-separation-pass`                                                                        | `satisfies` | inbound   |
| inter-layer | `application.applicationfunction.organic-layout-algorithm`                                                                            | `satisfies` | inbound   |
| inter-layer | `application.applicationfunction.radial-tree-layout-algorithm`                                                                        | `satisfies` | inbound   |
| inter-layer | `testing.testcasesketch.aspect-ratio-elliptical-warp-composes-with-separate-groups-group-boundaries-stay-non-overlapping-ff23cd4d`    | `satisfies` | inbound   |
| inter-layer | `testing.testcasesketch.aspect-ratio-elliptical-warp-leaning-a-forest-wide-never-makes-galaxies-overlap`                              | `satisfies` | inbound   |
| inter-layer | `testing.testcasesketch.channel-router-route-navigation-edges-applies-nudge-pass-to-spread-overlapping-segments`                      | `satisfies` | inbound   |
| inter-layer | `testing.testcasesketch.channel-router-route-navigation-edges-nudges-overlapping-segments-while-maintaining-orthogonality`            | `satisfies` | inbound   |
| inter-layer | `testing.testcasesketch.force-layout-keeps-default-sized-chip-nodes-non-overlapping-in-a-simple-chain`                                | `satisfies` | inbound   |
| inter-layer | `testing.testcasesketch.galaxy-layout-galaxies-in-a-busy-forest-never-overlap-packed-by-system-circles`                               | `satisfies` | inbound   |
| inter-layer | `testing.testcasesketch.galaxy-layout-independent-galaxies-never-overlap-whatever-their-depth`                                        | `satisfies` | inbound   |
| inter-layer | `testing.testcasesketch.galaxy-live-drag-287-a-flare-drag-frame-resolves-overlaps-with-grid-local-work-not-all-pairs-every-d4f70636`  | `satisfies` | inbound   |
| inter-layer | `testing.testcasesketch.galaxy-live-drag-287-settles-with-no-overlapping-bodies-the-dropped-node-exactly-on-its-pin-its-e250ab4d`     | `satisfies` | inbound   |
| inter-layer | `testing.testcasesketch.galaxy-simulation-step-a-held-drag-carries-its-subtree-settles-and-leaves-no-overlap`                         | `satisfies` | inbound   |
| inter-layer | `testing.testcasesketch.integration-galaxy-layout-collapse-expand-cards-mode-renders-without-overlaps-after-collapse`                 | `satisfies` | inbound   |
| inter-layer | `testing.testcasesketch.integration-galaxy-layout-collapse-expand-collapse-maintains-zero-overlap-guarantee-for-galaxy-f1dd0343`      | `satisfies` | inbound   |
| inter-layer | `testing.testcasesketch.integration-galaxy-layout-collapse-expand-expand-after-collapse-maintains-zero-overlap-guarantee`             | `satisfies` | inbound   |
| inter-layer | `testing.testcasesketch.integration-galaxy-layout-collapse-expand-multiple-collapses-maintain-zero-overlap-guarantee`                 | `satisfies` | inbound   |
| inter-layer | `testing.testcasesketch.integration-galaxy-layout-collapse-expand-renders-every-node-with-no-overlapping-bounding-boxes`              | `satisfies` | inbound   |
| inter-layer | `testing.testcasesketch.integration-galaxy-layout-lab-poc-dataset-stress-test-renders-every-node-with-no-overlapping-7d5e01b7`        | `satisfies` | inbound   |
| inter-layer | `testing.testcasesketch.integration-graph-canvas-components-bus-view-edge-anchors-curvature-two-edges-between-the-same-node-0c36bb99` | `satisfies` | inbound   |
| inter-layer | `testing.testcasesketch.integration-graph-canvas-components-galaxy-view-layout-relations-cards-mode-renders-substantial-13266211`     | `satisfies` | inbound   |
| inter-layer | `testing.testcasesketch.integration-graph-canvas-components-galaxy-view-layout-relations-hovering-any-body-shows-its-orbit-378f0ade`  | `satisfies` | inbound   |
| inter-layer | `testing.testcasesketch.integration-organic-layout-renders-every-node-without-overlapping-bounding-boxes`                             | `satisfies` | inbound   |
| inter-layer | `testing.testcasesketch.integration-orthogonal-layout-renders-every-node-without-overlapping-bounding-boxes`                          | `satisfies` | inbound   |
| inter-layer | `testing.testcasesketch.integration-trace-viewer-interactions-long-attribute-keys-values-truncate-no-overlap-with-a-hover-35742fa3`   | `satisfies` | inbound   |
| inter-layer | `testing.testcasesketch.large-card-nodes-stay-non-overlapping-in-a-bushy-hub-and-spoke-topology`                                      | `satisfies` | inbound   |
| inter-layer | `testing.testcasesketch.layout-lanes-stacks-bands-without-overlap-and-no-two-nodes-overlap`                                           | `satisfies` | inbound   |
| inter-layer | `testing.testcasesketch.nudge-overlapping-segments-does-not-move-a-segment-onto-another-routes-line`                                  | `satisfies` | inbound   |
| inter-layer | `testing.testcasesketch.organic-layout-never-overlaps-nodes-and-honors-minimum-node-distance-as-a-post-condition`                     | `satisfies` | inbound   |
| inter-layer | `testing.testcasesketch.organic-layout-packs-disconnected-components-and-isolates-without-overlap`                                    | `satisfies` | inbound   |
| inter-layer | `testing.testcasesketch.orthogonal-layout-channel-router-graphs-the-lattice-router-cannot-route-survives-a-one-node-drag-db1bbe53`    | `satisfies` | inbound   |
| inter-layer | `testing.testcasesketch.orthogonal-layout-places-every-node-on-the-reported-cell-grid-with-no-overlaps`                               | `satisfies` | inbound   |
| inter-layer | `testing.testcasesketch.place-edge-labels-places-in-priority-order-and-slides-along-the-edge-to-avoid-overlap`                        | `satisfies` | inbound   |
| inter-layer | `testing.testcasesketch.radial-tree-layout-multi-level-single-trunk-does-not-overlap-sibling-nodes-at-the-same-depth`                 | `satisfies` | inbound   |
| inter-layer | `testing.testcasesketch.radial-tree-layout-multiple-disconnected-trunks-arranges-multiple-trunks-without-overlap`                     | `satisfies` | inbound   |
| inter-layer | `testing.testcasesketch.radial-tree-layout-ring-sizing-does-not-overlap-nodes-along-a-chain`                                          | `satisfies` | inbound   |
| inter-layer | `testing.testcasesketch.radial-tree-layout-trunk-boundaries-does-not-overlap-boundaries-of-packed-trunks`                             | `satisfies` | inbound   |
| inter-layer | `testing.testcasesketch.route-lane-gutters-at-dr-scale-synthetic-13-lanes-orientation-uses-about-as-many-gutter-tracks-as-997b2fe9`   | `satisfies` | inbound   |
| inter-layer | `testing.testcasesketch.route-lane-gutters-gives-each-stub-its-own-gap-track-and-overlapping-routes-their-own-gutter-tracks-51c767b0` | `satisfies` | inbound   |
| inter-layer | `testing.testcasesketch.ux-nav-layout-two-page-disconnected-views-do-not-overlap-each-other`                                          | `satisfies` | inbound   |
| inter-layer | `testing.testcasesketch.ux-nav-layout-view-wider-than-2x-view-fan-gap-does-not-overlap-its-parent-page`                               | `satisfies` | inbound   |
| inter-layer | `testing.testcoveragemodel.heimdall-graph-layout-test-coverage`                                                                       | `satisfies` | inbound   |
| intra-layer | `motivation.principle.zero-literal-node-overlap-guarantee`                                                                            | `realizes`  | outbound  |

### Opt-In Component Stylesheets Are Load-Order Independent {#opt-in-component-stylesheets-are-load-order-independent}

**ID**: `motivation.requirement.opt-in-component-stylesheets-are-load-order-independent`

**Type**: `requirement`

Any combination of dist/css/&lt;Name&gt;.css sheets, in any order, renders as dist/style.css does.

#### Attributes

| Name            | Value          |
| --------------- | -------------- |
| priority        | medium         |
| requirementType | non-functional |

#### Relationships

| Type        | Related Element                                                | Predicate  | Direction |
| ----------- | -------------------------------------------------------------- | ---------- | --------- |
| intra-layer | `motivation.goal.low-friction-adoption-in-any-react-toolchain` | `realizes` | outbound  |

### Package Loads as Plain ESM in Node, SSR and Test Runners {#package-loads-as-plain-esm-in-node-ssr-and-test-runners}

**ID**: `motivation.requirement.package-loads-as-plain-esm-in-node-ssr-and-test-runners`

**Type**: `requirement`

No JS module in dist imports CSS, so the package can be imported where CSS imports fail (Node, SSR, Vitest). Checked by check:package and src/components/__tests__/serverRender.test.ts.

#### Attributes

| Name            | Value          |
| --------------- | -------------- |
| priority        | high           |
| requirementType | non-functional |

#### Relationships

| Type        | Related Element                                                | Predicate  | Direction |
| ----------- | -------------------------------------------------------------- | ---------- | --------- |
| intra-layer | `motivation.goal.low-friction-adoption-in-any-react-toolchain` | `realizes` | outbound  |

### Server-Rendered Output Hydrates Without Mismatch {#server-rendered-output-hydrates-without-mismatch}

**ID**: `motivation.requirement.server-rendered-output-hydrates-without-mismatch`

**Type**: `requirement`

Components must render on a server (Astro, Next, vite build --ssr, Vitest) without touching window during render, and hydrate without text or attribute mismatches: media queries resolve after mount and time-relative text takes a fixed now/today. Shipped in 0.13.0 (CHANGELOG.md).

#### Attributes

| Name            | Value          |
| --------------- | -------------- |
| priority        | high           |
| requirementType | non-functional |

#### Relationships

| Type        | Related Element                                                                      | Predicate         | Direction |
| ----------- | ------------------------------------------------------------------------------------ | ----------------- | --------- |
| inter-layer | `application.applicationfunction.fixed-clock-date-formatting`                        | `satisfies`       | inbound   |
| inter-layer | `application.applicationfunction.ssr-safe-media-query`                               | `satisfies`       | inbound   |
| inter-layer | `product.feature.server-side-rendering-support`                                      | `satisfies`       | inbound   |
| inter-layer | `ux.librarycomponent.activity-timeline`                                              | `satisfies`       | inbound   |
| inter-layer | `ux.librarycomponent.calendar`                                                       | `satisfies`       | inbound   |
| inter-layer | `ux.librarycomponent.mini-calendar`                                                  | `satisfies`       | inbound   |
| inter-layer | `ux.librarycomponent.shell-layout`                                                   | `satisfies`       | inbound   |
| inter-layer | `ux.librarycomponent.statusbar`                                                      | `satisfies`       | inbound   |
| inter-layer | `ux.librarycomponent.topbar`                                                         | `satisfies`       | inbound   |
| inter-layer | `ux.librarycomponent.version-timeline`                                               | `satisfies`       | inbound   |
| intra-layer | `motivation.goal.consistent-component-library-for-data-dense-ide-style-applications` | `realizes`        | outbound  |
| intra-layer | `motivation.goal.low-friction-adoption-in-any-react-toolchain`                       | `realizes`        | outbound  |
| intra-layer | `motivation.stakeholder.embedding-application-developer-npm-consumer`                | `associated-with` | inbound   |

### Upstream Publishing Workflows Are Inert in a Mirror {#upstream-publishing-workflows-are-inert-in-a-mirror}

**ID**: `motivation.requirement.upstream-publishing-workflows-are-inert-in-a-mirror`

**Type**: `requirement`

release.yml, deploy-docs.yml and the CI visual-regression shards must run only in tinkermonkey/heimdall: in any other repo a v\* tag publishes nothing, a push to main deploys no docs, and the Visual regression check is green with its shards skipped.

#### Attributes

| Name            | Value      |
| --------------- | ---------- |
| priority        | high       |
| requirementType | functional |

#### Relationships

| Type        | Related Element                                                                      | Predicate         | Direction |
| ----------- | ------------------------------------------------------------------------------------ | ----------------- | --------- |
| inter-layer | `product.feature.theme-slot`                                                         | `satisfies`       | inbound   |
| intra-layer | `motivation.goal.consistent-component-library-for-data-dense-ide-style-applications` | `realizes`        | outbound  |
| intra-layer | `motivation.stakeholder.mirror-maintainer`                                           | `associated-with` | inbound   |

### Embedding Application Developer (npm consumer) {#embedding-application-developer-npm-consumer}

**ID**: `motivation.stakeholder.embedding-application-developer-npm-consumer`

**Type**: `stakeholder`

Inferred: the external developer consuming @tinkermonkey/heimdall-ui's public API (src/index.ts) to embed a graph view in their own product.

#### Attributes

| Name | Value    |
| ---- | -------- |
| type | external |

#### Relationships

| Type        | Related Element                                                                             | Predicate         | Direction |
| ----------- | ------------------------------------------------------------------------------------------- | ----------------- | --------- |
| inter-layer | `business.businessactor.embedding-application-developer`                                    | `references`      | inbound   |
| inter-layer | `product.persona.application-developer-embedding-a-graph-view`                              | `references`      | inbound   |
| intra-layer | `motivation.constraint.every-exported-component-is-covered-by-an-agent-skill`               | `associated-with` | outbound  |
| intra-layer | `motivation.constraint.package-ships-esm-dist-and-agent-skills-only`                        | `associated-with` | outbound  |
| intra-layer | `motivation.requirement.consumers-bundle-only-the-components-they-import`                   | `associated-with` | outbound  |
| intra-layer | `motivation.requirement.layout-engines-must-be-pluggable-without-breaking-existing-callers` | `associated-with` | outbound  |
| intra-layer | `motivation.requirement.server-rendered-output-hydrates-without-mismatch`                   | `associated-with` | outbound  |
| intra-layer | `motivation.goal.consistent-component-library-for-data-dense-ide-style-applications`        | `influence`       | outbound  |
| intra-layer | `motivation.goal.low-friction-adoption-in-any-react-toolchain`                              | `influence`       | outbound  |

### End User of an Embedding Application {#end-user-of-an-embedding-application}

**ID**: `motivation.stakeholder.end-user-of-an-embedding-application`

**Type**: `stakeholder`

Inferred: the person who ultimately interacts with a rendered GraphCanvas inside whatever application embedded it, with no awareness of heimdall itself.

#### Attributes

| Name | Value    |
| ---- | -------- |
| type | end-user |

#### Relationships

| Type        | Related Element                                                   | Predicate    | Direction |
| ----------- | ----------------------------------------------------------------- | ------------ | --------- |
| inter-layer | `business.businessactor.end-user-exploring-a-graph-view`          | `references` | inbound   |
| inter-layer | `product.persona.end-user-exploring-a-rendered-graph`             | `references` | inbound   |
| intra-layer | `motivation.goal.readable-layout-for-structurally-complex-graphs` | `influence`  | outbound  |
| intra-layer | `motivation.goal.usable-by-every-end-user`                        | `influence`  | outbound  |

### heimdall-layout-loop Quality Harness {#heimdall-layout-loop-quality-harness}

**ID**: `motivation.stakeholder.heimdall-layout-loop-quality-harness`

**Type**: `stakeholder`

Inferred from CHANGELOG.md's reference to 'the project's own layout-quality test loop' — an external, automated regression harness that renders/scores heimdall's layout output and gates which proposed algorithm changes are kept.

#### Attributes

| Name | Value  |
| ---- | ------ |
| type | system |

#### Relationships

| Type        | Related Element                                                   | Predicate         | Direction |
| ----------- | ----------------------------------------------------------------- | ----------------- | --------- |
| intra-layer | `motivation.driver.external-regression-gated-layout-quality-loop` | `associated-with` | outbound  |
| intra-layer | `motivation.principle.zero-literal-node-overlap-guarantee`        | `associated-with` | outbound  |

### Mirror Maintainer {#mirror-maintainer}

**ID**: `motivation.stakeholder.mirror-maintainer`

**Type**: `stakeholder`

A downstream team that keeps a mirror of this repo (not a GitHub fork) with its own brand colors, and takes upstream changes by merging release tags.

#### Attributes

| Name | Value    |
| ---- | -------- |
| type | external |

#### Relationships

| Type        | Related Element                                                              | Predicate         | Direction |
| ----------- | ---------------------------------------------------------------------------- | ----------------- | --------- |
| inter-layer | `product.persona.mirror-maintainer-restyling-the-library`                    | `references`      | inbound   |
| intra-layer | `motivation.principle.every-component-color-comes-from-a-token`              | `associated-with` | outbound  |
| intra-layer | `motivation.requirement.a-mirror-can-restyle-the-library-from-one-file`      | `associated-with` | outbound  |
| intra-layer | `motivation.requirement.upstream-publishing-workflows-are-inert-in-a-mirror` | `associated-with` | outbound  |

---

Generated: 2026-11-25T10:08:47.649Z | Model Version: 0.1.0
