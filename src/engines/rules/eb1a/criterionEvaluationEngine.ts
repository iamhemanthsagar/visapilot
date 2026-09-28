import { EB1A_CRITERIA } from '../../../data/visa/eb1a/criteria'
import type { EB1AAnalysisResult } from '../../../types/analysis/eb1aAnalysis'
import type { CriterionResult, EvidenceStatus } from '../../../types/visa/eb1a'

export type CriterionReview = {
  criterionId: string
  code: (typeof EB1A_CRITERIA)[number]['code']
  title: string
  regulatoryRequirement: string
  result: CriterionResult
  applicablePropositions: number
  supportedPropositions: number
  partialPropositions: number
  unresolvedPropositions: number
  evidenceCount: number
}

export type EB1ACriteriaReview = {
  ruleVersion: string
  criteria: CriterionReview[]
  supportedForReviewCount: number
  partiallySupportedCount: number
  unresolvedCount: number
  conflictingCount: number
  criteriaWithMappedClaims: number
}

function criterionOverall(statuses: EvidenceStatus[]): EvidenceStatus {
  const applicable = statuses.filter(status => status !== 'NOT_APPLICABLE')
  if (!applicable.length) return 'NOT_APPLICABLE'
  if (applicable.includes('CONFLICTING')) return 'CONFLICTING'
  if (applicable.every(status => status === 'SUPPORTED')) return 'SUPPORTED'
  if (applicable.some(status => status === 'SUPPORTED' || status === 'PARTIALLY_SUPPORTED')) return 'PARTIALLY_SUPPORTED'
  if (applicable.includes('UNVERIFIED')) return 'UNVERIFIED'
  if (applicable.includes('NOT_SUPPORTED')) return 'NOT_SUPPORTED'
  return 'INSUFFICIENT_EVIDENCE'
}

function normalizeResult(result: CriterionResult): CriterionResult {
  const overallEvidenceStatus = criterionOverall(result.propositionResults.map(item => item.status))
  return overallEvidenceStatus === result.overallEvidenceStatus
    ? result
    : { ...result, overallEvidenceStatus }
}

export function evaluateEB1ACriteria(analysis: EB1AAnalysisResult): EB1ACriteriaReview {
  const byId = new Map(analysis.criterionResults.map(result => [result.criterionId, normalizeResult(result)]))
  const criteria = EB1A_CRITERIA.map(criterion => {
    const result = byId.get(criterion.id) ?? {
      criterionId: criterion.id,
      claimFit: 'NOT_RELEVANT' as const,
      propositionResults: [],
      supportingEvidenceIds: [],
      overallEvidenceStatus: 'NOT_APPLICABLE' as const,
      counselReview: false,
      gaps: [],
      ruleVersion: analysis.execution.ruleVersion,
      provenance: [],
    }
    const applicable = result.propositionResults.filter(item => item.status !== 'NOT_APPLICABLE')
    const supported = applicable.filter(item => item.status === 'SUPPORTED').length
    const partial = applicable.filter(item => item.status === 'PARTIALLY_SUPPORTED').length
    const unresolved = applicable.filter(item => ['INSUFFICIENT_EVIDENCE', 'UNVERIFIED', 'NOT_SUPPORTED', 'CONFLICTING', 'COUNSEL_REVIEW'].includes(item.status)).length
    return {
      criterionId: criterion.id,
      code: criterion.code,
      title: criterion.title,
      regulatoryRequirement: criterion.regulatoryRequirement,
      result,
      applicablePropositions: applicable.length,
      supportedPropositions: supported,
      partialPropositions: partial,
      unresolvedPropositions: unresolved,
      evidenceCount: result.supportingEvidenceIds.length,
    }
  })

  return {
    ruleVersion: analysis.execution.ruleVersion,
    criteria,
    supportedForReviewCount: criteria.filter(item => item.result.overallEvidenceStatus === 'SUPPORTED').length,
    partiallySupportedCount: criteria.filter(item => item.result.overallEvidenceStatus === 'PARTIALLY_SUPPORTED').length,
    unresolvedCount: criteria.filter(item => ['INSUFFICIENT_EVIDENCE', 'UNVERIFIED', 'NOT_SUPPORTED'].includes(item.result.overallEvidenceStatus)).length,
    conflictingCount: criteria.filter(item => item.result.overallEvidenceStatus === 'CONFLICTING').length,
    criteriaWithMappedClaims: criteria.filter(item => item.result.claimFit !== 'NOT_RELEVANT').length,
  }
}
