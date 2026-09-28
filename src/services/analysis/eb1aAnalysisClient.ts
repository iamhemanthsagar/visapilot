import type { AIExecutionRecord, MapClaimsToCriteriaInput } from '../../types/visa/eb1a'
import type { MapClaimsToCriteriaContractOutput } from '../../ai/eb1a/contract'
import { logAIRequest, logAIResponse, logAIError } from '../aiLogger'

export type EB1AAnalysisClientResult = {
  output: MapClaimsToCriteriaContractOutput
  execution: AIExecutionRecord
}

export async function requestEB1AClaimMapping(
  input: MapClaimsToCriteriaInput,
): Promise<EB1AAnalysisClientResult> {
  logAIRequest('MAP_CLAIMS_TO_CRITERIA', {
    claimsCount: input.claims.length,
    criteriaScope: 'All 10 EB-1A regulatory criteria',
  })

  try {
    const response = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        operation: 'MAP_CLAIMS_TO_CRITERIA',
        input,
      }),
    })

    const data = await response.json().catch(() => null) as {
      error?: string
      output?: MapClaimsToCriteriaContractOutput
      execution?: AIExecutionRecord
    } | null

    if (!response.ok) {
      throw new Error(data?.error || `AI criterion mapping failed (${response.status}).`)
    }

    if (!data?.output || !data.execution) {
      throw new Error('AI criterion mapping returned an incomplete response.')
    }

    logAIResponse('MAP_CLAIMS_TO_CRITERIA', data.execution, {
      mappedClaims: data.output.mappings.length,
    })

    return {
      output: data.output,
      execution: data.execution,
    }
  } catch (err) {
    logAIError('MAP_CLAIMS_TO_CRITERIA', err)
    throw err
  }
}
