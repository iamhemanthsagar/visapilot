import { describe, it, expect } from 'vitest'
import { compileProfessionalDossier } from '../../src/engines/dossier/dossierCompilerEngine'
import { generateDossierMarkdown } from '../../src/engines/dossier/dossierExport'
import { ARJUN_PROFILE_EXTRACTION } from '../../src/data/demo/arjunProfileExtraction'
import { buildCandidateClaims } from '../../src/engines/analysis/buildCandidateClaims'
import { generateEB1AGaps } from '../../src/engines/gaps/eb1aGapEngine'
import { buildEvidencePlan, buildRoadmap, buildBenchmark } from '../../src/engines/roadmap/eb1aEvidenceBuildEngine'

describe('Dossier Compiler & Export Engine (Stage 10)', () => {
  it('compiles full 18-part dossier from structured application state without fabricating facts', () => {
    const claims = buildCandidateClaims(ARJUN_PROFILE_EXTRACTION, 'Arjun_Mehta_Test_Profile.pdf')
    const gaps = generateEB1AGaps({
      claims,
      criterionResults: [],
      evidence: [],
    })
    const buildPlan = buildEvidencePlan(gaps)
    const benchmark = buildBenchmark({ claims, criterionResults: [], evidence: [] }, gaps, 'EB1A')
    const roadmap = buildRoadmap(buildPlan, gaps)

    const dossier = compileProfessionalDossier({
      profileExtraction: ARJUN_PROFILE_EXTRACTION,
      parsedDocument: {
        filename: 'Arjun_Mehta_Test_Profile.pdf',
        mimeType: 'application/pdf',
        text: 'Arjun Mehta professional profile text...',
        pageCount: 3,
        lines: [],
        characterCount: 1200,
        extractionQuality: 'STRONG',
      },
      activePathway: 'EB1A',
      pathwayComparison: null,
      claims,
      criterionResults: [],
      evidence: [],
      reconciliations: [],
      gaps,
      buildPlan,
      benchmark,
      roadmap,
    })

    // Assert Metadata & Structure
    expect(dossier.metadata.candidateName).toBe('Arjun Mehta')
    expect(dossier.metadata.primaryRecommendedPathway).toBe('EB1A')
    expect(dossier.metadata.readinessIndex).toBeGreaterThan(0)
    expect(dossier.snapshotFields.length).toBeGreaterThanOrEqual(10)
    expect(dossier.telemetryStages.length).toBe(4)
    expect(dossier.criteriaReviews.length).toBe(10)
    expect(dossier.quantifiedRoadmapScores.length).toBe(12)
    expect(dossier.minimumBuildPackage.length).toBe(12)

    // Assert Catalogs
    expect(dossier.catalogs.papers.length).toBe(3)
    expect(dossier.catalogs.patents.length).toBe(2)
    expect(dossier.catalogs.products.length).toBe(2)
    expect(dossier.catalogs.whitePapers.length).toBe(2)
    expect(dossier.catalogs.articles.length).toBe(4)
    expect(dossier.catalogs.lectures.length).toBe(4)
    expect(dossier.catalogs.judging.length).toBe(5)
    expect(dossier.catalogs.caseStudies.length).toBe(3)
    expect(dossier.catalogs.validationReports.length).toBe(4)
    expect(dossier.catalogs.visibilityActions.length).toBe(6)

    // Assert Risk Flags and Exhibits
    expect(dossier.riskFlags.length).toBe(4)
    expect(dossier.verificationExhibits.length).toBe(16)
    expect(dossier.finalConclusion.totalAssetsToBuild).toBeGreaterThanOrEqual(41)

    // Export Markdown test
    const markdown = generateDossierMarkdown(dossier)
    expect(markdown).toContain('CONFIDENTIAL EB-1 PROFESSIONAL REVIEW DOSSIER')
    expect(markdown).toContain('Arjun Mehta')
    expect(markdown).toContain('PART I — Readiness Benchmark Report')
    expect(markdown).toContain('PART II — Evidence Mapping and Criterion-Level Status')
    expect(markdown).toContain('PART III — Quantified Profile-Building Roadmap')
    expect(markdown).toContain('PART IV — Recommended Evidence Assets to Build')
    expect(markdown).toContain('PART V — Prioritized Execution Plan')
    expect(markdown).toContain('PART VI — Risk Flags and Claim-Safety Review')
    expect(markdown).toContain('PART VII — Counsel Verification Package Index')
  })
})
