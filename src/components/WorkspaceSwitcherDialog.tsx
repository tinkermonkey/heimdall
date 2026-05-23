import React from 'react'
import { Modal } from './Modal'
import { Icon } from './Icon'
import type { IconName } from './Icon'
import './WorkspaceSwitcherDialog.css'

export interface Workspace {
  id: string
  name: string
  path?: string
  classCount?: number
  individualCount?: number
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

interface ActionTileProps {
  icon: IconName
  title: string
  description: string
  onClick: () => void
}

function ActionTile({ icon, title, description, onClick }: ActionTileProps) {
  return (
    <button className="workspace-switcher-dialog__action-tile" onClick={onClick}>
      <div className="workspace-switcher-dialog__action-icon">
        <Icon name={icon} size={20} />
      </div>
      <div className="workspace-switcher-dialog__action-title">{title}</div>
      <div className="workspace-switcher-dialog__action-desc">{description}</div>
    </button>
  )
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
            <ActionTile
              icon="download"
              title="Open folder…"
              description="Point to an existing workspace directory"
              onClick={onOpenFolder}
            />
            <ActionTile
              icon="plus"
              title="New workspace…"
              description="Initialize a fresh local workspace"
              onClick={onNewWorkspace}
            />
            <ActionTile
              icon="copy"
              title="Clone from git…"
              description="Pull a workspace from a remote repository"
              onClick={onCloneFromGit}
            />
          </div>

          {recent.length > 0 && (
            <div className="workspace-switcher-dialog__recent">
              <div className="workspace-switcher-dialog__recent-header">
                Recent
              </div>
              <div className="workspace-switcher-dialog__recent-list">
                {recent.map((workspace) => {
                  const isCurrent = current?.id === workspace.id
                  return (
                    <button
                      key={workspace.id}
                      className={`workspace-switcher-dialog__recent-item ${isCurrent ? 'workspace-switcher-dialog__recent-item--current' : ''}`}
                      onClick={() => onPickRecent(workspace)}
                    >
                      <div className="workspace-switcher-dialog__recent-main">
                        <span className="workspace-switcher-dialog__recent-name">
                          {workspace.name}
                        </span>
                        {isCurrent && (
                          <span className="workspace-switcher-dialog__open-badge">open</span>
                        )}
                      </div>
                      <div className="workspace-switcher-dialog__recent-meta">
                        {workspace.path && (
                          <span className="workspace-switcher-dialog__recent-path">
                            {workspace.path}
                          </span>
                        )}
                        {(workspace.classCount != null || workspace.individualCount != null) && (
                          <span className="workspace-switcher-dialog__recent-stats">
                            {workspace.classCount != null && `${workspace.classCount} cls`}
                            {workspace.classCount != null && workspace.individualCount != null && ' · '}
                            {workspace.individualCount != null && `${workspace.individualCount} ind`}
                          </span>
                        )}
                      </div>
                    </button>
                  )
                })}
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
