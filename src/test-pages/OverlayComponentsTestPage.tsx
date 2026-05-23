import { useState } from 'react'
import { Button } from '../components/Button'
import { Modal } from '../components/Modal'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { Toast } from '../components/Toast'
import { WorkspaceSwitcherDialog, type Workspace } from '../components/WorkspaceSwitcherDialog'

export default function OverlayComponentsTestPage() {
  const [modalOpen, setModalOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [toastOpen, setToastOpen] = useState(false)
  const [toastVariant, setToastVariant] = useState<'success' | 'error' | 'warning' | 'info'>('info')
  const [workspaceSwitcherOpen, setWorkspaceSwitcherOpen] = useState(false)

  const recentWorkspaces: Workspace[] = [
    { id: '1', name: 'molgraph-research', path: '/users/dev/molgraph-research', classCount: 20, individualCount: 267 },
    { id: '2', name: 'climate-policy-graph', path: '/users/dev/climate-policy-graph', classCount: 14, individualCount: 1208 },
    { id: '3', name: 'platform-eng-kb', path: '/users/dev/platform-eng-kb', classCount: 31, individualCount: 542 },
  ]
  const currentWorkspace: Workspace = recentWorkspaces[0]

  return (
    <div style={{ padding: '22px 28px', backgroundColor: 'rgb(var(--canvas-bg))', minHeight: '100vh' }}>
      <section style={{ marginBottom: '32px' }}>
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
          Modal Component
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <Button variant="primary" onClick={() => setModalOpen(true)}>
            Open Modal
          </Button>
        </div>
      </section>

      <section style={{ marginBottom: '32px' }}>
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
          Confirm Dialog Component
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <Button variant="danger" onClick={() => setConfirmOpen(true)}>
            Open Confirm
          </Button>
        </div>
      </section>

      <section style={{ marginBottom: '32px' }}>
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
          Workspace Switcher Dialog Component
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <Button variant="primary" onClick={() => setWorkspaceSwitcherOpen(true)}>
            Open Workspace Switcher
          </Button>
        </div>
      </section>

      <section style={{ marginBottom: '32px' }}>
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
          Toast Component
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <Button
            variant="primary"
            onClick={() => {
              setToastVariant('success')
              setToastOpen(true)
            }}
          >
            Show Success Toast
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              setToastVariant('error')
              setToastOpen(true)
            }}
          >
            Show Error Toast
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              setToastVariant('warning')
              setToastOpen(true)
            }}
          >
            Show Warning Toast
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              setToastVariant('info')
              setToastOpen(true)
            }}
          >
            Show Toast
          </Button>
        </div>
      </section>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Create class"
        subtitle='Add to concept scheme "taxonomy"'
        footer={
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <Button variant="ghost" size="sm" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={() => setModalOpen(false)}>
              Create class
            </Button>
          </div>
        }
      >
        <div style={{ color: 'rgb(var(--canvas-fg-2))', lineHeight: '1.55' }}>
          Enter a title and description for the new class.
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => {
          console.log('Confirmed delete')
        }}
        title="Delete class"
        message={
          <>
            Delete <code style={{ backgroundColor: 'rgb(var(--canvas-bg-2))', padding: '1px 6px', borderRadius: '3px', fontFamily: 'monospace', fontSize: '11px', color: 'rgb(var(--semantic-version-fg))' }}>cls_organism</code>? 47 individuals will be unlinked.
          </>
        }
        confirmLabel="Delete"
        variant="danger"
      />

      <Toast
        isOpen={toastOpen}
        onClose={() => setToastOpen(false)}
        title={toastVariant === 'success' ? 'Success' : toastVariant === 'error' ? 'Error' : toastVariant === 'warning' ? 'Warning' : 'Info'}
        subtitle="Operation completed"
        variant={toastVariant}
        duration={4000}
      />

      <WorkspaceSwitcherDialog
        isOpen={workspaceSwitcherOpen}
        onClose={() => setWorkspaceSwitcherOpen(false)}
        current={currentWorkspace}
        recent={recentWorkspaces}
        onOpenFolder={() => {
          console.log('Open folder clicked')
          setWorkspaceSwitcherOpen(false)
        }}
        onNewWorkspace={() => {
          console.log('New workspace clicked')
          setWorkspaceSwitcherOpen(false)
        }}
        onCloneFromGit={() => {
          console.log('Clone from git clicked')
          setWorkspaceSwitcherOpen(false)
        }}
        onPickRecent={(workspace) => {
          console.log('Selected workspace:', workspace)
          setWorkspaceSwitcherOpen(false)
        }}
      />
    </div>
  )
}
