// Shared pieces for the lanes and hive plot docs pages: datasets, layering, playground controls,
// a code block. Kept local to those two pages.
import React from 'react'
import type { BuildLayeredIndexOptions, GraphEdgeData, GraphNodeData, LayerLayoutOptions } from '@tinkermonkey/heimdall-ui'
import {
  drCategoryOrder,
  drLayers,
  drSpecEdges,
  drSpecNodes,
  heimdallUxEdges,
  heimdallUxNodes,
} from '@/test-pages/fixtures/layeredGraphFixtures'

export const fg1 = 'rgb(var(--canvas-fg-1, 17 24 39))'
export const fg2 = 'rgb(var(--canvas-fg-2, 75 85 99))'
export const fg3 = 'rgb(var(--canvas-fg-3, 107 114 128))'
export const border = 'rgb(var(--canvas-border, 229 231 235))'
export const mono = 'var(--font-mono, "JetBrains Mono", monospace)'

/** Shared by both fixtures: `attributes.layer` and an edge `attributes.category`. */
export const LAYERING: BuildLayeredIndexOptions = {
  layerBy: 'layer',
  layers: drLayers,
  categoryOrder: drCategoryOrder,
  linkCategoryBy: 'category',
}

export type DatasetKey = 'spec' | 'ux'

export interface Dataset {
  label: string
  summary: string
  nodes: GraphNodeData[]
  edges: GraphEdgeData[]
  layout: LayerLayoutOptions
  selected: string | null
}

export const DATASETS: Record<DatasetKey, Dataset> = {
  spec: {
    label: 'DR spec',
    summary: 'Documentation Robotics spec meta-model: 36 element types, 204 relationship schemas, dense within each layer.',
    nodes: drSpecNodes,
    edges: drSpecEdges,
    // Dense: laying out on structural links only keeps the coupled order readable.
    layout: { layoutCategories: ['structural'] },
    selected: 'application.applicationcomponent',
  },
  ux: {
    label: 'Heimdall UX',
    summary: 'A model of heimdall-ui itself: 48 elements, 68 relationships, few of them across layers.',
    nodes: heimdallUxNodes,
    edges: heimdallUxEdges,
    layout: { layoutCategories: null },
    selected: null,
  },
}

export const DATASET_OPTIONS = [
  { value: 'spec', label: 'DR spec' },
  { value: 'ux', label: 'Heimdall UX' },
]

export function Code({ children }: { children: string }) {
  return (
    <pre
      style={{
        margin: '12px 0 0',
        padding: '10px 12px',
        fontFamily: mono,
        fontSize: 11.5,
        lineHeight: 1.6,
        color: fg2,
        background: 'rgb(var(--canvas-bg-2, 249 250 251))',
        border: `1px solid ${border}`,
        borderRadius: 6,
        overflowX: 'auto',
      }}
    >
      {children}
    </pre>
  )
}

export function Eyebrow({ children, minWidth }: { children: React.ReactNode; minWidth?: number }) {
  return (
    <span style={{ fontFamily: mono, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: fg3, minWidth }}>
      {children}
    </span>
  )
}

/** One labeled row of playground controls. */
export function ControlRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
      <Eyebrow minWidth={96}>{label}</Eyebrow>
      {children}
    </div>
  )
}

/** A labeled control inside a row: eyebrow then the control. */
export function Control({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginRight: 10 }}>
      <Eyebrow>{label}</Eyebrow>
      {children}
    </span>
  )
}

/** Checkbox-style toggle: a pressed button with a mono label. */
export function Toggle({ on, onChange, children }: { on: boolean; onChange: (on: boolean) => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={() => onChange(!on)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        fontFamily: mono,
        fontSize: 11,
        padding: '3px 8px',
        borderRadius: 4,
        border: `1px solid ${on ? 'rgb(var(--accent-primary) / 0.55)' : border}`,
        background: 'transparent',
        color: on ? fg1 : fg3,
        cursor: 'pointer',
      }}
    >
      <span
        aria-hidden
        style={{
          width: 9,
          height: 9,
          borderRadius: 2,
          border: `1px solid ${on ? 'rgb(var(--accent-primary))' : border}`,
          background: on ? 'rgb(var(--accent-primary))' : 'transparent',
        }}
      />
      {children}
    </button>
  )
}

/** The bordered box that holds a playground's controls. */
export function ControlPanel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '12px 14px', border: `1px solid ${border}`, borderRadius: 8, marginBottom: 12 }}>
      {children}
    </div>
  )
}

/** Mono status line under a demo. */
export function Status({ children }: { children: React.ReactNode }) {
  return <div style={{ fontFamily: mono, fontSize: 11, color: fg3, marginTop: 10, minHeight: 16 }}>{children}</div>
}

/** A small prose paragraph. */
export function Note({ children }: { children: React.ReactNode }) {
  return <p style={{ margin: '0 0 12px', fontSize: 12, color: fg2, lineHeight: 1.65 }}>{children}</p>
}
