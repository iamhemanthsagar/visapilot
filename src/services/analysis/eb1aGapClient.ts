import type { GapGenerationInput, GapGenerationOutput, AIExecutionRecord } from '../../types/visa/eb1a'
import { logAIRequest, logAIResponse, logAIError } from '../aiLogger'

export async function requestEB1AGapGeneration(input: GapGenerationInput): Promise<{ output: GapGenerationOutput; execution: AIExecutionRecord }> {
  logAIRequest('GENERATE_GAPS_AND_ACTIONS', {
    criterionResultsCount: input.criterionResults.length,
    comparableEvidenceCount: input.comparableEvidence.length,
  })

  try {
    const response = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ operation: 'GENERATE_GAPS_AND_ACTIONS', input }),
    })
    const data = await response.json().catch(() => null) as { error?: string; output?: GapGenerationOutput; execution?: AIExecutionRecord } | null
    if (!response.ok) throw new Error(data?.error || `Gap analysis failed (${response.status}).`)
    if (!data?.output || !data.execution) throw new Error('Gap analysis returned an incomplete response.')

    logAIResponse('GENERATE_GAPS_AND_ACTIONS', data.execution, {
      gapsIdentified: data.output.gaps.length,
    })

    return { output: data.output, execution: data.execution }
  } catch (err) {
    logAIError('GENERATE_GAPS_AND_ACTIONS', err)
    throw err
  }
}
