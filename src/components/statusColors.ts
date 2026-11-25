export type StatusColor = 'emerald' | 'amber' | 'rose' | 'cyan' | 'violet' | 'neutral'

export const statusColorMap: Record<StatusColor, string> = {
  emerald: 'rgb(var(--status-emerald))',
  amber: 'rgb(var(--status-amber))',
  rose: 'rgb(var(--status-rose))',
  cyan: 'rgb(var(--status-cyan))',
  violet: 'rgb(var(--status-violet))',
  neutral: 'rgb(var(--canvas-fg-2))',
}

export interface ChartSeries {
  name: string
  data: number[]
  color?: StatusColor
}

export interface LineChartSeries extends ChartSeries {
  filled?: boolean
}

export interface BarChartSeries extends ChartSeries {}
