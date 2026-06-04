export function normalizeColorToHex(color: string): string {
  const trimmed = color.trim()

  // Already hex format
  if (/^#[0-9a-fA-F]{6}$/i.test(trimmed)) {
    return trimmed
  }

  // 3-digit hex — expand to 6-digit
  if (/^#[0-9a-fA-F]{3}$/i.test(trimmed)) {
    const shortColor = trimmed.slice(1)
    return '#' + shortColor[0] + shortColor[0] + shortColor[1] + shortColor[1] + shortColor[2] + shortColor[2]
  }

  // rgb(r, g, b) or rgba(r, g, b, a)
  const rgbMatch = trimmed.match(/rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/)
  if (rgbMatch) {
    const r = Math.max(0, Math.min(255, parseInt(rgbMatch[1], 10)))
    const g = Math.max(0, Math.min(255, parseInt(rgbMatch[2], 10)))
    const b = Math.max(0, Math.min(255, parseInt(rgbMatch[3], 10)))
    return '#' + [r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('')
  }

  // Named colors — map common ones
  const namedColors: Record<string, string> = {
    black: '#000000',
    white: '#ffffff',
    red: '#ff0000',
    green: '#008000',
    blue: '#0000ff',
    yellow: '#ffff00',
    cyan: '#00ffff',
    magenta: '#ff00ff',
    gray: '#808080',
    silver: '#c0c0c0',
  }

  const lowerColor = trimmed.toLowerCase()
  if (lowerColor in namedColors) {
    return namedColors[lowerColor]
  }

  // Default to black if unrecognized
  return '#000000'
}

export function getHeatmapColor(value: number, minValue: number, maxValue: number, baseColor: string): string {
  const t = (value - minValue) / (maxValue - minValue || 1)
  const alpha = Math.round((0.12 + t * 0.88) * 255)
    .toString(16)
    .padStart(2, '0')
  const hex = normalizeColorToHex(baseColor)
  return `${hex}${alpha}`
}
