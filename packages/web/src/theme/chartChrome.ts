/** 图表与提示气泡读取当前皮肤的 CSS 变量，避免手账白上仍画白网格。 */

export const chartTooltipStyle = {
  background: 'var(--chart-tooltip-bg)',
  border: '1px solid var(--chart-tooltip-border)',
  borderRadius: 10,
  fontSize: 12,
  color: 'var(--chart-tooltip-text)',
} as const

export const chartTooltipLabel = { color: 'var(--chart-tooltip-label)' } as const
