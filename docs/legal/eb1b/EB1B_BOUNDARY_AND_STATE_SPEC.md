# VisaPilot — EB-1B Boundary and State Specification

**Status:** State Transition Specification — Phase 1  
**Pathway:** EB-1B / E12 — Outstanding Professors and Researchers  
**Rule Version:** `EB1B-2026-09`  

---

## 1. State Matrix

| State Enum | Definition in EB-1B Context |
|---|---|
| `SUPPORTED` | Proposition or criterion is substantiated by affirmative documentary evidence meeting regulatory standards. |
| `PARTIALLY_SUPPORTED` | Part of the requirement is substantiated, but critical regulatory elements remain unresolved (e.g., paper published, but international circulation not documented). |
| `INSUFFICIENT_EVIDENCE` | The claim aligns semantically, but documentary evidence is missing or inadequate. |
| `UNVERIFIED` | Facts asserted in CV or letters without primary independent source verification. |
| `CONFLICTING` | Material discrepancies between supplied records (e.g., CV claims 4 years experience, employer letter verifies only 2). |
| `NOT_APPLICABLE` | Criterion has no relevant material asserted or connected. |
| `COUNSEL_REVIEW` | Ambiguity or legal interpretation required (e.g., evaluating whether a private research group satisfies the "documented accomplishments" standard). |

---

## 2. Deterministic vs LLM Boundary

```text
DETERMINISTIC APPLICATION ENGINE:
- Enforces 36-month minimum experience calculation.
- Enforces 2-of-6 criterion count threshold.
- Validates employer category (Higher Ed vs Private Employer 3-researcher rule).
- Manages state transitions and provenance tracking.

LLM SEMANTIC LAYER:
- Decomposes publication citations and research narratives.
- Matches peer-review invitations and conference records to B4 judging.
- Synthesizes scholarly contribution impact narratives for B5.
- Drafts targeted gap remediation actions.
```
