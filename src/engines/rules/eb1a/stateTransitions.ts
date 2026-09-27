import type { ClaimFit, EvidenceStatus, PropositionClaimStatus } from '../../../types/visa/eb1a'

const criterionClaimTypes: Record<string, string[]> = {
  C1: ['AWARD'], C2: ['MEMBERSHIP'], C3: ['MEDIA'], C4: ['JUDGING'],
  C5: ['CONTRIBUTION'], C6: ['PUBLICATION'], C7: ['EXHIBITION'],
  C8: ['LEADERSHIP'], C9: ['COMPENSATION'], C10: ['COMMERCIAL_SUCCESS'],
}

export function resolveClaimFit(input: {
  criterionCode: string
  normalizedType?: string
  mappedFit?: ClaimFit
}): ClaimFit {
  if (input.mappedFit) {
    return input.mappedFit === 'NOT_A_MATCH' ? 'NOT_RELEVANT' : input.mappedFit
  }

  if (!input.normalizedType) return 'UNCLEAR'
  return criterionClaimTypes[input.criterionCode]?.includes(input.normalizedType)
    ? 'POTENTIAL_MATCH'
    : 'NOT_RELEVANT'
}

/** A claim-level assertion is deliberately not elevated to independently supported evidence. */
export function claimSignalToEvidenceStatus(signal?: PropositionClaimStatus): EvidenceStatus {
  if (signal === 'SUPPORTED_BY_CLAIM' || signal === 'UNCLEAR') return 'UNVERIFIED'
  return 'INSUFFICIENT_EVIDENCE'
}

export function summarizePropositionStatuses(statuses: readonly EvidenceStatus[]): EvidenceStatus {
  if (statuses.length === 0) return 'NOT_APPLICABLE'
  if (statuses.includes('CONFLICTING')) return 'CONFLICTING'
  if (statuses.includes('NOT_SUPPORTED')) return 'NOT_SUPPORTED'
  if (statuses.includes('PARTIALLY_SUPPORTED')) return 'PARTIALLY_SUPPORTED'
  if (statuses.includes('INSUFFICIENT_EVIDENCE')) return 'INSUFFICIENT_EVIDENCE'
  if (statuses.includes('UNVERIFIED')) return 'UNVERIFIED'
  if (statuses.every((status) => status === 'NOT_APPLICABLE')) return 'NOT_APPLICABLE'
  return 'SUPPORTED'
}
