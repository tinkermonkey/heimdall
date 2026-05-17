import { Button, Chip, Badge, StatusBadge, Icon } from '@heimdall/ui'

export default function PrimitivesShowcase() {
  return (
    <div>
      {/* Buttons */}
      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 600 }}>Buttons</h2>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Danger</Button>
          <Button variant="primary" disabled>
            Disabled
          </Button>
        </div>
      </section>

      {/* Button Sizes */}
      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 600 }}>Button Sizes</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <Button size="sm">Small</Button>
          <Button>Medium</Button>
          <Button size="lg">Large</Button>
        </div>
      </section>

      {/* Buttons with Icons */}
      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 600 }}>Buttons with Icons</h2>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <Button>
            <Icon name="plus" size={16} /> Create
          </Button>
          <Button variant="secondary">
            <Icon name="download" size={16} /> Download
          </Button>
          <Button variant="ghost">
            <Icon name="trash" size={16} /> Delete
          </Button>
        </div>
      </section>

      {/* Chips */}
      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 600 }}>Chips</h2>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <Chip variant="cyan">cyan</Chip>
          <Chip variant="emerald">emerald</Chip>
          <Chip variant="amber">amber</Chip>
          <Chip variant="violet">violet</Chip>
          <Chip variant="neutral">neutral</Chip>
        </div>
      </section>

      {/* Badges */}
      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 600 }}>Badges</h2>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <Badge color="cyan" />
          <Badge color="emerald" />
          <Badge color="amber" />
          <Badge color="violet" />
          <Badge color="rose" />
          <Badge color="neutral" />
        </div>
      </section>

      {/* Status Badges */}
      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 600 }}>Status Badges</h2>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <StatusBadge color="cyan" pulse />
          <StatusBadge color="emerald" />
          <StatusBadge color="amber" />
          <StatusBadge color="rose" />
        </div>
      </section>
    </div>
  )
}
