/**
 * Browser DevTools telemetry logger for VisaPilot AI invocations
 */
export function logAIRequest(operation: string, details?: Record<string, unknown>) {
  console.groupCollapsed(
    `%c[VisaPilot AI]%c Contacting LLM → ${operation}`,
    'background: #0284c7; color: #fff; font-weight: 700; padding: 2px 6px; border-radius: 3px;',
    'color: #0284c7; font-weight: 700;'
  )
  console.log('Timestamp:', new Date().toISOString())
  if (details) {
    console.table(details)
  }
  console.groupEnd()
}

export function logAIResponse(
  operation: string,
  execution?: Record<string, unknown> | null,
  extra?: Record<string, unknown>
) {
  const provider = (execution?.provider || execution?.modelProvider || 'Unknown Provider') as string
  const model = (execution?.model || execution?.modelName || 'Unknown Model') as string
  const latency = execution?.latencyMs !== undefined ? `${execution.latencyMs}ms` : 'N/A'

  console.groupCollapsed(
    `%c[VisaPilot AI Response]%c ${operation} | %c${provider}%c (${model}) %c${latency}`,
    'background: #059669; color: #fff; font-weight: 700; padding: 2px 6px; border-radius: 3px;',
    'color: #059669; font-weight: 600;',
    'color: #0284c7; font-weight: 700;',
    'color: #64748b; font-weight: 400;',
    'background: #f1f5f9; color: #334155; padding: 1px 4px; border-radius: 3px; font-weight: 600;'
  )
  console.log('Provider:', provider)
  console.log('Model:', model)
  console.log('Latency:', latency)
  console.log('Fallback Used:', execution?.fallbackUsed ?? false)
  if (Array.isArray(execution?.attempts) && execution.attempts.length > 0) {
    console.log('Provider Attempts Sequence:')
    console.table(execution.attempts)
  }
  if (extra) {
    console.log('Response Payload:', extra)
  }
  console.groupEnd()
}

export function logAIError(operation: string, error: unknown) {
  console.group(
    `%c[VisaPilot AI Error]%c ${operation}`,
    'background: #dc2626; color: #fff; font-weight: 700; padding: 2px 6px; border-radius: 3px;',
    'color: #dc2626; font-weight: 700;'
  )
  console.error(error)
  console.groupEnd()
}
