# VisaPilot — EB-1B LLM Contract

**Status:** AI Contract Specification — Phase 1  
**Pathway:** EB-1B / E12 — Outstanding Professors and Researchers  
**Rule Version:** `EB1B-2026-09`  

---

## 1. Allowed AI Operations

1. `EXTRACT_ACADEMIC_CLAIMS`: Extract publications, citations, awards, judging, grants, research contributions, and teaching history.
2. `MAP_CLAIMS_TO_EB1B_CRITERIA`: Semantically map academic profile facts to B1–B6 and experience/job offer categories.
3. `RECONCILE_ACADEMIC_EVIDENCE`: Reconcile journal publication metadata, citation reports, peer-review certificates, and employment verification letters.
4. `SYNTHESIZE_EB1B_FINAL_MERITS`: Synthesize overall international recognition in the academic discipline from structured inputs.
5. `GENERATE_EB1B_GAPS`: Produce actionable evidentiary build steps for unresolved propositions.

---

## 2. Invariants & Prohibitions

- **No Legal Eligibility Claims:** AI must never state that a candidate "qualifies for EB-1B" or "will be approved by USCIS".
- **No Inventing Citation Impact:** AI must not assume high impact or major significance without documentary citation or testimonial proof.
- **No Conflating Pre-Degree Experience:** AI must not mark pre-degree experience as verified unless evidence explicitly establishes instructor of record or recognized outstanding research.
- **Strict Structured Output:** All outputs must adhere to typed JSON schemas and preserve reference IDs.
