import { useState } from 'react'
import { Modal, ConfirmDialog, Toast, CommandPalette, Button, Field, TextInput, Select } from '@tinkermonkey/heimdall-ui'
import { PageHeader, ShowcaseSection, DemoRow, DemoGrid, DemoCard, PropsTable, PropRow } from '../components/ShowcaseSection'

export function ModalShowcase() {
  const [open, setOpen] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [sizeOpen, setSizeOpen] = useState(false)
  const [hintOpen, setHintOpen] = useState(false)

  return (
    <div>
      <PageHeader name="Modal" description="Centered dialog with backdrop. Traps focus, closes on Escape, closes on backdrop click." />
      <ShowcaseSection label="Basic modal">
        <Button onClick={() => setOpen(true)}>Open modal</Button>
        <Modal
          isOpen={open}
          onClose={() => setOpen(false)}
          title="Confirm action"
          subtitle="This cannot be undone"
          footer={
            <DemoRow>
              <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
              <Button variant="primary" size="sm" onClick={() => setOpen(false)}>Confirm</Button>
            </DemoRow>
          }
        >
          <p style={{ margin: 0, fontSize: 13, color: 'rgb(var(--canvas-fg-2, 55 65 81))', lineHeight: 1.65 }}>
            This is the modal body. It can contain any content — text, forms, tables. The footer slot renders below the body with a top border.
          </p>
        </Modal>
      </ShowcaseSection>
      <ShowcaseSection label="Form modal">
        <Button onClick={() => setFormOpen(true)}>Open form modal</Button>
        <Modal
          isOpen={formOpen}
          onClose={() => setFormOpen(false)}
          title="Create class"
          footer={
            <DemoRow>
              <Button variant="ghost" size="sm" onClick={() => setFormOpen(false)}>Cancel</Button>
              <Button variant="primary" size="sm" onClick={() => setFormOpen(false)}>Create</Button>
            </DemoRow>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Field label="Name" required>
              <TextInput placeholder="e.g. Organism" />
            </Field>
            <Field label="Identifier" hint="Auto-generated from name">
              <TextInput placeholder="life.organism" mono />
            </Field>
            <Field label="Domain">
              <Select>
                <option value="life">life</option>
                <option value="climate">climate</option>
                <option value="software">software</option>
              </Select>
            </Field>
          </div>
        </Modal>
      </ShowcaseSection>
      <ShowcaseSection label="Size variants">
        <DemoRow>
          <Button variant="ghost" size="sm" onClick={() => setSizeOpen(true)}>Open lg modal</Button>
        </DemoRow>
        <Modal
          isOpen={sizeOpen}
          onClose={() => setSizeOpen(false)}
          title="Large modal"
          subtitle="size='lg' — 640px wide"
          size="lg"
          footer={
            <DemoRow>
              <Button variant="ghost" size="sm" onClick={() => setSizeOpen(false)}>Cancel</Button>
              <Button variant="primary" size="sm" onClick={() => setSizeOpen(false)}>Done</Button>
            </DemoRow>
          }
        >
          <p style={{ margin: 0, fontSize: 13, color: 'rgb(var(--canvas-fg-2, 55 65 81))', lineHeight: 1.65 }}>
            Use <code style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>size="lg"</code> for wider content like tables or multi-column forms. Available sizes: sm (360px), md (480px, default), lg (640px), xl (820px).
          </p>
        </Modal>
      </ShowcaseSection>
      <ShowcaseSection label="Hint footer">
        <Button variant="ghost" size="sm" onClick={() => setHintOpen(true)}>Open modal with hint</Button>
        <Modal
          isOpen={hintOpen}
          onClose={() => setHintOpen(false)}
          title="Keyboard shortcut"
          hintFooter="Press Escape to dismiss"
          footer={
            <DemoRow>
              <Button variant="primary" size="sm" onClick={() => setHintOpen(false)}>Got it</Button>
            </DemoRow>
          }
        >
          <p style={{ margin: 0, fontSize: 13, color: 'rgb(var(--canvas-fg-2, 55 65 81))', lineHeight: 1.65 }}>
            The <code style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>hintFooter</code> prop renders a monospace hint strip below the footer — useful for keyboard shortcuts or contextual guidance.
          </p>
        </Modal>
      </ShowcaseSection>
      <ShowcaseSection label="Props">
        <PropsTable>
          <PropRow name="isOpen" type="boolean" description="Controls visibility" />
          <PropRow name="onClose" type="() => void" description="Called on Escape, backdrop click, or close button" />
          <PropRow name="title" type="string" description="Header title text" />
          <PropRow name="subtitle" type="string" description="Secondary line below the title" />
          <PropRow name="size" type="'sm' | 'md' | 'lg' | 'xl'" def="'md'" description="Width preset: sm 360px, md 480px, lg 640px, xl 820px" />
          <PropRow name="footer" type="ReactNode" description="Footer slot — typically action buttons" />
          <PropRow name="hintFooter" type="string" description="Monospace hint strip rendered below the footer" />
          <PropRow name="children" type="ReactNode" description="Modal body content" />
        </PropsTable>
      </ShowcaseSection>
    </div>
  )
}

export function ConfirmDialogShowcase() {
  const [dangerOpen, setDangerOpen] = useState(false)
  const [primaryOpen, setPrimaryOpen] = useState(false)
  const [lastAction, setLastAction] = useState<string | null>(null)

  return (
    <div>
      <PageHeader name="ConfirmDialog" description="Specialized modal for destructive or irreversible actions. Wraps Modal with a confirm/cancel button pair." />
      <ShowcaseSection label="Variants">
        <DemoRow>
          <Button variant="danger" onClick={() => setDangerOpen(true)}>Danger (delete)</Button>
          <Button variant="secondary" onClick={() => setPrimaryOpen(true)}>Primary (confirm)</Button>
        </DemoRow>
        {lastAction && (
          <div style={{ marginTop: 10, fontSize: 12, color: 'rgb(var(--canvas-fg-3, 107 114 128))' }}>
            Last action: {lastAction}
          </div>
        )}
        <ConfirmDialog
          isOpen={dangerOpen}
          onClose={() => setDangerOpen(false)}
          onConfirm={() => { setLastAction('Deleted cls_organism'); setDangerOpen(false) }}
          title="Delete class"
          subtitle="This cannot be undone"
          message={<>Delete <code style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 12 }}>cls_organism</code>? 47 individuals will be unlinked.</>}
          confirmLabel="Delete"
          variant="danger"
        />
        <ConfirmDialog
          isOpen={primaryOpen}
          onClose={() => setPrimaryOpen(false)}
          onConfirm={() => { setLastAction('Deployment confirmed'); setPrimaryOpen(false) }}
          title="Deploy to production"
          message="This will push to the production cluster. Active connections will experience a brief restart."
          confirmLabel="Deploy"
          variant="primary"
        />
      </ShowcaseSection>
      <ShowcaseSection label="Props">
        <PropsTable>
          <PropRow name="isOpen" type="boolean" description="Controls visibility" />
          <PropRow name="onClose" type="() => void" description="Cancel handler — called on Escape, backdrop click, or Cancel button" />
          <PropRow name="onConfirm" type="() => void" description="Confirm handler — caller is responsible for closing the dialog" />
          <PropRow name="title" type="string" description="Dialog title" />
          <PropRow name="subtitle" type="string" description="Secondary line below the title" />
          <PropRow name="message" type="ReactNode" description="Body text — state the consequence clearly" />
          <PropRow name="confirmLabel" type="string" def="'Confirm'" description="Confirm button label" />
          <PropRow name="cancelLabel" type="string" def="'Cancel'" description="Cancel button label" />
          <PropRow name="variant" type="'primary' | 'danger'" def="'danger'" description="Confirm button color" />
        </PropsTable>
      </ShowcaseSection>
    </div>
  )
}

export function ToastShowcase() {
  const [toasts, setToasts] = useState<Record<string, boolean>>({})
  const show = (key: string) => setToasts(t => ({ ...t, [key]: true }))
  const hide = (key: string) => setToasts(t => ({ ...t, [key]: false }))

  const variants = [
    { key: 'success', label: 'Success', title: 'Pipeline complete', subtitle: 'ingest_organisms ran in 4.2s', variant: 'success' as const },
    { key: 'error', label: 'Error', title: 'Sync failed', subtitle: 'Connection refused at nyx-01:5432', variant: 'error' as const },
    { key: 'warning', label: 'Warning', title: 'Memory high', subtitle: 'aether-01 at 91% — consider scaling', variant: 'warning' as const },
    { key: 'info', label: 'Info', title: 'Schema updated', subtitle: 'life.organism has 3 new fields', variant: 'info' as const },
  ]

  return (
    <div>
      <PageHeader name="Toast" description="Non-blocking notification. Auto-dismisses after `duration` ms (default 4000). Four semantic variants." />
      <ShowcaseSection label="All variants" description="Click a button to show a toast. It auto-dismisses after 4 seconds.">
        <DemoRow>
          {variants.map(v => (
            <Button key={v.key} variant="ghost" size="sm" onClick={() => show(v.key)}>{v.label}</Button>
          ))}
        </DemoRow>
        {variants.map(v => (
          <Toast
            key={v.key}
            isOpen={!!toasts[v.key]}
            onClose={() => hide(v.key)}
            title={v.title}
            subtitle={v.subtitle}
            variant={v.variant}
            style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999 }}
          />
        ))}
      </ShowcaseSection>
      <ShowcaseSection label="Props">
        <PropsTable>
          <PropRow name="isOpen" type="boolean" description="Controls visibility" />
          <PropRow name="onClose" type="() => void" description="Called on dismiss or after duration" />
          <PropRow name="title" type="string" description="Primary message" />
          <PropRow name="subtitle" type="string" description="Secondary detail line" />
          <PropRow name="variant" type="'success' | 'error' | 'warning' | 'info'" def="'info'" description="Color and icon" />
          <PropRow name="duration" type="number" def="4000" description="Auto-dismiss delay in ms. Pass 0 to disable." />
          <PropRow name="icon" type="IconName" description="Override the default variant icon" />
        </PropsTable>
      </ShowcaseSection>
    </div>
  )
}

export function CommandPaletteShowcase() {
  const [open, setOpen] = useState(false)
  const [lastCommand, setLastCommand] = useState<string | null>(null)

  const commands = [
    { id: 'new-class', label: 'Create class', description: 'Add a new schema class', icon: 'plus' as const, onSelect: () => setLastCommand('Create class') },
    { id: 'run-pipeline', label: 'Run pipeline', description: 'Execute a data pipeline', icon: 'pipeline' as const, onSelect: () => setLastCommand('Run pipeline') },
    { id: 'open-graph', label: 'Graph view', description: 'Switch to graph visualization', icon: 'graph' as const, onSelect: () => setLastCommand('Graph view') },
    { id: 'search-individuals', label: 'Search individuals', description: 'Full-text search across all records', icon: 'search' as const, onSelect: () => setLastCommand('Search individuals') },
    { id: 'settings', label: 'Open settings', description: 'Workspace preferences', icon: 'settings' as const, onSelect: () => setLastCommand('Open settings') },
    { id: 'export', label: 'Export data', description: 'Download current view as CSV or JSON', icon: 'download' as const, onSelect: () => setLastCommand('Export data') },
  ]

  return (
    <div>
      <PageHeader name="CommandPalette" description="⌘K-style command launcher. Fuzzy-filters a list of commands. Keyboard navigable (↑↓ Enter Escape)." />
      <ShowcaseSection label="Interactive demo">
        <DemoRow>
          <Button onClick={() => setOpen(true)}>
            Open command palette
            <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 10, marginLeft: 8, opacity: 0.6 }}>⌘K</span>
          </Button>
        </DemoRow>
        {lastCommand && (
          <div style={{ marginTop: 10, fontSize: 12, color: 'rgb(var(--canvas-fg-3, 107 114 128))' }}>
            Last selected: {lastCommand}
          </div>
        )}
        <CommandPalette
          isOpen={open}
          onClose={() => setOpen(false)}
          commands={commands}
          placeholder="Search or run command…"
        />
      </ShowcaseSection>
      <ShowcaseSection label="Props">
        <PropsTable>
          <PropRow name="isOpen" type="boolean" description="Controls visibility" />
          <PropRow name="onClose" type="() => void" description="Called on Escape or backdrop click" />
          <PropRow name="commands" type="Command[]" description="Array of { id, label, description?, icon?, onSelect }" />
          <PropRow name="placeholder" type="string" def="'Search commands…'" description="Search input placeholder" />
          <PropRow name="emptyMessage" type="string" def="'No commands found'" description="Message shown when no commands match the search query" />
        </PropsTable>
      </ShowcaseSection>
    </div>
  )
}
