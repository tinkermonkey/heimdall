// Heimdall — primitives · QuickAccessTile + ConfigTile
// Both share amber-tinted icon + name + description.
// QuickAccessTile adds a chev (→ amber on hover).
// ConfigTile is denser (40px icon, 16px padding) and adds a kv-mini summary strip.

function QuickAccessTile({ icon, name, description, onClick }) {
  return (
    <div className="qa-tile" onClick={onClick}>
      <div className="icon"><Icon name={icon} size={16} /></div>
      <div className="body">
        <div className="n">{name}</div>
        {description && <div className="d">{description}</div>}
      </div>
      <span className="chev"><Icon name="chevRight" size={13} /></span>
    </div>
  );
}

function ConfigTile({ icon, name, description, summary, action, onClick }) {
  return (
    <div className="config-tile" onClick={onClick}>
      <div className="icon"><Icon name={icon} size={18} /></div>
      <div className="body">
        <div className="n">{name}</div>
        {description && <div className="d">{description}</div>}
        {summary && summary.length > 0 && (
          <div className="kv-mini">
            {summary.map((s, i) => (
              <div key={i}><b>{s.key}</b>{s.value}</div>
            ))}
          </div>
        )}
      </div>
      {action}
    </div>
  );
}

Object.assign(window, { QuickAccessTile, ConfigTile });
