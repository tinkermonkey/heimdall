import React from 'react'
import { Modal } from './Modal'
import { QuickAccessTile } from './QuickAccessTile'
import './WorkspaceSwitcherDialog.css'

export interface Workspace {
  id: string
  name: string
  path?: string
}

export interface WorkspaceSwitcherDialogProps {
  isOpen: boolean
  onClose: () => void
  current?: Workspace
  recent: Workspace[]
  onOpenFolder: () => void
  onNewWorkspace: () => void
  onCloneFromGit: () => void
  onPickRecent: (workspace: Workspace) => void
}

export const WorkspaceSwitcherDialog = React.forwardRef<HTMLDivElement, WorkspaceSwitcherDialogProps>(
  ({
    isOpen,
    onClose,
    current,
    recent,
    onOpenFolder,
    onNewWorkspace,
    onCloneFromGit,
    onPickRecent,
  }, ref) => {
    return (
      <Modal
        ref={ref}
        isOpen={isOpen}
        onClose={onClose}
        title="Switch Workspace"
      >
        <div className="workspace-switcher-dialog__content">
          <div className="workspace-switcher-dialog__tiles">
            <QuickAccessTile
              icon="download"
              title="Open"
              description="Open an existing folder"
              onClick={onOpenFolder}
            />
            <QuickAccessTile
              icon="plus"
              title="New"
              description="Create a new workspace"
              onClick={onNewWorkspace}
            />
            <QuickAccessTile
              icon="copy"
              title="Clone"
              description="Clone from Git repository"
              onClick={onCloneFromGit}
            />
          </div>

          {recent.length > 0 && (
            <div className="workspace-switcher-dialog__recent">
              <div className="workspace-switcher-dialog__recent-header">
                Recent Workspaces
              </div>
              <div className="workspace-switcher-dialog__recent-list">
                {recent.map((workspace) => (
                  <button
                    key={workspace.id}
                    className={`workspace-switcher-dialog__recent-item ${
                      current?.id === workspace.id
                        ? 'workspace-switcher-dialog__recent-item--current'
                        : ''
                    }`}
                    onClick={() => onPickRecent(workspace)}
                  >
                    <div className="workspace-switcher-dialog__recent-name">
                      {workspace.name}
                    </div>
                    {workspace.path && (
                      <div className="workspace-switcher-dialog__recent-path">
                        {workspace.path}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </Modal>
    )
  }
)

WorkspaceSwitcherDialog.displayName = 'WorkspaceSwitcherDialog'

export default WorkspaceSwitcherDialog
