import { describe, expect, it } from 'vitest'
import { ARJUN_PROFILE_EXTRACTION } from '../../src/data/demo/arjunProfileExtraction'
import { EB1A_PROPOSITIONS } from '../../src/data/visa/eb1a/propositions'
import { buildCandidateClaims } from '../../src/engines/analysis/buildCandidateClaims'
import { runEB1AProfileAnalysis } from '../../src/engines/analysis/runEB1AProfileAnalysis'
import type { MapClaimsToCriteriaContractOutput } from '../../src/ai/eb1a/contract'
import type { AIExecutionRecord } from '../../src/types/visa/eb1a'

describe('EB-1A profile analysis stage', () => {
  it('builds claims from detected sections, not only flagged verification claims', () => {
    const claims = buildCandidateClaims(ARJUN_PROFILE_EXTRACTION, 'Arjun.pdf')

    expect(claims.length).toBeGreaterThan(ARJUN_PROFILE_EXTRACTION.claims.length)
    expect(claims.some(claim => claim.normalizedType === 'PUBLICATION')).toBe(true)
    expect(claims.some(claim => claim.normalizedType === 'AWARD')).toBe(true)
    expect(claims.some(claim => claim.normalizedType === 'JUDGING')).toBe(true)
    expect(claims.some(claim => claim.normalizedType === 'CONTRIBUTION')).toBe(true)
  })

  it('keeps mapped profile claims unverified until evidence is evaluated', async () => {
    const claims = buildCandidateClaims(ARJUN_PROFILE_EXTRACTION, 'Arjun.pdf')
    const contribution = claims.find(claim => claim.text.startsWith('Distributed Configuration Drift Detection'))
    expect(contribution).toBeDefined()

    const output: MapClaimsToCriteriaContractOutput = {
      mappings: [
        {
          claimId: contribution!.id,
          criterionId: 'EB1A-C5',
          fit: 'POTENTIAL_MATCH',
          rationale: 'The claim identifies a specific technical contribution.',
          confidence: 'HIGH',
          propositionAssessments: EB1A_PROPOSITIONS.C5.map(proposition => ({
            propositionId: proposition.id,
            status: proposition.name === 'contribution_identity' || proposition.name === 'candidate_attribution'
              ? 'SUPPORTED_BY_CLAIM'
              : 'NOT_ESTABLISHED',
            rationale: 'Profile-level assertion only.',
          })),
          unresolvedQuestions: ['Independent evidence of major significance.'],
          ambiguities: [],
          unsupportedAssertions: [],
          evidenceNeeded: ['Independent evidence of significance.'],
        },
      ],
    }

    const execution: AIExecutionRecord = {
      id: 'test-execution',
      operation: 'MAP_CLAIMS_TO_CRITERIA',
      modelProvider: 'test',
      modelName: 'test',
      promptVersion: 'test',
      ruleVersion: 'EB1A-2026-09',
      inputReferences: [],
      outputValidated: true,
      createdAt: new Date().toISOString(),
    }

    const result = await runEB1AProfileAnalysis(
      claims,
      { occupation: 'Principal Technology Architect', role: 'Principal Technology Architect' },
      async () => ({ output, execution }),
    )

    const criterion = result.criterionResults.find(item => item.criterionId === 'EB1A-C5')
    expect(criterion?.claimFit).toBe('POTENTIAL_MATCH')
    expect(criterion?.overallEvidenceStatus).toBe('INSUFFICIENT_EVIDENCE')
    expect(criterion?.propositionResults.some(item => item.status === 'UNVERIFIED')).toBe(true)
  })
})
