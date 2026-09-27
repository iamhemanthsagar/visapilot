# VisaPilot — Project Specification

## 1. Product

VisaPilot is an AI-assisted visa profile assessment and evidence-intelligence platform.

The prototype is focused initially on employment-based first-preference pathways:

- EB-1A
- EB-1B
- EB-1C

The system accepts a candidate profile and supporting documents, analyzes the available evidence against structured pathway criteria, identifies evidence strengths and gaps, and produces an evidence-grounded assessment, improvement roadmap, and professional review dossier.

VisaPilot is an assessment and preparation tool, not a law firm or legal advice service.

All legal conclusions must be presented as informational assessments requiring qualified immigration counsel verification.

---

## 2. Primary Product Flow

The core user journey is:

1. Profile Upload
2. Visa Category Selection
3. Deep Profile Parsing & Rule Engine
4. Profile Strategy Insights
5. Evidence Detection & Scoring
6. Criterion-Wise Checklist
7. Gap Analysis
8. Evidence Build Plan
9. Readiness Benchmark
10. Profile Improvement Roadmap
11. Professional Review Dossier

The UI may present these as 11 visible workflow stages.

Internally, the implementation should consolidate them into reusable engines rather than creating 11 unrelated systems.

---

## 3. MVP Goal

The MVP must successfully demonstrate this complete vertical slice:

Candidate document
→ document extraction
→ structured candidate profile
→ pathway selection
→ criterion evaluation
→ claims/evidence mapping
→ evidence status
→ gaps
→ recommended evidence-building actions
→ roadmap
→ dashboard
→ professional review dossier

The MVP should work using the supplied synthetic Arjun Mehta profile as a primary stress-test candidate.

---

## 4. Core Engineering Principle

VisaPilot must NOT be a simple:

"Upload PDF → send entire PDF to an LLM → display answer"

application.

The core architecture is:

Documents
→ Facts / Claims
→ Evidence
→ Regulatory Criteria
→ Deterministic Rule Evaluation
→ LLM Semantic Reconciliation
→ Criterion Results
→ Gap Analysis
→ Strategy
→ Roadmap
→ Dossier

Important conclusions should be traceable.

A criterion result should be able to answer:

- What claim was evaluated?
- Which document supports it?
- What evidence exists?
- What is the evidence status?
- Which criterion does it relate to?
- What is missing?
- Why was the result reached?
- What action is recommended?

---

## 5. Separation of Responsibilities

### Deterministic system

The application owns:

- criterion definitions
- rule configuration
- required fields
- evidence status
- scoring calculations
- thresholds
- state transitions
- provenance
- validation
- persistence

Legal/regulatory rules must not be invented by an LLM.

Rules should live in structured, versionable application data.

### LLM

The LLM may assist with:

- document understanding
- claim extraction
- entity/fact extraction
- semantic matching
- ambiguity reconciliation
- evidence interpretation
- strategy synthesis
- gap explanation
- roadmap generation
- report prose

The LLM must operate within structured schemas and application constraints.

It must not silently replace deterministic rules.

---

## 6. Regulatory Data

VisaPilot's regulatory criteria must be represented as structured data.

Initial pathway data:

- EB-1A
- EB-1B
- EB-1C

The reference workflow describes the system as using a regulatory rule engine and USCIS criteria mapping.

Before implementing legal criteria as production logic, verify the relevant regulatory/source material.

Do not rely on model memory for legal requirements.

Each rule definition should eventually have:

- pathway
- criterion code
- title
- description
- regulatory/source reference
- required evidence characteristics
- evaluation configuration
- version
- effective date where applicable

The system should make future rule updates possible without rewriting the entire application.

---

## 7. Evidence Model

Evidence should not be treated as a single undifferentiated text blob.

The conceptual model is:

Candidate
→ Document
→ Claim
→ Evidence
→ Criterion

Evidence should support statuses such as:

- strong
- moderate
- weak
- missing
- unverified
- conflicting
- counsel-review

Evidence should also distinguish between characteristics such as:

- internal vs external
- direct vs indirect
- primary vs secondary
- independently verifiable vs unsupported
- quantitative vs qualitative

These classifications may evolve during implementation.

---

## 8. Claim Safety

VisaPilot should detect potentially risky or unsupported claims.

Examples include:

- unsupported superlatives
- "world's first"
- "top 1%"
- "one of the world's leading..."
- large financial impact claims without supporting evidence
- broad adoption claims
- claims based only on internal assertions
- ambiguous leadership claims
- claims where independent verification appears necessary

The system should distinguish:

- candidate-stated claim
- supported fact
- inferred interpretation
- externally verified evidence
- unsupported claim

VisaPilot must not convert an unsupported claim into a fact merely because an LLM considers it plausible.

---

## 9. Central Assessment State

The application should maintain a central assessment state rather than allowing every page to independently calculate its own results.

Conceptual model:

```ts
AssessmentState {
  candidate
  documents
  pathways
  claims
  evidence
  criteria
  strategy
  gaps
  roadmap
  benchmark
  dossier
}