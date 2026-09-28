# VisaPilot — EB-1C LLM Contract

**Status:** AI Contract Specification — Phase 1  
**Pathway:** EB-1C / E13 — Multinational Executives and Managers  
**Rule Version:** `EB1C-2026-09`  

---

## 1. Allowed AI Operations

1. `EXTRACT_EXECUTIVE_CLAIMS`: Extract employment history, corporate affiliations, executive/managerial titles, subordinate team structures, and company operating details.
2. `ANALYZE_MANAGERIAL_DUTIES`: Categorize job duty sentences into executive, personnel managerial, functional managerial, or direct operational/technical tasks.
3. `RECONCILE_CORPORATE_EVIDENCE`: Reconcile organizational charts, corporate ownership filings, foreign tax records, and offer letters against gates M1–M6.
4. `GENERATE_EB1C_GAPS`: Generate specific corporate documentary requests (e.g., capitalization tables, subordinate job descriptions) for unresolved gates.

---

## 2. Invariants & Prohibitions

- **No Assuming First-Line Supervision Qualifies:** The AI must explicitly flag first-line supervisory roles over non-professional workers as non-qualifying under INA §101(a)(44)(C).
- **No Conflating Ownership with Employment:** The AI must ensure active employment in managerial/executive capacity, not merely equity ownership or investment.
- **No Approval Predictions:** The AI must never promise or predict USCIS approval or L-1 to EB-1C conversion guarantees.
