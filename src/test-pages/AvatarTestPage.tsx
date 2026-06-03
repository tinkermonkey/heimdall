import { Avatar } from '../components/Avatar'

export default function AvatarTestPage() {
  const testNames = [
    'Ada Lovelace',
    'Grace Hopper',
    'Alan Turing',
    'Katherine Johnson',
    'A',
    'Single',
  ]

  const imageUrl = 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=64&h=64&fit=crop'

  return (
    <div style={{ padding: '22px 26px 32px', backgroundColor: 'rgb(var(--canvas-bg))', minHeight: '100vh' }}>
      {/* Section: All Sizes with Initials */}
      <section style={{ marginBottom: '40px' }}>
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'rgb(var(--canvas-fg-3))',
            marginBottom: '14px',
          }}
        >
          Avatar · All Sizes (Initials)
        </div>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <Avatar name="Ada Lovelace" size="xs" />
          <Avatar name="Ada Lovelace" size="sm" />
          <Avatar name="Ada Lovelace" size="md" />
          <Avatar name="Ada Lovelace" size="lg" />
        </div>
      </section>

      {/* Section: Both Shapes */}
      <section style={{ marginBottom: '40px' }}>
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'rgb(var(--canvas-fg-3))',
            marginBottom: '14px',
          }}
        >
          Avatar · Both Shapes
        </div>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <Avatar name="Grace Hopper" size="md" shape="circle" />
          <Avatar name="Katherine Johnson" size="md" shape="rounded" />
        </div>
      </section>

      {/* Section: Deterministic Gradients */}
      <section style={{ marginBottom: '40px' }}>
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'rgb(var(--canvas-fg-3))',
            marginBottom: '14px',
          }}
        >
          Avatar · Deterministic Gradients (Same Name = Same Color)
        </div>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
          <Avatar name="Ada Lovelace" size="lg" />
          <Avatar name="Ada Lovelace" size="lg" />
          <Avatar name="Grace Hopper" size="lg" />
          <Avatar name="Grace Hopper" size="lg" />
          <Avatar name="Alan Turing" size="lg" />
          <Avatar name="Alan Turing" size="lg" />
        </div>
      </section>

      {/* Section: Image with Fallback */}
      <section style={{ marginBottom: '40px' }}>
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'rgb(var(--canvas-fg-3))',
            marginBottom: '14px',
          }}
        >
          Avatar · Image with Fallback to Initials
        </div>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <Avatar name="Ada Lovelace" size="md" src={imageUrl} />
          <Avatar name="Grace Hopper" size="md" src="https://invalid-url-that-will-fail.com/image.jpg" />
        </div>
      </section>

      {/* Section: All Status Colors */}
      <section style={{ marginBottom: '40px' }}>
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'rgb(var(--canvas-fg-3))',
            marginBottom: '14px',
          }}
        >
          Avatar · With Status Indicators
        </div>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
          <Avatar name="Ada Lovelace" size="md" status="emerald" />
          <Avatar name="Grace Hopper" size="md" status="amber" />
          <Avatar name="Alan Turing" size="md" status="rose" />
          <Avatar name="Katherine Johnson" size="md" status="cyan" />
          <Avatar name="Another User" size="md" status="violet" />
          <Avatar name="Test User" size="md" status="neutral" />
        </div>
      </section>

      {/* Section: Status with Different Sizes */}
      <section style={{ marginBottom: '40px' }}>
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'rgb(var(--canvas-fg-3))',
            marginBottom: '14px',
          }}
        >
          Avatar · Status with All Sizes
        </div>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <Avatar name="Ada Lovelace" size="xs" status="emerald" />
          <Avatar name="Grace Hopper" size="sm" status="amber" />
          <Avatar name="Alan Turing" size="md" status="rose" />
          <Avatar name="Katherine Johnson" size="lg" status="cyan" />
        </div>
      </section>

      {/* Section: Various Names */}
      <section style={{ marginBottom: '40px' }}>
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'rgb(var(--canvas-fg-3))',
            marginBottom: '14px',
          }}
        >
          Avatar · Various Names
        </div>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
          {testNames.map((name) => (
            <div key={name} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <Avatar name={name} size="md" />
              <span style={{ fontSize: '12px', color: 'rgb(var(--canvas-fg-2))' }}>{name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Section: Decorative Avatar */}
      <section style={{ marginBottom: '40px' }}>
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'rgb(var(--canvas-fg-3))',
            marginBottom: '14px',
          }}
        >
          Avatar · Decorative (aria-hidden)
        </div>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <Avatar name="Ada Lovelace" size="md" decorative />
            <span>Ada Lovelace</span>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <Avatar name="Grace Hopper" size="md" decorative />
            <span>Grace Hopper</span>
          </div>
        </div>
      </section>
    </div>
  )
}
