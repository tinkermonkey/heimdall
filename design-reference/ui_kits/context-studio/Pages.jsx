// Heimdall — Context Studio · Pages
// Dashboard (main), Schema/Classes (table), Pipelines (list), Settings (form).
// Page bodies consume primitive components from components/*.jsx.

// ----- Mock data -----
const D = {
  taxonomies: [
    { id: "life",     label: "life",     color: "#10B981", count: 142, desc: "Biological and biomedical concepts — organisms, genes, proteins, diseases." },
    { id: "software", label: "software", color: "#818CF8", count: 27,  desc: "Codebases, services, repositories, and operational artifacts." },
    { id: "climate",  label: "climate",  color: "#F59E0B", count: 98,  desc: "Environmental observations, stations, sensors, and time-series." },
  ],
  classes: [
    { id: "life.organism",      label: "organism",      desc: "Living individual with binomial name",   dom: "life",     count: 142 },
    { id: "life.gene",          label: "gene",          desc: "Heritable unit of inheritance",          dom: "life",     count: 98  },
    { id: "life.protein",       label: "protein",       desc: "Translated polypeptide product",         dom: "life",     count: 64  },
    { id: "software.repo",      label: "repo",          desc: "Source code repository",                  dom: "software", count: 27  },
    { id: "climate.station",    label: "station",       desc: "Recording weather station",               dom: "climate",  count: 33  },
    { id: "climate.measurement", label: "measurement",   desc: "Single sensor reading",                   dom: "climate",  count: 12480 },
  ],
  pipelines: [
    { id: "pubmed_genes",  status: "running", progress: 38,  last: "now",        steps: ["Fetch","Parse","Match","Index","Emit"], at: 2,
      foot: { lastRun: "now",     ingested: 412, created: 38, updated: 17, errors: 0 } },
    { id: "ncbi_taxonomy", status: "ok",      progress: 100, last: "1h ago",     steps: ["Fetch","Parse","Match","Index","Emit"], at: 5,
      foot: { lastRun: "1h ago",  ingested: 88,  created: 12, updated: 4,  errors: 0 } },
    { id: "gh_repos",      status: "idle",    progress: 0,   last: "yesterday",  steps: ["Fetch","Parse","Match","Index","Emit"], at: 0,
      foot: { lastRun: "1d ago",  ingested: 0,   created: 0,  updated: 0,  errors: 0 } },
  ],
  activity: [
    { kind: "create", tag: "CREATE", when: "2m",  headline: "Created class",        subject: "cls_variant", meta: "sch_genomics · life · by pipeline · pubmed" },
    { kind: "update", tag: "UPDATE", when: "8m",  headline: "Updated relationship", subject: "rel_e811",    meta: "BRCA1 → related_to → p53 · by maya@studio" },
    { kind: "run",    tag: "RUN",    when: "14m", headline: "Started pipeline run", subject: "pubmed_genes", meta: "step 2 of 5 · 412 items ingested" },
    { kind: "delete", tag: "DELETE", when: "37m", headline: "Removed property",     subject: "isReferencedBy", meta: "23 classes unlinked · by maya@studio" },
    { kind: "run",    tag: "RUN",    when: "2h",  headline: "Index rebuilt",        subject: "molgraph-research", meta: "all 267 individuals" },
  ],
  // Hierarchy as a flat row list (depth-aware) — consumed by HierarchyTree primitive
  hierarchyRows: [
    { id: "life",      depth: 0, domain: "life",     variant: "taxonomy", label: "Life Sciences",     count: 3, countLabel: "cls", desc: "Biological and biomedical concepts — organisms, genes, proteins, diseases." },
    { id: "life.cell", depth: 1, domain: "life",     variant: "scheme",   label: "Cellular Biology",  count: 6,                    desc: "Cells, organelles, tissues, and intracellular structures." },
    { id: "life.cell.cell", depth: 2, domain: "life", variant: "class",   label: "Cell",              count: 8, countLabel: "ind", desc: "Basic structural and functional unit of all known living organisms." },
    { id: "climate",   depth: 0, domain: "climate",  variant: "taxonomy", label: "Climate",           count: 2, countLabel: "cls", desc: "Stations, measurements, and environmental observations over time." },
    { id: "software",  depth: 0, domain: "software", variant: "taxonomy", label: "Software",          count: 1, countLabel: "cls", desc: "Repositories, services, and platform artifacts." },
  ],
};

// ====================== Dashboard ======================
function DashboardPage({ onNav }) {
  const [selected, setSelected] = useState("life.cell.cell");

  return (
    <div className="canvas-inner">
      <div className="page-head">
        <div>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
            <span className="chip amber"><span className="dot"></span>workspace · default</span>
            <span className="muted mono" style={{fontSize:11}}>last sync 2 min ago</span>
          </div>
          <h1>Dashboard <span className="id-tag">/workspace/default</span></h1>
          <div className="subtitle">
            Curate knowledge graphs for retrieval-augmented generation and agents.
          </div>
        </div>
        <div className="page-actions">
          <button className="btn btn-ghost"><Icon name="refresh" /> Refresh</button>
          <button className="btn btn-primary"><Icon name="plus" /> New pipeline run</button>
        </div>
      </div>

      <div className="stat-grid" style={{marginBottom: 22}}>
        <StatTile label="Taxonomies" value="3"  color="cyan"    icon="schema"
          meta={<span className="muted">3 active · 0 archived</span>} />
        <StatTile label="Classes" value="22" color="violet" icon="graph"
          meta={<><span className="delta-up">▲ 4</span> <span className="muted">this week</span></>} />
        <StatTile label="Individuals" value="267" color="emerald" icon="data"
          spark={[34, 41, 38, 52, 48, 60, 56, 73, 70, 88, 81, 102]}
          meta={<><span className="delta-up">▲ 38</span> <span className="muted">last run</span></>} />
        <StatTile label="Pipelines" value="1/11" color="amber" icon="pipeline"
          meta={<><span className="pulse amber sm" style={{marginRight:4}}></span> <span className="mono muted" style={{fontSize:11}}>1 running · 2 failed</span></>} />
      </div>

      <div className="split-2" style={{marginBottom: 22}}>
        <div className="panel">
          <div className="panel-head">
            <div className="panel-title"><Icon name="schema" size={14}/>Knowledge graph structure</div>
            <div className="row gap-12">
              <span className="muted mono" style={{fontSize: 11}}>3 tax · 22 cls</span>
              <button className="btn btn-ghost btn-sm" onClick={() => onNav("schema/classes")}>Open <Icon name="arrow" size={11}/></button>
            </div>
          </div>
          <HierarchyTree
            rows={D.hierarchyRows.map((r) => ({
              ...r,
              selected: selected === r.id,
              onClick: () => setSelected(r.id),
            }))}
          />
        </div>

        <div className="panel">
          <div className="panel-head">
            <div className="panel-title"><Icon name="history" size={14}/>Recent activity</div>
            <button className="btn btn-ghost btn-sm">View all</button>
          </div>
          <ActivityList items={D.activity} />
        </div>
      </div>

      <div className="panel" style={{marginBottom: 22}}>
        <div className="panel-head">
          <div className="panel-title"><Icon name="pipeline" size={14}/>Active pipelines</div>
          <button className="btn btn-ghost btn-sm" onClick={() => onNav("pipelines/all")}>All pipelines <Icon name="arrow" size={11}/></button>
        </div>
        <div className="panel-body" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
          {D.pipelines.slice(0, 2).map((p) => <PipelineCard key={p.id} p={p} />)}
        </div>
      </div>

      <div>
        <div className="between" style={{marginBottom: 10}}>
          <h3 style={{margin:0, fontSize:14, fontWeight:600}}>Quick access</h3>
          <span className="muted" style={{fontSize: 12}}>Jump to common workflows</span>
        </div>
        <div className="qa-grid">
          {[
            ["schema/taxonomies",  "schema",    "Taxonomies",        "Manage top-level domains"],
            ["schema/classes",     "graph",     "Classes",           "Define your knowledge structure"],
            ["schema/properties",  "tag",       "Properties",        "Object and literal definitions"],
            ["data/individuals",   "data",      "Individuals",       "Browse populated instances"],
            ["pipelines/all",      "pipeline",  "Pipelines",         "Configure Graph RAG pipelines"],
            ["reference/sources",  "reference", "Reference sources", "External APIs and corpora"],
          ].map(([r, ic, n, d]) => (
            <QuickAccessTile key={r} icon={ic} name={n} description={d} onClick={() => onNav(r)} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ====================== Classes (table + filter dropdowns) ======================
function ClassesPage({ onOpenModal }) {
  const [q, setQ] = useState("");
  const [domainFilter, setDomainFilter] = useState(["life", "software", "climate"]);
  const [parentFilter, setParentFilter] = useState("any");

  const filtered = D.classes.filter((c) =>
    (!q || c.id.includes(q.toLowerCase()) || c.desc.toLowerCase().includes(q.toLowerCase())) &&
    domainFilter.includes(c.dom)
  );

  return (
    <div className="canvas-inner">
      <div className="page-head">
        <div>
          <div style={{display:"flex",gap:10,marginBottom:8}}>
            <span className="chip violet"><span className="dot"></span>schema</span>
            <span className="muted mono" style={{fontSize:11}}>22 classes · 3 taxonomies</span>
          </div>
          <h1>Classes <span className="id-tag">/schema/classes</span></h1>
          <div className="subtitle">Define the structure of your knowledge. Classes are nodes in the graph; properties live below.</div>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={onOpenModal}><Icon name="plus" /> New class</button>
        </div>
      </div>

      <div className="row" style={{marginBottom: 14, gap: 10, flexWrap: "wrap"}}>
        <div style={{position:"relative", flex:1, maxWidth: 360, minWidth: 220}}>
          <span style={{position:"absolute",left:10,top:9,color:"var(--canvas-fg-4)",pointerEvents:"none"}}>
            <Icon name="search" size={13}/>
          </span>
          <input
            className="input"
            placeholder="Search classes, descriptions, ids…"
            value={q} onChange={(e) => setQ(e.target.value)}
            style={{paddingLeft: 32}}
          />
        </div>
        <FilterDropdown
          eyebrow="DOMAIN"
          sectionLabel="DOMAINS"
          value={domainFilter}
          onChange={setDomainFilter}
          options={D.taxonomies.map((t) => ({
            value: t.id, label: t.label, meta: t.count, swatch: t.color,
          }))}
        />
        <SegmentedControl
          options={[
            { value: "any",    label: "Any" },
            { value: "single", label: "Single" },
            { value: "multi",  label: "Multi" },
          ]}
          value={parentFilter}
          onChange={setParentFilter}
        />
        <span className="muted mono" style={{fontSize: 11, marginLeft: "auto"}}>showing {filtered.length} of {D.classes.length}</span>
      </div>

      <div className="panel">
        <table className="tbl">
          <thead>
            <tr>
              <th style={{width: 28}}></th>
              <th>Class</th>
              <th>Description</th>
              <th style={{width: 120}}>Taxonomy</th>
              <th style={{width: 90, textAlign:"right"}}>Individuals</th>
              <th style={{width: 60}}></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => {
              const tax = D.taxonomies.find((t) => t.id === c.dom);
              return (
                <tr key={c.id}>
                  <td><span style={{width:8,height:8,borderRadius:2,background:tax.color,display:"inline-block"}}></span></td>
                  <td className="mono"><b>{c.id}</b> <VersionPill>{Math.floor(c.count / 4) + 1}</VersionPill></td>
                  <td>{c.desc}</td>
                  <td><span className="chip" style={{background: tax.color + "22", color: tax.color, borderColor: tax.color + "55"}}>{tax.label}</span></td>
                  <td className="num">{c.count.toLocaleString()}</td>
                  <td style={{textAlign:"right"}}>
                    <button className="btn btn-ghost btn-sm"><Icon name="more" size={13}/></button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ====================== Pipelines (list) ======================
function PipelinesPage() {
  const [filter, setFilter] = useState("all");
  const filtered = D.pipelines.filter((p) => filter === "all" || p.status === filter);
  return (
    <div className="canvas-inner">
      <div className="page-head">
        <div>
          <div style={{display:"flex",gap:10,marginBottom:8}}>
            <span className="chip emerald"><span className="dot"></span>pipelines · 11</span>
            <span className="muted mono" style={{fontSize:11}}>1 running · 8 idle · 2 errored</span>
          </div>
          <h1>All pipelines <span className="id-tag">/pipelines/all</span></h1>
          <div className="subtitle">Configure ingest, transform, and emit steps for Graph-RAG. Each pipeline pulls from a reference source.</div>
        </div>
        <div className="page-actions">
          <button className="btn btn-ghost"><Icon name="refresh" /> Refresh</button>
          <button className="btn btn-primary"><Icon name="plus" /> New pipeline</button>
        </div>
      </div>
      <div style={{display: "flex", gap: 10, marginBottom: 14}}>
        <SegmentedControl
          value={filter}
          onChange={setFilter}
          options={[
            { value: "all",     label: "All" },
            { value: "running", label: "Running" },
            { value: "error",   label: "Failed" },
            { value: "idle",    label: "Idle" },
          ]}
        />
      </div>
      <div style={{display: "grid", gap: 14}}>
        {filtered.map((p) => <PipelineCard key={p.id} p={p}/>)}
      </div>
    </div>
  );
}

// ====================== Settings (Tabs + Config tiles) ======================
function SettingsPage() {
  const [tab, setTab] = useState("general");
  return (
    <div className="canvas-inner">
      <div className="page-head">
        <div>
          <h1>Configuration <span className="id-tag">/settings</span></h1>
          <div className="subtitle">Workspace-level configuration. Changes apply to all members on next sync.</div>
        </div>
      </div>

      <Tabs
        active={tab}
        onChange={setTab}
        items={[
          { id: "general",      label: "General",      count: 6 },
          { id: "pipelines",    label: "Pipelines",    count: 4 },
          { id: "storage",      label: "Storage",      count: 3 },
          { id: "members",      label: "Members",      count: 3 },
          { id: "integrations", label: "Integrations" },
        ]}
      />

      {tab === "general" && (
        <div className="panel" style={{maxWidth: 760}}>
          <div className="panel-head"><div className="panel-title">Workspace</div></div>
          <div className="panel-body" style={{display:"grid", gap:16}}>
            <div className="field">
              <div className="lab">Name</div>
              <input className="input mono" defaultValue="molgraph-research"/>
              <div className="hint">Used as the canonical workspace id. snake_case, no spaces.</div>
            </div>
            <div className="field">
              <div className="lab">Local path</div>
              <input className="input mono" defaultValue="~/Projects/molgraph-research"/>
              <div className="hint">Source of truth for schema, data, and pipeline definitions.</div>
            </div>
            <div className="field">
              <div className="lab">Default branch</div>
              <input className="input mono" defaultValue="main"/>
            </div>
          </div>
          <div className="modal-foot" style={{borderTop:"1px solid var(--canvas-border)"}}>
            <button className="btn btn-ghost">Discard</button>
            <button className="btn btn-primary">Save changes</button>
          </div>
        </div>
      )}

      {tab === "storage" && (
        <div style={{display: "grid", gap: 10, maxWidth: 760}}>
          <ConfigTile
            icon="data"
            name="Backups"
            description="Automatic snapshots of schema, data, and run history."
            summary={[
              { key: "last",   value: "4h ago" },
              { key: "retain", value: "7d" },
              { key: "target", value: "nyx.lab.local" },
            ]}
            action={<button className="btn btn-ghost btn-sm">Manage</button>}
          />
          <ConfigTile
            icon="database"
            name="Vector index"
            description="Stored embeddings used by retrieval pipelines."
            summary={[
              { key: "dim",   value: "1536" },
              { key: "size",  value: "412 MB" },
              { key: "model", value: "text-embedding-3-small" },
            ]}
          />
        </div>
      )}

      {tab !== "general" && tab !== "storage" && (
        <div className="panel" style={{maxWidth: 760}}>
          <div className="panel-body" style={{padding: 36, textAlign:"center", color:"var(--canvas-fg-3)"}}>
            <div style={{fontFamily:"var(--font-mono)", fontSize: 11, letterSpacing:"0.08em", textTransform:"uppercase", marginBottom: 8}}>NO CONTENT</div>
            <div style={{fontSize: 13}}>This tab is part of the production studio.</div>
          </div>
        </div>
      )}
    </div>
  );
}

// ====================== Generic stub ======================
function StubPage({ route }) {
  return (
    <div className="canvas-inner">
      <div className="page-head">
        <div>
          <h1>{ROUTE_LABELS[route]?.join(" / ") || route}</h1>
          <div className="subtitle">This screen is part of the production Heimdall studio. Open the repo for the full implementation.</div>
        </div>
      </div>
      <div className="panel">
        <div className="panel-body" style={{padding: 36, textAlign:"center", color:"var(--canvas-fg-3)"}}>
          <div style={{fontFamily:"var(--font-mono)", fontSize: 11, letterSpacing:"0.08em", textTransform:"uppercase", marginBottom: 8}}>NO CONTENT</div>
          <div style={{fontSize: 13}}>No items in this view yet. Add one to populate the surface.</div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, {
  D,
  DashboardPage, ClassesPage, PipelinesPage, SettingsPage, StubPage,
});
