export function getHeatmapColor(value: number, minValue: number, maxValue: number, baseColor: string): string {
  const t = (value - minValue) / (maxValue - minValue || 1)
  const alpha = Math.round((0.12 + t * 0.88) * 255)
    .toString(16)
    .padStart(2, '0')
  const color = baseColor.replace('#', '')
  return `#${color}${alpha}`
}
