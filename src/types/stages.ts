import type { AIExecutionRecord, CandidateClaim, CriterionResult, EvidenceStatus, Provenance } from './visa/eb1a'
import type { EvidenceRecord } from '../engines/evidence/eb1aEvidenceEngine'

export type StageGapType =
  | 'MISSING_EVIDENCE'
  | 'WEAK_EVIDENCE'
  | 'UNVERIFIED'
  | 'CONFLICTING'
  | 'AMBIGUOUS_CLAIM'
  | 'MISSING_CONTEXT'
  | 'MISSING_INDEPENDENT_SUPPORT'
  | 'COUNSEL_REVIEW'

export type StageGap = {
  id: string
  scope: 'CLAIM' | 'PROPOSITION' | 'CRITERION'
  targetId: string
  criterionId: string
  propositionId?: string
  type: StageGapType
  title: string
  description: string
  currentState: EvidenceStatus
  recommendedActions: string[]
  priority: 'HIGH' | 'MEDIUM' | 'LOW'
  severity: 'HIGH' | 'MEDIUM' | 'LOW'
  affectedClaimIds: string[]
  supportingEvidenceIds: string[]
  missingElements: string[]
  independentlyCorroborated: boolean
  counselReviewRequired: boolean
  provenance: Provenance[]
  source: 'DETERMINISTIC' | 'AI'
  aiExecutionId?: string
}

export type EvidenceActionType =
  | 'COLLECT_DOCUMENT'
  | 'REQUEST_LETTER'
  | 'VERIFY_RECORD'
  | 'QUANTIFY_IMPACT'
  | 'DOCUMENT_ROLE'
  | 'DOCUMENT_ADOPTION'
  | 'DOCUMENT_RECOGNITION'
  | 'DOCUMENT_PUBLICATION'
  | 'CLARIFY_CLAIM'
  | 'RESOLVE_CONFLICT'
  | 'COUNSEL_REVIEW'

export type EvidenceBuildItem = {
  id: string
  gapId: string
  criterionId: string
  propositionId?: string
  title: string
  objective: string
  actionType: EvidenceActionType
  description: string
  potentialEvidence: string[]
  suggestedSources: string[]
  requiredInputs: string[]
  dependencies: string[]
  priority: 'HIGH' | 'MEDIUM' | 'LOW'
  effort: 'LOW' | 'MEDIUM' | 'HIGH'
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'READY_FOR_REVIEW' | 'COMPLETED'
  counselReviewRequired: boolean
  sourceGapType: StageGapType
}

export type BenchmarkDimension = {
  id: 'CRITERION_COVERAGE' | 'EVIDENCE_SUPPORT' | 'VERIFICATION' | 'INDEPENDENT_CORROBORATION'
  label: string
  value: number
  denominator: number
  numerator: number
  explanation: string
}

export type BenchmarkSummary = {
  dimensions: BenchmarkDimension[]
  applicablePropositions: number
  supportedPropositions: number
  partiallySupportedPropositions: number
  unresolvedPropositions: number
  verifiedEvidenceItems: number
  independentEvidenceItems: number
  openGapCount: number
  highPriorityGapCount: number
  conflictCount: number
}

export type RoadmapItem = {
  id: string
  phase: 'NOW' | 'NEXT' | 'LATER'
  title: string
  rationale: string
  actionId: string
  gapId: string
  criterionId: string
  propositionId?: string
  priority: 'HIGH' | 'MEDIUM' | 'LOW'
  effort: 'LOW' | 'MEDIUM' | 'HIGH'
  dependencies: string[]
  status: EvidenceBuildItem['status']
}

export type GapAnalysisState = {
  status: 'IDLE' | 'RUNNING' | 'SUCCESS' | 'ERROR'
  gaps: StageGap[]
  execution: AIExecutionRecord | null
  source: 'DETERMINISTIC' | 'AI' | null
  error: string | null
}

export function isIndependentEvidence(item: EvidenceRecord): boolean {
  return item.reliabilityContext === 'INDEPENDENT'
    || item.sourceType === 'THIRD_PARTY'
    || item.sourceType === 'PUBLIC_SOURCE'
}

export function propositionStatusWeight(status: EvidenceStatus): number {
  if (status === 'SUPPORTED') return 1
  if (status === 'PARTIALLY_SUPPORTED') return 0.5
  return 0
}

export type Stage5Input = {
  claims: CandidateClaim[]
  criterionResults: CriterionResult[]
  evidence: EvidenceRecord[]
}
