import type { CriterionResult, EvidenceStatus } from '../../../types/visa/eb1a'
import type { EB1AAnalysisResult } from '../../../types/analysis/eb1aAnalysis'
import { EB1C_GATES, EB1C_RULE_VERSION } from '../../../data/visa/eb1c/rules'
import { EB1C_PROPOSITIONS, type EB1CGateCode } from '../../../data/visa/eb1c/propositions'

export type EB1CGateReview = {
  id: string
  code: string
  title: string
  type: string
  regulatoryRequirement: string
  overallEvidenceStatus: EvidenceStatus
  supportedPropositions: number
  applicablePropositions: number
  unresolvedPropositions: number
  isBlocker: boolean
  counselReview: boolean
  gaps: string[]
  result: CriterionResult
}

export type EB1CCriteriaReview = {
  ruleVersion: string
  gates: EB1CGateReview[]
  mandatoryGatesCount: 6
  supportedGatesCount: number
  openBlockersCount: number
  allMandatoryGatesSatisfied: boolean
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

export function evaluateEB1CCriteria(analysis: EB1AAnalysisResult): EB1CCriteriaReview {
  const gateReviews: EB1CGateReview[] = []

  for (const gate of EB1C_GATES) {
    const existingResult = analysis.criterionResults.find(r => r.criterionId === gate.id || r.criterionId === `EB1C-${gate.code}`)
    const code = gate.code as EB1CGateCode
    const propDefs = EB1C_PROPOSITIONS[code] ?? []

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
    const isBlocker = overallStatus !== 'SUPPORTED'

    const resultObj: CriterionResult = {
      criterionId: gate.id,
      claimFit: existingResult?.claimFit ?? 'POTENTIAL_MATCH',
      propositionResults: propResults,
      supportingEvidenceIds: existingResult?.supportingEvidenceIds ?? [],
      overallEvidenceStatus: overallStatus,
      counselReview: existingResult?.counselReview ?? (overallStatus === 'CONFLICTING'),
      gaps: existingResult?.gaps ?? propResults.flatMap(p => p.missingInformation),
      ruleVersion: EB1C_RULE_VERSION,
      provenance: existingResult?.provenance ?? [],
    }

    gateReviews.push({
      id: gate.id,
      code: gate.code,
      title: gate.title,
      type: gate.type,
      regulatoryRequirement: gate.regulatoryRequirement,
      overallEvidenceStatus: overallStatus,
      supportedPropositions: supportedProps,
      applicablePropositions: propResults.length,
      unresolvedPropositions: unresolvedProps,
      isBlocker,
      counselReview: resultObj.counselReview,
      gaps: resultObj.gaps,
      result: resultObj,
    })
  }

  const supportedCount = gateReviews.filter(g => g.overallEvidenceStatus === 'SUPPORTED').length
  const blockersCount = gateReviews.filter(g => g.isBlocker).length

  return {
    ruleVersion: EB1C_RULE_VERSION,
    gates: gateReviews,
    mandatoryGatesCount: 6,
    supportedGatesCount: supportedCount,
    openBlockersCount: blockersCount,
    allMandatoryGatesSatisfied: blockersCount === 0,
    totalRequirementsCount: gateReviews.length,
    supportedRequirementsCount: supportedCount,
  }
}
