// Layout primitives — Panel, Drawer, SplitPane, StatGrid
const { Fragment } = React;

function Panel({ title, icon, children, footer, className = "" }) {
  return (
    <div className={"panel " + className}>
      {title && (
        <div className="panel-head">
          <div className="panel-title">
            {icon && <Icon name={icon} size={14} />}
            {title}
          </div>
        </div>
      )}
      <div className="panel-body">{children}</div>
      {footer && <div className="panel-foot">{footer}</div>}
    </div>
  );
}

function Drawer({ title, children, className = "" }) {
  return (
    <div className={"drawer " + className}>
      {title && (
        <div className="drawer-head">
          <div className="title">{title}</div>
        </div>
      )}
      <div className="drawer-body">{children}</div>
    </div>
  );
}

function SplitPane({ variant = "2", left, middle, right, className = "" }) {
  if (variant === "3") {
    return (
      <div className={"split-3 " + className}>
        {left}
        {middle}
        {right}
      </div>
    );
  }
  return (
    <div className={"split-2 " + className}>
      {left}
      {right}
    </div>
  );
}

function StatGrid({ children, className = "" }) {
  return <div className={"stat-grid " + className}>{children}</div>;
}

function StatTile({ label, value, color, meta }) {
  return (
    <div className="stat" data-color={color}>
      <div className="label">{label}</div>
      <div className="num">{value}</div>
      {meta && <div className="meta">{meta}</div>}
    </div>
  );
}

window.Panel = Panel;
window.Drawer = Drawer;
window.SplitPane = SplitPane;
window.StatGrid = StatGrid;
window.StatTile = StatTile;
