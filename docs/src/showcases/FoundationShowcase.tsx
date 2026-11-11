import { PageHeader, ShowcaseSection, DemoGrid } from '../components/ShowcaseSection'

const mono = 'var(--font-mono, monospace)'
const fg1 = 'rgb(var(--canvas-fg-1, 17 24 39))'
const fg2 = 'rgb(var(--canvas-fg-2, 55 65 81))'
const fg3 = 'rgb(var(--canvas-fg-3, 107 114 128))'
const border = 'rgb(var(--canvas-border, 229 231 235))'

type SwatchProps = { name: string; value: string; token?: string; textDark?: boolean }

function Swatch({ name, value, token }: SwatchProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ width: '100%', height: 48, background: value, borderRadius: 6, border: `1px solid ${border}` }} />
      <div style={{ fontFamily: mono, fontSize: 11, color: fg1, fontWeight: 600 }}>{name}</div>
      <div style={{ fontFamily: mono, fontSize: 10, color: fg3 }}>{value}</div>
      {token && <div style={{ fontFamily: mono, fontSize: 10, color: fg3 }}>{token}</div>}
    </div>
  )
}

// Values from src/tokens/tokens.css: light is :root, dark is body.dark-canvas. [fg, bg, border].
type Triplet = [string, string | undefined, string | undefined]
const TINT_TOKENS: { token: string; light: Triplet; dark: Triplet; tint?: [string, string] }[] = [
  { token: '--semantic-cyan-{fg,bg,border}', light: ['14 116 144', '236 255 255', '165 243 252'], dark: ['103 232 249', '15 51 70', '19 87 108'] },
  { token: '--semantic-amber-{fg,bg,border}', light: ['146 64 14', '255 251 235', '253 230 138'], dark: ['252 211 77', '48 42 34', '93 68 29'] },
  { token: '--semantic-violet-{fg,bg,border}', light: ['91 33 182', '245 243 255', '221 214 254'], dark: ['196 181 253', '31 32 71', '56 45 111'] },
  { token: '--semantic-emerald-{fg,bg,border}', light: ['6 95 70', '236 253 245', '167 243 208'], dark: ['110 231 183', '12 46 53', '13 78 70'] },
  { token: '--semantic-rose-{fg,bg,border}', light: ['159 18 57', '255 241 242', '254 205 211'], dark: ['253 164 175', '48 27 47', '93 35 58'] },
  { token: '--semantic-neutral-{fg,bg,border}', light: ['71 85 105', '247 249 251', '229 233 238'], dark: ['203 213 225', '30 41 59', '51 65 85'] },
  { token: '--semantic-id-tag-{fg,bg,border}', light: ['100 116 139', '247 249 251', '229 233 238'], dark: ['148 163 184', '30 41 59', '51 65 85'] },
  { token: '--semantic-version-fg', light: ['180 83 9', undefined, undefined], dark: ['251 191 36', undefined, undefined], tint: ['rgba(245, 158, 11, 0.08)', 'rgba(245, 158, 11, 0.18)'] },
  { token: '--status-ok-{fg,bg}', light: ['21 128 61', '220 252 231', undefined], dark: ['134 239 172', '15 48 47', undefined] },
  { token: '--status-warn-{fg,bg}', light: ['133 77 14', '254 249 195', undefined], dark: ['253 224 71', '47 45 33', undefined] },
  { token: '--status-error-{fg,bg}', light: ['185 28 28', '254 226 226', undefined], dark: ['252 165 165', '47 28 43', undefined] },
]

const CANVAS_BG = { light: 'rgb(255 255 255)', dark: 'rgb(11 20 38)' }

function TintSample({ values, mode, tint }: { values: Triplet; mode: 'light' | 'dark'; tint?: [string, string] }) {
  const [fgV, bgV, borderV] = values
  const bg = bgV ? `rgb(${bgV})` : tint?.[0] ?? 'transparent'
  const bd = borderV ? `rgb(${borderV})` : tint?.[1] ?? (bgV ? `rgb(${bgV})` : 'transparent')
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 8px', background: CANVAS_BG[mode], borderRadius: 4 }}>
      <span style={{ fontFamily: mono, fontSize: 11, padding: '2px 7px', borderRadius: 4, color: `rgb(${fgV})`, background: bg, border: `1px solid ${bd}` }}>
        sample
      </span>
      <span style={{ fontFamily: mono, fontSize: 10, color: mode === 'light' ? 'rgb(107 114 128)' : 'rgb(148 163 184)', whiteSpace: 'nowrap' }}>
        {values.filter(Boolean).join(' / ')}
      </span>
    </div>
  )
}

function TintTable() {
  const th = { padding: '7px 12px', textAlign: 'left' as const, fontFamily: mono, fontSize: 10, fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: fg3, borderBottom: `1px solid ${border}` }
  const td = { padding: '6px 12px', borderBottom: `1px solid ${border}`, verticalAlign: 'middle' as const }
  return (
    <div style={{ overflowX: 'auto', border: `1px solid ${border}`, borderRadius: 8 }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={th}>Token</th>
            <th style={th}>Light canvas</th>
            <th style={th}>Dark canvas</th>
          </tr>
        </thead>
        <tbody>
          {TINT_TOKENS.map(r => (
            <tr key={r.token}>
              <td style={{ ...td, fontFamily: mono, fontSize: 11, color: fg1, whiteSpace: 'nowrap' }}>{r.token}</td>
              <td style={td}><TintSample values={r.light} mode="light" tint={r.tint} /></td>
              <td style={td}><TintSample values={r.dark} mode="dark" tint={r.tint} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function TypeSample({ size, weight, label, mono: isMono }: { size: number; weight: number; label: string; mono?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 20, paddingBottom: 12, borderBottom: `1px solid ${border}` }}>
      <div style={{ width: 160, fontFamily: 'var(--font-mono, monospace)', fontSize: 10, color: fg3, flexShrink: 0 }}>{label}</div>
      <div style={{ fontFamily: isMono ? 'var(--font-mono, monospace)' : 'var(--font-sans, Inter)', fontSize: size, fontWeight: weight, color: fg1, lineHeight: 1.4 }}>
        {isMono ? 'life.organism · cls_4f3a' : 'The quick brown fox jumped'}
      </div>
      <div style={{ fontFamily: mono, fontSize: 10, color: fg3, marginLeft: 'auto' }}>{size}px / {weight}</div>
    </div>
  )
}

export function ColorsShowcase() {
  return (
    <div>
      <PageHeader name="Colors" description="Semantic token system. Two surface layers (shell + canvas) and five accent colors. Never use raw hex — always reference tokens." />
      <ShowcaseSection label="Primary accent (amber)">
        <DemoGrid cols={3} gap={12}>
          <Swatch name="Amber" value="#F59E0B" token="--accent-primary" />
          <Swatch name="Amber hover" value="#D97706" token="--accent-primary-hover" />
          <Swatch name="Amber deep" value="#B45309" token="--accent-primary-deep" />
        </DemoGrid>
      </ShowcaseSection>
      <ShowcaseSection label="Secondary accents">
        <DemoGrid cols={5} gap={12}>
          <Swatch name="Emerald" value="#10B981" token="--status-emerald" />
          <Swatch name="Cyan" value="#22D3EE" token="--status-cyan" />
          <Swatch name="Violet" value="#A78BFA" token="--status-violet" />
          <Swatch name="Rose" value="#F43F5E" token="--status-rose" />
          <Swatch name="Neutral" value="#6B7280" token="--status-neutral" />
        </DemoGrid>
      </ShowcaseSection>
      <ShowcaseSection label="Canvas surface (light)">
        <DemoGrid cols={4} gap={12}>
          <Swatch name="Canvas bg" value="rgb(255 255 255)" token="--canvas-bg" />
          <Swatch name="Canvas bg-2" value="rgb(249 250 251)" token="--canvas-bg-2" />
          <Swatch name="Canvas card" value="rgb(255 255 255)" token="--canvas-card" />
          <Swatch name="Border" value="rgb(229 231 235)" token="--canvas-border" />
        </DemoGrid>
      </ShowcaseSection>
      <ShowcaseSection label="Canvas foreground">
        <DemoGrid cols={4} gap={12}>
          <Swatch name="FG-1" value="rgb(17 24 39)" token="--canvas-fg-1" />
          <Swatch name="FG-2" value="rgb(55 65 81)" token="--canvas-fg-2" />
          <Swatch name="FG-3" value="rgb(107 114 128)" token="--canvas-fg-3" />
          <Swatch name="FG-4" value="rgb(156 163 175)" token="--canvas-fg-4" />
        </DemoGrid>
      </ShowcaseSection>
      <ShowcaseSection label="Shell surface (always dark)">
        <DemoGrid cols={4} gap={12}>
          <Swatch name="Shell bg" value="#0B0F14" token="--shell-bg" />
          <Swatch name="Shell bg-2" value="#0F141B" token="--shell-bg-2" />
          <Swatch name="Shell surface" value="#131A23" token="--shell-surface" />
          <Swatch name="Shell surface-2" value="#1A2230" token="--shell-surface-2" />
        </DemoGrid>
      </ShowcaseSection>
      <ShowcaseSection
        label="Semantic and status tints"
        description="Text, background and border triplets for chips, callouts, status pills and tags; values are R G B, read as rgb(var(--token)). Changed in 0.11: every one of these has a body.dark-canvas value, so consumers need no dark-canvas override. The dark recipe is bg = 16% of the hue over --canvas-bg, border = 35%, fg = the -300 shade; every dark fg clears 4.5:1 on its bg and on --canvas-card. --semantic-version-fg sits on fixed alpha tints (--semantic-version-bg-alpha, --semantic-version-border-alpha)."
      >
        <TintTable />
      </ShowcaseSection>
      <ShowcaseSection
        label="Fixed in both canvas modes"
        description="These tokens have no body.dark-canvas value. Use them for a color that must match in both modes, such as a gradient stop or a filled danger button, instead of a -fg token, which flips. New in 0.11: --status-error-solid (the .btn--danger fill) and --status-{emerald,violet,neutral}-deep (avatar gradient stops). The base status hues (--status-emerald, --status-cyan, --status-ok and the rest), the alpha tints and --semantic-env-* stay fixed as well."
      >
        <DemoGrid cols={6} gap={12} minWidth={110}>
          <Swatch name="Error solid" value="rgb(185 28 28)" token="--status-error-solid" />
          <Swatch name="Cyan deep" value="rgb(14 180 160)" token="--status-cyan-deep" />
          <Swatch name="Emerald deep" value="rgb(6 95 70)" token="--status-emerald-deep" />
          <Swatch name="Rose deep" value="rgb(159 18 57)" token="--status-rose-deep" />
          <Swatch name="Violet deep" value="rgb(91 33 182)" token="--status-violet-deep" />
          <Swatch name="Neutral deep" value="rgb(71 85 105)" token="--status-neutral-deep" />
        </DemoGrid>
      </ShowcaseSection>
      <ShowcaseSection label="Status semantic mapping">
        <div style={{ fontFamily: mono, fontSize: 12, color: fg2, lineHeight: 2 }}>
          <div><span style={{ color: '#F59E0B' }}>Amber</span> — primary accent / highlight</div>
          <div><span style={{ color: '#10B981' }}>Emerald</span> — ok / running / success</div>
          <div><span style={{ color: '#F43F5E' }}>Rose</span> — error / failed</div>
          <div><span style={{ color: '#22D3EE' }}>Cyan</span> — updating / pulling / active</div>
          <div><span style={{ color: '#A78BFA' }}>Violet</span> — secondary accent</div>
          <div><span style={{ color: fg3 }}>Neutral</span> — stopped / idle</div>
        </div>
      </ShowcaseSection>
    </div>
  )
}

export function TypographyShowcase() {
  return (
    <div>
      <PageHeader name="Typography" description="Two typefaces only: Inter for UI/body, JetBrains Mono for identifiers, labels, and tabular data. Never mix in other fonts." />
      <ShowcaseSection label="Scale — Inter (sans)">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          <TypeSample size={24} weight={600} label="Page H1 · 24/600" />
          <TypeSample size={18} weight={600} label="Section H2 · 18/600" />
          <TypeSample size={15} weight={500} label="Card title · 15/500" />
          <TypeSample size={14} weight={400} label="Body default · 14/400" />
          <TypeSample size={13} weight={400} label="Body sm · 13/400" />
          <TypeSample size={12} weight={400} label="Caption · 12/400" />
        </div>
      </ShowcaseSection>
      <ShowcaseSection label="Scale — JetBrains Mono">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          <TypeSample size={13} weight={400} label="Identifier · 13/400" mono />
          <TypeSample size={12} weight={400} label="Code · 12/400" mono />
          <TypeSample size={11} weight={500} label="Eyebrow label · 11/500" mono />
          <TypeSample size={10} weight={400} label="Meta / caption · 10/400" mono />
        </div>
      </ShowcaseSection>
      <ShowcaseSection label="Rules">
        <div style={{ fontSize: 13, color: fg2, lineHeight: 1.8 }}>
          <div>· Sentence case for all headings and labels</div>
          <div>· UPPER MONO for eyebrow labels (section headers, table column headers, stat tile labels)</div>
          <div>· Identifiers always monospace lowercase: <span style={{ fontFamily: mono }}>life.organism</span>, <span style={{ fontFamily: mono }}>cls_4f3a</span></div>
          <div>· 10–11px mono eyebrows use <span style={{ fontFamily: mono }}>letter-spacing: 0.06–0.12em</span> and <span style={{ fontFamily: mono }}>--canvas-fg-3</span> color</div>
          <div>· Tabular numbers: <span style={{ fontFamily: mono }}>font-feature-settings: "tnum"</span> on all numeric data columns</div>
          <div>· No bold for body text — use weight 500 for emphasis within running text</div>
        </div>
      </ShowcaseSection>
    </div>
  )
}

export function SpacingShowcase() {
  const steps = [2, 4, 6, 8, 10, 12, 14, 16, 20, 24, 28, 32, 40, 48, 64]

  return (
    <div>
      <PageHeader name="Spacing" description="4px base grid. Use multiples of 4 for all layout dimensions. 8px for compact gaps, 16px for sections, 24–32px for canvas padding." />
      <ShowcaseSection label="Scale">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {steps.map(s => (
            <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 80, fontFamily: mono, fontSize: 11, color: fg3, textAlign: 'right' }}>{s}px</div>
              <div style={{ height: 16, background: '#22D3EE', opacity: 0.7, borderRadius: 2, width: s }} />
            </div>
          ))}
        </div>
      </ShowcaseSection>
      <ShowcaseSection label="Common usage">
        <div style={{ fontFamily: mono, fontSize: 12, color: fg2, lineHeight: 2 }}>
          <div>4px — icon-to-label gap, chip internal padding</div>
          <div>6px — button group gap, tight row spacing</div>
          <div>8px — standard gap for inline elements, stat grid gap</div>
          <div>12px — input internal padding, card header padding-y</div>
          <div>14px — stat grid column gap</div>
          <div>16px — section spacing, form field gap</div>
          <div>20–24px — card padding, panel body padding</div>
          <div>22px 26px 32px — canvas inner padding (top / sides / bottom)</div>
        </div>
      </ShowcaseSection>
    </div>
  )
}

export function RadiusShowcase() {
  const radii = [
    { name: 'Chips / inputs / buttons', value: '4–6px', px: 5 },
    { name: 'Cards / panels', value: '8px', px: 8 },
    { name: 'Modals only', value: '10–12px', px: 11 },
    { name: 'Dots / env badges (pill)', value: '999px', px: 999 },
  ]

  return (
    <div>
      <PageHeader name="Radius" description="Minimal, consistent corner radius. No pill shapes except status dots and environment badges." />
      <ShowcaseSection label="Scale">
        <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
          {radii.map(r => (
            <div key={r.name} style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'flex-start' }}>
              <div style={{ width: 80, height: 48, background: 'rgb(var(--canvas-bg-2, 249 250 251))', border: `1px solid ${border}`, borderRadius: Math.min(r.px, 12) }} />
              <div style={{ fontFamily: mono, fontSize: 11, color: fg1, fontWeight: 500 }}>{r.value}</div>
              <div style={{ fontSize: 12, color: fg3, maxWidth: 120 }}>{r.name}</div>
            </div>
          ))}
        </div>
      </ShowcaseSection>
    </div>
  )
}

export function UtilitiesShowcase() {
  return (
    <div>
      <PageHeader name="Utilities" description="Global utility classes shipped in the library stylesheet. Library-namespaced, so they never collide with a consumer's own utility names." />
      <ShowcaseSection
        label="heimdall-visually-hidden"
        description="Hides content visually and keeps it in the accessibility tree: the standard clip / 1px pattern (position: absolute, 1px × 1px, overflow: hidden, clip: rect(0, 0, 0, 0)). Library components use it for screen-reader-only text, such as the added and removed labels in the SideBySideDiff gutter, the counts in LinkCategoryFilter and the keyboard hint on layer-lanes nodes. It replaces Tailwind's sr-only in library code, so the library doesn't depend on the consumer's Tailwind build and can't override a consumer's own sr-only / md:not-sr-only. It ships only in @tinkermonkey/heimdall-ui/css; without that import the hidden text renders as visible text."
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', border: `1px solid ${border}`, borderRadius: 6, maxWidth: 360 }}>
          <span style={{ fontFamily: mono, fontSize: 12, color: fg1 }}>+ cls_organism</span>
          <span className="heimdall-visually-hidden">added</span>
          <span style={{ marginLeft: 'auto', fontFamily: mono, fontSize: 10, color: fg3 }}>"added" is read, not shown</span>
        </div>
        <pre style={{ margin: '10px 0 0', padding: '10px 12px', background: 'rgb(var(--canvas-bg-2))', border: `1px solid ${border}`, borderRadius: 6, fontFamily: mono, fontSize: 11.5, lineHeight: 1.6, color: fg2, overflowX: 'auto' }}>
          {`import '@tinkermonkey/heimdall-ui/css'

<button aria-describedby="row-hint">…</button>
<span id="row-hint" className="heimdall-visually-hidden">Enter opens the row</span>`}
        </pre>
      </ShowcaseSection>
    </div>
  )
}
