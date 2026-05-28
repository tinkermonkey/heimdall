import {
  Icon,
  Button,
  Chip,
  Badge,
  StatusBadge,
  VersionPill,
  type IconName,
  type ChipVariant,
  type ChipForm,
  type BadgeColor,
} from '@tinkermonkey/heimdall-ui'
import { BareSection, AxisRow, Caption } from '../components/BareSection'

const STATUS_COLORS: BadgeColor[] = ['emerald', 'amber', 'rose', 'cyan', 'violet', 'neutral']
const CHIP_VARIANTS: ChipVariant[] = ['emerald', 'amber', 'rose', 'cyan', 'violet', 'neutral']
const CHIP_FORMS: ChipForm[] = ['default', 'id-tag', 'version', 'env']

const ICON_SAMPLE: IconName[] = [
  'dashboard', 'schema', 'data', 'pipeline', 'graph', 'search', 'bell', 'plus', 'check', 'x',
  'chevronDown', 'menu', 'settings', 'alert', 'trash', 'edit', 'download', 'upload', 'eye',
  'clock', 'calendar', 'filter', 'link', 'lock', 'user', 'copy', 'info', 'help', 'star', 'heart',
  'palette', 'component', 'table', 'layout', 'moon', 'sun', 'bar-chart', 'trending-up', 'send',
  'bot', 'paperclip', 'pie-chart', 'file', 'zap', 'folder', 'tag', 'gitBranch',
]

export function BareIcon() {
  return (
    <BareSection name="Icon">
      <AxisRow label="default (size=24)">
        <Icon name="check" />
      </AxisRow>
      <AxisRow label="size">
        <Caption label="12"><Icon name="check" size={12} /></Caption>
        <Caption label="14"><Icon name="check" size={14} /></Caption>
        <Caption label="16"><Icon name="check" size={16} /></Caption>
        <Caption label="20"><Icon name="check" size={20} /></Caption>
        <Caption label="24"><Icon name="check" size={24} /></Caption>
        <Caption label="32"><Icon name="check" size={32} /></Caption>
      </AxisRow>
      <AxisRow label="catalogue">
        {ICON_SAMPLE.map(name => (
          <Caption key={name} label={name}>
            <Icon name={name} size={20} />
          </Caption>
        ))}
      </AxisRow>
    </BareSection>
  )
}

export function BareButton() {
  return (
    <BareSection name="Button">
      <AxisRow label="default">
        <Button>Default</Button>
      </AxisRow>
      <AxisRow label="variant">
        <Caption label="primary"><Button variant="primary">Primary</Button></Caption>
        <Caption label="accent"><Button variant="accent">Accent</Button></Caption>
        <Caption label="secondary"><Button variant="secondary">Secondary</Button></Caption>
        <Caption label="ghost"><Button variant="ghost">Ghost</Button></Caption>
        <Caption label="danger"><Button variant="danger">Danger</Button></Caption>
        <Caption label="link"><Button variant="link">Link</Button></Caption>
      </AxisRow>
      <AxisRow label="size">
        <Caption label="sm"><Button size="sm">Small</Button></Caption>
        <Caption label="md"><Button size="md">Medium</Button></Caption>
      </AxisRow>
      <AxisRow label="icon-only">
        <Caption label="primary"><Button icon aria-label="add"><Icon name="plus" size={16} /></Button></Caption>
        <Caption label="secondary"><Button variant="secondary" icon aria-label="more"><Icon name="moreHorizontal" size={16} /></Button></Caption>
        <Caption label="ghost"><Button variant="ghost" icon aria-label="settings"><Icon name="settings" size={16} /></Button></Caption>
      </AxisRow>
      <AxisRow label="state">
        <Caption label="disabled"><Button disabled>Disabled</Button></Caption>
        <Caption label="disabled secondary"><Button variant="secondary" disabled>Disabled</Button></Caption>
        <Caption label="disabled danger"><Button variant="danger" disabled>Disabled</Button></Caption>
      </AxisRow>
    </BareSection>
  )
}

export function BareChip() {
  return (
    <BareSection name="Chip">
      <AxisRow label="default">
        <Chip>Default</Chip>
      </AxisRow>
      <AxisRow label="variant">
        {CHIP_VARIANTS.map(v => (
          <Caption key={v} label={v}><Chip variant={v}>{v}</Chip></Caption>
        ))}
      </AxisRow>
      <AxisRow label="form">
        {CHIP_FORMS.map(f => (
          <Caption key={f} label={f}><Chip form={f}>{f === 'id-tag' ? 'cls_4f3a' : f === 'version' ? 'v0.1.0' : f === 'env' ? 'prod' : 'label'}</Chip></Caption>
        ))}
      </AxisRow>
    </BareSection>
  )
}

export function BareBadge() {
  return (
    <BareSection name="Badge">
      <AxisRow label="default">
        <Badge />
      </AxisRow>
      <AxisRow label="color">
        {STATUS_COLORS.map(c => (
          <Caption key={c} label={c}><Badge color={c} /></Caption>
        ))}
      </AxisRow>
      <AxisRow label="pulse">
        {STATUS_COLORS.map(c => (
          <Caption key={c} label={c}><Badge color={c} pulse /></Caption>
        ))}
      </AxisRow>
    </BareSection>
  )
}

export function BareStatusBadge() {
  return (
    <BareSection name="StatusBadge">
      <AxisRow label="default">
        <StatusBadge />
      </AxisRow>
      <AxisRow label="color">
        {STATUS_COLORS.map(c => (
          <Caption key={c} label={c}><StatusBadge color={c} /></Caption>
        ))}
      </AxisRow>
      <AxisRow label="pulse">
        {STATUS_COLORS.map(c => (
          <Caption key={c} label={c}><StatusBadge color={c} pulse /></Caption>
        ))}
      </AxisRow>
    </BareSection>
  )
}

export function BareVersionPill() {
  return (
    <BareSection name="VersionPill">
      <AxisRow label="default">
        <VersionPill>v0.1.0</VersionPill>
      </AxisRow>
      <AxisRow label="examples">
        <Caption label="semver"><VersionPill>v1.2.3</VersionPill></Caption>
        <Caption label="hash"><VersionPill>4f3a2b1</VersionPill></Caption>
        <Caption label="long"><VersionPill>v0.3.0-rc.4</VersionPill></Caption>
      </AxisRow>
    </BareSection>
  )
}
