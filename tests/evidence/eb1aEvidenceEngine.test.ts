import { describe, expect, it } from 'vitest'
import { createProfileDerivedEvidence, matchEvidenceToClaims, applyEvidenceReconciliations, type ClaimCriterionReconciliation, type EvidenceRecord } from '../../src/engines/evidence/eb1aEvidenceEngine'
import type { CandidateClaim } from '../../src/types/visa/eb1a'
import type { EB1AAnalysisResult } from '../../src/types/analysis/eb1aAnalysis'

const claim: CandidateClaim = {
  id: 'CLM-1', candidateId: 'CAND-1', sourceDocumentId: 'DOC-1',
  text: 'Developed a configuration drift detection platform used across cloud environments.',
  normalizedText: 'developed configuration drift detection platform', normalizedType: 'CONTRIBUTION',
  extractedFacts: { sectionTitle: 'Technical Contributions', propositionSignals: { 'EB1A-C5-P1': 'SUPPORTED_BY_CLAIM' } },
  criterionCandidates: [{ criterionId: 'EB1A-C5', fit: 'POTENTIAL_MATCH', rationale: 'Contribution claim.', confidence: 'HIGH', unresolvedQuestions: [] }],
  claimFitStatus: 'POTENTIAL_MATCH', claimSafetyFlags: [],
  provenance: [{ sourceType: 'UPLOADED_DOCUMENT', documentId: 'DOC-1' }], createdAt: '2026-09-28T00:00:00Z',
}

const document = { documentId: 'DOC-1', filename: 'CV.pdf', mimeType: 'application/pdf', kind: 'pdf' as const, size: 100, extractedText: claim.text, characterCount: claim.text.length, wordCount: 9, pages: [{ pageNumber: 1, text: claim.text }], pageCount: 1 }

const baseAnalysis = { status: 'SUCCESS', claims: [claim], mappings: [], criterionResults: [{ criterionId: 'EB1A-C5', claimFit: 'POTENTIAL_MATCH', propositionResults: [{ propositionId: 'EB1A-C5-P1', status: 'UNVERIFIED', evidenceIds: [], rationale: 'Profile claim.', missingInformation: [], provenance: [] }], supportingEvidenceIds: [], overallEvidenceStatus: 'UNVERIFIED', counselReview: false, gaps: [], ruleVersion: 'EB1A-2026-09', provenance: [] }], execution: { id: 'AI-1', operation: 'MAP_CLAIMS_TO_CRITERIA', modelProvider: 'test', modelName: 'test', promptVersion: 'test', ruleVersion: 'EB1A-2026-09', inputReferences: [], outputValidated: true, createdAt: '2026-09-28T00:00:00Z' }, generatedAt: '2026-09-28T00:00:00Z' } as EB1AAnalysisResult

describe('EB-1A evidence engine', () => {
  it('keeps profile-derived material explicitly unverified', () => {
    const evidence = createProfileDerivedEvidence([claim], document)
    expect(evidence).toHaveLength(1)
    expect(evidence[0].verificationStatus).toBe('UNVERIFIED')
    expect(evidence[0].reliabilityContext).toBe('SELF_ASSERTED')
  })

  it('matches supporting document text to the relevant claim', () => {
    const supporting: EvidenceRecord = { ...createProfileDerivedEvidence([claim], document)[0], id: 'EV-DOC-1', sourceType: 'UPLOADED_DOCUMENT', verificationStatus: 'NOT_REVIEWED', reliabilityContext: 'UNKNOWN', content: 'Architecture record: configuration drift detection platform was designed and deployed by the candidate.' }
    const matched = matchEvidenceToClaims([claim], [supporting])
    expect(matched[0].matchedClaimIds).toContain('CLM-1')
  })

  it('applies supported proposition evidence without turning unrelated propositions into supported', () => {
    const reconciliation: ClaimCriterionReconciliation = {
      claimId: 'CLM-1', criterionId: 'EB1A-C5', status: 'PARTIALLY_SUPPORTED', rationale: 'The document supports attribution.',
      evidenceAssessments: [{ evidenceId: 'EV-DOC-1', status: 'SUPPORTED', rationale: 'Supports attribution.', supportedFacts: ['Candidate designed the platform.'], unsupportedFacts: [], conflicts: [] }],
      propositionResults: [{ propositionId: 'EB1A-C5-P1', status: 'SUPPORTED', supportingEvidenceIds: ['EV-DOC-1'], conflictingEvidenceIds: [], rationale: 'Attribution is supported.', missingInformation: [], ambiguities: [] }],
      executionId: 'AI-2',
    }
    const updated = applyEvidenceReconciliations(baseAnalysis, [reconciliation])
    expect(updated.criterionResults[0].propositionResults[0].status).toBe('SUPPORTED')
    expect(updated.criterionResults[0].supportingEvidenceIds).toContain('EV-DOC-1')
  })
})
