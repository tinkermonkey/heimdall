import { useState } from 'react'
import { KanbanBoard, type KanbanCard, type KanbanColumn } from '@tinkermonkey/heimdall-ui'
import { PageHeader, ShowcaseSection, DemoRow, PropsTable, PropRow } from '../components/ShowcaseSection'

export function KanbanBoardShowcase() {
  const columns: KanbanColumn[] = [
    { id: 'backlog', title: 'Backlog', statusColor: 'neutral' },
    { id: 'in-progress', title: 'In Progress', statusColor: 'amber', wipLimit: 3 },
    { id: 'done', title: 'Done', statusColor: 'emerald' },
  ]

  const initialCards: KanbanCard[] = [
    {
      id: 'task-1',
      columnId: 'backlog',
      context: 'FEATURE',
      title: 'Implement user authentication',
      version: 'v1.2.0',
      badges: ['backend', 'security'],
    },
    {
      id: 'task-2',
      columnId: 'backlog',
      context: 'BUG',
      title: 'Fix responsive layout on mobile',
      blocked: 'Needs design review',
    },
    {
      id: 'task-3',
      columnId: 'in-progress',
      context: 'FEATURE',
      title: 'Add dark mode support',
      version: 'v1.1.0',
      dueDate: '2026-06-05',
      badges: ['ui', 'frontend'],
    },
    {
      id: 'task-4',
      columnId: 'in-progress',
      context: 'CHORE',
      title: 'Update dependencies',
    },
    {
      id: 'task-5',
      columnId: 'done',
      context: 'FEATURE',
      title: 'Implement search functionality',
      version: 'v1.0.0',
      done: true,
    },
    {
      id: 'task-6',
      columnId: 'done',
      context: 'BUG',
      title: 'Fix button hover state',
      done: true,
      dueDate: '2026-05-28',
    },
  ]

  const [cards, setCards] = useState<KanbanCard[]>(initialCards)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const handleMoveCard = (cardId: string, toColumnId: string, index: number) => {
    setCards((prevCards) => {
      const cardToMove = prevCards.find((c) => c.id === cardId)
      if (!cardToMove) return prevCards

      const updatedCards = prevCards.filter((c) => c.id !== cardId)
      const targetColumnCards = updatedCards.filter((c) => c.columnId === toColumnId)
      const otherCards = updatedCards.filter((c) => c.columnId !== toColumnId)

      const newCard = { ...cardToMove, columnId: toColumnId }
      targetColumnCards.splice(index, 0, newCard)

      return [...otherCards.filter((c) => c.columnId !== toColumnId), ...targetColumnCards]
    })
  }

  return (
    <div>
      <PageHeader
        name="KanbanBoard"
        description="Task management component with drag-and-drop reordering, independent-scrolling columns, and keyboard navigation."
      />

      <ShowcaseSection label="Default Board">
        <div
          style={{
            width: '100%',
            height: '600px',
            border: '1px solid rgb(var(--canvas-border))',
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
          }}
        >
          <KanbanBoard
            columns={columns}
            cards={cards}
            selectedId={selectedId}
            onSelectCard={setSelectedId}
            onMoveCard={handleMoveCard}
          />
        </div>
      </ShowcaseSection>

      <ShowcaseSection label="With renderCard Escape Hatch">
        <div
          style={{
            width: '100%',
            height: '400px',
            border: '1px solid rgb(var(--canvas-border))',
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
          }}
        >
          <KanbanBoard
            columns={columns.slice(0, 2)}
            cards={cards.slice(0, 3)}
            renderCard={(card) => (
              <div style={{ padding: '8px' }}>
                <strong>{card.title}</strong>
                <div style={{ fontSize: '10px', color: 'rgb(var(--canvas-fg-2))', marginTop: '4px' }}>
                  Custom Renderer
                </div>
              </div>
            )}
            onMoveCard={handleMoveCard}
          />
        </div>
      </ShowcaseSection>

      <ShowcaseSection label="Features">
        <ul style={{ fontSize: '13px', lineHeight: '1.8', color: 'rgb(var(--canvas-fg-1))' }}>
          <li>
            <strong>Equal-flex columns:</strong> All columns grow equally to fill available space
          </li>
          <li>
            <strong>Status-color dots:</strong> Visual indicator in column headers for quick scanning
          </li>
          <li>
            <strong>Count chips:</strong> Card count displayed in each column header
          </li>
          <li>
            <strong>WIP limit warnings:</strong> Advisory indicator when column exceeds limit (moves never blocked)
          </li>
          <li>
            <strong>Independent scrolling:</strong> Each column scrolls independently without affecting siblings
          </li>
          <li>
            <strong>Pointer drag:</strong> Click and drag cards between columns with visual 2px amber insertion line
          </li>
          <li>
            <strong>Keyboard moves:</strong> Space to grab, arrow keys to reposition, Escape to cancel
          </li>
          <li>
            <strong>Single callback:</strong> One `onMoveCard` contract handles both pointer and keyboard moves
          </li>
          <li>
            <strong>Controlled selection:</strong> Amber border ring via `selectedId` + `onSelectCard`
          </li>
          <li>
            <strong>Blocked banners:</strong> Amber warning banner displays when card is blocked
          </li>
          <li>
            <strong>Done styling:</strong> Strikethrough + reduced opacity for completed cards
          </li>
          <li>
            <strong>Empty placeholder:</strong> "Drop cards here" shows in empty columns
          </li>
          <li>
            <strong>Live region announcements:</strong> Screen reader updates on each move
          </li>
          <li>
            <strong>renderCard escape hatch:</strong> Replace default card renderer with custom content
          </li>
        </ul>
      </ShowcaseSection>

      <ShowcaseSection label="Props">
        <PropsTable>
          <PropRow
            name="columns"
            type="KanbanColumn[]"
            description="Array of column definitions with id, title, optional statusColor, and optional wipLimit"
            required
          />
          <PropRow
            name="cards"
            type="KanbanCard[]"
            description="Array of cards with id, columnId, title, and optional context, version, dueDate, badges, blocked, done"
            required
          />
          <PropRow
            name="onMoveCard"
            type="(cardId, toColumnId, index) => void"
            description="Fired when card is moved via pointer drag or keyboard; single callback for both"
            required
          />
          <PropRow
            name="selectedId"
            type="string"
            description="Card ID of the currently selected card (renders with amber border ring)"
          />
          <PropRow
            name="onSelectCard"
            type="(cardId: string) => void"
            description="Fired when a card is clicked to select it"
          />
          <PropRow
            name="renderCard"
            type="(card, isSelected) => ReactNode"
            description="Optional escape hatch to replace default card renderer with custom content"
          />
        </PropsTable>
      </ShowcaseSection>

      <ShowcaseSection label="Card Properties">
        <PropsTable>
          <PropRow
            name="id"
            type="string"
            description="Unique card identifier"
            required
          />
          <PropRow
            name="columnId"
            type="string"
            description="ID of the column this card belongs to"
            required
          />
          <PropRow
            name="title"
            type="string"
            description="Card title (main content)"
            required
          />
          <PropRow
            name="context"
            type="string"
            description="Monospace uppercase label (e.g., FEATURE, BUG, CHORE) rendered above title"
          />
          <PropRow
            name="version"
            type="string"
            description="Version label rendered as a VersionPill below title"
          />
          <PropRow
            name="dueDate"
            type="string"
            description="Due date string (e.g., 2026-06-05) in monospace below badges"
          />
          <PropRow
            name="badges"
            type="string[]"
            description="Array of badge labels rendered as small chips"
          />
          <PropRow
            name="blocked"
            type="string"
            description="When set, renders an amber blocked banner with this text"
          />
          <PropRow
            name="done"
            type="boolean"
            description="When true, card renders struck-through and dimmed"
          />
        </PropsTable>
      </ShowcaseSection>

      <ShowcaseSection label="Column Properties">
        <PropsTable>
          <PropRow
            name="id"
            type="string"
            description="Unique column identifier"
            required
          />
          <PropRow
            name="title"
            type="string"
            description="Column title displayed in header"
            required
          />
          <PropRow
            name="statusColor"
            type="StatusColor"
            description="Color of the status dot: emerald, amber, rose, cyan, violet, or neutral"
          />
          <PropRow
            name="wipLimit"
            type="number"
            description="Optional WIP (Work In Progress) limit; shows warning icon when exceeded (advisory only)"
          />
        </PropsTable>
      </ShowcaseSection>

      <ShowcaseSection label="Keyboard Shortcuts">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '120px 1fr',
            gap: '16px',
            fontSize: '13px',
            color: 'rgb(var(--canvas-fg-1))',
          }}
        >
          <div style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }}>Space</div>
          <div>Grab the focused card (initiates drag mode in pointer context)</div>

          <div style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }}>↑ / ↓</div>
          <div>Move card up or down within the same column</div>

          <div style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }}>← / →</div>
          <div>Move card to the previous or next column (at position 0)</div>

          <div style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }}>Escape</div>
          <div>Cancel drag or selection</div>

          <div style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }}>Tab</div>
          <div>Navigate between cards</div>
        </div>
      </ShowcaseSection>
    </div>
  )
}
