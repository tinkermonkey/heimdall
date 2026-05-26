import { useState } from 'react'
import {
  WorkspaceSwitcherDialog,
  Button,
  type Workspace,
} from '@tinkermonkey/heimdall-ui'
import { PageHeader, ShowcaseSection, PropsTable, PropRow } from '../components/ShowcaseSection'

const SAMPLE_WORKSPACES: Workspace[] = [
  { id: 'ws_1', name: 'Production', path: '/home/user/projects/production', classCount: 14, individualCount: 302 },
  { id: 'ws_2', name: 'Staging', path: '/home/user/projects/staging', classCount: 9, individualCount: 118 },
  { id: 'ws_3', name: 'Development', path: '/home/user/projects/dev' },
  { id: 'ws_4', name: 'Testing', path: '/home/user/projects/testing' },
]

const CURRENT_WORKSPACE: Workspace = { id: 'ws_1', name: 'Production', path: '/home/user/projects/production', classCount: 14, individualCount: 302 }

export function WorkspaceSwitcherDialogShowcase() {
  const [open, setOpen] = useState(false)
  const [openNoGit, setOpenNoGit] = useState(false)
  const [selectedWs, setSelectedWs] = useState<string | null>(null)

  return (
    <div>
      <PageHeader name="WorkspaceSwitcherDialog" description="Modal dialog for switching between workspaces. Shows action tiles and recent workspace list." />
      <ShowcaseSection label="Full variant (open folder, new, clone)">
        <Button onClick={() => setOpen(true)} variant="primary">
          Open Workspace Switcher
        </Button>
        <WorkspaceSwitcherDialog
          isOpen={open}
          onClose={() => setOpen(false)}
          current={CURRENT_WORKSPACE}
          recent={SAMPLE_WORKSPACES}
          onOpenFolder={() => {
            setOpen(false)
          }}
          onNewWorkspace={() => {
            setOpen(false)
          }}
          onCloneFromGit={() => {
            setOpen(false)
          }}
          onPickRecent={(workspace) => {
            setSelectedWs(workspace.id)
            setOpen(false)
          }}
        />
        {selectedWs && (
          <div style={{ marginTop: 12, fontSize: 12, color: 'rgb(var(--canvas-fg-3))' }}>
            Selected workspace: <span style={{ fontFamily: 'var(--font-mono)', color: 'rgb(var(--canvas-fg-2))' }}>{selectedWs}</span>
          </div>
        )}
      </ShowcaseSection>
      <ShowcaseSection label="No clone action (optional handlers)">
        <Button onClick={() => setOpenNoGit(true)} variant="secondary">
          Open (no clone)
        </Button>
        <WorkspaceSwitcherDialog
          isOpen={openNoGit}
          onClose={() => setOpenNoGit(false)}
          current={CURRENT_WORKSPACE}
          recent={SAMPLE_WORKSPACES}
          onOpenFolder={() => setOpenNoGit(false)}
          onNewWorkspace={() => setOpenNoGit(false)}
          onPickRecent={(workspace) => {
            setSelectedWs(workspace.id)
            setOpenNoGit(false)
          }}
        />
      </ShowcaseSection>
      <ShowcaseSection label="Props">
        <PropsTable>
          <PropRow name="isOpen" type="boolean" description="Whether the dialog is visible" />
          <PropRow name="onClose" type="() => void" description="Called when user closes the dialog" />
          <PropRow name="title" type="string" defaultValue='"Switch Workspace"' description="Dialog heading text" />
          <PropRow name="current" type="Workspace" description="Optional currently active workspace — highlighted with open badge" />
          <PropRow name="recent" type="Workspace[]" defaultValue="[]" description="Array of recent workspaces shown in the list" />
          <PropRow name="onOpenFolder" type="() => void" description="When provided, renders the Open folder action tile" />
          <PropRow name="onNewWorkspace" type="() => void" description="When provided, renders the New workspace action tile" />
          <PropRow name="onCloneFromGit" type="() => void" description="When provided, renders the Clone from git action tile" />
          <PropRow name="onPickRecent" type="(workspace: Workspace) => void" description="Called when user selects a recent workspace" />
          <PropRow name="Workspace.id" type="string" description="Unique workspace identifier" />
          <PropRow name="Workspace.name" type="string" description="Display name for the workspace" />
          <PropRow name="Workspace.path" type="string | undefined" description="Optional filesystem path shown in monospace below the name" />
          <PropRow name="Workspace.classCount" type="number | undefined" description="Optional class count shown as stat in the recent list" />
          <PropRow name="Workspace.individualCount" type="number | undefined" description="Optional individual count shown as stat in the recent list" />
        </PropsTable>
      </ShowcaseSection>
    </div>
  )
}
