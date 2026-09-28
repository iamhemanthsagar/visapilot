import type {
  AIContractResult,
  MapClaimsToCriteriaContractOutput,
} from './contract'

import type {
  AIExecutionRecord,
  MapClaimsToCriteriaInput,
} from '../../types/visa/eb1a'

const MAPPING_PROMPT_VERSION =
  'EB1A-MAP-2026-09-01'

/**
 * Provider-independent structured AI invocation.
 *
 * The mapper does NOT know:
 * - which provider is being used
 * - which model is being used
 * - API keys
 * - provider URLs
 * - fallback order
 *
 * The provider router supplies this implementation.
 */
export type StructuredAIInvoker = (request: {
  operation: 'MAP_CLAIMS_TO_CRITERIA'
  systemPrompt: string
  userPrompt?: string
  responseSchema: unknown
  responseSchemaName: string
}) => Promise<{
  content: string
  provider: string
  model: string
}>

const mappingSchema = {
  type: 'object',
  additionalProperties: false,

  properties: {
    mappings: {
      type: 'array',

      items: {
        type: 'object',
        additionalProperties: false,

        properties: {
          claimId: {
            type: 'string',
          },

          criterionId: {
            type: 'string',
          },

          fit: {
            type: 'string',
            enum: [
              'NOT_RELEVANT',
              'POTENTIAL_MATCH',
              'PARTIAL_MATCH',
              'NOT_A_MATCH',
              'UNCLEAR',
            ],
          },

          rationale: {
            type: 'string',
          },

          confidence: {
            type: 'string',
            enum: [
              'HIGH',
              'MEDIUM',
              'LOW',
            ],
          },

          propositionAssessments: {
            type: 'array',

            items: {
              type: 'object',
              additionalProperties: false,

              properties: {
                propositionId: {
                  type: 'string',
                },

                status: {
                  type: 'string',
                  enum: [
                    'SUPPORTED_BY_CLAIM',
                    'PARTIALLY_ESTABLISHED',
                    'NOT_ESTABLISHED',
                    'UNCLEAR',
                  ],
                },

                rationale: {
                  type: 'string',
                },
              },

              required: [
                'propositionId',
                'status',
                'rationale',
              ],
            },
          },

          unresolvedQuestions: {
            type: 'array',

            items: {
              type: 'string',
            },
          },

          ambiguities: {
            type: 'array',

            items: {
              type: 'string',
            },
          },

          unsupportedAssertions: {
            type: 'array',

            items: {
              type: 'string',
            },
          },

          evidenceNeeded: {
            type: 'array',

            items: {
              type: 'string',
            },
          },
        },

        required: [
          'claimId',
          'criterionId',
          'fit',
          'rationale',
          'confidence',
          'propositionAssessments',
          'unresolvedQuestions',
          'ambiguities',
          'unsupportedAssertions',
          'evidenceNeeded',
        ],
      },
    },
  },

  required: [
    'mappings',
  ],
} as const

function buildPrompt(input: MapClaimsToCriteriaInput) {
  /*
   * Do not send the entire CandidateClaim object.
   *
   * CandidateClaim contains provenance, criterion candidates,
   * timestamps and other internal state that the model does not
   * need for semantic mapping. Keeping this payload compact also
   * prevents provider token-limit failures.
   */
  const modelClaims = input.claims.map(claim => ({
    id: claim.id,
    text: claim.text,
    normalizedType:
      claim.normalizedType ?? 'OTHER',

    extractedFacts: {
      sectionTitle:
        claim.extractedFacts.sectionTitle ?? null,

      sourcePage:
        claim.extractedFacts.sourcePage ?? null,

      verificationStatus:
        claim.extractedFacts.verificationStatus ?? null,

      verificationReason:
        claim.extractedFacts.verificationReason ?? null,

      claimSafetyFlags:
        claim.claimSafetyFlags,
    },
  }))

  const modelCriteria = input.criteria.map(
    criterion => ({
      id: criterion.id,
      code: criterion.code,
      title: criterion.title,
      regulatoryRequirement:
        criterion.regulatoryRequirement,
      propositionDefinitions:
        criterion.propositionDefinitions,
    }),
  )

  const systemPrompt = `You are VisaPilot's EB-1A claim-to-criterion semantic mapping engine.

Your task is ONLY to determine whether each supplied candidate claim is potentially relevant to the supplied EB-1A criteria and propositions.

You are NOT deciding:
- EB-1A eligibility
- whether a criterion is satisfied
- whether evidence is legally sufficient
- whether USCIS would accept the claim
- final merits
- overall petition readiness

Those decisions belong to later deterministic and evidence-reconciliation stages.

IMPORTANT RULES:
1. Use ONLY the supplied claims, candidate context, criteria, and propositions.
2. Do not invent facts.
3. Do not assume missing evidence exists.
4. A claim can be potentially relevant even when evidence is missing.
5. Missing evidence does NOT automatically make a claim NOT_RELEVANT.
6. Distinguish semantic relevance from proof.
7. A claim may map to multiple criteria.
8. Multiple claims may map to the same criterion.
9. Do not force every claim into a criterion.
10. Preserve ambiguity rather than guessing.
11. Every mapping MUST contain the exact supplied claimId.
12. Do not create claim IDs.
13. Do not return mappings for claims that were not supplied.
14. Do not treat titles, prestige, awards, publications, patents, media mentions, salary, team size, or other facts as automatically satisfying a criterion.
15. For C5, identifying a contribution does NOT establish major significance.
16. For C8, describing a senior role does NOT establish a leading/critical role or distinguished organizational reputation.
17. For C1, an award mention does NOT establish that the candidate personally received a qualifying award.
18. For C2, membership does NOT establish that outstanding achievement was required for admission.
19. For C3, mentioning a candidate does NOT automatically mean published material is ABOUT the candidate.
20. For C4, an invitation or participation does NOT automatically establish actual judging.
21. For C6, an article/blog does NOT automatically establish a scholarly article.
22. For C7, an invitation does NOT automatically establish display of artistic work.
23. For C9, a salary amount alone does NOT establish that it is high relative to others in the field.
24. For C10, commercial activity outside the performing arts should not be forced into this criterion.
25. If a claim has no meaningful relationship to any supplied criterion, do not create a mapping for it.
26. A single claim may legitimately produce multiple mappings when it is relevant to multiple criteria.
27. Do not use the presence or absence of a mapping as a determination of legal eligibility.

Return ONLY the JSON object matching the supplied schema.`

  /*
   * Candidate data is deliberately placed in a user message.
   * This is required by some structured-output providers and
   * also cleanly separates instructions from data.
   */
  const userPrompt = `CANDIDATE CONTEXT:
${JSON.stringify(input.candidateContext)}

CANDIDATE CLAIMS:
${JSON.stringify(modelClaims)}

CRITERIA AND PROPOSITIONS:
${JSON.stringify(modelCriteria)}

Generate the structured JSON mapping now.`

  return {
    systemPrompt,
    userPrompt,
  }
}

function validateMappingShape(
  output: unknown,
): asserts output is MapClaimsToCriteriaContractOutput {
  if (
    !output ||
    typeof output !== 'object' ||
    Array.isArray(output)
  ) {
    throw new Error(
      'AI mapping output must be a JSON object.',
    )
  }

  const mappings =
    (
      output as {
        mappings?: unknown
      }
    ).mappings

  if (!Array.isArray(mappings)) {
    throw new Error(
      'AI mapping output is missing the mappings array.',
    )
  }

  const fits = new Set([
    'NOT_RELEVANT',
    'POTENTIAL_MATCH',
    'PARTIAL_MATCH',
    'NOT_A_MATCH',
    'UNCLEAR',
  ])

  const confidences = new Set([
    'HIGH',
    'MEDIUM',
    'LOW',
  ])

  const propositionStatuses =
    new Set([
      'SUPPORTED_BY_CLAIM',
      'PARTIALLY_ESTABLISHED',
      'NOT_ESTABLISHED',
      'UNCLEAR',
    ])

  mappings.forEach(
    (mapping, index) => {
      if (
        !mapping ||
        typeof mapping !== 'object' ||
        Array.isArray(mapping)
      ) {
        throw new Error(
          `AI mapping at index ${index} is not an object.`,
        )
      }

      const item =
        mapping as Record<string, unknown>

      const requiredStrings = [
        'claimId',
        'criterionId',
        'rationale',
      ]

      for (
        const field of requiredStrings
      ) {
        if (
          typeof item[field] !==
            'string' ||
          !item[field]
        ) {
          throw new Error(
            `AI mapping at index ${index} has an invalid ${field}.`,
          )
        }
      }

      if (
        typeof item.fit !== 'string' ||
        !fits.has(item.fit)
      ) {
        throw new Error(
          `AI mapping at index ${index} has an invalid fit.`,
        )
      }

      if (
        typeof item.confidence !==
          'string' ||
        !confidences.has(
          item.confidence,
        )
      ) {
        throw new Error(
          `AI mapping at index ${index} has an invalid confidence.`,
        )
      }

      for (
        const field of [
          'unresolvedQuestions',
          'ambiguities',
          'unsupportedAssertions',
          'evidenceNeeded',
        ]
      ) {
        if (
          !Array.isArray(item[field]) ||
          !(
            item[field] as unknown[]
          ).every(
            value =>
              typeof value ===
              'string',
          )
        ) {
          throw new Error(
            `AI mapping at index ${index} has an invalid ${field} array.`,
          )
        }
      }

      if (
        !Array.isArray(
          item.propositionAssessments,
        )
      ) {
        throw new Error(
          `AI mapping at index ${index} has an invalid propositionAssessments array.`,
        )
      }

      ;(
        item.propositionAssessments as unknown[]
      ).forEach(
        (
          assessment,
          propositionIndex,
        ) => {
          if (
            !assessment ||
            typeof assessment !==
              'object' ||
            Array.isArray(
              assessment,
            )
          ) {
            throw new Error(
              `AI proposition assessment ${index}.${propositionIndex} is invalid.`,
            )
          }

          const proposition =
            assessment as Record<
              string,
              unknown
            >

          if (
            typeof proposition.propositionId !==
                'string' ||
            !proposition.propositionId
          ) {
            throw new Error(
              `AI proposition assessment ${index}.${propositionIndex} has an invalid propositionId.`,
            )
          }

          if (
            typeof proposition.status !==
                'string' ||
            !propositionStatuses.has(
              proposition.status,
            )
          ) {
            throw new Error(
              `AI proposition assessment ${index}.${propositionIndex} has an invalid status.`,
            )
          }

          if (
            typeof proposition.rationale !==
              'string'
          ) {
            throw new Error(
              `AI proposition assessment ${index}.${propositionIndex} has an invalid rationale.`,
            )
          }
        },
      )
    },
  )
}

function validateMappingOutput(
  input: MapClaimsToCriteriaInput,
  output: MapClaimsToCriteriaContractOutput,
) {
  const validClaimIds =
    new Set(
      input.claims.map(
        claim => claim.id,
      ),
    )

  const validCriterionIds =
    new Set(
      input.criteria.map(
        criterion => criterion.id,
      ),
    )

  const validMappings = []

  for (const mapping of output.mappings) {
    // Resolve claim ID (direct match or prefix recovery)
    let resolvedClaimId = validClaimIds.has(mapping.claimId) ? mapping.claimId : null
    if (!resolvedClaimId) {
      for (const id of validClaimIds) {
        if (id.includes(mapping.claimId) || mapping.claimId.includes(id)) {
          resolvedClaimId = id
          break
        }
      }
    }

    if (!resolvedClaimId) {
      console.warn(`[VisaPilot] Skipping mapping with unknown claim ID: ${mapping.claimId}`)
      continue
    }

    // Resolve criterion ID
    let resolvedCriterionId = validCriterionIds.has(mapping.criterionId) ? mapping.criterionId : null
    if (!resolvedCriterionId) {
      const cleanCode = mapping.criterionId.replace(/^(EB1A|EB1B|EB1C)-/, '')
      for (const id of validCriterionIds) {
        if (id.endsWith(`-${cleanCode}`) || id === cleanCode) {
          resolvedCriterionId = id
          break
        }
      }
    }

    if (!resolvedCriterionId) {
      console.warn(`[VisaPilot] Skipping mapping with unknown criterion ID: ${mapping.criterionId}`)
      continue
    }

    const criterion = input.criteria.find(item => item.id === resolvedCriterionId)
    if (!criterion) continue

    const propositionIds = new Set(criterion.propositionDefinitions.map(p => p.id))
    const validAssessments = mapping.propositionAssessments.filter(a => propositionIds.has(a.propositionId))

    validMappings.push({
      ...mapping,
      claimId: resolvedClaimId,
      criterionId: resolvedCriterionId,
      propositionAssessments: validAssessments,
    })
  }

  output.mappings = validMappings
}

function createExecutionRecord(
  provider: string,
  model: string,
  input: MapClaimsToCriteriaInput,
  outputValidated: boolean,
  executionId: string,
): AIExecutionRecord {
  return {
    id: executionId,

    operation:
      'MAP_CLAIMS_TO_CRITERIA',

    modelProvider:
      provider,

    modelName:
      model,

    promptVersion:
      MAPPING_PROMPT_VERSION,

    ruleVersion:
      'EB1A-2026-09',

    /*
     * Preserve traceability to every claim
     * and every criterion supplied to the model.
     */
    inputReferences: [
      ...input.claims.map(
        claim => claim.id,
      ),

      ...input.criteria.map(
        criterion =>
          criterion.id,
      ),
    ],

    outputValidated,

    createdAt:
      new Date().toISOString(),
  }
}

function parseModelOutput(
  content: string,
): MapClaimsToCriteriaContractOutput {
  let value =
    content.trim()

  /*
   * Some providers may still wrap JSON
   * in markdown code fences.
   */
  if (
    value.startsWith('```')
  ) {
    value =
      value
        .replace(
          /^```(?:json)?\s*/i,
          '',
        )
        .replace(
          /\s*```$/i,
          '',
        )
        .trim()
  }

  /*
   * Recover the JSON object if the model
   * added accidental surrounding text.
   */
  const firstBrace =
    value.indexOf('{')

  const lastBrace =
    value.lastIndexOf('}')

  if (
    firstBrace >= 0 &&
    lastBrace > firstBrace
  ) {
    value =
      value.slice(
        firstBrace,
        lastBrace + 1,
      )
  }

  return JSON.parse(
    value,
  ) as MapClaimsToCriteriaContractOutput
}

/**
 * Provider-independent EB-1A claim → criterion mapper.
 *
 * The operation is intentionally batch-based:
 *
 *   CandidateClaim[]
 *          ↓
 *   one structured AI invocation
 *          ↓
 *   mappings[]
 *
 * The mapper itself contains NO:
 * - provider URLs
 * - API keys
 * - provider SDKs
 * - fallback logic
 * - model selection
 */
export async function mapClaimsToCriteria(
  input: MapClaimsToCriteriaInput,
  invokeAI: StructuredAIInvoker,
): Promise<
  AIContractResult<
    MapClaimsToCriteriaContractOutput
  >
> {
  if (
    input.claims.length === 0
  ) {
    throw new Error(
      'Cannot map claims to criteria: no candidate claims were supplied.',
    )
  }

  if (
    input.criteria.length === 0
  ) {
    throw new Error(
      'Cannot map claims to criteria: no EB-1A criteria were supplied.',
    )
  }

  const result =
    await invokeAI({
      operation:
        'MAP_CLAIMS_TO_CRITERIA',

      ...buildPrompt(input),

      responseSchema:
        mappingSchema,

      responseSchemaName:
        'eb1a_claim_criterion_mapping',
    })

  if (
    !result.content
  ) {
    throw new Error(
      'AI mapping request returned no structured content.',
    )
  }

  const output =
    parseModelOutput(
      result.content,
    )

  validateMappingShape(output)

  validateMappingOutput(
    input,
    output,
  )

  const executionId =
    `ai-map-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}`

  return {
    output,

    execution:
      createExecutionRecord(
        result.provider,
        result.model,
        input,
        true,
        executionId,
      ),
  }
}