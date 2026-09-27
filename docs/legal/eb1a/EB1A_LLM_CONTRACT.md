# VisaPilot — EB-1A LLM Contract

## 1. Purpose

This document defines the exact boundary between VisaPilot's deterministic domain/rule engine and its LLM-powered semantic intelligence.

The central principle is:

```text
DETERMINISTIC SYSTEM
    owns the law, schema, state, provenance and rules

LLM
    interprets language and evidence inside those boundaries
```

The LLM is an interpretation component, not the authoritative source of immigration law.

---

# 2. LLM Responsibilities

The LLM may perform the following tasks:

1. document semantic extraction;
2. candidate-claim extraction;
3. fact normalization;
4. claim classification;
5. claim-to-criterion semantic mapping;
6. proposition interpretation;
7. evidence-to-proposition semantic matching;
8. ambiguity detection;
9. conflict identification;
10. claim-safety detection;
11. recognition-pattern synthesis;
12. final-merits narrative synthesis;
13. gap explanation;
14. evidence-action drafting;
15. roadmap/dossier prose generation.

The LLM must return structured output wherever the result is consumed by application logic.

---

# 3. LLM Does Not Own the Regulatory Model

The LLM must never be treated as the source of:

- EB-1A requirements;
- C1-C10 definitions;
- comparable-evidence rules;
- final-merits legal standards;
- continued-work requirements;
- U.S.-benefit requirements;
- regulatory citations;
- rule versions.

These come from VisaPilot's structured, versioned regulatory data.

Conceptually:

```text
Regulatory Source
      ↓
Structured Rule
      ↓
Deterministic Engine
      ↓
LLM receives rule context
```

Not:

```text
LLM
 ↓
"What does EB-1A law require?"
 ↓
Application logic
```

---

# 4. Universal LLM Rules

Every LLM call used by VisaPilot must follow these principles.

## 4.1 No invented facts

The model must not create:

- awards;
- publications;
- organizations;
- statistics;
- dates;
- citations;
- evidence;
- source URLs;
- candidate achievements.

If a fact is not present in the supplied input, it must be represented as unknown or missing.

## 4.2 No invented evidence

The model must never claim that a document supports something unless the supplied document/source actually provides support.

## 4.3 Preserve uncertainty

The model must be able to return:

```text
UNKNOWN
UNCLEAR
INSUFFICIENT_EVIDENCE
UNVERIFIED
CONFLICTING
COUNSEL_REVIEW
```

rather than forcing a positive/negative answer.

## 4.4 Distinguish assertion from verification

The model must distinguish:

```text
candidate says X
```

from:

```text
evidence establishes X
```

## 4.5 Preserve provenance

Every extracted or inferred item should identify its source document and locator where available.

## 4.6 No legal guarantee language

The model must not produce statements such as:

> "USCIS will approve this."

or:

> "This guarantees EB-1A eligibility."

Preferred language:

> "The current record supports this proposition for professional/legal review."

---

# 5. LLM Call Types

VisaPilot initially needs five principal LLM operations.

```text
1. EXTRACT_CLAIMS
2. MAP_CLAIMS_TO_CRITERIA
3. RECONCILE_EVIDENCE
4. SYNTHESIZE_FINAL_MERITS
5. GENERATE_GAPS_AND_ACTIONS
```

Roadmap/dossier generation can later use the structured assessment state rather than directly re-reading raw documents.

---

# 6. Call 1 — EXTRACT_CLAIMS

## Purpose

Convert unstructured profile documents into candidate claims and normalized facts.

## Input

```ts
type ExtractClaimsInput = {
  document: {
    id: string;
    type: string;
    text: string;
  };

  candidateContext?: {
    fullName?: string;
    fieldOfEndeavor?: string;
    occupation?: string;
  };
};
```

## LLM must identify

- substantive achievements;
- awards;
- memberships;
- publications;
- judging;
- contributions;
- exhibitions;
- leadership/critical roles;
- compensation;
- commercial success;
- employment;
- proposed work;
- other potentially relevant recognition.

## Output

```ts
type ExtractClaimsOutput = {
  claims: {
    text: string;

    normalizedType:
      | "AWARD"
      | "MEMBERSHIP"
      | "MEDIA"
      | "JUDGING"
      | "CONTRIBUTION"
      | "PUBLICATION"
      | "EXHIBITION"
      | "LEADERSHIP"
      | "COMPENSATION"
      | "COMMERCIAL_SUCCESS"
      | "EMPLOYMENT"
      | "OTHER";

    extractedFacts: Record<string, unknown>;

    sourceLocator?: {
      page?: number;
      section?: string;
      paragraph?: string;
    };

    ambiguities: string[];

    safetyFlags: string[];
  }[];
};
```

## Important constraint

The LLM should extract what the document says.

It should not determine whether the claim is legally sufficient at this stage.

---

# 7. Call 2 — MAP_CLAIMS_TO_CRITERIA

## Purpose

Determine whether a candidate claim potentially corresponds to one or more EB-1A criteria.

## Input

```ts
type MapClaimInput = {
  claim: CandidateClaim;

  criteria: {
    id: string;
    code: string;
    title: string;
    regulatoryRequirement: string;
    propositionDefinitions: {
      id: string;
      statement: string;
    }[];
  }[];

  candidateContext: {
    fieldOfEndeavor?: string;
    occupation?: string;
    role?: string;
  };
};
```

The criteria supplied to the LLM must come from VisaPilot's versioned rule data.

## Output

```ts
type MapClaimOutput = {
  mappings: {
    criterionId: string;

    fit:
      | "POTENTIAL_MATCH"
      | "PARTIAL_MATCH"
      | "NOT_A_MATCH"
      | "UNCLEAR";

    rationale: string;

    confidence:
      | "HIGH"
      | "MEDIUM"
      | "LOW";

    propositionAssessments: {
      propositionId: string;

      status:
        | "SUPPORTED_BY_CLAIM"
        | "NOT_ESTABLISHED"
        | "UNCLEAR";

      rationale: string;
    }[];

    unresolvedQuestions: string[];
  }[];
};
```

## Example

Input:

> "Reviewed 12 papers for an IEEE conference."

Expected conceptual output:

```text
C4 → POTENTIAL_MATCH

participation/judging activity → SUPPORTED_BY_CLAIM
field relationship → potentially supported
actual completed judging → requires evidence
```

The LLM must not return:

```text
"C4 = legally satisfied"
```

---

# 8. Call 3 — RECONCILE_EVIDENCE

## Purpose

Determine how supplied evidence relates to existing claims and propositions.

This is the most important evidence-layer LLM operation.

## Input

```ts
type ReconcileEvidenceInput = {
  claim: CandidateClaim;

  criterion: {
    id: string;
    code: string;
    title: string;
    regulatoryRequirement: string;
  };

  propositions: {
    id: string;
    statement: string;
  }[];

  evidence: {
    id: string;
    title?: string;
    content: string;
    sourceType: string;
    provenance: Provenance[];
  }[];
};
```

## Output

```ts
type ReconcileEvidenceOutput = {
  propositionResults: {
    propositionId: string;

    status:
      | "SUPPORTED"
      | "PARTIALLY_SUPPORTED"
      | "INSUFFICIENT_EVIDENCE"
      | "NOT_SUPPORTED"
      | "UNVERIFIED"
      | "CONFLICTING"
      | "COUNSEL_REVIEW";

    supportingEvidenceIds: string[];

    conflictingEvidenceIds: string[];

    rationale: string;

    missingInformation: string[];

    ambiguities: string[];
  }[];

  claimConflicts: {
    claimText: string;
    evidenceIds: string[];
    description: string;
  }[];

  newSafetyFlags: string[];
};
```

---

# 9. Evidence Reconciliation Rules

The LLM must distinguish:

### Supported

Evidence affirmatively supports the proposition.

### Partially supported

Evidence supports part of the proposition but not all relevant aspects.

### Insufficient evidence

The claim may be plausible, but supplied evidence does not establish the proposition.

### Not supported

The supplied evidence does not support the proposition.

### Unverified

The relevant external fact/source could not be adequately verified.

### Conflicting

Material evidence contradicts another source.

### Counsel review

The issue requires legal/professional interpretation beyond the system's safe boundary.

---

# 10. Example — C1 Conflict

Candidate claim:

> "I received the Global Innovation Award."

Evidence A:

> Candidate CV.

Evidence B:

> Award organization page listing the employer as recipient.

LLM output should identify:

```text
C1-P1:
CONFLICTING

Conflict:
CV identifies candidate as recipient.
Public award source identifies organization as recipient.
```

It must not silently select the CV or public source.

---

# 11. Example — C5 Semantic Reconciliation

Candidate claim:

> "Designed an AI infrastructure platform used globally and reduced costs by 40%."

Evidence:

- internal architecture document;
- internal performance report.

The LLM may identify:

```text
Specific contribution:
SUPPORTED

Candidate attribution:
SUPPORTED

40% reduction:
SUPPORTED BY INTERNAL SOURCE

Global use:
NOT ESTABLISHED / INSUFFICIENT EVIDENCE

Major significance:
INSUFFICIENT EVIDENCE
```

The model must not infer:

> "Global use = major significance."

Those are different propositions.

---

# 12. Call 4 — SYNTHESIZE_FINAL_MERITS

## Purpose

Produce an evidence-grounded synthesis of the overall record after criterion/evidence analysis.

## Input

The LLM receives structured, already-validated inputs:

```ts
type FinalMeritsInput = {
  candidate: Candidate;

  criterionResults: CriterionResult[];

  comparableEvidence: ComparableEvidenceAssessment[];

  recognitionSignals: RecognitionSignal[];

  relevantEvidence: Evidence[];

  gaps: Gap[];

  ruleContext: {
    coreStandard: string;
    ruleVersion: string;
  };
};
```

The LLM should not receive unrestricted authority to redefine the legal framework.

## Output

```ts
type FinalMeritsOutput = {
  sustainedAcclaim: AssessmentStatus;
  recognizedAchievements: AssessmentStatus;
  fieldStanding: AssessmentStatus;

  recognitionPatterns: {
    description: string;
    signalIds: string[];
  }[];

  majorAchievements: {
    description: string;
    evidenceIds: string[];
  }[];

  strengths: string[];

  unresolvedIssues: string[];

  contradictions: string[];

  synthesis: string;
};
```

## Required behavior

The synthesis must:

- cite structured evidence IDs internally;
- distinguish independent from self-asserted material;
- consider chronology;
- identify corroboration;
- identify conflicts;
- preserve uncertainty;
- avoid inventing field-wide recognition;
- avoid converting the record into an approval probability.

---

# 13. Final-Merits Prompt Boundary

The LLM may be asked:

> "What patterns does the supplied record show regarding recognition, acclaim, major achievements, and field standing?"

It should not be asked:

> "Decide whether USCIS will approve the petition."

The first is evidence synthesis.

The second attempts to turn the model into an adjudicator.

---

# 14. Call 5 — GENERATE_GAPS_AND_ACTIONS

## Purpose

Turn unresolved propositions into useful, specific evidence-building actions.

## Input

```ts
type GapGenerationInput = {
  criterionResults: CriterionResult[];
  comparableEvidence: ComparableEvidenceAssessment[];
  finalMerits?: FinalMeritsAssessment;
  continueWork?: WorkContinuationAssessment;
  usBenefit?: USBenefitAssessment;
};
```

## Output

```ts
type GapGenerationOutput = {
  gaps: {
    scope: string;
    targetId: string;
    type: string;
    description: string;
    recommendedActions: {
      actionType: string;
      description: string;
      priority: "HIGH" | "MEDIUM" | "LOW";
    }[];
  }[];
};
```

The LLM should produce specific actions.

Bad:

> "Need more evidence."

Better:

> "The current record documents internal adoption but does not independently substantiate the claimed field-wide significance. Consider identifying independent adoption, industry recognition, or other corroborating material."

---

# 15. Evidence Retrieval / Public Sources

If VisaPilot later retrieves public material, the LLM may interpret supplied source content.

The system must preserve:

```text
source URL
source title
retrieval timestamp
source content/reference
```

If a source cannot be retrieved or verified:

```text
UNVERIFIED
```

must be used.

The LLM must never reconstruct a supposedly retrieved article from memory.

---

# 16. Publication Resolution

For publication-related claims, the system may provide:

```text
DOI
publisher URL
article ID
publication URL
title
author
date
```

The LLM may help match the candidate's claim to the source.

The deterministic system preserves the identifier and provenance.

If identity cannot be established:

```text
UNVERIFIED
```

rather than inventing a match.

---

# 17. Comparable Evidence LLM Contract

The LLM may assist with semantic analysis of:

```text
occupation
+
criterion
+
candidate's explanation
+
occupation-specific evidence
+
proposed alternative evidence
```

It may return:

```ts
type ComparableEvidenceLLMOutput = {
  occupationApplicability:
    | "READILY_APPLICABLE"
    | "POTENTIALLY_NOT_READILY_APPLICABLE"
    | "UNCLEAR";

  rationale: string;

  proposedEvidenceAnalysis?: {
    evidenceIds: string[];
    comparability:
      | "POTENTIALLY_COMPARABLE"
      | "NOT_COMPARABLE"
      | "UNCLEAR";
    rationale: string;
  };

  missingInformation: string[];
};
```

The deterministic system must not automatically turn:

```text
POTENTIALLY_NOT_READILY_APPLICABLE
```

into:

```text
COMPARABLE_EVIDENCE_ACCEPTED
```

---

# 18. Claim Safety LLM Contract

The LLM should flag claims such as:

```text
"world's leading"
"top 1%"
"largest"
"millions of users"
"industry defining"
"revolutionary"
"internationally renowned"
```

where supporting context is absent.

Output:

```ts
type ClaimSafetyOutput = {
  flags: {
    type:
      | "UNSUPPORTED_SUPERLATIVE"
      | "UNQUANTIFIED_IMPACT"
      | "UNVERIFIED_EXTERNAL_RECOGNITION"
      | "UNVERIFIED_STATISTIC"
      | "AMBIGUOUS_ATTRIBUTION"
      | "AMBIGUOUS_ROLE"
      | "AMBIGUOUS_AWARD_STATUS"
      | "POTENTIAL_CONFLICT"
      | "SOURCE_MISSING";

    claimText: string;
    explanation: string;
  }[];
};
```

---

# 19. Prompt Construction

Prompts should be assembled from structured components rather than one giant static prompt.

Conceptually:

```text
SYSTEM INSTRUCTIONS
        +
TASK CONTRACT
        +
REGULATORY CONTEXT
        +
CANDIDATE CONTEXT
        +
CLAIM / EVIDENCE
        +
OUTPUT SCHEMA
```

The regulatory context comes from the versioned rule registry.

---

# 20. Context Minimization

Do not send the entire candidate record to every LLM call.

For a C4 claim, send:

```text
C4 rule
+
relevant claim
+
relevant candidate field
+
relevant evidence
```

not:

```text
entire CV
+
all 10 criteria
+
all documents
+
entire assessment
```

This reduces:

- token cost;
- irrelevant context;
- hallucination opportunities;
- latency.

---

# 21. Structured Output Requirement

Every LLM call used by application logic must return schema-constrained structured data.

The application should validate:

```text
JSON syntax
↓
Schema
↓
Domain IDs
↓
Allowed enums
↓
Provenance
↓
Relationship validity
```

Only validated output may update assessment state.

---

# 22. Unknown / Null Handling

The LLM must use explicit unknown states.

Examples:

```json
{
  "awardRecognition": "UNKNOWN"
}
```

not:

```json
{
  "awardRecognition": "INTERNATIONAL"
}
```

when the source does not establish the geographic scope.

Likewise:

```text
date = null
```

is preferable to inventing a date.

---

# 23. Hallucination Controls

The application should reject or flag outputs when the LLM:

1. references an evidence ID not supplied;
2. references an unknown criterion;
3. creates a source URL not present in input;
4. invents a regulatory requirement;
5. creates facts absent from supplied material;
6. claims verification without a verification source;
7. returns an invalid enum;
8. returns malformed JSON.

---

# 24. Retry Policy

For malformed or schema-invalid output:

```text
First failure
    ↓
Validation error feedback
    ↓
Retry same task

Second failure
    ↓
Fallback / human-visible error state
```

Do not repeatedly retry indefinitely.

A failed LLM call must not destroy the existing assessment state.

---

# 25. Model/Provider Abstraction

The application should not hardcode business logic to one model provider.

Conceptual interface:

```ts
interface AIProvider {
  extractClaims(input: ExtractClaimsInput): Promise<ExtractClaimsOutput>;

  mapClaimsToCriteria(
    input: MapClaimInput
  ): Promise<MapClaimOutput>;

  reconcileEvidence(
    input: ReconcileEvidenceInput
  ): Promise<ReconcileEvidenceOutput>;

  synthesizeFinalMerits(
    input: FinalMeritsInput
  ): Promise<FinalMeritsOutput>;

  generateGaps(
    input: GapGenerationInput
  ): Promise<GapGenerationOutput>;
}
```

The initial implementation may use one provider.

The rest of VisaPilot should not depend directly on that provider's SDK.

---

# 26. Temperature / Determinism

For structured extraction and reconciliation, prioritize deterministic behavior and schema adherence.

Conceptually:

```text
Extraction:
low variability

Criterion mapping:
low variability

Evidence reconciliation:
low variability

Final-merits prose:
slightly more expressive, but still constrained
```

Exact provider-specific temperature settings should be isolated inside the AI adapter rather than scattered through the application.

---

# 27. LLM Output Is Not Authoritative State

The correct flow is:

```text
LLM output
   ↓
Schema validation
   ↓
Domain validation
   ↓
Provenance validation
   ↓
Deterministic state transition
   ↓
AssessmentState
```

Not:

```text
LLM output
   ↓
database
```

---

# 28. Auditability

For important LLM operations, store enough metadata to reproduce/debug the decision:

```ts
type AIExecutionRecord = {
  id: string;
  operation:
    | "EXTRACT_CLAIMS"
    | "MAP_CLAIMS_TO_CRITERIA"
    | "RECONCILE_EVIDENCE"
    | "SYNTHESIZE_FINAL_MERITS"
    | "GENERATE_GAPS";

  modelProvider: string;
  modelName: string;
  promptVersion: string;
  ruleVersion: string;

  inputReferences: string[];

  outputValidated: boolean;

  createdAt: string;
};
```

Raw prompts/responses should be handled according to the application's privacy/security requirements.

---

# 29. Privacy Boundary

Candidate documents may contain sensitive personal and professional information.

The application should:

- send only the minimum necessary context to the LLM;
- keep provider credentials server-side;
- avoid exposing API keys in browser code;
- avoid logging raw documents unnecessarily;
- avoid putting sensitive candidate content into ordinary application logs;
- provide a clear data-retention strategy before production use.

---

# 30. Security Boundary

The browser must never contain an unrestricted AI-provider secret.

Architecture:

```text
Browser
   ↓
Cloudflare Pages / Functions
   ↓
AI Provider
```

The server-side function controls:

- authentication/authorization where implemented;
- request validation;
- prompt construction;
- provider credentials;
- response validation;
- rate limiting where appropriate.

---

# 31. What the LLM Can Say

Good:

> "The supplied evidence supports the candidate's authorship, but the current record does not establish that the publication is a qualifying publication type."

Good:

> "The CV claims international recognition, but no independent source establishing the scope of recognition was supplied."

Good:

> "The contribution is documented, while evidence of major significance beyond the employer remains limited."

---

# 32. What the LLM Must Not Say

Bad:

> "The candidate definitely qualifies for EB-1A."

Bad:

> "USCIS will accept this evidence."

Bad:

> "IEEE membership automatically satisfies C2."

Bad:

> "Three criteria means approval."

Bad:

> "This award is internationally recognized" when the supplied material does not establish that fact.

Bad:

> "The candidate is in the top 1% of the field" based only on a CV assertion.

---

# 33. Complete AI Architecture

```text
                   VISA PILOT
                       │
             ┌─────────┴─────────┐
             │                   │
       DETERMINISTIC          LLM LAYER
          DOMAIN                │
             │          ┌───────┼────────┐
             │          ▼       ▼        ▼
       Regulatory     Extract  Map     Reconcile
          Rules       Claims  Criteria  Evidence
             │                           │
             └──────────────┬────────────┘
                            ▼
                     Assessment State
                            │
                  ┌─────────┴─────────┐
                  ▼                   ▼
             Deterministic        LLM
             aggregation       synthesis
                  │                   │
                  └─────────┬─────────┘
                            ▼
                     Gaps / Roadmap
                            │
                            ▼
                         Dossier
```

---

# 34. Non-Negotiable Architecture Rule

The following invariant should be enforced throughout implementation:

> **The LLM may interpret the record, but it may not redefine the rules against which the record is evaluated.**

A second invariant:

> **No substantive conclusion should lose its provenance when moving from LLM output into AssessmentState.**

A third:

> **No candidate claim should silently become verified evidence.**

---

# 35. Implementation Readiness

With this document, the EB-1A design layer is complete enough to begin implementation.

The design sequence is now:

```text
EB1A_MASTER_REQUIREMENTS.md       ✓
EB1A_DATA_MODEL.md                ✓
EB1A_EVALUATION_MODEL.md          ✓
EB1A_LLM_CONTRACT.md              ✓

          ↓
IMPLEMENTATION
```

The first implementation task should be deliberately small:

```text
Create the TypeScript domain types and
versioned EB-1A rule data.

Do not implement the LLM provider.
Do not implement the database.
Do not redesign the UI.
Do not build the entire assessment engine.
```

After those types compile and pass tests, the next controlled step is the deterministic claim-to-criterion engine.

This keeps the implementation aligned with the domain model and avoids spending Codex budget on speculative architecture.
