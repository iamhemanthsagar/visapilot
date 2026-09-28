import type { StageGap, EvidenceActionType, EvidenceBuildItem, RoadmapItem, BenchmarkSummary, Stage5Input } from '../../types/stages'
import type { VisaPathwayId } from '../../types/visa/pathway'
import { EB1A_CRITERIA } from '../../data/visa/eb1a/criteria'
import { EB1A_PROPOSITIONS } from '../../data/visa/eb1a/propositions'
import { EB1B_REQUIREMENTS, EB1B_PROPOSITIONS } from '../../data/visa/eb1b/rules'
import { EB1C_GATES, EB1C_PROPOSITIONS } from '../../data/visa/eb1c/rules'
import { PATHWAY_META } from '../../data/visa/pathways'

function hash(value: string): string {
  let h = 2166136261
  for (let i = 0; i < value.length; i += 1) h = Math.imul(h ^ value.charCodeAt(i), 16777619) >>> 0
  return h.toString(16).padStart(8, '0')
}

function propositionName(id?: string) {
  if (!id) return 'the affected requirement'
  const allProps = [
    ...Object.values(EB1A_PROPOSITIONS).flat(),
    ...Object.values(EB1B_PROPOSITIONS).flat(),
    ...Object.values(EB1C_PROPOSITIONS).flat(),
  ]
  return allProps.find(item => item.id === id)?.name.replaceAll('_', ' ') ?? id
}

function requirementFor(id: string) {
  return (
    EB1A_CRITERIA.find(item => item.id === id) ??
    EB1B_REQUIREMENTS.find(item => item.id === id) ??
    EB1C_GATES.find(item => item.id === id)
  )
}

function actionFor(gap: StageGap): EvidenceActionType {
  const name = propositionName(gap.propositionId)
  switch (gap.type) {
    case 'CONFLICTING': return 'RESOLVE_CONFLICT'
    case 'UNVERIFIED': return 'VERIFY_RECORD'
    case 'AMBIGUOUS_CLAIM': return 'CLARIFY_CLAIM'
    case 'COUNSEL_REVIEW': return 'COUNSEL_REVIEW'
    case 'MISSING_INDEPENDENT_SUPPORT': return 'REQUEST_LETTER'
    case 'WEAK_EVIDENCE':
      if (/publication|article|authorship|metadata/.test(name)) return 'DOCUMENT_PUBLICATION'
      if (/recognition|award|membership/.test(name)) return 'DOCUMENT_RECOGNITION'
      if (/role|responsibilities|organization|corporate|managerial|executive/.test(name)) return 'DOCUMENT_ROLE'
      if (/adoption|use|impact|accomplishment/.test(name)) return 'DOCUMENT_ADOPTION'
      return 'QUANTIFY_IMPACT'
    default: return gap.propositionId?.includes('P') ? 'COLLECT_DOCUMENT' : 'VERIFY_RECORD'
  }
}

function effortFor(action: EvidenceActionType): EvidenceBuildItem['effort'] {
  if (action === 'COUNSEL_REVIEW' || action === 'RESOLVE_CONFLICT') return 'HIGH'
  if (action === 'REQUEST_LETTER' || action === 'DOCUMENT_ROLE') return 'MEDIUM'
  return 'LOW'
}

function potentialEvidence(gap: StageGap): string[] {
  const name = propositionName(gap.propositionId)
  if (gap.type === 'CONFLICTING') return ['Underlying source records', 'Corrected or reconciled versions of the conflicting records', 'Written explanation of the discrepancy where appropriate']
  if (gap.type === 'UNVERIFIED') return ['Primary record supporting the asserted fact', 'Independent record with identifiable issuer or source', 'Source metadata sufficient for verification']
  if (gap.type === 'AMBIGUOUS_CLAIM') return ['Clarified statement of the fact', 'Source document establishing attribution and context']
  if (gap.type === 'MISSING_INDEPENDENT_SUPPORT') return ['Independent letter or record', 'Third-party publication, institutional record, or other independent source where applicable']
  return [`Document directly addressing ${name}`, 'Supporting source metadata', 'Relevant quantitative or contextual documentation identified in the gap']
}

function suggestedSources(gap: StageGap): string[] {
  if (gap.type === 'COUNSEL_REVIEW') return ['Qualified immigration counsel or other appropriate professional reviewer']
  if (gap.type === 'CONFLICTING') return ['Original issuer or record custodian', 'Primary source record']
  if (gap.type === 'MISSING_INDEPENDENT_SUPPORT') return ['Independent professional, institution, publication, or record custodian']
  return ['Primary source record', 'Issuing organization or institution', 'Independent third-party source where available']
}

export function buildEvidencePlan(gaps: StageGap[]): EvidenceBuildItem[] {
  return gaps.map(gap => {
    const actionType = actionFor(gap)
    const name = propositionName(gap.propositionId)
    const requirement = requirementFor(gap.criterionId)
    return {
      id: `ACT-${hash(gap.id)}`,
      gapId: gap.id,
      criterionId: gap.criterionId,
      propositionId: gap.propositionId,
      title: gap.title,
      objective: `Address the unresolved evidence issue for ${name}.`,
      actionType,
      description: gap.recommendedActions[0] ?? `Address the gap for ${requirement?.code ?? gap.criterionId}.`,
      potentialEvidence: potentialEvidence(gap),
      suggestedSources: suggestedSources(gap),
      requiredInputs: gap.missingElements.length ? gap.missingElements : ['The relevant source record and enough context to verify it'],
      dependencies: gap.type === 'CONFLICTING' ? ['Identify the authoritative underlying record first'] : gap.type === 'COUNSEL_REVIEW' ? ['Complete supporting factual record before review'] : [],
      priority: gap.priority,
      effort: effortFor(actionType),
      status: 'NOT_STARTED',
      counselReviewRequired: gap.counselReviewRequired,
      sourceGapType: gap.type,
    }
  })
}

function weightedStatuses(input: Stage5Input) {
  const all = input.criterionResults.flatMap(item => item.propositionResults).filter(item => item.status !== 'NOT_APPLICABLE')
  const supported = all.filter(item => item.status === 'SUPPORTED').length
  const partial = all.filter(item => item.status === 'PARTIALLY_SUPPORTED').length
  const unresolved = all.filter(item => !['SUPPORTED', 'PARTIALLY_SUPPORTED'].includes(item.status)).length
  return { all, supported, partial, unresolved }
}

export function buildBenchmark(input: Stage5Input, gaps: StageGap[], pathwayId: VisaPathwayId = 'EB1A'): BenchmarkSummary {
  const { all, supported, partial, unresolved } = weightedStatuses(input)
  const totalRequirementsCount = PATHWAY_META[pathwayId]?.totalCount ?? 10
  const criteriaWithMaterial = input.criterionResults.filter(item => item.overallEvidenceStatus !== 'NOT_APPLICABLE').length
  const verifiedEvidenceItems = input.evidence.filter(item => ['VERIFIED', 'PARTIALLY_VERIFIED'].includes(item.verificationStatus)).length
  const independentEvidenceItems = input.evidence.filter(item => item.reliabilityContext === 'INDEPENDENT' || item.sourceType === 'THIRD_PARTY' || item.sourceType === 'PUBLIC_SOURCE').length
  const evidenceCount = input.evidence.length

  return {
    dimensions: [
      {
        id: 'CRITERION_COVERAGE',
        label: 'Requirement coverage',
        value: Math.round((criteriaWithMaterial / totalRequirementsCount) * 100),
        denominator: totalRequirementsCount,
        numerator: criteriaWithMaterial,
        explanation: `${criteriaWithMaterial} of ${totalRequirementsCount} requirements currently have relevant profile or evidence material.`,
      },
      {
        id: 'EVIDENCE_SUPPORT',
        label: 'Proposition support',
        value: all.length ? Math.round(((supported + partial * 0.5) / all.length) * 100) : 0,
        denominator: all.length,
        numerator: supported + partial * 0.5,
        explanation: 'Supported propositions count fully; partially supported propositions count as half. Unresolved propositions count as zero.',
      },
      {
        id: 'VERIFICATION',
        label: 'Verification',
        value: evidenceCount ? Math.round((verifiedEvidenceItems / evidenceCount) * 100) : 0,
        denominator: evidenceCount,
        numerator: verifiedEvidenceItems,
        explanation: `${verifiedEvidenceItems} of ${evidenceCount} evidence items have verified or partially verified status.`,
      },
      {
        id: 'INDEPENDENT_CORROBORATION',
        label: 'Independent corroboration',
        value: evidenceCount ? Math.round((independentEvidenceItems / evidenceCount) * 100) : 0,
        denominator: evidenceCount,
        numerator: independentEvidenceItems,
        explanation: `${independentEvidenceItems} of ${evidenceCount} evidence items are classified as independent/third-party/public-source support.`,
      },
    ],
    applicablePropositions: all.length,
    supportedPropositions: supported,
    partiallySupportedPropositions: partial,
    unresolvedPropositions: unresolved,
    verifiedEvidenceItems,
    independentEvidenceItems,
    openGapCount: gaps.length,
    highPriorityGapCount: gaps.filter(item => item.priority === 'HIGH').length,
    conflictCount: gaps.filter(item => item.type === 'CONFLICTING').length,
  }
}

export function buildRoadmap(actions: EvidenceBuildItem[], gaps: StageGap[]): RoadmapItem[] {
  const gapMap = new Map(gaps.map(item => [item.id, item]))
  return [...actions].sort((a, b) => ({ HIGH: 0, MEDIUM: 1, LOW: 2 }[a.priority] - { HIGH: 0, MEDIUM: 1, LOW: 2 }[b.priority])).map(action => {
    const gap = gapMap.get(action.gapId)
    const phase: RoadmapItem['phase'] = action.priority === 'HIGH' ? 'NOW' : action.priority === 'MEDIUM' ? 'NEXT' : 'LATER'
    return {
      id: `ROAD-${hash(action.id)}`,
      phase,
      title: action.title,
      rationale: gap?.description ?? action.description,
      actionId: action.id,
      gapId: action.gapId,
      criterionId: action.criterionId,
      propositionId: action.propositionId,
      priority: action.priority,
      effort: action.effort,
      dependencies: action.dependencies,
      status: action.status,
    }
  })
}
