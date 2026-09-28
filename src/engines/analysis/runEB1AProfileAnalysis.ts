import { EB1A_CRITERIA } from '../../data/visa/eb1a/criteria'
import { EB1A_PROPOSITIONS } from '../../data/visa/eb1a/propositions'
import { assessClaimAgainstCriterion } from '../rules/eb1a/claimCriterionEngine'
import type {
  CandidateClaim,
  ClaimFit,
  CriterionResult,
  MapClaimsToCriteriaInput,
  PropositionClaimStatus,
} from '../../types/visa/eb1a'
import type { EB1AAnalysisResult } from '../../types/analysis/eb1aAnalysis'
import type { MapClaimsToCriteriaContractOutput } from '../../ai/eb1a/contract'

export type InvokeMapping = (
  input: MapClaimsToCriteriaInput,
) => Promise<{
  output: MapClaimsToCriteriaContractOutput
  execution: EB1AAnalysisResult['execution']
}>

const fitRank: Record<ClaimFit, number> = {
  NOT_RELEVANT: 0,
  UNCLEAR: 1,
  POTENTIAL_MATCH: 2,
  PARTIAL_MATCH: 3,
  NOT_A_MATCH: 0,
}

function strongestFit(values: ClaimFit[]): ClaimFit {
  if (values.length === 0) return 'NOT_RELEVANT'
  return values.reduce((best, current) => fitRank[current] > fitRank[best] ? current : best, 'NOT_RELEVANT')
}

function statusRank(status: CriterionResult['overallEvidenceStatus']): number {
  switch (status) {
    case 'CONFLICTING': return 6
    case 'NOT_SUPPORTED': return 5
    case 'PARTIALLY_SUPPORTED': return 4
    case 'INSUFFICIENT_EVIDENCE': return 3
    case 'UNVERIFIED': return 2
    case 'SUPPORTED': return 1
    case 'NOT_APPLICABLE': return 0
    default: return 0
  }
}

function aggregateStatus(statuses: CriterionResult['overallEvidenceStatus'][]): CriterionResult['overallEvidenceStatus'] {
  if (statuses.length === 0) return 'NOT_APPLICABLE'
  return statuses.reduce((best, current) => statusRank(current) > statusRank(best) ? current : best, 'NOT_APPLICABLE')
}

function applyMappings(claims: CandidateClaim[], mappings: MapClaimsToCriteriaContractOutput['mappings']): CandidateClaim[] {
  const byId = new Map(claims.map(claim => [claim.id, {
    ...claim,
    criterionCandidates: [...claim.criterionCandidates],
    extractedFacts: {
      ...claim.extractedFacts,
      propositionSignals: {},
    },
  }]))

  for (const mapping of mappings) {
    const claim = byId.get(mapping.claimId)
    if (!claim) continue

    claim.criterionCandidates.push({
      criterionId: mapping.criterionId,
      fit: mapping.fit,
      rationale: mapping.rationale,
      confidence: mapping.confidence,
      unresolvedQuestions: mapping.unresolvedQuestions,
    })

    const signals = (claim.extractedFacts.propositionSignals as Record<string, PropositionClaimStatus>) ?? {}
    for (const assessment of mapping.propositionAssessments) {
      const previous = signals[assessment.propositionId]
      const rank: Record<PropositionClaimStatus, number> = {
        NOT_ESTABLISHED: 0,
        UNCLEAR: 1,
        PARTIALLY_ESTABLISHED: 2,
        SUPPORTED_BY_CLAIM: 3,
      }
      if (!previous || rank[assessment.status] > rank[previous]) {
        signals[assessment.propositionId] = assessment.status
      }
    }

    claim.extractedFacts.propositionSignals = signals

    if (fitRank[mapping.fit] > fitRank[claim.claimFitStatus]) {
      claim.claimFitStatus = mapping.fit
    }
  }

  return [...byId.values()]
}

function aggregateCriterionResult(
  criterionId: string,
  perClaimResults: CriterionResult[],
  mappingCount: number,
  evidenceNeeded: string[],
): CriterionResult {
  const first = perClaimResults[0]
  const criterion = EB1A_CRITERIA.find(item => item.id === criterionId)
  if (!criterion) throw new Error(`Unknown EB-1A criterion: ${criterionId}`)
  const propositionIds = EB1A_PROPOSITIONS[criterion.code].map(p => p.id)

  const propositionResults = propositionIds.map(propositionId => {
    const results = perClaimResults
      .flatMap(result => result.propositionResults.filter(item => item.propositionId === propositionId))
      .filter(result => result.status !== 'NOT_APPLICABLE')

    if (results.length === 0) {
      return {
        propositionId,
        status: 'NOT_APPLICABLE' as const,
        evidenceIds: [],
        rationale: 'No mapped profile claim addressed this proposition.',
        missingInformation: [],
        provenance: first?.provenance ?? [],
      }
    }

    const statuses = results.map(result => result.status)
    const status: CriterionResult['propositionResults'][number]['status'] = statuses.includes('CONFLICTING')
      ? 'CONFLICTING'
      : statuses.includes('NOT_SUPPORTED')
        ? 'NOT_SUPPORTED'
        : statuses.includes('PARTIALLY_SUPPORTED')
          ? 'PARTIALLY_SUPPORTED'
          : statuses.includes('UNVERIFIED')
            ? 'UNVERIFIED'
            : 'INSUFFICIENT_EVIDENCE'

    return {
      propositionId,
      status,
      evidenceIds: [],
      rationale: results.map(result => result.rationale).join(' '),
      missingInformation: [...new Set(results.flatMap(result => result.missingInformation))],
      provenance: [...new Map(results.flatMap(result => result.provenance).map(item => [JSON.stringify(item), item])).values()],
    }
  })

  const claimFits = perClaimResults.map(result => result.claimFit)
  const mappedEvidenceStatus = aggregateStatus(perClaimResults.map(result => result.overallEvidenceStatus))

  return {
    criterionId,
    claimFit: strongestFit(claimFits),
    propositionResults,
    supportingEvidenceIds: [],
    overallEvidenceStatus: mappingCount === 0 ? 'NOT_APPLICABLE' : mappedEvidenceStatus,
    counselReview: perClaimResults.some(result => result.counselReview),
    gaps: [...new Set(evidenceNeeded)],
    ruleVersion: first?.ruleVersion ?? 'EB1A-2026-09',
    provenance: [...new Map(perClaimResults.flatMap(result => result.provenance).map(item => [JSON.stringify(item), item])).values()],
  }
}

export function prepareMappingInput(
  claims: CandidateClaim[],
  profile: { fieldOfEndeavor?: string; occupation?: string; role?: string },
): MapClaimsToCriteriaInput {
  return {
    claims,
    criteria: EB1A_CRITERIA.map(criterion => ({
      id: criterion.id,
      code: criterion.code,
      title: criterion.title,
      regulatoryRequirement: criterion.regulatoryRequirement,
      propositionDefinitions: EB1A_PROPOSITIONS[criterion.code].map(proposition => ({
        id: proposition.id,
        statement: proposition.statement,
      })),
    })),
    candidateContext: profile,
  }
}

export async function runEB1AProfileAnalysis(
  claims: CandidateClaim[],
  profile: { fieldOfEndeavor?: string; occupation?: string; role?: string },
  invokeMapping: InvokeMapping,
): Promise<EB1AAnalysisResult> {
  const mappingInput = prepareMappingInput(claims, profile)
  const mapped = await invokeMapping(mappingInput)
  const mappedClaims = applyMappings(claims, mapped.output.mappings)
  const assessedAt = new Date().toISOString()

  const criterionResults = EB1A_CRITERIA.map(criterion => {
    const criterionMappings = mapped.output.mappings.filter(mapping => mapping.criterionId === criterion.id)
    const relevantClaims = mappedClaims.filter(claim => claim.criterionCandidates.some(candidate => candidate.criterionId === criterion.id))
    const perClaimResults = relevantClaims.map(claim => assessClaimAgainstCriterion({
      claim,
      criterion,
      propositions: EB1A_PROPOSITIONS[criterion.code],
      assessedAt,
    }))
    const evidenceNeeded = criterionMappings.flatMap(mapping => mapping.evidenceNeeded)
    return aggregateCriterionResult(criterion.id, perClaimResults, criterionMappings.length, evidenceNeeded)
  })

  return {
    status: 'SUCCESS',
    claims: mappedClaims,
    mappings: mapped.output.mappings,
    criterionResults,
    execution: mapped.execution,
    generatedAt: assessedAt,
  }
}
