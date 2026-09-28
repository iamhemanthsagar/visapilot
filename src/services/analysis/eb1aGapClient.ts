import type { GapGenerationInput, GapGenerationOutput, AIExecutionRecord } from '../../types/visa/eb1a'

export async function requestEB1AGapGeneration(input: GapGenerationInput): Promise<{ output: GapGenerationOutput; execution: AIExecutionRecord }> {
  const response = await fetch('/api/ai', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ operation: 'GENERATE_GAPS_AND_ACTIONS', input }),
  })
  const data = await response.json().catch(() => null) as { error?: string; output?: GapGenerationOutput; execution?: AIExecutionRecord } | null
  if (!response.ok) throw new Error(data?.error || `Gap analysis failed (${response.status}).`)
  if (!data?.output || !data.execution) throw new Error('Gap analysis returned an incomplete response.')
  return { output: data.output, execution: data.execution }
}
