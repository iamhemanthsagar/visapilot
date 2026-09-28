# VisaPilot — EB-1C Boundary and State Specification

**Status:** State Transition Specification — Phase 1  
**Pathway:** EB-1C / E13 — Multinational Executives and Managers  
**Rule Version:** `EB1C-2026-09`  

---

## 1. Mandatory Gate States

Unlike EB-1A/EB-1B where certain evidentiary criteria are optional alternatives, all 6 EB-1C gates (M1–M6) are **mandatory blockers**.

| Gate State | Definition in EB-1C Context | Blocker Status |
|---|---|---|
| `SUPPORTED` | Gate requirements are affirmatively substantiated by corporate and employment documentation. | No Blocker |
| `PARTIALLY_SUPPORTED` | Core relationship asserted, but missing granular required details (e.g., job title provided, but duty percentage breakdowns missing). | **Active Blocker** |
| `INSUFFICIENT_EVIDENCE` | Gate is unevidenced or missing essential verification. | **Active Blocker** |
| `UNVERIFIED` | Self-asserted in resume without corporate corroboration. | **Active Blocker** |
| `CONFLICTING` | Ownership discrepancy or conflicting dates of foreign employment. | **Active Blocker (High Priority)** |
| `COUNSEL_REVIEW` | Complex corporate restructurings, M&A successorship, or functional manager boundary cases. | **Active Blocker (Requires Counsel)** |

---

## 2. Deterministic vs LLM Boundary

```text
DETERMINISTIC APPLICATION ENGINE:
- Calculates 1-in-3 year foreign employment math.
- Calculates 12-month U.S. doing business duration.
- Validates ownership percentages and entity relationship types.
- Enforces mandatory blocker flags when any M1–M6 gate is unresolved.

LLM SEMANTIC LAYER:
- Decomposes job duty descriptions to classify primary capacity (Personnel / Functional / Executive vs Non-qualifying operational tasks).
- Analyzes organizational hierarchy charts and subordinate titles.
- Identifies ambiguous job duties and vague descriptions.
- Generates precise corporate documentation requests for gaps.
```
