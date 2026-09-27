import assert from 'node:assert/strict'
import test from 'node:test'
import type { CandidateClaim, ClaimType, CriterionDefinition, PropositionDefinition } from '../../src/types/visa/eb1a.ts'
import { assessClaimAgainstCriterion } from '../../src/engines/rules/eb1a/claimCriterionEngine.ts'

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

test('an award claim is not relevant to C5', () => {
  const result = assessClaimAgainstCriterion({ claim: claim('I received an award.', 'AWARD'), criterion: c5, propositions: c5Propositions })
  assert.equal(result.claimFit, 'NOT_RELEVANT')
  assert.equal(result.overallEvidenceStatus, 'NOT_APPLICABLE')
})

test('a contribution claim is a potential C5 match without becoming verified evidence', () => {
  const result = assessClaimAgainstCriterion({ claim: claim('I designed a configuration-drift detection platform.', 'CONTRIBUTION'), criterion: c5, propositions: c5Propositions })
  assert.equal(result.claimFit, 'POTENTIAL_MATCH')
  assert.equal(result.propositionResults.find(({ propositionId }) => propositionId === 'EB1A-C5-P1')?.status, 'UNVERIFIED')
})

test('C5 major significance remains unresolved when only the contribution is claimed', () => {
  const result = assessClaimAgainstCriterion({ claim: claim('I designed a platform.', 'CONTRIBUTION'), criterion: c5, propositions: c5Propositions })
  assert.equal(result.propositionResults.find(({ propositionId }) => propositionId === 'EB1A-C5-P6')?.status, 'INSUFFICIENT_EVIDENCE')
  assert.notEqual(result.overallEvidenceStatus, 'SUPPORTED')
})

test('C8 preserves missing distinguished-reputation information', () => {
  const result = assessClaimAgainstCriterion({ claim: claim('I led the platform migration.', 'LEADERSHIP', { roleSubstance: true }), criterion: c8, propositions: c8Propositions })
  assert.equal(result.claimFit, 'POTENTIAL_MATCH')
  assert.equal(result.propositionResults.find(({ propositionId }) => propositionId === 'EB1A-C8-P4')?.status, 'INSUFFICIENT_EVIDENCE')
})

test('an unclassified claim remains unclear', () => {
  const result = assessClaimAgainstCriterion({ claim: claim('I have a varied professional history.'), criterion: c5, propositions: c5Propositions })
  assert.equal(result.claimFit, 'UNCLEAR')
})

test('the result has no numerical legal score and retains rule and source provenance', () => {
  const result = assessClaimAgainstCriterion({ claim: claim('I designed a platform.', 'CONTRIBUTION'), criterion: c5, propositions: c5Propositions, assessedAt: '2026-09-27T00:00:00Z' })
  assert.equal('score' in result, false)
  assert.equal(result.ruleVersion, c5.version)
  assert.equal(result.provenance.some(({ sourceType, ruleVersion }) => sourceType === 'SYSTEM_RULE' && ruleVersion === c5.version), true)
  assert.equal(result.provenance.some(({ sourceType }) => sourceType === 'CANDIDATE_INPUT'), true)
})
