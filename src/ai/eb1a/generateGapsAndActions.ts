import type { AIContractResult } from './contract'
import type { AIExecutionRecord, GapGenerationInput, GapGenerationOutput } from '../../types/visa/eb1a'

const PROMPT_VERSION = 'EB1A-GAPS-2026-09-01'

export type GapAIInvoker = (request: {
  operation: 'GENERATE_GAPS_AND_ACTIONS'
  systemPrompt: string
  userPrompt?: string
  responseSchema: unknown
  responseSchemaName: string
}) => Promise<{ content: string; provider: string; model: string }>

const schema = {
  type: 'object', additionalProperties: false,
  properties: { gaps: { type: 'array', items: {
    type: 'object', additionalProperties: false,
    properties: {
      scope: { type: 'string', enum: ['CLAIM','PROPOSITION','CRITERION','COMPARABLE_EVIDENCE','FINAL_MERITS','CONTINUE_WORK','US_BENEFIT'] },
      targetId: { type: 'string' },
      type: { type: 'string', enum: ['MISSING_EVIDENCE','WEAK_EVIDENCE','UNVERIFIED','CONFLICTING','AMBIGUOUS_CLAIM','MISSING_CONTEXT','COUNSEL_REVIEW'] },
      description: { type: 'string' },
      recommendedActions: { type: 'array', items: { type: 'object', additionalProperties: false, properties: {
        actionType: { type: 'string', enum: ['UPLOAD_DOCUMENT','PROVIDE_SOURCE','PROVIDE_CONTEXT','VERIFY_FACT','OBTAIN_INDEPENDENT_CORROBORATION','CLARIFY_CLAIM','COUNSEL_REVIEW'] },
        description: { type: 'string' },
        priority: { type: 'string', enum: ['HIGH','MEDIUM','LOW'] },
      }, required: ['actionType','description','priority'] } },
    }, required: ['scope','targetId','type','description','recommendedActions'],
  } } },
  required: ['gaps'],
} as const

function parse(content: string): GapGenerationOutput {
  let value = content.trim()
  if (value.startsWith('```')) value = value.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()
  const first = value.indexOf('{'); const last = value.lastIndexOf('}')
  if (first >= 0 && last > first) value = value.slice(first, last + 1)
  return JSON.parse(value) as GapGenerationOutput
}

function validate(input: GapGenerationInput, output: GapGenerationOutput) {
  const criterionIds = new Set(input.criterionResults.map(item => item.criterionId))
  const propositionIds = new Set(input.criterionResults.flatMap(item => item.propositionResults.map(p => p.propositionId)))
  for (const gap of output.gaps) {
    if (gap.scope === 'CRITERION' && !criterionIds.has(gap.targetId)) throw new Error(`AI gap output returned unknown criterion: ${gap.targetId}`)
    if (gap.scope === 'PROPOSITION' && !propositionIds.has(gap.targetId)) throw new Error(`AI gap output returned unknown proposition: ${gap.targetId}`)
  }
}

export async function generateGapsAndActions(input: GapGenerationInput, invokeAI: GapAIInvoker): Promise<AIContractResult<GapGenerationOutput>> {
  const modelInput = {
    criterionResults: input.criterionResults.map(result => ({
      criterionId: result.criterionId,
      claimFit: result.claimFit,
      overallEvidenceStatus: result.overallEvidenceStatus,
      counselReview: result.counselReview,
      gaps: result.gaps,
      propositionResults: result.propositionResults.map(item => ({
        propositionId: item.propositionId,
        status: item.status,
        rationale: item.rationale,
        missingInformation: item.missingInformation,
      })),
    })),
    comparableEvidence: input.comparableEvidence.map(item => ({ criterionId: item.criterionId, status: item.status, applicabilityRationale: item.applicabilityRationale })),
    finalMerits: input.finalMerits ? { sustainedAcclaim: input.finalMerits.sustainedAcclaim, recognizedAchievements: input.finalMerits.recognizedAchievements, fieldStanding: input.finalMerits.fieldStanding, unresolvedIssues: input.finalMerits.unresolvedIssues } : undefined,
    continueWork: input.continueWork ? { relationshipToExpertise: input.continueWork.relationshipToExpertise, evidenceStatus: input.continueWork.evidenceStatus, gaps: input.continueWork.gaps } : undefined,
    usBenefit: input.usBenefit ? { status: input.usBenefit.status, gaps: input.usBenefit.gaps } : undefined,
  }
  const systemPrompt = `You are VisaPilot's EB-1A gap analysis assistant. Identify unresolved evidence or factual issues from the supplied Stage 5 results and propose concrete next actions. You are not deciding eligibility, final merits, USCIS approval, or legal sufficiency. Use only supplied data. Never invent evidence. A gap means something remains missing, weak, unverified, conflicting, ambiguous, or requires professional review; it does not mean the candidate fails. Preserve target IDs exactly. Keep actions specific and evidence-oriented. Return only JSON matching the supplied schema.`
  const userPrompt = `STAGE 5 RESULTS:\n${JSON.stringify(modelInput)}\n\nRULE VERSION: ${input.criterionResults[0]?.ruleVersion ?? 'EB1A-2026-09'}\nGenerate the structured gap analysis.`
  const result = await invokeAI({ operation: 'GENERATE_GAPS_AND_ACTIONS', systemPrompt, userPrompt, responseSchema: schema, responseSchemaName: 'visapilot_eb1a_gap_generation' })
  const output = parse(result.content)
  validate(input, output)
  const execution: AIExecutionRecord = {
    id: `AI-GAPS-${Date.now().toString(36)}`,
    operation: 'GENERATE_GAPS_AND_ACTIONS',
    modelProvider: result.provider,
    modelName: result.model,
    promptVersion: PROMPT_VERSION,
    ruleVersion: input.criterionResults[0]?.ruleVersion ?? 'EB1A-2026-09',
    inputReferences: input.criterionResults.map(item => item.criterionId),
    outputValidated: true,
    createdAt: new Date().toISOString(),
  }
  return { output, execution }
}
