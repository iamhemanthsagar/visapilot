import type { CriterionResult, EvidenceStatus } from '../../../types/visa/eb1a'
import type { EB1AAnalysisResult } from '../../../types/analysis/eb1aAnalysis'
import { EB1B_REQUIREMENTS, EB1B_RULE_VERSION } from '../../../data/visa/eb1b/rules'
import { EB1B_PROPOSITIONS, type EB1BRequirementCode } from '../../../data/visa/eb1b/propositions'

export type EB1BRequirementReview = {
  id: string
  code: string
  title: string
  type: string
  regulatoryRequirement: string
  overallEvidenceStatus: EvidenceStatus
  supportedPropositions: number
  applicablePropositions: number
  unresolvedPropositions: number
  counselReview: boolean
  gaps: string[]
  result: CriterionResult
}

export type EB1BCriteriaReview = {
  ruleVersion: string
  requirements: EB1BRequirementReview[]
  evidentiarySatisfiedCount: number // How many of B1-B6 are SUPPORTED
  evidentiaryThresholdMet: boolean // >= 2 of 6
  mandatoryBlockersCount: number
  mandatorySatisfiedCount: number
  allPrerequisitesMet: boolean
  totalRequirementsCount: number
  supportedRequirementsCount: number
}

function computeStatus(propositions: CriterionResult['propositionResults']): EvidenceStatus {
  if (!propositions.length) return 'NOT_APPLICABLE'
  if (propositions.some(p => p.status === 'CONFLICTING')) return 'CONFLICTING'
  if (propositions.every(p => p.status === 'SUPPORTED')) return 'SUPPORTED'
  if (propositions.some(p => p.status === 'SUPPORTED' || p.status === 'PARTIALLY_SUPPORTED')) return 'PARTIALLY_SUPPORTED'
  if (propositions.some(p => p.status === 'UNVERIFIED')) return 'UNVERIFIED'
  return 'INSUFFICIENT_EVIDENCE'
}

export function evaluateEB1BCriteria(analysis: EB1AAnalysisResult): EB1BCriteriaReview {
  const requirementReviews: EB1BRequirementReview[] = []

  for (const req of EB1B_REQUIREMENTS) {
    const existingResult = analysis.criterionResults.find(r => r.criterionId === req.id || r.criterionId === `EB1B-${req.code}`)
    const code = req.code as EB1BRequirementCode
    const propDefs = EB1B_PROPOSITIONS[code] ?? []

    const propResults = existingResult?.propositionResults.length
      ? existingResult.propositionResults
      : propDefs.map(p => ({
          propositionId: p.id,
          status: 'UNVERIFIED' as EvidenceStatus,
          evidenceIds: [] as string[],
          rationale: 'Awaiting evidence reconciliation.',
          missingInformation: [p.statement],
          provenance: [],
        }))

    const overallStatus: EvidenceStatus = existingResult?.overallEvidenceStatus && existingResult.overallEvidenceStatus !== 'NOT_APPLICABLE'
      ? existingResult.overallEvidenceStatus
      : computeStatus(propResults)

    const supportedProps = propResults.filter(p => p.status === 'SUPPORTED').length
    const unresolvedProps = propResults.filter(p => !['SUPPORTED', 'NOT_APPLICABLE'].includes(p.status)).length

    const resultObj: CriterionResult = {
      criterionId: req.id,
      claimFit: existingResult?.claimFit ?? 'POTENTIAL_MATCH',
      propositionResults: propResults,
      supportingEvidenceIds: existingResult?.supportingEvidenceIds ?? [],
      overallEvidenceStatus: overallStatus,
      counselReview: existingResult?.counselReview ?? (overallStatus === 'CONFLICTING'),
      gaps: existingResult?.gaps ?? propResults.flatMap(p => p.missingInformation),
      ruleVersion: EB1B_RULE_VERSION,
      provenance: existingResult?.provenance ?? [],
    }

    requirementReviews.push({
      id: req.id,
      code: req.code,
      title: req.title,
      type: req.type,
      regulatoryRequirement: req.regulatoryRequirement,
      overallEvidenceStatus: overallStatus,
      supportedPropositions: supportedProps,
      applicablePropositions: propResults.length,
      unresolvedPropositions: unresolvedProps,
      counselReview: resultObj.counselReview,
      gaps: resultObj.gaps,
      result: resultObj,
    })
  }

  const evidentiaryCriteria = requirementReviews.filter(r => ['B1', 'B2', 'B3', 'B4', 'B5', 'B6'].includes(r.code))
  const evidentiarySatisfied = evidentiaryCriteria.filter(r => r.overallEvidenceStatus === 'SUPPORTED').length
  const evidentiaryThresholdMet = evidentiarySatisfied >= 2

  const mandatoryPrereqs = requirementReviews.filter(r => ['B7', 'B8', 'B9'].includes(r.code))
  const mandatorySatisfied = mandatoryPrereqs.filter(r => r.overallEvidenceStatus === 'SUPPORTED').length
  const mandatoryBlockers = mandatoryPrereqs.filter(r => r.overallEvidenceStatus !== 'SUPPORTED').length

  return {
    ruleVersion: EB1B_RULE_VERSION,
    requirements: requirementReviews,
    evidentiarySatisfiedCount: evidentiarySatisfied,
    evidentiaryThresholdMet,
    mandatoryBlockersCount: mandatoryBlockers,
    mandatorySatisfiedCount: mandatorySatisfied,
    allPrerequisitesMet: mandatoryBlockers === 0,
    totalRequirementsCount: requirementReviews.length,
    supportedRequirementsCount: requirementReviews.filter(r => r.overallEvidenceStatus === 'SUPPORTED').length,
  }
}
