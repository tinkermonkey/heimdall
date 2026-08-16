import type { BaseGraphNodeComponentProps } from '../index'
import './GalaxySphereNode.css'

// Ported from the POC's galaxy_chart.css .node-level-N rules — one stroke color per hierarchy
// depth so the eye can read structure depth at a glance. Depth 0 (root) falls back to the base
// cyan stroke, same as the POC (only levels 1+ got their own color).
const DEPTH_COLORS = ['#5bc0de', '#ff8400', '#ff00b6', '#a400ff', '#0003ff']

export interface GalaxySphereNodeProps extends BaseGraphNodeComponentProps {
  radius: number
  depth: number
}

/**
 * Minimal "sphere with title" node, ported from the POC's CircleNodeHandler: a plain circle
 * (radius driven by the node's `size`, see budgetNodeRadius) with its title centered and
 * truncated to fit, colored stroke by hierarchy depth. Deliberately bare — no domain swatch, no
 * kind badge, no hover/selection chrome beyond a stroke-width bump — so this reads purely as a
 * layout stress test, not a component showcase.
 */
export function GalaxySphereNode({ id, label, selected, onSelect, radius, depth }: GalaxySphereNodeProps) {
  const diameter = radius * 2
  // Same truncation heuristic as the POC: roughly one character per 8px of diameter.
  const maxChars = Math.max(1, Math.ceil(diameter / 8))
  const title = label.length > maxChars ? label.slice(0, maxChars) : label

  return (
    <div
      className={['galaxy-sphere-node', selected && 'selected'].filter(Boolean).join(' ')}
      style={{ width: diameter, height: diameter, borderColor: DEPTH_COLORS[Math.min(depth, DEPTH_COLORS.length - 1)] }}
      onClick={(e) => { e.stopPropagation(); onSelect?.(id) }}
      role={onSelect ? 'button' : undefined}
      tabIndex={onSelect ? 0 : undefined}
      title={label}
    >
      <span className="galaxy-sphere-node__title">{title}</span>
    </div>
  )
}

export default GalaxySphereNode
