import { useState } from 'react'
import { KanbanBoard, type KanbanCard, type KanbanColumn } from '../components/KanbanBoard'

export default function KanbanBoardTestPage() {
  const columns: KanbanColumn[] = [
    { id: 'backlog', title: 'Backlog', statusColor: 'neutral', wipLimit: 5 },
    { id: 'ready', title: 'Ready', statusColor: 'cyan', wipLimit: 8 },
    { id: 'in-progress', title: 'In Progress', statusColor: 'amber', wipLimit: 5 },
    { id: 'review', title: 'Review', statusColor: 'violet', wipLimit: 3 },
    { id: 'done', title: 'Done', statusColor: 'emerald' },
  ]

  const initialCards: KanbanCard[] = [
    {
      id: 'card-1',
      columnId: 'backlog',
      context: 'FEATURE',
      title: 'Add user authentication',
      version: 'v1.2.0',
      badges: ['urgent', 'backend'],
    },
    {
      id: 'card-2',
      columnId: 'backlog',
      context: 'BUG',
      title: 'Fix button alignment issue',
      badges: ['ui'],
    },
    {
      id: 'card-3',
      columnId: 'backlog',
      context: 'FEATURE',
      title: 'Implement dark mode',
      blocked: 'Waiting on design approval',
      badges: ['frontend'],
    },
    {
      id: 'card-4',
      columnId: 'backlog',
      context: 'CHORE',
      title: 'Update dependencies',
    },
    {
      id: 'card-5',
      columnId: 'backlog',
      context: 'FEATURE',
      title: 'Add export to CSV',
    },
    {
      id: 'card-6',
      columnId: 'backlog',
      context: 'FEATURE',
      title: 'Improve search performance',
    },
    {
      id: 'card-7',
      columnId: 'ready',
      context: 'FEATURE',
      title: 'API rate limiting',
      version: 'v1.1.0',
      badges: ['backend', 'security'],
    },
    {
      id: 'card-8',
      columnId: 'ready',
      context: 'BUG',
      title: 'Handle empty states',
      dueDate: '2026-06-05',
      badges: ['ux'],
    },
    {
      id: 'card-9',
      columnId: 'in-progress',
      context: 'FEATURE',
      title: 'Refactor form validation',
      version: 'v1.1.0',
      dueDate: '2026-06-04',
      badges: ['frontend'],
    },
    {
      id: 'card-10',
      columnId: 'in-progress',
      context: 'FEATURE',
      title: 'Add analytics tracking',
      badges: ['tracking'],
    },
    {
      id: 'card-11',
      columnId: 'review',
      context: 'FEATURE',
      title: 'Cache optimization',
      version: 'v1.2.0',
      badges: ['performance', 'backend'],
    },
    {
      id: 'card-12',
      columnId: 'done',
      context: 'FEATURE',
      title: 'User profile page',
      version: 'v1.0.0',
      done: true,
      badges: ['frontend', 'completed'],
    },
    {
      id: 'card-13',
      columnId: 'done',
      context: 'BUG',
      title: 'Fix navigation links',
      done: true,
      dueDate: '2026-05-28',
    },
  ]

  const [cards, setCards] = useState<KanbanCard[]>(initialCards)
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined)

  const handleMoveCard = (cardId: string, toColumnId: string, index: number) => {
    setCards((prevCards) => {
      const cardToMove = prevCards.find((c) => c.id === cardId)
      if (!cardToMove) return prevCards

      // Remove card from current column
      let updatedCards = prevCards.filter((c) => c.id !== cardId)

      // Reorder cards in the target column
      const targetColumnCards = updatedCards.filter((c) => c.columnId === toColumnId)
      const otherCards = updatedCards.filter((c) => c.columnId !== toColumnId)

      const newCard = { ...cardToMove, columnId: toColumnId }
      targetColumnCards.splice(index, 0, newCard)

      return [...otherCards.filter((c) => c.columnId !== toColumnId), ...targetColumnCards]
    })
  }

  return (
    <div style={{ padding: '22px 26px 32px', backgroundColor: 'rgb(var(--canvas-bg))', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <section style={{ marginBottom: '16px' }}>
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
          KANBAN BOARD · INTERACTIVE COMPONENT
        </div>
        <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
          <button
            onClick={() => setSelectedId(undefined)}
            style={{
              padding: '6px 12px',
              backgroundColor: selectedId ? 'rgb(var(--canvas-surface))' : 'rgb(var(--accent-primary))',
              color: selectedId ? 'rgb(var(--canvas-fg-1))' : 'rgb(var(--canvas-fg-1))',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 600,
            }}
          >
            Clear Selection
          </button>
          {selectedId && (
            <div style={{ fontSize: '12px', color: 'rgb(var(--canvas-fg-2))', display: 'flex', alignItems: 'center' }}>
              Selected: {selectedId}
            </div>
          )}
        </div>
      </section>

      <div style={{ flex: 1, border: '1px solid rgb(var(--canvas-border))', borderRadius: 'var(--radius-lg)', overflow: 'hidden', minHeight: 0 }}>
        <KanbanBoard
          columns={columns}
          cards={cards}
          selectedId={selectedId}
          onSelectCard={setSelectedId}
          onMoveCard={handleMoveCard}
        />
      </div>

      <section style={{ marginTop: '16px', fontSize: '12px', color: 'rgb(var(--canvas-fg-2))' }}>
        <div style={{ marginBottom: '8px' }}>
          <strong>Interactive Features:</strong>
        </div>
        <ul style={{ margin: '0', paddingLeft: '20px', fontSize: '11px', lineHeight: '1.6' }}>
          <li>Click cards to select them (amber border)</li>
          <li>Drag cards between columns to reorder</li>
          <li>Use Space to grab, arrow keys to move, Escape to cancel</li>
          <li>Yellow warning icons indicate WIP limit breached (advisory only)</li>
          <li>Struck-through cards show done state with reduced opacity</li>
          <li>Amber banner shows blocked cards</li>
          <li>Empty columns show drop-zone placeholder</li>
        </ul>
      </section>
    </div>
  )
}
