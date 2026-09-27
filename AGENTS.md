# VisaPilot — Agent Instructions

## Read First

Before making implementation changes:

1. Read `PROJECT_SPEC.md`.
2. Inspect the existing code relevant to the requested task.
3. Understand existing patterns before creating new ones.
4. Do not reuse AdaptX code.

---

## General Rules

- VisaPilot is a fresh project.
- Do not import or copy AdaptX implementation.
- Prefer simple solutions over unnecessary abstraction.
- Do not introduce dependencies without a concrete reason.
- Do not rewrite unrelated files.
- Preserve existing working functionality.
- Use TypeScript strictly.
- Keep business logic outside large UI components.
- Keep reusable logic modular and testable.

---

## Regulatory Rules

Never invent immigration-law requirements.

Do not allow an LLM to be the authoritative source of regulatory criteria.

Regulatory criteria must be represented as structured application data and deterministic logic.

If a required legal fact is unavailable or uncertain:

- do not guess
- flag the uncertainty
- identify it for verification

---

## AI Usage

Use LLMs for tasks such as:

- semantic interpretation
- extraction
- claim identification
- evidence interpretation
- reconciliation
- strategy synthesis
- report generation

Do not use an LLM where deterministic application logic is sufficient.

LLM outputs must use structured schemas where practical.

Validate generated data before using it in application state.

---

## Security

Never:

- commit API keys
- expose provider secrets in frontend code
- hardcode credentials
- place secrets in source files
- modify `.env` into a tracked file

Use `.env.example` for documented variable names only.

---

## Implementation Discipline

Work only on the requested milestone.

Do not implement future features merely because they are mentioned in the specification.

Before adding an abstraction, confirm that the current feature actually needs it.

Prefer a working vertical slice over incomplete broad functionality.

---

## Testing

After meaningful implementation:

1. run the relevant tests
2. run lint
3. run the production build
4. fix errors before reporting completion

Do not claim that a feature works without testing it.

If a test cannot be performed, explicitly report that.

---

## Git

Do not rewrite Git history unless explicitly instructed.

Do not force-push.

Do not reset or delete user work without explicit permission.

Keep changes logically grouped so they can be reviewed and committed.

---

## Reporting

At the end of each task, report:

1. What was changed
2. Files created/modified
3. Dependencies added
4. Commands/tests run
5. Build/lint/test results
6. Any unresolved issues
7. Any decisions that require human approval

Do not claim success merely because code was generated.

---

## Scope Control

The current priority order is:

1. Working core assessment flow
2. Evidence-grounded criterion engine
3. Gap analysis
4. Roadmap
5. Dashboard
6. Dossier
7. AI improvements
8. Persistence
9. UI polish
10. Optional advanced architecture

Do not sacrifice the working core for cosmetic features.