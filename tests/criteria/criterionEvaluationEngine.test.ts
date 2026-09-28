import { describe, expect, it } from 'vitest'
import { evaluateEB1ACriteria } from '../../src/engines/rules/eb1a/criterionEvaluationEngine'
import type { EB1AAnalysisResult } from '../../src/types/analysis/eb1aAnalysis'

const makeAnalysis = (overrides: Record<string, any> = {}) => ({
  status: 'SUCCESS',
  claims: [],
  mappings: [],
  criterionResults: ['C1','C2','C3','C4','C5','C6','C7','C8','C9','C10'].map(code => ({
    criterionId: `EB1A-${code}`,
    claimFit: code === 'C5' ? 'POTENTIAL_MATCH' : 'NOT_RELEVANT',
    propositionResults: code === 'C5' ? [
      { propositionId: 'EB1A-C5-P1', status: overrides.p1 ?? 'SUPPORTED', evidenceIds: ['EV-1'], rationale: 'Attribution is supported.', missingInformation: [], provenance: [] },
      { propositionId: 'EB1A-C5-P2', status: overrides.p2 ?? 'SUPPORTED', evidenceIds: ['EV-1'], rationale: 'Contribution is attributable.', missingInformation: [], provenance: [] },
      { propositionId: 'EB1A-C5-P6', status: overrides.p6 ?? 'INSUFFICIENT_EVIDENCE', evidenceIds: [], rationale: 'Significance remains unresolved.', missingInformation: ['Independent significance evidence'], provenance: [] },
    ] : [],
    supportingEvidenceIds: code === 'C5' ? ['EV-1'] : [],
    overallEvidenceStatus: code === 'C5' ? 'INSUFFICIENT_EVIDENCE' : 'NOT_APPLICABLE',
    counselReview: false,
    gaps: code === 'C5' ? ['Independent significance evidence'] : [],
    ruleVersion: 'EB1A-2026-09',
    provenance: [],
  })),
  execution: {
    id: 'AI-TEST', operation: 'MAP_CLAIMS_TO_CRITERIA', modelProvider: 'test', modelName: 'test', promptVersion: 'test', ruleVersion: 'EB1A-2026-09', inputReferences: [], outputValidated: true, createdAt: '2026-09-28T00:00:00Z',
  },
  generatedAt: '2026-09-28T00:00:00Z',
}) as unknown as EB1AAnalysisResult

describe('criterionEvaluationEngine', () => {
  it('keeps criterion count separate from an eligibility conclusion', () => {
    const result = evaluateEB1ACriteria(makeAnalysis())
    expect(result.criteria).toHaveLength(10)
    expect(result.supportedForReviewCount).toBe(0)
  })

  it('recomputes criterion state from proposition states', () => {
    const result = evaluateEB1ACriteria(makeAnalysis({ p6: 'SUPPORTED' }))
    const c5 = result.criteria.find(item => item.code === 'C5')!
    expect(c5.result.overallEvidenceStatus).toBe('SUPPORTED')
    expect(c5.supportedPropositions).toBe(3)
  })

  it('preserves conflicting evidence as conflicting', () => {
    const result = evaluateEB1ACriteria(makeAnalysis({ p1: 'CONFLICTING' }))
    const c5 = result.criteria.find(item => item.code === 'C5')!
    expect(c5.result.overallEvidenceStatus).toBe('CONFLICTING')
    expect(result.conflictingCount).toBe(1)
  })
})
