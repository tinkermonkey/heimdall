import { useState } from 'react'
import {
  WorkspaceSwitcherDialog,
  Button,
  type Workspace,
} from '@tinkermonkey/heimdall-ui'
import { PageHeader, ShowcaseSection, PropsTable, PropRow } from '../components/ShowcaseSection'

const SAMPLE_WORKSPACES: Workspace[] = [
  { id: 'ws_1', name: 'Production', lastAccessed: new Date(Date.now() - 1 * 3600000) },
  { id: 'ws_2', name: 'Staging', lastAccessed: new Date(Date.now() - 24 * 3600000) },
  { id: 'ws_3', name: 'Development', lastAccessed: new Date(Date.now() - 48 * 3600000) },
  { id: 'ws_4', name: 'Testing', lastAccessed: new Date(Date.now() - 7 * 24 * 3600000) },
]

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
          workspaces={SAMPLE_WORKSPACES}
          onSelectWorkspace={id => {
            setSelectedWs(id)
            setOpen(false)
          }}
          onCreateWorkspace={() => {
            console.log('Create new workspace')
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
          <PropRow name="workspaces" type="Workspace[]" description="Array of available workspaces" />
          <PropRow name="onSelectWorkspace" type="(id: string) => void" description="Called when user selects a workspace" />
          <PropRow name="onCreateWorkspace" type="() => void" description="Called when user clicks 'New workspace' action" />
          <PropRow name="onCloneWorkspace" type="(id: string) => void" description="Called when user clones an existing workspace" />
          <PropRow name="onOpenWorkspace" type="(id: string) => void" description="Called when user clicks 'Open' action" />
        </PropsTable>
      </ShowcaseSection>
    </div>
  )
}
