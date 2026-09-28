# VisaPilot — EB-1B Evaluation Model

**Status:** Operational Evaluation Specification — Phase 1  
**Pathway:** EB-1B / E12 — Outstanding Professors and Researchers  
**Rule Version:** `EB1B-2026-09`  

---

## 1. Multi-Stage Evaluation Logic

```text
Step 1: Parse Candidate Profile & Extract Academic Claims
Step 2: Evaluate Mandatory Thresholds
         ├── B7: 3-Year Teaching/Research Experience
         ├── B8: Qualifying Permanent U.S. Job Offer
         └── B9: Alignment with Defined Academic Field
Step 3: Evaluate 6 Evidentiary Categories (B1–B6)
         └── Rollup: Minimum 2 of 6 Supported
Step 4: Evidence Reconciliation & Conflict Resolution
Step 5: Final Merits Review (B10: International Recognition as Outstanding)
Step 6: Gap Analysis & Phased Action Plan
```

---

## 2. Evaluation Rules for Threshold Prerequisites

### Experience Rule (B7)
1. Accumulate total verified calendar duration in teaching and/or research positions.
2. If total < 36 months, mark `B7` as `INSUFFICIENT_EVIDENCE` or `PARTIALLY_SUPPORTED` and flag as a **Mandatory Threshold Blocker**.
3. If pre-degree research/teaching is claimed:
   - Check if degree was conferred. If not, exclude pre-degree months.
   - For teaching: verify evidence that candidate was instructor of record with primary course responsibility.
   - For research: verify documentary evidence of outstanding recognition before counting.

### Job Offer Rule (B8)
1. Verify existence of permanent job offer from U.S. petitioner.
2. If employer is University / Higher Education: verify tenured, tenure-track, or permanent research role.
3. If employer is Private Entity:
   - Verify employer employs at least 3 full-time researchers.
   - Verify employer demonstrates documented accomplishments in the field.
   - If either private employer condition is missing, mark `B8` as `INSUFFICIENT_EVIDENCE` / `UNVERIFIED` and flag as a **Mandatory Threshold Blocker**.

---

## 3. Evaluation Rules for Initial Evidence (B1–B6)

1. Each criterion B1 through B6 is evaluated at the proposition level against supplied evidence.
2. Overall status for criterion B_i is derived deterministically:
   - If all applicable propositions are `SUPPORTED` → `SUPPORTED`
   - If at least one proposition is `CONFLICTING` → `CONFLICTING`
   - If some propositions are `SUPPORTED`/`PARTIALLY_SUPPORTED` → `PARTIALLY_SUPPORTED`
   - If no supporting evidence → `INSUFFICIENT_EVIDENCE`
3. Rollup: Count number of criteria with `SUPPORTED` status.
   - If count >= 2: Initial evidentiary threshold met (`isThresholdMet = true`).
   - If count < 2: Initial evidentiary threshold not met (`isThresholdMet = false`).

---

## 4. Final Merits Evaluation (B10)

1. Meeting the 2-of-6 threshold does **not** equal EB-1B eligibility.
2. The final merits layer synthesizes:
   - Major awards vs standard academic recognitions;
   - Selectivity of memberships;
   - Citations and independent impact of published research;
   - Frequency, prestige, and scope of judging duties;
   - International distribution and stature of authorship venues.
3. Output: Plain-language evaluation of whether the documentary record supports international recognition as outstanding in the academic field.
