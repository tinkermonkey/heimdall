import { Icon, Button, Chip, Badge, StatusBadge } from './index'

export default function App() {
  return (
    <div className="min-h-screen p-8" style={{ backgroundColor: 'rgb(var(--canvas-bg))' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '2.25rem', fontWeight: '800', marginBottom: '1rem', color: 'rgb(var(--canvas-fg-1))' }}>
          Heimdall Design System
        </h1>
        <p style={{ color: 'rgb(var(--canvas-fg-2))', marginBottom: '2rem' }}>Phase 2: Primitive Components</p>

        {/* Icons Section */}
        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '1rem', color: 'rgb(var(--canvas-fg-1))' }}>
            Icons
          </h2>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <Icon name="dashboard" size={24} />
            <Icon name="plus" size={24} />
            <Icon name="check" size={24} />
            <Icon name="search" size={24} />
            <Icon name="settings" size={24} />
          </div>
        </section>

        {/* Buttons Section */}
        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '1rem', color: 'rgb(var(--canvas-fg-1))' }}>
            Buttons
          </h2>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="danger">Delete</Button>
            <Button variant="link">Link</Button>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <Button variant="primary" size="sm">
              Small
            </Button>
            <Button variant="secondary" size="sm">
              Secondary
            </Button>
            <Button variant="primary" disabled>
              Disabled
            </Button>
          </div>
        </section>

        {/* Chips Section */}
        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '1rem', color: 'rgb(var(--canvas-fg-1))' }}>
            Chips
          </h2>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
            <Chip variant="cyan">cyan</Chip>
            <Chip variant="amber">amber</Chip>
            <Chip variant="violet">violet</Chip>
            <Chip variant="emerald">emerald</Chip>
            <Chip variant="rose">rose</Chip>
            <Chip variant="neutral">neutral</Chip>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <Chip form="env">production</Chip>
            <Chip form="version">v1.4.2</Chip>
            <Chip form="id-tag">cls_4f3a7e</Chip>
          </div>
        </section>

        {/* Badges Section */}
        <section>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '1rem', color: 'rgb(var(--canvas-fg-1))' }}>
            Badges
          </h2>
          <div style={{ display: 'flex', gap: '2rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <Badge color="cyan" />
            <Badge color="emerald" />
            <Badge color="amber" />
            <Badge color="rose" />
            <StatusBadge color="cyan" pulse />
            <StatusBadge color="emerald" pulse />
          </div>
        </section>
      </div>
    </div>
  )
}
