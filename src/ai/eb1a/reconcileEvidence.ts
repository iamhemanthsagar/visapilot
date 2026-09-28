import type {
  AIExecutionRecord,
  ReconcileEvidenceInput,
  ReconcileEvidenceOutput,
} from '../../types/visa/eb1a'
import type { AIContractResult, ReconcileEvidenceContractOutput } from './contract'

const RECONCILIATION_PROMPT_VERSION = 'EB1A-EVIDENCE-RECON-2026-09-01'

export type EvidenceAIInvoker = (request: {
  operation: 'RECONCILE_EVIDENCE'
  systemPrompt: string
  userPrompt?: string
  responseSchema: unknown
  responseSchemaName: string
}) => Promise<{ content: string; provider: string; model: string }>

const evidenceSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    claimVerification: {
      type: 'object',
      additionalProperties: false,
      properties: {
        status: { type: 'string', enum: ['SUPPORTED', 'PARTIALLY_SUPPORTED', 'UNVERIFIED', 'CONFLICTING', 'INSUFFICIENT_EVIDENCE'] },
        rationale: { type: 'string' },
      },
      required: ['status', 'rationale'],
    },
    evidenceAssessments: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          evidenceId: { type: 'string' },
          status: { type: 'string', enum: ['SUPPORTED', 'PARTIALLY_SUPPORTED', 'UNVERIFIED', 'CONFLICTING', 'INSUFFICIENT_EVIDENCE'] },
          rationale: { type: 'string' },
          supportedFacts: { type: 'array', items: { type: 'string' } },
          unsupportedFacts: { type: 'array', items: { type: 'string' } },
          conflicts: { type: 'array', items: { type: 'string' } },
        },
        required: ['evidenceId', 'status', 'rationale', 'supportedFacts', 'unsupportedFacts', 'conflicts'],
      },
    },
    propositionResults: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          propositionId: { type: 'string' },
          status: { type: 'string', enum: ['SUPPORTED', 'PARTIALLY_SUPPORTED', 'UNVERIFIED', 'CONFLICTING', 'INSUFFICIENT_EVIDENCE', 'COUNSEL_REVIEW'] },
          supportingEvidenceIds: { type: 'array', items: { type: 'string' } },
          conflictingEvidenceIds: { type: 'array', items: { type: 'string' } },
          rationale: { type: 'string' },
          missingInformation: { type: 'array', items: { type: 'string' } },
          ambiguities: { type: 'array', items: { type: 'string' } },
        },
        required: ['propositionId', 'status', 'supportingEvidenceIds', 'conflictingEvidenceIds', 'rationale', 'missingInformation', 'ambiguities'],
      },
    },
    claimConflicts: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          claimText: { type: 'string' },
          evidenceIds: { type: 'array', items: { type: 'string' } },
          description: { type: 'string' },
        },
        required: ['claimText', 'evidenceIds', 'description'],
      },
    },
    newSafetyFlags: {
      type: 'array',
      items: {
        type: 'string',
        enum: ['UNSUPPORTED_SUPERLATIVE', 'UNQUANTIFIED_IMPACT', 'UNVERIFIED_EXTERNAL_RECOGNITION', 'UNVERIFIED_STATISTIC', 'AMBIGUOUS_ATTRIBUTION', 'AMBIGUOUS_ROLE', 'AMBIGUOUS_AWARD_STATUS', 'POTENTIAL_CONFLICT', 'SOURCE_MISSING'],
      },
    },
  },
  required: ['claimVerification', 'evidenceAssessments', 'propositionResults', 'claimConflicts', 'newSafetyFlags'],
} as const

function buildPrompt(input: ReconcileEvidenceInput) {
  const modelClaim = {
    id: input.claim.id,
    text: input.claim.text,
    normalizedType: input.claim.normalizedType ?? 'OTHER',
    safetyFlags: input.claim.claimSafetyFlags,
  }
  const modelCriterion = {
    id: input.criterion.id,
    code: input.criterion.code,
    title: input.criterion.title,
    regulatoryRequirement: input.criterion.regulatoryRequirement,
  }
  const modelEvidence = input.evidence.map(item => ({
    id: item.id,
    title: item.title ?? null,
    sourceType: item.sourceType,
    provenance: item.provenance,
    content: item.content.slice(0, 5000),
  }))

  const systemPrompt = `You are VisaPilot's EB-1A evidence reconciliation engine.

Your task is ONLY semantic evidence reconciliation. Determine whether the supplied evidence is actually about the supplied candidate claim, whether it attributes the claimed fact to the candidate, what facts it supports, which supplied propositions it supports, and what conflicts or limitations remain.

You are NOT deciding:
- legal eligibility
- whether USCIS will accept the evidence
- whether the criterion is satisfied
- final merits
- petition readiness

Rules:
1. Use only the supplied claim, criterion, propositions, evidence, and provenance.
2. Never invent facts, documents, sources, identities, dates, publication status, or significance.
3. Distinguish candidate assertions from independent corroboration.
4. An uploaded copy of the candidate's own CV/profile is not independent corroboration; if it merely repeats the claim, keep the claim UNVERIFIED or INSUFFICIENT_EVIDENCE.
5. Evidence can partially support a claim. Do not force binary outcomes.
6. Check identity/entity, attribution to the candidate, factual support, proposition relevance, and contradictions separately.
7. A proposition can be SUPPORTED only when the supplied evidence actually supports the proposition statement; do not infer missing elements.
8. Do not upgrade originality, major significance, distinguished reputation, high compensation, or similar legal elements merely because a claim says so.
9. Preserve uncertainty and list missing information.
10. Evidence may support multiple propositions.
11. Return only IDs supplied in the input.
12. If no evidence is supplied, return INSUFFICIENT_EVIDENCE/UNVERIFIED rather than pretending proof exists.

Return only JSON matching the supplied schema.`

  const userPrompt = `CANDIDATE CLAIM:\n${JSON.stringify(modelClaim)}\n\nCRITERION:\n${JSON.stringify(modelCriterion)}\n\nPROPOSITIONS:\n${JSON.stringify(input.propositions)}\n\nEVIDENCE:\n${JSON.stringify(modelEvidence)}\n\nReconcile the evidence now.`
  return { systemPrompt, userPrompt }
}

function parseOutput(content: string): ReconcileEvidenceContractOutput {
  let value = content.trim()
  if (value.startsWith('```')) value = value.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()
  const first = value.indexOf('{')
  const last = value.lastIndexOf('}')
  if (first >= 0 && last > first) value = value.slice(first, last + 1)
  return JSON.parse(value) as ReconcileEvidenceContractOutput
}

function validate(input: ReconcileEvidenceInput, output: ReconcileEvidenceOutput) {
  const evidenceIds = new Set(input.evidence.map(item => item.id))
  const propositionIds = new Set(input.propositions.map(item => item.id))
  for (const item of output.evidenceAssessments) {
    if (!evidenceIds.has(item.evidenceId)) throw new Error(`LLM returned unknown evidence ID: ${item.evidenceId}`)
  }
  for (const item of output.propositionResults) {
    if (!propositionIds.has(item.propositionId)) throw new Error(`LLM returned unknown proposition ID: ${item.propositionId}`)
    if (item.supportingEvidenceIds.some(id => !evidenceIds.has(id)) || item.conflictingEvidenceIds.some(id => !evidenceIds.has(id))) {
      throw new Error(`LLM returned an unknown evidence ID for proposition ${item.propositionId}`)
    }
  }
}

export async function reconcileEvidence(
  input: ReconcileEvidenceInput,
  invokeAI: EvidenceAIInvoker,
): Promise<AIContractResult<ReconcileEvidenceContractOutput>> {
  const { systemPrompt, userPrompt } = buildPrompt(input)
  const result = await invokeAI({
    operation: 'RECONCILE_EVIDENCE',
    systemPrompt,
    userPrompt,
    responseSchema: evidenceSchema,
    responseSchemaName: 'visapilot_eb1a_evidence_reconciliation',
  })
  const output = parseOutput(result.content)
  validate(input, output)
  const execution: AIExecutionRecord = {
    id: `AI-RECON-${Date.now().toString(36)}`,
    operation: 'RECONCILE_EVIDENCE',
    modelProvider: result.provider,
    modelName: result.model,
    promptVersion: RECONCILIATION_PROMPT_VERSION,
    ruleVersion: 'EB1A-2026-09',
    inputReferences: [input.claim.id, input.criterion.id, ...input.evidence.map(item => item.id)],
    outputValidated: true,
    createdAt: new Date().toISOString(),
  }
  return { output, execution }
}
