import type { AIExecutionRecord, ReconcileEvidenceInput } from '../../types/visa/eb1a'
import type { ReconcileEvidenceContractOutput } from '../../ai/eb1a/contract'
import { logAIRequest, logAIResponse, logAIError } from '../aiLogger'

export async function requestEB1AEvidenceReconciliation(input: ReconcileEvidenceInput): Promise<{
  output: ReconcileEvidenceContractOutput
  execution: AIExecutionRecord
}> {
  const compactInput: ReconcileEvidenceInput = {
    ...input,
    claim: {
      ...input.claim,
      extractedFacts: {
        sectionTitle: input.claim.extractedFacts.sectionTitle ?? null,
        sourcePage: input.claim.extractedFacts.sourcePage ?? null,
        verificationStatus: input.claim.extractedFacts.verificationStatus ?? null,
        verificationReason: input.claim.extractedFacts.verificationReason ?? null,
      },
      criterionCandidates: [],
      provenance: input.claim.provenance.slice(0, 3),
    },
    evidence: input.evidence.map(item => ({
      ...item,
      provenance: item.provenance.slice(0, 3),
      content: item.content.slice(0, 6000),
    })),
  }

  logAIRequest('RECONCILE_EVIDENCE', {
    claimId: input.claim.id,
    criterion: input.criterion.code,
    evidenceItems: input.evidence.length,
  })

  try {
    const response = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ operation: 'RECONCILE_EVIDENCE', input: compactInput }),
    })
    const data = await response.json().catch(() => null) as {
      error?: string
      output?: ReconcileEvidenceContractOutput
      execution?: AIExecutionRecord
    } | null
    if (!response.ok) throw new Error(data?.error || `Evidence reconciliation failed (${response.status}).`)
    if (!data?.output || !data.execution) throw new Error('Evidence reconciliation returned an incomplete response.')

    logAIResponse('RECONCILE_EVIDENCE', data.execution, {
      claimStatus: data.output.claimVerification.status,
      assessmentsCount: data.output.evidenceAssessments.length,
    })

    return { output: data.output, execution: data.execution }
  } catch (err) {
    logAIError('RECONCILE_EVIDENCE', err)
    throw err
  }
}
