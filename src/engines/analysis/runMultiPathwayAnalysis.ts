import type { CandidateClaim, CriterionResult, EvidenceStatus } from '../../types/visa/eb1a'
import type { EB1AAnalysisResult } from '../../types/analysis/eb1aAnalysis'
import type { VisaPathwayId } from '../../types/visa/pathway'
import {
  getPropositionsForRequirement,
  getRequirementsForPathway,
  PATHWAY_META,
} from '../../data/visa/pathways'
import { runEB1AProfileAnalysis, type InvokeMapping } from './runEB1AProfileAnalysis'

function computeOverallStatus(propositions: CriterionResult['propositionResults']): EvidenceStatus {
  if (!propositions.length) return 'NOT_APPLICABLE'
  if (propositions.some(p => p.status === 'CONFLICTING')) return 'CONFLICTING'
  if (propositions.every(p => p.status === 'SUPPORTED')) return 'SUPPORTED'
  if (propositions.some(p => p.status === 'SUPPORTED' || p.status === 'PARTIALLY_SUPPORTED')) return 'PARTIALLY_SUPPORTED'
  if (propositions.some(p => p.status === 'UNVERIFIED')) return 'UNVERIFIED'
  return 'INSUFFICIENT_EVIDENCE'
}

/**
 * Runs deep profile analysis against the specified pathway's regulatory criteria.
 */
export async function runPathwayProfileAnalysis(
  pathwayId: VisaPathwayId,
  claims: CandidateClaim[],
  profile: { fieldOfEndeavor?: string; occupation?: string; role?: string },
  invokeMapping?: InvokeMapping,
): Promise<EB1AAnalysisResult> {
  const assessedAt = new Date().toISOString()
  const meta = PATHWAY_META[pathwayId]

  // For EB-1A with AI mapping available, use the established engine
  if (pathwayId === 'EB1A' && invokeMapping) {
    return runEB1AProfileAnalysis(claims, profile, invokeMapping)
  }

  // Deterministic / Schema-driven analysis for EB-1B, EB-1C, or fallback EB-1A
  const requirements = getRequirementsForPathway(pathwayId)
  const mappedClaims: CandidateClaim[] = claims.map(c => ({
    ...c,
    criterionCandidates: [...c.criterionCandidates],
  }))

  const criterionResults: CriterionResult[] = requirements.map(req => {
    const propDefs = getPropositionsForRequirement(pathwayId, req.code)
    const requirementId = req.id

    // Find claims matching this requirement
    const matchingClaims = mappedClaims.filter(claim => {
      return claim.criterionCandidates.some(cand => cand.criterionId === requirementId)
    })

    const propositionResults: CriterionResult['propositionResults'] = propDefs.map(p => {
      const hasMatch = matchingClaims.length > 0
      const status: EvidenceStatus = hasMatch ? 'UNVERIFIED' : 'INSUFFICIENT_EVIDENCE'
      return {
        propositionId: p.id,
        status,
        evidenceIds: [],
        rationale: hasMatch
          ? `Profile claim asserts relevance to ${p.name.replaceAll('_', ' ')}. Documentary evidence needed to verify.`
          : `No profile claim directly addresses this proposition (${p.name.replaceAll('_', ' ')}).`,
        missingInformation: hasMatch ? [] : [p.statement],
        provenance: matchingClaims.flatMap(c => c.provenance),
      }
    })

    const overallStatus: EvidenceStatus = matchingClaims.length > 0
      ? computeOverallStatus(propositionResults)
      : 'INSUFFICIENT_EVIDENCE'

    return {
      criterionId: requirementId,
      claimFit: matchingClaims.length > 0 ? 'POTENTIAL_MATCH' : 'NOT_A_MATCH',
      propositionResults,
      supportingEvidenceIds: [],
      overallEvidenceStatus: overallStatus,
      counselReview: overallStatus === 'CONFLICTING',
      gaps: matchingClaims.length > 0
        ? [`Documentary verification needed for ${req.title}`]
        : [`Profile information and evidence missing for ${req.title}`],
      ruleVersion: meta.ruleVersion,
      provenance: matchingClaims.flatMap(c => c.provenance),
    }
  })

  return {
    status: 'SUCCESS',
    claims: mappedClaims,
    mappings: mappedClaims.flatMap(c => c.criterionCandidates.map(cand => ({
      claimId: c.id,
      criterionId: cand.criterionId,
      fit: cand.fit,
      rationale: cand.rationale,
      confidence: cand.confidence,
      propositionAssessments: [],
      evidenceNeeded: [],
      unresolvedQuestions: cand.unresolvedQuestions,
      ambiguities: [],
      unsupportedAssertions: [],
    }))),
    criterionResults,
    execution: {
      id: `EXEC-PROFILE-${pathwayId.toLowerCase()}-${Date.now().toString(36)}`,
      operation: 'MAP_CLAIMS_TO_CRITERIA',
      modelProvider: 'Deterministic Engine',
      modelName: `${pathwayId} Rule Evaluator`,
      promptVersion: meta.ruleVersion,
      ruleVersion: meta.ruleVersion,
      inputReferences: [pathwayId],
      outputValidated: true,
      createdAt: assessedAt,
    },
    generatedAt: assessedAt,
  }
}
