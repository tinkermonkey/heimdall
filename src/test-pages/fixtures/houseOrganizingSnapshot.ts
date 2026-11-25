/**
 * A snapshot (2026-11-25) of how seven of Austin's tooling projects are organized in House,
 * shaped after the House ontology (Context Studio's House taxonomy, cached in the house repo as
 * ontology/house.bundle.json): projects, milestones, gates, workstreams and interfaces, with the
 * depends_on, leads_to, opens, delivers, provides and uses edges between them. Sub-projects are
 * rolled up into their top-level project (kept as `subProject`). Definitions, readings and links
 * are left out. Only edges between kept nodes are kept; a wait on a task is kept by name.
 * Fixture for the branch-map concept page (?example=branch-map-concepts).
 */
import type { HouseOrganizingSnapshot } from './houseOrganizingTypes'

export const houseOrganizingSnapshot: HouseOrganizingSnapshot = {
  "snapshot": "2026-11-25",
  "projects": [
    {
      "id": "context_studio",
      "name": "Context Studio"
    },
    {
      "id": "dr_viewer",
      "name": "DR Viewer"
    },
    {
      "id": "documentation_robotics",
      "name": "Documentation Robotics"
    },
    {
      "id": "heimdall",
      "name": "Heimdall"
    },
    {
      "id": "reference_api_buddy",
      "name": "Reference API Buddy"
    },
    {
      "id": "house_mcp",
      "name": "House MCP"
    },
    {
      "id": "claude_plugins",
      "name": "Claude Plugins"
    }
  ],
  "milestones": [
    {
      "ref": "2:01a21246-58e4-72e8-b610-0872b96b9d4b",
      "name": "Plugged into Claude Code",
      "project": "context_studio",
      "status": "reached",
      "subProject": "Ontology Workbench",
      "aliases": [
        "Phase A",
        "Plug in",
        "Workbench A"
      ],
      "criteria": [
        4,
        4
      ],
      "dependsOn": [],
      "reachedOn": "2026-11-25"
    },
    {
      "ref": "2:01a21246-5b3e-730f-979b-cd0c0211bd3d",
      "name": "Proposals and shipping",
      "project": "context_studio",
      "status": "reached",
      "subProject": "Ontology Workbench",
      "aliases": [
        "Phase B",
        "Propose and ship",
        "Workbench B"
      ],
      "criteria": [
        5,
        5
      ],
      "dependsOn": [
        "2:01a21246-58e4-72e8-b610-0872b96b9d4b"
      ],
      "reachedOn": "2026-11-25"
    },
    {
      "ref": "2:01a21246-5db3-700d-b2df-bdd5fbf70856",
      "name": "Decision model groundwork",
      "project": "context_studio",
      "status": "reached",
      "subProject": "Ontology Workbench",
      "aliases": [
        "C1",
        "Clean up and decide",
        "Workbench C1"
      ],
      "criteria": [
        4,
        4
      ],
      "dependsOn": [
        "2:01a21246-b2a2-72fb-866f-da2155ab94a4"
      ],
      "reachedOn": "2026-11-25"
    },
    {
      "ref": "2:01a21246-603b-775b-ad5e-2048c3005eeb",
      "name": "Refinement pipelines",
      "project": "context_studio",
      "status": "reached",
      "subProject": "Ontology Workbench",
      "aliases": [
        "C2",
        "C2 · Refine",
        "Phase C"
      ],
      "criteria": [
        3,
        3
      ],
      "dependsOn": [
        "2:01a21246-5db3-700d-b2df-bdd5fbf70856"
      ],
      "reachedOn": "2026-11-25"
    },
    {
      "ref": "2:01a21246-61da-777c-8fee-cf51e5d1837e",
      "name": "Client round trip",
      "project": "context_studio",
      "status": "reached",
      "subProject": "Ontology Workbench",
      "aliases": [
        "C3",
        "C3 · Client round trip",
        "Workbench C3"
      ],
      "criteria": [
        5,
        5
      ],
      "dependsOn": [
        "2:01a21246-b4b5-70e8-a4cd-d147847ab8b7"
      ],
      "reachedOn": "2026-11-25"
    },
    {
      "ref": "2:01a21246-afdd-76bc-8122-b4889091f3eb",
      "name": "Extraction on real sources",
      "project": "context_studio",
      "status": "active",
      "subProject": "Ontology Workbench",
      "aliases": [
        "Phase D",
        "Phase D · Extract",
        "Workbench D"
      ],
      "criteria": [
        3,
        4
      ],
      "dependsOn": [
        "2:01a21246-61da-777c-8fee-cf51e5d1837e"
      ]
    },
    {
      "ref": "2:01a21247-1244-7406-a57e-0df8bb9d8694",
      "name": "Extraction review UX",
      "project": "context_studio",
      "status": "reached",
      "aliases": [
        "GH milestone 1",
        "extraction review milestone"
      ],
      "criteria": [
        2,
        2
      ],
      "dependsOn": [],
      "reachedOn": "2026-11-25"
    },
    {
      "ref": "2:01a21247-141c-73ab-9756-548ab1d4b964",
      "name": "DR proof of concept",
      "project": "context_studio",
      "status": "reached",
      "aliases": [
        "DR POC",
        "GH milestone 2"
      ],
      "criteria": [
        4,
        4
      ],
      "dependsOn": [],
      "reachedOn": "2026-11-25"
    },
    {
      "ref": "2:01a21247-1667-7598-8ac5-1b9e4a9038f4",
      "name": "Polish and seat time",
      "project": "context_studio",
      "status": "reached",
      "aliases": [
        "GH milestone 3",
        "Polish & Seat Time",
        "seat time"
      ],
      "criteria": [
        3,
        3
      ],
      "dependsOn": [],
      "reachedOn": "2026-11-25"
    },
    {
      "ref": "2:01a21247-1833-74f1-ae04-ad291b25c563",
      "name": "Navigation and entity pages",
      "project": "context_studio",
      "status": "reached",
      "aliases": [
        "1 · Navigation & Entity Pages",
        "Stream 1",
        "work stream 1"
      ],
      "criteria": [
        3,
        3
      ],
      "dependsOn": [],
      "reachedOn": "2026-11-25"
    },
    {
      "ref": "2:01a21247-19e9-71e0-8696-5fde72a484e4",
      "name": "Chat with schema and data",
      "project": "context_studio",
      "status": "reached",
      "aliases": [
        "2 · Chat with Schema & Data",
        "Stream 2",
        "work stream 2"
      ],
      "criteria": [
        2,
        2
      ],
      "dependsOn": [],
      "reachedOn": "2026-11-25"
    },
    {
      "ref": "2:01a21247-1bba-7397-85a0-ce30cda9c993",
      "name": "Extraction review and tuning",
      "project": "context_studio",
      "status": "reached",
      "aliases": [
        "3 · Extraction Review & Tuning",
        "Stream 3",
        "work stream 3"
      ],
      "criteria": [
        3,
        3
      ],
      "dependsOn": [],
      "reachedOn": "2026-11-25"
    },
    {
      "ref": "2:01a21247-7bde-759e-aa9e-81a06f24c599",
      "name": "Design system and visualization",
      "project": "context_studio",
      "status": "set_aside",
      "aliases": [
        "4 · Design System & Visualization",
        "Stream 4",
        "work stream 4"
      ],
      "criteria": [
        0,
        5
      ],
      "dependsOn": []
    },
    {
      "ref": "2:01a21247-7e15-724a-ad8a-50473ebcf1c6",
      "name": "Review workflow",
      "project": "context_studio",
      "status": "active",
      "aliases": [
        "GH milestone 14",
        "review workflow milestone"
      ],
      "criteria": [
        4,
        5
      ],
      "dependsOn": []
    },
    {
      "ref": "2:01a21247-7fcd-7797-8cc6-c1eeb0b18845",
      "name": "Proposal API for clients",
      "project": "context_studio",
      "status": "reached",
      "aliases": [
        "round 2026-11-20 proposal API"
      ],
      "criteria": [
        4,
        4
      ],
      "dependsOn": [],
      "reachedOn": "2026-11-25"
    },
    {
      "ref": "2:01a21247-824c-7429-95d7-6f3fd31bcef6",
      "name": "Security gaps closed",
      "project": "context_studio",
      "status": "reached",
      "criteria": [
        2,
        2
      ],
      "dependsOn": [],
      "reachedOn": "2026-11-25"
    },
    {
      "ref": "2:01a21247-8445-720e-9271-9dbf775ac28f",
      "name": "Honest CI gates",
      "project": "context_studio",
      "status": "reached",
      "criteria": [
        3,
        3
      ],
      "dependsOn": [],
      "reachedOn": "2026-11-25"
    },
    {
      "ref": "2:01a21247-85ce-7749-96af-b74e78ac2bb1",
      "name": "Reference proxy on reference-api-buddy",
      "project": "context_studio",
      "status": "reached",
      "aliases": [
        "reference proxy"
      ],
      "criteria": [
        3,
        3
      ],
      "dependsOn": [],
      "reachedOn": "2026-11-25"
    },
    {
      "ref": "2:01a21247-f6ca-773c-aeed-61f897eaf376",
      "name": "Desktop app for macOS",
      "project": "context_studio",
      "status": "active",
      "aliases": [
        "Desktop packaging",
        "Desktop packaging (Tauri)",
        "GH milestone 15"
      ],
      "criteria": [
        0,
        6
      ],
      "dependsOn": []
    },
    {
      "ref": "2:01a21247-fbd5-743c-9b4f-62d0c59724a3",
      "name": "Clean developer tooling",
      "project": "context_studio",
      "status": "proposed",
      "aliases": [
        "Tooling follow-ups",
        "next round item 4"
      ],
      "criteria": [
        0,
        7
      ],
      "dependsOn": []
    },
    {
      "ref": "2:01a21247-fdc6-77c3-bf2f-d470c4368d66",
      "name": "Real-document review fixes",
      "project": "context_studio",
      "status": "proposed",
      "aliases": [
        "Gate D follow-ups",
        "next round item 5"
      ],
      "criteria": [
        0,
        4
      ],
      "dependsOn": []
    },
    {
      "ref": "2:01a21248-00d0-7188-92d6-195b02e30d9d",
      "name": "DR catalog gaps proposed",
      "project": "context_studio",
      "status": "proposed",
      "aliases": [
        "DR spec catalog gaps",
        "next round item 6"
      ],
      "criteria": [
        0,
        5
      ],
      "dependsOn": []
    },
    {
      "ref": "2:01a21248-5df2-7761-86dc-20bd6dffb8a0",
      "name": "Extraction benchmark",
      "project": "context_studio",
      "status": "reached",
      "subProject": "Extraction Pipelines",
      "aliases": [
        "benchmark"
      ],
      "criteria": [
        3,
        3
      ],
      "dependsOn": [],
      "reachedOn": "2026-11-25"
    },
    {
      "ref": "2:01a21248-6320-77f8-a836-77dd0e1b7c49",
      "name": "Human-checked benchmark gold",
      "project": "context_studio",
      "status": "active",
      "subProject": "Extraction Pipelines",
      "aliases": [
        "human-check the gold",
        "next step 1"
      ],
      "criteria": [
        1,
        5
      ],
      "dependsOn": [
        "2:01a21248-5f8b-775f-8e31-748ca74f2b55"
      ]
    },
    {
      "ref": "2:01a2126a-5f43-70d6-8172-ec6c368437e5",
      "name": "Heimdall-native viewer",
      "project": "dr_viewer",
      "status": "reached",
      "aliases": [
        "UX rebuild",
        "ux-rebuild-heimdall",
        "v0.6.0"
      ],
      "criteria": [
        3,
        3
      ],
      "dependsOn": [],
      "reachedOn": "2026-11-25"
    },
    {
      "ref": "2:01a2126a-6150-731a-9d4c-3a2cd2e1f602",
      "name": "Changeset impact before Apply",
      "project": "dr_viewer",
      "status": "reached",
      "aliases": [
        "Impact tab",
        "heimdall 0.10/0.11",
        "v0.10.0"
      ],
      "criteria": [
        2,
        2
      ],
      "dependsOn": [],
      "reachedOn": "2026-11-25"
    },
    {
      "ref": "2:01a2126a-630d-711b-9cd1-680ff9968cf2",
      "name": "Change-by-change changeset review",
      "project": "dr_viewer",
      "status": "reached",
      "aliases": [
        "changeset review redesign",
        "v0.11.0"
      ],
      "criteria": [
        3,
        3
      ],
      "dependsOn": [],
      "reachedOn": "2026-11-25"
    },
    {
      "ref": "2:01a2126a-64bf-7620-88d8-392c4ef82f46",
      "name": "Changesets by purpose and drift",
      "project": "dr_viewer",
      "status": "reached",
      "aliases": [
        "v0.12.0"
      ],
      "criteria": [
        3,
        3
      ],
      "dependsOn": [],
      "reachedOn": "2026-11-25"
    },
    {
      "ref": "2:01a2126a-6684-77f8-98a2-2df2b3d0a5ed",
      "name": "Finding your way in a large model",
      "project": "dr_viewer",
      "status": "reached",
      "aliases": [
        "release 0.13.0 plan",
        "v0.13.0"
      ],
      "criteria": [
        5,
        5
      ],
      "dependsOn": [],
      "reachedOn": "2026-11-25"
    },
    {
      "ref": "2:01a2126a-6845-7213-acc9-00eba43198a6",
      "name": "C4 architecture diagrams",
      "project": "dr_viewer",
      "status": "reached",
      "aliases": [
        "Architecture view",
        "C4 slices 1-4",
        "v0.14.0"
      ],
      "criteria": [
        4,
        4
      ],
      "dependsOn": [],
      "reachedOn": "2026-11-25"
    },
    {
      "ref": "2:01a2126a-69de-7037-bc58-04ae953b089c",
      "name": "One viewer for every checkout",
      "project": "dr_viewer",
      "status": "reached",
      "aliases": [
        "dr serve",
        "scoped routes",
        "v0.16.0"
      ],
      "criteria": [
        3,
        3
      ],
      "dependsOn": [],
      "reachedOn": "2026-11-25"
    },
    {
      "ref": "2:01a2126a-6c18-7497-b98a-b476e2147d3a",
      "name": "Graph history and commit progress",
      "project": "dr_viewer",
      "status": "reached",
      "aliases": [
        "next release issues",
        "v0.17.0"
      ],
      "criteria": [
        5,
        5
      ],
      "dependsOn": [],
      "reachedOn": "2026-11-25"
    },
    {
      "ref": "2:01a2126b-8943-71c6-abe7-420aa905782c",
      "name": "Viewer 0.17.0 shipped in the dr CLI",
      "project": "dr_viewer",
      "status": "reached",
      "aliases": [
        "CLI 0.8.0",
        "CLI pin bump"
      ],
      "criteria": [
        2,
        2
      ],
      "dependsOn": [],
      "reachedOn": "2026-11-25"
    },
    {
      "ref": "2:01a2126b-8b4d-73e8-8a3f-754954664fac",
      "name": "Model in step with the code",
      "project": "dr_viewer",
      "status": "reached",
      "aliases": [
        "as-built reconcile",
        "model drift"
      ],
      "criteria": [
        4,
        4
      ],
      "dependsOn": [],
      "reachedOn": "2026-11-25"
    },
    {
      "ref": "2:01a2126b-8dbd-7216-8467-b73e7fcb191a",
      "name": "E2E running in CI",
      "project": "dr_viewer",
      "status": "active",
      "aliases": [
        "E2E skipped in CI"
      ],
      "criteria": [
        2,
        3
      ],
      "dependsOn": []
    },
    {
      "ref": "2:01a2126b-9188-7166-993a-57a161430ba2",
      "name": "C4 rules read from the DR spec",
      "project": "dr_viewer",
      "status": "proposed",
      "aliases": [
        "#1401",
        "spec mappings 4"
      ],
      "criteria": [
        0,
        3
      ],
      "dependsOn": [
        "2:01a2126b-8f64-7118-bd9a-b2ab16732148"
      ]
    },
    {
      "ref": "2:01a2126b-9310-758e-9293-cacb71c2f8f0",
      "name": "Deployment and Dynamic diagrams",
      "project": "dr_viewer",
      "status": "proposed",
      "aliases": [
        "C4 slice 5",
        "later C4 slices"
      ],
      "criteria": [
        0,
        3
      ],
      "dependsOn": []
    },
    {
      "ref": "2:01a2126b-9524-77ce-92fc-ca068e33a814",
      "name": "C4 layout native in Heimdall",
      "project": "dr_viewer",
      "status": "proposed",
      "aliases": [
        "ELK stand-in",
        "Heimdall hand-off"
      ],
      "criteria": [
        0,
        3
      ],
      "dependsOn": [
        "2:01a21308-3bf9-7497-8690-cb87005254dd"
      ]
    },
    {
      "ref": "2:01a2126b-96e7-702b-a931-bb13438ab2a0",
      "name": "Drift shown in full",
      "project": "dr_viewer",
      "status": "proposed",
      "criteria": [
        0,
        3
      ],
      "dependsOn": []
    },
    {
      "ref": "2:01a2126b-98de-74d2-8790-e687d520a2e0",
      "name": "Agent links to any view",
      "project": "dr_viewer",
      "status": "proposed",
      "aliases": [
        "#1430",
        "viewer links for everything"
      ],
      "criteria": [
        0,
        3
      ],
      "dependsOn": []
    },
    {
      "ref": "2:01a2126b-9a77-71cf-adc0-57c9fd2597b7",
      "name": "Architecture coverage view",
      "project": "dr_viewer",
      "status": "proposed",
      "aliases": [
        "Coverage",
        "coverage matrix",
        "design #1"
      ],
      "criteria": [
        0,
        3
      ],
      "dependsOn": []
    },
    {
      "ref": "2:01a2126b-9c49-7336-b7e1-462869cad972",
      "name": "Traceability lanes",
      "project": "dr_viewer",
      "status": "proposed",
      "aliases": [
        "Open trace in Lanes",
        "design #2"
      ],
      "criteria": [
        0,
        2
      ],
      "dependsOn": []
    },
    {
      "ref": "2:01a2126b-8f64-7118-bd9a-b2ab16732148",
      "name": "C4 mapping in the DR spec",
      "project": "documentation_robotics",
      "status": "proposed",
      "aliases": [
        "#1397",
        "CLI 0.12.0",
        "GH milestone 6"
      ],
      "criteria": [
        0,
        4
      ],
      "dependsOn": [
        "2:01a21270-ce64-720a-b0bf-4213a1e127c1"
      ]
    },
    {
      "ref": "2:01a21270-585d-76e2-9ea2-dfc7eff098e2",
      "name": "Change modeling tools",
      "project": "documentation_robotics",
      "status": "reached",
      "aliases": [
        "VISION items 1-6",
        "change modeling first slice"
      ],
      "criteria": [
        5,
        5
      ],
      "dependsOn": [],
      "reachedOn": "2026-11-25"
    },
    {
      "ref": "2:01a21270-5b95-750e-895b-07baaf08b01a",
      "name": "MCP gateway tools",
      "project": "documentation_robotics",
      "status": "reached",
      "aliases": [
        "CLI 0.4.0",
        "gateway build-out"
      ],
      "criteria": [
        3,
        3
      ],
      "dependsOn": [],
      "reachedOn": "2026-11-25"
    },
    {
      "ref": "2:01a21270-5e15-76b9-a079-2d06d19107ba",
      "name": "Dogfood friction fixed",
      "project": "documentation_robotics",
      "status": "reached",
      "aliases": [
        "CLI 0.7.0",
        "GH milestone 1"
      ],
      "criteria": [
        2,
        2
      ],
      "dependsOn": [],
      "reachedOn": "2026-11-25"
    },
    {
      "ref": "2:01a21270-6002-7154-b0bc-ea39855a5d44",
      "name": "One DR process per user",
      "project": "documentation_robotics",
      "status": "reached",
      "aliases": [
        "CLI 0.8.0",
        "GH milestone 2",
        "spec 0.15.0"
      ],
      "criteria": [
        3,
        3
      ],
      "dependsOn": [],
      "reachedOn": "2026-11-25"
    },
    {
      "ref": "2:01a21270-620f-7622-8f2d-d1f99eb08135",
      "name": "Change modeling in real use",
      "project": "documentation_robotics",
      "status": "active",
      "aliases": [
        "VISION MVP",
        "VISION item 7",
        "use it"
      ],
      "criteria": [
        0,
        4
      ],
      "dependsOn": [
        "2:01a21242-2d1a-71d6-9671-d1ca37667fe0"
      ]
    },
    {
      "ref": "2:01a21270-ca64-7760-b50b-ba12c6e315f2",
      "name": "Tool ergonomics",
      "project": "documentation_robotics",
      "status": "active",
      "aliases": [
        "CLI 0.9.0",
        "GH milestone 3"
      ],
      "criteria": [
        0,
        6
      ],
      "dependsOn": []
    },
    {
      "ref": "2:01a21270-cc61-713b-8f11-c7165b9d4c10",
      "name": "A verify step you can trust",
      "project": "documentation_robotics",
      "status": "active",
      "aliases": [
        "CLI 0.10.0",
        "GH milestone 4",
        "verify you can trust"
      ],
      "criteria": [
        0,
        6
      ],
      "dependsOn": [
        "2:01a21270-ca64-7760-b50b-ba12c6e315f2"
      ]
    },
    {
      "ref": "2:01a21270-ce64-720a-b0bf-4213a1e127c1",
      "name": "Spec gaps and model grain",
      "project": "documentation_robotics",
      "status": "active",
      "aliases": [
        "CLI 0.11.0",
        "GH milestone 5"
      ],
      "criteria": [
        0,
        5
      ],
      "dependsOn": [
        "2:01a21270-cc61-713b-8f11-c7165b9d4c10"
      ]
    },
    {
      "ref": "2:01a21270-d214-7110-b580-276610f74090",
      "name": "C4 through spec mappings",
      "project": "documentation_robotics",
      "status": "dropped",
      "criteria": [
        0,
        6
      ],
      "dependsOn": []
    },
    {
      "ref": "2:01a21272-7bc8-76d8-91e1-72dfe690b0a5",
      "name": "Extraction eval harness",
      "project": "documentation_robotics",
      "status": "reached",
      "subProject": "DR Extraction Cascade",
      "aliases": [
        "Phase 0",
        "classify-eval"
      ],
      "criteria": [
        2,
        2
      ],
      "dependsOn": [],
      "reachedOn": "2026-11-25"
    },
    {
      "ref": "2:01a21272-7e59-77a8-99ef-f021154697f5",
      "name": "Spec enrichment",
      "project": "documentation_robotics",
      "status": "active",
      "subProject": "DR Extraction Cascade",
      "aliases": [
        "Phase 1",
        "Track A",
        "spec-enrich"
      ],
      "criteria": [
        2,
        3
      ],
      "dependsOn": []
    },
    {
      "ref": "2:01a21272-80ff-7455-8bf1-cd5da8365cee",
      "name": "Cascade wired into extraction",
      "project": "documentation_robotics",
      "status": "active",
      "subProject": "DR Extraction Cascade",
      "aliases": [
        "B1-B7",
        "Phase 2",
        "cascade wiring"
      ],
      "criteria": [
        5,
        9
      ],
      "dependsOn": []
    },
    {
      "ref": "2:01a21272-82b0-7295-add5-947c8d636445",
      "name": "Clef fine-tuned on approved changesets",
      "project": "documentation_robotics",
      "status": "proposed",
      "subProject": "DR Extraction Cascade",
      "aliases": [
        "Phase 3",
        "fine-tuning"
      ],
      "criteria": [
        0,
        2
      ],
      "dependsOn": []
    },
    {
      "ref": "2:01a21273-0918-7027-8c47-583a35147d55",
      "name": "Review question bank 0.1",
      "project": "documentation_robotics",
      "status": "reached",
      "subProject": "DR Self-Assessment",
      "aliases": [
        "bank 0.1",
        "order 1",
        "track B"
      ],
      "criteria": [
        1,
        1
      ],
      "dependsOn": [],
      "reachedOn": "2026-11-25"
    },
    {
      "ref": "2:01a21273-0b11-73d4-9107-545deb30aa3c",
      "name": "Heimdall assessment pilot",
      "project": "documentation_robotics",
      "status": "reached",
      "subProject": "DR Self-Assessment",
      "aliases": [
        "heimdall pilot",
        "order 2"
      ],
      "criteria": [
        3,
        3
      ],
      "dependsOn": [],
      "reachedOn": "2026-11-25"
    },
    {
      "ref": "2:01a21273-0d10-74eb-a1d7-97a35787766c",
      "name": "Fleet models hardened",
      "project": "documentation_robotics",
      "status": "active",
      "subProject": "DR Self-Assessment",
      "aliases": [
        "fleet",
        "order 4",
        "track C"
      ],
      "criteria": [
        1,
        4
      ],
      "dependsOn": []
    },
    {
      "ref": "2:01a21273-0f78-744f-bc4a-d7df44e9c360",
      "name": "Models built from scratch",
      "project": "documentation_robotics",
      "status": "proposed",
      "subProject": "DR Self-Assessment",
      "aliases": [
        "order 8",
        "track D"
      ],
      "criteria": [
        0,
        2
      ],
      "dependsOn": [
        "2:01a21273-0d10-74eb-a1d7-97a35787766c",
        "2:01a21272-80ff-7455-8bf1-cd5da8365cee"
      ],
      "waitsOnTasks": [
        "Cluster test cases after extraction (#1312)",
        "Build a headless step A runner"
      ]
    },
    {
      "ref": "2:01a21273-112d-7780-8cfb-52041f1d7881",
      "name": "Assessment in the product",
      "project": "documentation_robotics",
      "status": "proposed",
      "subProject": "DR Self-Assessment",
      "aliases": [
        "order 9",
        "product integration"
      ],
      "criteria": [
        0,
        4
      ],
      "dependsOn": []
    },
    {
      "ref": "2:01a21304-7c74-7340-839b-b87f73b6e2e7",
      "name": "Layered graph family",
      "project": "heimdall",
      "status": "reached",
      "aliases": [
        "layered family",
        "layered graph components",
        "layered graph steps 1-6"
      ],
      "criteria": [
        7,
        7
      ],
      "dependsOn": [],
      "reachedOn": "2026-11-25"
    },
    {
      "ref": "2:01a21304-7f81-77cf-9c88-5f74643a8544",
      "name": "Orthogonal router at scale",
      "project": "heimdall",
      "status": "reached",
      "aliases": [
        "orthogonal channel router",
        "router-scale run"
      ],
      "criteria": [
        3,
        3
      ],
      "dependsOn": [],
      "reachedOn": "2026-11-25"
    },
    {
      "ref": "2:01a21304-821e-713e-8258-e199196d7274",
      "name": "Design work order applied",
      "project": "heimdall",
      "status": "reached",
      "aliases": [
        "work order",
        "work-order-repo"
      ],
      "criteria": [
        3,
        3
      ],
      "dependsOn": [],
      "reachedOn": "2026-11-25"
    },
    {
      "ref": "2:01a21304-8568-7764-8fd8-9e59109b856b",
      "name": "DR model gaps closed",
      "project": "heimdall",
      "status": "active",
      "aliases": [
        "gap treatment",
        "lost gaps treatment"
      ],
      "criteria": [
        1,
        5
      ],
      "dependsOn": []
    },
    {
      "ref": "2:01a21304-88f3-73ba-8f3d-73ea457bbd31",
      "name": "Orthogonal passes Stage 1",
      "project": "heimdall",
      "status": "active",
      "aliases": [
        "orthogonal placement",
        "placement run"
      ],
      "criteria": [
        0,
        4
      ],
      "dependsOn": []
    },
    {
      "ref": "2:01a21304-8bce-722f-9a27-f8ca45d66ef0",
      "name": "Organic without stranded outliers",
      "project": "heimdall",
      "status": "active",
      "aliases": [
        "organic outlier"
      ],
      "criteria": [
        0,
        3
      ],
      "dependsOn": []
    },
    {
      "ref": "2:01a21304-8f30-7312-bd21-697fdcb9acb7",
      "name": "Orthogonal grid and bus trunks",
      "project": "heimdall",
      "status": "active",
      "aliases": [
        "bus groups",
        "per-row pitch"
      ],
      "criteria": [
        0,
        4
      ],
      "dependsOn": []
    },
    {
      "ref": "2:01a21304-926a-74e2-a1cb-99a31a0b30fa",
      "name": "Multi-select in the layered views",
      "project": "heimdall",
      "status": "proposed",
      "criteria": [
        0,
        3
      ],
      "dependsOn": []
    },
    {
      "ref": "2:01a21304-94d5-772a-b2db-cd08bdc59c18",
      "name": "Organic replaces force layouts",
      "project": "heimdall",
      "status": "proposed",
      "criteria": [
        0,
        3
      ],
      "dependsOn": []
    },
    {
      "ref": "2:01a21304-9886-77ba-af43-177afc42d8bb",
      "name": "ux-navigation on orthogonal",
      "project": "heimdall",
      "status": "proposed",
      "criteria": [
        0,
        3
      ],
      "dependsOn": []
    },
    {
      "ref": "2:01a21304-9c17-70bb-a5d8-1f5e2caf5155",
      "name": "Layout scene model and SVG exporter",
      "project": "heimdall",
      "status": "proposed",
      "criteria": [
        0,
        4
      ],
      "dependsOn": []
    },
    {
      "ref": "2:01a21304-9f3a-75a1-b352-b82428b024bd",
      "name": "Hierarchical layout",
      "project": "heimdall",
      "status": "proposed",
      "aliases": [
        "Phase 2",
        "Sugiyama",
        "layout engine phase 2"
      ],
      "criteria": [
        0,
        3
      ],
      "dependsOn": []
    },
    {
      "ref": "2:01a21304-a22f-7020-8e89-94ad0b20264b",
      "name": "Loop build packages 1-6",
      "project": "heimdall",
      "status": "reached",
      "subProject": "Heimdall Layout Loop",
      "aliases": [
        "Packages 1-6",
        "loop build plan",
        "package 6"
      ],
      "criteria": [
        6,
        6
      ],
      "dependsOn": [],
      "reachedOn": "2026-11-25"
    },
    {
      "ref": "2:01a21304-a422-732a-8d3c-51e99333a9d0",
      "name": "Loop runs as a release check",
      "project": "heimdall",
      "status": "active",
      "subProject": "Heimdall Layout Loop",
      "aliases": [
        "Path step 3",
        "Path step 4",
        "loop as a check"
      ],
      "criteria": [
        0,
        4
      ],
      "dependsOn": []
    },
    {
      "ref": "2:01a21304-a67d-70af-9e77-24e80fb4e5d2",
      "name": "Scale check for the layered views",
      "project": "heimdall",
      "status": "proposed",
      "subProject": "Heimdall Layout Loop",
      "aliases": [
        "Path step 6"
      ],
      "criteria": [
        0,
        2
      ],
      "dependsOn": []
    },
    {
      "ref": "2:01a21304-a941-70bc-b4fa-808b1946355e",
      "name": "Framework and Tuning tiers proven",
      "project": "heimdall",
      "status": "proposed",
      "subProject": "Heimdall Layout Loop",
      "aliases": [
        "Package 7"
      ],
      "criteria": [
        0,
        3
      ],
      "dependsOn": []
    },
    {
      "ref": "2:01a21308-3bf9-7497-8690-cb87005254dd",
      "name": "Nested layout and C4 card",
      "project": "heimdall",
      "status": "proposed",
      "aliases": [
        "C4 layout in Heimdall",
        "nested C4 layout"
      ],
      "criteria": [
        0,
        6
      ],
      "dependsOn": []
    },
    {
      "ref": "2:01a21309-55ba-7268-b138-92a74d8116fa",
      "name": "Proof-of-concept proxy",
      "project": "reference_api_buddy",
      "status": "reached",
      "aliases": [
        "0.1.0",
        "01_poc",
        "POC plan"
      ],
      "criteria": [
        4,
        4
      ],
      "dependsOn": [],
      "reachedOn": "2026-11-25"
    },
    {
      "ref": "2:01a21309-d05f-714c-b0e4-759deec66850",
      "name": "Per-domain cache TTL",
      "project": "reference_api_buddy",
      "status": "reached",
      "aliases": [
        "0.2.0",
        "02_ttl_config",
        "TTL Phase 1"
      ],
      "criteria": [
        4,
        4
      ],
      "dependsOn": [],
      "reachedOn": "2026-11-25"
    },
    {
      "ref": "2:01a21309-d21b-72c2-875f-a027f27d978b",
      "name": "Programmatic monitoring interface",
      "project": "reference_api_buddy",
      "status": "reached",
      "aliases": [
        "0.3.0",
        "03_monitoring",
        "monitoring interface"
      ],
      "criteria": [
        2,
        2
      ],
      "dependsOn": [],
      "reachedOn": "2026-11-25"
    },
    {
      "ref": "2:01a21309-d443-715b-8a4e-fdf6e06ca4b3",
      "name": "Admin debug endpoints",
      "project": "reference_api_buddy",
      "status": "reached",
      "aliases": [
        "0.4.2",
        "04_config_debug",
        "Config debug Phase 1"
      ],
      "criteria": [
        4,
        4
      ],
      "dependsOn": [],
      "reachedOn": "2026-11-25"
    },
    {
      "ref": "2:01a21309-d6f7-7756-b651-ed2478604b65",
      "name": "Published on PyPI",
      "project": "reference_api_buddy",
      "status": "reached",
      "aliases": [
        "PyPI Phase 1",
        "PyPI Phase 2",
        "PyPI Phase 3"
      ],
      "criteria": [
        3,
        3
      ],
      "dependsOn": [],
      "reachedOn": "2026-11-25"
    },
    {
      "ref": "2:01a21309-d8dc-71fe-b392-a36f921c4016",
      "name": "Rate limits and request coalescing",
      "project": "reference_api_buddy",
      "status": "reached",
      "aliases": [
        "0.5.0",
        "fine-grained rate limiting",
        "request deduplication"
      ],
      "criteria": [
        3,
        3
      ],
      "dependsOn": [],
      "reachedOn": "2026-11-25"
    },
    {
      "ref": "2:01a21309-dad7-77ce-a26d-ab1958b8f5f5",
      "name": "Errors not cached, in-flight requests released",
      "project": "reference_api_buddy",
      "status": "reached",
      "aliases": [
        "0.5.1"
      ],
      "criteria": [
        4,
        4
      ],
      "dependsOn": [],
      "reachedOn": "2026-11-25"
    },
    {
      "ref": "2:01a21309-ddc3-7408-b468-dc52fbf420e7",
      "name": "Standard library only, Python 3.10+",
      "project": "reference_api_buddy",
      "status": "reached",
      "aliases": [
        "0.5.2"
      ],
      "criteria": [
        4,
        4
      ],
      "dependsOn": [],
      "reachedOn": "2026-11-25"
    },
    {
      "ref": "2:01a21309-dfa4-77b2-acd3-ce2d9867e62c",
      "name": "DR model of the codebase",
      "project": "reference_api_buddy",
      "status": "reached",
      "aliases": [
        "DR bootstrap",
        "DR model"
      ],
      "criteria": [
        3,
        3
      ],
      "dependsOn": [],
      "reachedOn": "2026-11-25"
    },
    {
      "ref": "2:01a2130a-635d-71ad-bd81-19274efd5e9e",
      "name": "Secure-key fixes released",
      "project": "reference_api_buddy",
      "status": "active",
      "aliases": [
        "0.5.3",
        "release 0.5.3"
      ],
      "criteria": [
        1,
        3
      ],
      "dependsOn": []
    },
    {
      "ref": "2:01a2130a-65e2-76e0-953f-6d94a4ae207b",
      "name": "Test coverage at 95%",
      "project": "reference_api_buddy",
      "status": "proposed",
      "aliases": [
        "Coverage Phase 1",
        "Coverage Phase 2",
        "Coverage Phase 3"
      ],
      "criteria": [
        0,
        4
      ],
      "dependsOn": []
    },
    {
      "ref": "2:01a2130a-67e2-770e-b8f9-4872eaaf7dca",
      "name": "Monitoring extensions",
      "project": "reference_api_buddy",
      "status": "proposed",
      "aliases": [
        "monitoring future extensions"
      ],
      "criteria": [
        0,
        3
      ],
      "dependsOn": []
    },
    {
      "ref": "2:01a2130a-69eb-724d-81ac-9f00ba623205",
      "name": "Extended performance tests",
      "project": "reference_api_buddy",
      "status": "proposed",
      "aliases": [
        "performance test enhancements"
      ],
      "criteria": [
        0,
        5
      ],
      "dependsOn": []
    },
    {
      "ref": "2:01a21309-5bc0-70f9-bafb-8b7e97326f2e",
      "name": "Ontology and persistence",
      "project": "house_mcp",
      "status": "reached",
      "subProject": "House Graph",
      "aliases": [
        "Stage 0"
      ],
      "criteria": [
        2,
        2
      ],
      "dependsOn": [],
      "reachedOn": "2026-11-25"
    },
    {
      "ref": "2:01a2130a-4b53-7551-8038-9ae5f24e9ded",
      "name": "Tasks, places and activities",
      "project": "house_mcp",
      "status": "reached",
      "subProject": "House Graph",
      "aliases": [
        "Stage 1"
      ],
      "criteria": [
        3,
        3
      ],
      "dependsOn": [],
      "reachedOn": "2026-11-25"
    },
    {
      "ref": "2:01a2130a-4d0c-763d-9e29-9074888a0078",
      "name": "Became House",
      "project": "house_mcp",
      "status": "reached",
      "subProject": "House Graph",
      "aliases": [
        "Become House",
        "rename and monorepo"
      ],
      "criteria": [
        2,
        2
      ],
      "dependsOn": [],
      "reachedOn": "2026-11-25"
    },
    {
      "ref": "2:01a2130a-4eea-76ff-ad86-b873fa4020a4",
      "name": "Resources and kits",
      "project": "house_mcp",
      "status": "reached",
      "subProject": "House Graph",
      "aliases": [
        "2a",
        "Stage 2a"
      ],
      "criteria": [
        3,
        3
      ],
      "dependsOn": [],
      "reachedOn": "2026-11-25"
    },
    {
      "ref": "2:01a2130a-5184-7075-9cc2-22b3d386323f",
      "name": "Inventory and running low",
      "project": "house_mcp",
      "status": "reached",
      "subProject": "House Graph",
      "aliases": [
        "2b",
        "Stage 2b",
        "inventory"
      ],
      "criteria": [
        3,
        3
      ],
      "dependsOn": [],
      "reachedOn": "2026-11-25"
    },
    {
      "ref": "2:01a2130a-5341-722e-8ba4-1bd86281d9d4",
      "name": "Things the house owns and their documents",
      "project": "house_mcp",
      "status": "reached",
      "subProject": "House Graph",
      "aliases": [
        "Stage 2c",
        "Stage 2c-2d",
        "Stage 2d"
      ],
      "criteria": [
        2,
        2
      ],
      "dependsOn": [],
      "reachedOn": "2026-11-25"
    },
    {
      "ref": "2:01a2130a-5515-72e6-88a1-20b371ad5060",
      "name": "Semantic search over the vocabulary",
      "project": "house_mcp",
      "status": "reached",
      "subProject": "House Graph",
      "aliases": [
        "2e",
        "Stage 2e",
        "semantic search"
      ],
      "criteria": [
        2,
        2
      ],
      "dependsOn": [],
      "reachedOn": "2026-11-25"
    },
    {
      "ref": "2:01a2130a-56d6-70a2-a955-02c0a1c68761",
      "name": "Recurrence, estimates, dependencies and usual buys",
      "project": "house_mcp",
      "status": "reached",
      "subProject": "House Graph",
      "aliases": [
        "Stage 3"
      ],
      "criteria": [
        4,
        4
      ],
      "dependsOn": [],
      "reachedOn": "2026-11-25"
    },
    {
      "ref": "2:01a2130a-58c0-7612-aafd-ae2814a8b845",
      "name": "Planning a session",
      "project": "house_mcp",
      "status": "reached",
      "subProject": "House Graph",
      "aliases": [
        "Stage 4",
        "plan_session"
      ],
      "criteria": [
        2,
        2
      ],
      "dependsOn": [],
      "reachedOn": "2026-11-25"
    },
    {
      "ref": "2:01a2130a-5acf-715b-9e4e-5d17cccf373e",
      "name": "Ontology in Context Studio",
      "project": "house_mcp",
      "status": "reached",
      "subProject": "House Graph",
      "aliases": [
        "ontology source of truth",
        "places are never serviced"
      ],
      "criteria": [
        5,
        5
      ],
      "dependsOn": [],
      "reachedOn": "2026-11-25"
    },
    {
      "ref": "2:01a2130a-5cbd-77b7-a36b-4fec311cf48e",
      "name": "Care schedules",
      "project": "house_mcp",
      "status": "reached",
      "subProject": "House Graph",
      "aliases": [
        "care",
        "upkeep"
      ],
      "criteria": [
        8,
        8
      ],
      "dependsOn": [],
      "reachedOn": "2026-11-25"
    },
    {
      "ref": "2:01a2130a-5ed7-7475-9377-8e3979867c8e",
      "name": "Things to get, boards and parties",
      "project": "house_mcp",
      "status": "reached",
      "subProject": "House Graph",
      "aliases": [
        "boards",
        "graph migrations 4-6",
        "parties"
      ],
      "criteria": [
        7,
        7
      ],
      "dependsOn": [],
      "reachedOn": "2026-11-25"
    },
    {
      "ref": "2:01a2130a-6146-7785-aa69-01f1f21df6fe",
      "name": "Running a project with House",
      "project": "house_mcp",
      "status": "reached",
      "subProject": "House Graph",
      "aliases": [
        "Projects",
        "projects plan",
        "running a project"
      ],
      "criteria": [
        8,
        8
      ],
      "dependsOn": [],
      "reachedOn": "2026-11-25"
    },
    {
      "ref": "2:01a2130a-637a-74f6-8af1-b7e11a9f169e",
      "name": "Fast and correct in live use",
      "project": "house_mcp",
      "status": "reached",
      "aliases": [
        "Fixes from live usage",
        "PR #87",
        "PR #89"
      ],
      "criteria": [
        5,
        5
      ],
      "dependsOn": [],
      "reachedOn": "2026-11-25"
    },
    {
      "ref": "2:01a2130a-6686-7140-97bd-4fde7f50364a",
      "name": "Document library",
      "project": "house_mcp",
      "status": "reached",
      "subProject": "House Library",
      "aliases": [
        "L1",
        "library L1"
      ],
      "criteria": [
        2,
        2
      ],
      "dependsOn": [],
      "reachedOn": "2026-11-25"
    },
    {
      "ref": "2:01a2130a-68b4-76f6-860e-664f491a8794",
      "name": "Manual finder",
      "project": "house_mcp",
      "status": "reached",
      "subProject": "House Library",
      "aliases": [
        "L2",
        "finder",
        "library L2"
      ],
      "criteria": [
        4,
        4
      ],
      "dependsOn": [],
      "reachedOn": "2026-11-25"
    },
    {
      "ref": "2:01a2130a-6a7f-710b-970e-4324f96ef0ca",
      "name": "Vaults",
      "project": "house_mcp",
      "status": "reached",
      "subProject": "House Knowledge Base",
      "aliases": [
        "K1",
        "knowledge base K1"
      ],
      "criteria": [
        5,
        5
      ],
      "dependsOn": [],
      "reachedOn": "2026-11-25"
    },
    {
      "ref": "2:01a2130a-6c53-76eb-a797-593402cdcd99",
      "name": "Bringing a project over",
      "project": "house_mcp",
      "status": "reached",
      "subProject": "House Knowledge Base",
      "aliases": [
        "K3",
        "knowledge base K3",
        "project migration"
      ],
      "criteria": [
        4,
        4
      ],
      "dependsOn": [],
      "reachedOn": "2026-11-25"
    },
    {
      "ref": "2:01a2130b-65ac-70ca-bcb9-87de8f63c671",
      "name": "Projects organized in House",
      "project": "house_mcp",
      "status": "active",
      "subProject": "House Graph",
      "aliases": [
        "#97",
        "milestones, gates, workstreams and interfaces",
        "organizing projects"
      ],
      "criteria": [
        2,
        9
      ],
      "dependsOn": [
        "2:01a21242-3365-7125-9b19-bf6efe8f5b62"
      ]
    },
    {
      "ref": "2:01a2130b-67d5-7423-98f8-765bdd997003",
      "name": "Sharing from the phone",
      "project": "house_mcp",
      "status": "proposed",
      "subProject": "House Library",
      "aliases": [
        "L3",
        "library L3",
        "share sheet"
      ],
      "criteria": [
        0,
        6
      ],
      "dependsOn": []
    },
    {
      "ref": "2:01a2130b-6984-7683-8606-732541affe6f",
      "name": "Node pages in Obsidian",
      "project": "house_mcp",
      "status": "set_aside",
      "subProject": "House Knowledge Base",
      "aliases": [
        "K2",
        "knowledge base K2",
        "node pages"
      ],
      "criteria": [
        0,
        7
      ],
      "dependsOn": []
    },
    {
      "ref": "2:01a2130b-6b92-70b2-954b-31f6241f6b1f",
      "name": "Store checks from any conversation",
      "project": "house_mcp",
      "status": "active",
      "aliases": [
        "household runners",
        "local stores",
        "store checks"
      ],
      "criteria": [
        0,
        9
      ],
      "dependsOn": []
    },
    {
      "ref": "2:01a2130c-6e93-74f1-81a0-d860a567667a",
      "name": "Household members in the graph",
      "project": "house_mcp",
      "status": "proposed",
      "subProject": "House Graph",
      "aliases": [
        "assigned_to",
        "assignees",
        "owned_by"
      ],
      "criteria": [
        0,
        2
      ],
      "dependsOn": []
    },
    {
      "ref": "2:01a2130c-7165-7670-bd02-c817b56b6658",
      "name": "Work across groups",
      "project": "house_mcp",
      "status": "proposed",
      "subProject": "House Graph",
      "aliases": [
        "links across groups",
        "moving a task to another group"
      ],
      "criteria": [
        1,
        2
      ],
      "dependsOn": []
    },
    {
      "ref": "2:01a2130c-73a9-77b0-9b85-5d89d236ecdb",
      "name": "A time zone per group",
      "project": "house_mcp",
      "status": "proposed",
      "subProject": "House Graph",
      "criteria": [
        0,
        1
      ],
      "dependsOn": []
    },
    {
      "ref": "2:01a2130c-75cc-7561-9ccd-ce05965c86e6",
      "name": "More starter vocabularies",
      "project": "house_mcp",
      "status": "proposed",
      "subProject": "House Graph",
      "aliases": [
        "starter vocabulary templates"
      ],
      "criteria": [
        0,
        1
      ],
      "dependsOn": []
    },
    {
      "ref": "2:01a2130c-77d1-7673-9606-05e0678776fb",
      "name": "Buying that restocks in one call",
      "project": "house_mcp",
      "status": "proposed",
      "subProject": "House Graph",
      "criteria": [
        0,
        1
      ],
      "dependsOn": []
    },
    {
      "ref": "2:01a2130c-7a00-77a7-a21f-eb978a040cd7",
      "name": "Sensors feeding care schedules",
      "project": "house_mcp",
      "status": "proposed",
      "subProject": "House Graph",
      "criteria": [
        0,
        1
      ],
      "dependsOn": []
    },
    {
      "ref": "2:01a2130c-7ca5-70e5-8550-a767504bd696",
      "name": "Upkeep schedules from manuals",
      "project": "house_mcp",
      "status": "proposed",
      "subProject": "House Graph",
      "aliases": [
        "maintenance schedules from manuals"
      ],
      "criteria": [
        0,
        1
      ],
      "dependsOn": []
    },
    {
      "ref": "2:01a2130c-7e48-75ea-ab6a-240272f6f3f6",
      "name": "Siri capture shortcut",
      "project": "house_mcp",
      "status": "proposed",
      "aliases": [
        "Siri REST shortcut",
        "capture over REST"
      ],
      "criteria": [
        0,
        2
      ],
      "dependsOn": []
    },
    {
      "ref": "2:01a2130c-802c-76b0-aeed-0ed111c25970",
      "name": "Browser view of House",
      "project": "house_mcp",
      "status": "proposed",
      "aliases": [
        "browser view",
        "transit map",
        "web view"
      ],
      "criteria": [
        0,
        2
      ],
      "dependsOn": []
    },
    {
      "ref": "2:01a21317-9fea-7433-a2b6-541b019f0653",
      "name": "Importing a roadmap in one call",
      "project": "house_mcp",
      "status": "reached",
      "subProject": "House Graph",
      "aliases": [
        "batch import",
        "house#111"
      ],
      "criteria": [
        2,
        2
      ],
      "dependsOn": [],
      "reachedOn": "2026-11-25"
    },
    {
      "ref": "2:01a2135d-0e65-774b-8050-5ba5700e323f",
      "name": "House 0.3.0: dogfooding at scale",
      "project": "house_mcp",
      "status": "active",
      "aliases": [
        "House 0.3.0",
        "house-projects 0.3.0",
        "v0.3.0"
      ],
      "criteria": [
        8,
        10
      ],
      "dependsOn": []
    },
    {
      "ref": "2:01a21242-258f-706c-b351-e9421fd0a0fc",
      "name": "DR practice designed",
      "project": "claude_plugins",
      "status": "reached",
      "aliases": [
        "Phase 0",
        "dr-practice Phase 0"
      ],
      "criteria": [
        2,
        2
      ],
      "dependsOn": [],
      "reachedOn": "2026-11-25"
    },
    {
      "ref": "2:01a21242-2734-75d8-b352-cf0bef773528",
      "name": "Existing models current and registered",
      "project": "claude_plugins",
      "status": "active",
      "aliases": [
        "Phase 1",
        "dr-practice Phase 1"
      ],
      "criteria": [
        2,
        5
      ],
      "dependsOn": []
    },
    {
      "ref": "2:01a21242-2915-71b2-afe2-9e7acf1e37c3",
      "name": "Minimum practice tooling",
      "project": "claude_plugins",
      "status": "active",
      "aliases": [
        "Phase 2",
        "dr-practice Phase 2"
      ],
      "criteria": [
        0,
        6
      ],
      "dependsOn": [
        "2:01a21242-2734-75d8-b352-cf0bef773528"
      ]
    },
    {
      "ref": "2:01a21242-2aac-7626-937c-bd4276b15b26",
      "name": "Active repos adopted",
      "project": "claude_plugins",
      "status": "active",
      "aliases": [
        "Phase 3",
        "dr-practice Phase 3"
      ],
      "criteria": [
        1,
        5
      ],
      "dependsOn": []
    },
    {
      "ref": "2:01a21242-2d1a-71d6-9671-d1ca37667fe0",
      "name": "Practice loop closed",
      "project": "claude_plugins",
      "status": "active",
      "aliases": [
        "Phase 4",
        "dr-practice Phase 4"
      ],
      "criteria": [
        0,
        5
      ],
      "dependsOn": [
        "2:01a21242-2915-71b2-afe2-9e7acf1e37c3"
      ]
    },
    {
      "ref": "2:01a21242-31a2-72f9-a1e4-bb6d7ff3fd22",
      "name": "house-projects shipped",
      "project": "claude_plugins",
      "status": "reached",
      "aliases": [
        "house-projects 0.1.0",
        "organizing-projects step 7"
      ],
      "criteria": [
        3,
        3
      ],
      "dependsOn": [],
      "reachedOn": "2026-11-25"
    },
    {
      "ref": "2:01a21242-3365-7125-9b19-bf6efe8f5b62",
      "name": "house-projects proven on live House",
      "project": "claude_plugins",
      "status": "active",
      "aliases": [
        "house-practice Phase 1",
        "house-projects 0.1.1"
      ],
      "criteria": [
        2,
        4
      ],
      "dependsOn": [
        "2:01a21242-31a2-72f9-a1e4-bb6d7ff3fd22"
      ]
    },
    {
      "ref": "2:01a21242-34e0-7584-86e8-f45ef6ffdb19",
      "name": "Parallel sessions for a workstream",
      "project": "claude_plugins",
      "status": "proposed",
      "criteria": [
        0,
        2
      ],
      "dependsOn": []
    },
    {
      "ref": "2:01a21264-4b7d-7752-b1af-37e687a2056e",
      "name": "House practice designed",
      "project": "claude_plugins",
      "status": "reached",
      "aliases": [
        "house-practice Phase 0"
      ],
      "criteria": [
        2,
        2
      ],
      "dependsOn": [],
      "reachedOn": "2026-11-25"
    },
    {
      "ref": "2:01a21264-4e79-749f-962c-6924b4b44671",
      "name": "Active projects in House",
      "project": "claude_plugins",
      "status": "active",
      "aliases": [
        "house-practice Phase 2"
      ],
      "criteria": [
        1,
        4
      ],
      "dependsOn": []
    },
    {
      "ref": "2:01a21264-504f-733e-9595-515264b3d3e5",
      "name": "House practice ambient",
      "project": "claude_plugins",
      "status": "active",
      "aliases": [
        "house-practice Phase 3"
      ],
      "criteria": [
        0,
        3
      ],
      "dependsOn": []
    },
    {
      "ref": "2:01a21264-52a3-77aa-a728-16a3435e8b98",
      "name": "House practice loop closed",
      "project": "claude_plugins",
      "status": "active",
      "aliases": [
        "house-practice Phase 4"
      ],
      "criteria": [
        0,
        4
      ],
      "dependsOn": []
    },
    {
      "ref": "2:01a2132c-2a97-705c-ab77-a795c6b46ed5",
      "name": "Practice plugin designed",
      "project": "claude_plugins",
      "status": "reached",
      "aliases": [
        "practice Phase 0"
      ],
      "criteria": [
        2,
        2
      ],
      "dependsOn": [],
      "reachedOn": "2026-11-25"
    },
    {
      "ref": "2:01a2132c-2eff-70d7-9a15-79bb379163ed",
      "name": "Rules travel with the practice plugin",
      "project": "claude_plugins",
      "status": "active",
      "aliases": [
        "practice 0.1",
        "practice Phase 1"
      ],
      "criteria": [
        0,
        5
      ],
      "dependsOn": []
    },
    {
      "ref": "2:01a2132c-31d8-70fc-a3d4-6bfc34217d23",
      "name": "One friction route",
      "project": "claude_plugins",
      "status": "active",
      "aliases": [
        "practice Phase 2"
      ],
      "criteria": [
        0,
        3
      ],
      "dependsOn": []
    },
    {
      "ref": "2:01a2132c-356e-76fd-b90e-7f8a87fff251",
      "name": "Practice hooks",
      "project": "claude_plugins",
      "status": "active",
      "aliases": [
        "practice Phase 3"
      ],
      "criteria": [
        0,
        4
      ],
      "dependsOn": []
    },
    {
      "ref": "2:01a2132c-3740-749f-8d88-97d2b866ab1f",
      "name": "Portfolio view",
      "project": "claude_plugins",
      "status": "active",
      "aliases": [
        "fleet and coverage",
        "practice Phase 4"
      ],
      "criteria": [
        0,
        3
      ],
      "dependsOn": []
    },
    {
      "ref": "2:01a2135c-354b-774d-81d2-2e4ff105aa6c",
      "name": "Reviews carry the practice",
      "project": "claude_plugins",
      "status": "active",
      "criteria": [
        0,
        4
      ],
      "dependsOn": []
    }
  ],
  "gates": [
    {
      "ref": "2:01a21246-b2a2-72fb-866f-da2155ab94a4",
      "name": "Keep building after proposals",
      "project": "context_studio",
      "status": "decided",
      "subProject": "Ontology Workbench",
      "aliases": [
        "Gate A",
        "Gate A/B",
        "Gate B"
      ],
      "question": "Does proposing and shipping ontology changes through Context Studio beat the manual workflow enough to build refinement next?",
      "criteria": [
        4,
        4
      ],
      "dependsOn": [
        "2:01a21246-5b3e-730f-979b-cd0c0211bd3d"
      ],
      "opens": [
        "2:01a21246-5db3-700d-b2df-bdd5fbf70856"
      ],
      "decidedOn": "2026-11-25",
      "decision": "Continue: build refinement (phase C), starting with the decision model groundwork. Gate B closed 2026-11-05 (#1370)."
    },
    {
      "ref": "2:01a21246-b4b5-70e8-a4cd-d147847ab8b7",
      "name": "Keep building after refinement",
      "project": "context_studio",
      "status": "decided",
      "subProject": "Ontology Workbench",
      "aliases": [
        "Gate C"
      ],
      "question": "Does refinement through Context Studio pay off for DR and House, and what must the round trip fix before extraction?",
      "criteria": [
        3,
        3
      ],
      "dependsOn": [
        "2:01a21246-603b-775b-ad5e-2048c3005eeb"
      ],
      "opens": [
        "2:01a21246-61da-777c-8fee-cf51e5d1837e"
      ],
      "decidedOn": "2026-11-25",
      "decision": "Continue, but complete the client round trip (C3) before extraction (D), from DR's and House's feedback (2026-11-07)."
    },
    {
      "ref": "2:01a21246-b639-77b3-9069-458dab1baa7d",
      "name": "Workbench extraction pays off",
      "project": "context_studio",
      "status": "open",
      "subProject": "Ontology Workbench",
      "aliases": [
        "Gate D"
      ],
      "question": "Does extraction on real sources through the workbench beat modelling by hand, on hand edits, decisions captured and quality?",
      "criteria": [
        2,
        3
      ],
      "dependsOn": [],
      "opens": [],
      "waitsOnTasks": [
        "Build litmus tests and examples on schema and data (#1333)"
      ]
    },
    {
      "ref": "2:01a21247-f84d-71d4-b01e-d895878ca021",
      "name": "Tauri scoping",
      "project": "context_studio",
      "status": "decided",
      "aliases": [
        "#1671",
        "Lane F",
        "Tauri scoping (#1671)"
      ],
      "question": "How should Context Studio be packaged as a desktop app: platform, runtime, data locations, MCP reachability, signing, size and start-up budget?",
      "criteria": [
        2,
        2
      ],
      "dependsOn": [],
      "opens": [
        "2:01a21247-f6ca-773c-aeed-61f897eaf376"
      ],
      "decidedOn": "2026-11-25",
      "decision": "All ten #1671 recommendations accepted (2026-11-24): Apple Silicon only, the size and start-up budget, model bundled, no updater, back end serves the UI, keys in config.json for the MVP, com.tinkermonkey.contextstudio, port 8765 with fallback."
    },
    {
      "ref": "2:01a21247-fa2c-72c1-a3da-01b462e54340",
      "name": "Apple Developer Program",
      "project": "context_studio",
      "status": "open",
      "aliases": [
        "Developer ID",
        "notarization decision"
      ],
      "question": "Join the paid Apple Developer Program to get a Developer ID and notarize the desktop app?",
      "criteria": [
        0,
        2
      ],
      "dependsOn": [],
      "opens": []
    },
    {
      "ref": "2:01a21248-5f8b-775f-8e31-748ca74f2b55",
      "name": "Default individual extraction",
      "project": "context_studio",
      "status": "decided",
      "subProject": "Extraction Pipelines",
      "aliases": [
        "D1",
        "D2",
        "extraction core"
      ],
      "question": "Which individual-extraction implementation should be the default, and should relationships stay limited to the allowed types?",
      "criteria": [
        3,
        3
      ],
      "dependsOn": [],
      "opens": [
        "2:01a21248-6320-77f8-a836-77dd0e1b7c49"
      ],
      "decidedOn": "2026-11-25",
      "decision": "single_call (one Opus 5.5 call) is the default for individuals, with the constrained relate step kept on Opus; proposals record pipeline and version; other implementations stay selectable and are gardened (2026-11-17)."
    },
    {
      "ref": "2:01a21248-6154-72e4-8d87-825bf255c390",
      "name": "LLM pre-review stage",
      "project": "context_studio",
      "status": "decided",
      "subProject": "Extraction Pipelines",
      "aliases": [
        "extraction-pre-review-stage",
        "pre-review stage",
        "pre_review"
      ],
      "question": "Should an LLM split-and-retype stage run before the person reviews an extraction?",
      "criteria": [
        1,
        1
      ],
      "dependsOn": [],
      "opens": [],
      "decidedOn": "2026-11-25",
      "decision": "Keep it as an optional configuration (pre_review), off by default; landed 2026-11-24 (#1676, #1685)."
    },
    {
      "ref": "2:01a21248-64cc-7433-a1c0-d399f21e454b",
      "name": "Relationship step for single_call",
      "project": "context_studio",
      "status": "open",
      "subProject": "Extraction Pipelines",
      "aliases": [
        "R1",
        "R1 vs Opus relate",
        "next step 2"
      ],
      "question": "Does one Opus call given the allowed types (R1) beat single_call's Opus relate step on relationships?",
      "criteria": [
        0,
        2
      ],
      "dependsOn": [],
      "opens": []
    },
    {
      "ref": "2:01a2126b-dcdd-738c-bffe-ea23934a97eb",
      "name": "Next layered-graph view",
      "project": "dr_viewer",
      "status": "open",
      "aliases": [
        "3D layer stack",
        "design canvas picks"
      ],
      "question": "Which unbuilt layered-graph view comes next: the Architecture coverage view, traceability lanes, or the 3D layer stack?",
      "criteria": [
        0,
        3
      ],
      "dependsOn": [],
      "opens": [
        "2:01a2126b-9a77-71cf-adc0-57c9fd2597b7",
        "2:01a2126b-9c49-7336-b7e1-462869cad972"
      ]
    },
    {
      "ref": "2:01a2126b-dab3-70fb-9c79-e73a100e1f98",
      "name": "Where the mapping engine runs",
      "project": "documentation_robotics",
      "status": "open",
      "aliases": [
        "#1399 engine decision"
      ],
      "question": "Does the spec mapping engine ship as a shared package the viewer runs live in the browser, or does the CLI server compute the mapped graph?",
      "criteria": [
        0,
        3
      ],
      "dependsOn": [],
      "opens": [
        "2:01a2126b-9188-7166-993a-57a161430ba2"
      ]
    },
    {
      "ref": "2:01a21272-18e8-7041-be54-cc95a0da2f72",
      "name": "Landing gate",
      "project": "documentation_robotics",
      "status": "open",
      "aliases": [
        "#1419",
        "commit gate",
        "landing.confirm"
      ],
      "question": "Should changeset_commit drop the dialog and token, make confirmation a setting (landing.confirm), or keep a prompt only?",
      "criteria": [
        0,
        3
      ],
      "dependsOn": [],
      "opens": []
    },
    {
      "ref": "2:01a21272-1a97-765e-a618-472b9f4de140",
      "name": "Test cluster shape",
      "project": "documentation_robotics",
      "status": "open",
      "aliases": [
        "#1312 decision",
        "cluster shape"
      ],
      "question": "Is a test cluster one test case sketch, a coverage target or a new type, and which signals form it?",
      "criteria": [
        0,
        4
      ],
      "dependsOn": [],
      "opens": [
        "2:01a21271-b7bf-7169-9ce7-1debbde96ca4"
      ]
    },
    {
      "ref": "2:01a21272-1c2b-72bb-987c-e9ed76e1d171",
      "name": "C4 container kind",
      "project": "documentation_robotics",
      "status": "open",
      "aliases": [
        "#1386 decision"
      ],
      "question": "Should a container kind go on application component, or a channel on ux.uxapplication, so a CLI, batch job or library can be a C4 container?",
      "criteria": [
        0,
        2
      ],
      "dependsOn": [],
      "opens": []
    },
    {
      "ref": "2:01a21272-1e32-701c-ab90-8cfae0822ad7",
      "name": "Models across branches and checkouts",
      "project": "documentation_robotics",
      "status": "open",
      "aliases": [
        "#1421",
        "#1431",
        "model merge"
      ],
      "question": "How should DR merge two branches' models and share extraction records across checkouts, and does that need its own design?",
      "criteria": [
        0,
        3
      ],
      "dependsOn": [],
      "opens": []
    },
    {
      "ref": "2:01a21272-2005-7468-8949-44e0cf389c4d",
      "name": "Code index in the dr workflow",
      "project": "documentation_robotics",
      "status": "open",
      "aliases": [
        "#1343 decision",
        "CBM in the workflow"
      ],
      "question": "Should agents query the codebase-memory graph as part of the dr workflow, and through dr's tools or the codebase-memory server?",
      "criteria": [
        0,
        2
      ],
      "dependsOn": [],
      "opens": []
    },
    {
      "ref": "2:01a21272-846e-714d-907d-429cddd8019b",
      "name": "Tier 1 accept band staged",
      "project": "documentation_robotics",
      "status": "open",
      "subProject": "DR Extraction Cascade",
      "aliases": [
        "B6 stage mode",
        "TIER1_CALIBRATION",
        "stage mode"
      ],
      "question": "Is Clef's accept band precise enough on held-out code to stage its answers without a person?",
      "criteria": [
        0,
        4
      ],
      "dependsOn": [],
      "opens": []
    },
    {
      "ref": "2:01a21273-5102-711a-b346-74de09b49568",
      "name": "Assessment run settings",
      "project": "documentation_robotics",
      "status": "open",
      "subProject": "DR Self-Assessment",
      "aliases": [
        "assessment decisions",
        "fleet settings"
      ],
      "question": "Which repository is held out, is everything reviewed or a sample, what is the budget per repository, and does experiment 2 stay?",
      "criteria": [
        0,
        4
      ],
      "dependsOn": [],
      "opens": [
        "2:01a21273-0d10-74eb-a1d7-97a35787766c"
      ]
    },
    {
      "ref": "2:01a21273-5306-7588-9c3e-78b30e35b337",
      "name": "Assessment proven for the product",
      "project": "documentation_robotics",
      "status": "open",
      "subProject": "DR Self-Assessment",
      "aliases": [
        "integration gate"
      ],
      "question": "Which review questions and witnesses have proven themselves on held-out repositories, by the per-question decision rules, well enough to ship in DR?",
      "criteria": [
        0,
        5
      ],
      "dependsOn": [
        "2:01a21273-0d10-74eb-a1d7-97a35787766c",
        "2:01a21273-0f78-744f-bc4a-d7df44e9c360"
      ],
      "opens": [
        "2:01a21273-112d-7780-8cfb-52041f1d7881"
      ]
    },
    {
      "ref": "2:01a21305-415a-77de-8a6b-bd803459f639",
      "name": "Layout engine approach",
      "project": "heimdall",
      "status": "decided",
      "aliases": [
        "Phase 1",
        "layout engine direction",
        "layout engine phase 1"
      ],
      "question": "Build the layout engine in-house against yFiles as the reference, or adopt ELK, and which modes come first?",
      "criteria": [
        3,
        3
      ],
      "dependsOn": [],
      "opens": [
        "2:01a21304-7f81-77cf-9c88-5f74643a8544",
        "2:01a21304-88f3-73ba-8f3d-73ea457bbd31",
        "2:01a21304-8bce-722f-9a27-f8ca45d66ef0",
        "2:01a21304-94d5-772a-b2db-cd08bdc59c18",
        "2:01a21304-9886-77ba-af43-177afc42d8bb",
        "2:01a21304-9c17-70bb-a5d8-1f5e2caf5155"
      ],
      "decidedOn": "2026-11-25",
      "decision": "Build in-house with yFiles as the reference only: organic and orthogonal first, hierarchical and any ELK use in a second phase; the DR spec graph is the target data."
    },
    {
      "ref": "2:01a21305-4459-70fd-b7bf-c40a511c161b",
      "name": "Layered graph design",
      "project": "heimdall",
      "status": "decided",
      "question": "What renderer, names, follow rule and data input do the layered graph components use?",
      "criteria": [
        4,
        4
      ],
      "dependsOn": [],
      "opens": [
        "2:01a21304-7c74-7340-839b-b87f73b6e2e7"
      ],
      "decidedOn": "2026-11-25",
      "decision": "SVG projection for the 3D stack; lanes as GraphCanvas layout=\"layer-lanes\"; naming pattern A; one \"away from the clicked layer\" follow rule; GraphCanvas nodes and edges as input, no data adapters."
    },
    {
      "ref": "2:01a21305-4705-740b-b1dc-1de57d38ccec",
      "name": "Orthogonal grid pitch and bus groups",
      "project": "heimdall",
      "status": "decided",
      "question": "One uniform pitch or per-row and per-column pitch, and may the engine draw a hub's edges as a declared bus trunk?",
      "criteria": [
        2,
        2
      ],
      "dependsOn": [],
      "opens": [
        "2:01a21304-8f30-7312-bd21-697fdcb9acb7"
      ],
      "decidedOn": "2026-11-25",
      "decision": "Per-row and per-column pitch, as yFiles does, after the placement run; declared bus groups in the engine, exempted from the segment-overlap check."
    },
    {
      "ref": "2:01a21305-4b9f-74f5-a29b-719d56b75b6d",
      "name": "Orthogonal router size switch",
      "project": "heimdall",
      "status": "open",
      "question": "Keep the lattice/channel router switch at 150 edges, or route every graph with one router?",
      "criteria": [
        0,
        2
      ],
      "dependsOn": [
        "2:01a21304-88f3-73ba-8f3d-73ea457bbd31"
      ],
      "opens": []
    },
    {
      "ref": "2:01a21305-4ddf-7509-81b3-0daa4cc4a7b6",
      "name": "Hierarchical layout and ELK",
      "project": "heimdall",
      "status": "open",
      "aliases": [
        "ELK question"
      ],
      "question": "Build a hierarchical (Sugiyama) mode in-house, and does ELK earn a place beyond being a benchmark?",
      "criteria": [
        0,
        3
      ],
      "dependsOn": [
        "2:01a21304-88f3-73ba-8f3d-73ea457bbd31",
        "2:01a21304-8bce-722f-9a27-f8ca45d66ef0"
      ],
      "opens": [
        "2:01a21304-9f3a-75a1-b352-b82428b024bd"
      ]
    },
    {
      "ref": "2:01a21305-50c4-7558-a982-45200e113d30",
      "name": "Layout loop's role",
      "project": "heimdall",
      "status": "open",
      "subProject": "Heimdall Layout Loop",
      "question": "Is the layout loop a release check, or the build path for layout changes?",
      "criteria": [
        0,
        3
      ],
      "dependsOn": [],
      "opens": [
        "2:01a21304-a422-732a-8d3c-51e99333a9d0",
        "2:01a21304-a941-70bc-b4fa-808b1946355e"
      ]
    },
    {
      "ref": "2:01a2130a-9f63-75dd-a146-830a605a105e",
      "name": "Direction after 0.5.3",
      "project": "reference_api_buddy",
      "status": "open",
      "aliases": [
        "next direction"
      ],
      "question": "After 0.5.3, which proposed direction does reference-api-buddy take on: test coverage to 95%, monitoring extensions, extended performance tests, or maintenance only?",
      "criteria": [
        0,
        3
      ],
      "dependsOn": [
        "2:01a2130a-635d-71ad-bd81-19274efd5e9e"
      ],
      "opens": [
        "2:01a2130a-65e2-76e0-953f-6d94a4ae207b",
        "2:01a2130a-67e2-770e-b8f9-4872eaaf7dca",
        "2:01a2130a-69eb-724d-81ac-9f00ba623205"
      ]
    },
    {
      "ref": "2:01a2130b-f2a6-70ff-923a-42574442889f",
      "name": "Runner stack",
      "project": "house_mcp",
      "status": "decided",
      "aliases": [
        "local stores step 0",
        "store check proof of concept"
      ],
      "question": "What can drive a browser at home that Home Depot and Lowe's won't refuse: Playwright with Chrome, or an extension in an ordinary Chrome profile?",
      "criteria": [
        2,
        2
      ],
      "dependsOn": [],
      "opens": [],
      "decidedOn": "2026-11-25",
      "decision": "The runner is an MV3 Chrome extension in an ordinary, dedicated Chrome profile on a home machine; never Chrome under Playwright, Puppeteer or other CDP control (2026-11-18)."
    },
    {
      "ref": "2:01a2130b-f4bf-742e-b722-81168773215f",
      "name": "Store checks plan accepted",
      "project": "house_mcp",
      "status": "open",
      "aliases": [
        "Plan accepted",
        "local-stores plan",
        "runner plan"
      ],
      "question": "Build store checks as planned: a runners service, pull by default with push as an option, a Chrome extension runner, site guides kept by an agent in House?",
      "criteria": [
        0,
        9
      ],
      "dependsOn": [],
      "opens": [
        "2:01a2130c-e5bb-7370-87aa-a46777c10b99"
      ]
    },
    {
      "ref": "2:01a2130b-f6b8-7169-9140-c36583f60901",
      "name": "Phone sharing approach",
      "project": "house_mcp",
      "status": "open",
      "subProject": "House Library",
      "aliases": [
        "L3 open questions",
        "L3 plan"
      ],
      "question": "Is an iOS Shortcut with a per-device share key the right path from the share sheet, and how do the plan's open questions go?",
      "criteria": [
        0,
        8
      ],
      "dependsOn": [],
      "opens": [
        "2:01a2130c-e1d8-7786-97e2-6e7be6d23c66",
        "2:01a2130b-67d5-7423-98f8-765bdd997003"
      ]
    },
    {
      "ref": "2:01a2130b-f8b8-7404-9bcd-eb4f1f7ab2e3",
      "name": "Second MCP endpoint",
      "project": "house_mcp",
      "status": "open",
      "question": "Has tool routing degraded enough with House's tool count to split it into a second MCP endpoint?",
      "criteria": [
        0,
        2
      ],
      "dependsOn": [],
      "opens": []
    },
    {
      "ref": "2:01a21242-d645-7447-b3ad-1542a40f08bc",
      "name": "Bootstrap budget",
      "project": "claude_plugins",
      "status": "open",
      "aliases": [
        "decision 1",
        "full bootstrap everywhere"
      ],
      "question": "Is a full bootstrap affordable for every remaining repo, or should adoption change course before continuing?",
      "criteria": [
        0,
        2
      ],
      "dependsOn": [],
      "opens": [
        "2:01a21242-e35d-7727-9f3d-3f63e13840dc"
      ]
    },
    {
      "ref": "2:01a21242-d864-7387-8a50-8ac2e65b5629",
      "name": "Plan-mode bridge blocks",
      "project": "claude_plugins",
      "status": "open",
      "aliases": [
        "decision 2",
        "nudge then gate"
      ],
      "question": "Has /dr-plan stopped getting in the way enough for the plan-mode bridge to block plans that aren't changesets?",
      "criteria": [
        0,
        2
      ],
      "dependsOn": [],
      "opens": []
    },
    {
      "ref": "2:01a21264-553a-71a3-8335-339ee65c1cce",
      "name": "How a hook reaches House",
      "project": "claude_plugins",
      "status": "open",
      "question": "Should the hooks only name the repo and have the session look it up, read the vault House syncs to the Mac, or call a read-only House endpoint with a device token?",
      "criteria": [
        0,
        3
      ],
      "dependsOn": [],
      "opens": [
        "2:01a21265-036c-7032-b5e9-22af8224e43a"
      ]
    },
    {
      "ref": "2:01a21264-56b6-77b6-ba4f-f8edf6559fb4",
      "name": "Debrief prompt",
      "project": "claude_plugins",
      "status": "open",
      "aliases": [
        "D17 revisited"
      ],
      "question": "Does the session debrief need a prompt, such as a Stop hook, to keep House current?",
      "criteria": [
        0,
        2
      ],
      "dependsOn": [],
      "opens": []
    },
    {
      "ref": "2:01a21264-5951-736a-9f04-159e0644e32c",
      "name": "Where the weekly review runs",
      "project": "claude_plugins",
      "status": "open",
      "question": "Can a cloud routine use the House connector, or does the weekly review run as a scheduled task on the Mac?",
      "criteria": [
        0,
        2
      ],
      "dependsOn": [],
      "opens": []
    },
    {
      "ref": "2:01a21264-5b8f-706e-9849-29b844034ec3",
      "name": "Shared repo list",
      "project": "claude_plugins",
      "status": "open",
      "question": "Should the coverage skill read the dr-farm registry, given that House counts content repos and non-software projects DR leaves out?",
      "criteria": [
        0,
        2
      ],
      "dependsOn": [],
      "opens": []
    },
    {
      "ref": "2:01a2132c-3a03-77c0-9a43-777b8fce18ab",
      "name": "How the rules load",
      "project": "claude_plugins",
      "status": "open",
      "question": "Do rules added by a SessionStart hook bind as well as CLAUDE.md, or should CLAUDE.md keep one @import line pointing at the plugin's RULES.md?",
      "criteria": [
        1,
        3
      ],
      "dependsOn": [],
      "opens": []
    },
    {
      "ref": "2:01a2132c-3c9d-7288-867f-8b094e8309c6",
      "name": "What else is how I work",
      "project": "claude_plugins",
      "status": "decided",
      "question": "Which commands, review habits, commit and PR conventions, and other things I repeat to every session go into the practice plugin?",
      "criteria": [
        2,
        2
      ],
      "dependsOn": [],
      "opens": [],
      "decidedOn": "2026-11-25",
      "decision": "Carry /review-and-merge, pr-review, docs-gardening, architecture-review, the internal-dependency check, how we work and the docs voice; the last two as always-loaded rules."
    }
  ],
  "workstreams": [
    {
      "ref": "2:01a21249-c545-74f2-a861-f3fcda14859a",
      "name": "Measure Gate D",
      "project": "context_studio",
      "status": "done",
      "subProject": "Ontology Workbench",
      "aliases": [
        "Lane H"
      ],
      "mode": "delivery",
      "leadsTo": "2:01a21246-b639-77b3-9069-458dab1baa7d",
      "dependsOn": [],
      "openedBy": [],
      "tasks": {
        "open": 0,
        "done": 0,
        "inProgress": 0
      },
      "openTasks": []
    },
    {
      "ref": "2:01a21249-c78d-71e8-a9f3-aa949f499ae9",
      "name": "Finish workbench extraction",
      "project": "context_studio",
      "status": "active",
      "subProject": "Ontology Workbench",
      "aliases": [
        "Phase D follow-ups"
      ],
      "mode": "delivery",
      "leadsTo": "2:01a21246-afdd-76bc-8122-b4889091f3eb",
      "dependsOn": [],
      "openedBy": [],
      "tasks": {
        "open": 3,
        "done": 0,
        "inProgress": 0
      },
      "openTasks": [
        "Build litmus tests and examples on schema and data (#1333)",
        "Find relationships between individuals in different chunks (#1572)",
        "Finish the Phase D follow-ups (#1573)"
      ],
      "next": "Build litmus tests and examples on schema and data (#1333)"
    },
    {
      "ref": "2:01a21249-c90e-7373-b2e9-727b98839bd1",
      "name": "One review surface",
      "project": "context_studio",
      "status": "done",
      "aliases": [
        "#1635",
        "Lane A"
      ],
      "mode": "delivery",
      "leadsTo": "2:01a21247-7e15-724a-ad8a-50473ebcf1c6",
      "dependsOn": [],
      "openedBy": [],
      "tasks": {
        "open": 0,
        "done": 0,
        "inProgress": 0
      },
      "openTasks": []
    },
    {
      "ref": "2:01a21249-cb1c-703d-8a9a-073c4618c03e",
      "name": "Measure review value",
      "project": "context_studio",
      "status": "active",
      "aliases": [
        "#1616",
        "review value"
      ],
      "mode": "delivery",
      "leadsTo": "2:01a21247-7e15-724a-ad8a-50473ebcf1c6",
      "dependsOn": [
        "2:01a21247-f6ca-773c-aeed-61f897eaf376"
      ],
      "openedBy": [],
      "tasks": {
        "open": 2,
        "done": 0,
        "inProgress": 0
      },
      "openTasks": [
        "Close the three gold gaps from #1316",
        "Measure review value per pipeline and version, with a from-scratch baseline (#1616)"
      ]
    },
    {
      "ref": "2:01a21249-cdac-734c-8bbd-b3e33b7c57ed",
      "name": "Proposal API",
      "project": "context_studio",
      "status": "done",
      "aliases": [
        "Lane B1"
      ],
      "mode": "delivery",
      "leadsTo": "2:01a21247-7fcd-7797-8cc6-c1eeb0b18845",
      "dependsOn": [],
      "openedBy": [],
      "tasks": {
        "open": 0,
        "done": 0,
        "inProgress": 0
      },
      "openTasks": []
    },
    {
      "ref": "2:01a21249-cfe9-73b1-81e3-405c4d166c8e",
      "name": "Review back end",
      "project": "context_studio",
      "status": "done",
      "aliases": [
        "Lane B2"
      ],
      "mode": "delivery",
      "leadsTo": "2:01a21247-7fcd-7797-8cc6-c1eeb0b18845",
      "dependsOn": [],
      "openedBy": [],
      "tasks": {
        "open": 0,
        "done": 0,
        "inProgress": 0
      },
      "openTasks": []
    },
    {
      "ref": "2:01a2124a-5a00-7586-afb8-4b3730287707",
      "name": "Close the security gaps",
      "project": "context_studio",
      "status": "done",
      "aliases": [
        "Lane C"
      ],
      "mode": "delivery",
      "leadsTo": "2:01a21247-824c-7429-95d7-6f3fd31bcef6",
      "dependsOn": [],
      "openedBy": [],
      "tasks": {
        "open": 0,
        "done": 0,
        "inProgress": 0
      },
      "openTasks": []
    },
    {
      "ref": "2:01a2124a-5c31-7314-b4e1-2afb8553b668",
      "name": "Make the gates honest",
      "project": "context_studio",
      "status": "done",
      "aliases": [
        "Lane D"
      ],
      "mode": "delivery",
      "leadsTo": "2:01a21247-8445-720e-9271-9dbf775ac28f",
      "dependsOn": [],
      "openedBy": [],
      "tasks": {
        "open": 0,
        "done": 0,
        "inProgress": 0
      },
      "openTasks": []
    },
    {
      "ref": "2:01a2124a-5dc5-724b-a509-6201179cdc9a",
      "name": "Move to reference-api-buddy 0.5.2",
      "project": "context_studio",
      "status": "done",
      "aliases": [
        "Lane E"
      ],
      "mode": "delivery",
      "leadsTo": "2:01a21247-85ce-7749-96af-b74e78ac2bb1",
      "dependsOn": [],
      "openedBy": [],
      "tasks": {
        "open": 0,
        "done": 0,
        "inProgress": 0
      },
      "openTasks": []
    },
    {
      "ref": "2:01a2124a-603a-704a-9761-71b6204838d9",
      "name": "Desktop back end",
      "project": "context_studio",
      "status": "active",
      "aliases": [
        "Tauri back end"
      ],
      "mode": "delivery",
      "leadsTo": "2:01a21247-f6ca-773c-aeed-61f897eaf376",
      "dependsOn": [],
      "openedBy": [],
      "tasks": {
        "open": 7,
        "done": 0,
        "inProgress": 0
      },
      "openTasks": [
        "Start without an LLM key so a first run reaches Settings (#1717)",
        "Desktop start-up: app-data paths, log folder, migrations on start, TLS roots (#1718)",
        "Bind the server's own loopback sockets on port 8765 with fallback (#1719)",
        "Serve the built UI at the server's own address (#1720)",
        "Defer heavy imports off the start-up path (#1721)",
        "Accept localhost connections from MCP clients (#1692)",
        "Reference proxy TLS certificates under a bundled interpreter (#1509)"
      ],
      "next": "Start without an LLM key so a first run reaches Settings (#1717)"
    },
    {
      "ref": "2:01a2124a-62ee-70d1-95ef-4ccbd17d61ee",
      "name": "Desktop build and release",
      "project": "context_studio",
      "status": "active",
      "aliases": [
        "Tauri packaging"
      ],
      "mode": "delivery",
      "leadsTo": "2:01a21247-f6ca-773c-aeed-61f897eaf376",
      "dependsOn": [],
      "openedBy": [],
      "tasks": {
        "open": 6,
        "done": 0,
        "inProgress": 0
      },
      "openTasks": [
        "Build the bundled runtime: standalone CPython 3.14, runtime requirements, bytecode, model, trims (#1722)",
        "Build the desktop shell: supervise the server, splash and error page, single instance (#1723)",
        "Write the desktop app's build and run docs, and correct the SQLite vector and reference.db claims (#1726)",
        "Rebase the desktop-packaging DR plan onto the 0.15.0 model and land it (#1710)",
        "Release build: .app and DMG, sign every native library, check the budget (#1724)",
        "Notarize the app with a Developer ID (#1725)"
      ],
      "next": "Build the bundled runtime: standalone CPython 3.14, runtime requirements, bytecode, model, trims (#1722)"
    },
    {
      "ref": "2:01a2124a-665d-73c5-8964-6f22937ea533",
      "name": "Bring the graph views up to date",
      "project": "context_studio",
      "status": "set_aside",
      "mode": "delivery",
      "leadsTo": "2:01a21247-7bde-759e-aa9e-81a06f24c599",
      "dependsOn": [],
      "openedBy": [],
      "tasks": {
        "open": 6,
        "done": 0,
        "inProgress": 0
      },
      "openTasks": [
        "Searchable Layers and Classes selectors in the graph view (#1318)",
        "Label the data graph and add an ontology (schema) graph view (#1319)",
        "Link graph nodes to their entity pages (#1320)",
        "Check the dark-mode checkbox background colour (#1321)",
        "Move the visualizations to Heimdall's latest graph components (#1448)",
        "Fix drawer field labels that vanish on the light canvas (#1545)"
      ]
    },
    {
      "ref": "2:01a2124a-67e4-73ee-8255-7ee657370a1d",
      "name": "Fix the dev tooling",
      "project": "context_studio",
      "status": "active",
      "mode": "delivery",
      "leadsTo": "2:01a21247-fbd5-743c-9b4f-62d0c59724a3",
      "dependsOn": [],
      "openedBy": [],
      "tasks": {
        "open": 9,
        "done": 0,
        "inProgress": 0
      },
      "openTasks": [
        "Stop tracking documentation-robotics/changesets/.active (#1705)",
        "Keep the venv and node_modules links on dev.sh --worktree --stop (#1706)",
        "Let the block_network test fixture allow loopback, and document the override (#1707)",
        "Make the ORM models and Alembic history agree on four indexes (#1712)",
        "Pin and enforce black, then clean up the 95 failing files (#1729)",
        "Make prettier and ux/selector-registry.yaml agree (#1730)",
        "Batch the list proposals summary form's link lookups (#1746)",
        "Fix the mypy errors at Python 3.14"
      ],
      "next": "Stop tracking documentation-robotics/changesets/.active (#1705)"
    },
    {
      "ref": "2:01a2124a-69d9-7457-87dc-90caa5edcbb2",
      "name": "Fix what real documents showed",
      "project": "context_studio",
      "status": "active",
      "mode": "delivery",
      "leadsTo": "2:01a21247-fdc6-77c3-bf2f-d470c4368d66",
      "dependsOn": [],
      "openedBy": [],
      "tasks": {
        "open": 4,
        "done": 0,
        "inProgress": 0
      },
      "openTasks": [
        "Flag relationships that will fail at apply on the review page (#1678)",
        "Split an element that names several things on the review page (#1679)",
        "Make the boilerplate skip handle a PDF with no detected headings (#1680)",
        "Draw the line between DR's Assessment and Driver on risks (#1681)"
      ],
      "next": "Flag relationships that will fail at apply on the review page (#1678)"
    },
    {
      "ref": "2:01a2124a-6c75-716d-95f1-5b91cbfcfd0d",
      "name": "Propose the DR catalog gaps",
      "project": "context_studio",
      "status": "active",
      "mode": "delivery",
      "leadsTo": "2:01a21248-00d0-7188-92d6-195b02e30d9d",
      "dependsOn": [],
      "openedBy": [],
      "tasks": {
        "open": 5,
        "done": 0,
        "inProgress": 0
      },
      "openTasks": [
        "Propose the DR catalog gaps from modelling an Electron desktop app (#1654)",
        "Propose the DR catalog gaps: UX triggers, network types, non-HTTP API surfaces (#1670)",
        "Propose the DR catalog gaps from planning a cloud service in an Electron app (#1731)",
        "Propose the DR catalog gaps from modelling toland-cad (#1742)",
        "Propose the gaps the C4 diagrams expose"
      ],
      "next": "Propose the DR catalog gaps from modelling an Electron desktop app (#1654)"
    },
    {
      "ref": "2:01a2124a-6e06-7101-8cb8-e72446fc0b11",
      "name": "Check the benchmark gold",
      "project": "context_studio",
      "status": "active",
      "subProject": "Extraction Pipelines",
      "mode": "delivery",
      "leadsTo": "2:01a21248-6320-77f8-a836-77dd0e1b7c49",
      "dependsOn": [],
      "openedBy": [],
      "tasks": {
        "open": 4,
        "done": 0,
        "inProgress": 0
      },
      "openTasks": [
        "Check the gitlab_architecture benchmark gold",
        "Check the holdout gold and the spurious items",
        "Grow the benchmark to ten or more documents with human-confirmed gold",
        "Confirm single_call on human-checked gold and garden the losing implementations"
      ],
      "next": "Check the gitlab_architecture benchmark gold"
    },
    {
      "ref": "2:01a2124a-7067-72c1-b4a6-60785e8c1b83",
      "name": "R1 relationship experiment",
      "project": "context_studio",
      "status": "active",
      "subProject": "Extraction Pipelines",
      "mode": "exploration",
      "leadsTo": "2:01a21248-64cc-7433-a1c0-d399f21e454b",
      "dependsOn": [],
      "openedBy": [],
      "tasks": {
        "open": 1,
        "done": 0,
        "inProgress": 0
      },
      "openTasks": [],
      "question": "Does R1 beat single_call's Opus relate step by more than the noise threshold?",
      "next": "Run R1 against single_call's Opus relate step, three takes each"
    },
    {
      "ref": "2:01a2126c-37b0-7288-9f74-64ecfb40cb1b",
      "name": "Reconcile the viewer's model",
      "project": "dr_viewer",
      "status": "done",
      "mode": "delivery",
      "leadsTo": "2:01a2126b-8b4d-73e8-8a3f-754954664fac",
      "dependsOn": [],
      "openedBy": [],
      "tasks": {
        "open": 0,
        "done": 3,
        "inProgress": 0
      },
      "openTasks": []
    },
    {
      "ref": "2:01a2126c-3993-7443-bfe3-c38c71efbe9b",
      "name": "Get E2E running in CI",
      "project": "dr_viewer",
      "status": "active",
      "mode": "delivery",
      "leadsTo": "2:01a2126b-8dbd-7216-8467-b73e7fcb191a",
      "dependsOn": [],
      "openedBy": [],
      "tasks": {
        "open": 1,
        "done": 2,
        "inProgress": 0
      },
      "openTasks": [],
      "next": "Move e2e-server.sh to dr serve's test mode"
    },
    {
      "ref": "2:01a2126c-3cf5-7605-a3bf-942a5b8c7f53",
      "name": "Switch C4 to the spec mapping",
      "project": "dr_viewer",
      "status": "active",
      "mode": "delivery",
      "leadsTo": "2:01a2126b-9188-7166-993a-57a161430ba2",
      "dependsOn": [],
      "openedBy": [],
      "tasks": {
        "open": 1,
        "done": 0,
        "inProgress": 0
      },
      "openTasks": []
    },
    {
      "ref": "2:01a2126c-3f07-7693-9f20-ceed984e7585",
      "name": "Draw deployment and dynamic diagrams",
      "project": "dr_viewer",
      "status": "active",
      "mode": "delivery",
      "leadsTo": "2:01a2126b-9310-758e-9293-cacb71c2f8f0",
      "dependsOn": [],
      "openedBy": [],
      "tasks": {
        "open": 3,
        "done": 0,
        "inProgress": 0
      },
      "openTasks": [
        "Write element rules for the technology layer",
        "Draw the Dynamic diagram",
        "Draw the Deployment diagram"
      ],
      "next": "Write element rules for the technology layer"
    },
    {
      "ref": "2:01a2126c-4127-7204-a7d7-acf40cfb564d",
      "name": "Hand C4 layout to Heimdall",
      "project": "dr_viewer",
      "status": "active",
      "mode": "delivery",
      "leadsTo": "2:01a2126b-9524-77ce-92fc-ca068e33a814",
      "dependsOn": [],
      "openedBy": [],
      "tasks": {
        "open": 3,
        "done": 0,
        "inProgress": 0
      },
      "openTasks": [
        "Propose a nested C4 layout and C4 card to Heimdall",
        "Report the GraphToolbar and usePanZoom friction to Heimdall",
        "Replace ELK with Heimdall's nested layout"
      ],
      "next": "Propose a nested C4 layout and C4 card to Heimdall"
    },
    {
      "ref": "2:01a2126c-4314-718e-9dd8-17ff309d0724",
      "name": "Show the rest of drift",
      "project": "dr_viewer",
      "status": "active",
      "mode": "delivery",
      "leadsTo": "2:01a2126b-96e7-702b-a931-bb13438ab2a0",
      "dependsOn": [],
      "openedBy": [],
      "tasks": {
        "open": 3,
        "done": 0,
        "inProgress": 0
      },
      "openTasks": [
        "Show a rebaselined changeset in the Changesets view",
        "Page drift base changes past the first page",
        "Show the commit result's drift after Apply"
      ],
      "next": "Show a rebaselined changeset in the Changesets view"
    },
    {
      "ref": "2:01a2126c-461d-765a-b9ed-6a2f322fc377",
      "name": "Make every view linkable",
      "project": "dr_viewer",
      "status": "active",
      "mode": "delivery",
      "leadsTo": "2:01a2126b-98de-74d2-8790-e687d520a2e0",
      "dependsOn": [],
      "openedBy": [],
      "tasks": {
        "open": 2,
        "done": 0,
        "inProgress": 0
      },
      "openTasks": [
        "Accept an element's dotted id in ?node=",
        "Add a link form that opens an element's C4 box"
      ],
      "next": "Accept an element's dotted id in ?node="
    },
    {
      "ref": "2:01a2126c-3b6a-7276-8fc3-8f816bfb8eb0",
      "name": "Move the C4 mapping into the spec",
      "project": "documentation_robotics",
      "status": "active",
      "mode": "delivery",
      "leadsTo": "2:01a2126b-8f64-7118-bd9a-b2ab16732148",
      "dependsOn": [],
      "openedBy": [],
      "tasks": {
        "open": 7,
        "done": 0,
        "inProgress": 0
      },
      "openTasks": [
        "Write the spec mapping format and the C4 mapping (#1398)",
        "Build the deterministic mapping engine (#1399)",
        "Maintain mappings through Context Studio (#1400)",
        "Fix the C4 context view through mapping changes (#1402)",
        "Show a business actor as a connected Person in C4 (#1385)",
        "Let a CLI, batch job or library be a C4 container (#1386)",
        "Show third-party system software on the C4 context view (#1387)"
      ],
      "next": "Write the spec mapping format and the C4 mapping (#1398)"
    },
    {
      "ref": "2:01a21271-a034-7312-b03a-1419ece2de15",
      "name": "Compact changeset reads",
      "project": "documentation_robotics",
      "status": "active",
      "aliases": [
        "CLI 0.9.0 tranche 1"
      ],
      "mode": "delivery",
      "leadsTo": "2:01a21270-ca64-7760-b50b-ba12c6e315f2",
      "dependsOn": [],
      "openedBy": [],
      "tasks": {
        "open": 12,
        "done": 0,
        "inProgress": 12
      },
      "openTasks": [
        "Let changeset_list show only staged changesets (#1250)",
        "Make changeset_show compact for large changesets (#1257)",
        "Include incoming staged links in changeset_brief with ids (#1258)",
        "Accept summary as a changeset_brief section (#1281)",
        "Let model_search leave out a layer or type (#1283)",
        "Shrink changeset_impact output (#1284)",
        "Page changeset_show and changeset_brief by layer and type (#1294)",
        "Give changeset_unstage and model_trace compact output (#1299)"
      ],
      "next": "Let changeset_list show only staged changesets (#1250)"
    },
    {
      "ref": "2:01a21271-a20f-741a-bba5-6a9633f301aa",
      "name": "Clear write results",
      "project": "documentation_robotics",
      "status": "active",
      "aliases": [
        "CLI 0.9.0 tranche 2"
      ],
      "mode": "delivery",
      "leadsTo": "2:01a21270-ca64-7760-b50b-ba12c6e315f2",
      "dependsOn": [],
      "openedBy": [],
      "tasks": {
        "open": 11,
        "done": 0,
        "inProgress": 11
      },
      "openTasks": [
        "Keep large model_add batches within the tool output (#1295)",
        "Report re-sent elements and links the same way in model_add (#1296)",
        "Group model_add's shortened-id notices by cause (#1302)",
        "Name the allowed predicates when a relationship is refused (#1354)",
        "Add a batch form of relationship_delete (#1372)",
        "Fix hand-set source references in model_update (#1260)",
        "Insert a product workflow step without renumbering (#1396)",
        "Report the id note once in model_add attention (#1415)"
      ],
      "next": "Keep large model_add batches within the tool output (#1295)"
    },
    {
      "ref": "2:01a21271-a3e1-72e0-bf26-3b8f835fc405",
      "name": "Status, validate and the changeset CLI",
      "project": "documentation_robotics",
      "status": "active",
      "aliases": [
        "CLI 0.9.0 tranche 3"
      ],
      "mode": "delivery",
      "leadsTo": "2:01a21270-ca64-7760-b50b-ba12c6e315f2",
      "dependsOn": [],
      "openedBy": [],
      "tasks": {
        "open": 12,
        "done": 0,
        "inProgress": 12
      },
      "openTasks": [
        "Write changeset descriptions as markdown everywhere (#1210)",
        "Validate a model against the spec it declares (#1411)",
        "Add dr changeset show <name> (#1219)",
        "Trim project_status's changed-files list (#1251)",
        "Upgrade per-project .claude integrations over MCP (#1252)",
        "Stop model_validate with layers calling cross-layer links not found (#1259)",
        "Announce the .dr/ active-changeset marker move (#1273)",
        "Accept a dotted type id in spec_type (#1280)"
      ],
      "next": "Write changeset descriptions as markdown everywhere (#1210)"
    },
    {
      "ref": "2:01a21271-a593-76be-8da0-7b88b6caa995",
      "name": "Dependable server and viewer processes",
      "project": "documentation_robotics",
      "status": "active",
      "aliases": [
        "CLI 0.9.0 tranche 4"
      ],
      "mode": "delivery",
      "leadsTo": "2:01a21270-ca64-7760-b50b-ba12c6e315f2",
      "dependsOn": [],
      "openedBy": [],
      "tasks": {
        "open": 8,
        "done": 0,
        "inProgress": 8
      },
      "openTasks": [
        "Make review_open report a viewer that is serving (#1282)",
        "Serve the rebuilt bundle from dr visualize --viewer-path (#1308)",
        "Stop the dr MCP server reconnecting within a session (#1362)",
        "Keep dr serve's start-up sweep from stopping review_open viewers (#1369)",
        "Give a consumer's E2E suite a supported way to start a DR server (#1376)",
        "Run the new code in the MCP server after a CLI upgrade (#1427)",
        "Stop the central viewer parsing every changeset per call (#1436)",
        "Keep test projects out of the user farm (#1438)"
      ],
      "next": "Make review_open report a viewer that is serving (#1282)"
    },
    {
      "ref": "2:01a21271-a72f-70c8-86a5-793d187c1dc0",
      "name": "Extract output and decide",
      "project": "documentation_robotics",
      "status": "active",
      "aliases": [
        "CLI 0.9.0 tranche 5"
      ],
      "mode": "delivery",
      "leadsTo": "2:01a21270-ca64-7760-b50b-ba12c6e315f2",
      "dependsOn": [],
      "openedBy": [],
      "tasks": {
        "open": 13,
        "done": 0,
        "inProgress": 13
      },
      "openTasks": [
        "Honour kept none rules in codebase_verify (#1414)",
        "Keep a folder rule from overriding staged test cases (#1424)",
        "Keep a files reject from rejecting the modelled symbol (#1254)",
        "Make the extract view compact and honour groupBy file (#1298)",
        "Keep .cbmignore out of the working tree (#1300)",
        "Make a reject with preview say it recorded nothing (#1322)",
        "Promote recorded reject decisions to kept rules (#1332)",
        "Match decide rules on Class.method names (#1333)"
      ],
      "next": "Honour kept none rules in codebase_verify (#1414)"
    },
    {
      "ref": "2:01a21271-a8d6-723a-aa91-2ac09aebefc1",
      "name": "Changeset purpose and lifecycle",
      "project": "documentation_robotics",
      "status": "active",
      "aliases": [
        "CLI 0.10.0 tranche 1"
      ],
      "mode": "delivery",
      "leadsTo": "2:01a21270-cc61-713b-8f11-c7165b9d4c10",
      "dependsOn": [],
      "openedBy": [],
      "tasks": {
        "open": 3,
        "done": 0,
        "inProgress": 0
      },
      "openTasks": [
        "Finish the changeset purpose and lifecycle taxonomy (#1171)",
        "Make extract with since and no plan make a verification record (#1370)",
        "Stage annotations into the active changeset (#1447)"
      ],
      "next": "Finish the changeset purpose and lifecycle taxonomy (#1171)"
    },
    {
      "ref": "2:01a21271-aaf7-723c-b31f-a28f9b42b51a",
      "name": "Verify matching and verdicts",
      "project": "documentation_robotics",
      "status": "active",
      "aliases": [
        "CLI 0.10.0 tranche 2"
      ],
      "mode": "delivery",
      "leadsTo": "2:01a21270-cc61-713b-8f11-c7165b9d4c10",
      "dependsOn": [],
      "openedBy": [],
      "tasks": {
        "open": 17,
        "done": 0,
        "inProgress": 0
      },
      "openTasks": [
        "Stop codebase_verify reporting hand-wired tests links as drift (#1413)",
        "Stop verify keeping an adopted object schema missing (#1429)",
        "Say why verify calls an element with no source reference missing (#1253)",
        "Check a plan applied before its build in verify and adopt (#1307)",
        "Match by symbol as well as file in verify (#1318)",
        "Take the built value for a divergence verify found (#1325)",
        "Filter verify's verdict and counts by ids (#1346)",
        "Pair planned and built elements with different names (#1348)"
      ],
      "next": "Stop codebase_verify reporting hand-wired tests links as drift (#1413)"
    },
    {
      "ref": "2:01a21271-acf0-7291-8088-3a09d4cfc327",
      "name": "Extract with since",
      "project": "documentation_robotics",
      "status": "active",
      "aliases": [
        "CLI 0.10.0 tranche 3"
      ],
      "mode": "delivery",
      "leadsTo": "2:01a21270-cc61-713b-8f11-c7165b9d4c10",
      "dependsOn": [],
      "openedBy": [],
      "tasks": {
        "open": 12,
        "done": 0,
        "inProgress": 0
      },
      "openTasks": [
        "Stop extract duplicating planned test sketches (#1255)",
        "Make planCoverage use source file and symbol (#1323)",
        "Fix adopt_source_references' report and provenance (#1324)",
        "Record a bootstrap from uncommitted code against the working tree (#1330)",
        "Let a reconcile with since and intent clear drift (#1331)",
        "Stop extract inventing operationId and summary for createRoute routes (#1349)",
        "Compare extraction with every staged plan, not only the active one (#1352)",
        "Stage only the changed tests in a touched file (#1364)"
      ],
      "next": "Stop extract duplicating planned test sketches (#1255)"
    },
    {
      "ref": "2:01a21271-af03-7640-bb7e-cf44a885d30b",
      "name": "Tier 0 recognition",
      "project": "documentation_robotics",
      "status": "active",
      "aliases": [
        "CLI 0.10.0 tranche 4"
      ],
      "mode": "delivery",
      "leadsTo": "2:01a21270-cc61-713b-8f11-c7165b9d4c10",
      "dependsOn": [],
      "openedBy": [],
      "tasks": {
        "open": 8,
        "done": 0,
        "inProgress": 0
      },
      "openTasks": [
        "Index shell scripts (#1319)",
        "Decide plain CommonJS and Electron code in Tier 0 (#1320)",
        "Link test files to the right subject (#1412)",
        "Recognise hand-routed http.createServer routes (#1321)",
        "Stop accesses links from name collisions (#1326)",
        "Decide new TypeScript application code in extract with since (#1344)",
        "Card exported React hooks and components (#1381)",
        "Link test cases whose calls reach only rejected symbols (#1443)"
      ],
      "next": "Index shell scripts (#1319)"
    },
    {
      "ref": "2:01a21271-b0e6-7596-932e-71fe1b20294b",
      "name": "Several changesets at once",
      "project": "documentation_robotics",
      "status": "active",
      "aliases": [
        "CLI 0.10.0 tranche 5"
      ],
      "mode": "delivery",
      "leadsTo": "2:01a21270-cc61-713b-8f11-c7165b9d4c10",
      "dependsOn": [],
      "openedBy": [],
      "tasks": {
        "open": 10,
        "done": 0,
        "inProgress": 0
      },
      "openTasks": [
        "Show how staged changesets overlap before landing (#1209)",
        "Name the primary checkout by its branch (#1422)",
        "Reference an element staged in another changeset (#1292)",
        "Name the files to commit after a landing (#1367)",
        "Warn when the same plan is staged in another checkout (#1368)",
        "Land a plan in parts (#1388)",
        "Scope a plan to one milestone (#1389)",
        "Raise an accepted gap the plan contradicts as a gap (#1391)"
      ],
      "next": "Show how staged changesets overlap before landing (#1209)"
    },
    {
      "ref": "2:01a21271-b387-7726-9dd6-65b7dc69fdd9",
      "name": "Propose and land the spec gaps",
      "project": "documentation_robotics",
      "status": "active",
      "aliases": [
        "CLI 0.11.0 tranche 1"
      ],
      "mode": "delivery",
      "leadsTo": "2:01a21270-ce64-720a-b0bf-4213a1e127c1",
      "dependsOn": [],
      "openedBy": [],
      "tasks": {
        "open": 8,
        "done": 1,
        "inProgress": 0
      },
      "openTasks": [
        "Let cs-decisions-to-spec land a second export on the same file (#1147)",
        "Let systemsoftware describe a library or CLI tool (#1179)",
        "Propose the spec gaps found modelling user-level DR (#1289)",
        "Make coveragegap affectedRequirements a list (#1327)",
        "Align layer descriptions with the catalog (#1328)",
        "Stop unordered proposed milestones failing strict validation (#1434)",
        "Propose a flagged disposition for accepted gaps",
        "Document the export's attribute fields in cs-decisions-to-spec (#1446)"
      ],
      "next": "Let cs-decisions-to-spec land a second export on the same file (#1147)"
    },
    {
      "ref": "2:01a21271-b56d-751e-88f9-4b85b64751bf",
      "name": "Follow through on the heimdall pilot",
      "project": "documentation_robotics",
      "status": "active",
      "aliases": [
        "CLI 0.11.0 tranche 2",
        "heimdall pilot follow-through"
      ],
      "mode": "delivery",
      "leadsTo": "2:01a21270-ce64-720a-b0bf-4213a1e127c1",
      "dependsOn": [],
      "openedBy": [],
      "tasks": {
        "open": 4,
        "done": 0,
        "inProgress": 1
      },
      "openTasks": [
        "Land the ApplicationInterface protocol reshape (Context Studio 43f52ae5)",
        "Fix CBM Route and HTTP_CALLS false positives (#1303)",
        "Release review question bank 0.2 (#1304)",
        "Land the heimdall pilot rulings S1 and S10 (#1305)"
      ],
      "next": "Land the ApplicationInterface protocol reshape (Context Studio 43f52ae5)"
    },
    {
      "ref": "2:01a21271-b7bf-7169-9ce7-1debbde96ca4",
      "name": "Cluster test cases",
      "project": "documentation_robotics",
      "status": "active",
      "aliases": [
        "CLI 0.11.0 tranche 3",
        "test clustering"
      ],
      "mode": "delivery",
      "leadsTo": "2:01a21270-ce64-720a-b0bf-4213a1e127c1",
      "dependsOn": [],
      "openedBy": [
        "2:01a21272-1a97-765e-a618-472b9f4de140"
      ],
      "tasks": {
        "open": 2,
        "done": 0,
        "inProgress": 0
      },
      "openTasks": [
        "Cluster test cases after extraction (#1312)",
        "Propose tests links from existing sketches to elements added later (#1448)"
      ],
      "next": "Cluster test cases after extraction (#1312)"
    },
    {
      "ref": "2:01a21271-b993-7667-9f6e-0c110d401b56",
      "name": "Close the 0.11 leftovers",
      "project": "documentation_robotics",
      "status": "active",
      "aliases": [
        "CLI 0.11.0 tranche 5"
      ],
      "mode": "delivery",
      "leadsTo": "2:01a21270-ce64-720a-b0bf-4213a1e127c1",
      "dependsOn": [],
      "openedBy": [],
      "tasks": {
        "open": 4,
        "done": 0,
        "inProgress": 0
      },
      "openTasks": [
        "Give /dr-plan something to plan against for content-only changes (#1196)",
        "Capture file-based caches and their keys in extraction (#1205)",
        "Close the model_show worked-well note (#1206)",
        "Bring the code index into the dr workflow as decided (#1343)"
      ],
      "next": "Give /dr-plan something to plan against for content-only changes (#1196)"
    },
    {
      "ref": "2:01a21271-bb70-754a-97d7-5dac865a7bcb",
      "name": "Build spec mappings",
      "project": "documentation_robotics",
      "status": "dropped",
      "aliases": [
        "spec mappings tranches 1-4"
      ],
      "mode": "delivery",
      "leadsTo": "2:01a21270-d214-7110-b580-276610f74090",
      "dependsOn": [],
      "openedBy": [],
      "tasks": {
        "open": 0,
        "done": 0,
        "inProgress": 0
      },
      "openTasks": []
    },
    {
      "ref": "2:01a21271-bd3a-772b-bdd4-e0f35214bc25",
      "name": "Fix the C4 views through mappings",
      "project": "documentation_robotics",
      "status": "dropped",
      "aliases": [
        "spec mappings tranche 5"
      ],
      "mode": "delivery",
      "leadsTo": "2:01a21270-d214-7110-b580-276610f74090",
      "dependsOn": [],
      "openedBy": [],
      "tasks": {
        "open": 0,
        "done": 0,
        "inProgress": 0
      },
      "openTasks": []
    },
    {
      "ref": "2:01a21273-030c-766a-ae80-f96dae1a7bec",
      "name": "Finish the cascade",
      "project": "documentation_robotics",
      "status": "active",
      "subProject": "DR Extraction Cascade",
      "aliases": [
        "B2",
        "B3",
        "Tier 2"
      ],
      "mode": "delivery",
      "leadsTo": "2:01a21272-80ff-7455-8bf1-cd5da8365cee",
      "dependsOn": [],
      "openedBy": [],
      "tasks": {
        "open": 4,
        "done": 0,
        "inProgress": 0
      },
      "openTasks": [
        "Make evidence_fields name only properties CBM sets (B2)",
        "Map the remaining CBM edges (B3)",
        "Build Tier 2 escalation and switch /dr-map to the cascade",
        "Build cache and drift comparison for dr farm sync and dr verify"
      ],
      "next": "Make evidence_fields name only properties CBM sets (B2)"
    },
    {
      "ref": "2:01a21273-0547-77b3-972d-9dfd55ba9a1c",
      "name": "Measure the settled catalog",
      "project": "documentation_robotics",
      "status": "active",
      "subProject": "DR Extraction Cascade",
      "mode": "delivery",
      "leadsTo": "2:01a21272-7e59-77a8-99ef-f021154697f5",
      "dependsOn": [],
      "openedBy": [],
      "tasks": {
        "open": 1,
        "done": 0,
        "inProgress": 0
      },
      "openTasks": [],
      "next": "Re-run classify-eval on the settled catalog"
    },
    {
      "ref": "2:01a21273-0713-768f-a96a-ce1f1371a93e",
      "name": "Prove the accept band",
      "project": "documentation_robotics",
      "status": "active",
      "subProject": "DR Extraction Cascade",
      "mode": "delivery",
      "leadsTo": "2:01a21272-846e-714d-907d-429cddd8019b",
      "dependsOn": [],
      "openedBy": [],
      "tasks": {
        "open": 4,
        "done": 0,
        "inProgress": 0
      },
      "openTasks": [
        "Offer application.message in the Tier 1 question set (#1148)",
        "Fix the Tier 1 precision targets",
        "Label a fresh held-out corpus with C# or Java service contracts",
        "Run the OpenRouter Clef and Jev measurements"
      ],
      "next": "Offer application.message in the Tier 1 question set (#1148)"
    },
    {
      "ref": "2:01a21273-66ec-73b9-aa3f-25058b71535b",
      "name": "Ready the fleet run",
      "project": "documentation_robotics",
      "status": "active",
      "subProject": "DR Self-Assessment",
      "aliases": [
        "track A",
        "track E"
      ],
      "mode": "delivery",
      "leadsTo": "2:01a21273-0d10-74eb-a1d7-97a35787766c",
      "dependsOn": [],
      "openedBy": [],
      "tasks": {
        "open": 4,
        "done": 3,
        "inProgress": 0
      },
      "openTasks": [
        "Triage the top 20 unmatched code-edge groups with the maintainer",
        "Turn the bank's witnesses into assess-eval finders",
        "Move the frontier, residual and same-symbol finders behind a flag",
        "Run the hardening protocol on the six fleet models"
      ],
      "next": "Triage the top 20 unmatched code-edge groups with the maintainer"
    },
    {
      "ref": "2:01a21313-0df4-71d2-9a35-30956b08b43d",
      "name": "Evaluate the questions",
      "project": "documentation_robotics",
      "status": "active",
      "subProject": "DR Self-Assessment",
      "aliases": [
        "per-question verdicts",
        "stage 2"
      ],
      "mode": "delivery",
      "leadsTo": "2:01a21273-5306-7588-9c3e-78b30e35b337",
      "dependsOn": [],
      "openedBy": [],
      "tasks": {
        "open": 4,
        "done": 0,
        "inProgress": 0
      },
      "openTasks": [
        "Build a headless step A runner",
        "Score the fleet per question and give each a keep, drop or demote verdict",
        "Measure whether step A repeats across runs and agents",
        "Revise the review bank from the fleet's verdicts"
      ],
      "next": "Build a headless step A runner"
    },
    {
      "ref": "2:01a21305-d898-769d-a93a-fce74be2e6ff",
      "name": "Close the DR model gaps",
      "project": "heimdall",
      "status": "active",
      "mode": "delivery",
      "leadsTo": "2:01a21304-8568-7764-8fd8-9e59109b856b",
      "dependsOn": [],
      "openedBy": [],
      "tasks": {
        "open": 4,
        "done": 1,
        "inProgress": 0
      },
      "openTasks": [
        "Decide whether GraphInspector and GraphEdgeInspector compose Chip/Badge",
        "Add a test for GraphCanvas onBackgroundClick",
        "Add a test for GraphCanvas onToggleCollapse",
        "Route the two coverage gaps through coverage targets for their functions"
      ],
      "next": "Decide whether GraphInspector and GraphEdgeInspector compose Chip/Badge"
    },
    {
      "ref": "2:01a21305-da77-7344-8f0c-72fd0ba08077",
      "name": "Build the orthogonal grid and bus trunks",
      "project": "heimdall",
      "status": "active",
      "mode": "delivery",
      "leadsTo": "2:01a21304-8f30-7312-bd21-697fdcb9acb7",
      "dependsOn": [
        "2:01a21304-88f3-73ba-8f3d-73ea457bbd31"
      ],
      "openedBy": [],
      "tasks": {
        "open": 3,
        "done": 0,
        "inProgress": 0
      },
      "openTasks": [
        "Add declared bus groups to the orthogonal engine",
        "Decide and build the edge-label rule on bus trunks (#398)",
        "Size orthogonal rows and columns to their own busiest channel"
      ]
    },
    {
      "ref": "2:01a21305-dc81-7566-8fb9-4ab16690e55c",
      "name": "Resume the orthogonal placement run",
      "project": "heimdall",
      "status": "active",
      "subProject": "Heimdall Layout Loop",
      "aliases": [
        "orthogonal-2026-11-06-placement"
      ],
      "mode": "delivery",
      "leadsTo": "2:01a21304-88f3-73ba-8f3d-73ea457bbd31",
      "dependsOn": [],
      "openedBy": [],
      "tasks": {
        "open": 2,
        "done": 0,
        "inProgress": 0
      },
      "openTasks": [
        "Restore and rebase the placement run onto current main",
        "Finish the placement run from the prototype 2 re-review and ship it"
      ],
      "next": "Restore and rebase the placement run onto current main"
    },
    {
      "ref": "2:01a21305-df57-7520-bd6a-59ce72218d60",
      "name": "Organic outlier run",
      "project": "heimdall",
      "status": "active",
      "subProject": "Heimdall Layout Loop",
      "mode": "delivery",
      "leadsTo": "2:01a21304-8bce-722f-9a27-f8ca45d66ef0",
      "dependsOn": [],
      "openedBy": [],
      "tasks": {
        "open": 1,
        "done": 0,
        "inProgress": 0
      },
      "openTasks": [],
      "next": "Run /layout-loop on organic outlier placement (#25)"
    },
    {
      "ref": "2:01a21305-e221-70eb-acc0-48d3152e5a7c",
      "name": "Make the loop a release check",
      "project": "heimdall",
      "status": "active",
      "subProject": "Heimdall Layout Loop",
      "mode": "delivery",
      "leadsTo": "2:01a21304-a422-732a-8d3c-51e99333a9d0",
      "dependsOn": [],
      "openedBy": [],
      "tasks": {
        "open": 4,
        "done": 0,
        "inProgress": 0
      },
      "openTasks": [
        "Point the harness at heimdall main and re-baseline the survey",
        "Extend the demo guard to the layered views",
        "Stop timing checks reverting unchanged code on a busy machine (#26)",
        "Run survey and Stage 3 against each heimdall release"
      ],
      "next": "Point the harness at heimdall main and re-baseline the survey"
    },
    {
      "ref": "2:01a2130a-a140-776d-bfff-c583096aedb2",
      "name": "Release 0.5.3",
      "project": "reference_api_buddy",
      "status": "active",
      "mode": "delivery",
      "leadsTo": "2:01a2130a-635d-71ad-bd81-19274efd5e9e",
      "dependsOn": [],
      "openedBy": [],
      "tasks": {
        "open": 2,
        "done": 1,
        "inProgress": 0
      },
      "openTasks": [
        "Bump to 0.5.3 and date the changelog",
        "Tag v0.5.3 and publish to PyPI"
      ],
      "next": "Bump to 0.5.3 and date the changelog"
    },
    {
      "ref": "2:01a2130a-a343-7722-9711-773e8ed39f61",
      "name": "Close the coverage gaps",
      "project": "reference_api_buddy",
      "status": "active",
      "mode": "delivery",
      "leadsTo": "2:01a2130a-65e2-76e0-953f-6d94a4ae207b",
      "dependsOn": [
        "2:01a2130a-9f63-75dd-a146-830a605a105e"
      ],
      "openedBy": [],
      "tasks": {
        "open": 3,
        "done": 0,
        "inProgress": 0
      },
      "openTasks": [
        "Cover the request handler's error and malformed-request paths",
        "Cover the database manager's failure and transaction paths",
        "Cover the monitoring manager's error handling"
      ]
    },
    {
      "ref": "2:01a2130c-ddb7-75c6-96da-5ba42077fa5c",
      "name": "Finish organizing projects",
      "project": "house_mcp",
      "status": "active",
      "subProject": "House Graph",
      "aliases": [
        "organizing plan steps 6-8"
      ],
      "mode": "delivery",
      "leadsTo": "2:01a2130b-65ac-70ca-bcb9-87de8f63c671",
      "dependsOn": [],
      "openedBy": [],
      "tasks": {
        "open": 3,
        "done": 2,
        "inProgress": 1
      },
      "openTasks": [
        "Make web link roles generic (source, discussion)",
        "Bring the laundry cabinets and workshop structure into House",
        "Decide where Knowledge Graph Stream lives"
      ],
      "next": "Make web link roles generic (source, discussion)"
    },
    {
      "ref": "2:01a2130c-e005-74d2-b445-5fff4aa81347",
      "name": "Try the share shortcut on an iPhone",
      "project": "house_mcp",
      "status": "set_aside",
      "subProject": "House Library",
      "aliases": [
        "L3 spike",
        "L3 step 0"
      ],
      "mode": "exploration",
      "leadsTo": "2:01a2130b-f6b8-7169-9140-c36583f60901",
      "dependsOn": [],
      "openedBy": [],
      "tasks": {
        "open": 1,
        "done": 0,
        "inProgress": 0
      },
      "openTasks": [],
      "question": "Which request body and headers does an iOS Shortcut deliver intact from the share sheet, and does the setup flow (iCloud link, import question) work?"
    },
    {
      "ref": "2:01a2130c-e1d8-7786-97e2-6e7be6d23c66",
      "name": "Build sharing from the phone",
      "project": "house_mcp",
      "status": "set_aside",
      "subProject": "House Library",
      "aliases": [
        "L3 build"
      ],
      "mode": "delivery",
      "leadsTo": "2:01a2130b-67d5-7423-98f8-765bdd997003",
      "dependsOn": [
        "2:01a2130b-f6b8-7169-9140-c36583f60901"
      ],
      "openedBy": [
        "2:01a2130b-f6b8-7169-9140-c36583f60901"
      ],
      "tasks": {
        "open": 5,
        "done": 0,
        "inProgress": 0
      },
      "openTasks": [
        "Add share intake and file_document to the library",
        "Add share keys to the directory",
        "Add /share, the setup page and file_document to the application",
        "Build the Add to House shortcut and set SHARE_SHORTCUT_URL",
        "Deploy sharing from the phone and run the live checks on an iPhone"
      ]
    },
    {
      "ref": "2:01a2130c-e3b5-718c-b43d-febe82a548f4",
      "name": "Prove the runner stack",
      "project": "house_mcp",
      "status": "done",
      "aliases": [
        "local stores spike",
        "store check spike"
      ],
      "mode": "exploration",
      "leadsTo": "2:01a2130b-f2a6-70ff-923a-42574442889f",
      "dependsOn": [],
      "openedBy": [],
      "tasks": {
        "open": 0,
        "done": 1,
        "inProgress": 0
      },
      "openTasks": [],
      "question": "Can a machine at home check price and shelf count at Home Depot and Lowe's without being refused?"
    },
    {
      "ref": "2:01a2130c-e5bb-7370-87aa-a46777c10b99",
      "name": "Build the runner",
      "project": "house_mcp",
      "status": "set_aside",
      "aliases": [
        "local stores steps 1-6",
        "runner build"
      ],
      "mode": "delivery",
      "leadsTo": "2:01a2130b-6b92-70b2-954b-31f6241f6b1f",
      "dependsOn": [
        "2:01a2130b-f4bf-742e-b722-81168773215f"
      ],
      "openedBy": [
        "2:01a2130b-f4bf-742e-b722-81168773215f"
      ],
      "tasks": {
        "open": 8,
        "done": 0,
        "inProgress": 0
      },
      "openTasks": [
        "Check Lowe's through the extension runner once the block clears",
        "Review the Businesses: preferred store and site guide proposal in Context Studio",
        "Build the runners service with the pull transport",
        "Add runners to the application",
        "Build the runner Chrome extension (apps/runner)",
        "Add the push transport and run the runner on the Mac mini",
        "Add site guides and the guide keeper",
        "Write the house-runner-setup skill"
      ]
    },
    {
      "ref": "2:01a2135d-1e8d-77b6-a496-b87926448ed7",
      "name": "Build House 0.3.0",
      "project": "house_mcp",
      "status": "active",
      "mode": "delivery",
      "leadsTo": "2:01a2135d-0e65-774b-8050-5ba5700e323f",
      "dependsOn": [],
      "openedBy": [],
      "tasks": {
        "open": 1,
        "done": 10,
        "inProgress": 1
      },
      "openTasks": [],
      "next": "Update house-projects skills for House 0.3.0"
    },
    {
      "ref": "2:01a21242-daf8-774c-aed6-4bee5fc95194",
      "name": "Catch up the existing models",
      "project": "claude_plugins",
      "status": "active",
      "mode": "delivery",
      "leadsTo": "2:01a21242-2734-75d8-b352-cf0bef773528",
      "dependsOn": [],
      "openedBy": [],
      "tasks": {
        "open": 3,
        "done": 1,
        "inProgress": 0
      },
      "openTasks": [
        "Upgrade the canonical models to spec 0.15.0",
        "Create the dr-farm repo and register the repos with models",
        "Make DR's own model the most complete of the active repos"
      ],
      "next": "Upgrade the canonical models to spec 0.15.0"
    },
    {
      "ref": "2:01a21242-dcad-72cc-840d-7333f0fc8f34",
      "name": "Build the practice mechanics in dr",
      "project": "claude_plugins",
      "status": "active",
      "mode": "delivery",
      "leadsTo": "2:01a21242-2915-71b2-afe2-9e7acf1e37c3",
      "dependsOn": [],
      "openedBy": [],
      "tasks": {
        "open": 5,
        "done": 0,
        "inProgress": 0
      },
      "openTasks": [
        "Add dr status --json",
        "Add the opt-in plan-mode bridge to the dr plugin",
        "Clean up the stale dr plugin pieces",
        "Add project status to dr farm status --format json",
        "Add the opt-in session-start status hook to the dr plugin"
      ],
      "next": "Add dr status --json"
    },
    {
      "ref": "2:01a21242-dfe1-7722-8f18-a79e3311f3bb",
      "name": "Build dr-practice 0.1",
      "project": "claude_plugins",
      "status": "dropped",
      "mode": "delivery",
      "leadsTo": "2:01a21242-2915-71b2-afe2-9e7acf1e37c3",
      "dependsOn": [],
      "openedBy": [],
      "tasks": {
        "open": 0,
        "done": 0,
        "inProgress": 0
      },
      "openTasks": []
    },
    {
      "ref": "2:01a21242-e179-764d-9a7f-5e25bc49e8bd",
      "name": "Measure the first bootstraps",
      "project": "claude_plugins",
      "status": "active",
      "mode": "delivery",
      "leadsTo": "2:01a21242-d645-7447-b3ad-1542a40f08bc",
      "dependsOn": [],
      "openedBy": [],
      "tasks": {
        "open": 2,
        "done": 0,
        "inProgress": 0
      },
      "openTasks": [
        "Set up the rollout tracker in dr-farm",
        "Record what the bootstraps so far cost"
      ]
    },
    {
      "ref": "2:01a21242-e35d-7727-9f3d-3f63e13840dc",
      "name": "Adopt the remaining active repos",
      "project": "claude_plugins",
      "status": "set_aside",
      "mode": "delivery",
      "leadsTo": "2:01a21242-2aac-7626-937c-bd4276b15b26",
      "dependsOn": [
        "2:01a21242-d645-7447-b3ad-1542a40f08bc"
      ],
      "openedBy": [
        "2:01a21242-d645-7447-b3ad-1542a40f08bc"
      ],
      "tasks": {
        "open": 4,
        "done": 0,
        "inProgress": 0
      },
      "openTasks": [
        "Write the dr-adopt skill",
        "Check carmona-corp and 3d-model-anything against the scope rule",
        "Adopt barcut into DR",
        "Adopt phone-home and homelab into DR together"
      ]
    },
    {
      "ref": "2:01a21242-e524-72e9-9abe-acbc9176bb28",
      "name": "Close the practice loop",
      "project": "claude_plugins",
      "status": "active",
      "mode": "delivery",
      "leadsTo": "2:01a21242-2d1a-71d6-9671-d1ca37667fe0",
      "dependsOn": [],
      "openedBy": [],
      "tasks": {
        "open": 5,
        "done": 0,
        "inProgress": 0
      },
      "openTasks": [
        "Write the dr-ship skill",
        "Plan the first design across the DR CLI and the viewer",
        "Add a PR check for a changeset or a stated reason",
        "Switch the plan-mode bridge to block",
        "Update the rules for dr-ship and dogfood"
      ],
      "next": "Write the dr-ship skill"
    },
    {
      "ref": "2:01a21242-e6d8-779f-a105-e67231d9298c",
      "name": "Prove house-projects on live House",
      "project": "claude_plugins",
      "status": "active",
      "mode": "delivery",
      "leadsTo": "2:01a21242-3365-7125-9b19-bf6efe8f5b62",
      "dependsOn": [],
      "openedBy": [],
      "tasks": {
        "open": 2,
        "done": 2,
        "inProgress": 1
      },
      "openTasks": [
        "Run the reporting skills on real projects",
        "Run github-mirror and dr-milestones on a real project"
      ],
      "next": "Run the reporting skills on real projects"
    },
    {
      "ref": "2:01a21264-fd38-74ef-af14-1e6fd664b48b",
      "name": "Bring the projects into House",
      "project": "claude_plugins",
      "status": "active",
      "mode": "delivery",
      "leadsTo": "2:01a21264-4e79-749f-962c-6924b4b44671",
      "dependsOn": [],
      "openedBy": [],
      "tasks": {
        "open": 2,
        "done": 2,
        "inProgress": 0
      },
      "openTasks": [
        "Create House projects for the active repos that have none",
        "Import the other docs that still carry status"
      ],
      "next": "Create House projects for the active repos that have none"
    },
    {
      "ref": "2:01a21265-004c-77df-b935-a29c5b416aad",
      "name": "Fix House for imports",
      "project": "claude_plugins",
      "status": "active",
      "mode": "delivery",
      "leadsTo": "2:01a21264-4e79-749f-962c-6924b4b44671",
      "dependsOn": [],
      "openedBy": [],
      "tasks": {
        "open": 1,
        "done": 4,
        "inProgress": 0
      },
      "openTasks": [],
      "next": "Design work across groups (house#107)"
    },
    {
      "ref": "2:01a21265-036c-7032-b5e9-22af8224e43a",
      "name": "Build the House hooks",
      "project": "claude_plugins",
      "status": "set_aside",
      "mode": "delivery",
      "leadsTo": "2:01a2132c-356e-76fd-b90e-7f8a87fff251",
      "dependsOn": [
        "2:01a21264-553a-71a3-8335-339ee65c1cce"
      ],
      "openedBy": [
        "2:01a21264-553a-71a3-8335-339ee65c1cce"
      ],
      "tasks": {
        "open": 2,
        "done": 0,
        "inProgress": 0
      },
      "openTasks": [
        "Add the House line to practice's session-start hook",
        "Add the House part of practice's plan-mode reminder"
      ]
    },
    {
      "ref": "2:01a21265-05a0-7524-8141-6049deb6e8b1",
      "name": "Build the repository lookup",
      "project": "claude_plugins",
      "status": "active",
      "mode": "delivery",
      "leadsTo": "2:01a21264-504f-733e-9595-515264b3d3e5",
      "dependsOn": [],
      "openedBy": [],
      "tasks": {
        "open": 1,
        "done": 0,
        "inProgress": 0
      },
      "openTasks": [],
      "next": "Let find_nodes find a project by its repository URL"
    },
    {
      "ref": "2:01a21265-076e-74a2-ab1a-70b06bff40a4",
      "name": "Close the House loop",
      "project": "claude_plugins",
      "status": "active",
      "mode": "delivery",
      "leadsTo": "2:01a21264-52a3-77aa-a728-16a3435e8b98",
      "dependsOn": [],
      "openedBy": [],
      "tasks": {
        "open": 3,
        "done": 0,
        "inProgress": 0
      },
      "openTasks": [
        "Add the ship step to session-debrief",
        "Have dr-ship complete the House task as it lands the plan",
        "Schedule the weekly review"
      ],
      "next": "Add the ship step to session-debrief"
    },
    {
      "ref": "2:01a2132c-ab2c-70ab-9f40-3e6dbf1b1d22",
      "name": "Test how the rules load",
      "project": "claude_plugins",
      "status": "active",
      "mode": "delivery",
      "leadsTo": "2:01a2132c-3a03-77c0-9a43-777b8fce18ab",
      "dependsOn": [],
      "openedBy": [],
      "tasks": {
        "open": 1,
        "done": 0,
        "inProgress": 0
      },
      "openTasks": []
    },
    {
      "ref": "2:01a2132c-ad98-72cb-bca9-9e2928bd769c",
      "name": "Move the rules into the practice plugin",
      "project": "claude_plugins",
      "status": "active",
      "mode": "delivery",
      "leadsTo": "2:01a2132c-2eff-70d7-9a15-79bb379163ed",
      "dependsOn": [],
      "openedBy": [],
      "tasks": {
        "open": 3,
        "done": 3,
        "inProgress": 2
      },
      "openTasks": [
        "Install practice on every computer",
        "Carry the rules to claude.ai chat, Cowork and Duet",
        "Cut CLAUDE.md down to machine-specific lines"
      ],
      "next": "Install practice on every computer"
    },
    {
      "ref": "2:01a2132c-afec-75dd-b61f-f823b338b9f1",
      "name": "Build the dogfood skill",
      "project": "claude_plugins",
      "status": "active",
      "mode": "delivery",
      "leadsTo": "2:01a2132c-31d8-70fc-a3d4-6bfc34217d23",
      "dependsOn": [],
      "openedBy": [],
      "tasks": {
        "open": 2,
        "done": 0,
        "inProgress": 0
      },
      "openTasks": [
        "Write the dogfood skill",
        "Name the dogfood skill in the rules"
      ],
      "next": "Write the dogfood skill"
    },
    {
      "ref": "2:01a2132c-b2a3-7135-8966-42c4c5e2b3a7",
      "name": "Collect how I work",
      "project": "claude_plugins",
      "status": "done",
      "mode": "delivery",
      "leadsTo": "2:01a2132c-3c9d-7288-867f-8b094e8309c6",
      "dependsOn": [],
      "openedBy": [],
      "tasks": {
        "open": 0,
        "done": 1,
        "inProgress": 0
      },
      "openTasks": []
    },
    {
      "ref": "2:01a2132c-b540-7553-a75f-e80773c842e0",
      "name": "Build the DR hooks into practice",
      "project": "claude_plugins",
      "status": "active",
      "mode": "delivery",
      "leadsTo": "2:01a2132c-356e-76fd-b90e-7f8a87fff251",
      "dependsOn": [],
      "openedBy": [],
      "tasks": {
        "open": 2,
        "done": 0,
        "inProgress": 0
      },
      "openTasks": [
        "Add the DR part of practice's plan-mode reminder",
        "Add the DR line to practice's session-start hook"
      ],
      "next": "Add the DR part of practice's plan-mode reminder"
    },
    {
      "ref": "2:01a2132c-b868-73e3-8464-b72d38674089",
      "name": "Build the portfolio skill",
      "project": "claude_plugins",
      "status": "active",
      "mode": "delivery",
      "leadsTo": "2:01a2132c-3740-749f-8d88-97d2b866ab1f",
      "dependsOn": [],
      "openedBy": [],
      "tasks": {
        "open": 3,
        "done": 0,
        "inProgress": 0
      },
      "openTasks": [
        "Write the scope rule and cross-project map into practice",
        "Write the portfolio skill's DR column",
        "Write the portfolio skill's House column"
      ],
      "next": "Write the scope rule and cross-project map into practice"
    },
    {
      "ref": "2:01a2135c-6458-75c7-a7f1-d61f6f9fcb84",
      "name": "Build the review skills",
      "project": "claude_plugins",
      "status": "active",
      "mode": "delivery",
      "leadsTo": "2:01a2135c-354b-774d-81d2-2e4ff105aa6c",
      "dependsOn": [],
      "openedBy": [],
      "tasks": {
        "open": 3,
        "done": 1,
        "inProgress": 0
      },
      "openTasks": [
        "Publish field guides to GitHub Pages from the field-guide skill",
        "Run /review-and-merge on a real PR",
        "Run docs-gardening on a public repo"
      ],
      "next": "Publish field guides to GitHub Pages from the field-guide skill"
    }
  ],
  "interfaces": [
    {
      "ref": "2:01a21246-5674-77c5-b1bb-14844ffc0a9b",
      "name": "Ontology workbench for DR and House",
      "status": "active",
      "providers": [
        "context_studio"
      ],
      "users": [
        "documentation_robotics",
        "house_mcp"
      ],
      "milestones": [
        "2:01a21246-61da-777c-8fee-cf51e5d1837e",
        "2:01a21246-afdd-76bc-8122-b4889091f3eb",
        "2:01a21247-7fcd-7797-8cc6-c1eeb0b18845",
        "2:01a21248-00d0-7188-92d6-195b02e30d9d"
      ]
    },
    {
      "ref": "2:01a2126a-d97d-7393-864e-d244e8b9152d",
      "name": "Viewer bundle in the dr CLI",
      "status": "active",
      "providers": [
        "dr_viewer"
      ],
      "users": [
        "documentation_robotics"
      ],
      "milestones": [
        "2:01a2126b-8943-71c6-abe7-420aa905782c"
      ]
    },
    {
      "ref": "2:01a2126a-db51-73fa-810a-834c51714f5f",
      "name": "DR data API for the viewer",
      "status": "active",
      "providers": [
        "documentation_robotics"
      ],
      "users": [
        "dr_viewer"
      ],
      "milestones": []
    },
    {
      "ref": "2:01a2126a-dd0e-719e-8da1-302978b32cf0",
      "name": "heimdall-ui for apps",
      "status": "active",
      "providers": [
        "heimdall"
      ],
      "users": [
        "claude_plugins",
        "context_studio",
        "dr_viewer"
      ],
      "milestones": [
        "2:01a2126b-9524-77ce-92fc-ca068e33a814",
        "2:01a21308-3bf9-7497-8690-cb87005254dd",
        "2:01a21304-7c74-7340-839b-b87f73b6e2e7"
      ]
    },
    {
      "ref": "2:01a21309-3997-73ae-a4dd-00e808953223",
      "name": "Reference API proxy",
      "status": "active",
      "providers": [
        "reference_api_buddy"
      ],
      "users": [
        "context_studio"
      ],
      "milestones": [
        "2:01a21309-dad7-77ce-a26d-ab1958b8f5f5",
        "2:01a21309-ddc3-7408-b468-dc52fbf420e7",
        "2:01a2130a-635d-71ad-bd81-19274efd5e9e",
        "2:01a21247-85ce-7749-96af-b74e78ac2bb1"
      ]
    },
    {
      "ref": "2:01a2130f-59ec-7360-ac3f-07089028ccd9",
      "name": "House connector for organizing work",
      "status": "active",
      "providers": [
        "house_mcp"
      ],
      "users": [
        "claude_plugins"
      ],
      "milestones": [
        "2:01a2130b-65ac-70ca-bcb9-87de8f63c671"
      ]
    },
    {
      "ref": "2:01a21313-84f1-747b-b854-4eea069c7a7f",
      "name": "Post-extraction review",
      "status": "active",
      "providers": [
        "documentation_robotics"
      ],
      "users": [
        "documentation_robotics"
      ],
      "milestones": [
        "2:01a21273-112d-7780-8cfb-52041f1d7881"
      ]
    }
  ]
}
