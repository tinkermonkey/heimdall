import { useState } from 'react'
import { TabBar } from '../components/TabBar'

/**
 * Standalone TabBar test page for design comparison.
 * The outer wrapper mimics the design-reference .card dimensions
 * (700px wide, 20px 24px padding) so the captured element matches the
 * design reference screenshot geometry.
 */
export default function TabBarTestPage() {
  const [activeTab, setActiveTab] = useState('pipelines')

  const tabs = [
    { id: 'general', label: 'General', count: 6 },
    { id: 'pipelines', label: 'Pipelines', count: 4 },
    { id: 'storage', label: 'Storage', count: 3 },
    { id: 'members', label: 'Members', count: 3 },
  ]

  return (
    <div
      data-testid="tab-bar-card"
      style={{
        width: '700px',
        padding: '20px 24px',
        boxSizing: 'border-box',
        backgroundColor: 'rgb(var(--canvas-bg))',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}
    >
      <TabBar tabs={tabs} activeTabId={activeTab} onSelectTab={setActiveTab} />
    </div>
  )
}
