// Heimdall · charts design-spec page composition.
// Reads chart primitives from window (loaded by charts-spec.html).

const { Sparkline, LineChart, BarV, BarH, StackedBar, Donut, Heatmap, StatusTimeline, SERIES } = window;

// ===== Sample data =========================================================
const DATA = {
  line:   [12, 14, 13, 16, 19, 17, 21, 24, 22, 27, 31, 28, 34, 38, 36, 42, 45, 48, 46, 52],
  line2:  [22, 24, 25, 24, 26, 28, 27, 30, 29, 31, 30, 33, 34, 32, 35, 37, 36, 39, 41, 40],
  bar:    [82, 64, 91, 47, 73, 88, 56, 79, 95, 68, 72, 84],
  barXL:  ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
  barH:   [
    { label: 'nyx',     value: 92, color: '#22D3EE' },
    { label: 'aether',  value: 78, color: '#818CF8' },
    { label: 'vega',    value: 64, color: '#F59E0B' },
    { label: 'helios',  value: 41, color: '#10B981' },
  ],
  stacks: [
    { label: 'Mon', parts: [42, 28, 14, 8] },
    { label: 'Tue', parts: [48, 31, 12, 11] },
    { label: 'Wed', parts: [38, 26, 18, 9] },
    { label: 'Thu', parts: [52, 34, 9, 14] },
    { label: 'Fri', parts: [61, 30, 11, 7] },
    { label: 'Sat', parts: [44, 24, 8, 5] },
    { label: 'Sun', parts: [31, 22, 6, 4] },
  ],
  donut: [
    { value: 134, color: '#10B981' },
    { value:  72, color: '#818CF8' },
    { value:  45, color: '#22D3EE' },
    { value:  16, color: '#F59E0B' },
  ],
  // 7×24 heatmap (week-by-hour activity)
  heatmap: (() => {
    const rows = [];
    for (let r = 0; r < 7; r++) {
      const row = [];
      for (let c = 0; c < 24; c++) {
        // morning rise + evening peak
        const m = Math.sin((c - 8) / 24 * Math.PI) * 0.5 + 0.5;
        const e = Math.exp(-Math.pow(c - 20, 2) / 8) * 0.8;
        const wknd = (r === 5 || r === 6) ? 0.7 : 1;
        row.push(Math.max(0, (m * 0.4 + e * 0.6) * wknd * (0.7 + Math.random() * 0.6)));
      }
      rows.push(row);
    }
    return rows;
  })(),
  timeline: [
    { label: 'graph daemon', segments: [
      { start: 0,  end: 22, kind: 'ok' },
      { start: 22, end: 28, kind: 'warn' },
      { start: 28, end: 64, kind: 'ok' },
      { start: 64, end: 68, kind: 'error' },
      { start: 68, end: 100, kind: 'ok' },
    ]},
    { label: 'pubmed_genes', segments: [
      { start: 0,  end: 14, kind: 'idle' },
      { start: 14, end: 38, kind: 'info' },
      { start: 38, end: 41, kind: 'idle' },
      { start: 41, end: 86, kind: 'info' },
      { start: 86, end: 100, kind: 'idle' },
    ]},
    { label: 'nyx.lab',       segments: [
      { start: 0, end: 100, kind: 'ok' },
    ]},
    { label: 'vega.lab',      segments: [
      { start: 0,  end: 48, kind: 'ok' },
      { start: 48, end: 56, kind: 'error' },
      { start: 56, end: 100, kind: 'warn' },
    ]},
  ],
  hours: ['00','04','08','12','16','20','24'],
};

// ===== Small layout helpers ================================================
function Section({ id, eyebrow, title, sub, children }) {
  return (
    <section className="section" id={id}>
      <div className="section-head">
        <div className="eyebrow">{eyebrow}</div>
        <h2>{title}</h2>
        {sub && <p className="section-sub">{sub}</p>}
      </div>
      {children}
    </section>
  );
}
function Card({ children, label, tone = 'light', pad = true, style }) {
  return (
    <div className={`spec-card ${tone}`} style={style}>
      {label && <div className="spec-card-label">{label}</div>}
      <div className={`spec-card-body ${pad ? 'pad' : ''}`}>{children}</div>
    </div>
  );
}
function Tag({ children, kind = 'neutral' }) {
  return <span className={`spec-tag ${kind}`}>{children}</span>;
}
function KV({ k, v }) {
  return (
    <div className="kv-row">
      <div className="kv-k">{k}</div>
      <div className="kv-v">{v}</div>
    </div>
  );
}

// ===== Page ================================================================
function Page() {
  return (
    <div className="doc">
      <Header/>
      <TierLadder/>
      <TierSpecs/>
      <Anatomy/>
      <TypeCatalog/>
      <ColorSeries/>
      <Annotations/>
      <Surfaces/>
      <Interactivity/>
      <DoDont/>
      <Footer/>
    </div>
  );
}

// ---- Header ---------------------------------------------------------------
function Header() {
  return (
    <header className="doc-head">
      <div className="doc-head-crumbs">
        <a href="design-system-update.html">Heimdall · Design System</a>
        <span className="sep">/</span>
        <span>Charts</span>
      </div>
      <h1>Charts</h1>
      <p className="doc-lede">
        Charts in Heimdall are read at a glance. They live across four prominence
        tiers — from an 88×28 sparkline inside a stat tile up to a full-bleed
        feature panel — and every tier is constrained: only the annotations that
        earn their place at that size are included. Single-series picks up the
        domain color of its host; multi-series cycles the domain palette in a
        fixed order. No legend without a key, no axis without ticks, no grid
        without an axis.
      </p>
      <div className="doc-meta">
        <Tag kind="amber">v2.4 — NEW SPEC</Tag>
        <span className="meta-sep">·</span>
        <span className="meta-line">8 chart types · 4 tiers · light + dark canvas</span>
        <span className="meta-sep">·</span>
        <span className="meta-line">Primitives: <code>charts-spec/primitives.jsx</code></span>
      </div>
    </header>
  );
}

// ---- 1. Tier ladder -------------------------------------------------------
function TierLadder() {
  return (
    <Section eyebrow="01 · OVERVIEW" title="Four tiers of prominence"
             sub="The same line of data, scaled across four containers. The chart doesn't get bigger — it earns annotations as it gets more prominent.">
      <div className="ladder">
        <div className="ladder-item">
          <div className="ladder-tier"><Tag kind="cyan">sparkline</Tag><span className="ladder-px mono">88 × 28</span></div>
          <div className="ladder-chart sparkline-host">
            <Sparkline values={DATA.line} color="#22D3EE"/>
          </div>
          <div className="ladder-cap mono">Shape only.</div>
        </div>
        <div className="ladder-item">
          <div className="ladder-tier"><Tag kind="emerald">micro</Tag><span className="ladder-px mono">200 × 72</span></div>
          <div className="ladder-chart">
            <LineChart series={[DATA.line]} width={200} height={72} colors={['#10B981']} area
                       padding={{top:6,right:6,bottom:6,left:6}}/>
          </div>
          <div className="ladder-cap mono">+ shape + range.</div>
        </div>
        <div className="ladder-item">
          <div className="ladder-tier"><Tag kind="amber">standard</Tag><span className="ladder-px mono">480 × 220</span></div>
          <div className="ladder-chart">
            <LineChart series={[DATA.line]} width={480} height={220} colors={['#F59E0B']} area
                       axes grid xLabels={['W1','W4','W8','W12','W16','W20']} ticks={4}/>
          </div>
          <div className="ladder-cap mono">+ axes + ticks + gridlines.</div>
        </div>
        <div className="ladder-item ladder-feature">
          <div className="ladder-tier"><Tag kind="violet">feature</Tag><span className="ladder-px mono">≥ 720 × 320</span></div>
          <div className="ladder-chart">
            <LineChart series={[DATA.line, DATA.line2]} width={720} height={320}
                       colors={['#22D3EE','#818CF8']} area
                       axes grid xLabels={['W1','W4','W8','W12','W16','W20']} ticks={5}
                       threshold={{ value: 40, label: 'target' }}
                       markers={[{ x: 8, label: 'release 1.4' }]}
                       tooltip/>
          </div>
          <div className="ladder-cap mono">+ multi-series + legend + tooltip + threshold + markers.</div>
        </div>
      </div>
    </Section>
  );
}

// ---- 2. Per-tier specs ----------------------------------------------------
const TIERS = [
  {
    name: 'Sparkline',
    range: '88 × 28',
    px:   '60–120 wide · 20–32 tall',
    use:  ['Inside StatTile (bottom-right)', 'Table-cell trend column', 'Inline with a value'],
    has:  ['shape'],
    not:  ['axes', 'gridlines', 'legend', 'tooltip', 'threshold', 'markers'],
    rule: 'A sparkline answers “is it going up or down?” — nothing more. Don\'t put a number on it; the number is the host.',
  },
  {
    name: 'Micro',
    range: '200 × 72',
    px:   '160–280 wide · 64–96 tall',
    use:  ['Pipeline-card foot row', 'Inspector panel KV value', 'Small dashboard tile'],
    has:  ['shape', 'range hint (min/max)', 'single series'],
    not:  ['axis labels', 'gridlines', 'multi-series', 'tooltip', 'markers'],
    rule: 'No axis. If a value matters, write it next to the chart, not on it. One series only — overlapping lines at this size are unreadable.',
  },
  {
    name: 'Standard',
    range: '480 × 220',
    px:   '360–640 wide · 180–260 tall',
    use:  ['Panel body chart', 'Half-page dashboard widget', 'Inspector chart for one entity'],
    has:  ['axes', 'ticks (≤ 5)', 'gridlines', 'up to 3 series', 'legend (above)', 'threshold'],
    not:  ['hover tooltip', 'event markers', 'dual y-axis'],
    rule: 'Y-axis ticks always start at 0 unless the data range is < 10 % of the value — then break the axis and label it. Max 3 series; if you need more, the chart is the wrong shape.',
  },
  {
    name: 'Feature',
    range: '≥ 720 × 320',
    px:   '720–1200 wide · 280–400 tall',
    use:  ['Hero analytics panel', 'Full-bleed monitoring chart', 'Drill-down detail view'],
    has:  ['axes', 'gridlines', 'up to 6 series', 'legend', 'tooltip', 'threshold', 'event markers', 'annotations'],
    not:  ['decorative animation', 'rotation', '3-D perspective'],
    rule: 'Earned by data density. If you can\'t fill 320 px of vertical space with information the user needs, drop to standard.',
  },
];
function TierSpecs() {
  return (
    <Section eyebrow="02 · TIERS" title="What each tier includes"
             sub="A chart is a tier, not a size — the tier determines which annotations are available. A chart can never have an annotation from a higher tier.">
      <div className="tier-grid">
        {TIERS.map((t, i) => (
          <Card key={t.name} label={`TIER 0${i+1}`} tone="light">
            <div className="tier-head">
              <div className="tier-name">{t.name}</div>
              <div className="tier-range mono">{t.range}</div>
            </div>
            <div className="tier-px mono muted">{t.px}</div>
            <div className="tier-kv">
              <KV k="USE" v={<ul className="tier-list">{t.use.map(u => <li key={u}>{u}</li>)}</ul>}/>
              <KV k="HAS" v={<div className="chip-row">{t.has.map(h => <span key={h} className="chip yes">+ {h}</span>)}</div>}/>
              <KV k="NOT" v={<div className="chip-row">{t.not.map(n => <span key={n} className="chip no">— {n}</span>)}</div>}/>
            </div>
            <div className="tier-rule">{t.rule}</div>
          </Card>
        ))}
      </div>
    </Section>
  );
}

// ---- 3. Anatomy -----------------------------------------------------------
function Anatomy() {
  // Standard-tier line chart with callouts
  const W = 720, H = 320;
  return (
    <Section eyebrow="03 · ANATOMY" title="Standard-tier chart anatomy"
             sub="Every label below has a slot in the primitive. Don't paint outside these slots.">
      <Card pad={false}>
        <div className="anatomy-wrap">
          <div className="anatomy-chart">
            <LineChart series={[DATA.line]} width={W} height={H} colors={['#F59E0B']} area
                       axes grid xLabels={['W1','W4','W8','W12','W16','W20']} ticks={5}
                       threshold={{ value: 40, label: 'target' }}/>
            {/* overlay callouts */}
            <svg className="anatomy-overlay" width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
              {[
                { x: 30,  y: 14,  lab: '01 · y-axis tick · mono 10/500' },
                { x: 200, y: 50,  lab: '02 · plot area (8 px padding all sides)' },
                { x: 480, y: 100, lab: '03 · threshold · 1px dashed, fg-3' },
                { x: 360, y: 200, lab: '04 · series line · 1.5 px, round caps' },
                { x: 240, y: 260, lab: '05 · area fill · 22% → 0% vertical gradient' },
                { x: 380, y: 300, lab: '06 · x-axis label · mono 10/500' },
              ].map((c, i) => (
                <g key={i}>
                  <circle cx={c.x} cy={c.y} r="3" fill="#0F1729"/>
                  <text x={c.x + 8} y={c.y + 3} fontFamily="JetBrains Mono" fontSize="10" fill="#0F1729">{c.lab}</text>
                </g>
              ))}
            </svg>
          </div>
          <div className="anatomy-key">
            <KV k="01" v="Y-axis tick — mono 10 px / 500 / fg-3. Max 6 ticks; right-aligned, 6 px gutter."/>
            <KV k="02" v="Plot area — 8 px padding top/right; 22 px bottom for x-labels; 30 px left for y-labels."/>
            <KV k="03" v="Threshold — 1 px dashed (3,3), fg-3. Label right-aligned, mono 9.5, caps, 4 px above the line."/>
            <KV k="04" v="Series line — 1.5 px, round caps + joins. 1.75 px on hover."/>
            <KV k="05" v="Area fill — vertical gradient from series color at 22 % alpha to 0 % at the baseline."/>
            <KV k="06" v="X-axis tick — mono 10 px / 500 / fg-3, centered under the data point."/>
          </div>
        </div>
      </Card>
    </Section>
  );
}

// ---- 4. Chart type catalog ------------------------------------------------
const TYPES = [
  {
    name: 'Line',
    when: 'Continuous change over time. Most-used chart in the system.',
    tiers: 'sparkline · micro · standard · feature',
    body: (
      <div className="type-tiers">
        <div><div className="type-tier-lab mono">sparkline</div><Sparkline values={DATA.line} color="#22D3EE" area={false}/></div>
        <div><div className="type-tier-lab mono">micro</div><LineChart series={[DATA.line]} width={180} height={64} colors={['#10B981']} padding={{top:6,right:6,bottom:6,left:6}}/></div>
        <div><div className="type-tier-lab mono">standard</div><LineChart series={[DATA.line]} width={320} height={140} colors={['#F59E0B']} axes grid ticks={3} xLabels={['W1','W8','W16']}/></div>
      </div>
    ),
  },
  {
    name: 'Area',
    when: 'When a single line\'s magnitude matters as much as its shape — cumulative counts, volume.',
    tiers: 'sparkline · micro · standard · feature',
    body: (
      <div className="type-tiers">
        <div><div className="type-tier-lab mono">sparkline</div><Sparkline values={DATA.line} color="#22D3EE" area/></div>
        <div><div className="type-tier-lab mono">micro</div><LineChart series={[DATA.line]} width={180} height={64} colors={['#22D3EE']} area padding={{top:6,right:6,bottom:6,left:6}}/></div>
        <div><div className="type-tier-lab mono">standard</div><LineChart series={[DATA.line]} width={320} height={140} colors={['#818CF8']} area axes grid ticks={3} xLabels={['W1','W8','W16']}/></div>
      </div>
    ),
  },
  {
    name: 'Bar (vertical)',
    when: 'Discrete categories — months, hosts, types. Always start the axis at zero.',
    tiers: 'micro · standard · feature',
    body: (
      <div className="type-tiers">
        <div><div className="type-tier-lab mono">micro</div><BarV values={DATA.bar} width={180} height={64} color="#10B981"/></div>
        <div><div className="type-tier-lab mono">standard</div><BarV values={DATA.bar} xLabels={DATA.barXL} width={320} height={140} color="#10B981" axes grid ticks={3}/></div>
        <div><div className="type-tier-lab mono">feature</div><BarV values={DATA.bar} xLabels={DATA.barXL} width={420} height={180} color="#F59E0B" axes grid ticks={5} threshold={{ value: 80, label: 'sla' }}/></div>
      </div>
    ),
  },
  {
    name: 'Bar (horizontal)',
    when: 'Ranked categories with longer labels — hostnames, file paths, top-N lists.',
    tiers: 'standard · feature',
    body: (
      <div className="type-tiers">
        <div><div className="type-tier-lab mono">standard</div><BarH items={DATA.barH} width={320} height={140} tone="light"/></div>
        <div><div className="type-tier-lab mono">feature</div><BarH items={DATA.barH} width={460} height={180} tone="light"/></div>
      </div>
    ),
  },
  {
    name: 'Stacked bar',
    when: 'Composition over time. Use ≤ 4 segments; switch to percent-normalized when totals diverge.',
    tiers: 'standard · feature',
    body: (
      <div className="type-tiers">
        <div><div className="type-tier-lab mono">standard · absolute</div><StackedBar stacks={DATA.stacks} width={320} height={140} axes grid ticks={3}/></div>
        <div><div className="type-tier-lab mono">feature · normalized</div><StackedBar stacks={DATA.stacks} width={420} height={180} axes grid ticks={4} normalized/></div>
      </div>
    ),
  },
  {
    name: 'Donut / ring',
    when: 'Composition at a glance — never more than 5 slices. Show the total in the center.',
    tiers: 'micro · standard',
    body: (
      <div className="type-tiers">
        <div><div className="type-tier-lab mono">micro</div><Donut slices={DATA.donut} width={84} height={84} thickness={9}/></div>
        <div><div className="type-tier-lab mono">standard · total</div><Donut slices={DATA.donut} width={140} height={140} thickness={14} centerValue="267" centerLabel="ind."/></div>
        <div><div className="type-tier-lab mono">feature · with legend</div>
          <div className="donut-with-legend">
            <Donut slices={DATA.donut} width={140} height={140} thickness={14} centerValue="267" centerLabel="ind."/>
            <ul className="donut-legend">
              <li><span className="dot" style={{background:'#10B981'}}/>life<span className="mono v">134</span></li>
              <li><span className="dot" style={{background:'#818CF8'}}/>software<span className="mono v">72</span></li>
              <li><span className="dot" style={{background:'#22D3EE'}}/>default<span className="mono v">45</span></li>
              <li><span className="dot" style={{background:'#F59E0B'}}/>climate<span className="mono v">16</span></li>
            </ul>
          </div>
        </div>
      </div>
    ),
  },
  {
    name: 'Heatmap',
    when: 'Two-dimensional density — calendar/hour, host/metric. Single-hue scale of the relevant domain color.',
    tiers: 'standard · feature',
    body: (
      <div className="type-tiers">
        <div><div className="type-tier-lab mono">standard · 7 × 24</div>
          <Heatmap data={DATA.heatmap} width={320} height={110}
                   baseColor="#10B981" axes
                   yLabels={['M','T','W','T','F','S','S']}
                   xLabels={['0','','','','','','6','','','','','','12','','','','','','18','','','','','23']}/>
        </div>
        <div><div className="type-tier-lab mono">feature · 7 × 24</div>
          <Heatmap data={DATA.heatmap} width={460} height={140}
                   baseColor="#22D3EE" axes
                   yLabels={['Mon','Tue','Wed','Thu','Fri','Sat','Sun']}
                   xLabels={['0','','','','','','6','','','','','','12','','','','','','18','','','','','23']}/>
        </div>
      </div>
    ),
  },
  {
    name: 'Status timeline',
    when: 'Status of N services / hosts across a window of time. Color = semantic status (ok / warn / error / idle).',
    tiers: 'standard · feature',
    body: (
      <div className="type-tiers">
        <div><div className="type-tier-lab mono">standard · 4 tracks</div>
          <StatusTimeline tracks={DATA.timeline} width={320} height={150} range={[0,100]} axes
                          xLabels={['-24h','-18','-12','-6','now']}/>
        </div>
        <div><div className="type-tier-lab mono">feature · with marker</div>
          <StatusTimeline tracks={DATA.timeline} width={460} height={170} range={[0,100]} axes
                          xLabels={['-24h','-18','-12','-6','now']}
                          marker={{ x: 64, label: 'incident #142' }}/>
        </div>
      </div>
    ),
  },
];
function TypeCatalog() {
  return (
    <Section eyebrow="04 · TYPE CATALOG" title="The eight chart types"
             sub="Pick the lowest-cost chart that answers the question. If two work, pick the more compact one.">
      <div className="type-list">
        {TYPES.map(t => (
          <div className="type-row" key={t.name}>
            <div className="type-meta">
              <div className="type-name">{t.name}</div>
              <div className="type-tiers-lab mono muted">{t.tiers}</div>
              <p className="type-when">{t.when}</p>
            </div>
            <div className="type-examples">{t.body}</div>
          </div>
        ))}
      </div>
    </Section>
  );
}

// ---- 5. Color & series ----------------------------------------------------
function ColorSeries() {
  const seriesNames = ['cyan', 'emerald', 'amber', 'indigo', 'violet', 'rose'];
  return (
    <Section eyebrow="05 · COLOR" title="Series color"
             sub="One rule. Single-series charts inherit the domain color of their host (StatTile bar, panel eyebrow, hierarchy swatch). Multi-series charts cycle the canonical Heimdall palette in fixed order — never reshuffle by alphabet or value.">
      <div className="color-grid">
        <Card label="01 · SINGLE-SERIES — INHERIT" tone="light">
          <p className="card-prose">
            A chart inside an emerald-marked StatTile draws in emerald. A chart inside an amber pipeline panel draws in amber. The chart is never an independent voice.
          </p>
          <div className="single-series-row">
            {[
              { c: '#10B981', n: 'life',     stat: 'StatTile · emerald' },
              { c: '#F59E0B', n: 'climate',  stat: 'StatTile · amber' },
              { c: '#818CF8', n: 'software', stat: 'StatTile · indigo' },
              { c: '#22D3EE', n: 'default',  stat: 'StatTile · cyan' },
            ].map((d, i) => (
              <div className="single-series-tile" key={i}>
                <div className="sst-bar" style={{ background: d.c }}/>
                <div className="sst-body">
                  <div className="eyebrow">{d.stat}</div>
                  <LineChart series={[DATA.line]} width={180} height={56} colors={[d.c]} area
                             padding={{top:4,right:4,bottom:4,left:4}}/>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card label="02 · MULTI-SERIES — CYCLE" tone="light">
          <p className="card-prose">
            Fixed order: <span className="mono">cyan → emerald → amber → indigo → violet → rose</span>. Series 1 is always cyan, series 2 always emerald. This is what makes two adjacent charts comparable.
          </p>
          <div className="series-cycle">
            {SERIES.map((c, i) => (
              <div className="series-cycle-item" key={i}>
                <span className="dot" style={{ background: c }}/>
                <span className="mono">{String(i+1).padStart(2,'0')}</span>
                <span className="cycle-name">{seriesNames[i]}</span>
                <span className="mono muted">{c.toLowerCase()}</span>
              </div>
            ))}
          </div>
          <div className="series-cycle-example">
            <StackedBar stacks={DATA.stacks} width={460} height={150} axes grid ticks={3}/>
          </div>
        </Card>

        <Card label="03 · LIMITS" tone="light">
          <ul className="limits">
            <li><span className="mono">≤ 1</span> series at sparkline + micro tiers.</li>
            <li><span className="mono">≤ 3</span> series at standard tier.</li>
            <li><span className="mono">≤ 6</span> series at feature tier — beyond, the chart is the wrong shape.</li>
            <li><span className="mono">≤ 5</span> slices in a donut. The 6th is <span className="mono">other</span>.</li>
            <li><span className="mono">≤ 4</span> segments in a stacked bar.</li>
            <li>Never use color alone to convey magnitude — pair with a value or a length.</li>
          </ul>
        </Card>
      </div>
    </Section>
  );
}

// ---- 6. Annotations -------------------------------------------------------
function Annotations() {
  return (
    <Section eyebrow="06 · ANNOTATIONS" title="Threshold lines + event markers"
             sub="Two — and only two — overlays. Both available at standard and feature tiers, never at micro/sparkline.">
      <div className="ann-grid">
        <Card label="THRESHOLD · TARGET LINE" tone="light">
          <div className="card-figure">
            <LineChart series={[DATA.line]} width={420} height={180} colors={['#F59E0B']} area
                       axes grid ticks={4} xLabels={['W1','W6','W12','W18']}
                       threshold={{ value: 40, label: 'target' }}/>
          </div>
          <ul className="rule-list">
            <li>1 px dashed line in <span className="mono">fg-3</span>, never colored.</li>
            <li>Label right-aligned, mono 9.5 px caps, sits 4 px above the line.</li>
            <li>Max one threshold per chart. Multiple targets = use a separate panel.</li>
            <li>If the threshold is exceeded, the series above it does <em>not</em> recolor — the value is what tells the story.</li>
          </ul>
        </Card>

        <Card label="EVENT MARKER · TIMELINE" tone="light">
          <div className="card-figure">
            <LineChart series={[DATA.line]} width={420} height={180} colors={['#22D3EE']} area
                       axes grid ticks={4} xLabels={['W1','W6','W12','W18']}
                       markers={[{ x: 8, label: 'release 1.4' }, { x: 14, label: 'incident #142' }]}/>
          </div>
          <ul className="rule-list">
            <li>2 px dashed vertical line + 3 px amber dot at the top.</li>
            <li>Label mono 9.5 px, caps, deep-amber, anchored top-left of the dot.</li>
            <li>Max 4 markers per chart. Beyond that, switch to a status timeline.</li>
            <li>Markers are always amber — semantic status of the event lives in the label copy.</li>
          </ul>
        </Card>

        <Card label="MARKER ON STATUS TIMELINE" tone="light" style={{gridColumn:'1 / -1'}}>
          <div className="card-figure">
            <StatusTimeline tracks={DATA.timeline} width={780} height={180} range={[0,100]} axes
                            xLabels={['-24h','-20','-16','-12','-8','-4','now']}
                            marker={{ x: 64, label: 'incident #142' }}/>
          </div>
        </Card>
      </div>
    </Section>
  );
}

// ---- 7. Surfaces ---------------------------------------------------------
function Surfaces() {
  return (
    <Section eyebrow="07 · SURFACES" title="Light + dark canvas"
             sub="Series colors don't change between canvases. Gridlines + axis labels remap to the canvas border / fg-3 of that mode.">
      <div className="surface-grid">
        <Card label="LIGHT CANVAS · CONTEXT STUDIO" tone="light">
          <div className="surface-chart">
            <LineChart series={[DATA.line, DATA.line2]} width={460} height={200}
                       colors={['#22D3EE','#818CF8']} area
                       axes grid ticks={4} xLabels={['W1','W6','W12','W18']}
                       threshold={{ value: 40, label: 'target' }}/>
          </div>
          <div className="surface-foot">
            <KV k="GRID"   v={<span className="mono">#EEF1F4</span>}/>
            <KV k="LABEL"  v={<span className="mono">#64748B</span>}/>
            <KV k="BORDER" v={<span className="mono">#E5E9EE</span>}/>
          </div>
        </Card>

        <Card label="DARK CANVAS · HOMELAB DASHBOARD" tone="dark">
          <div className="surface-chart">
            <LineChart series={[DATA.line, DATA.line2]} width={460} height={200}
                       colors={['#22D3EE','#818CF8']} area
                       axes grid ticks={4} xLabels={['W1','W6','W12','W18']}
                       threshold={{ value: 40, label: 'target' }}
                       tone="dark"/>
          </div>
          <div className="surface-foot">
            <KV k="GRID"   v={<span className="mono">#1B2949</span>}/>
            <KV k="LABEL"  v={<span className="mono">#64748B</span>}/>
            <KV k="BORDER" v={<span className="mono">#243763</span>}/>
          </div>
        </Card>
      </div>
    </Section>
  );
}

// ---- 8. Interactivity (feature tier) -------------------------------------
function Interactivity() {
  return (
    <Section eyebrow="08 · INTERACTION" title="Tooltip on feature tier"
             sub="The only chart-level interaction. Hover anywhere along the plot — the cursor snaps to the nearest data column.">
      <Card label="HOVER · TRY IT" tone="light">
        <div className="interaction-chart">
          <LineChart series={[DATA.line, DATA.line2]} width={920} height={300}
                     colors={['#22D3EE','#818CF8']} area
                     axes grid ticks={5}
                     xLabels={['W1','W3','W6','W9','W12','W15','W18','W20']}
                     threshold={{ value: 40, label: 'target' }}
                     markers={[{ x: 8, label: 'release 1.4' }]}
                     tooltip/>
        </div>
        <div className="interaction-rules">
          <KV k="TRIGGER"  v="mousemove on the plot area · snaps to nearest column"/>
          <KV k="CARD"     v={<span>shell-bg <span className="mono">#0F1729</span> @ 96 % alpha · 6 px radius · 1 px <span className="mono">#243763</span> border</span>}/>
          <KV k="HEADER"   v="x-label · mono 9.5 px caps · shell-fg-2"/>
          <KV k="ROWS"     v="6 px swatch + mono 10.5 px value, one row per series"/>
          <KV k="OVERFLOW" v="card flips to the left side of the cursor when it would clip the right edge"/>
        </div>
      </Card>
    </Section>
  );
}

// ---- 9. Do / Don't --------------------------------------------------------
const RULES = [
  {
    do:  'Inherit the host\'s domain color for single-series charts.',
    dont: 'Pick a chart color independent of context.',
    sample: ['#10B981', null, 'StatTile bar emerald → chart emerald'],
  },
  {
    do:  'Start the y-axis at zero on bar charts.',
    dont: 'Crop the baseline to exaggerate differences.',
    sample: null,
  },
  {
    do:  'Drop annotations when the tier doesn\'t support them.',
    dont: 'Cram a legend into a micro chart.',
    sample: null,
  },
  {
    do:  'Use a single-hue scale for heatmap density.',
    dont: 'Use a rainbow ramp — non-perceptual, color-blind hostile.',
    sample: null,
  },
  {
    do:  'Limit donuts to 5 slices and label them in a legend.',
    dont: 'Slice further and label inside the ring.',
    sample: null,
  },
  {
    do:  'Animate transitions only on data refresh (≤ 180 ms ease).',
    dont: 'Animate axes, gridlines, or hover state.',
    sample: null,
  },
];
function DoDont() {
  return (
    <Section eyebrow="09 · RULES" title="Do / don't"
             sub="The short list. Read the type catalog and tier specs above for the long one.">
      <div className="dodont-grid">
        {RULES.map((r, i) => (
          <div className="dodont-row" key={i}>
            <div className="dd-cell yes">
              <div className="dd-tag mono">DO</div>
              <div className="dd-text">{r.do}</div>
            </div>
            <div className="dd-cell no">
              <div className="dd-tag mono">DON'T</div>
              <div className="dd-text">{r.dont}</div>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

// ---- Footer ---------------------------------------------------------------
function Footer() {
  return (
    <footer className="doc-foot">
      <div className="doc-foot-inner">
        <div className="eyebrow">CHANGELOG</div>
        <ul className="changelog">
          <li><span className="mono ver">v2.4</span> Charts spec page — 4 tiers, 8 types, threshold + marker annotations, light + dark canvas.</li>
          <li><span className="mono ver">v2.3</span> StatTile · added sparkline slot (bottom-right, 88 × 28).</li>
          <li><span className="mono ver">v2.2</span> Domain palette codified: emerald · amber · indigo · cyan.</li>
        </ul>
        <div className="doc-foot-meta mono muted">
          Primitives <code>charts-spec/primitives.jsx</code> · Spec page <code>charts-spec.html</code> · Last updated 2026-05-23
        </div>
      </div>
    </footer>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<Page/>);
