# VisaPilot — EB-1B Data Model

**Status:** Domain Specification — Phase 1  
**Pathway:** EB-1B / E12 — Outstanding Professors and Researchers  
**Rule Version:** `EB1B-2026-09`  

---

## 1. Type Definitions

```ts
export const EB1B_RULE_VERSION = 'EB1B-2026-09' as const

export type EB1BCriterionCode =
  | 'B1' | 'B2' | 'B3' | 'B4' | 'B5' | 'B6' // 6 Regulatory Evidence Categories
  | 'B7' // 3-Year Teaching/Research Experience Threshold
  | 'B8' // Qualifying Permanent Job Offer
  | 'B9' // Academic Field Scope
  | 'B10' // Final Merits Determination

export type EB1BRequirementType =
  | 'THRESHOLD_EXPERIENCE'
  | 'THRESHOLD_JOB_OFFER'
  | 'ACADEMIC_FIELD'
  | 'INITIAL_EVIDENCE_CRITERION'
  | 'FINAL_MERITS'

export type EB1BRequirementDefinition = {
  id: string
  pathway: 'EB1B'
  code: EB1BCriterionCode
  type: EB1BRequirementType
  title: string
  regulatoryRequirement: string
  isMandatory: boolean
  thresholdGroup?: 'TWO_OF_SIX_EVIDENTIARY' | 'CORE_PREREQUISITE' | 'FINAL_MERITS'
  propositionIds: string[]
  sourceIds: string[]
  version: string
  status: 'ACTIVE' | 'SUPERSEDED' | 'UNDER_REVIEW'
}

export type EB1BAssessmentState = {
  candidateId: string
  activePathway: 'EB1B'
  ruleVersion: string
  
  // Prerequisite threshold results
  experienceAssessment: {
    status: 'SUPPORTED' | 'PARTIALLY_SUPPORTED' | 'INSUFFICIENT_EVIDENCE' | 'UNVERIFIED' | 'CONFLICTING'
    accumulatedMonths: number
    includesDegreeExperience: boolean
    degreeEarned: boolean
    instructorOfRecord: boolean
    outstandingResearchDuringDegree: boolean
    evidenceIds: string[]
  }

  jobOfferAssessment: {
    status: 'SUPPORTED' | 'PARTIALLY_SUPPORTED' | 'INSUFFICIENT_EVIDENCE' | 'UNVERIFIED' | 'CONFLICTING'
    employerType: 'UNIVERSITY_HIGHER_ED' | 'PRIVATE_EMPLOYER' | 'UNKNOWN'
    positionType: 'TENURED' | 'TENURE_TRACK' | 'PERMANENT_RESEARCH' | 'NON_QUALIFYING'
    privateEmployerResearcherCount?: number
    privateEmployerDocumentedAccomplishments?: boolean
    evidenceIds: string[]
  }

  // 6 Evidentiary Criterion Results
  criterionResults: Array<{
    criterionId: string
    code: EB1BCriterionCode
    claimFit: 'POTENTIAL_MATCH' | 'PARTIAL_MATCH' | 'NOT_A_MATCH' | 'UNCLEAR' | 'NOT_RELEVANT'
    overallEvidenceStatus: 'SUPPORTED' | 'PARTIALLY_SUPPORTED' | 'INSUFFICIENT_EVIDENCE' | 'UNVERIFIED' | 'CONFLICTING' | 'NOT_SUPPORTED' | 'NOT_APPLICABLE'
    propositionResults: Array<{
      propositionId: string
      status: 'SUPPORTED' | 'PARTIALLY_SUPPORTED' | 'INSUFFICIENT_EVIDENCE' | 'UNVERIFIED' | 'CONFLICTING' | 'NOT_SUPPORTED' | 'NOT_APPLICABLE'
      evidenceIds: string[]
      rationale: string
      missingInformation: string[]
    }>
    supportingEvidenceIds: string[]
    counselReview: boolean
    gaps: string[]
  }>

  // Initial evidence 2-of-6 rollup
  initialEvidenceSummary: {
    criteriaSatisfiedCount: number
    requiredThreshold: 2
    isThresholdMet: boolean
    supportedCodes: EB1BCriterionCode[]
  }

  // Final Merits Determination
  finalMerits?: {
    internationalRecognition: 'SUPPORTED' | 'PARTIALLY_SUPPORTED' | 'INSUFFICIENT_EVIDENCE' | 'UNVERIFIED' | 'CONFLICTING' | 'COUNSEL_REVIEW'
    synthesis: string
    strengths: string[]
    unresolvedIssues: string[]
    evidenceIds: string[]
  }

  lastUpdated: string
}
```
