# Technology

[← Back to README](../README.md)

Infrastructure, platforms, systems, and technology components.

## Report Index

- [Layer Introduction](#layer-introduction)
- [Intra-Layer Relationships](#intra-layer-relationships)
- [Inter-Layer Dependencies](#inter-layer-dependencies)
- [Inter-Layer Relationships Table](#inter-layer-relationships-table)
- [Element Reference](#element-reference)

## Layer Introduction

| Metric                    | Count |
| ------------------------- | ----- |
| Elements                  | 48    |
| Intra-Layer Relationships | 58    |
| Inter-Layer Relationships | 117   |
| Inbound Relationships     | 115   |
| Outbound Relationships    | 2     |

**Cross-Layer References**:

- **Upstream layers**: [Testing](./13-testing-layer-report.md), [UX](./10-ux-layer-report.md)
- **Downstream layers**: [Application](./05-application-layer-report.md), [Security](./04-security-layer-report.md)

## Intra-Layer Relationships

*This layer has >30 elements. Summary table shown instead of diagram.*

| Element                                                                          | Type                 | Relationships |
| -------------------------------------------------------------------------------- | -------------------- | ------------- |
| `technology.artifact.agent-environment-entrypoint`                               | `artifact`           | 1             |
| `technology.artifact.agent-skills-bundle`                                        | `artifact`           | 1             |
| `technology.artifact.base-stylesheet`                                            | `artifact`           | 4             |
| `technology.artifact.bundled-stylesheet`                                         | `artifact`           | 3             |
| `technology.artifact.ci-dev-server-script`                                       | `artifact`           | 1             |
| `technology.artifact.d3-delaunay`                                                | `artifact`           | 1             |
| `technology.artifact.d3-hierarchy`                                               | `artifact`           | 1             |
| `technology.artifact.design-token-stylesheet`                                    | `artifact`           | 1             |
| `technology.artifact.docs-showcase-site`                                         | `artifact`           | 2             |
| `technology.artifact.eslint`                                                     | `artifact`           | 1             |
| `technology.artifact.font-bundle`                                                | `artifact`           | 2             |
| `technology.artifact.font-download-script`                                       | `artifact`           | 1             |
| `technology.artifact.galaxy-drag-benchmark-script`                               | `artifact`           | 1             |
| `technology.artifact.heimdall-agent-environment-image`                           | `artifact`           | 2             |
| `technology.artifact.heimdall-ui-package`                                        | `artifact`           | 19            |
| `technology.artifact.layered-graph-fixture-builder`                              | `artifact`           | 1             |
| `technology.artifact.legacy-css-forwarder`                                       | `artifact`           | 2             |
| `technology.artifact.per-component-stylesheets`                                  | `artifact`           | 4             |
| `technology.artifact.per-module-esm-build-output`                                | `artifact`           | 2             |
| `technology.artifact.performance-baseline`                                       | `artifact`           | 1             |
| `technology.artifact.playwright-test-runner`                                     | `artifact`           | 1             |
| `technology.artifact.react-dom-peer-dependency`                                  | `artifact`           | 1             |
| `technology.artifact.react-markdown`                                             | `artifact`           | 2             |
| `technology.artifact.react-peer-dependency`                                      | `artifact`           | 1             |
| `technology.artifact.remark-gfm`                                                 | `artifact`           | 2             |
| `technology.artifact.router-benchmark-script`                                    | `artifact`           | 1             |
| `technology.artifact.switchyard-orchestrator`                                    | `artifact`           | 1             |
| `technology.artifact.tailwind-css`                                               | `artifact`           | 2             |
| `technology.artifact.type-declarations`                                          | `artifact`           | 2             |
| `technology.artifact.type-script-compiler-configuration`                         | `artifact`           | 2             |
| `technology.artifact.vite`                                                       | `artifact`           | 2             |
| `technology.artifact.vitest`                                                     | `artifact`           | 1             |
| `technology.node.git-hub-actions-ubuntu-latest-runner`                           | `node`               | 4             |
| `technology.systemsoftware.web-browser`                                          | `systemsoftware`     | 0             |
| `technology.technologyfunction.automated-test-execution`                         | `technologyfunction` | 9             |
| `technology.technologyfunction.library-bundling-and-type-declaration-generation` | `technologyfunction` | 8             |
| `technology.technologyfunction.npm-oidc-trusted-publishing`                      | `technologyfunction` | 1             |
| `technology.technologyfunction.published-package-verification`                   | `technologyfunction` | 1             |
| `technology.technologyfunction.stylesheet-load-order-check`                      | `technologyfunction` | 1             |
| `technology.technologyfunction.stylesheet-splitting-and-ordering`                | `technologyfunction` | 3             |
| `technology.technologyprocess.ci-checks-workflow`                                | `technologyprocess`  | 4             |
| `technology.technologyprocess.deploy-docs-to-git-hub-pages`                      | `technologyprocess`  | 1             |
| `technology.technologyprocess.npm-run-build-vite-build`                          | `technologyprocess`  | 5             |
| `technology.technologyprocess.npm-test-npm-run-testunit`                         | `technologyprocess`  | 4             |
| `technology.technologyprocess.release-to-npm`                                    | `technologyprocess`  | 3             |
| `technology.technologyprocess.update-visual-snapshots-workflow`                  | `technologyprocess`  | 1             |
| `technology.technologyservice.git-hub-pages`                                     | `technologyservice`  | 1             |
| `technology.technologyservice.npm-registry`                                      | `technologyservice`  | 1             |

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
  technology --> application
  technology --> security
  testing --> technology
  ux --> technology
  class technology current
```

## Inter-Layer Relationships Table

| Relationship ID                                                  | Source Node                                                   | Dest Node                                                    | Dest Layer    | Predicate    | Cardinality  | Strength |
| ---------------------------------------------------------------- | ------------------------------------------------------------- | ------------------------------------------------------------ | ------------- | ------------ | ------------ | -------- |
| `technology.artifact.realizes.application.applicationcomponent`  | `technology.artifact.heimdall-ui-package`                     | `application.applicationcomponent.heimdall-ui-package`       | `application` | `realizes`   | many-to-many | medium   |
| `technology.technologyfunction.realizes.security.countermeasure` | `technology.technologyfunction.npm-oidc-trusted-publishing`   | `security.countermeasure.trusted-publishing-with-provenance` | `security`    | `realizes`   | many-to-many | medium   |
| `testing.environmentfactor.references.technology.node`           | `testing.environmentfactor.ci-chromium-rendering-environment` | `technology.node.git-hub-actions-ubuntu-latest-runner`       | `technology`  | `references` | many-to-many | medium   |
| `testing.environmentfactor.references.technology.systemsoftware` | `testing.environmentfactor.ci-chromium-rendering-environment` | `technology.systemsoftware.web-browser`                      | `technology`  | `references` | many-to-many | medium   |
| `ux.librarycomponent.depends-on.technology.systemsoftware`       | `ux.librarycomponent.activity-timeline-ux`                    | `technology.systemsoftware.web-browser`                      | `technology`  | `depends-on` | many-to-many | medium   |
| `ux.librarycomponent.depends-on.technology.systemsoftware`       | `ux.librarycomponent.adjacency-matrix-ux`                     | `technology.systemsoftware.web-browser`                      | `technology`  | `depends-on` | many-to-many | medium   |
| `ux.librarycomponent.depends-on.technology.systemsoftware`       | `ux.librarycomponent.alert-strip-ux`                          | `technology.systemsoftware.web-browser`                      | `technology`  | `depends-on` | many-to-many | medium   |
| `ux.librarycomponent.depends-on.technology.systemsoftware`       | `ux.librarycomponent.app-title-ux`                            | `technology.systemsoftware.web-browser`                      | `technology`  | `depends-on` | many-to-many | medium   |
| `ux.librarycomponent.depends-on.technology.systemsoftware`       | `ux.librarycomponent.asset-card-ux`                           | `technology.systemsoftware.web-browser`                      | `technology`  | `depends-on` | many-to-many | medium   |
| `ux.librarycomponent.depends-on.technology.systemsoftware`       | `ux.librarycomponent.asset-grid-ux`                           | `technology.systemsoftware.web-browser`                      | `technology`  | `depends-on` | many-to-many | medium   |
| `ux.librarycomponent.depends-on.technology.systemsoftware`       | `ux.librarycomponent.avatar-ux`                               | `technology.systemsoftware.web-browser`                      | `technology`  | `depends-on` | many-to-many | medium   |
| `ux.librarycomponent.depends-on.technology.systemsoftware`       | `ux.librarycomponent.badge-ux`                                | `technology.systemsoftware.web-browser`                      | `technology`  | `depends-on` | many-to-many | medium   |
| `ux.librarycomponent.depends-on.technology.systemsoftware`       | `ux.librarycomponent.bar-chart-ux`                            | `technology.systemsoftware.web-browser`                      | `technology`  | `depends-on` | many-to-many | medium   |
| `ux.librarycomponent.depends-on.technology.systemsoftware`       | `ux.librarycomponent.bar-h-ux`                                | `technology.systemsoftware.web-browser`                      | `technology`  | `depends-on` | many-to-many | medium   |
| `ux.librarycomponent.depends-on.technology.systemsoftware`       | `ux.librarycomponent.bar-v-ux`                                | `technology.systemsoftware.web-browser`                      | `technology`  | `depends-on` | many-to-many | medium   |
| `ux.librarycomponent.depends-on.technology.systemsoftware`       | `ux.librarycomponent.bridge-node-list-ux`                     | `technology.systemsoftware.web-browser`                      | `technology`  | `depends-on` | many-to-many | medium   |
| `ux.librarycomponent.depends-on.technology.systemsoftware`       | `ux.librarycomponent.button-ux`                               | `technology.systemsoftware.web-browser`                      | `technology`  | `depends-on` | many-to-many | medium   |
| `ux.librarycomponent.depends-on.technology.systemsoftware`       | `ux.librarycomponent.calendar-ux`                             | `technology.systemsoftware.web-browser`                      | `technology`  | `depends-on` | many-to-many | medium   |
| `ux.librarycomponent.depends-on.technology.systemsoftware`       | `ux.librarycomponent.camera-controls-ux`                      | `technology.systemsoftware.web-browser`                      | `technology`  | `depends-on` | many-to-many | medium   |
| `ux.librarycomponent.depends-on.technology.systemsoftware`       | `ux.librarycomponent.chart-wrapper-ux`                        | `technology.systemsoftware.web-browser`                      | `technology`  | `depends-on` | many-to-many | medium   |
| `ux.librarycomponent.depends-on.technology.systemsoftware`       | `ux.librarycomponent.chat-composer-ux`                        | `technology.systemsoftware.web-browser`                      | `technology`  | `depends-on` | many-to-many | medium   |
| `ux.librarycomponent.depends-on.technology.systemsoftware`       | `ux.librarycomponent.chat-container-ux`                       | `technology.systemsoftware.web-browser`                      | `technology`  | `depends-on` | many-to-many | medium   |
| `ux.librarycomponent.depends-on.technology.systemsoftware`       | `ux.librarycomponent.chat-divider-ux`                         | `technology.systemsoftware.web-browser`                      | `technology`  | `depends-on` | many-to-many | medium   |
| `ux.librarycomponent.depends-on.technology.systemsoftware`       | `ux.librarycomponent.chat-markdown-content-ux`                | `technology.systemsoftware.web-browser`                      | `technology`  | `depends-on` | many-to-many | medium   |
| `ux.librarycomponent.depends-on.technology.systemsoftware`       | `ux.librarycomponent.chat-message-ux`                         | `technology.systemsoftware.web-browser`                      | `technology`  | `depends-on` | many-to-many | medium   |
| `ux.librarycomponent.depends-on.technology.systemsoftware`       | `ux.librarycomponent.chat-suggestions-ux`                     | `technology.systemsoftware.web-browser`                      | `technology`  | `depends-on` | many-to-many | medium   |
| `ux.librarycomponent.depends-on.technology.systemsoftware`       | `ux.librarycomponent.chip-ux`                                 | `technology.systemsoftware.web-browser`                      | `technology`  | `depends-on` | many-to-many | medium   |
| `ux.librarycomponent.depends-on.technology.systemsoftware`       | `ux.librarycomponent.command-palette-ux`                      | `technology.systemsoftware.web-browser`                      | `technology`  | `depends-on` | many-to-many | medium   |
| `ux.librarycomponent.depends-on.technology.systemsoftware`       | `ux.librarycomponent.config-tile-ux`                          | `technology.systemsoftware.web-browser`                      | `technology`  | `depends-on` | many-to-many | medium   |
| `ux.librarycomponent.depends-on.technology.systemsoftware`       | `ux.librarycomponent.confirm-dialog-ux`                       | `technology.systemsoftware.web-browser`                      | `technology`  | `depends-on` | many-to-many | medium   |
| `ux.librarycomponent.depends-on.technology.systemsoftware`       | `ux.librarycomponent.detail-drawer-ux`                        | `technology.systemsoftware.web-browser`                      | `technology`  | `depends-on` | many-to-many | medium   |
| `ux.librarycomponent.depends-on.technology.systemsoftware`       | `ux.librarycomponent.diff-viewer-ux`                          | `technology.systemsoftware.web-browser`                      | `technology`  | `depends-on` | many-to-many | medium   |
| `ux.librarycomponent.depends-on.technology.systemsoftware`       | `ux.librarycomponent.donut-ux`                                | `technology.systemsoftware.web-browser`                      | `technology`  | `depends-on` | many-to-many | medium   |
| `ux.librarycomponent.depends-on.technology.systemsoftware`       | `ux.librarycomponent.drawer-ux`                               | `technology.systemsoftware.web-browser`                      | `technology`  | `depends-on` | many-to-many | medium   |
| `ux.librarycomponent.depends-on.technology.systemsoftware`       | `ux.librarycomponent.entity-picker-ux`                        | `technology.systemsoftware.web-browser`                      | `technology`  | `depends-on` | many-to-many | medium   |
| `ux.librarycomponent.depends-on.technology.systemsoftware`       | `ux.librarycomponent.field-ux`                                | `technology.systemsoftware.web-browser`                      | `technology`  | `depends-on` | many-to-many | medium   |
| `ux.librarycomponent.depends-on.technology.systemsoftware`       | `ux.librarycomponent.filter-bar-ux`                           | `technology.systemsoftware.web-browser`                      | `technology`  | `depends-on` | many-to-many | medium   |
| `ux.librarycomponent.depends-on.technology.systemsoftware`       | `ux.librarycomponent.filter-dropdown-ux`                      | `technology.systemsoftware.web-browser`                      | `technology`  | `depends-on` | many-to-many | medium   |
| `ux.librarycomponent.depends-on.technology.systemsoftware`       | `ux.librarycomponent.follow-control-ux`                       | `technology.systemsoftware.web-browser`                      | `technology`  | `depends-on` | many-to-many | medium   |
| `ux.librarycomponent.depends-on.technology.systemsoftware`       | `ux.librarycomponent.form-callout-ux`                         | `technology.systemsoftware.web-browser`                      | `technology`  | `depends-on` | many-to-many | medium   |
| `ux.librarycomponent.depends-on.technology.systemsoftware`       | `ux.librarycomponent.graph-canvas-ux`                         | `technology.systemsoftware.web-browser`                      | `technology`  | `depends-on` | many-to-many | medium   |
| `ux.librarycomponent.depends-on.technology.systemsoftware`       | `ux.librarycomponent.graph-collapse-control-ux`               | `technology.systemsoftware.web-browser`                      | `technology`  | `depends-on` | many-to-many | medium   |
| `ux.librarycomponent.depends-on.technology.systemsoftware`       | `ux.librarycomponent.graph-edge-inspector-ux`                 | `technology.systemsoftware.web-browser`                      | `technology`  | `depends-on` | many-to-many | medium   |
| `ux.librarycomponent.depends-on.technology.systemsoftware`       | `ux.librarycomponent.graph-edge-shape-ux`                     | `technology.systemsoftware.web-browser`                      | `technology`  | `depends-on` | many-to-many | medium   |
| `ux.librarycomponent.depends-on.technology.systemsoftware`       | `ux.librarycomponent.graph-edge-ux`                           | `technology.systemsoftware.web-browser`                      | `technology`  | `depends-on` | many-to-many | medium   |
| `ux.librarycomponent.depends-on.technology.systemsoftware`       | `ux.librarycomponent.graph-inspector-ux`                      | `technology.systemsoftware.web-browser`                      | `technology`  | `depends-on` | many-to-many | medium   |
| `ux.librarycomponent.depends-on.technology.systemsoftware`       | `ux.librarycomponent.graph-node-ux`                           | `technology.systemsoftware.web-browser`                      | `technology`  | `depends-on` | many-to-many | medium   |
| `ux.librarycomponent.depends-on.technology.systemsoftware`       | `ux.librarycomponent.graph-toolbar-ux`                        | `technology.systemsoftware.web-browser`                      | `technology`  | `depends-on` | many-to-many | medium   |
| `ux.librarycomponent.depends-on.technology.systemsoftware`       | `ux.librarycomponent.hash-set-diff-ux`                        | `technology.systemsoftware.web-browser`                      | `technology`  | `depends-on` | many-to-many | medium   |
| `ux.librarycomponent.depends-on.technology.systemsoftware`       | `ux.librarycomponent.heatmap-ux`                              | `technology.systemsoftware.web-browser`                      | `technology`  | `depends-on` | many-to-many | medium   |
| `ux.librarycomponent.depends-on.technology.systemsoftware`       | `ux.librarycomponent.hierarchy-row-ux`                        | `technology.systemsoftware.web-browser`                      | `technology`  | `depends-on` | many-to-many | medium   |
| `ux.librarycomponent.depends-on.technology.systemsoftware`       | `ux.librarycomponent.hierarchy-tree-ux`                       | `technology.systemsoftware.web-browser`                      | `technology`  | `depends-on` | many-to-many | medium   |
| `ux.librarycomponent.depends-on.technology.systemsoftware`       | `ux.librarycomponent.hive-plot-ux`                            | `technology.systemsoftware.web-browser`                      | `technology`  | `depends-on` | many-to-many | medium   |
| `ux.librarycomponent.depends-on.technology.systemsoftware`       | `ux.librarycomponent.icon-ux`                                 | `technology.systemsoftware.web-browser`                      | `technology`  | `depends-on` | many-to-many | medium   |
| `ux.librarycomponent.depends-on.technology.systemsoftware`       | `ux.librarycomponent.inspector-panel-ux`                      | `technology.systemsoftware.web-browser`                      | `technology`  | `depends-on` | many-to-many | medium   |
| `ux.librarycomponent.depends-on.technology.systemsoftware`       | `ux.librarycomponent.kanban-board-ux`                         | `technology.systemsoftware.web-browser`                      | `technology`  | `depends-on` | many-to-many | medium   |
| `ux.librarycomponent.depends-on.technology.systemsoftware`       | `ux.librarycomponent.key-value-editor-ux`                     | `technology.systemsoftware.web-browser`                      | `technology`  | `depends-on` | many-to-many | medium   |
| `ux.librarycomponent.depends-on.technology.systemsoftware`       | `ux.librarycomponent.kvgrid-ux`                               | `technology.systemsoftware.web-browser`                      | `technology`  | `depends-on` | many-to-many | medium   |
| `ux.librarycomponent.depends-on.technology.systemsoftware`       | `ux.librarycomponent.layer-list-ux`                           | `technology.systemsoftware.web-browser`                      | `technology`  | `depends-on` | many-to-many | medium   |
| `ux.librarycomponent.depends-on.technology.systemsoftware`       | `ux.librarycomponent.layer-pair-list-ux`                      | `technology.systemsoftware.web-browser`                      | `technology`  | `depends-on` | many-to-many | medium   |
| `ux.librarycomponent.depends-on.technology.systemsoftware`       | `ux.librarycomponent.layer-stack-ux`                          | `technology.systemsoftware.web-browser`                      | `technology`  | `depends-on` | many-to-many | medium   |
| `ux.librarycomponent.depends-on.technology.systemsoftware`       | `ux.librarycomponent.layered-graph-context-ux`                | `technology.systemsoftware.web-browser`                      | `technology`  | `depends-on` | many-to-many | medium   |
| `ux.librarycomponent.depends-on.technology.systemsoftware`       | `ux.librarycomponent.layered-graph-explorer-ux`               | `technology.systemsoftware.web-browser`                      | `technology`  | `depends-on` | many-to-many | medium   |
| `ux.librarycomponent.depends-on.technology.systemsoftware`       | `ux.librarycomponent.line-chart-ux`                           | `technology.systemsoftware.web-browser`                      | `technology`  | `depends-on` | many-to-many | medium   |
| `ux.librarycomponent.depends-on.technology.systemsoftware`       | `ux.librarycomponent.lineage-rail-ux`                         | `technology.systemsoftware.web-browser`                      | `technology`  | `depends-on` | many-to-many | medium   |
| `ux.librarycomponent.depends-on.technology.systemsoftware`       | `ux.librarycomponent.link-category-filter-ux`                 | `technology.systemsoftware.web-browser`                      | `technology`  | `depends-on` | many-to-many | medium   |
| `ux.librarycomponent.depends-on.technology.systemsoftware`       | `ux.librarycomponent.log-stream-ux`                           | `technology.systemsoftware.web-browser`                      | `technology`  | `depends-on` | many-to-many | medium   |
| `ux.librarycomponent.depends-on.technology.systemsoftware`       | `ux.librarycomponent.map-canvas-ux`                           | `technology.systemsoftware.web-browser`                      | `technology`  | `depends-on` | many-to-many | medium   |
| `ux.librarycomponent.depends-on.technology.systemsoftware`       | `ux.librarycomponent.metric-row-ux`                           | `technology.systemsoftware.web-browser`                      | `technology`  | `depends-on` | many-to-many | medium   |
| `ux.librarycomponent.depends-on.technology.systemsoftware`       | `ux.librarycomponent.mini-calendar-ux`                        | `technology.systemsoftware.web-browser`                      | `technology`  | `depends-on` | many-to-many | medium   |
| `ux.librarycomponent.depends-on.technology.systemsoftware`       | `ux.librarycomponent.modal-ux`                                | `technology.systemsoftware.web-browser`                      | `technology`  | `depends-on` | many-to-many | medium   |
| `ux.librarycomponent.depends-on.technology.systemsoftware`       | `ux.librarycomponent.nav-item-ux`                             | `technology.systemsoftware.web-browser`                      | `technology`  | `depends-on` | many-to-many | medium   |
| `ux.librarycomponent.depends-on.technology.systemsoftware`       | `ux.librarycomponent.number-input-ux`                         | `technology.systemsoftware.web-browser`                      | `technology`  | `depends-on` | many-to-many | medium   |
| `ux.librarycomponent.depends-on.technology.systemsoftware`       | `ux.librarycomponent.ordered-list-ux`                         | `technology.systemsoftware.web-browser`                      | `technology`  | `depends-on` | many-to-many | medium   |
| `ux.librarycomponent.depends-on.technology.systemsoftware`       | `ux.librarycomponent.page-header-ux`                          | `technology.systemsoftware.web-browser`                      | `technology`  | `depends-on` | many-to-many | medium   |
| `ux.librarycomponent.depends-on.technology.systemsoftware`       | `ux.librarycomponent.panel-ux`                                | `technology.systemsoftware.web-browser`                      | `technology`  | `depends-on` | many-to-many | medium   |
| `ux.librarycomponent.depends-on.technology.systemsoftware`       | `ux.librarycomponent.pipeline-card-ux`                        | `technology.systemsoftware.web-browser`                      | `technology`  | `depends-on` | many-to-many | medium   |
| `ux.librarycomponent.depends-on.technology.systemsoftware`       | `ux.librarycomponent.plane-layout-control-ux`                 | `technology.systemsoftware.web-browser`                      | `technology`  | `depends-on` | many-to-many | medium   |
| `ux.librarycomponent.depends-on.technology.systemsoftware`       | `ux.librarycomponent.popover-ux`                              | `technology.systemsoftware.web-browser`                      | `technology`  | `depends-on` | many-to-many | medium   |
| `ux.librarycomponent.depends-on.technology.systemsoftware`       | `ux.librarycomponent.predicate-label-control-ux`              | `technology.systemsoftware.web-browser`                      | `technology`  | `depends-on` | many-to-many | medium   |
| `ux.librarycomponent.depends-on.technology.systemsoftware`       | `ux.librarycomponent.progress-bar-ux`                         | `technology.systemsoftware.web-browser`                      | `technology`  | `depends-on` | many-to-many | medium   |
| `ux.librarycomponent.depends-on.technology.systemsoftware`       | `ux.librarycomponent.quick-access-grid-ux`                    | `technology.systemsoftware.web-browser`                      | `technology`  | `depends-on` | many-to-many | medium   |
| `ux.librarycomponent.depends-on.technology.systemsoftware`       | `ux.librarycomponent.quick-access-tile-ux`                    | `technology.systemsoftware.web-browser`                      | `technology`  | `depends-on` | many-to-many | medium   |
| `ux.librarycomponent.depends-on.technology.systemsoftware`       | `ux.librarycomponent.reach-inspector-ux`                      | `technology.systemsoftware.web-browser`                      | `technology`  | `depends-on` | many-to-many | medium   |
| `ux.librarycomponent.depends-on.technology.systemsoftware`       | `ux.librarycomponent.relationship-builder-ux`                 | `technology.systemsoftware.web-browser`                      | `technology`  | `depends-on` | many-to-many | medium   |
| `ux.librarycomponent.depends-on.technology.systemsoftware`       | `ux.librarycomponent.result-card-ux`                          | `technology.systemsoftware.web-browser`                      | `technology`  | `depends-on` | many-to-many | medium   |
| `ux.librarycomponent.depends-on.technology.systemsoftware`       | `ux.librarycomponent.row-menu-ux`                             | `technology.systemsoftware.web-browser`                      | `technology`  | `depends-on` | many-to-many | medium   |
| `ux.librarycomponent.depends-on.technology.systemsoftware`       | `ux.librarycomponent.segmented-control-ux`                    | `technology.systemsoftware.web-browser`                      | `technology`  | `depends-on` | many-to-many | medium   |
| `ux.librarycomponent.depends-on.technology.systemsoftware`       | `ux.librarycomponent.select-ux`                               | `technology.systemsoftware.web-browser`                      | `technology`  | `depends-on` | many-to-many | medium   |
| `ux.librarycomponent.depends-on.technology.systemsoftware`       | `ux.librarycomponent.shell-layout-ux`                         | `technology.systemsoftware.web-browser`                      | `technology`  | `depends-on` | many-to-many | medium   |
| `ux.librarycomponent.depends-on.technology.systemsoftware`       | `ux.librarycomponent.side-by-side-diff-ux`                    | `technology.systemsoftware.web-browser`                      | `technology`  | `depends-on` | many-to-many | medium   |
| `ux.librarycomponent.depends-on.technology.systemsoftware`       | `ux.librarycomponent.sidebar-ux`                              | `technology.systemsoftware.web-browser`                      | `technology`  | `depends-on` | many-to-many | medium   |
| `ux.librarycomponent.depends-on.technology.systemsoftware`       | `ux.librarycomponent.sparkline-ux`                            | `technology.systemsoftware.web-browser`                      | `technology`  | `depends-on` | many-to-many | medium   |
| `ux.librarycomponent.depends-on.technology.systemsoftware`       | `ux.librarycomponent.split-pane-ux`                           | `technology.systemsoftware.web-browser`                      | `technology`  | `depends-on` | many-to-many | medium   |
| `ux.librarycomponent.depends-on.technology.systemsoftware`       | `ux.librarycomponent.stacked-bar-ux`                          | `technology.systemsoftware.web-browser`                      | `technology`  | `depends-on` | many-to-many | medium   |
| `ux.librarycomponent.depends-on.technology.systemsoftware`       | `ux.librarycomponent.stat-grid-ux`                            | `technology.systemsoftware.web-browser`                      | `technology`  | `depends-on` | many-to-many | medium   |
| `ux.librarycomponent.depends-on.technology.systemsoftware`       | `ux.librarycomponent.stat-tile-ux`                            | `technology.systemsoftware.web-browser`                      | `technology`  | `depends-on` | many-to-many | medium   |
| `ux.librarycomponent.depends-on.technology.systemsoftware`       | `ux.librarycomponent.status-badge-ux`                         | `technology.systemsoftware.web-browser`                      | `technology`  | `depends-on` | many-to-many | medium   |
| `ux.librarycomponent.depends-on.technology.systemsoftware`       | `ux.librarycomponent.status-timeline-ux`                      | `technology.systemsoftware.web-browser`                      | `technology`  | `depends-on` | many-to-many | medium   |
| `ux.librarycomponent.depends-on.technology.systemsoftware`       | `ux.librarycomponent.statusbar-ux`                            | `technology.systemsoftware.web-browser`                      | `technology`  | `depends-on` | many-to-many | medium   |
| `ux.librarycomponent.depends-on.technology.systemsoftware`       | `ux.librarycomponent.tab-bar-ux`                              | `technology.systemsoftware.web-browser`                      | `technology`  | `depends-on` | many-to-many | medium   |
| `ux.librarycomponent.depends-on.technology.systemsoftware`       | `ux.librarycomponent.table-ux`                                | `technology.systemsoftware.web-browser`                      | `technology`  | `depends-on` | many-to-many | medium   |
| `ux.librarycomponent.depends-on.technology.systemsoftware`       | `ux.librarycomponent.text-area-ux`                            | `technology.systemsoftware.web-browser`                      | `technology`  | `depends-on` | many-to-many | medium   |
| `ux.librarycomponent.depends-on.technology.systemsoftware`       | `ux.librarycomponent.text-input-ux`                           | `technology.systemsoftware.web-browser`                      | `technology`  | `depends-on` | many-to-many | medium   |
| `ux.librarycomponent.depends-on.technology.systemsoftware`       | `ux.librarycomponent.thinking-block-ux`                       | `technology.systemsoftware.web-browser`                      | `technology`  | `depends-on` | many-to-many | medium   |
| `ux.librarycomponent.depends-on.technology.systemsoftware`       | `ux.librarycomponent.titlebar-ux`                             | `technology.systemsoftware.web-browser`                      | `technology`  | `depends-on` | many-to-many | medium   |
| `ux.librarycomponent.depends-on.technology.systemsoftware`       | `ux.librarycomponent.toast-ux`                                | `technology.systemsoftware.web-browser`                      | `technology`  | `depends-on` | many-to-many | medium   |
| `ux.librarycomponent.depends-on.technology.systemsoftware`       | `ux.librarycomponent.tool-block-ux`                           | `technology.systemsoftware.web-browser`                      | `technology`  | `depends-on` | many-to-many | medium   |
| `ux.librarycomponent.depends-on.technology.systemsoftware`       | `ux.librarycomponent.tooltip-ux`                              | `technology.systemsoftware.web-browser`                      | `technology`  | `depends-on` | many-to-many | medium   |
| `ux.librarycomponent.depends-on.technology.systemsoftware`       | `ux.librarycomponent.topbar-ux`                               | `technology.systemsoftware.web-browser`                      | `technology`  | `depends-on` | many-to-many | medium   |
| `ux.librarycomponent.depends-on.technology.systemsoftware`       | `ux.librarycomponent.topology-node-ux`                        | `technology.systemsoftware.web-browser`                      | `technology`  | `depends-on` | many-to-many | medium   |
| `ux.librarycomponent.depends-on.technology.systemsoftware`       | `ux.librarycomponent.trace-viewer-ux`                         | `technology.systemsoftware.web-browser`                      | `technology`  | `depends-on` | many-to-many | medium   |
| `ux.librarycomponent.depends-on.technology.systemsoftware`       | `ux.librarycomponent.tri-state-ux`                            | `technology.systemsoftware.web-browser`                      | `technology`  | `depends-on` | many-to-many | medium   |
| `ux.librarycomponent.depends-on.technology.systemsoftware`       | `ux.librarycomponent.version-pill-ux`                         | `technology.systemsoftware.web-browser`                      | `technology`  | `depends-on` | many-to-many | medium   |
| `ux.librarycomponent.depends-on.technology.systemsoftware`       | `ux.librarycomponent.version-timeline-ux`                     | `technology.systemsoftware.web-browser`                      | `technology`  | `depends-on` | many-to-many | medium   |
| `ux.librarycomponent.depends-on.technology.systemsoftware`       | `ux.librarycomponent.view-switcher-ux`                        | `technology.systemsoftware.web-browser`                      | `technology`  | `depends-on` | many-to-many | medium   |
| `ux.librarycomponent.depends-on.technology.systemsoftware`       | `ux.librarycomponent.workspace-switcher-dialog-ux`            | `technology.systemsoftware.web-browser`                      | `technology`  | `depends-on` | many-to-many | medium   |

## Element Reference

### Agent Environment Entrypoint {#agent-environment-entrypoint}

**ID**: `technology.artifact.agent-environment-entrypoint`

**Type**: `artifact`

heimdall-docker-entrypoint.sh: links the image's pre-installed node_modules into the bind-mounted /workspace at container start.

#### Attributes

| Name         | Value  |
| ------------ | ------ |
| artifactType | script |

#### Relationships

| Type        | Related Element                                        | Predicate  | Direction |
| ----------- | ------------------------------------------------------ | ---------- | --------- |
| intra-layer | `technology.artifact.heimdall-agent-environment-image` | `composes` | inbound   |

### Agent Skills Bundle {#agent-skills-bundle}

**ID**: `technology.artifact.agent-skills-bundle`

**Type**: `artifact`

agent-skills/: Claude Code skills documenting every exported component for coding agents in consumer repos; shipped inside the npm package (files: dist, agent-skills).

#### Attributes

| Name         | Value |
| ------------ | ----- |
| artifactType | file  |

#### Relationships

| Type        | Related Element                           | Predicate  | Direction |
| ----------- | ----------------------------------------- | ---------- | --------- |
| intra-layer | `technology.artifact.heimdall-ui-package` | `composes` | inbound   |

### Base Stylesheet {#base-stylesheet}

**ID**: `technology.artifact.base-stylesheet`

**Type**: `artifact`

dist/css/base.css, the './css/base' export: tokens.css plus styles/utilities.css, the sheet every opt-in component sheet assumes.

#### Attributes

| Name         | Value |
| ------------ | ----- |
| artifactType | file  |

#### Relationships

| Type        | Related Element                                                   | Predicate    | Direction |
| ----------- | ----------------------------------------------------------------- | ------------ | --------- |
| intra-layer | `technology.artifact.design-token-stylesheet`                     | `composes`   | outbound  |
| intra-layer | `technology.artifact.heimdall-ui-package`                         | `composes`   | inbound   |
| intra-layer | `technology.artifact.per-component-stylesheets`                   | `depends-on` | inbound   |
| intra-layer | `technology.technologyfunction.stylesheet-splitting-and-ordering` | `accesses`   | inbound   |

### Bundled Stylesheet {#bundled-stylesheet}

**ID**: `technology.artifact.bundled-stylesheet`

**Type**: `artifact`

dist/style.css, the './css' export: every stylesheet (tokens, utilities, all components) in ESM evaluation order, minified as one file.

#### Attributes

| Name         | Value |
| ------------ | ----- |
| artifactType | file  |

#### Relationships

| Type        | Related Element                                                   | Predicate    | Direction |
| ----------- | ----------------------------------------------------------------- | ------------ | --------- |
| intra-layer | `technology.artifact.heimdall-ui-package`                         | `composes`   | inbound   |
| intra-layer | `technology.artifact.legacy-css-forwarder`                        | `depends-on` | inbound   |
| intra-layer | `technology.technologyfunction.stylesheet-splitting-and-ordering` | `accesses`   | inbound   |

### CI Dev Server Script {#ci-dev-server-script}

**ID**: `technology.artifact.ci-dev-server-script`

**Type**: `artifact`

scripts/ci-dev-server.sh: starts the Vite dev server for Playwright in CI from a copy of the config in /tmp, for runners where the checkout is not writable.

#### Attributes

| Name         | Value  |
| ------------ | ------ |
| artifactType | script |

#### Relationships

| Type        | Related Element                                          | Predicate  | Direction |
| ----------- | -------------------------------------------------------- | ---------- | --------- |
| intra-layer | `technology.technologyfunction.automated-test-execution` | `accesses` | inbound   |

### d3-delaunay {#d3-delaunay}

**ID**: `technology.artifact.d3-delaunay`

**Type**: `artifact`

Runtime dependency (externalized, decision #343): Delaunay triangulation used by organicLayout.

#### Attributes

| Name         | Value   |
| ------------ | ------- |
| artifactType | library |

#### Relationships

| Type        | Related Element                           | Predicate    | Direction |
| ----------- | ----------------------------------------- | ------------ | --------- |
| intra-layer | `technology.artifact.heimdall-ui-package` | `depends-on` | inbound   |

### d3-hierarchy {#d3-hierarchy}

**ID**: `technology.artifact.d3-hierarchy`

**Type**: `artifact`

Real runtime dependency used directly by uxNavLayout (tree), radialTreeLayout (tree, packSiblings), and graphPacking (pack, hierarchy) for tree layout and circle packing.

#### Attributes

| Name         | Value   |
| ------------ | ------- |
| artifactType | library |

#### Relationships

| Type        | Related Element                           | Predicate    | Direction |
| ----------- | ----------------------------------------- | ------------ | --------- |
| intra-layer | `technology.artifact.heimdall-ui-package` | `depends-on` | inbound   |

### Design Token Stylesheet {#design-token-stylesheet}

**ID**: `technology.artifact.design-token-stylesheet`

**Type**: `artifact`

src/tokens/tokens.css: about 260 CSS custom properties (shell and canvas surfaces, accent, status colors, radius, shadow, fonts, spacing) that tailwind.config.ts maps every theme key to; .dark-canvas on body overrides every --canvas-\* value. Shipped inside base.css and style.css.

#### Attributes

| Name         | Value |
| ------------ | ----- |
| artifactType | file  |

#### Relationships

| Type        | Related Element                       | Predicate  | Direction |
| ----------- | ------------------------------------- | ---------- | --------- |
| intra-layer | `technology.artifact.base-stylesheet` | `composes` | inbound   |

### Docs Showcase Site {#docs-showcase-site}

**ID**: `technology.artifact.docs-showcase-site`

**Type**: `artifact`

docs/: the Vite + React showcase app built to docs/dist and published to GitHub Pages (tinkermonkey.github.io/heimdall).

#### Attributes

| Name         | Value   |
| ------------ | ------- |
| artifactType | archive |

#### Relationships

| Type        | Related Element                                             | Predicate    | Direction |
| ----------- | ----------------------------------------------------------- | ------------ | --------- |
| intra-layer | `technology.artifact.heimdall-ui-package`                   | `depends-on` | outbound  |
| intra-layer | `technology.technologyprocess.deploy-docs-to-git-hub-pages` | `accesses`   | inbound   |

### ESLint {#eslint}

**ID**: `technology.artifact.eslint`

**Type**: `artifact`

devDependency: lint gate in CI (npm run lint over src/, docs/src/, scripts/).

#### Attributes

| Name         | Value   |
| ------------ | ------- |
| artifactType | library |

#### Relationships

| Type        | Related Element                                   | Predicate  | Direction |
| ----------- | ------------------------------------------------- | ---------- | --------- |
| intra-layer | `technology.technologyprocess.ci-checks-workflow` | `accesses` | inbound   |

### Font Bundle {#font-bundle}

**ID**: `technology.artifact.font-bundle`

**Type**: `artifact`

Inter and JetBrains Mono font files with fonts.css, kept in public/fonts (fetched by scripts/download-fonts.js) and copied to dist/fonts; the './fonts' export.

#### Attributes

| Name         | Value   |
| ------------ | ------- |
| artifactType | archive |

#### Relationships

| Type        | Related Element                            | Predicate    | Direction |
| ----------- | ------------------------------------------ | ------------ | --------- |
| intra-layer | `technology.artifact.font-download-script` | `depends-on` | inbound   |
| intra-layer | `technology.artifact.heimdall-ui-package`  | `composes`   | inbound   |

### Font Download Script {#font-download-script}

**ID**: `technology.artifact.font-download-script`

**Type**: `artifact`

scripts/download-fonts.js (npm run setup): fetches the Inter and JetBrains Mono files into public/fonts, the only copy, which the build copies to dist/fonts.

#### Attributes

| Name         | Value  |
| ------------ | ------ |
| artifactType | script |

#### Relationships

| Type        | Related Element                   | Predicate    | Direction |
| ----------- | --------------------------------- | ------------ | --------- |
| intra-layer | `technology.artifact.font-bundle` | `depends-on` | outbound  |

### Galaxy Drag Benchmark Script {#galaxy-drag-benchmark-script}

**ID**: `technology.artifact.galaxy-drag-benchmark-script`

**Type**: `artifact`

scripts/bench-galaxy-drag.mjs: headless live-simulation drag benchmark for galaxySimulationStep.

#### Attributes

| Name         | Value  |
| ------------ | ------ |
| artifactType | script |

#### Relationships

| Type        | Related Element                                          | Predicate  | Direction |
| ----------- | -------------------------------------------------------- | ---------- | --------- |
| intra-layer | `technology.technologyfunction.automated-test-execution` | `accesses` | inbound   |

### Heimdall Agent Environment Image {#heimdall-agent-environment-image}

**ID**: `technology.artifact.heimdall-agent-environment-image`

**Type**: `artifact`

Dockerfile.agent: container image for coding agents working on this repo, with Playwright/Chromium system libraries, fonts and pinned locale and TZ for consistent screenshots.

#### Attributes

| Name         | Value           |
| ------------ | --------------- |
| artifactType | container-image |

#### Relationships

| Type        | Related Element                                    | Predicate    | Direction |
| ----------- | -------------------------------------------------- | ------------ | --------- |
| intra-layer | `technology.artifact.agent-environment-entrypoint` | `composes`   | outbound  |
| intra-layer | `technology.artifact.switchyard-orchestrator`      | `depends-on` | outbound  |

### Heimdall UI Package {#heimdall-ui-package}

**ID**: `technology.artifact.heimdall-ui-package`

**Type**: `artifact`

The published @tinkermonkey/heimdall-ui npm package (0.13.0): per-module ESM, type declarations, bundled and per-component stylesheets, fonts and agent-skills, published from release.yml with npm provenance. Covers the whole component library, not only the graph surface.

#### Attributes

| Name         | Value   |
| ------------ | ------- |
| artifactType | library |

#### Relationships

| Type        | Related Element                                                                  | Predicate    | Direction |
| ----------- | -------------------------------------------------------------------------------- | ------------ | --------- |
| inter-layer | `application.applicationcomponent.heimdall-ui-package`                           | `realizes`   | outbound  |
| intra-layer | `technology.artifact.docs-showcase-site`                                         | `depends-on` | inbound   |
| intra-layer | `technology.artifact.agent-skills-bundle`                                        | `composes`   | outbound  |
| intra-layer | `technology.artifact.base-stylesheet`                                            | `composes`   | outbound  |
| intra-layer | `technology.artifact.bundled-stylesheet`                                         | `composes`   | outbound  |
| intra-layer | `technology.artifact.font-bundle`                                                | `composes`   | outbound  |
| intra-layer | `technology.artifact.legacy-css-forwarder`                                       | `composes`   | outbound  |
| intra-layer | `technology.artifact.per-component-stylesheets`                                  | `composes`   | outbound  |
| intra-layer | `technology.artifact.per-module-esm-build-output`                                | `composes`   | outbound  |
| intra-layer | `technology.artifact.type-declarations`                                          | `composes`   | outbound  |
| intra-layer | `technology.artifact.d3-delaunay`                                                | `depends-on` | outbound  |
| intra-layer | `technology.artifact.d3-hierarchy`                                               | `depends-on` | outbound  |
| intra-layer | `technology.artifact.react-dom-peer-dependency`                                  | `depends-on` | outbound  |
| intra-layer | `technology.artifact.react-markdown`                                             | `depends-on` | outbound  |
| intra-layer | `technology.artifact.react-peer-dependency`                                      | `depends-on` | outbound  |
| intra-layer | `technology.artifact.remark-gfm`                                                 | `depends-on` | outbound  |
| intra-layer | `technology.technologyfunction.library-bundling-and-type-declaration-generation` | `accesses`   | inbound   |
| intra-layer | `technology.technologyfunction.npm-oidc-trusted-publishing`                      | `accesses`   | inbound   |
| intra-layer | `technology.technologyfunction.published-package-verification`                   | `accesses`   | inbound   |
| intra-layer | `technology.technologyprocess.release-to-npm`                                    | `accesses`   | inbound   |

### Layered Graph Fixture Builder {#layered-graph-fixture-builder}

**ID**: `technology.artifact.layered-graph-fixture-builder`

**Type**: `artifact`

scripts/build-layered-fixtures.mjs: generates src/test-pages/fixtures from Documentation Robotics data, the DR spec meta-model (read from the sibling ../documentation_robotics/spec checkout) and this repo's own documentation-robotics/model. The layered-graph test fixtures therefore depend on the DR model and on a second repository.

#### Attributes

| Name         | Value  |
| ------------ | ------ |
| artifactType | script |

#### Relationships

| Type        | Related Element                                          | Predicate  | Direction |
| ----------- | -------------------------------------------------------- | ---------- | --------- |
| intra-layer | `technology.technologyfunction.automated-test-execution` | `accesses` | inbound   |

### Legacy CSS Forwarder {#legacy-css-forwarder}

**ID**: `technology.artifact.legacy-css-forwarder`

**Type**: `artifact`

dist/heimdall-ui.css, a one-line @import of style.css kept for consumers who pointed at the 0.9.0/0.9.1 file name directly. Deprecated.

#### Attributes

| Name         | Value |
| ------------ | ----- |
| artifactType | file  |

#### Relationships

| Type        | Related Element                           | Predicate    | Direction |
| ----------- | ----------------------------------------- | ------------ | --------- |
| intra-layer | `technology.artifact.heimdall-ui-package` | `composes`   | inbound   |
| intra-layer | `technology.artifact.bundled-stylesheet`  | `depends-on` | outbound  |

### Per-Component Stylesheets {#per-component-stylesheets}

**ID**: `technology.artifact.per-component-stylesheets`

**Type**: `artifact`

dist/css/&lt;Name&gt;.css, the './css/\*' exports (0.13.0): one sheet per component module holding its own CSS and that of every component it renders, minus base, so an app can load only the CSS it uses.

#### Attributes

| Name         | Value |
| ------------ | ----- |
| artifactType | file  |

#### Relationships

| Type        | Related Element                                                   | Predicate    | Direction |
| ----------- | ----------------------------------------------------------------- | ------------ | --------- |
| intra-layer | `technology.artifact.heimdall-ui-package`                         | `composes`   | inbound   |
| intra-layer | `technology.artifact.base-stylesheet`                             | `depends-on` | outbound  |
| intra-layer | `technology.technologyfunction.stylesheet-load-order-check`       | `accesses`   | inbound   |
| intra-layer | `technology.technologyfunction.stylesheet-splitting-and-ordering` | `accesses`   | inbound   |

### Per-Module ESM Build Output {#per-module-esm-build-output}

**ID**: `technology.artifact.per-module-esm-build-output`

**Type**: `artifact`

dist/&lt;module&gt;.js: one ESM file per source module (rollup preserveModules, root src), CJS dropped (#343), so a consumer's bundler drops the modules of components it never imports. No JS module imports CSS, so Node, SSR builds and test runners load it as plain ESM.

#### Attributes

| Name         | Value   |
| ------------ | ------- |
| artifactType | library |

#### Relationships

| Type        | Related Element                                                                  | Predicate  | Direction |
| ----------- | -------------------------------------------------------------------------------- | ---------- | --------- |
| intra-layer | `technology.artifact.heimdall-ui-package`                                        | `composes` | inbound   |
| intra-layer | `technology.technologyfunction.library-bundling-and-type-declaration-generation` | `accesses` | inbound   |

### Performance Baseline {#performance-baseline}

**ID**: `technology.artifact.performance-baseline`

**Type**: `artifact`

performance-baseline.json from scripts/measure-performance.js: bundle sizes and render times recorded 2026-05-17 for the single-bundle build. Stale since the 0.13.0 per-module build and not checked by anything.

#### Attributes

| Name         | Value         |
| ------------ | ------------- |
| artifactType | configuration |

#### Relationships

| Type        | Related Element                                          | Predicate  | Direction |
| ----------- | -------------------------------------------------------- | ---------- | --------- |
| intra-layer | `technology.technologyfunction.automated-test-execution` | `accesses` | inbound   |

### Playwright Test Runner {#playwright-test-runner}

**ID**: `technology.artifact.playwright-test-runner`

**Type**: `artifact`

@playwright/test devDependency driving the browser-based visual/behavioral regression suite in tests/, including all graph-\*.spec.ts files.

#### Attributes

| Name         | Value   |
| ------------ | ------- |
| artifactType | library |

#### Relationships

| Type        | Related Element                                          | Predicate  | Direction |
| ----------- | -------------------------------------------------------- | ---------- | --------- |
| intra-layer | `technology.technologyfunction.automated-test-execution` | `accesses` | inbound   |

### react-dom (peer dependency) {#react-dom-peer-dependency}

**ID**: `technology.artifact.react-dom-peer-dependency`

**Type**: `artifact`

react-dom ^18 \|\| ^19 peer dependency. The library renders through it (createPortal for dropdown panels, server rendering in tests) and leaves it external in the build.

#### Attributes

| Name         | Value   |
| ------------ | ------- |
| artifactType | library |

#### Relationships

| Type        | Related Element                           | Predicate    | Direction |
| ----------- | ----------------------------------------- | ------------ | --------- |
| intra-layer | `technology.artifact.heimdall-ui-package` | `depends-on` | inbound   |

### react-markdown {#react-markdown}

**ID**: `technology.artifact.react-markdown`

**Type**: `artifact`

Runtime dependency (externalized): renders chat markdown in ChatMarkdownContent.

#### Attributes

| Name         | Value   |
| ------------ | ------- |
| artifactType | library |

#### Relationships

| Type        | Related Element                           | Predicate    | Direction |
| ----------- | ----------------------------------------- | ------------ | --------- |
| intra-layer | `technology.artifact.heimdall-ui-package` | `depends-on` | inbound   |
| intra-layer | `technology.artifact.remark-gfm`          | `depends-on` | outbound  |

### React (peer dependency) {#react-peer-dependency}

**ID**: `technology.artifact.react-peer-dependency`

**Type**: `artifact`

React 18/19 peer dependency GraphCanvas and all other components are built against.

#### Attributes

| Name         | Value   |
| ------------ | ------- |
| artifactType | library |

#### Relationships

| Type        | Related Element                           | Predicate    | Direction |
| ----------- | ----------------------------------------- | ------------ | --------- |
| intra-layer | `technology.artifact.heimdall-ui-package` | `depends-on` | inbound   |

### remark-gfm {#remark-gfm}

**ID**: `technology.artifact.remark-gfm`

**Type**: `artifact`

Runtime dependency (externalized): GitHub-flavoured markdown plugin for react-markdown.

#### Attributes

| Name         | Value   |
| ------------ | ------- |
| artifactType | library |

#### Relationships

| Type        | Related Element                           | Predicate    | Direction |
| ----------- | ----------------------------------------- | ------------ | --------- |
| intra-layer | `technology.artifact.heimdall-ui-package` | `depends-on` | inbound   |
| intra-layer | `technology.artifact.react-markdown`      | `depends-on` | inbound   |

### Router Benchmark Script {#router-benchmark-script}

**ID**: `technology.artifact.router-benchmark-script`

**Type**: `artifact`

scripts/bench-router.mjs (npm run bench:router): seeded grid benchmark of routeNavigationEdges with a route fingerprint and per-size budgets.

#### Attributes

| Name         | Value  |
| ------------ | ------ |
| artifactType | script |

#### Relationships

| Type        | Related Element                                          | Predicate  | Direction |
| ----------- | -------------------------------------------------------- | ---------- | --------- |
| intra-layer | `technology.technologyfunction.automated-test-execution` | `accesses` | inbound   |

### switchyard-orchestrator {#switchyard-orchestrator}

**ID**: `technology.artifact.switchyard-orchestrator`

**Type**: `artifact`

Base image of Dockerfile.agent (FROM switchyard-orchestrator:latest), built elsewhere.

#### Attributes

| Name         | Value           |
| ------------ | --------------- |
| artifactType | container-image |

#### Relationships

| Type        | Related Element                                        | Predicate    | Direction |
| ----------- | ------------------------------------------------------ | ------------ | --------- |
| intra-layer | `technology.artifact.heimdall-agent-environment-image` | `depends-on` | inbound   |

### Tailwind CSS {#tailwind-css}

**ID**: `technology.artifact.tailwind-css`

**Type**: `artifact`

devDependency: utility CSS whose theme is wired to the design tokens in src/tokens/tokens.css (tailwind.config.ts).

#### Attributes

| Name         | Value   |
| ------------ | ------- |
| artifactType | library |

#### Relationships

| Type        | Related Element                                                                  | Predicate  | Direction |
| ----------- | -------------------------------------------------------------------------------- | ---------- | --------- |
| intra-layer | `technology.technologyfunction.library-bundling-and-type-declaration-generation` | `accesses` | inbound   |
| intra-layer | `technology.technologyprocess.ci-checks-workflow`                                | `accesses` | inbound   |

### Type Declarations {#type-declarations}

**ID**: `technology.artifact.type-declarations`

**Type**: `artifact`

dist/\*\*/\*.d.ts generated by vite-plugin-dts for the public API only (the dev app, test pages and tests are excluded); the package's types entry.

#### Attributes

| Name         | Value |
| ------------ | ----- |
| artifactType | file  |

#### Relationships

| Type        | Related Element                                                                  | Predicate  | Direction |
| ----------- | -------------------------------------------------------------------------------- | ---------- | --------- |
| intra-layer | `technology.artifact.heimdall-ui-package`                                        | `composes` | inbound   |
| intra-layer | `technology.technologyfunction.library-bundling-and-type-declaration-generation` | `accesses` | inbound   |

### TypeScript Compiler Configuration {#typescript-compiler-configuration}

**ID**: `technology.artifact.type-script-compiler-configuration`

**Type**: `artifact`

tsconfig.json — strict TypeScript configuration, including allowImportingTsExtensions so scripts/render-and-score.mjs (in the sibling layout-loop harness) can import graphLayout.ts directly via Node's --experimental-strip-types without a build step.

#### Attributes

| Name         | Value         |
| ------------ | ------------- |
| artifactType | configuration |

#### Relationships

| Type        | Related Element                                                                  | Predicate  | Direction |
| ----------- | -------------------------------------------------------------------------------- | ---------- | --------- |
| intra-layer | `technology.technologyfunction.library-bundling-and-type-declaration-generation` | `accesses` | inbound   |
| intra-layer | `technology.technologyprocess.npm-run-build-vite-build`                          | `accesses` | inbound   |

### Vite {#vite}

**ID**: `technology.artifact.vite`

**Type**: `artifact`

Build tool (devDependency): dev server, library-mode build of dist/, and the docs site build.

#### Attributes

| Name         | Value   |
| ------------ | ------- |
| artifactType | library |

#### Relationships

| Type        | Related Element                                                                  | Predicate  | Direction |
| ----------- | -------------------------------------------------------------------------------- | ---------- | --------- |
| intra-layer | `technology.technologyfunction.library-bundling-and-type-declaration-generation` | `accesses` | inbound   |
| intra-layer | `technology.technologyprocess.npm-run-build-vite-build`                          | `accesses` | inbound   |

### Vitest {#vitest}

**ID**: `technology.artifact.vitest`

**Type**: `artifact`

vitest devDependency running pure-function unit tests for layout/routing algorithms (channelRouter.test.ts, radialTreeLayout.test.ts).

#### Attributes

| Name         | Value   |
| ------------ | ------- |
| artifactType | library |

#### Relationships

| Type        | Related Element                                          | Predicate  | Direction |
| ----------- | -------------------------------------------------------- | ---------- | --------- |
| intra-layer | `technology.technologyfunction.automated-test-execution` | `accesses` | inbound   |

### GitHub Actions ubuntu-latest Runner {#github-actions-ubuntu-latest-runner}

**ID**: `technology.node.git-hub-actions-ubuntu-latest-runner`

**Type**: `node`

Hosted runner VM that runs every workflow; the reference rasterizer for the -linux.png baselines.

#### Attributes

| Name     | Value           |
| -------- | --------------- |
| nodeType | virtual-machine |

#### Relationships

| Type        | Related Element                                                                  | Predicate     | Direction |
| ----------- | -------------------------------------------------------------------------------- | ------------- | --------- |
| inter-layer | `testing.environmentfactor.ci-chromium-rendering-environment`                    | `references`  | inbound   |
| intra-layer | `technology.technologyfunction.automated-test-execution`                         | `assigned-to` | outbound  |
| intra-layer | `technology.technologyfunction.library-bundling-and-type-declaration-generation` | `assigned-to` | outbound  |
| intra-layer | `technology.technologyservice.git-hub-pages`                                     | `serves`      | inbound   |
| intra-layer | `technology.technologyservice.npm-registry`                                      | `serves`      | inbound   |

### Web Browser {#web-browser}

**ID**: `technology.systemsoftware.web-browser`

**Type**: `systemsoftware`

The consumer's browser, which runs every Heimdall component: DOM and SVG rendering, ResizeObserver for node measurement, requestAnimationFrame for live simulation and tweens, matchMedia for useMediaQuery. Heimdall itself has no server; it runs inside the host app's page. softwareType is middleware for want of a browser or runtime value in the enum.

#### Attributes

| Name         | Value      |
| ------------ | ---------- |
| softwareType | middleware |

#### Relationships

| Type        | Related Element                                               | Predicate    | Direction |
| ----------- | ------------------------------------------------------------- | ------------ | --------- |
| inter-layer | `testing.environmentfactor.ci-chromium-rendering-environment` | `references` | inbound   |
| inter-layer | `ux.librarycomponent.activity-timeline-ux`                    | `depends-on` | inbound   |
| inter-layer | `ux.librarycomponent.adjacency-matrix-ux`                     | `depends-on` | inbound   |
| inter-layer | `ux.librarycomponent.alert-strip-ux`                          | `depends-on` | inbound   |
| inter-layer | `ux.librarycomponent.app-title-ux`                            | `depends-on` | inbound   |
| inter-layer | `ux.librarycomponent.asset-card-ux`                           | `depends-on` | inbound   |
| inter-layer | `ux.librarycomponent.asset-grid-ux`                           | `depends-on` | inbound   |
| inter-layer | `ux.librarycomponent.avatar-ux`                               | `depends-on` | inbound   |
| inter-layer | `ux.librarycomponent.badge-ux`                                | `depends-on` | inbound   |
| inter-layer | `ux.librarycomponent.bar-chart-ux`                            | `depends-on` | inbound   |
| inter-layer | `ux.librarycomponent.bar-h-ux`                                | `depends-on` | inbound   |
| inter-layer | `ux.librarycomponent.bar-v-ux`                                | `depends-on` | inbound   |
| inter-layer | `ux.librarycomponent.bridge-node-list-ux`                     | `depends-on` | inbound   |
| inter-layer | `ux.librarycomponent.button-ux`                               | `depends-on` | inbound   |
| inter-layer | `ux.librarycomponent.calendar-ux`                             | `depends-on` | inbound   |
| inter-layer | `ux.librarycomponent.camera-controls-ux`                      | `depends-on` | inbound   |
| inter-layer | `ux.librarycomponent.chart-wrapper-ux`                        | `depends-on` | inbound   |
| inter-layer | `ux.librarycomponent.chat-composer-ux`                        | `depends-on` | inbound   |
| inter-layer | `ux.librarycomponent.chat-container-ux`                       | `depends-on` | inbound   |
| inter-layer | `ux.librarycomponent.chat-divider-ux`                         | `depends-on` | inbound   |
| inter-layer | `ux.librarycomponent.chat-markdown-content-ux`                | `depends-on` | inbound   |
| inter-layer | `ux.librarycomponent.chat-message-ux`                         | `depends-on` | inbound   |
| inter-layer | `ux.librarycomponent.chat-suggestions-ux`                     | `depends-on` | inbound   |
| inter-layer | `ux.librarycomponent.chip-ux`                                 | `depends-on` | inbound   |
| inter-layer | `ux.librarycomponent.command-palette-ux`                      | `depends-on` | inbound   |
| inter-layer | `ux.librarycomponent.config-tile-ux`                          | `depends-on` | inbound   |
| inter-layer | `ux.librarycomponent.confirm-dialog-ux`                       | `depends-on` | inbound   |
| inter-layer | `ux.librarycomponent.detail-drawer-ux`                        | `depends-on` | inbound   |
| inter-layer | `ux.librarycomponent.diff-viewer-ux`                          | `depends-on` | inbound   |
| inter-layer | `ux.librarycomponent.donut-ux`                                | `depends-on` | inbound   |
| inter-layer | `ux.librarycomponent.drawer-ux`                               | `depends-on` | inbound   |
| inter-layer | `ux.librarycomponent.entity-picker-ux`                        | `depends-on` | inbound   |
| inter-layer | `ux.librarycomponent.field-ux`                                | `depends-on` | inbound   |
| inter-layer | `ux.librarycomponent.filter-bar-ux`                           | `depends-on` | inbound   |
| inter-layer | `ux.librarycomponent.filter-dropdown-ux`                      | `depends-on` | inbound   |
| inter-layer | `ux.librarycomponent.follow-control-ux`                       | `depends-on` | inbound   |
| inter-layer | `ux.librarycomponent.form-callout-ux`                         | `depends-on` | inbound   |
| inter-layer | `ux.librarycomponent.graph-canvas-ux`                         | `depends-on` | inbound   |
| inter-layer | `ux.librarycomponent.graph-collapse-control-ux`               | `depends-on` | inbound   |
| inter-layer | `ux.librarycomponent.graph-edge-inspector-ux`                 | `depends-on` | inbound   |
| inter-layer | `ux.librarycomponent.graph-edge-shape-ux`                     | `depends-on` | inbound   |
| inter-layer | `ux.librarycomponent.graph-edge-ux`                           | `depends-on` | inbound   |
| inter-layer | `ux.librarycomponent.graph-inspector-ux`                      | `depends-on` | inbound   |
| inter-layer | `ux.librarycomponent.graph-node-ux`                           | `depends-on` | inbound   |
| inter-layer | `ux.librarycomponent.graph-toolbar-ux`                        | `depends-on` | inbound   |
| inter-layer | `ux.librarycomponent.hash-set-diff-ux`                        | `depends-on` | inbound   |
| inter-layer | `ux.librarycomponent.heatmap-ux`                              | `depends-on` | inbound   |
| inter-layer | `ux.librarycomponent.hierarchy-row-ux`                        | `depends-on` | inbound   |
| inter-layer | `ux.librarycomponent.hierarchy-tree-ux`                       | `depends-on` | inbound   |
| inter-layer | `ux.librarycomponent.hive-plot-ux`                            | `depends-on` | inbound   |
| inter-layer | `ux.librarycomponent.icon-ux`                                 | `depends-on` | inbound   |
| inter-layer | `ux.librarycomponent.inspector-panel-ux`                      | `depends-on` | inbound   |
| inter-layer | `ux.librarycomponent.kanban-board-ux`                         | `depends-on` | inbound   |
| inter-layer | `ux.librarycomponent.key-value-editor-ux`                     | `depends-on` | inbound   |
| inter-layer | `ux.librarycomponent.kvgrid-ux`                               | `depends-on` | inbound   |
| inter-layer | `ux.librarycomponent.layer-list-ux`                           | `depends-on` | inbound   |
| inter-layer | `ux.librarycomponent.layer-pair-list-ux`                      | `depends-on` | inbound   |
| inter-layer | `ux.librarycomponent.layer-stack-ux`                          | `depends-on` | inbound   |
| inter-layer | `ux.librarycomponent.layered-graph-context-ux`                | `depends-on` | inbound   |
| inter-layer | `ux.librarycomponent.layered-graph-explorer-ux`               | `depends-on` | inbound   |
| inter-layer | `ux.librarycomponent.line-chart-ux`                           | `depends-on` | inbound   |
| inter-layer | `ux.librarycomponent.lineage-rail-ux`                         | `depends-on` | inbound   |
| inter-layer | `ux.librarycomponent.link-category-filter-ux`                 | `depends-on` | inbound   |
| inter-layer | `ux.librarycomponent.log-stream-ux`                           | `depends-on` | inbound   |
| inter-layer | `ux.librarycomponent.map-canvas-ux`                           | `depends-on` | inbound   |
| inter-layer | `ux.librarycomponent.metric-row-ux`                           | `depends-on` | inbound   |
| inter-layer | `ux.librarycomponent.mini-calendar-ux`                        | `depends-on` | inbound   |
| inter-layer | `ux.librarycomponent.modal-ux`                                | `depends-on` | inbound   |
| inter-layer | `ux.librarycomponent.nav-item-ux`                             | `depends-on` | inbound   |
| inter-layer | `ux.librarycomponent.number-input-ux`                         | `depends-on` | inbound   |
| inter-layer | `ux.librarycomponent.ordered-list-ux`                         | `depends-on` | inbound   |
| inter-layer | `ux.librarycomponent.page-header-ux`                          | `depends-on` | inbound   |
| inter-layer | `ux.librarycomponent.panel-ux`                                | `depends-on` | inbound   |
| inter-layer | `ux.librarycomponent.pipeline-card-ux`                        | `depends-on` | inbound   |
| inter-layer | `ux.librarycomponent.plane-layout-control-ux`                 | `depends-on` | inbound   |
| inter-layer | `ux.librarycomponent.popover-ux`                              | `depends-on` | inbound   |
| inter-layer | `ux.librarycomponent.predicate-label-control-ux`              | `depends-on` | inbound   |
| inter-layer | `ux.librarycomponent.progress-bar-ux`                         | `depends-on` | inbound   |
| inter-layer | `ux.librarycomponent.quick-access-grid-ux`                    | `depends-on` | inbound   |
| inter-layer | `ux.librarycomponent.quick-access-tile-ux`                    | `depends-on` | inbound   |
| inter-layer | `ux.librarycomponent.reach-inspector-ux`                      | `depends-on` | inbound   |
| inter-layer | `ux.librarycomponent.relationship-builder-ux`                 | `depends-on` | inbound   |
| inter-layer | `ux.librarycomponent.result-card-ux`                          | `depends-on` | inbound   |
| inter-layer | `ux.librarycomponent.row-menu-ux`                             | `depends-on` | inbound   |
| inter-layer | `ux.librarycomponent.segmented-control-ux`                    | `depends-on` | inbound   |
| inter-layer | `ux.librarycomponent.select-ux`                               | `depends-on` | inbound   |
| inter-layer | `ux.librarycomponent.shell-layout-ux`                         | `depends-on` | inbound   |
| inter-layer | `ux.librarycomponent.side-by-side-diff-ux`                    | `depends-on` | inbound   |
| inter-layer | `ux.librarycomponent.sidebar-ux`                              | `depends-on` | inbound   |
| inter-layer | `ux.librarycomponent.sparkline-ux`                            | `depends-on` | inbound   |
| inter-layer | `ux.librarycomponent.split-pane-ux`                           | `depends-on` | inbound   |
| inter-layer | `ux.librarycomponent.stacked-bar-ux`                          | `depends-on` | inbound   |
| inter-layer | `ux.librarycomponent.stat-grid-ux`                            | `depends-on` | inbound   |
| inter-layer | `ux.librarycomponent.stat-tile-ux`                            | `depends-on` | inbound   |
| inter-layer | `ux.librarycomponent.status-badge-ux`                         | `depends-on` | inbound   |
| inter-layer | `ux.librarycomponent.status-timeline-ux`                      | `depends-on` | inbound   |
| inter-layer | `ux.librarycomponent.statusbar-ux`                            | `depends-on` | inbound   |
| inter-layer | `ux.librarycomponent.tab-bar-ux`                              | `depends-on` | inbound   |
| inter-layer | `ux.librarycomponent.table-ux`                                | `depends-on` | inbound   |
| inter-layer | `ux.librarycomponent.text-area-ux`                            | `depends-on` | inbound   |
| inter-layer | `ux.librarycomponent.text-input-ux`                           | `depends-on` | inbound   |
| inter-layer | `ux.librarycomponent.thinking-block-ux`                       | `depends-on` | inbound   |
| inter-layer | `ux.librarycomponent.titlebar-ux`                             | `depends-on` | inbound   |
| inter-layer | `ux.librarycomponent.toast-ux`                                | `depends-on` | inbound   |
| inter-layer | `ux.librarycomponent.tool-block-ux`                           | `depends-on` | inbound   |
| inter-layer | `ux.librarycomponent.tooltip-ux`                              | `depends-on` | inbound   |
| inter-layer | `ux.librarycomponent.topbar-ux`                               | `depends-on` | inbound   |
| inter-layer | `ux.librarycomponent.topology-node-ux`                        | `depends-on` | inbound   |
| inter-layer | `ux.librarycomponent.trace-viewer-ux`                         | `depends-on` | inbound   |
| inter-layer | `ux.librarycomponent.tri-state-ux`                            | `depends-on` | inbound   |
| inter-layer | `ux.librarycomponent.version-pill-ux`                         | `depends-on` | inbound   |
| inter-layer | `ux.librarycomponent.version-timeline-ux`                     | `depends-on` | inbound   |
| inter-layer | `ux.librarycomponent.view-switcher-ux`                        | `depends-on` | inbound   |
| inter-layer | `ux.librarycomponent.workspace-switcher-dialog-ux`            | `depends-on` | inbound   |

### Automated Test Execution {#automated-test-execution}

**ID**: `technology.technologyfunction.automated-test-execution`

**Type**: `technologyfunction`

The capability of running heimdall's graph-visualization test suite — Playwright browser tests (tests/graph-\*.spec.ts) and Vitest unit tests (src/utils/\*.test.ts) — via 'npm test' / 'npm run test:unit'.

#### Relationships

| Type        | Related Element                                          | Predicate     | Direction |
| ----------- | -------------------------------------------------------- | ------------- | --------- |
| intra-layer | `technology.node.git-hub-actions-ubuntu-latest-runner`   | `assigned-to` | inbound   |
| intra-layer | `technology.artifact.ci-dev-server-script`               | `accesses`    | outbound  |
| intra-layer | `technology.artifact.galaxy-drag-benchmark-script`       | `accesses`    | outbound  |
| intra-layer | `technology.artifact.layered-graph-fixture-builder`      | `accesses`    | outbound  |
| intra-layer | `technology.artifact.performance-baseline`               | `accesses`    | outbound  |
| intra-layer | `technology.artifact.playwright-test-runner`             | `accesses`    | outbound  |
| intra-layer | `technology.artifact.router-benchmark-script`            | `accesses`    | outbound  |
| intra-layer | `technology.artifact.vitest`                             | `accesses`    | outbound  |
| intra-layer | `technology.technologyprocess.npm-test-npm-run-testunit` | `flows-to`    | outbound  |

### Library Bundling and Type Declaration Generation {#library-bundling-and-type-declaration-generation}

**ID**: `technology.technologyfunction.library-bundling-and-type-declaration-generation`

**Type**: `technologyfunction`

Vite library-mode build (rollup) with preserveModules: one ESM file per source module under dist/ (CJS dropped, #343), declarations for the public API from vite-plugin-dts, peer and runtime dependencies left external. CSS is split by the heimdall-css-sheets plugin (see Stylesheet Splitting and Ordering). Was: a single dist/index.js bundle.

#### Relationships

| Type        | Related Element                                          | Predicate     | Direction |
| ----------- | -------------------------------------------------------- | ------------- | --------- |
| intra-layer | `technology.node.git-hub-actions-ubuntu-latest-runner`   | `assigned-to` | inbound   |
| intra-layer | `technology.artifact.heimdall-ui-package`                | `accesses`    | outbound  |
| intra-layer | `technology.artifact.per-module-esm-build-output`        | `accesses`    | outbound  |
| intra-layer | `technology.artifact.tailwind-css`                       | `accesses`    | outbound  |
| intra-layer | `technology.artifact.type-declarations`                  | `accesses`    | outbound  |
| intra-layer | `technology.artifact.type-script-compiler-configuration` | `accesses`    | outbound  |
| intra-layer | `technology.artifact.vite`                               | `accesses`    | outbound  |
| intra-layer | `technology.technologyprocess.npm-run-build-vite-build`  | `flows-to`    | outbound  |

### npm OIDC Trusted Publishing {#npm-oidc-trusted-publishing}

**ID**: `technology.technologyfunction.npm-oidc-trusted-publishing`

**Type**: `technologyfunction`

The id-token: write permission plus npm publish --provenance: the GitHub Actions OIDC token is exchanged for a short-lived npm token keyed to this repository and workflow.

#### Relationships

| Type        | Related Element                                              | Predicate  | Direction |
| ----------- | ------------------------------------------------------------ | ---------- | --------- |
| inter-layer | `security.countermeasure.trusted-publishing-with-provenance` | `realizes` | outbound  |
| intra-layer | `technology.artifact.heimdall-ui-package`                    | `accesses` | outbound  |

### Published Package Verification {#published-package-verification}

**ID**: `technology.technologyfunction.published-package-verification`

**Type**: `technologyfunction`

npm run check:package (scripts/check-package-exports.mjs), run in CI and before publishing: every exports/main/types path is in the npm pack file list, the tarball holds only dist/ and agent-skills/, declarations import no unpublished source, dependencies stay external, and no JS module imports CSS.

#### Relationships

| Type        | Related Element                           | Predicate  | Direction |
| ----------- | ----------------------------------------- | ---------- | --------- |
| intra-layer | `technology.artifact.heimdall-ui-package` | `accesses` | outbound  |

### Stylesheet Load-Order Check {#stylesheet-load-order-check}

**ID**: `technology.technologyfunction.stylesheet-load-order-check`

**Type**: `technologyfunction`

npm run check:sheets (scripts/check-sheet-order.mjs): renders each dev-app test page with dist/style.css swapped in and checks that opt-in component sheets do not depend on load order. Run by hand; no workflow runs it.

#### Relationships

| Type        | Related Element                                 | Predicate  | Direction |
| ----------- | ----------------------------------------------- | ---------- | --------- |
| intra-layer | `technology.artifact.per-component-stylesheets` | `accesses` | outbound  |

### Stylesheet Splitting and Ordering {#stylesheet-splitting-and-ordering}

**ID**: `technology.technologyfunction.stylesheet-splitting-and-ordering`

**Type**: `technologyfunction`

The heimdall-css-sheets Vite plugin: reads where each module's CSS sat in ESM evaluation order, removes the empty-css placeholders, and writes style.css, css/base.css and one css/&lt;Name&gt;.css per component in that order, failing the build when a sheet is unreachable or out of order.

#### Relationships

| Type        | Related Element                                 | Predicate  | Direction |
| ----------- | ----------------------------------------------- | ---------- | --------- |
| intra-layer | `technology.artifact.base-stylesheet`           | `accesses` | outbound  |
| intra-layer | `technology.artifact.bundled-stylesheet`        | `accesses` | outbound  |
| intra-layer | `technology.artifact.per-component-stylesheets` | `accesses` | outbound  |

### CI Checks Workflow {#ci-checks-workflow}

**ID**: `technology.technologyprocess.ci-checks-workflow`

**Type**: `technologyprocess`

.github/workflows/ci.yml on PRs and pushes to main: tsc --noEmit, lint, Vitest, check:skills, build + check:package, then the Playwright suite sharded over 4 runners against -linux.png baselines.

#### Relationships

| Type        | Related Element                                          | Predicate  | Direction |
| ----------- | -------------------------------------------------------- | ---------- | --------- |
| intra-layer | `technology.artifact.eslint`                             | `accesses` | outbound  |
| intra-layer | `technology.artifact.tailwind-css`                       | `accesses` | outbound  |
| intra-layer | `technology.technologyprocess.npm-run-build-vite-build`  | `composes` | outbound  |
| intra-layer | `technology.technologyprocess.npm-test-npm-run-testunit` | `composes` | outbound  |

### Deploy Docs to GitHub Pages {#deploy-docs-to-github-pages}

**ID**: `technology.technologyprocess.deploy-docs-to-git-hub-pages`

**Type**: `technologyprocess`

.github/workflows/deploy-docs.yml on push to main: builds the library and the docs app and deploys docs/dist to GitHub Pages.

#### Relationships

| Type        | Related Element                          | Predicate  | Direction |
| ----------- | ---------------------------------------- | ---------- | --------- |
| intra-layer | `technology.artifact.docs-showcase-site` | `accesses` | outbound  |

### npm run build (vite build) {#npm-run-build-vite-build}

**ID**: `technology.technologyprocess.npm-run-build-vite-build`

**Type**: `technologyprocess`

The package.json 'build'/'prepare' script that invokes the Vite build — runs automatically on npm install via the prepare lifecycle hook, producing the dist/ artifact this package publishes.

#### Relationships

| Type        | Related Element                                                                  | Predicate  | Direction |
| ----------- | -------------------------------------------------------------------------------- | ---------- | --------- |
| intra-layer | `technology.technologyfunction.library-bundling-and-type-declaration-generation` | `flows-to` | inbound   |
| intra-layer | `technology.technologyprocess.ci-checks-workflow`                                | `composes` | inbound   |
| intra-layer | `technology.artifact.type-script-compiler-configuration`                         | `accesses` | outbound  |
| intra-layer | `technology.artifact.vite`                                                       | `accesses` | outbound  |
| intra-layer | `technology.technologyprocess.release-to-npm`                                    | `composes` | inbound   |

### npm test / npm run test:unit {#npm-test-npm-run-test-unit}

**ID**: `technology.technologyprocess.npm-test-npm-run-testunit`

**Type**: `technologyprocess`

The package.json scripts invoking Playwright ('test'/'test:ui') and Vitest ('test:unit') against the graph-visualization test suite.

#### Relationships

| Type        | Related Element                                                 | Predicate  | Direction |
| ----------- | --------------------------------------------------------------- | ---------- | --------- |
| intra-layer | `technology.technologyfunction.automated-test-execution`        | `flows-to` | inbound   |
| intra-layer | `technology.technologyprocess.ci-checks-workflow`               | `composes` | inbound   |
| intra-layer | `technology.technologyprocess.release-to-npm`                   | `composes` | inbound   |
| intra-layer | `technology.technologyprocess.update-visual-snapshots-workflow` | `composes` | inbound   |

### Release to npm {#release-to-npm}

**ID**: `technology.technologyprocess.release-to-npm`

**Type**: `technologyprocess`

.github/workflows/release.yml on a version tag: test job (skill coverage, package exports, Playwright) then publish to npm via Trusted Publisher.

#### Relationships

| Type        | Related Element                                          | Predicate  | Direction |
| ----------- | -------------------------------------------------------- | ---------- | --------- |
| intra-layer | `technology.artifact.heimdall-ui-package`                | `accesses` | outbound  |
| intra-layer | `technology.technologyprocess.npm-run-build-vite-build`  | `composes` | outbound  |
| intra-layer | `technology.technologyprocess.npm-test-npm-run-testunit` | `composes` | outbound  |

### Update Visual Snapshots Workflow {#update-visual-snapshots-workflow}

**ID**: `technology.technologyprocess.update-visual-snapshots-workflow`

**Type**: `technologyprocess`

.github/workflows/update-snapshots.yml (manual): regenerates -linux.png baselines on ubuntu-latest and uploads them as an artifact for review.

#### Relationships

| Type        | Related Element                                          | Predicate  | Direction |
| ----------- | -------------------------------------------------------- | ---------- | --------- |
| intra-layer | `technology.technologyprocess.npm-test-npm-run-testunit` | `composes` | outbound  |

### GitHub Pages {#github-pages}

**ID**: `technology.technologyservice.git-hub-pages`

**Type**: `technologyservice`

External static hosting serving the docs showcase site.

#### Attributes

| Name        | Value   |
| ----------- | ------- |
| serviceType | storage |

#### Relationships

| Type        | Related Element                                        | Predicate | Direction |
| ----------- | ------------------------------------------------------ | --------- | --------- |
| intra-layer | `technology.node.git-hub-actions-ubuntu-latest-runner` | `serves`  | outbound  |

### npm Registry {#npm-registry}

**ID**: `technology.technologyservice.npm-registry`

**Type**: `technologyservice`

External package registry the release publishes @tinkermonkey/heimdall-ui to and consumers install from.

#### Attributes

| Name        | Value   |
| ----------- | ------- |
| serviceType | storage |

#### Relationships

| Type        | Related Element                                        | Predicate | Direction |
| ----------- | ------------------------------------------------------ | --------- | --------- |
| intra-layer | `technology.node.git-hub-actions-ubuntu-latest-runner` | `serves`  | outbound  |

---

Generated: 2026-11-24T15:33:35.364Z | Model Version: 0.1.0
