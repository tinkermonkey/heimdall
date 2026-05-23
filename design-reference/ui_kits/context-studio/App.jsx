// Heimdall — Context Studio · App entry
// Wires Titlebar + Sidebar + Topbar + Statusbar + canvas page switch + palette/modal.

function App() {
  const [route, setRoute] = useState("dashboard");
  const [collapsed, setCollapsed] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [toast, setToast] = useState(null);

  // ⌘K
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // toast auto-dismiss
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(t);
  }, [toast]);

  const onNav = (r) => { setRoute(r); setPaletteOpen(false); };

  let page;
  if (route === "dashboard")          page = <DashboardPage onNav={onNav}/>;
  else if (route === "schema/classes") page = <ClassesPage onOpenModal={() => setModalOpen(true)} />;
  else if (route === "pipelines/all")  page = <PipelinesPage/>;
  else if (route === "settings")       page = <SettingsPage/>;
  else                                  page = <StubPage route={route}/>;

  return (
    <div className="desktop">
      <Titlebar onPalette={() => setPaletteOpen(true)} />
      <div className="app-shell" style={{gridTemplateColumns: (collapsed ? "64px" : "256px") + " 1fr"}}>
        <Sidebar
          route={route}
          onNav={onNav}
          collapsed={collapsed}
          onToggle={() => setCollapsed((v) => !v)}
        />
        <div className="workspace">
          <Topbar route={route} onPalette={() => setPaletteOpen(true)} />
          <div className="canvas-area">
            {page}
          </div>
          <Statusbar />
        </div>
      </div>

      {paletteOpen && <CommandPalette onClose={() => setPaletteOpen(false)} onNav={onNav}/>}
      {modalOpen && (
        <NewClassModal
          onClose={() => setModalOpen(false)}
          onCreate={({name, tax}) => setToast({kind:"ok", text:"Class created", id:`${tax}.${name}`})}
        />
      )}

      {toast && (
        <div style={{
          position: "fixed", bottom: 44, right: 24, zIndex: 60,
          minWidth: 280,
          display: "flex", alignItems: "center", gap: 10,
          padding: "10px 14px",
          background: "var(--canvas-card)",
          color: "var(--canvas-fg-1)",
          border: "1px solid var(--canvas-border)",
          borderLeft: `3px solid ${toast.kind === "ok" ? "var(--status-emerald)" : "var(--status-rose)"}`,
          borderRadius: "var(--radius-lg)",
          boxShadow: "var(--shadow-toast)",
          fontSize: 13,
          animation: "paletteSlide 160ms ease-out both",
        }}>
          <Icon name={toast.kind === "ok" ? "check" : "alert"} size={14}/>
          <span style={{fontWeight:500}}>{toast.text}</span>
          {toast.id && <span className="mono" style={{marginLeft:"auto", fontSize: 11, color:"var(--canvas-fg-3)"}}>{toast.id}</span>}
        </div>
      )}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("app")).render(<App />);
