import { ShellLayout, Icon } from '@heimdall/ui'

export default function ShellFrameworkShowcase() {
  return (
    <div>
      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 600 }}>Shell Layout</h2>
        <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: 'rgb(var(--canvas-fg-2))' }}>
          The ShellLayout component provides the complete application shell with titlebar, sidebar, topbar, and statusbar.
          This showcase page is built using ShellLayout!
        </p>

        <div
          style={{
            border: '1px solid rgb(var(--canvas-border))',
            borderRadius: '8px',
            overflow: 'hidden',
            backgroundColor: 'rgb(var(--canvas-surface))',
          }}
        >
          <div style={{ padding: '16px', borderBottom: '1px solid rgb(var(--canvas-border))' }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: 600 }}>Components</h3>
            <p style={{ margin: 0, fontSize: '12px', color: 'rgb(var(--canvas-fg-2))' }}>
              The shell framework includes these components:
            </p>
          </div>
          <div style={{ padding: '16px' }}>
            <ul style={{ margin: 0, paddingLeft: '20px' }}>
              <li style={{ marginBottom: '8px', fontSize: '13px' }}>
                <strong>Titlebar</strong> - Application title and controls at the top
              </li>
              <li style={{ marginBottom: '8px', fontSize: '13px' }}>
                <strong>Sidebar</strong> - Navigation with collapsible sections
              </li>
              <li style={{ marginBottom: '8px', fontSize: '13px' }}>
                <strong>Topbar</strong> - Breadcrumbs and search within the workspace
              </li>
              <li style={{ marginBottom: '8px', fontSize: '13px' }}>
                <strong>Statusbar</strong> - Application status information at the bottom
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Layout Composition */}
      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 600 }}>Layout Composition</h2>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '14px',
          }}
        >
          <div
            style={{
              border: '1px solid rgb(var(--canvas-border))',
              borderRadius: '8px',
              overflow: 'hidden',
            }}
          >
            <div style={{ padding: '12px 14px', borderBottom: '1px solid rgb(var(--canvas-border))', backgroundColor: 'rgb(var(--canvas-surface))' }}>
              <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 600 }}>Titlebar</h4>
            </div>
            <div style={{ padding: '12px 14px', fontSize: '12px', color: 'rgb(var(--canvas-fg-2))' }}>
              Fixed height header with left, center, and right slots for navigation and actions
            </div>
          </div>

          <div
            style={{
              border: '1px solid rgb(var(--canvas-border))',
              borderRadius: '8px',
              overflow: 'hidden',
            }}
          >
            <div style={{ padding: '12px 14px', borderBottom: '1px solid rgb(var(--canvas-border))', backgroundColor: 'rgb(var(--canvas-surface))' }}>
              <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 600 }}>Sidebar</h4>
            </div>
            <div style={{ padding: '12px 14px', fontSize: '12px', color: 'rgb(var(--canvas-fg-2))' }}>
              Collapsible navigation panel with sections and items, supports icons and counts
            </div>
          </div>

          <div
            style={{
              border: '1px solid rgb(var(--canvas-border))',
              borderRadius: '8px',
              overflow: 'hidden',
            }}
          >
            <div style={{ padding: '12px 14px', borderBottom: '1px solid rgb(var(--canvas-border))', backgroundColor: 'rgb(var(--canvas-surface))' }}>
              <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 600 }}>Topbar</h4>
            </div>
            <div style={{ padding: '12px 14px', fontSize: '12px', color: 'rgb(var(--canvas-fg-2))' }}>
              Breadcrumb navigation and workspace search, sits above main content
            </div>
          </div>

          <div
            style={{
              border: '1px solid rgb(var(--canvas-border))',
              borderRadius: '8px',
              overflow: 'hidden',
            }}
          >
            <div style={{ padding: '12px 14px', borderBottom: '1px solid rgb(var(--canvas-border))', backgroundColor: 'rgb(var(--canvas-surface))' }}>
              <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 600 }}>Statusbar</h4>
            </div>
            <div style={{ padding: '12px 14px', fontSize: '12px', color: 'rgb(var(--canvas-fg-2))' }}>
              Fixed footer with left, center, and right slots for status information
            </div>
          </div>
        </div>
      </section>

      {/* Responsive Behavior */}
      <section>
        <h2 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 600 }}>Responsive Features</h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
          <div
            style={{
              padding: '16px',
              border: '1px solid rgb(var(--canvas-border))',
              borderRadius: '6px',
              backgroundColor: 'rgb(var(--canvas-surface))',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Icon name="sidebar" size={16} />
              <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 600 }}>Collapse/Expand</h4>
            </div>
            <p style={{ margin: 0, fontSize: '12px', color: 'rgb(var(--canvas-fg-2))' }}>
              Sidebar collapses to icon-only mode for more content space
            </p>
          </div>

          <div
            style={{
              padding: '16px',
              border: '1px solid rgb(var(--canvas-border))',
              borderRadius: '6px',
              backgroundColor: 'rgb(var(--canvas-surface))',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Icon name="search" size={16} />
              <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 600 }}>Search</h4>
            </div>
            <p style={{ margin: 0, fontSize: '12px', color: 'rgb(var(--canvas-fg-2))' }}>
              Topbar search for quick navigation and filtering
            </p>
          </div>

          <div
            style={{
              padding: '16px',
              border: '1px solid rgb(var(--canvas-border))',
              borderRadius: '6px',
              backgroundColor: 'rgb(var(--canvas-surface))',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Icon name="arrow" size={16} />
              <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 600 }}>Navigation</h4>
            </div>
            <p style={{ margin: 0, fontSize: '12px', color: 'rgb(var(--canvas-fg-2))' }}>
              Breadcrumbs show current location and allow quick navigation
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
