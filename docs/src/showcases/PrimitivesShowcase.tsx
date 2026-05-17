import { useState } from 'react'
import { Icon, Button, Chip, Badge, StatusBadge, type IconName } from '@tinkermonkey/heimdall-ui'
import { PageHeader, ShowcaseSection, DemoRow, DemoCard, DemoGrid, PropsTable, PropRow } from '../components/ShowcaseSection'

const ICON_NAMES: IconName[] = [
  'dashboard', 'schema', 'data', 'pipeline', 'graph', 'search', 'bell', 'plus', 'check', 'x',
  'chevronDown', 'chevronUp', 'chevronLeft', 'chevronRight', 'menu', 'settings', 'alert', 'trash',
  'edit', 'download', 'upload', 'eye', 'eyeOff', 'clock', 'calendar', 'filter', 'link', 'lock',
  'unlock', 'user', 'copy', 'info', 'help', 'moreVertical', 'moreHorizontal', 'reload',
  'arrowRight', 'arrowLeft', 'arrowUp', 'arrowDown', 'star', 'heart', 'palette', 'component', 'table', 'layout',
]

const mono = 'var(--font-mono, monospace)'
const fg3 = 'rgb(var(--canvas-fg-3, 107 114 128))'
const fg2 = 'rgb(var(--canvas-fg-2, 55 65 81))'
const border = 'rgb(var(--canvas-border, 229 231 235))'

export function IconShowcase() {
  return (
    <div>
      <PageHeader name="Icon" description="SVG icon system. All icons are rendered via the Icon component from the ICONS map — never inline SVG." />
      <ShowcaseSection label="Sizes">
        <DemoRow>
          {([12, 14, 16, 18, 20, 24, 32] as const).map(s => (
            <div key={s} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <Icon name="schema" size={s} />
              <span style={{ fontFamily: mono, fontSize: 10, color: fg3 }}>{s}</span>
            </div>
          ))}
        </DemoRow>
      </ShowcaseSection>
      <ShowcaseSection label="All icons" description="Each icon is named as a key in the ICONS map. Use `name` to reference it.">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(88px, 1fr))', gap: 6 }}>
          {ICON_NAMES.map(name => (
            <div key={name} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '10px 6px', border: `1px solid ${border}`, borderRadius: 6, cursor: 'default' }}>
              <Icon name={name} size={18} />
              <span style={{ fontFamily: mono, fontSize: 9.5, color: fg3, textAlign: 'center', lineHeight: 1.3 }}>{name}</span>
            </div>
          ))}
        </div>
      </ShowcaseSection>
      <ShowcaseSection label="Props">
        <PropsTable>
          <PropRow name="name" type="IconName" description="Key from the ICONS map" />
          <PropRow name="size" type="number" def="24" description="Width and height in px" />
          <PropRow name="className" type="string" description="Additional CSS class names" />
        </PropsTable>
      </ShowcaseSection>
    </div>
  )
}

export function ButtonShowcase() {
  return (
    <div>
      <PageHeader name="Button" description="Primary interactive element. Five variants, two sizes. Accepts any button HTML attributes." />
      <ShowcaseSection label="Variants">
        <DemoRow>
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Danger</Button>
          <Button variant="link">Link</Button>
        </DemoRow>
      </ShowcaseSection>
      <ShowcaseSection label="Sizes">
        <DemoRow>
          <Button size="md">Medium (default)</Button>
          <Button size="sm">Small</Button>
        </DemoRow>
      </ShowcaseSection>
      <ShowcaseSection label="With icons">
        <DemoRow>
          <Button variant="primary"><Icon name="plus" size={14} /> Create</Button>
          <Button variant="secondary"><Icon name="download" size={14} /> Export</Button>
          <Button variant="ghost"><Icon name="filter" size={14} /> Filter</Button>
          <Button variant="danger"><Icon name="trash" size={14} /> Delete</Button>
        </DemoRow>
      </ShowcaseSection>
      <ShowcaseSection label="Disabled states">
        <DemoRow>
          <Button variant="primary" disabled>Primary</Button>
          <Button variant="secondary" disabled>Secondary</Button>
          <Button variant="ghost" disabled>Ghost</Button>
          <Button variant="danger" disabled>Danger</Button>
        </DemoRow>
      </ShowcaseSection>
      <ShowcaseSection label="Props">
        <PropsTable>
          <PropRow name="variant" type="'primary' | 'secondary' | 'ghost' | 'danger' | 'link'" def="'primary'" description="Visual style" />
          <PropRow name="size" type="'sm' | 'md'" def="'md'" description="Height: md=34px sm=28px" />
          <PropRow name="disabled" type="boolean" description="Native disabled attribute" />
          <PropRow name="children" type="ReactNode" description="Button label and/or icon" />
        </PropsTable>
      </ShowcaseSection>
    </div>
  )
}

export function ChipShowcase() {
  return (
    <div>
      <PageHeader name="Chip" description="Compact label for tags, statuses, and categories. Mono 11px, 3px radius." />
      <ShowcaseSection label="Variants">
        <DemoRow>
          <Chip variant="cyan">cyan</Chip>
          <Chip variant="emerald">emerald</Chip>
          <Chip variant="amber">amber</Chip>
          <Chip variant="violet">violet</Chip>
          <Chip variant="neutral">neutral</Chip>
        </DemoRow>
      </ShowcaseSection>
      <ShowcaseSection label="Status with dot" description="Pass a dot element before the label to show a status indicator.">
        <DemoRow>
          <Chip variant="emerald"><span style={{ width: 5, height: 5, borderRadius: '50%', background: 'currentColor', display: 'inline-block', marginRight: 5 }} />running</Chip>
          <Chip variant="amber"><span style={{ width: 5, height: 5, borderRadius: '50%', background: 'currentColor', display: 'inline-block', marginRight: 5 }} />degraded</Chip>
          <Chip variant="rose"><span style={{ width: 5, height: 5, borderRadius: '50%', background: 'currentColor', display: 'inline-block', marginRight: 5 }} />error</Chip>
          <Chip variant="neutral"><span style={{ width: 5, height: 5, borderRadius: '50%', background: 'currentColor', display: 'inline-block', marginRight: 5 }} />stopped</Chip>
        </DemoRow>
      </ShowcaseSection>
      <ShowcaseSection label="Props">
        <PropsTable>
          <PropRow name="variant" type="'cyan' | 'emerald' | 'amber' | 'violet' | 'rose' | 'neutral'" def="'neutral'" description="Color scheme" />
          <PropRow name="children" type="ReactNode" description="Label content" />
        </PropsTable>
      </ShowcaseSection>
    </div>
  )
}

export function BadgeShowcase() {
  return (
    <div>
      <PageHeader name="Badge / StatusBadge" description="Color indicator dots. Badge is static; StatusBadge supports a pulse animation for live states." />
      <ShowcaseSection label="Badge — all colors">
        <DemoRow>
          {(['cyan', 'emerald', 'amber', 'violet', 'rose', 'neutral'] as const).map(c => (
            <div key={c} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <Badge color={c} />
              <span style={{ fontFamily: mono, fontSize: 10, color: fg3 }}>{c}</span>
            </div>
          ))}
        </DemoRow>
      </ShowcaseSection>
      <ShowcaseSection label="StatusBadge — with pulse">
        <DemoRow gap={20}>
          {(['cyan', 'emerald', 'amber', 'rose'] as const).map(c => (
            <div key={c} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <StatusBadge color={c} pulse />
              <span style={{ fontSize: 12, color: fg2 }}>{c === 'cyan' ? 'updating' : c === 'emerald' ? 'running' : c === 'amber' ? 'degraded' : 'error'}</span>
            </div>
          ))}
        </DemoRow>
      </ShowcaseSection>
      <ShowcaseSection label="StatusBadge — static">
        <DemoRow gap={20}>
          {(['cyan', 'emerald', 'amber', 'rose', 'neutral'] as const).map(c => (
            <div key={c} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <StatusBadge color={c} />
              <span style={{ fontSize: 12, color: fg2 }}>{c}</span>
            </div>
          ))}
        </DemoRow>
      </ShowcaseSection>
      <ShowcaseSection label="Props">
        <PropsTable>
          <PropRow name="color" type="'cyan' | 'emerald' | 'amber' | 'violet' | 'rose' | 'neutral'" description="Dot color" />
          <PropRow name="pulse" type="boolean" def="false" description="(StatusBadge only) Enables the glow pulse animation" />
        </PropsTable>
      </ShowcaseSection>
    </div>
  )
}
