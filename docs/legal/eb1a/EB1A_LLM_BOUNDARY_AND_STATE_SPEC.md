# VisaPilot — EB-1A LLM Boundary & Assessment State Specification

## 1. Purpose

This document freezes the boundary between VisaPilot's semantic AI layer and its deterministic assessment engine.

The core invariant is:

> The LLM interprets claims, propositions, evidence, ambiguity, and unstructured language. The deterministic engine owns regulatory rules, state transitions, criterion definitions, evidence states, provenance, and final assessment state.

The LLM must never be treated as the authority that decides whether a candidate qualifies for EB-1A.

---

# 2. Architectural Boundary

```text
Documents / CV
      |
      v
+-----------------------+
| Claim Extraction LLM  |
+-----------+-----------+
            |
            v
     Candidate Claims
            |
            v
+---------------------------+
| Claim/Criterion LLM       |
| Semantic Mapping          |
+-------------+-------------+
              |
              v
      Claim Fit + Propositions
              |
              v
+---------------------------+
| Deterministic Engine      |
| Rules + State Transition  |
+-------------+-------------+
              |
              v
       Criterion Candidate
              |
              v
        Evidence Planning
              |
              v
      Evidence / Documents
              |
              v
+---------------------------+
| Evidence Reconciliation   |
| LLM                       |
+-------------+-------------+
              |
              v
     Evidence Interpretation
              |
              v
+---------------------------+
| Deterministic Engine      |
+-------------+-------------+
              |
              v
 Proposition Results
              |
              v
 Criterion Results
              |
              v
       Gaps / Strategy
              |
              v
        Final Merits
```

The LLM may recommend an interpretation. The deterministic engine decides how that interpretation affects application state.

---

# 3. What the LLM MAY Do

The LLM may:

- extract candidate claims from documents
- normalize natural-language claims
- identify possible criterion matches
- generate criterion-specific propositions
- identify ambiguities
- identify unsupported or suspicious assertions
- interpret evidence against propositions
- identify apparent conflicts between sources
- summarize evidence
- suggest evidence needed to substantiate a proposition
- synthesize final-merits observations from structured inputs
- generate human-readable gap explanations and actions

The LLM may NOT:

- invent evidence
- invent candidate facts
- silently upgrade a claim into verified evidence
- decide that three criteria automatically establish EB-1A eligibility
- create regulatory requirements
- create hard-coded thresholds
- decide that USCIS/counsel will accept evidence
- assign a legal probability of approval
- replace the deterministic regulatory rule set
- erase uncertainty merely to produce a cleaner answer

---

# 4. State Dimensions

VisaPilot must not collapse the assessment into a single score.

There are independent dimensions.

## 4.1 Claim Fit

Describes how the candidate's stated claim relates to a criterion before evidence validation.

```text
NOT_RELEVANT
POTENTIAL_MATCH
UNCLEAR
```

Optional future state:

```text
PARTIAL_MATCH
```

## 4.2 Evidence Status

Describes what available evidence establishes.

```text
SUPPORTED
PARTIALLY_SUPPORTED
INSUFFICIENT_EVIDENCE
UNVERIFIED
CONFLICTING
NOT_SUPPORTED
```

## 4.3 Professional / Legal Uncertainty

```text
COUNSEL_REVIEW
```

This is not a score and does not mean that legal counsel has actually reviewed the case.

It means that the system has identified an issue where professional/legal interpretation or review is appropriate.

---

# 5. Example: C5

C5 concerns original scientific, scholarly, artistic, athletic, or business-related contributions of major significance.

A candidate may submit:

> "I designed a configuration-drift detection platform used across our cloud infrastructure."

The LLM may return:

```json
{
  "criterionId": "EB1A-C5",
  "claimFit": "POTENTIAL_MATCH",
  "propositions": [
    {
      "id": "C5-P1",
      "name": "contribution_identity",
      "status": "SUPPORTED_BY_CLAIM"
    },
    {
      "id": "C5-P2",
      "name": "field_relevance",
      "status": "SUPPORTED_BY_CLAIM"
    },
    {
      "id": "C5-P3",
      "name": "originality",
      "status": "SUPPORTED_BY_CLAIM"
    },
    {
      "id": "C5-P4",
      "name": "major_significance",
      "status": "NOT_ESTABLISHED"
    },
    {
      "id": "C5-P5",
      "name": "candidate_attribution",
      "status": "SUPPORTED_BY_CLAIM"
    }
  ],
  "ambiguities": [],
  "unsupportedAssertions": [],
  "evidenceNeeded": [
    "independent evidence of significance",
    "evidence establishing attribution",
    "evidence demonstrating impact beyond the candidate's immediate team if applicable"
  ]
}
```

The deterministic engine does not simply accept this as a final C5 result.

After evidence is supplied, it may produce:

```text
C5

Claim fit:
  POTENTIAL_MATCH

Proposition results:
  Contribution identity       SUPPORTED
  Field relevance             SUPPORTED
  Originality                 SUPPORTED
  Candidate attribution       PARTIALLY_SUPPORTED
  Major significance          INSUFFICIENT_EVIDENCE

Overall evidence state:
  PARTIALLY_SUPPORTED

Professional review:
  COUNSEL_REVIEW
```

This is the intended model.

---

# 6. LLM Contract: Claim Extraction

Operation:

```text
EXTRACT_CLAIMS
```

### Input

```ts
type ExtractClaimsInput = {
  documentId: string;
  documentText: string;
  documentMetadata?: {
    fileName?: string;
    documentType?: string;
    source?: string;
  };
};
```

### Output

```ts
type ExtractedClaim = {
  id: string;
  text: string;
  normalizedText?: string;
  claimType?: string;
  sourceDocumentId: string;
  sourceLocation?: {
    page?: number;
    section?: string;
    startOffset?: number;
    endOffset?: number;
  };
  ambiguities: string[];
  unsupportedAssertions: string[];
};
```

The source location/provenance must be retained.

---

# 7. LLM Contract: Claim-to-Criterion Mapping

Operation:

```text
MAP_CLAIMS_TO_CRITERIA
```

### Input

```ts
type MapClaimInput = {
  candidateClaim: {
    id: string;
    text: string;
  };
  criterion: {
    id: string;
    title: string;
    requirements: string[];
    ruleVersion: string;
  };
};
```

### Output

```ts
type ClaimCriterionMapping = {
  criterionId: string;
  claimFit: "NOT_RELEVANT" | "POTENTIAL_MATCH" | "UNCLEAR";
  propositions: Array<{
    id: string;
    name: string;
    status:
      | "SUPPORTED_BY_CLAIM"
      | "PARTIALLY_ESTABLISHED"
      | "NOT_ESTABLISHED"
      | "UNCLEAR";
    rationale?: string;
  }>;
  ambiguities: string[];
  unsupportedAssertions: string[];
  evidenceNeeded: string[];
};
```

Important:

`SUPPORTED_BY_CLAIM` means the proposition is present in the candidate's assertion.

It does NOT mean independently verified.

---

# 8. Proposition Model

A proposition is a criterion-specific statement that can later be tested against evidence.

Example:

```text
C5
 |
 +-- P1: contribution exists
 +-- P2: contribution is attributable to candidate
 +-- P3: contribution is original
 +-- P4: contribution is relevant to field
 +-- P5: contribution has major significance
```

Evidence attaches to propositions, not merely to a criterion as a whole.

One evidence item may support multiple propositions.

One proposition may have multiple evidence items.

---

# 9. LLM Contract: Evidence Reconciliation

Operation:

```text
RECONCILE_EVIDENCE
```

### Input

```ts
type ReconcileEvidenceInput = {
  proposition: {
    id: string;
    criterionId: string;
    description: string;
  };
  claim?: {
    id: string;
    text: string;
  };
  evidence: Array<{
    id: string;
    documentId: string;
    excerpt?: string;
    metadata?: Record<string, unknown>;
  }>;
};
```

### Output

```ts
type EvidenceReconciliation = {
  propositionId: string;
  evidenceAssessments: Array<{
    evidenceId: string;
    status:
      | "SUPPORTED"
      | "PARTIALLY_SUPPORTED"
      | "INSUFFICIENT_EVIDENCE"
      | "UNVERIFIED"
      | "CONFLICTING"
      | "NOT_SUPPORTED";
    rationale: string;
    supportedFacts: string[];
    unsupportedFacts: string[];
    conflicts: string[];
  }>;
  overallInterpretation:
    | "SUPPORTED"
    | "PARTIALLY_SUPPORTED"
    | "INSUFFICIENT_EVIDENCE"
    | "UNVERIFIED"
    | "CONFLICTING"
    | "NOT_SUPPORTED";
};
```

The LLM does not directly mutate the application's authoritative state.

The deterministic layer consumes this structured output and applies state-transition rules.

---

# 10. Evidence State Rules

Evidence status must distinguish absence of proof from contradiction.

### INSUFFICIENT_EVIDENCE

Relevant evidence exists or is expected, but the current material does not establish the proposition sufficiently.

### UNVERIFIED

A claim or source may exist, but the system cannot currently verify the underlying information.

### CONFLICTING

Two or more relevant sources contain materially inconsistent information.

### NOT_SUPPORTED

The available evidence does not support the proposition.

### PARTIALLY_SUPPORTED

Some components of the proposition are supported while others remain unresolved.

### SUPPORTED

The available evidence supports the proposition subject to the limitations and scope recorded in provenance.

---

# 11. Deterministic State Transition

The deterministic engine consumes:

```text
Candidate claim
Criterion definition
Propositions
Evidence
Evidence reconciliation
Rule version
Provenance
```

It produces:

```text
Claim fit
Proposition results
Evidence state
Criterion state
Gaps
Counsel-review flags
```

Conceptually:

```text
claim
  |
  v
claimFit
  |
  v
propositions
  |
  +---- no relevant proposition ----> NOT_RELEVANT
  |
  v
evidence planning
  |
  v
evidence
  |
  v
reconciliation
  |
  v
proposition states
  |
  v
criterion state
```

No LLM response may bypass this transition.

---

# 12. Criterion Result

A criterion result should preserve the dimensions instead of producing one opaque score.

```ts
type CriterionResult = {
  criterionId: string;
  claimFit: "NOT_RELEVANT" | "POTENTIAL_MATCH" | "UNCLEAR";
  propositions: Array<{
    propositionId: string;
    status:
      | "SUPPORTED"
      | "PARTIALLY_SUPPORTED"
      | "INSUFFICIENT_EVIDENCE"
      | "UNVERIFIED"
      | "CONFLICTING"
      | "NOT_SUPPORTED";
    evidenceIds: string[];
  }>;
  overallEvidenceStatus:
    | "SUPPORTED"
    | "PARTIALLY_SUPPORTED"
    | "INSUFFICIENT_EVIDENCE"
    | "UNVERIFIED"
    | "CONFLICTING"
    | "NOT_SUPPORTED";
  counselReview: boolean;
  ruleVersion: string;
};
```

The `overallEvidenceStatus` is a summary of the underlying proposition states. It is not a probability or legal conclusion.

---

# 13. Gaps

A gap is derived from an unresolved proposition or requirement.

Examples:

```text
Major significance is not sufficiently established.

Candidate attribution is only partially substantiated.

Independent corroboration is unavailable.

Source cannot currently be verified.

Evidence sources contain conflicting information.
```

A gap must retain provenance to the proposition/criterion that generated it.

```ts
type Gap = {
  id: string;
  criterionId?: string;
  propositionId?: string;
  type:
    | "MISSING_EVIDENCE"
    | "WEAK_EVIDENCE"
    | "UNVERIFIED"
    | "CONFLICT"
    | "AMBIGUITY"
    | "CLAIM_SAFETY";
  description: string;
  sourceIds: string[];
};
```

---

# 14. Evidence Build Actions

A gap can produce an action.

Example:

```text
Gap:
C5-P5 Major significance = INSUFFICIENT_EVIDENCE

Action:
Collect independent evidence demonstrating the contribution's
impact, adoption, recognition, or significance in the field.
```

The action must not promise that a particular document will establish the criterion.

Use:

```text
"strengthen/substantiate the claim"
```

rather than:

```text
"guarantee acceptance"
"make USCIS approve"
"ensure counsel accepts"
```

---

# 15. Final Merits Boundary

Final merits is not:

```text
criteriaPassed >= 3
```

Three criteria may establish the regulatory initial-evidence threshold, but they do not automatically establish extraordinary ability.

The final-merits synthesis may consider:

- sustained acclaim
- recognized achievements
- field standing
- significance of achievements
- independent recognition
- chronology
- consistency
- corroboration
- relevant evidence outside the ten criteria
- unresolved contradictions
- strength of the overall record

The LLM may synthesize structured observations.

The deterministic layer remains responsible for ensuring that the synthesis uses the correct rule version and does not transform it into an unsupported probability or guarantee.

---

# 16. Claim Safety

The system should flag potentially unsupported or high-risk assertions.

Examples:

```text
"one of the world's leading architects"
"top 1% globally"
"used by millions"
"largest migration in Asia"
"industry-leading"
"widely recognized"
```

These are claims, not facts merely because they appear in a CV.

A claim-safety flag may identify:

```text
SUPERLATIVE
UNQUANTIFIED_SCALE
UNSUPPORTED_RECOGNITION
UNSUPPORTED_IMPACT
ATTRIBUTION_AMBIGUITY
SOURCE_MISSING
```

The system should preserve the assertion while making its evidentiary status explicit.

---

# 17. Provenance

Every material conclusion must be traceable.

Minimum chain:

```text
Criterion
   ↓
Proposition
   ↓
Claim
   ↓
Document/source
   ↓
Evidence
   ↓
Evidence interpretation
   ↓
Result
```

Where possible, store:

- document ID
- source URL
- source type
- page/section
- excerpt
- retrieval/access timestamp
- evidence ID
- rule version
- model/provider metadata for AI-generated interpretation

---

# 18. Rule Versioning

Every criterion result must identify the regulatory rule version used.

Example:

```ts
{
  criterionId: "EB1A-C5",
  ruleVersion: "EB1A-2026-01",
  ...
}
```

The LLM receives the rule definition as context.

The LLM must not create or modify the rule.

A rule change should be represented as a new version rather than silently rewriting historical results.

---

# 19. AI Provider Boundary

The application should use an abstraction rather than coupling domain logic to a specific model provider.

```ts
interface AIProvider {
  extractClaims(input: ExtractClaimsInput): Promise<ExtractedClaim[]>;
  mapClaimToCriterion(
    input: MapClaimInput
  ): Promise<ClaimCriterionMapping>;
  reconcileEvidence(
    input: ReconcileEvidenceInput
  ): Promise<EvidenceReconciliation>;
  synthesizeFinalMerits(
    input: FinalMeritsInput
  ): Promise<FinalMeritsOutput>;
  generateGapsAndActions(
    input: GapGenerationInput
  ): Promise<GapGenerationOutput>;
}
```

The rest of VisaPilot should not need to know whether the provider is OpenAI, Anthropic, Gemini, a local model, or another provider.

Provider selection is an infrastructure concern.

---

# 20. What We Implement First

After this specification is frozen, the first Codex task is deliberately narrow.

### Phase 2.1

Implement:

```text
src/types/visa/eb1a.ts
src/data/visa/eb1a/criteria.ts
src/data/visa/eb1a/propositions.ts
src/data/visa/eb1a/rules.ts
```

And any minimal supporting types required by the existing project.

Implement:

- EB-1A domain types
- C1-C10 structured criterion definitions
- criterion propositions
- versioned rule metadata
- assessment state types
- claim/evidence status enums
- provenance types
- LLM contract types

Do NOT implement:

- LLM API calls
- database
- Supabase
- authentication
- document parsing
- PDF processing
- evidence web retrieval
- final UI
- dashboards
- new dependencies unless strictly necessary

Run:

```bash
npm run build
npm run lint
```

Report:

1. files created
2. files modified
3. assumptions
4. specification conflicts
5. build result
6. lint result

Do not proceed to Phase 2.2.

---

# 21. Next Implementation Sequence

After Phase 2.1 passes review:

```text
Phase 2.2
Deterministic claim → criterion engine

Phase 2.3
LLM claim extraction + semantic mapping adapter

Phase 2.4
Evidence ingestion + reconciliation

Phase 2.5
C5 full vertical slice

Phase 2.6
C8 full vertical slice

Phase 2.7
Generalize C1-C10

Phase 2.8
Final merits + continue-work + U.S.-benefit assessment

Phase 2.9
Gap generation + evidence build plan

Phase 2.10
UI integration

Phase 2.11
Persistence / Supabase

Phase 2.12
Dossier / report generation
```

The ordering may be adjusted as implementation reveals dependencies, but the core boundary must remain unchanged.

---

# 22. Non-Negotiable Invariants

1. LLM output is never treated as authoritative legal determination.
2. No invented facts or evidence.
3. Claims and evidence remain separate entities.
4. Evidence attaches to propositions.
5. A claim is not automatically verified evidence.
6. Missing evidence is not automatically equivalent to a failed criterion.
7. Contradiction is not the same as missing evidence.
8. Unverified information remains unverified.
9. Three criteria do not automatically equal extraordinary ability.
10. No hidden universal scoring formula.
11. No USCIS approval probability.
12. No guarantee of counsel acceptance.
13. Regulatory rules are structured and versioned outside the LLM.
14. Every material result retains provenance.
15. Historical assessments must be reproducible against their rule version.
16. Professional/legal uncertainty must remain visible.
17. The system should be able to explain why a result was produced.
18. A future AI provider can be substituted without rewriting the domain engine.

---

# 23. Definition of Done for the Boundary

The boundary is considered frozen when:

- domain state vocabulary is agreed
- LLM operations are explicitly defined
- each operation has structured input/output
- deterministic ownership is explicit
- proposition-level evidence is supported
- provenance requirements are explicit
- claim safety is explicit
- rule versioning is explicit
- final-merits boundary is explicit
- no single AI call can answer "Does this person qualify for EB-1A?"
- the first Codex task can be executed without requiring architectural interpretation

At that point, implementation can begin safely.
