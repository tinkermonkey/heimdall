import { useState } from 'react'
import {
  WorkspaceSwitcherDialog,
  Button,
  type Workspace,
} from '@tinkermonkey/heimdall-ui'
import { PageHeader, ShowcaseSection, PropsTable, PropRow } from '../components/ShowcaseSection'

const SAMPLE_WORKSPACES: Workspace[] = [
  { id: 'ws_1', name: 'Production', path: '/home/user/projects/production' },
  { id: 'ws_2', name: 'Staging', path: '/home/user/projects/staging' },
  { id: 'ws_3', name: 'Development', path: '/home/user/projects/dev' },
  { id: 'ws_4', name: 'Testing', path: '/home/user/projects/testing' },
]

const CURRENT_WORKSPACE: Workspace = { id: 'ws_1', name: 'Production', path: '/home/user/projects/production' }

export function WorkspaceSwitcherDialogShowcase() {
  const [open, setOpen] = useState(false)
  const [selectedWs, setSelectedWs] = useState<string | null>(null)

  return (
    <div>
      <PageHeader name="WorkspaceSwitcherDialog" description="Modal dialog for switching between workspaces. Shows action tiles and recent workspace list." />
      <ShowcaseSection label="Workspace switcher">
        <Button onClick={() => setOpen(true)} variant="primary">
          Open Workspace Switcher
        </Button>
        <WorkspaceSwitcherDialog
          isOpen={open}
          onClose={() => setOpen(false)}
          current={CURRENT_WORKSPACE}
          recent={SAMPLE_WORKSPACES}
          onOpenFolder={() => {
            console.log('Open folder')
            setOpen(false)
          }}
          onNewWorkspace={() => {
            console.log('Create new workspace')
            setOpen(false)
          }}
          onCloneFromGit={() => {
            console.log('Clone from Git')
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
      <ShowcaseSection label="Props">
        <PropsTable>
          <PropRow name="isOpen" type="boolean" description="Whether the dialog is visible" />
          <PropRow name="onClose" type="() => void" description="Called when user closes the dialog" />
          <PropRow name="current" type="Workspace" description="Optional currently active workspace" />
          <PropRow name="recent" type="Workspace[]" description="Array of recent workspaces" />
          <PropRow name="onOpenFolder" type="() => void" description="Called when user clicks 'Open' action" />
          <PropRow name="onNewWorkspace" type="() => void" description="Called when user clicks 'New' action" />
          <PropRow name="onCloneFromGit" type="() => void" description="Called when user clicks 'Clone' action" />
          <PropRow name="onPickRecent" type="(workspace: Workspace) => void" description="Called when user selects a recent workspace" />
          <PropRow name="Workspace.id" type="string" description="Unique workspace identifier" />
          <PropRow name="Workspace.name" type="string" description="Display name for the workspace" />
          <PropRow name="Workspace.path" type="string | undefined" description="Optional filesystem path to the workspace" />
        </PropsTable>
      </ShowcaseSection>
    </div>
  )
}
