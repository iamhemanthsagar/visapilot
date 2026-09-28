# VisaPilot — EB-1C Data Model

**Status:** Domain Specification — Phase 1  
**Pathway:** EB-1C / E13 — Multinational Executives and Managers  
**Rule Version:** `EB1C-2026-09`  

---

## 1. Type Definitions

```ts
export const EB1C_RULE_VERSION = 'EB1C-2026-09' as const

export type EB1CGateCode =
  | 'M1' // 1-year qualifying foreign employment
  | 'M2' // Qualifying corporate entity relationship
  | 'M3' // U.S. employer doing business >= 1 year
  | 'M4' // Multinational structure
  | 'M5' // Foreign managerial / executive capacity
  | 'M6' // Prospective U.S. managerial / executive capacity

export type EB1CCapacityType =
  | 'PERSONNEL_MANAGER'
  | 'FUNCTIONAL_MANAGER'
  | 'EXECUTIVE'
  | 'MIXED_MANAGERIAL_EXECUTIVE'
  | 'NON_QUALIFYING'

export type EB1CEntityRelationshipType =
  | 'SAME_EMPLOYER_BRANCH'
  | 'PARENT_SUBSIDIARY'
  | 'AFFILIATE_COMMON_PARENT'
  | 'AFFILIATE_SAME_INDIVIDUALS'
  | 'FIFTY_FIFTY_JOINT_VENTURE'
  | 'NON_QUALIFYING'

export type EB1CGateDefinition = {
  id: string
  pathway: 'EB1C'
  code: EB1CGateCode
  title: string
  regulatoryRequirement: string
  isMandatory: true // All EB-1C gates are mandatory
  propositionIds: string[]
  sourceIds: string[]
  version: string
  status: 'ACTIVE' | 'SUPERSEDED' | 'UNDER_REVIEW'
}

export type EB1CAssessmentState = {
  candidateId: string
  activePathway: 'EB1C'
  ruleVersion: string

  // Gate-by-Gate Results (All M1–M6 are Mandatory)
  gateResults: Array<{
    gateId: string
    code: EB1CGateCode
    title: string
    status: 'SUPPORTED' | 'PARTIALLY_SUPPORTED' | 'INSUFFICIENT_EVIDENCE' | 'UNVERIFIED' | 'CONFLICTING' | 'NOT_SUPPORTED'
    isBlocker: boolean
    propositionResults: Array<{
      propositionId: string
      status: 'SUPPORTED' | 'PARTIALLY_SUPPORTED' | 'INSUFFICIENT_EVIDENCE' | 'UNVERIFIED' | 'CONFLICTING' | 'NOT_SUPPORTED'
      evidenceIds: string[]
      rationale: string
      missingInformation: string[]
    }>
    supportingEvidenceIds: string[]
    counselReview: boolean
    gaps: string[]
  }>

  corporateProfile: {
    foreignEntityName: string
    usEntityName: string
    relationshipType: EB1CEntityRelationshipType
    relationshipSupported: boolean
    usDoingBusinessMonths: number
    multinationalOperationsVerified: boolean
  }

  capacityProfile: {
    foreignCapacity: EB1CCapacityType
    proposedUSCapacity: EB1CCapacityType
    subordinateHeadcountAbroad?: number
    subordinateHeadcountUS?: number
    functionalManagerJustification?: string
  }

  summary: {
    mandatoryGatesCount: 6
    supportedGatesCount: number
    openBlockersCount: number
    allMandatoryGatesSatisfied: boolean
  }

  lastUpdated: string
}
```
