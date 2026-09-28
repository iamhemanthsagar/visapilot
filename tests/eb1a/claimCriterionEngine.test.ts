import { describe, expect, it } from 'vitest'
import type { CandidateClaim, ClaimType, CriterionDefinition, PropositionDefinition } from '../../src/types/visa/eb1a'
import { assessClaimAgainstCriterion } from '../../src/engines/rules/eb1a/claimCriterionEngine'

const c5: CriterionDefinition = { id: 'EB1A-C5', pathway: 'EB1A', code: 'C5', title: 'Original contributions of major significance', regulatoryRequirement: '8 CFR §204.5(h)(3)(v).', requirements: [], propositionIds: ['EB1A-C5-P1', 'EB1A-C5-P6'], sourceIds: ['CFR-204-5-H'], version: 'EB1A-2026-09', status: 'ACTIVE' }
const c8: CriterionDefinition = { id: 'EB1A-C8', pathway: 'EB1A', code: 'C8', title: 'Leading or critical role', regulatoryRequirement: '8 CFR §204.5(h)(3)(viii).', requirements: [], propositionIds: ['EB1A-C8-P1', 'EB1A-C8-P4'], sourceIds: ['CFR-204-5-H'], version: 'EB1A-2026-09', status: 'ACTIVE' }
const c5Propositions: readonly PropositionDefinition[] = [
  { id: 'EB1A-C5-P1', criterionId: c5.id, name: 'contribution_identity', statement: 'A specific contribution is identified.' },
  { id: 'EB1A-C5-P2', criterionId: c5.id, name: 'candidate_attribution', statement: 'The contribution is attributable to the beneficiary.' },
  { id: 'EB1A-C5-P6', criterionId: c5.id, name: 'major_significance', statement: 'The significance is sufficiently major in the field.' },
]
const c8Propositions: readonly PropositionDefinition[] = [
  { id: 'EB1A-C8-P1', criterionId: c8.id, name: 'leading_or_critical_role', statement: 'The candidate performed a leading or critical role.' },
  { id: 'EB1A-C8-P4', criterionId: c8.id, name: 'distinguished_reputation', statement: 'The organization has a distinguished reputation.' },
]

function claim(text: string, normalizedType?: ClaimType, extractedFacts: Record<string, unknown> = {}): CandidateClaim {
  return { id: 'claim-1', candidateId: 'candidate-1', text, normalizedType, extractedFacts, criterionCandidates: [], claimFitStatus: 'UNCLEAR', claimSafetyFlags: [], provenance: [{ sourceType: 'CANDIDATE_INPUT', sourceId: 'profile-1' }], createdAt: '2026-09-27T00:00:00Z' }
}

describe('claimCriterionEngine', () => {
  it('an award claim is not relevant to C5', () => {
    const result = assessClaimAgainstCriterion({ claim: claim('I received an award.', 'AWARD'), criterion: c5, propositions: c5Propositions })
    expect(result.claimFit).toBe('NOT_RELEVANT')
    expect(result.overallEvidenceStatus).toBe('NOT_APPLICABLE')
  })

  it('a contribution claim is a potential C5 match without becoming verified evidence', () => {
    const result = assessClaimAgainstCriterion({ claim: claim('I designed a configuration-drift detection platform.', 'CONTRIBUTION'), criterion: c5, propositions: c5Propositions })
    expect(result.claimFit).toBe('POTENTIAL_MATCH')
    expect(result.propositionResults.find(({ propositionId }) => propositionId === 'EB1A-C5-P1')?.status).toBe('UNVERIFIED')
  })

  it('C5 major significance remains unresolved when only the contribution is claimed', () => {
    const result = assessClaimAgainstCriterion({ claim: claim('I designed a platform.', 'CONTRIBUTION'), criterion: c5, propositions: c5Propositions })
    expect(result.propositionResults.find(({ propositionId }) => propositionId === 'EB1A-C5-P6')?.status).toBe('INSUFFICIENT_EVIDENCE')
    expect(result.overallEvidenceStatus).not.toBe('SUPPORTED')
  })

  it('C8 preserves missing distinguished-reputation information', () => {
    const result = assessClaimAgainstCriterion({ claim: claim('I led the platform migration.', 'LEADERSHIP', { roleSubstance: true }), criterion: c8, propositions: c8Propositions })
    expect(result.claimFit).toBe('POTENTIAL_MATCH')
    expect(result.propositionResults.find(({ propositionId }) => propositionId === 'EB1A-C8-P4')?.status).toBe('INSUFFICIENT_EVIDENCE')
  })

  it('an unclassified claim remains unclear', () => {
    const result = assessClaimAgainstCriterion({ claim: claim('I have a varied professional history.'), criterion: c5, propositions: c5Propositions })
    expect(result.claimFit).toBe('UNCLEAR')
  })

  it('the result has no numerical legal score and retains rule and source provenance', () => {
    const result = assessClaimAgainstCriterion({ claim: claim('I designed a platform.', 'CONTRIBUTION'), criterion: c5, propositions: c5Propositions, assessedAt: '2026-09-27T00:00:00Z' })
    expect('score' in result).toBe(false)
    expect(result.ruleVersion).toBe(c5.version)
    expect(result.provenance.some(({ sourceType, ruleVersion }) => sourceType === 'SYSTEM_RULE' && ruleVersion === c5.version)).toBe(true)
    expect(result.provenance.some(({ sourceType }) => sourceType === 'CANDIDATE_INPUT')).toBe(true)
  })
})
