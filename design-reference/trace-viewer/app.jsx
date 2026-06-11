/* Heimdall · OTel Trace Viewer — shell + app */
const { useState, useEffect, useMemo } = React;
const K = { collapsed: 'hd.tv.collapsed', sel: 'hd.tv.selected', dark: 'hd.tv.dark' };

const NAV = [
  ['dashboard', 'Overview'], ['cpu', 'Servers'], ['layers', 'Containers'],
  ['globe', 'Network'], ['rocket', 'Applications'], ['database', 'Storage'],
  ['doc', 'Logs'], ['branch', 'Traces'], ['graph', 'Topology'], ['settings', 'Configuration'],
];

function NavItem({ icon, label, active }) {
  return (
    <div className={'hd-nav-item' + (active ? ' active' : '')}>
      <Icon name={icon} size={16} />
      <span>{label}</span>
    </div>
  );
}

function Sidebar() {
  return (
    <div className="hd-sidebar">
      <div className="hd-brand">
        <img src="../assets/brand-mark.svg" width="24" height="24" alt="" />
        <span className="hd-brand-name">Heimdall</span>
        <span className="hd-ws-chip">asgard</span>
      </div>
      <div className="hd-nav-group">
        <div className="eyebrow hd-nav-eyebrow">CLUSTER</div>
        {NAV.slice(0, 6).map(([i, l]) => <NavItem key={l} icon={i} label={l} />)}
        <div className="eyebrow hd-nav-eyebrow" style={{ marginTop: 12 }}>OBSERVABILITY</div>
        {NAV.slice(6).map(([i, l]) => <NavItem key={l} icon={i} label={l} active={l === 'Traces'} />)}
      </div>
      <div className="hd-sidebar-foot">
        <span className="hd-pulse"><span className="hd-pulse-glow" /><span className="hd-pulse-dot" /></span>
        <span>4 hosts · healthy</span>
      </div>
    </div>
  );
}

function Topbar({ dark, setDark }) {
  return (
    <div className="hd-topbar">
      <div className="hd-crumb">
        <span>Observability</span><Icon name="chevRight" size={13} /><span className="cur">Traces</span>
      </div>
      <div className="hd-search">
        <Icon name="search" size={14} />
        <input placeholder="trace_id, service, span name…" spellCheck={false} />
        <kbd>/</kbd>
      </div>
      <div style={{ flex: 1 }} />
      <div className="hd-seg">
        <button className={!dark ? 'on' : ''} onClick={() => setDark(false)}>Light</button>
        <button className={dark ? 'on' : ''} onClick={() => setDark(true)}>Dark</button>
      </div>
      <button className="hd-icon-btn" title="Refresh"><Icon name="refresh" size={15} /></button>
      <button className="hd-icon-btn" title="Notifications"><Icon name="bell" size={15} /></button>
      <div className="hd-avatar">tk</div>
    </div>
  );
}

function PageHead({ meta, model }) {
  return (
    <div className="hd-page-head">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <h1 style={{ fontFamily: 'var(--font-mono)', fontSize: 20 }}>{meta.name}</h1>
          <span className="id-tag" style={{ fontSize: 11 }}>trace {meta.traceId.slice(0, 16)}…</span>
        </div>
        <p style={{ fontSize: 12.5, color: 'var(--canvas-fg-3)' }}>
          Root on <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--canvas-fg-2)' }}>{model.byId[model.roots[0].id].service}</span> ·
          started {meta.startedAt} · sampler <span style={{ fontFamily: 'var(--font-mono)' }}>{meta.sampler}</span>
        </p>
      </div>
      <div style={{ flex: 1 }} />
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <button className="hd-btn"><Icon name="ext" size={13} /> Raw JSON</button>
        <button className="hd-btn"><Icon name="link" size={13} /> Share</button>
      </div>
    </div>
  );
}

function App() {
  const model = useMemo(() => { const m = buildModel(TRACE.spans); m.meta = TRACE.meta; return m; }, []);
  const services = TRACE.services;

  const [collapsed, setCollapsed] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem(K.collapsed) || '[]')); } catch { return new Set(); }
  });
  const [selected, setSelected] = useState(() => localStorage.getItem(K.sel) || 's24');
  const [hovered, setHovered] = useState(null);
  const [dark, setDark] = useState(() => localStorage.getItem(K.dark) !== '0');

  useEffect(() => { localStorage.setItem(K.collapsed, JSON.stringify([...collapsed])); }, [collapsed]);
  useEffect(() => { selected ? localStorage.setItem(K.sel, selected) : localStorage.removeItem(K.sel); }, [selected]);
  useEffect(() => { localStorage.setItem(K.dark, dark ? '1' : '0'); document.body.classList.toggle('dark-canvas', dark); }, [dark]);

  const span = selected ? model.byId[selected] : null;
  const toggle = (id) => setCollapsed(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const errors = model.ordered.filter(s => s.status === 'error').length;

  return (
    <div className="hd-shell">
      <Sidebar />
      <div className="hd-main">
        <Topbar dark={dark} setDark={setDark} />
        <div className="hd-canvas-wrap">
          <div className="hd-canvas">
            <PageHead meta={model.meta} model={model} />
            <div style={{ borderBottom: '1px solid var(--canvas-border)' }}>
              <HeaderSummary model={model} services={services} />
            </div>
            <div className="hd-trace-body">
              <TraceLane model={model} services={services} collapsed={collapsed}
                selected={selected} hovered={hovered}
                onSelect={setSelected} onHover={setHovered} onToggle={toggle} />
              <div className={'hd-detail' + (span ? ' open' : '')}>
                <DetailPanel span={span} model={model} services={services}
                  onClose={() => setSelected(null)} onSelect={setSelected} />
              </div>
            </div>
          </div>
        </div>
        <div className="hd-statusbar">
          <span className="hd-pulse"><span className="hd-pulse-glow" /><span className="hd-pulse-dot" /></span>
          <span>{model.meta.collector}</span><span className="sep">·</span>
          <span>trace {model.meta.shortId}</span><span className="sep">·</span>
          <span>{model.ordered.length} spans</span><span className="sep">·</span>
          <span>6 services</span><span className="sep">·</span>
          <span>{fmtMs(model.total)}</span><span className="sep">·</span>
          <span style={{ color: errors ? 'var(--status-error)' : 'var(--shell-fg-2)' }}>{errors} error{errors !== 1 ? 's' : ''}</span>
          <span style={{ flex: 1 }} />
          <span>{span ? 'span ' + span.name : 'no span selected'}</span>
        </div>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
