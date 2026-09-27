import type {
  CandidateClaim,
  CriterionDefinition,
  CriterionResult,
  PropositionClaimStatus,
  PropositionDefinition,
  PropositionResult,
  Provenance,
} from '../../../types/visa/eb1a'
import { claimSignalToEvidenceStatus, resolveClaimFit, summarizePropositionStatuses } from './stateTransitions.ts'

export type ClaimCriterionAssessmentInput = {
  claim: CandidateClaim
  criterion: CriterionDefinition
  propositions: readonly PropositionDefinition[]
  /** Explicitly supplied by a calling workflow when professional review is needed. */
  requiresCounselReview?: boolean
  assessedAt?: string
}

type PropositionSignals = Record<string, PropositionClaimStatus>

function getPropositionSignals(extractedFacts: Record<string, unknown>): PropositionSignals {
  const candidate = extractedFacts.propositionSignals
  if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) return {}

  const validStatuses = new Set<PropositionClaimStatus>([
    'SUPPORTED_BY_CLAIM', 'PARTIALLY_ESTABLISHED', 'NOT_ESTABLISHED', 'UNCLEAR',
  ])

  return Object.fromEntries(
    Object.entries(candidate).filter((entry): entry is [string, PropositionClaimStatus] =>
      typeof entry[1] === 'string' && validStatuses.has(entry[1] as PropositionClaimStatus),
    ),
  )
}

function inferredClaimSignal(claim: CandidateClaim, criterion: CriterionDefinition, proposition: PropositionDefinition): PropositionClaimStatus | undefined {
  if (criterion.code === 'C5' && claim.normalizedType === 'CONTRIBUTION' &&
    (proposition.name === 'contribution_identity' || proposition.name === 'candidate_attribution')) {
    return 'SUPPORTED_BY_CLAIM'
  }

  if (criterion.code === 'C8' && claim.normalizedType === 'LEADERSHIP' &&
    proposition.name === 'leading_or_critical_role' && claim.extractedFacts.roleSubstance === true) {
    return 'SUPPORTED_BY_CLAIM'
  }

  if (criterion.code === 'C8' && claim.normalizedType === 'LEADERSHIP' &&
    proposition.name === 'actual_responsibilities' && claim.extractedFacts.roleSubstance === true) {
    return 'SUPPORTED_BY_CLAIM'
  }

  return undefined
}

function assessmentProvenance(claim: CandidateClaim, criterion: CriterionDefinition, assessedAt?: string): Provenance[] {
  return [
    ...claim.provenance,
    {
      sourceType: 'SYSTEM_RULE',
      sourceId: criterion.id,
      ruleVersion: criterion.version,
      ...(assessedAt ? { extractedAt: assessedAt } : {}),
    },
  ]
}

function propositionResult(
  proposition: PropositionDefinition,
  fit: CriterionResult['claimFit'],
  signals: PropositionSignals,
  claim: CandidateClaim,
  criterion: CriterionDefinition,
  assessedAt?: string,
): PropositionResult {
  if (fit === 'NOT_RELEVANT') {
    return { propositionId: proposition.id, status: 'NOT_APPLICABLE', evidenceIds: [], rationale: 'The claim has no meaningful relationship to this criterion.', missingInformation: [], provenance: assessmentProvenance(claim, criterion, assessedAt) }
  }

  const signal = signals[proposition.id] ?? inferredClaimSignal(claim, criterion, proposition)
  const status = claimSignalToEvidenceStatus(signal)
  const rationale = signal === 'SUPPORTED_BY_CLAIM'
    ? 'The candidate asserts this proposition, but no independent evidence is evaluated in this phase.'
    : 'The current claim does not establish this proposition; evidence evaluation is outside this phase.'

  return {
    propositionId: proposition.id,
    status,
    evidenceIds: [],
    rationale,
    missingInformation: status === 'INSUFFICIENT_EVIDENCE' ? ['Evidence to substantiate this proposition.'] : ['Independent verification of the candidate assertion.'],
    provenance: assessmentProvenance(claim, criterion, assessedAt),
  }
}

/**
 * Produces a deterministic Pass-1 assessment from structured claim data.
 * It never retrieves or reconciles evidence, and never produces an eligibility decision or score.
 */
export function assessClaimAgainstCriterion(input: ClaimCriterionAssessmentInput): CriterionResult {
  const mapping = input.claim.criterionCandidates.find(({ criterionId }) => criterionId === input.criterion.id)
  const claimFit = resolveClaimFit({
    criterionCode: input.criterion.code,
    normalizedType: input.claim.normalizedType,
    mappedFit: mapping?.fit,
  })
  const provenance = assessmentProvenance(input.claim, input.criterion, input.assessedAt)
  const signals = getPropositionSignals(input.claim.extractedFacts)
  const propositionResults = input.propositions.map((proposition) =>
    propositionResult(proposition, claimFit, signals, input.claim, input.criterion, input.assessedAt),
  )
  const overallEvidenceStatus = summarizePropositionStatuses(propositionResults.map(({ status }) => status))

  return {
    criterionId: input.criterion.id,
    claimFit,
    propositionResults,
    supportingEvidenceIds: [],
    overallEvidenceStatus,
    counselReview: input.requiresCounselReview === true,
    gaps: [],
    ruleVersion: input.criterion.version,
    provenance,
  }
}
