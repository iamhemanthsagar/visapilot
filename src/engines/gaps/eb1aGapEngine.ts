import { EB1A_CRITERIA } from '../../data/visa/eb1a/criteria'
import { EB1A_PROPOSITIONS } from '../../data/visa/eb1a/propositions'
import { EB1B_REQUIREMENTS, EB1B_PROPOSITIONS } from '../../data/visa/eb1b/rules'
import { EB1C_GATES, EB1C_PROPOSITIONS } from '../../data/visa/eb1c/rules'
import type { CandidateClaim, CriterionResult, EvidenceStatus } from '../../types/visa/eb1a'
import { isIndependentEvidence, type Stage5Input, type StageGap, type StageGapType } from '../../types/stages'
import type { EvidenceRecord } from '../evidence/eb1aEvidenceEngine'

function hash(value: string): string {
  let h = 2166136261
  for (let i = 0; i < value.length; i += 1) h = Math.imul(h ^ value.charCodeAt(i), 16777619) >>> 0
  return h.toString(16).padStart(8, '0')
}

function requirementFor(id: string) {
  return (
    EB1A_CRITERIA.find(item => item.id === id) ??
    EB1B_REQUIREMENTS.find(item => item.id === id) ??
    EB1C_GATES.find(item => item.id === id)
  )
}

function propositionFor(id: string) {
  const all = [
    ...Object.values(EB1A_PROPOSITIONS).flat(),
    ...Object.values(EB1B_PROPOSITIONS).flat(),
    ...Object.values(EB1C_PROPOSITIONS).flat(),
  ]
  return all.find(item => item.id === id)
}

function statusGap(status: EvidenceStatus): StageGapType | null {
  switch (status) {
    case 'INSUFFICIENT_EVIDENCE': return 'MISSING_EVIDENCE'
    case 'UNVERIFIED': return 'UNVERIFIED'
    case 'CONFLICTING': return 'CONFLICTING'
    case 'NOT_SUPPORTED': return 'MISSING_EVIDENCE'
    case 'PARTIALLY_SUPPORTED': return 'WEAK_EVIDENCE'
    default: return null
  }
}

function priorityFor(type: StageGapType, status: EvidenceStatus): 'HIGH' | 'MEDIUM' | 'LOW' {
  if (type === 'CONFLICTING' || type === 'COUNSEL_REVIEW') return 'HIGH'
  if (status === 'UNVERIFIED' || status === 'INSUFFICIENT_EVIDENCE') return 'HIGH'
  if (type === 'MISSING_INDEPENDENT_SUPPORT') return 'HIGH'
  if (status === 'PARTIALLY_SUPPORTED') return 'MEDIUM'
  return 'LOW'
}

function titleFor(type: StageGapType, propositionName: string): string {
  const name = propositionName.replaceAll('_', ' ')
  switch (type) {
    case 'CONFLICTING': return `Resolve conflicting evidence for ${name}`
    case 'UNVERIFIED': return `Verify ${name}`
    case 'MISSING_INDEPENDENT_SUPPORT': return `Add independent support for ${name}`
    case 'WEAK_EVIDENCE': return `Strengthen evidence for ${name}`
    case 'COUNSEL_REVIEW': return `Professional review needed for ${name}`
    default: return `Evidence needed for ${name}`
  }
}

function actionsFor(type: StageGapType, propositionName: string): string[] {
  const name = propositionName.replaceAll('_', ' ')
  switch (type) {
    case 'CONFLICTING': return [`Identify the conflicting records for ${name}.`, 'Resolve the discrepancy using the underlying source record.', 'Document the resolution and preserve provenance.']
    case 'UNVERIFIED': return [`Verify the underlying fact for ${name}.`, 'Provide a primary or independently attributable record where available.']
    case 'MISSING_INDEPENDENT_SUPPORT': return [`Obtain independent corroboration for ${name}.`, 'Record who created the supporting record and how it relates to the claim.']
    case 'WEAK_EVIDENCE': return [`Strengthen the record supporting ${name}.`, 'Add missing context, attribution, or quantitative detail identified by the proposition review.']
    case 'COUNSEL_REVIEW': return ['Route the unresolved issue for professional review before relying on it.']
    default: return [`Collect evidence that directly addresses ${name}.`, 'Preserve the source, date, identity, and relevant excerpt.']
  }
}

function claimsForCriterion(claims: CandidateClaim[], criterionId: string): CandidateClaim[] {
  return claims.filter(claim => claim.criterionCandidates.some(mapping => mapping.criterionId === criterionId && ['POTENTIAL_MATCH', 'PARTIAL_MATCH', 'UNCLEAR'].includes(mapping.fit)))
}

function evidenceFor(result: CriterionResult, propositionId: string, evidence: EvidenceRecord[]): EvidenceRecord[] {
  const ids = result.propositionResults.find(item => item.propositionId === propositionId)?.evidenceIds ?? []
  return evidence.filter(item => ids.includes(item.id))
}

export function generateEB1AGaps(input: Stage5Input): StageGap[] {
  const gaps: StageGap[] = []

  for (const result of input.criterionResults) {
    const requirement = requirementFor(result.criterionId)
    if (!requirement) continue
    const criterionClaims = claimsForCriterion(input.claims, result.criterionId)

    for (const propositionResult of result.propositionResults) {
      if (propositionResult.status === 'NOT_APPLICABLE') continue
      const type = statusGap(propositionResult.status)
      if (!type) continue
      const proposition = propositionFor(propositionResult.propositionId)
      const propositionName = proposition?.name ?? propositionResult.propositionId
      const evidence = evidenceFor(result, propositionResult.propositionId, input.evidence)
      const independent = evidence.some(isIndependentEvidence)
      const missing = propositionResult.missingInformation.length
        ? propositionResult.missingInformation
        : [proposition?.statement ?? 'Additional evidence or clarification is required.']
      const gapId = `GAP-${hash(`${result.criterionId}|${propositionResult.propositionId}|${type}`)}`
      gaps.push({
        id: gapId,
        scope: 'PROPOSITION',
        targetId: propositionResult.propositionId,
        criterionId: result.criterionId,
        propositionId: propositionResult.propositionId,
        type,
        title: titleFor(type, propositionName),
        description: propositionResult.rationale || `The current evidence state is ${propositionResult.status.replaceAll('_', ' ').toLowerCase()}.`,
        currentState: propositionResult.status,
        recommendedActions: actionsFor(type, propositionName),
        priority: priorityFor(type, propositionResult.status),
        severity: priorityFor(type, propositionResult.status),
        affectedClaimIds: criterionClaims.map(claim => claim.id),
        supportingEvidenceIds: propositionResult.evidenceIds,
        missingElements: missing,
        independentlyCorroborated: independent,
        counselReviewRequired: result.counselReview || type === 'CONFLICTING',
        provenance: [...result.provenance, ...propositionResult.provenance],
        source: 'DETERMINISTIC',
      })
    }

    if (result.counselReview) {
      const gapId = `GAP-${hash(`${result.criterionId}|COUNSEL_REVIEW`)}`
      if (!gaps.some(item => item.id === gapId)) gaps.push({
        id: gapId,
        scope: 'CRITERION',
        targetId: result.criterionId,
        criterionId: result.criterionId,
        type: 'COUNSEL_REVIEW',
        title: `Professional review needed for ${requirement.code}`,
        description: 'The requirement contains an unresolved issue flagged for professional review.',
        currentState: result.overallEvidenceStatus,
        recommendedActions: ['Review the affected proposition(s) with qualified counsel or another appropriate professional reviewer.'],
        priority: 'HIGH',
        severity: 'HIGH',
        affectedClaimIds: criterionClaims.map(claim => claim.id),
        supportingEvidenceIds: result.supportingEvidenceIds,
        missingElements: result.gaps.slice(0, 6),
        independentlyCorroborated: result.supportingEvidenceIds.some(id => input.evidence.some(item => item.id === id && isIndependentEvidence(item))),
        counselReviewRequired: true,
        provenance: result.provenance,
        source: 'DETERMINISTIC',
      })
    }
  }

  // Safety flags become claim-level gaps when the criterion review did not already surface the issue.
  for (const claim of input.claims) {
    const ambiguous = claim.claimSafetyFlags.some(flag => ['AMBIGUOUS_ATTRIBUTION', 'AMBIGUOUS_ROLE', 'AMBIGUOUS_AWARD_STATUS'].includes(flag))
    if (!ambiguous) continue
    const criterionId = claim.criterionCandidates.find(item => ['POTENTIAL_MATCH', 'PARTIAL_MATCH', 'UNCLEAR'].includes(item.fit))?.criterionId
    if (!criterionId) continue
    const id = `GAP-${hash(`${claim.id}|AMBIGUOUS_CLAIM`)}`
    if (gaps.some(item => item.id === id)) continue
    gaps.push({
      id,
      scope: 'CLAIM',
      targetId: claim.id,
      criterionId,
      type: 'AMBIGUOUS_CLAIM',
      title: 'Clarify an ambiguous profile claim',
      description: 'Stage 3 flagged the claim as ambiguous. The downstream evidence record should not silently resolve the ambiguity.',
      currentState: 'UNVERIFIED',
      recommendedActions: ['Clarify the factual assertion and its attribution.', 'Provide the underlying source record if available.'],
      priority: 'HIGH',
      severity: 'HIGH',
      affectedClaimIds: [claim.id],
      supportingEvidenceIds: [],
      missingElements: ['Clear attribution and factual context'],
      independentlyCorroborated: false,
      counselReviewRequired: false,
      provenance: claim.provenance,
      source: 'DETERMINISTIC',
    })
  }

  return gaps.sort((a, b) => ({ HIGH: 0, MEDIUM: 1, LOW: 2 }[a.priority] - { HIGH: 0, MEDIUM: 1, LOW: 2 }[b.priority]))
}

export const generatePathwayGaps = generateEB1AGaps

export function mergeAIGeneratedGaps(deterministic: StageGap[], aiGaps: Array<Pick<StageGap, 'scope'|'targetId'|'type'|'description'> & { recommendedActions: string[]; priority?: 'HIGH'|'MEDIUM'|'LOW' }>, executionId: string): StageGap[] {
  const byTarget = new Map(deterministic.map(item => [`${item.scope}|${item.targetId}|${item.type}`, item]))
  for (const item of aiGaps) {
    const key = `${item.scope}|${item.targetId}|${item.type}`
    const existing = byTarget.get(key)
    if (existing) {
      existing.description = item.description || existing.description
      existing.recommendedActions = [...new Set([...item.recommendedActions, ...existing.recommendedActions])].slice(0, 6)
      existing.priority = item.priority ?? existing.priority
      existing.severity = existing.priority
      existing.source = 'AI'
      existing.aiExecutionId = executionId
      continue
    }
    const criterionId = item.scope === 'CRITERION'
      ? item.targetId
      : item.scope === 'PROPOSITION' && (item.targetId.startsWith('EB1A-') || item.targetId.startsWith('EB1B-') || item.targetId.startsWith('EB1C-'))
        ? item.targetId.split('-P')[0]
        : item.scope === 'CLAIM'
          ? deterministic.find(gap => gap.targetId === item.targetId)?.criterionId ?? ''
          : ''
    if (!criterionId) continue
    byTarget.set(key, {
      id: `GAP-AI-${hash(key)}`,
      scope: item.scope,
      targetId: item.targetId,
      criterionId,
      type: item.type,
      title: item.description.slice(0, 90),
      description: item.description,
      currentState: 'INSUFFICIENT_EVIDENCE',
      recommendedActions: item.recommendedActions,
      priority: item.priority ?? 'MEDIUM',
      severity: item.priority ?? 'MEDIUM',
      affectedClaimIds: [],
      supportingEvidenceIds: [],
      missingElements: [],
      independentlyCorroborated: false,
      counselReviewRequired: item.type === 'COUNSEL_REVIEW',
      provenance: [],
      source: 'AI',
      aiExecutionId: executionId,
    })
  }
  return [...byTarget.values()].sort((a, b) => ({ HIGH: 0, MEDIUM: 1, LOW: 2 }[a.priority] - { HIGH: 0, MEDIUM: 1, LOW: 2 }[b.priority]))
}
