import { PageHeader, ShowcaseSection, DemoGrid, PropsTable, PropRow } from '../components/ShowcaseSection'

const mono = 'var(--font-mono, monospace)'
const fg1 = 'rgb(var(--canvas-fg-1, 17 24 39))'
const fg2 = 'rgb(var(--canvas-fg-2, 55 65 81))'
const fg3 = 'rgb(var(--canvas-fg-3, 107 114 128))'
const border = 'rgb(var(--canvas-border, 229 231 235))'

type SwatchProps = { name: string; value: string; token?: string; textDark?: boolean }

function Swatch({ name, value, token, textDark }: SwatchProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ width: '100%', height: 48, background: value, borderRadius: 6, border: `1px solid ${border}` }} />
      <div style={{ fontFamily: mono, fontSize: 11, color: fg1, fontWeight: 600 }}>{name}</div>
      <div style={{ fontFamily: mono, fontSize: 10, color: fg3 }}>{value}</div>
      {token && <div style={{ fontFamily: mono, fontSize: 10, color: fg3 }}>{token}</div>}
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
