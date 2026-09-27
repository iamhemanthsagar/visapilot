# VisaPilot — EB-1A Evaluation Model

## 1. Purpose

This document defines how VisaPilot evaluates an EB-1A profile from initial profile intelligence through evidence validation and overall assessment.

It is the operational companion to:

- `EB1A_MASTER_REQUIREMENTS.md`
- `EB1A_DATA_MODEL.md`

The central principle is:

```text
CLAIM → PROPOSITION → EVIDENCE → REGULATORY REQUIREMENT → ASSESSMENT
```

The system deliberately separates:

1. **profile intelligence** — what the candidate claims and what those claims potentially relate to;
2. **evidence validation** — what can currently be substantiated;
3. **overall synthesis** — what the complete record indicates across the EB-1A framework.

VisaPilot does not treat an initial claim as verified evidence and does not convert the framework into an opaque legal probability.

---

# 2. Overall Evaluation Pipeline

```text
Candidate Profile / Documents
          │
          ▼
     Document Ingestion
          │
          ▼
     Claim Extraction
          │
          ▼
  Claim Normalization + Safety
          │
          ▼
 Claim → Criterion Mapping
          │
          ▼
 Proposition Generation
          │
          ▼
 PASS 1: Profile Intelligence
          │
          ├───────────────┐
          │               │
          ▼               ▼
      Potential       Not Relevant /
      Criterion       Unclear
       Matches
          │
          ▼
     Evidence Plan
          │
          ▼
 PASS 2: Evidence Validation
          │
          ▼
 Evidence → Proposition Reconciliation
          │
          ▼
      Criterion Results
          │
          ├───────────────┐
          ▼               ▼
 Comparable Evidence   Recognition Signals
          │               │
          └───────┬───────┘
                  ▼
       Final Merits / Totality
                  │
          ┌───────┴────────┐
          ▼                ▼
   Continue Work       U.S. Benefit
          │                │
          └───────┬────────┘
                  ▼
             Gap Engine
                  │
                  ▼
          Strategy / Roadmap
                  │
                  ▼
               Dossier
```

---

# 3. Pass 1 — Profile Intelligence

## Objective

Determine which parts of the candidate's profile potentially correspond to EB-1A requirements.

Pass 1 is **not evidence adjudication**.

The system asks:

> "Does this claim contain information that could potentially map to this requirement?"

It does not yet ask:

> "Has the candidate proved this?"

---

# 4. Step 1 — Document Ingestion

Input may include:

- CV/resume;
- profile documents;
- candidate-provided supporting documents;
- later evidence documents.

The ingestion layer should:

1. preserve the original document;
2. extract text;
3. preserve page/section provenance where possible;
4. identify document type;
5. create a stable document ID.

Output:

```text
Document[]
```

No legal conclusion is made during raw document extraction.

---

# 5. Step 2 — Claim Extraction

The extraction layer identifies substantive candidate assertions.

Example:

> "Received the AWS Global Innovator Award in 2024."

becomes a `CandidateClaim`.

The extracted representation may include:

```text
claim type = AWARD
award name = AWS Global Innovator Award
year = 2024
candidate status = recipient
organization = AWS
```

The original text and provenance must be retained.

## LLM role

The LLM may:

- identify claims;
- normalize natural language;
- extract structured facts;
- identify ambiguity;
- flag unsupported superlatives;
- flag missing attribution.

## Deterministic role

The system validates:

- required schema;
- provenance;
- allowed claim types;
- document relationships;
- status enums.

---

# 6. Step 3 — Claim Safety Analysis

Before criterion mapping, claims should be inspected for potentially problematic characteristics.

Examples:

```text
"one of the world's leading..."
"top 1% globally"
"used by millions"
"largest migration in Asia"
"revolutionary contribution"
```

These may produce:

```text
UNSUPPORTED_SUPERLATIVE
UNQUANTIFIED_IMPACT
UNVERIFIED_STATISTIC
```

The system does not declare such claims false.

It marks them as requiring substantiation.

---

# 7. Step 4 — Claim → Criterion Mapping

Each substantive claim is evaluated against the EB-1A criterion definitions.

For each claim:

```text
C1
C2
C3
...
C10
```

The semantic mapper returns:

```text
POTENTIAL_MATCH
PARTIAL_MATCH
NOT_A_MATCH
UNCLEAR
```

Example:

```text
Claim:
"Served as a reviewer for 12 IEEE conference papers."

C4:
POTENTIAL_MATCH

C5:
NOT_A_MATCH
```

The mapping should not force every claim into a criterion.

A claim that does not correspond to a criterion is retained as profile information and may later be relevant to the overall record.

---

# 8. Step 5 — Proposition Generation

Once a claim is mapped to a potential criterion, the system identifies the propositions that the claim appears to address.

Example:

```text
Claim:
"Received the XYZ International Innovation Award."

C1 propositions:

P1 — candidate received the award
P2 — award has national/international recognition
P3 — award recognizes excellence in the field
```

The claim might establish only:

```text
P1 = SUPPORTED_BY_CLAIM
P2 = NOT_ESTABLISHED
P3 = NOT_ESTABLISHED
```

This distinction is fundamental.

---

# 9. Step 6 — Initial Criterion Assessment

The system creates a preliminary `CriterionResult`.

Example:

```text
C5 — Original Contributions

Claim fit:
POTENTIAL_MATCH

Originality:
SUPPORTED_BY_CLAIM

Candidate attribution:
SUPPORTED_BY_CLAIM

Field relevance:
SUPPORTED_BY_CLAIM

Major significance:
NOT_ESTABLISHED
```

This is **not** a final C5 legal determination.

It means:

> "The profile contains a potentially relevant claim, but important propositions remain unsubstantiated."

---

# 10. Pass 1 Output

Pass 1 produces:

```text
Candidate Claims
        +
Criterion Candidates
        +
Propositions
        +
Claim Safety Flags
        +
Initial Gaps
        +
Evidence Needs
```

The system can now tell the candidate:

> "Your profile contains a potential C5 contribution claim. The claim describes a specific contribution and claimed impact, but the current profile does not establish major significance."

This is useful even before evidence collection.

---

# 11. Evidence Planning

After Pass 1, VisaPilot determines what evidence would be useful for the identified propositions.

Example:

```text
C5-P5:
Major significance not established.

Potential evidence actions:
- independent adoption evidence
- documented measurable impact
- independent expert corroboration
- industry recognition
```

The system should not automatically demand every possible document.

Evidence requests should be **proposition-specific**.

The wording should be:

> "Evidence that could strengthen/substantiate this proposition includes..."

not:

> "USCIS requires this exact document."

---

# 12. Pass 2 — Evidence Validation

Pass 2 begins when relevant evidence is supplied.

Input:

```text
Candidate Claim
+
Criterion
+
Propositions
+
Evidence
```

The system then asks:

> Does the evidence substantiate the proposition?

---

# 13. Evidence → Proposition Reconciliation

Example:

### Claim

> "I judged papers for IEEE conference X."

### Evidence

Reviewer confirmation showing the candidate completed reviews.

The system may establish:

```text
C4-P1:
candidate participated → SUPPORTED

C4-P2:
work of others → SUPPORTED

C4-P3:
actual judging activity → SUPPORTED

C4-P4:
same/allied field → SUPPORTED
```

Criterion result:

```text
C4:
SUPPORTED_FOR_REVIEW
```

---

# 14. Evidence Can Conflict With the Claim

Example:

### CV

> "Received the Global Innovation Award."

### External award page

Shows:

> "Winner: Candidate's employer."

The system must not silently choose the CV.

Instead:

```text
C1-P1:
CONFLICTING

Evidence:
CV → candidate recipient
Public source → organization recipient
```

Criterion:

```text
CONFLICTING
```

Potential action:

```text
COUNSEL_REVIEW
```

This is a core requirement of an evidence-grounded system.

---

# 15. Evidence Can Be Insufficient Without Being Contradictory

Example:

> "My contribution was adopted globally."

Evidence:

- internal presentation only.

There may be no contradiction.

But there is insufficient substantiation for the claimed scope.

Therefore:

```text
P5:
INSUFFICIENT_EVIDENCE
```

not:

```text
NOT_SUPPORTED
```

and not:

```text
FALSE
```

---

# 16. Criterion Result Formation

After proposition reconciliation:

```text
Proposition Results
        ↓
Evidence Status
        ↓
Criterion Result
```

Example:

```text
C5

Claim fit:
POTENTIAL_MATCH

Propositions:
  contribution → SUPPORTED
  attribution → SUPPORTED
  originality → PARTIALLY_SUPPORTED
  field relevance → SUPPORTED
  major significance → INSUFFICIENT_EVIDENCE

Overall:
PARTIALLY_SUPPORTED

Gap:
Independent evidence of major significance
```

The criterion result remains explainable.

---

# 17. Criterion-Level Status Logic

The engine should distinguish these concepts:

### `NOT_A_MATCH`

The claim does not semantically correspond to the criterion.

### `POTENTIAL_MATCH`

The claim contains facts that potentially correspond to the criterion.

### `SUPPORTED_FOR_REVIEW`

Relevant propositions have sufficient current evidence for the system to present the criterion as supported for professional/legal review.

### `PARTIALLY_SUPPORTED`

Some propositions are supported while others remain weak or insufficient.

### `INSUFFICIENT_EVIDENCE`

The claim may fit, but the evidence does not currently substantiate the required propositions.

### `UNVERIFIED`

A relevant external/source fact has not been adequately verified.

### `CONFLICTING`

Material sources disagree.

### `COUNSEL_REVIEW`

The issue requires professional/legal judgment or interpretation beyond the system's safe automated boundary.

---

# 18. Comparable Evidence Branch

Comparable evidence is evaluated only when the relevant regulatory standard may not readily apply to the occupation.

The flow is:

```text
Criterion
   ↓
Does it readily apply to occupation?
   │
   ├── YES
   │     ↓
   │   Normal criterion analysis
   │
   └── NO / UNCLEAR
         ↓
   Occupation-specific rationale
         ↓
   Proposed comparable evidence
         ↓
   Comparability analysis
         ↓
   COUNSEL_REVIEW where appropriate
```

Important:

> Lack of ordinary evidence does not itself trigger comparable evidence.

And:

> Comparable evidence is not simply any alternative evidence.

---

# 19. Claims That Do Not Map to C1–C10

The system must not discard them.

Example:

> "Invited keynote speaker at a major industry conference."

Suppose the claim does not establish one of C1–C10.

It can still become:

```text
RecognitionSignal
```

or other final-merits evidence.

Therefore:

```text
No criterion match
        ≠
No value
```

This is important for the totality layer.

---

# 20. Recognition Timeline

After evidence validation, VisaPilot creates structured recognition signals.

Example:

```text
2018 — Industry award
2020 — Independent media coverage
2021 — Conference judging
2022 — Major contribution
2024 — International award
2025 — Journal reviewer
2026 — Industry recognition
```

The purpose is to expose patterns relevant to:

- recognition;
- acclaim;
- chronology;
- recurrence;
- field standing.

The timeline is an input to synthesis, not a legal score.

---

# 21. Final Merits / Totality

Once the criterion/evidence layer is sufficiently developed, VisaPilot synthesizes the complete record.

Inputs:

```text
Criterion Results
+
Comparable Evidence
+
Recognition Signals
+
Relevant non-criterion evidence
+
Timeline
+
Evidence quality/context
+
Conflicts
```

The synthesis examines themes such as:

```text
Recognition
Acclaim
Field standing
Major achievements
Independent corroboration
Impact
Consistency
Temporal continuity
```

The LLM may synthesize these patterns.

The deterministic layer ensures that the synthesis is based on known structured inputs and provenance.

---

# 22. Final-Merits Output

Example:

```text
Sustained acclaim:
PARTIALLY_SUPPORTED

Recognized achievements:
SUPPORTED_FOR_REVIEW

Field standing:
INSUFFICIENT_EVIDENCE

Strengths:
- repeated professional recognition
- documented judging activity
- independent publication coverage

Unresolved issues:
- limited independent evidence of field-wide impact
- older recognition is stronger than recent recognition

Overall synthesis:
[LLM-generated evidence-grounded narrative]
```

The system does not output:

```text
EB-1A approval probability = 84%
```

---

# 23. Continue Work Assessment

This is evaluated separately.

Input:

```text
Candidate expertise
+
Proposed U.S. work
+
Supporting evidence
```

Flow:

```text
Current field
      ↓
Proposed U.S. activity
      ↓
Relationship to expertise
      ↓
Evidence
      ↓
Assessment
```

Possible state:

```text
DIRECT
RELATED
UNCLEAR
NOT_ESTABLISHED
```

This should not be inferred merely from a job title.

---

# 24. U.S. Benefit Assessment

This is also separate.

Input:

```text
Proposed U.S. activities
+
Candidate field
+
Supporting evidence
+
Documented potential benefit
```

The system identifies:

- claimed benefit areas;
- supporting evidence;
- missing context;
- contradictions;
- unresolved questions.

It does not predict government acceptance.

---

# 25. Gap Generation

Gaps are generated from unresolved propositions and requirements.

Example:

```text
C5-P5:
Major significance = INSUFFICIENT_EVIDENCE

        ↓

Gap:
Independent evidence demonstrating major significance

        ↓

Actions:
1. Identify independent adoption evidence.
2. Provide measurable field-level impact.
3. Obtain appropriate corroboration.
```

Gaps should be specific.

Bad:

> "Need more evidence."

Good:

> "The current record documents internal cost reduction but does not independently substantiate significance beyond the employer."

---

# 26. Gap Priority

Priority can be determined from deterministic characteristics such as:

```text
- number of unresolved propositions;
- whether the proposition is central to a criterion;
- whether the issue affects multiple downstream assessments;
- whether evidence is missing versus merely unverified;
- whether a contradiction exists.
```

The system should not represent priority as a legal probability.

---

# 27. Assessment State Transitions

The assessment is incremental.

```text
NEW
 ↓
PROFILE_PARSED
 ↓
CLAIMS_EXTRACTED
 ↓
CRITERION_MAPPED
 ↓
PROFILE_ASSESSED
 ↓
EVIDENCE_INGESTED
 ↓
EVIDENCE_RECONCILED
 ↓
CRITERIA_ASSESSED
 ↓
OVERALL_SYNTHESIS_READY
 ↓
FINAL_MERITS_ASSESSED
 ↓
WORK_AND_BENEFIT_ASSESSED
 ↓
ROADMAP_READY
 ↓
DOSSIER_READY
```

The candidate can return with new evidence at any point.

New evidence should trigger targeted recalculation rather than requiring the entire assessment to be rebuilt from scratch.

---

# 28. Incremental Reconciliation

Example:

```text
Initial:
C5 = PARTIALLY_SUPPORTED

New evidence:
Independent industry adoption report

        ↓

Re-evaluate affected propositions

        ↓

C5:
SUPPORTED_FOR_REVIEW

        ↓

Update:
Recognition Signals
Final Merits
Gaps
Roadmap
```

This is why proposition-level relationships are important.

We do not want:

```text
"Re-run the entire AI prompt."
```

We want targeted state updates.

---

# 29. Deterministic vs LLM Decision Boundary

## Deterministic

```text
Which criteria exist?
What propositions belong to each criterion?
What statuses are allowed?
What source/version defines the rule?
What evidence is linked to what proposition?
What state transitions are valid?
What objects are persisted?
```

## LLM

```text
What does the candidate mean?
Which claims appear semantically related?
What proposition does a document appear to support?
What ambiguity exists?
What conflict exists?
What patterns appear across the evidence?
How should a gap be explained?
How should the evidence-grounded synthesis be written?
```

The LLM operates **inside boundaries established by the deterministic model**.

---

# 30. LLM Failure Handling

If the LLM:

- produces invalid JSON;
- references an unknown criterion;
- invents evidence;
- cites a nonexistent source;
- returns unsupported legal requirements;
- produces contradictory states;

the system must reject or quarantine the output.

Flow:

```text
LLM output
    ↓
Schema validation
    ↓
Domain validation
    ↓
Provenance validation
    ↓
Accept / Retry / Flag
```

An LLM response must never directly mutate authoritative regulatory data.

---

# 31. Evidence Provenance Requirement

Every evidence-grounded conclusion should retain:

```text
criterionId
propositionId
evidenceId
source
locator
ruleVersion
evaluation timestamp
```

This allows the UI to answer:

> "Why did VisaPilot say this?"

with a traceable chain.

---

# 32. Example End-to-End Candidate

Candidate CV says:

> "Principal Technology Architect who led a 35-person engineering organization, received an industry innovation award, reviewed IEEE conference papers, authored two publications, and designed a cloud platform used across the company."

### Pass 1

Potential matches:

```text
C1 → award
C4 → judging
C6 → scholarly articles
C8 → leading/critical role
C5 → original contribution
```

The system does not yet claim these criteria are established.

### Evidence Pass

Suppose:

```text
Award:
verified recipient

Judging:
review completion verified

Publications:
authorship verified

C8:
role responsibilities documented

C5:
internal adoption documented
independent field significance not established
```

Results:

```text
C1 → SUPPORTED_FOR_REVIEW
C4 → SUPPORTED_FOR_REVIEW
C6 → SUPPORTED_FOR_REVIEW
C8 → SUPPORTED_FOR_REVIEW
C5 → PARTIALLY_SUPPORTED
```

### Overall synthesis

The recognition timeline shows recurring recognition.

But C5 has an unresolved significance question.

The final-merits synthesis therefore explicitly identifies:

```text
Strength:
multiple independently documented recognition activities

Open issue:
major significance of claimed contribution is not yet independently substantiated
```

That is the type of output VisaPilot should generate.

---

# 33. No Automatic "3 Criteria = Pass"

The engine may calculate:

```text
number of criteria currently supported for review
```

because that is useful dashboard information.

But:

```text
5 criteria
```

must not become:

```text
EB-1A eligible = TRUE
```

Instead:

```text
Initial evidence:
5 criteria currently supported for review

Final merits:
separate assessment required
```

This distinction is mandatory throughout the application.

---

# 34. Reassessment Rules

Any new or changed evidence can affect:

```text
Claim
→ Proposition
→ Criterion
→ Recognition Signal
→ Final Merits
→ Gap
→ Roadmap
→ Dossier
```

The system should track dependencies so affected downstream objects can be recalculated.

---

# 35. Versioning

Every regulatory evaluation must record the rule version used.

Example:

```text
ruleVersion = "EB1A-2026-09"
```

A future regulatory/policy update should allow:

```text
old assessment
+
old rule version
```

to remain historically reproducible while new assessments use the updated rule set.

---

# 36. Core Evaluation Algorithm

Conceptually:

```text
1. Parse documents.
2. Extract candidate claims.
3. Preserve provenance.
4. Normalize claim facts.
5. Run claim-safety analysis.
6. Map claims to potentially relevant criteria.
7. Generate criterion propositions.
8. Produce Pass-1 profile assessment.
9. Generate proposition-specific evidence actions.
10. Ingest relevant evidence.
11. Reconcile evidence against propositions.
12. Detect conflicts and unresolved issues.
13. Produce criterion results.
14. Evaluate comparable-evidence situations where applicable.
15. Build recognition timeline/signals.
16. Synthesize final-merits/totality inputs.
17. Assess continued U.S. work.
18. Assess prospective U.S. benefit.
19. Generate gaps.
20. Generate evidence-building roadmap.
21. Produce dossier/report from the structured assessment state.
```

---

# 37. Fundamental Product Principle

VisaPilot should never behave like:

```text
CV → LLM → "You qualify"
```

It should behave like:

```text
CV
 ↓
Claims
 ↓
Structured regulatory model
 ↓
Potential criterion matches
 ↓
Propositions
 ↓
Evidence
 ↓
Verification / reconciliation
 ↓
Criterion results
 ↓
Overall evidence synthesis
 ↓
Gaps
 ↓
Evidence-building roadmap
 ↓
Professional-review-ready dossier
```

This is the core evaluation architecture.

---

# 38. Next Contract

The next and final design document before implementation is:

`EB1A_LLM_CONTRACT.md`

It will define:

- exact LLM call boundaries;
- input schemas;
- output schemas;
- extraction prompt responsibilities;
- criterion-mapping prompt responsibilities;
- evidence-reconciliation responsibilities;
- final-merits synthesis responsibilities;
- JSON validation;
- hallucination controls;
- provenance rules;
- retry/failure handling;
- model/provider abstraction.

Only after that document is frozen should the first Codex implementation task begin.
