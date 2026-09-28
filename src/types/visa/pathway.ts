/**
 * Multi-Pathway Common Domain Contract for VisaPilot.
 *
 * Provides a unified schema for EB-1A, EB-1B, and EB-1C while preserving
 * pathway-specific regulatory requirements, propositions, thresholds, and mandatory gates.
 */

export type VisaPathwayId = 'EB1A' | 'EB1B' | 'EB1C'

export type PathwayRequirementType =
  | 'MANDATORY_GATE'
  | 'THRESHOLD_PREREQUISITE'
  | 'EVIDENTIARY_CRITERION'
  | 'FINAL_MERITS'
  | 'CONTINUED_WORK'
  | 'US_BENEFIT'

export type RuleStatus = 'ACTIVE' | 'SUPERSEDED' | 'UNDER_REVIEW'

export type SourceAuthority =
  | 'STATUTE'
  | 'REGULATION'
  | 'USCIS_POLICY'
  | 'BINDING_PRECEDENT'
  | 'ILLUSTRATIVE'

export type RegulatorySourceReference = {
  id: string
  title: string
  citation: string
  url?: string
  authority: SourceAuthority
  effectiveDate?: string
  lastVerified: string
  notes?: string
}

export type PropositionDefinition = {
  id: string
  requirementId: string
  name: string
  statement: string
  evidenceCharacteristics?: string[]
}

export type RequirementDefinition = {
  id: string
  pathwayId: VisaPathwayId
  code: string
  type: PathwayRequirementType
  title: string
  description?: string
  regulatoryRequirement: string
  requirements?: string[]
  isMandatory: boolean
  thresholdGroup?:
    | 'THREE_OF_TEN_CRITERIA'
    | 'TWO_OF_SIX_EVIDENTIARY'
    | 'CORE_PREREQUISITE'
    | 'MANDATORY_GATE'
    | 'FINAL_MERITS'
  propositionIds: string[]
  sourceIds: string[]
  version: string
  status: RuleStatus
}

export type PathwayRuleSet = {
  id: string
  pathwayId: VisaPathwayId
  name: string
  version: string
  status: RuleStatus
  effectiveDate: string
  lastVerified: string
  sourceIds: string[]
  requirements: RequirementDefinition[]
  thresholdDescription: string
  finalMeritsDescription: string
}

export type ProfileRequirementMatchStatus =
  | 'SUPPORTED_BY_PROFILE'
  | 'PARTIALLY_SUPPORTED'
  | 'UNVERIFIED'
  | 'NOT_FOUND'
  | 'AMBIGUOUS'
  | 'CONFLICTING'
  | 'NOT_APPLICABLE'

export type ProfileRequirementAssessment = {
  requirementId: string
  code: string
  pathwayId: VisaPathwayId
  title: string
  type: PathwayRequirementType
  isMandatory: boolean
  status: ProfileRequirementMatchStatus
  matchedClaimIds: string[]
  matchedFacts: string[]
  missingElements: string[]
  confidence: 'HIGH' | 'MEDIUM' | 'LOW'
  rationale: string
}

export type PathwayAssessmentSummary = {
  pathwayId: VisaPathwayId
  name: string
  ruleVersion: string
  totalRequirementsCount: number // n
  supportedRequirementsCount: number // m (profile-supported)
  partiallySupportedCount: number
  unresolvedCount: number
  mandatoryTotalCount: number
  mandatorySatisfiedCount: number
  mandatoryBlockersCount: number
  evidentiaryTotalCount: number
  evidentiarySatisfiedCount: number
  evidentiaryThresholdRequired: number // 3 for EB-1A, 2 for EB-1B, 0 for EB-1C
  isThresholdMet: boolean
  coverageRatio: number // m / n
  requirements: ProfileRequirementAssessment[]
  mandatoryBlockerIds: string[]
  selectionConfidence: 'HIGH' | 'MEDIUM' | 'LOW'
}

export type PathwayComparisonResult = {
  assessments: Record<VisaPathwayId, PathwayAssessmentSummary>
  selectedPathway: VisaPathwayId | null
  selectionRationale: string
  isAmbiguous: boolean
  generatedAt: string
}
