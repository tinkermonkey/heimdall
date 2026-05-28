import { useState } from 'react'
import {
  Modal,
  ConfirmDialog,
  Toast,
  CommandPalette,
  Drawer,
  WorkspaceSwitcherDialog,
  Button,
  type ModalSize,
  type ConfirmDialogVariant,
  type ToastVariant,
} from '@tinkermonkey/heimdall-ui'
import { BareSection, AxisRow, Caption } from '../components/BareSection'

const MODAL_SIZES: ModalSize[] = ['sm', 'md', 'lg', 'xl']
const TOAST_VARIANTS: ToastVariant[] = ['success', 'error', 'warning', 'info']
const CONFIRM_VARIANTS: ConfirmDialogVariant[] = ['primary', 'danger']

function Trigger({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return <Button onClick={onClick}>{children}</Button>
}

export function BareModal() {
  const [open, setOpen] = useState<ModalSize | null>(null)
  return (
    <BareSection name="Modal">
      <AxisRow label="default">
        <Trigger onClick={() => setOpen('md')}>Open default</Trigger>
      </AxisRow>
      <AxisRow label="size">
        {MODAL_SIZES.map(size => (
          <Caption key={size} label={size}>
            <Button onClick={() => setOpen(size)}>{`Open ${size}`}</Button>
          </Caption>
        ))}
      </AxisRow>
      {open && (
        <Modal
          isOpen
          onClose={() => setOpen(null)}
          size={open}
          title={`${open} modal`}
          subtitle="Default styling"
          footer={
            <>
              <Button variant="secondary" onClick={() => setOpen(null)}>Cancel</Button>
              <Button onClick={() => setOpen(null)}>Confirm</Button>
            </>
          }
          hintFooter="Press Esc to close."
        >
          <p style={{ margin: 0 }}>
            Default modal body for size <code>{open}</code>.
          </p>
        </Modal>
      )}
    </BareSection>
  )
}

export function BareConfirmDialog() {
  const [open, setOpen] = useState<ConfirmDialogVariant | null>(null)
  return (
    <BareSection name="ConfirmDialog">
      <AxisRow label="default (danger)">
        <Button onClick={() => setOpen('danger')}>Open default</Button>
      </AxisRow>
      <AxisRow label="variant">
        {CONFIRM_VARIANTS.map(v => (
          <Caption key={v} label={v}>
            <Button onClick={() => setOpen(v)}>{`Open ${v}`}</Button>
          </Caption>
        ))}
      </AxisRow>
      {open && (
        <ConfirmDialog
          isOpen
          variant={open}
          onClose={() => setOpen(null)}
          onConfirm={() => setOpen(null)}
          title="Delete record"
          subtitle="cls_organism"
          message={<>This will unlink 47 individuals. Continue?</>}
        />
      )}
    </BareSection>
  )
}

export function BareToast() {
  const [open, setOpen] = useState<ToastVariant | 'default' | null>(null)
  return (
    <BareSection name="Toast">
      <AxisRow label="default">
        <Button onClick={() => setOpen('default')}>Show default</Button>
      </AxisRow>
      <AxisRow label="variant">
        {TOAST_VARIANTS.map(v => (
          <Caption key={v} label={v}>
            <Button onClick={() => setOpen(v)}>{v}</Button>
          </Caption>
        ))}
      </AxisRow>
      {open && (
        <Toast
          isOpen
          onClose={() => setOpen(null)}
          variant={open === 'default' ? undefined : open}
          title={`${open} toast`}
          subtitle="Default styling demo."
          duration={0}
        />
      )}
    </BareSection>
  )
}

export function BareCommandPalette() {
  const [open, setOpen] = useState(false)
  return (
    <BareSection name="CommandPalette">
      <AxisRow label="default">
        <Button onClick={() => setOpen(true)}>Open</Button>
      </AxisRow>
      <CommandPalette
        isOpen={open}
        onClose={() => setOpen(false)}
        commands={[
          { id: 'new', label: 'New schema', icon: 'plus', group: 'Create', onSelect: () => setOpen(false) },
          { id: 'open', label: 'Open workspace', icon: 'folder', group: 'Navigate', onSelect: () => setOpen(false) },
          { id: 'search', label: 'Search records', icon: 'search', group: 'Navigate', onSelect: () => setOpen(false) },
          { id: 'settings', label: 'Open settings', icon: 'settings', group: 'Recent', onSelect: () => setOpen(false) },
          { id: 'help', label: 'Show keyboard shortcuts', icon: 'help', group: 'Recent', onSelect: () => setOpen(false) },
        ]}
      />
    </BareSection>
  )
}

export function BareDrawer() {
  const [open, setOpen] = useState<'left' | 'right' | null>(null)
  return (
    <BareSection name="Drawer">
      <AxisRow label="default (right)">
        <Button onClick={() => setOpen('right')}>Open right</Button>
      </AxisRow>
      <AxisRow label="position">
        <Caption label="right"><Button onClick={() => setOpen('right')}>Open right</Button></Caption>
        <Caption label="left"><Button onClick={() => setOpen('left')}>Open left</Button></Caption>
      </AxisRow>
      {open && (
        <Drawer isOpen onClose={() => setOpen(null)} position={open} title={`${open} drawer`}>
          <p style={{ margin: 0 }}>Drawer body. Default width 320px.</p>
        </Drawer>
      )}
    </BareSection>
  )
}

export function BareWorkspaceSwitcherDialog() {
  const [open, setOpen] = useState(false)
  return (
    <BareSection name="WorkspaceSwitcherDialog">
      <AxisRow label="default">
        <Button onClick={() => setOpen(true)}>Open</Button>
      </AxisRow>
      <WorkspaceSwitcherDialog
        isOpen={open}
        onClose={() => setOpen(false)}
        onPickRecent={() => setOpen(false)}
        current={{ id: 'cur', name: 'Untitled workspace', path: '~/work/heimdall', classCount: 12, individualCount: 412 }}
        recent={[
          { id: 'a', name: 'biome-sandbox', path: '~/work/biome', classCount: 8, individualCount: 124 },
          { id: 'b', name: 'climate-eval', path: '~/work/climate', classCount: 3, individualCount: 56 },
        ]}
        onOpenFolder={() => setOpen(false)}
        onNewWorkspace={() => setOpen(false)}
        onCloneFromGit={() => setOpen(false)}
      />
    </BareSection>
  )
}
