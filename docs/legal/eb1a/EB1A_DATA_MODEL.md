# VisaPilot — EB-1A Data Model

## Purpose

This document translates the EB-1A legal/domain model into structured objects used by VisaPilot.

Core relationship:

`Candidate Claim → Proposition → Evidence → Regulatory Requirement → Assessment`

The model preserves provenance and uncertainty and does not represent immigration-law assessment as an opaque probability.

## 1. Core Entity Graph

```text
Candidate
   │
   ├── Documents
   │      └── Claims
   │             └── Criterion Candidates
   │                    └── Propositions
   │                           └── Evidence
   │
   ├── Recognition Signals
   ├── Criterion Results (C1–C10)
   ├── Comparable Evidence
   ├── Final Merits Assessment
   ├── Continue Work Assessment
   └── U.S. Benefit Assessment
```

## 2. Candidate

```ts
type Candidate = {
  id: string;
  fullName: string;
  fieldOfEndeavor?: string;
  occupation?: string;
  currentRole?: string;
  currentOrganization?: string;
  profileSummary?: string;
  createdAt: string;
  updatedAt: string;
};
```

Occupation, role/title, organization, and field of endeavor are distinct concepts.

## 3. Document

```ts
type Document = {
  id: string;
  candidateId: string;
  documentType:
    | "CV" | "RESUME" | "AWARD" | "MEMBERSHIP" | "PUBLICATION"
    | "JUDGING" | "EMPLOYMENT" | "COMPENSATION" | "EXHIBITION"
    | "MEDIA" | "CONTRIBUTION" | "CONTRACT" | "BUSINESS_PLAN" | "OTHER";
  fileName: string;
  mimeType?: string;
  sourceUri?: string;
  ingestionStatus: "PENDING" | "PROCESSING" | "PROCESSED" | "FAILED";
  createdAt: string;
};
```

## 4. Provenance

Every extracted claim, fact, and evidence item must be traceable to a source.

```ts
type Provenance = {
  documentId?: string;
  sourceType:
    | "UPLOADED_DOCUMENT"
    | "PUBLIC_SOURCE"
    | "CANDIDATE_INPUT"
    | "SYSTEM_RULE"
    | "LLM_INFERENCE";
  locator?: {
    page?: number;
    section?: string;
    paragraph?: string;
    url?: string;
  };
  extractedAt?: string;
};
```

LLM inference must never silently be represented as documentary evidence.

## 5. Candidate Claim

A claim is something asserted by the candidate/profile.

```ts
type CandidateClaim = {
  id: string;
  candidateId: string;
  sourceDocumentId?: string;
  text: string;
  normalizedType?:
    | "AWARD" | "MEMBERSHIP" | "MEDIA" | "JUDGING"
    | "CONTRIBUTION" | "PUBLICATION" | "EXHIBITION"
    | "LEADERSHIP" | "COMPENSATION" | "COMMERCIAL_SUCCESS"
    | "EMPLOYMENT" | "OTHER";
  extractedFacts: Record<string, unknown>;
  criterionCandidates: CriterionCandidate[];
  claimFitStatus:
    | "POTENTIAL_MATCH"
    | "PARTIAL_MATCH"
    | "NOT_A_MATCH"
    | "UNCLEAR";
  claimSafetyFlags: ClaimSafetyFlag[];
  provenance: Provenance[];
  createdAt: string;
};
```

A claim is not evidence.

## 6. Claim Safety

```ts
type ClaimSafetyFlag =
  | "UNSUPPORTED_SUPERLATIVE"
  | "UNQUANTIFIED_IMPACT"
  | "UNVERIFIED_EXTERNAL_RECOGNITION"
  | "UNVERIFIED_STATISTIC"
  | "AMBIGUOUS_ATTRIBUTION"
  | "AMBIGUOUS_ROLE"
  | "AMBIGUOUS_AWARD_STATUS"
  | "POTENTIAL_CONFLICT"
  | "SOURCE_MISSING";
```

Example: “one of the world's leading AI architects” can be flagged as `UNSUPPORTED_SUPERLATIVE`; this does not mean the claim is false.

## 7. Criterion Candidate

Represents semantic mapping between a claim and a criterion.

```ts
type CriterionCandidate = {
  criterionId: string;
  fit: "POTENTIAL_MATCH" | "PARTIAL_MATCH" | "NOT_A_MATCH" | "UNCLEAR";
  rationale: string;
  confidence: "HIGH" | "MEDIUM" | "LOW";
  unresolvedQuestions: string[];
};
```

This is an LLM-assisted semantic layer, not the final criterion result.

## 8. Proposition

A proposition is a specific factual/legal component that must be established.

```ts
type Proposition = {
  id: string;
  requirementId: string;
  statement: string;
  status:
    | "SUPPORTED_BY_CLAIM"
    | "SUPPORTED"
    | "PARTIALLY_SUPPORTED"
    | "INSUFFICIENT_EVIDENCE"
    | "NOT_SUPPORTED"
    | "UNVERIFIED"
    | "CONFLICTING"
    | "NOT_APPLICABLE"
    | "COUNSEL_REVIEW";
  evidenceIds: string[];
  rationale?: string;
  provenance: Provenance[];
};
```

Example C1 propositions:

```text
C1-P1: Candidate received the award.
C1-P2: Award has national/international recognition.
C1-P3: Award recognizes excellence in the candidate's field.
```

## 9. Evidence

Evidence substantiates one or more propositions.

```ts
type Evidence = {
  id: string;
  candidateId: string;
  sourceType:
    | "UPLOADED_DOCUMENT"
    | "PUBLIC_SOURCE"
    | "CANDIDATE_PROVIDED"
    | "THIRD_PARTY"
    | "OTHER";
  sourceLocator?: string;
  title?: string;
  description?: string;
  contentReference?: string;
  verificationStatus:
    | "VERIFIED"
    | "PARTIALLY_VERIFIED"
    | "UNVERIFIED"
    | "CONFLICTING"
    | "NOT_REVIEWED";
  reliabilityContext:
    | "PRIMARY"
    | "SECONDARY"
    | "SELF_ASSERTED"
    | "EMPLOYER"
    | "INDEPENDENT"
    | "UNKNOWN";
  supportsPropositionIds: string[];
  provenance: Provenance[];
  createdAt: string;
};
```

One evidence item can support multiple propositions; one proposition can have multiple evidence items.

## 10. Evidence Status

```ts
type EvidenceStatus =
  | "STRONG"
  | "MODERATE"
  | "WEAK"
  | "MISSING"
  | "UNVERIFIED"
  | "CONFLICTING"
  | "COUNSEL_REVIEW";
```

These are evidence-state labels, not legal probabilities.

## 11. Criterion Definition

```ts
type CriterionDefinition = {
  id: string;
  pathway: "EB1A";
  code:
    | "C1" | "C2" | "C3" | "C4" | "C5"
    | "C6" | "C7" | "C8" | "C9" | "C10";
  title: string;
  regulatoryRequirement: string;
  propositionDefinitions: PropositionDefinition[];
  sourceIds: string[];
  version: string;
  status: "ACTIVE" | "SUPERSEDED" | "UNDER_REVIEW";
};
```

Legal requirements and source citations belong in versioned rule/source data, not arbitrary UI code.

## 12. Criterion Result

```ts
type CriterionResult = {
  criterionId: string;
  claimFit: "NO_MATCH" | "POTENTIAL_MATCH" | "PARTIAL_MATCH" | "UNCLEAR";
  evidenceStatus:
    | "STRONG" | "MODERATE" | "WEAK" | "MISSING"
    | "UNVERIFIED" | "CONFLICTING" | "COUNSEL_REVIEW";
  propositionResults: PropositionResult[];
  supportingEvidenceIds: string[];
  gaps: string[];
  evidenceActions: EvidenceAction[];
  overallStatus:
    | "SUPPORTED_FOR_REVIEW"
    | "PARTIALLY_SUPPORTED"
    | "INSUFFICIENT_EVIDENCE"
    | "NOT_SUPPORTED"
    | "UNVERIFIED"
    | "CONFLICTING"
    | "COUNSEL_REVIEW";
  rationale: string;
  ruleVersion: string;
  provenance: Provenance[];
};
```

A criterion result is explainable rather than a single opaque score.

## 13. Proposition Result

```ts
type PropositionResult = {
  propositionId: string;
  status:
    | "SUPPORTED"
    | "PARTIALLY_SUPPORTED"
    | "INSUFFICIENT_EVIDENCE"
    | "NOT_SUPPORTED"
    | "UNVERIFIED"
    | "CONFLICTING"
    | "NOT_APPLICABLE"
    | "COUNSEL_REVIEW";
  evidenceIds: string[];
  rationale: string;
  missingInformation: string[];
};
```

## 14. Evidence Action

```ts
type EvidenceAction = {
  id: string;
  propositionId: string;
  actionType:
    | "UPLOAD_DOCUMENT"
    | "PROVIDE_SOURCE"
    | "PROVIDE_CONTEXT"
    | "VERIFY_FACT"
    | "OBTAIN_INDEPENDENT_CORROBORATION"
    | "CLARIFY_CLAIM"
    | "COUNSEL_REVIEW";
  description: string;
  priority: "HIGH" | "MEDIUM" | "LOW";
};
```

These are evidence-building recommendations, not guarantees of legal acceptance.

## 15. Recognition Signal

Recognition signals help the final-merits/totality layer identify patterns across the record.

```ts
type RecognitionSignal = {
  id: string;
  candidateId: string;
  signalType:
    | "AWARD"
    | "MEDIA_COVERAGE"
    | "JUDGING"
    | "EXPERT_RECOGNITION"
    | "INDUSTRY_ADOPTION"
    | "INDEPENDENT_CITATION"
    | "PROFESSIONAL_SELECTION"
    | "LEADERSHIP_RECOGNITION"
    | "CONFERENCE_INVITATION"
    | "OTHER";
  date?: string;
  field?: string;
  scope: "LOCAL" | "REGIONAL" | "NATIONAL" | "INTERNATIONAL" | "UNKNOWN";
  independence:
    | "INDEPENDENT"
    | "EMPLOYER"
    | "SELF_ASSERTED"
    | "PEER"
    | "INDUSTRY_BODY"
    | "MEDIA"
    | "GOVERNMENT"
    | "UNKNOWN";
  description: string;
  evidenceIds: string[];
  provenance: Provenance[];
};
```

Recognition signals are not themselves legal criteria.

## 16. Comparable Evidence Assessment

```ts
type ComparableEvidenceAssessment = {
  criterionId: string;
  occupationApplicability:
    | "READILY_APPLICABLE"
    | "NOT_READILY_APPLICABLE"
    | "UNCLEAR";
  applicabilityRationale: string;
  candidateExplanation?: string;
  proposedEvidence?: {
    description: string;
    comparability: "COMPARABLE" | "NOT_COMPARABLE" | "UNCLEAR";
    rationale?: string;
    evidenceIds: string[];
  };
  status:
    | "NOT_NEEDED"
    | "POTENTIAL_COMPARABLE"
    | "COMPARABILITY_UNCLEAR"
    | "COMPARABLE_BASIS_UNSUPPORTED"
    | "SUPPORTED_FOR_REVIEW"
    | "COUNSEL_REVIEW";
  provenance: Provenance[];
};
```

Comparable evidence is not an automatic fallback merely because ordinary criterion evidence is weak.

## 17. Final Merits Assessment

```ts
type FinalMeritsAssessment = {
  candidateId: string;
  sustainedAcclaim:
    | "SUPPORTED_FOR_REVIEW"
    | "PARTIALLY_SUPPORTED"
    | "INSUFFICIENT_EVIDENCE"
    | "UNVERIFIED"
    | "CONFLICTING"
    | "COUNSEL_REVIEW";
  recognizedAchievements:
    | "SUPPORTED_FOR_REVIEW"
    | "PARTIALLY_SUPPORTED"
    | "INSUFFICIENT_EVIDENCE"
    | "UNVERIFIED"
    | "CONFLICTING"
    | "COUNSEL_REVIEW";
  fieldStanding:
    | "SUPPORTED_FOR_REVIEW"
    | "PARTIALLY_SUPPORTED"
    | "INSUFFICIENT_EVIDENCE"
    | "UNVERIFIED"
    | "CONFLICTING"
    | "COUNSEL_REVIEW";
  recognitionSignals: string[];
  majorAchievements: string[];
  strengths: string[];
  unresolvedIssues: string[];
  contradictions: string[];
  synthesis: string;
  evidenceIds: string[];
  provenance: Provenance[];
};
```

No `eligibilityProbability` belongs here.

## 18. Continue Work Assessment

```ts
type WorkContinuationAssessment = {
  candidateId: string;
  currentField?: string;
  proposedUSWork?: string;
  relationshipToExpertise: "DIRECT" | "RELATED" | "UNCLEAR" | "NOT_ESTABLISHED";
  evidenceStatus:
    | "SUPPORTED_FOR_REVIEW"
    | "PARTIALLY_SUPPORTED"
    | "INSUFFICIENT_EVIDENCE"
    | "UNVERIFIED"
    | "COUNSEL_REVIEW";
  evidenceIds: string[];
  gaps: string[];
  rationale: string;
};
```

## 19. U.S. Benefit Assessment

```ts
type USBenefitAssessment = {
  candidateId: string;
  proposedActivities: string[];
  claimedBenefitAreas: string[];
  supportingEvidenceIds: string[];
  status:
    | "SUPPORTED_FOR_REVIEW"
    | "PARTIALLY_SUPPORTED"
    | "INSUFFICIENT_EVIDENCE"
    | "UNVERIFIED"
    | "COUNSEL_REVIEW";
  gaps: string[];
  rationale: string;
  provenance: Provenance[];
};
```

This assesses the documentary record and does not predict USCIS adjudication.

## 20. Gap

```ts
type Gap = {
  id: string;
  scope:
    | "CLAIM"
    | "PROPOSITION"
    | "CRITERION"
    | "COMPARABLE_EVIDENCE"
    | "FINAL_MERITS"
    | "CONTINUE_WORK"
    | "US_BENEFIT";
  targetId: string;
  type:
    | "MISSING_EVIDENCE"
    | "WEAK_EVIDENCE"
    | "UNVERIFIED"
    | "CONFLICTING"
    | "AMBIGUOUS_CLAIM"
    | "MISSING_CONTEXT"
    | "COUNSEL_REVIEW";
  description: string;
  recommendedActions: string[];
  priority: "HIGH" | "MEDIUM" | "LOW";
};
```

## 21. EB-1A Assessment State

```ts
type EB1AAssessmentState = {
  candidate: Candidate;
  documents: Document[];
  claims: CandidateClaim[];
  evidence: Evidence[];
  criterionDefinitions: CriterionDefinition[];
  criterionResults: CriterionResult[];
  comparableEvidence: ComparableEvidenceAssessment[];
  recognitionSignals: RecognitionSignal[];
  finalMerits?: FinalMeritsAssessment;
  continueWork?: WorkContinuationAssessment;
  usBenefit?: USBenefitAssessment;
  gaps: Gap[];
  ruleVersion: string;
  lastUpdated: string;
};
```

## 22. LLM vs Deterministic Ownership

### LLM may perform

- document semantic extraction
- claim extraction
- fact normalization
- semantic criterion matching
- proposition interpretation
- ambiguity detection
- conflict identification
- evidence-to-proposition semantic matching
- recognition-pattern synthesis
- final-merits narrative synthesis
- gap explanation
- evidence-action drafting
- roadmap/dossier prose generation

### Deterministic engine owns

- regulatory source definitions
- criterion definitions
- proposition structure
- rule versions
- assessment state transitions
- provenance requirements
- relationship validation
- pathway structure
- persistence
- schema validation
- regulatory rule existence
- status validation

### LLM must not independently decide

- what the law requires
- that three criteria automatically establish EB-1A
- that a candidate is legally eligible
- that an unsupported claim is true
- that a source is legally sufficient merely because it sounds persuasive
- that comparable evidence automatically applies
- that evidence guarantees USCIS or counsel acceptance

## 23. Minimum Traceability

Every substantive assessment statement should be traceable:

```text
Assessment conclusion
        ↓
Requirement / criterion
        ↓
Proposition
        ↓
Evidence
        ↓
Source
```

If the chain cannot be established, the system should expose uncertainty rather than invent support.

## 24. Example C5 Chain

```text
Candidate Claim
"I designed an AI infrastructure platform
that reduced cloud costs by 40%."
        ↓
Claim type = CONTRIBUTION
        ↓
C5 = POTENTIAL_MATCH
        ↓
Propositions
  specific contribution
  candidate attribution
  originality
  field relevance
  significance
        ↓
Evidence
  architecture document
  performance report
  independent corroboration
        ↓
Proposition Results
  attribution = SUPPORTED
  originality = PARTIAL
  field relevance = SUPPORTED
  significance = INSUFFICIENT_EVIDENCE
        ↓
C5 = PARTIALLY_SUPPORTED
        ↓
Gap = independent evidence of major significance
```

## 25. Explicit Non-Goals

The model does not contain:

- automatic legal eligibility percentages
- USCIS approval probabilities
- hardcoded salary thresholds
- hardcoded prestige lists
- hardcoded occupational comparable-evidence rules
- automatic acceptance of recommendation letters
- automatic acceptance of awards
- automatic acceptance of superlatives
- LLM-generated legal requirements
- automatic conclusion that three criteria equals approval
- automatic conclusion that missing evidence means a criterion legally fails

## 26. Implementation Sequence

```text
EB1A_DATA_MODEL.md
        ↓
EB1A_EVALUATION_MODEL.md
        ↓
EB1A_LLM_CONTRACT.md
        ↓
TypeScript domain types
        ↓
Deterministic EB-1A rule data
        ↓
Claim → criterion engine
        ↓
Evidence reconciliation
        ↓
Final-merits synthesis
        ↓
UI
```

No Codex implementation should start until the evaluation and LLM contracts are frozen.
