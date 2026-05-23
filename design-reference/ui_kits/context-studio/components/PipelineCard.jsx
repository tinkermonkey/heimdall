// Heimdall — primitive · PipelineCard
// Head (dot + name + status) · Flow strip (rounded step nodes + 1px lines + arrows) · 5-col foot row.
// Anatomy spec: preview/component-pipeline-card.html

function PipelineCard({ p, footer = true }) {
  const statusText = p.status === "running" ? `RUNNING · ${p.progress}%`
                  : p.status === "ok"      ? `OK · LAST RUN ${p.last}`
                  : p.status === "error"   ? `FAILED · ${p.last}`
                  :                          `IDLE · LAST RUN ${p.last}`;
  const dot = p.status === "running" ? <span className="pulse amber"></span>
            : p.status === "ok"      ? <span className="dot-em"></span>
            : p.status === "error"   ? <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--status-rose)", display: "inline-block" }}></span>
            :                          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--canvas-fg-4)", display: "inline-block" }}></span>;

  return (
    <div className="pipeline-card">
      <div className="pipeline-card-head">
        <div className="pipeline-card-name">{dot}{p.id}</div>
        <div className="pipeline-card-status">{statusText}</div>
      </div>
      <div className="pipeline-card-flow">
        {p.steps.flatMap((s, i, arr) => [
          <div key={s} className={"flow-node " + (i < p.at ? "done" : i === p.at && p.status === "running" ? "run" : "")}>
            <div className="flow-node-circle">{i + 1}</div>
            <div className="flow-node-label">{s}</div>
          </div>,
          i < arr.length - 1 ? <div key={s + ":arr"} className="flow-arrow"></div> : null,
        ])}
      </div>
      {footer && p.foot && <PipelineFoot stats={p.foot} />}
    </div>
  );
}

function PipelineFoot({ stats }) {
  // stats: { lastRun, ingested, created, updated, errors }
  const errors = Number(stats.errors) || 0;
  return (
    <div className="pipe-foot">
      <div><div className="l">LAST RUN</div><div className="v">{stats.lastRun}</div></div>
      <div><div className="l">INGESTED</div><div className="v">{stats.ingested}</div></div>
      <div><div className="l">CREATED</div> <div className="v created">+{stats.created}</div></div>
      <div><div className="l">UPDATED</div> <div className="v">~{stats.updated}</div></div>
      <div><div className="l">ERRORS</div>  <div className={"v" + (errors > 0 ? " errors-warn" : "")}>{stats.errors}</div></div>
    </div>
  );
}

Object.assign(window, { PipelineCard, PipelineFoot });
