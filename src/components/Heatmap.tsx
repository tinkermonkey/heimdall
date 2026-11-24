import React from 'react'
import { TONE, fmt, type ChartTone } from './chartTone'

export interface HeatmapProps extends Omit<React.SVGAttributes<SVGSVGElement>, 'children'> {
  /** 2-D array of [rows][cols] values. null cells render as inset background. */
  data: (number | null)[][]
  /** CSS color for the hot end of the single-hue scale (default emerald). Cells paint it at an
   *  opacity from 0.12 to 1, so a color that already has alpha renders fainter. */
  baseColor?: string
  xLabels?: string[]
  yLabels?: string[]
  width?: number
  height?: number
  axes?: boolean
  tone?: ChartTone
  /** Render the numeric value inside each non-null cell */
  showValues?: boolean
  /** Override the default formatter for cell values */
  valueFormat?: (value: number) => string
  /** Render a custom marker overlay on specific cells. Called once per cell with (row, col, value). Return null/undefined/false to skip rendering for that cell. */
  cellMark?: (row: number, col: number, value: number | null) => React.ReactNode
  /** Accessible label for the SVG */
  ariaLabel?: string
  className?: string
  style?: React.CSSProperties
}

export const Heatmap = React.forwardRef<SVGSVGElement, HeatmapProps>(
  (
    {
      data,
      baseColor = 'rgb(var(--status-emerald))',
      xLabels,
      yLabels,
      width = 480,
      height = 120,
      axes = false,
      tone = 'light',
      showValues = false,
      valueFormat,
      cellMark,
      ariaLabel,
      className = '',
      style,
      ...rest
    },
    ref
  ) => {
    const T = TONE[tone]

    if (!data || data.length === 0) return null

    const rows = data.length
    const cols = data[0].length
    const pad = { top: 4, right: 8, bottom: axes ? 18 : 4, left: axes ? 28 : 4 }
    const cw = (width - pad.left - pad.right) / cols
    const ch = (height - pad.top - pad.bottom) / rows

    const flat = data.flat().filter((v): v is number => v != null && !isNaN(v))
    const lo = flat.length ? Math.min(...flat) : 0
    const hi = flat.length ? Math.max(...flat) : 1

    const formatValue = valueFormat ?? fmt

    // Empty cells paint a solid inset; valued cells paint baseColor at an opacity quantized to
    // 1/255 steps, from 0.12 at the low end to 1 at the high end.
    function shade(v: number | null): { fill: string; fillOpacity?: number } {
      if (v == null || isNaN(v)) return { fill: T.inset }
      const t = (v - lo) / (hi - lo || 1)
      return { fill: baseColor, fillOpacity: Math.round((0.12 + t * 0.88) * 255) / 255 }
    }

    function getTextColor(v: number): string {
      const t = (v - lo) / (hi - lo || 1)
      // Light text (white/fg1) when intensity > 0.55 ensures contrast against hot end of ramp
      return t > 0.55 ? '#FFFFFF' : T.fg1
    }

    return (
      <svg
        ref={ref}
        role="img"
        aria-label={ariaLabel ?? 'Heatmap'}
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className={className}
        style={{ display: 'block', ...style }}
        {...rest}
      >
        {ariaLabel && <title>{ariaLabel}</title>}
        {data.map((row, r) =>
          row.map((v, c) => {
            const cellX = pad.left + c * cw + 1
            const cellY = pad.top + r * ch + 1
            const cellCenterX = cellX + (cw - 2) / 2
            const cellCenterY = cellY + (ch - 2) / 2
            const mark = cellMark?.(r, c, (v != null && !isNaN(v)) ? v : null)
            const { fill, fillOpacity } = shade(v)
            return (
              <g key={`${r}-${c}`}>
                <rect
                  x={cellX}
                  y={cellY}
                  width={Math.max(0, cw - 2)}
                  height={Math.max(0, ch - 2)}
                  fill={fill}
                  fillOpacity={fillOpacity}
                  rx="2"
                />
                {showValues && v != null && !isNaN(v) && (
                  <text
                    x={cellCenterX}
                    y={cellCenterY + 3.5}
                    textAnchor="middle"
                    fontFamily="JetBrains Mono, monospace"
                    fontSize="10"
                    fill={getTextColor(v)}>
                    {formatValue(v)}
                  </text>
                )}
                {mark && (
                  <g transform={`translate(${cellCenterX}, ${cellCenterY})`}>
                    {mark}
                  </g>
                )}
              </g>
            )
          })
        )}
        {axes && yLabels && yLabels.map((lab, i) => (
          <text key={'y' + i}
            x={pad.left - 6} y={pad.top + i * ch + ch / 2 + 3}
            textAnchor="end" fontFamily="JetBrains Mono, monospace" fontSize="9.5" fill={T.fg3}>
            {lab}
          </text>
        ))}
        {axes && xLabels && xLabels.map((lab, i) => (
          <text key={'x' + i}
            x={pad.left + i * cw + cw / 2} y={height - pad.bottom + 12}
            textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="9.5" fill={T.fg3}>
            {lab}
          </text>
        ))}
      </svg>
    )
  }
)

Heatmap.displayName = 'Heatmap'
export default Heatmap
