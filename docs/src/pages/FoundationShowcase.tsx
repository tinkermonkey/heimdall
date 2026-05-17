export default function FoundationShowcase() {
  const colors = [
    { name: 'Cyan', variable: '--status-cyan', rgb: 'rgb(34 211 238)' },
    { name: 'Emerald', variable: '--status-emerald', rgb: 'rgb(16 185 129)' },
    { name: 'Amber', variable: '--status-amber', rgb: 'rgb(245 158 11)' },
    { name: 'Violet', variable: '--status-violet', rgb: 'rgb(139 92 246)' },
    { name: 'Rose', variable: '--status-rose', rgb: 'rgb(244 63 94)' },
    { name: 'Neutral', variable: '--status-neutral', rgb: 'rgb(107 114 128)' },
  ]

  return (
    <div>
      {/* Colors */}
      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 600 }}>Colors</h2>

        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ margin: '0 0 12px 0', fontSize: '13px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Status Colors
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '12px' }}>
            {colors.map((color) => (
              <div key={color.name} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div
                  style={{
                    width: '100%',
                    height: '80px',
                    borderRadius: '6px',
                    border: '1px solid rgb(var(--canvas-border))',
                    backgroundColor: color.rgb,
                  }}
                />
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '2px' }}>{color.name}</div>
                  <div style={{ fontSize: '10px', color: 'rgb(var(--canvas-fg-3))', fontFamily: 'var(--font-mono)' }}>
                    {color.variable}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Canvas Colors */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ margin: '0 0 12px 0', fontSize: '13px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Canvas Colors
          </h3>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div
                style={{
                  width: '100%',
                  height: '60px',
                  borderRadius: '6px',
                  backgroundColor: 'rgb(var(--canvas-bg))',
                  border: '1px solid rgb(var(--canvas-border))',
                }}
              />
              <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '2px' }}>Background</div>
              <div style={{ fontSize: '10px', color: 'rgb(var(--canvas-fg-3))', fontFamily: 'var(--font-mono)' }}>
                --canvas-bg
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div
                style={{
                  width: '100%',
                  height: '60px',
                  borderRadius: '6px',
                  backgroundColor: 'rgb(var(--canvas-surface))',
                  border: '1px solid rgb(var(--canvas-border))',
                }}
              />
              <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '2px' }}>Surface</div>
              <div style={{ fontSize: '10px', color: 'rgb(var(--canvas-fg-3))', fontFamily: 'var(--font-mono)' }}>
                --canvas-surface
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div
                style={{
                  width: '100%',
                  height: '60px',
                  borderRadius: '6px',
                  backgroundColor: 'rgb(var(--canvas-card))',
                  border: '1px solid rgb(var(--canvas-border))',
                }}
              />
              <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '2px' }}>Card</div>
              <div style={{ fontSize: '10px', color: 'rgb(var(--canvas-fg-3))', fontFamily: 'var(--font-mono)' }}>
                --canvas-card
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Typography */}
      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 600 }}>Typography</h2>

        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ margin: '0 0 12px 0', fontSize: '13px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Type Scale
          </h3>
          <div style={{ display: 'grid', gap: '12px' }}>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '4px' }}>Extra Large (1.25rem, 700)</div>
            <div style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '4px' }}>Large (1.125rem, 600)</div>
            <div style={{ fontSize: '1rem', fontWeight: 500, marginBottom: '4px' }}>Medium (1rem, 500)</div>
            <div style={{ fontSize: '0.875rem', fontWeight: 400, marginBottom: '4px' }}>Small (0.875rem, 400)</div>
            <div style={{ fontSize: '0.75rem', fontWeight: 400, marginBottom: '4px' }}>Extra Small (0.75rem, 400)</div>
          </div>
        </div>

        <div>
          <h3 style={{ margin: '0 0 12px 0', fontSize: '13px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Font Families
          </h3>
          <div style={{ display: 'grid', gap: '12px' }}>
            <div style={{ fontFamily: 'var(--font-sans)' }}>Sans Serif (Inter) - Used for UI and body text</div>
            <div style={{ fontFamily: 'var(--font-mono)' }}>Monospace (JetBrains Mono) - Used for identifiers and code</div>
          </div>
        </div>
      </section>

      {/* Spacing */}
      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 600 }}>Spacing Scale</h2>

        <div style={{ display: 'grid', gap: '8px' }}>
          {[
            { name: '0.25rem', value: '4px' },
            { name: '0.5rem', value: '8px' },
            { name: '0.75rem', value: '12px' },
            { name: '1rem', value: '16px' },
            { name: '1.25rem', value: '20px' },
            { name: '1.5rem', value: '24px' },
            { name: '2rem', value: '32px' },
          ].map((space) => (
            <div
              key={space.name}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <div
                style={{
                  width: space.value,
                  height: '20px',
                  backgroundColor: 'rgb(var(--status-cyan))',
                  borderRadius: '2px',
                }}
              />
              <div style={{ fontSize: '12px' }}>
                <span style={{ fontWeight: 600 }}>{space.name}</span>
                <span style={{ color: 'rgb(var(--canvas-fg-3))', marginLeft: '12px' }}>({space.value})</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Radius */}
      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 600 }}>Border Radius</h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px' }}>
          {[
            { name: 'sm', value: '4px' },
            { name: 'md', value: '6px' },
            { name: 'lg', value: '8px' },
            { name: 'xl', value: '12px' },
            { name: 'full', value: '9999px' },
          ].map((radius) => (
            <div key={radius.name} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div
                style={{
                  width: '100%',
                  height: '80px',
                  backgroundColor: 'rgb(var(--status-cyan))',
                  borderRadius: radius.value,
                  border: '1px solid rgb(var(--canvas-border))',
                }}
              />
              <div>
                <div style={{ fontSize: '12px', fontWeight: 600 }}>{radius.name}</div>
                <div style={{ fontSize: '10px', color: 'rgb(var(--canvas-fg-3))', fontFamily: 'var(--font-mono)' }}>
                  {radius.value}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
