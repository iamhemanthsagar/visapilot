/**
 * EB-1A domain contract. These types model assessment inputs and state; they
 * do not determine legal eligibility or implement an assessment engine.
 */

export const EB1A_RULE_VERSION = 'EB1A-2026-09' as const

export type EB1ACriterionCode =
  | 'C1' | 'C2' | 'C3' | 'C4' | 'C5'
  | 'C6' | 'C7' | 'C8' | 'C9' | 'C10'

export type RuleStatus = 'ACTIVE' | 'SUPERSEDED' | 'UNDER_REVIEW'

export type SourceAuthority =
  | 'STATUTE'
  | 'REGULATION'
  | 'USCIS_POLICY'
  | 'BINDING_PRECEDENT'
  | 'ILLUSTRATIVE'

export type RegulatorySource = {
  id: string
  title: string
  citation: string
  url: string
  authority: SourceAuthority
  effectiveDate?: string
  lastVerified: string
  notes?: string
}

export type ProvenanceSourceType =
  | 'UPLOADED_DOCUMENT'
  | 'PUBLIC_SOURCE'
  | 'CANDIDATE_INPUT'
  | 'SYSTEM_RULE'
  | 'LLM_INFERENCE'

export type SourceLocator = {
  page?: number
  section?: string
  paragraph?: string
  startOffset?: number
  endOffset?: number
  url?: string
  excerpt?: string
}

export type Provenance = {
  sourceType: ProvenanceSourceType
  documentId?: string
  sourceId?: string
  locator?: SourceLocator
  retrievedAt?: string
  extractedAt?: string
  ruleVersion?: string
  aiExecutionId?: string
}

export type Candidate = {
  id: string
  fullName: string
  fieldOfEndeavor?: string
  occupation?: string
  currentRole?: string
  currentOrganization?: string
  profileSummary?: string
  createdAt: string
  updatedAt: string
}

export type DocumentType =
  | 'CV'
  | 'RESUME'
  | 'AWARD'
  | 'MEMBERSHIP'
  | 'PUBLICATION'
  | 'JUDGING'
  | 'EMPLOYMENT'
  | 'COMPENSATION'
  | 'EXHIBITION'
  | 'MEDIA'
  | 'CONTRIBUTION'
  | 'CONTRACT'
  | 'BUSINESS_PLAN'
  | 'OTHER'

export type Document = {
  id: string
  candidateId: string
  documentType: DocumentType
  fileName: string
  mimeType?: string
  sourceUri?: string
  ingestionStatus:
    | 'PENDING'
    | 'PROCESSING'
    | 'PROCESSED'
    | 'FAILED'
  createdAt: string
}

export type ClaimType =
  | 'AWARD'
  | 'MEMBERSHIP'
  | 'MEDIA'
  | 'JUDGING'
  | 'CONTRIBUTION'
  | 'PUBLICATION'
  | 'EXHIBITION'
  | 'LEADERSHIP'
  | 'COMPENSATION'
  | 'COMMERCIAL_SUCCESS'
  | 'EMPLOYMENT'
  | 'OTHER'

export type ClaimFit =
  | 'NOT_RELEVANT'
  | 'POTENTIAL_MATCH'
  | 'PARTIAL_MATCH'
  | 'NOT_A_MATCH'
  | 'UNCLEAR'

export type MappingConfidence =
  | 'HIGH'
  | 'MEDIUM'
  | 'LOW'

export type ClaimSafetyFlag =
  | 'UNSUPPORTED_SUPERLATIVE'
  | 'UNQUANTIFIED_IMPACT'
  | 'UNVERIFIED_EXTERNAL_RECOGNITION'
  | 'UNVERIFIED_STATISTIC'
  | 'AMBIGUOUS_ATTRIBUTION'
  | 'AMBIGUOUS_ROLE'
  | 'AMBIGUOUS_AWARD_STATUS'
  | 'POTENTIAL_CONFLICT'
  | 'SOURCE_MISSING'

export type CriterionCandidate = {
  criterionId: string
  fit: ClaimFit
  rationale: string
  confidence: MappingConfidence
  unresolvedQuestions: string[]
}

/** A candidate assertion remains distinct from evidence, even when extracted from a document. */
export type CandidateClaim = {
  id: string
  candidateId: string
  sourceDocumentId?: string
  text: string
  normalizedText?: string
  normalizedType?: ClaimType
  extractedFacts: Record<string, unknown>
  criterionCandidates: CriterionCandidate[]
  claimFitStatus: ClaimFit
  claimSafetyFlags: ClaimSafetyFlag[]
  provenance: Provenance[]
  createdAt: string
}

export type EvidenceVerificationStatus =
  | 'VERIFIED'
  | 'PARTIALLY_VERIFIED'
  | 'UNVERIFIED'
  | 'CONFLICTING'
  | 'NOT_REVIEWED'

export type EvidenceReliability =
  | 'PRIMARY'
  | 'SECONDARY'
  | 'SELF_ASSERTED'
  | 'EMPLOYER'
  | 'INDEPENDENT'
  | 'UNKNOWN'

export type EvidenceSourceType =
  | 'UPLOADED_DOCUMENT'
  | 'PUBLIC_SOURCE'
  | 'CANDIDATE_PROVIDED'
  | 'THIRD_PARTY'
  | 'OTHER'

export type EvidenceStatus =
  | 'SUPPORTED'
  | 'PARTIALLY_SUPPORTED'
  | 'INSUFFICIENT_EVIDENCE'
  | 'UNVERIFIED'
  | 'CONFLICTING'
  | 'NOT_SUPPORTED'
  | 'NOT_APPLICABLE'

export type Evidence = {
  id: string
  candidateId: string
  sourceType: EvidenceSourceType
  sourceLocator?: string
  title?: string
  description?: string
  contentReference?: string
  verificationStatus: EvidenceVerificationStatus
  reliabilityContext: EvidenceReliability
  supportsPropositionIds: string[]
  provenance: Provenance[]
  createdAt: string
}

export type PropositionClaimStatus =
  | 'SUPPORTED_BY_CLAIM'
  | 'PARTIALLY_ESTABLISHED'
  | 'NOT_ESTABLISHED'
  | 'UNCLEAR'

export type PropositionDefinition = {
  id: string
  criterionId: string
  name: string
  statement: string
  evidenceCharacteristics?: string[]
}

export type CriterionDefinition = {
  id: string
  pathway: 'EB1A'
  code: EB1ACriterionCode
  title: string
  regulatoryRequirement: string
  requirements: string[]
  propositionIds: string[]
  sourceIds: string[]
  version: string
  status: RuleStatus
}

export type InitialEvidenceRoute = {
  id:
    | 'ONE_TIME_MAJOR_AWARD'
    | 'THREE_OF_TEN_CRITERIA'

  description: string
  sourceIds: string[]
  requiresFinalMeritsAssessment: true
}

export type EB1ARuleSet = {
  id: string
  pathway: 'EB1A'
  version: string
  status: RuleStatus
  effectiveDate: string
  lastVerified: string
  sourceIds: string[]
  initialEvidenceRoutes: InitialEvidenceRoute[]

  comparableEvidence: {
    regulatoryRequirement: string
    sourceIds: string[]
    counselReviewRequiredWhenUncertain: true
  }

  continuedWork: {
    regulatoryRequirement: string
    sourceIds: string[]
  }

  prospectiveUSBenefit: {
    regulatoryRequirement: string
    sourceIds: string[]
  }

  finalMerits: {
    coreStandard: string
    sourceIds: string[]
    isSeparateFromInitialEvidence: true
  }
}

export type PropositionResult = {
  propositionId: string
  status: EvidenceStatus
  evidenceIds: string[]
  rationale: string
  missingInformation: string[]
  provenance: Provenance[]
}

export type CriterionResult = {
  criterionId: string
  claimFit: ClaimFit
  propositionResults: PropositionResult[]
  supportingEvidenceIds: string[]
  overallEvidenceStatus: EvidenceStatus
  counselReview: boolean
  gaps: string[]
  ruleVersion: string
  provenance: Provenance[]
}

export type ComparableEvidenceAssessment = {
  criterionId: string

  occupationApplicability:
    | 'READILY_APPLICABLE'
    | 'NOT_READILY_APPLICABLE'
    | 'POTENTIALLY_NOT_READILY_APPLICABLE'
    | 'UNCLEAR'

  applicabilityRationale: string
  candidateExplanation?: string

  proposedEvidence?: {
    description: string
    comparability:
      | 'COMPARABLE'
      | 'POTENTIALLY_COMPARABLE'
      | 'NOT_COMPARABLE'
      | 'UNCLEAR'
    rationale?: string
    evidenceIds: string[]
  }

  status:
    | 'NOT_NEEDED'
    | 'POTENTIAL_COMPARABLE'
    | 'COMPARABILITY_UNCLEAR'
    | 'COMPARABLE_BASIS_UNSUPPORTED'
    | 'SUPPORTED_FOR_REVIEW'
    | 'COUNSEL_REVIEW'

  provenance: Provenance[]
}

export type RecognitionSignal = {
  id: string
  candidateId: string

  signalType:
    | 'AWARD'
    | 'MEDIA_COVERAGE'
    | 'JUDGING'
    | 'EXPERT_RECOGNITION'
    | 'INDUSTRY_ADOPTION'
    | 'INDEPENDENT_CITATION'
    | 'PROFESSIONAL_SELECTION'
    | 'LEADERSHIP_RECOGNITION'
    | 'CONFERENCE_INVITATION'
    | 'OTHER'

  date?: string
  field?: string

  scope:
    | 'LOCAL'
    | 'REGIONAL'
    | 'NATIONAL'
    | 'INTERNATIONAL'
    | 'UNKNOWN'

  independence:
    | 'INDEPENDENT'
    | 'EMPLOYER'
    | 'SELF_ASSERTED'
    | 'PEER'
    | 'INDUSTRY_BODY'
    | 'MEDIA'
    | 'GOVERNMENT'
    | 'UNKNOWN'

  description: string
  evidenceIds: string[]
  provenance: Provenance[]
}

export type AssessmentStatus =
  | 'SUPPORTED_FOR_REVIEW'
  | 'PARTIALLY_SUPPORTED'
  | 'INSUFFICIENT_EVIDENCE'
  | 'UNVERIFIED'
  | 'CONFLICTING'
  | 'COUNSEL_REVIEW'

export type FinalMeritsAssessment = {
  candidateId: string
  sustainedAcclaim: AssessmentStatus
  recognizedAchievements: AssessmentStatus
  fieldStanding: AssessmentStatus
  recognitionSignals: string[]
  majorAchievements: string[]
  strengths: string[]
  unresolvedIssues: string[]
  contradictions: string[]
  synthesis: string
  evidenceIds: string[]
  provenance: Provenance[]
}

export type WorkContinuationAssessment = {
  candidateId: string
  currentField?: string
  proposedUSWork?: string

  relationshipToExpertise:
    | 'DIRECT'
    | 'RELATED'
    | 'UNCLEAR'
    | 'NOT_ESTABLISHED'

  evidenceStatus: AssessmentStatus
  evidenceIds: string[]
  gaps: string[]
  rationale: string
}

export type USBenefitAssessment = {
  candidateId: string
  proposedActivities: string[]
  claimedBenefitAreas: string[]
  supportingEvidenceIds: string[]
  status: AssessmentStatus
  gaps: string[]
  rationale: string
  provenance: Provenance[]
}

export type Gap = {
  id: string

  scope:
    | 'CLAIM'
    | 'PROPOSITION'
    | 'CRITERION'
    | 'COMPARABLE_EVIDENCE'
    | 'FINAL_MERITS'
    | 'CONTINUE_WORK'
    | 'US_BENEFIT'

  targetId: string

  type:
    | 'MISSING_EVIDENCE'
    | 'WEAK_EVIDENCE'
    | 'UNVERIFIED'
    | 'CONFLICTING'
    | 'AMBIGUOUS_CLAIM'
    | 'MISSING_CONTEXT'
    | 'COUNSEL_REVIEW'

  description: string
  recommendedActions: string[]
  priority: 'HIGH' | 'MEDIUM' | 'LOW'
  provenance: Provenance[]
}

export type EvidenceAction = {
  id: string
  propositionId: string

  actionType:
    | 'UPLOAD_DOCUMENT'
    | 'PROVIDE_SOURCE'
    | 'PROVIDE_CONTEXT'
    | 'VERIFY_FACT'
    | 'OBTAIN_INDEPENDENT_CORROBORATION'
    | 'CLARIFY_CLAIM'
    | 'COUNSEL_REVIEW'

  description: string
  priority: 'HIGH' | 'MEDIUM' | 'LOW'
}

export type AssessmentStage =
  | 'NEW'
  | 'PROFILE_PARSED'
  | 'CLAIMS_EXTRACTED'
  | 'CRITERION_MAPPED'
  | 'PROFILE_ASSESSED'
  | 'EVIDENCE_INGESTED'
  | 'EVIDENCE_RECONCILED'
  | 'CRITERIA_ASSESSED'
  | 'OVERALL_SYNTHESIS_READY'
  | 'FINAL_MERITS_ASSESSED'
  | 'WORK_AND_BENEFIT_ASSESSED'
  | 'ROADMAP_READY'
  | 'DOSSIER_READY'

export type EB1AAssessmentState = {
  candidate: Candidate
  documents: Document[]
  claims: CandidateClaim[]
  evidence: Evidence[]
  criterionDefinitions: CriterionDefinition[]
  criterionResults: CriterionResult[]
  comparableEvidence: ComparableEvidenceAssessment[]
  recognitionSignals: RecognitionSignal[]
  finalMerits?: FinalMeritsAssessment
  continueWork?: WorkContinuationAssessment
  usBenefit?: USBenefitAssessment
  gaps: Gap[]
  ruleVersion: string
  stage: AssessmentStage
  lastUpdated: string
}

// LLM contracts: typed payloads only.
// No provider or integration is implemented here.

export type ExtractClaimsInput = {
  document: {
    id: string
    type: string
    text: string
  }

  candidateContext?: Pick<
    Candidate,
    'fullName' | 'fieldOfEndeavor' | 'occupation'
  >
}

export type ExtractClaimsOutput = {
  claims: Array<{
    text: string
    normalizedType: ClaimType
    extractedFacts: Record<string, unknown>
    sourceLocator?: SourceLocator
    ambiguities: string[]
    safetyFlags: ClaimSafetyFlag[]
  }>
}

/**
 * Batch claim-to-criterion mapping input.
 *
 * The mapper receives the complete normalized claim set for the candidate
 * rather than making one model request per claim.
 */
export type MapClaimsToCriteriaInput = {
  claims: CandidateClaim[]

  criteria: Array<
    Pick<
      CriterionDefinition,
      | 'id'
      | 'code'
      | 'title'
      | 'regulatoryRequirement'
    >
    & {
      propositionDefinitions: Pick<
        PropositionDefinition,
        'id' | 'statement'
      >[]
    }
  >

  candidateContext: {
    fieldOfEndeavor?: string
    occupation?: string
    role?: string
  }
}

/**
 * Every mapping identifies the claim that produced it.
 *
 * This allows one claim to map to multiple criteria and allows multiple
 * claims to map to the same criterion without losing traceability.
 */
export type MapClaimsToCriteriaOutput = {
  mappings: Array<{
    claimId: string
    criterionId: string
    fit: ClaimFit
    rationale: string
    confidence: MappingConfidence

    propositionAssessments: Array<{
      propositionId: string
      status: PropositionClaimStatus
      rationale: string
    }>

    unresolvedQuestions: string[]
    ambiguities: string[]
    unsupportedAssertions: string[]
    evidenceNeeded: string[]
  }>
}

export type ReconcileEvidenceInput = {
  claim: CandidateClaim

  criterion: Pick<
    CriterionDefinition,
    | 'id'
    | 'code'
    | 'title'
    | 'regulatoryRequirement'
  >

  propositions: Pick<
    PropositionDefinition,
    'id' | 'statement'
  >[]

  evidence: Array<
    Pick<
      Evidence,
      | 'id'
      | 'title'
      | 'sourceType'
      | 'provenance'
    >
    & {
      content: string
    }
  >
}

export type ReconcileEvidenceOutput = {
  claimVerification: {
    status: 'SUPPORTED' | 'PARTIALLY_SUPPORTED' | 'UNVERIFIED' | 'CONFLICTING' | 'INSUFFICIENT_EVIDENCE'
    rationale: string
  }

  evidenceAssessments: Array<{
    evidenceId: string
    status: 'SUPPORTED' | 'PARTIALLY_SUPPORTED' | 'UNVERIFIED' | 'CONFLICTING' | 'INSUFFICIENT_EVIDENCE'
    rationale: string
    supportedFacts: string[]
    unsupportedFacts: string[]
    conflicts: string[]
  }>

  propositionResults: Array<{
    propositionId: string
    status:
      | Exclude<
          EvidenceStatus,
          'NOT_APPLICABLE'
        >
      | 'COUNSEL_REVIEW'
    supportingEvidenceIds: string[]
    conflictingEvidenceIds: string[]
    rationale: string
    missingInformation: string[]
    ambiguities: string[]
  }>

  claimConflicts: Array<{
    claimText: string
    evidenceIds: string[]
    description: string
  }>

  newSafetyFlags: ClaimSafetyFlag[]
}

export type FinalMeritsInput = {
  candidate: Candidate
  criterionResults: CriterionResult[]
  comparableEvidence: ComparableEvidenceAssessment[]
  recognitionSignals: RecognitionSignal[]
  relevantEvidence: Evidence[]
  gaps: Gap[]

  ruleContext: {
    coreStandard: string
    ruleVersion: string
  }
}

export type FinalMeritsOutput = {
  sustainedAcclaim: AssessmentStatus
  recognizedAchievements: AssessmentStatus
  fieldStanding: AssessmentStatus

  recognitionPatterns: Array<{
    description: string
    signalIds: string[]
  }>

  majorAchievements: Array<{
    description: string
    evidenceIds: string[]
  }>

  strengths: string[]
  unresolvedIssues: string[]
  contradictions: string[]
  synthesis: string
}

export type GapGenerationInput = {
  criterionResults: CriterionResult[]
  comparableEvidence: ComparableEvidenceAssessment[]
  finalMerits?: FinalMeritsAssessment
  continueWork?: WorkContinuationAssessment
  usBenefit?: USBenefitAssessment
}

export type GapGenerationOutput = {
  gaps: Array<
    Pick<
      Gap,
      'scope' |
      'targetId' |
      'type' |
      'description'
    >
    & {
      recommendedActions: Array<
        Omit<
          EvidenceAction,
          'id' | 'propositionId'
        >
      >
    }
  >
}

export type AIExecutionRecord = {
  id: string

  operation:
    | 'EXTRACT_CLAIMS'
    | 'MAP_CLAIMS_TO_CRITERIA'
    | 'RECONCILE_EVIDENCE'
    | 'SYNTHESIZE_FINAL_MERITS'
    | 'GENERATE_GAPS'
    | 'GENERATE_GAPS_AND_ACTIONS'

  modelProvider: string
  modelName: string
  promptVersion: string
  ruleVersion: string
  inputReferences: string[]
  outputValidated: boolean
  createdAt: string
}

/** Alternate payload shapes frozen by EB1A_LLM_BOUNDARY_AND_STATE_SPEC. */

export type BoundaryExtractClaimsInput = {
  documentId: string
  documentText: string

  documentMetadata?: {
    fileName?: string
    documentType?: string
    source?: string
  }
}

export type ExtractedClaim = {
  id: string
  text: string
  normalizedText?: string
  claimType?: string
  sourceDocumentId: string

  sourceLocation?: Pick<
    SourceLocator,
    'page' |
    'section' |
    'startOffset' |
    'endOffset'
  >

  ambiguities: string[]
  unsupportedAssertions: string[]
}

export type BoundaryMapClaimInput = {
  candidateClaim: Pick<
    CandidateClaim,
    'id' | 'text'
  >

  criterion: {
    id: string
    title: string
    requirements: string[]
    ruleVersion: string
  }
}

export type ClaimCriterionMapping = {
  criterionId: string

  claimFit:
    | 'NOT_RELEVANT'
    | 'POTENTIAL_MATCH'
    | 'UNCLEAR'

  propositions: Array<{
    id: string
    name: string
    status: PropositionClaimStatus
    rationale?: string
  }>

  ambiguities: string[]
  unsupportedAssertions: string[]
  evidenceNeeded: string[]
}

export type BoundaryReconcileEvidenceInput = {
  proposition: {
    id: string
    criterionId: string
    description: string
  }

  claim?: Pick<
    CandidateClaim,
    'id' | 'text'
  >

  evidence: Array<{
    id: string
    documentId: string
    excerpt?: string
    metadata?: Record<string, unknown>
  }>
}

export type EvidenceReconciliation = {
  propositionId: string

  evidenceAssessments: Array<{
    evidenceId: string

    status: Exclude<
      EvidenceStatus,
      'NOT_APPLICABLE'
    >

    rationale: string
    supportedFacts: string[]
    unsupportedFacts: string[]
    conflicts: string[]
  }>

  overallInterpretation: Exclude<
    EvidenceStatus,
    'NOT_APPLICABLE'
  >
}