export type ChartTone = 'light' | 'dark'

export interface ToneTokens {
  fg1: string; fg2: string; fg3: string; fg4: string
  grid: string; border: string; card: string; inset: string
}

function toneTokens(tone: ChartTone): ToneTokens {
  const c = (name: string) => `rgb(var(--chart-${tone}-${name}))`
  return {
    fg1: c('fg-1'), fg2: c('fg-2'), fg3: c('fg-3'), fg4: c('fg-4'),
    grid: c('grid'), border: c('border'), card: c('card'), inset: c('inset'),
  }
}

// Chart chrome per `tone` prop, read from the --chart-light-* / --chart-dark-* tokens.
export const TONE: Record<ChartTone, ToneTokens> = {
  light: toneTokens('light'),
  dark: toneTokens('dark'),
}

export function fmt(n: number): string {
  return Math.abs(n) >= 1000 ? (n / 1000).toFixed(1) + 'k' : Number.isInteger(n) ? String(n) : n.toFixed(1)
}
