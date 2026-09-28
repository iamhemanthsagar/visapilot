import type { ReactNode } from 'react'

type StatusTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info'

export function StatusPill({
  children,
  tone = 'neutral',
}: {
  children: ReactNode
  tone?: StatusTone
}) {
  return <span className={`status-pill status-pill--${tone}`}>{children}</span>
}
