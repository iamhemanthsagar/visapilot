import type { VisaPathwayId } from '../../types/visa/pathway'
import type { EB1AAnalysisResult } from '../../types/analysis/eb1aAnalysis'
import type { EvidenceStatus } from '../../types/visa/eb1a'
import { evaluateEB1ACriteria, type EB1ACriteriaReview } from './eb1a/criterionEvaluationEngine'
import { evaluateEB1BCriteria, type EB1BCriteriaReview } from './eb1b/eb1bEvaluationEngine'
import { evaluateEB1CCriteria, type EB1CCriteriaReview } from './eb1c/eb1cEvaluationEngine'

export type UnifiedRequirementReview = {
  id: string
  code: string
  title: string
  type: string
  regulatoryRequirement: string
  overallEvidenceStatus: EvidenceStatus
  supportedPropositions: number
  applicablePropositions: number
  unresolvedPropositions: number
  isMandatory?: boolean
  isBlocker?: boolean
  counselReview: boolean
  gaps: string[]
}

export type UnifiedPathwayReview = {
  pathwayId: VisaPathwayId
  ruleVersion: string
  requirements: UnifiedRequirementReview[]
  totalRequirementsCount: number
  supportedRequirementsCount: number
  partiallySupportedCount: number
  unresolvedCount: number
  mandatoryBlockersCount: number
  isThresholdMet: boolean
  thresholdSummary: string
}

export function evaluatePathwayRequirements(
  pathwayId: VisaPathwayId,
  analysis: EB1AAnalysisResult,
): UnifiedPathwayReview {
  if (pathwayId === 'EB1B') {
    const review: EB1BCriteriaReview = evaluateEB1BCriteria(analysis)
    const requirements: UnifiedRequirementReview[] = review.requirements.map(r => ({
      id: r.id,
      code: r.code,
      title: r.title,
      type: r.type,
      regulatoryRequirement: r.regulatoryRequirement,
      overallEvidenceStatus: r.overallEvidenceStatus,
      supportedPropositions: r.supportedPropositions,
      applicablePropositions: r.applicablePropositions,
      unresolvedPropositions: r.unresolvedPropositions,
      isMandatory: ['B7', 'B8', 'B9'].includes(r.code),
      isBlocker: ['B7', 'B8', 'B9'].includes(r.code) && r.overallEvidenceStatus !== 'SUPPORTED',
      counselReview: r.counselReview,
      gaps: r.gaps,
    }))
    const partially = requirements.filter(r => r.overallEvidenceStatus === 'PARTIALLY_SUPPORTED').length
    const unresolved = requirements.filter(r => !['SUPPORTED', 'NOT_APPLICABLE'].includes(r.overallEvidenceStatus)).length

    return {
      pathwayId: 'EB1B',
      ruleVersion: review.ruleVersion,
      requirements,
      totalRequirementsCount: review.totalRequirementsCount,
      supportedRequirementsCount: review.supportedRequirementsCount,
      partiallySupportedCount: partially,
      unresolvedCount: unresolved,
      mandatoryBlockersCount: review.mandatoryBlockersCount,
      isThresholdMet: review.evidentiaryThresholdMet && review.allPrerequisitesMet,
      thresholdSummary: `${review.evidentiarySatisfiedCount}/6 evidentiary criteria supported (threshold is 2). ${review.mandatoryBlockersCount === 0 ? 'All prerequisites met.' : `${review.mandatoryBlockersCount} prerequisite(s) unresolved.`}`,
    }
  }

  if (pathwayId === 'EB1C') {
    const review: EB1CCriteriaReview = evaluateEB1CCriteria(analysis)
    const requirements: UnifiedRequirementReview[] = review.gates.map(g => ({
      id: g.id,
      code: g.code,
      title: g.title,
      type: g.type,
      regulatoryRequirement: g.regulatoryRequirement,
      overallEvidenceStatus: g.overallEvidenceStatus,
      supportedPropositions: g.supportedPropositions,
      applicablePropositions: g.applicablePropositions,
      unresolvedPropositions: g.unresolvedPropositions,
      isMandatory: true,
      isBlocker: g.isBlocker,
      counselReview: g.counselReview,
      gaps: g.gaps,
    }))
    const partially = requirements.filter(r => r.overallEvidenceStatus === 'PARTIALLY_SUPPORTED').length
    const unresolved = requirements.filter(r => !['SUPPORTED', 'NOT_APPLICABLE'].includes(r.overallEvidenceStatus)).length

    return {
      pathwayId: 'EB1C',
      ruleVersion: review.ruleVersion,
      requirements,
      totalRequirementsCount: review.totalRequirementsCount,
      supportedRequirementsCount: review.supportedRequirementsCount,
      partiallySupportedCount: partially,
      unresolvedCount: unresolved,
      mandatoryBlockersCount: review.openBlockersCount,
      isThresholdMet: review.allMandatoryGatesSatisfied,
      thresholdSummary: `${review.supportedGatesCount}/6 mandatory gates supported. ${review.openBlockersCount === 0 ? 'All gates clear.' : `${review.openBlockersCount} gate blocker(s) unresolved.`}`,
    }
  }

  // Default: EB-1A
  const review: EB1ACriteriaReview = evaluateEB1ACriteria(analysis)
  const requirements: UnifiedRequirementReview[] = review.criteria.map(c => ({
    id: c.criterionId,
    code: c.code,
    title: c.title,
    type: 'EVIDENTIARY_CRITERION',
    regulatoryRequirement: c.regulatoryRequirement,
    overallEvidenceStatus: c.result.overallEvidenceStatus,
    supportedPropositions: c.supportedPropositions,
    applicablePropositions: c.applicablePropositions,
    unresolvedPropositions: c.unresolvedPropositions,
    isMandatory: false,
    isBlocker: false,
    counselReview: c.result.counselReview,
    gaps: c.result.gaps,
  }))
  const supported = requirements.filter(r => r.overallEvidenceStatus === 'SUPPORTED').length
  const partially = requirements.filter(r => r.overallEvidenceStatus === 'PARTIALLY_SUPPORTED').length
  const unresolved = requirements.filter(r => !['SUPPORTED', 'NOT_APPLICABLE'].includes(r.overallEvidenceStatus)).length

  return {
    pathwayId: 'EB1A',
    ruleVersion: review.ruleVersion,
    requirements,
    totalRequirementsCount: review.criteria.length,
    supportedRequirementsCount: supported,
    partiallySupportedCount: partially,
    unresolvedCount: unresolved,
    mandatoryBlockersCount: 0,
    isThresholdMet: supported >= 3,
    thresholdSummary: `${supported}/10 criteria supported (minimum initial evidence threshold is 3).`,
  }
}
