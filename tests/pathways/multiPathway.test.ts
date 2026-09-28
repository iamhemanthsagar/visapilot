import { describe, expect, it } from 'vitest'
import { screenCandidatePathways, evaluatePathwayProfileMatch } from '../../src/engines/pathways/pathwayScreeningEngine'
import { evaluateEB1BCriteria } from '../../src/engines/rules/eb1b/eb1bEvaluationEngine'
import { evaluateEB1CCriteria } from '../../src/engines/rules/eb1c/eb1cEvaluationEngine'
import { evaluatePathwayRequirements } from '../../src/engines/rules/pathwayEvaluationRouter'
import { generatePathwayGaps } from '../../src/engines/gaps/eb1aGapEngine'
import { buildBenchmark, buildEvidencePlan, buildRoadmap } from '../../src/engines/roadmap/eb1aEvidenceBuildEngine'
import { ARJUN_PROFILE_EXTRACTION } from '../../src/data/demo/arjunProfileExtraction'
import { buildCandidateClaims } from '../../src/engines/analysis/buildCandidateClaims'
import type { ProfileExtraction } from '../../src/types/profile/profileExtraction'
import type { EB1AAnalysisResult } from '../../src/types/analysis/eb1aAnalysis'
import type { CandidateClaim } from '../../src/types/visa/eb1a'

describe('Multi-Pathway Architecture & Engines', () => {
  // Test 1: Real Profile Screening against EB-1A, EB-1B, and EB-1C
  describe('Stage 2 — Pathway Screening Engine', () => {
    it('evaluates Arjun profile across all three pathways and generates comparison', () => {
      const claims = buildCandidateClaims(ARJUN_PROFILE_EXTRACTION, 'Arjun_CV.pdf')
      const comparison = screenCandidatePathways(claims, ARJUN_PROFILE_EXTRACTION)

      expect(comparison).toBeDefined()
      expect(comparison.assessments.EB1A).toBeDefined()
      expect(comparison.assessments.EB1B).toBeDefined()
      expect(comparison.assessments.EB1C).toBeDefined()

      // Arjun has AI architecture contributions, publications, judging, awards -> Strong EB-1A & EB-1B
      expect(comparison.assessments.EB1A.totalRequirementsCount).toBe(10)
      expect(comparison.assessments.EB1A.supportedRequirementsCount).toBeGreaterThan(0)

      expect(comparison.assessments.EB1B.totalRequirementsCount).toBe(10)
      expect(comparison.assessments.EB1B.evidentiaryTotalCount).toBe(6)

      expect(comparison.assessments.EB1C.totalRequirementsCount).toBe(6)
      expect(comparison.assessments.EB1C.mandatoryTotalCount).toBe(6)

      // Selected pathway should be deterministic
      expect(comparison.selectedPathway).toBeTruthy()
      expect(comparison.selectionRationale).toContain('profile')
    })

    it('calculates transparent m / n requirement coverage ratio', () => {
      const claims = buildCandidateClaims(ARJUN_PROFILE_EXTRACTION, 'Arjun_CV.pdf')
      const eb1a = evaluatePathwayProfileMatch('EB1A', claims, ARJUN_PROFILE_EXTRACTION)

      expect(eb1a.coverageRatio).toBeGreaterThan(0)
      expect(eb1a.coverageRatio).toBeLessThanOrEqual(1)
      expect(eb1a.totalRequirementsCount).toBe(10)
    })

    it('handles an academic researcher profile by matching EB-1B criteria', () => {
      const academicProfile: ProfileExtraction = {
        candidate: { name: 'Dr. Sarah Lin', currentTitle: 'Associate Professor of Biochemistry', fieldOfEndeavor: 'Biochemistry' },
        sections: [
          { title: 'Academic Experience', items: [{ text: 'Postdoctoral Fellow 2018-2021', sourcePage: 1 }, { text: 'Assistant Professor 2021-2024', sourcePage: 1 }, { text: 'Associate Professor 2024-Present', sourcePage: 1 }] },
          { title: 'Peer-Reviewed Publications', items: [{ text: 'Authored 18 articles in Nature, Cell, and JACS', sourcePage: 2 }] },
          { title: 'Peer Review & Editorial', items: [{ text: 'Reviewer for 30 manuscripts in JACS and Nature Chemistry', sourcePage: 3 }] },
          { title: 'Awards', items: [{ text: 'Young Investigator Award in Chemical Biology', sourcePage: 4 }] },
        ],
        claims: [],
        ambiguities: [],
        extraction: { quality: 'COMPLETE', confidence: 'HIGH' },
      }

      const claims = buildCandidateClaims(academicProfile, 'Sarah_CV.pdf')
      const comparison = screenCandidatePathways(claims, academicProfile)

      expect(comparison.assessments.EB1B.evidentiarySatisfiedCount).toBeGreaterThanOrEqual(2)
      expect(comparison.assessments.EB1B.isThresholdMet).toBe(true)
    })

    it('handles an executive profile by matching EB-1C mandatory gates', () => {
      const executiveProfile: ProfileExtraction = {
        candidate: { name: 'Carlos Rodriguez', currentTitle: 'Vice President of Global Operations', fieldOfEndeavor: 'Enterprise Logistics' },
        sections: [
          { title: 'Employment History', items: [
            { text: 'Managing Director, Brazil Operations (2020-2023) managing 120 staff and 4 functional directors', sourcePage: 1 },
            { text: 'Transferred to U.S. Headquarters as VP Global Operations in 2024 for subsidiary entity', sourcePage: 1 },
          ]},
          { title: 'Executive Responsibilities', items: [
            { text: 'Directed multinational expansion, corporate budgets, and hiring/firing of senior management personnel', sourcePage: 2 },
          ]},
        ],
        claims: [],
        ambiguities: [],
        extraction: { quality: 'COMPLETE', confidence: 'HIGH' },
      }

      const claims = buildCandidateClaims(executiveProfile, 'Carlos_CV.pdf')
      const comparison = screenCandidatePathways(claims, executiveProfile)

      expect(comparison.assessments.EB1C.supportedRequirementsCount).toBeGreaterThanOrEqual(1)
      expect(comparison.assessments.EB1C.mandatoryTotalCount).toBe(6)
    })
  })

  // Test 2: EB-1B Evaluation Engine
  describe('EB-1B Rules & Evaluation Engine', () => {
    it('correctly evaluates 2-of-6 evidentiary threshold and mandatory prerequisites', () => {
      const dummyAnalysis: EB1AAnalysisResult = {
        status: 'SUCCESS',
        claims: [],
        mappings: [],
        criterionResults: [
          {
            criterionId: 'EB1B-B4',
            claimFit: 'POTENTIAL_MATCH',
            overallEvidenceStatus: 'SUPPORTED',
            propositionResults: [{ propositionId: 'EB1B-B4-P1', status: 'SUPPORTED', evidenceIds: ['ev-1'], rationale: 'Reviewed papers.', missingInformation: [], provenance: [] }],
            supportingEvidenceIds: ['ev-1'],
            counselReview: false,
            gaps: [],
            ruleVersion: 'EB1B-2026-09',
            provenance: [],
          },
          {
            criterionId: 'EB1B-B6',
            claimFit: 'POTENTIAL_MATCH',
            overallEvidenceStatus: 'SUPPORTED',
            propositionResults: [{ propositionId: 'EB1B-B6-P1', status: 'SUPPORTED', evidenceIds: ['ev-2'], rationale: 'Authored papers.', missingInformation: [], provenance: [] }],
            supportingEvidenceIds: ['ev-2'],
            counselReview: false,
            gaps: [],
            ruleVersion: 'EB1B-2026-09',
            provenance: [],
          },
          {
            criterionId: 'EB1B-B7',
            claimFit: 'POTENTIAL_MATCH',
            overallEvidenceStatus: 'SUPPORTED',
            propositionResults: [{ propositionId: 'EB1B-B7-P1', status: 'SUPPORTED', evidenceIds: ['ev-3'], rationale: '4 years verified.', missingInformation: [], provenance: [] }],
            supportingEvidenceIds: ['ev-3'],
            counselReview: false,
            gaps: [],
            ruleVersion: 'EB1B-2026-09',
            provenance: [],
          },
          {
            criterionId: 'EB1B-B8',
            claimFit: 'POTENTIAL_MATCH',
            overallEvidenceStatus: 'SUPPORTED',
            propositionResults: [{ propositionId: 'EB1B-B8-P1', status: 'SUPPORTED', evidenceIds: ['ev-4'], rationale: 'Tenure-track offer.', missingInformation: [], provenance: [] }],
            supportingEvidenceIds: ['ev-4'],
            counselReview: false,
            gaps: [],
            ruleVersion: 'EB1B-2026-09',
            provenance: [],
          },
        ],
        execution: { id: 'test-exec', operation: 'MAP_CLAIMS_TO_CRITERIA', modelProvider: 'test', modelName: 'test', promptVersion: '1', ruleVersion: 'EB1B-2026-09', inputReferences: [], outputValidated: true, createdAt: '2026-09-28' },
        generatedAt: '2026-09-28',
      }

      const review = evaluateEB1BCriteria(dummyAnalysis)
      expect(review.evidentiarySatisfiedCount).toBe(2)
      expect(review.evidentiaryThresholdMet).toBe(true)
      expect(review.mandatoryBlockersCount).toBe(1) // B9 still unresolved
    })
  })

  // Test 3: EB-1C Evaluation Engine
  describe('EB-1C Rules & Evaluation Engine', () => {
    it('enforces all 6 mandatory gates without point substitution', () => {
      const dummyAnalysis: EB1AAnalysisResult = {
        status: 'SUCCESS',
        claims: [],
        mappings: [],
        criterionResults: [
          {
            criterionId: 'EB1C-M1',
            claimFit: 'POTENTIAL_MATCH',
            overallEvidenceStatus: 'SUPPORTED',
            propositionResults: [{ propositionId: 'EB1C-M1-P1', status: 'SUPPORTED', evidenceIds: ['ev-1'], rationale: '14 months abroad.', missingInformation: [], provenance: [] }],
            supportingEvidenceIds: ['ev-1'],
            counselReview: false,
            gaps: [],
            ruleVersion: 'EB1C-2026-09',
            provenance: [],
          },
        ],
        execution: { id: 'test-exec-c', operation: 'MAP_CLAIMS_TO_CRITERIA', modelProvider: 'test', modelName: 'test', promptVersion: '1', ruleVersion: 'EB1C-2026-09', inputReferences: [], outputValidated: true, createdAt: '2026-09-28' },
        generatedAt: '2026-09-28',
      }

      const review = evaluateEB1CCriteria(dummyAnalysis)
      expect(review.mandatoryGatesCount).toBe(6)
      expect(review.supportedGatesCount).toBe(1)
      expect(review.openBlockersCount).toBe(5)
      expect(review.allMandatoryGatesSatisfied).toBe(false)
    })
  })

  // Test 4: Downstream Multi-Pathway Pipeline Consistency (Stages 5 to 9)
  describe('Downstream Stages 5–9 Multi-Pathway Pipeline', () => {
    it('executes unified evaluation, gap generation, benchmark, and roadmap for EB-1B', () => {
      const eb1bAnalysis: EB1AAnalysisResult = {
        status: 'SUCCESS',
        claims: [{ id: 'clm-1', candidateId: 'cand-1', text: 'Authored 5 papers', criterionCandidates: [{ criterionId: 'EB1B-B6', fit: 'POTENTIAL_MATCH', rationale: 'Scholarly papers', confidence: 'HIGH', unresolvedQuestions: [] }], claimFitStatus: 'POTENTIAL_MATCH', claimSafetyFlags: [], extractedFacts: {}, provenance: [], createdAt: '2026-09-28' }],
        mappings: [],
        criterionResults: [
          {
            criterionId: 'EB1B-B6',
            claimFit: 'POTENTIAL_MATCH',
            overallEvidenceStatus: 'PARTIALLY_SUPPORTED',
            propositionResults: [
              { propositionId: 'EB1B-B6-P1', status: 'SUPPORTED', evidenceIds: ['ev-1'], rationale: 'Paper exists.', missingInformation: [], provenance: [] },
              { propositionId: 'EB1B-B6-P3', status: 'INSUFFICIENT_EVIDENCE', evidenceIds: [], rationale: 'International circulation not established.', missingInformation: ['Journal international distribution'], provenance: [] },
            ],
            supportingEvidenceIds: ['ev-1'],
            counselReview: false,
            gaps: ['International circulation proof needed'],
            ruleVersion: 'EB1B-2026-09',
            provenance: [],
          },
        ],
        execution: { id: 'test-exec-pipe', operation: 'MAP_CLAIMS_TO_CRITERIA', modelProvider: 'test', modelName: 'test', promptVersion: '1', ruleVersion: 'EB1B-2026-09', inputReferences: [], outputValidated: true, createdAt: '2026-09-28' },
        generatedAt: '2026-09-28',
      }

      // Stage 5: Unified Evaluation
      const stage5Review = evaluatePathwayRequirements('EB1B', eb1bAnalysis)
      expect(stage5Review.pathwayId).toBe('EB1B')
      expect(stage5Review.totalRequirementsCount).toBe(10)

      // Stage 6: Gap Generation
      const gaps = generatePathwayGaps({ claims: eb1bAnalysis.claims, criterionResults: eb1bAnalysis.criterionResults, evidence: [] })
      expect(gaps.length).toBeGreaterThan(0)
      expect(gaps[0].criterionId).toBe('EB1B-B6')

      // Stage 7: Evidence Build Plan
      const plan = buildEvidencePlan(gaps)
      expect(plan.length).toBe(gaps.length)
      expect(plan[0].criterionId).toBe('EB1B-B6')

      // Stage 8: Benchmark
      const benchmark = buildBenchmark({ claims: eb1bAnalysis.claims, criterionResults: eb1bAnalysis.criterionResults, evidence: [] }, gaps, 'EB1B')
      expect(benchmark.dimensions.find(d => d.id === 'CRITERION_COVERAGE')?.denominator).toBe(9)

      // Stage 9: Roadmap
      const roadmap = buildRoadmap(plan, gaps)
      expect(roadmap.length).toBe(plan.length)
      expect(['NOW', 'NEXT', 'LATER']).toContain(roadmap[0].phase)
    })
  })
})
