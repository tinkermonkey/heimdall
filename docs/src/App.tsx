import { useState } from 'react'
import { ShellLayout, Icon, Sidebar } from '@heimdall/ui'
import PrimitivesShowcase from './pages/PrimitivesShowcase'
import DataDisplayShowcase from './pages/DataDisplayShowcase'
import ShellFrameworkShowcase from './pages/ShellFrameworkShowcase'
import FoundationShowcase from './pages/FoundationShowcase'

type ShowcaseId = 'foundations' | 'primitives' | 'data-display' | 'shell-framework'

function App() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [currentShowcase, setCurrentShowcase] = useState<ShowcaseId>('foundations')

  const showcases = [
    { id: 'foundations', label: 'Foundations', icon: 'palette' as const, description: 'Colors, typography, spacing, and tokens' },
    { id: 'primitives', label: 'Primitives', icon: 'component' as const, description: 'Basic components: buttons, inputs, chips' },
    { id: 'data-display', label: 'Data Display', icon: 'table' as const, description: 'Tables, stat tiles, and data visualization' },
    { id: 'shell-framework', label: 'Shell Framework', icon: 'layout' as const, description: 'Layout components: titlebar, sidebar, topbar' },
  ]

  const renderShowcase = () => {
    switch (currentShowcase) {
      case 'primitives':
        return <PrimitivesShowcase />
      case 'data-display':
        return <DataDisplayShowcase />
      case 'shell-framework':
        return <ShellFrameworkShowcase />
      case 'foundations':
      default:
        return <FoundationShowcase />
    }
  }

  return (
    <ShellLayout
      titlebar={{
        left: <span className="text-sm font-medium">Heimdall</span>,
        center: <span className="text-sm">Design System Documentation</span>,
      }}
      topbar={{
        breadcrumbs: [{ label: 'Components' }, { label: showcases.find(s => s.id === currentShowcase)?.label || 'Showcase' }],
        searchPlaceholder: 'Search components...',
      }}
      sidebar={{
        collapsed: sidebarCollapsed,
        onCollapse: setSidebarCollapsed,
        sections: [
          {
            title: 'Documentation',
            items: showcases.map(s => ({
              ...s,
              id: s.id,
              onClick: () => setCurrentShowcase(s.id as ShowcaseId),
            })),
          },
        ],
        activeItemId: currentShowcase,
      }}
      statusbar={{
        right: <span>Heimdall Design System · Documentation</span>,
      }}
    >
      <div className="px-6 py-5 max-w-6xl">
        {renderShowcase()}
      </div>
    </ShellLayout>
  )
}

export default App
