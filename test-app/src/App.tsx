import { useState, useEffect } from 'react'
import { ShellLayout, Icon } from '@tinkermonkey/heimdall-ui'
import { BARE_MAP, NAV_SECTIONS, DEFAULT_ID, getItemLabel, getSectionTitle } from './registry'

function pushExample(id: string) {
  const url = new URL(window.location.href)
  url.searchParams.set('example', id)
  window.history.pushState({}, '', url)
}

export default function App() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [currentId, setCurrentId] = useState(() => {
    const params = new URLSearchParams(window.location.search)
    return params.get('example') || DEFAULT_ID
  })
  const [darkCanvas, setDarkCanvas] = useState(
    () => localStorage.getItem('heimdall-test-app-dark-canvas') === '1',
  )

  useEffect(() => {
    const onPop = () => {
      const params = new URLSearchParams(window.location.search)
      setCurrentId(params.get('example') || DEFAULT_ID)
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  useEffect(() => {
    document.body.classList.toggle('dark-canvas', darkCanvas)
    localStorage.setItem('heimdall-test-app-dark-canvas', darkCanvas ? '1' : '0')
  }, [darkCanvas])

  const Bare = BARE_MAP[currentId] ?? BARE_MAP[DEFAULT_ID]
  const totalCount = NAV_SECTIONS.reduce((n, s) => n + s.items.length, 0)

  const handleSelect = (id: string) => {
    setCurrentId(id)
    pushExample(id)
  }

  return (
    <ShellLayout
      appTitle={{ title: 'Heimdall', version: 'bare' }}
      topbar={{
        breadcrumbs: [
          { label: getSectionTitle(currentId) || 'Components' },
          { label: getItemLabel(currentId) },
        ],
        children: (
          <button
            type="button"
            onClick={() => setDarkCanvas(v => !v)}
            title={darkCanvas ? 'Switch to light canvas' : 'Switch to dark canvas'}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 28,
              height: 28,
              borderRadius: 6,
              border: '1px solid',
              background: 'transparent',
              cursor: 'pointer',
              borderColor: darkCanvas ? 'rgba(245,158,11,0.35)' : 'rgb(var(--shell-border))',
              color: darkCanvas ? 'rgb(var(--accent-primary))' : 'rgb(var(--shell-fg-3))',
              transition: 'color 120ms, border-color 120ms, background 120ms',
            }}
          >
            <Icon name={darkCanvas ? 'sun' : 'moon'} size={14} />
          </button>
        ),
      }}
      sidebar={{
        collapsed: sidebarCollapsed,
        onCollapse: setSidebarCollapsed,
        onSelectItem: handleSelect,
        sections: NAV_SECTIONS,
        activeItemId: currentId,
      }}
      statusbar={{
        left: <span>heimdall-ui / bare</span>,
        right: <span>{totalCount} components</span>,
      }}
    >
      <div style={{ padding: '22px 26px 32px', maxWidth: 1100 }}>
        <Bare />
      </div>
    </ShellLayout>
  )
}
