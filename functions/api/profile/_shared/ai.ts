import {
  invokeStructuredAI,
  type AIProviderEnv,
} from '../_shared/aiProviderRouter'

import {
  mapClaimsToCriteria,
  type StructuredAIInvoker,
} from '../../../../src/ai/eb1a/mapClaimsToCriteria'

import type {
  MapClaimsToCriteriaInput,
} from '../../../../src/types/visa/eb1a'

type AIRequest =
  | {
      operation: 'MAP_CLAIMS_TO_CRITERIA'
      input: MapClaimsToCriteriaInput
    }

type Env = AIProviderEnv

function errorResponse(
  message: string,
  status = 400,
) {
  return new Response(
    JSON.stringify({
      error: message,
    }),
    {
      status,

      headers: {
        'Content-Type':
          'application/json',

        'Cache-Control':
          'no-store',
      },
    },
  )
}

export async function onRequestPost(
  context: {
    request: Request
    env: Env
  },
) {
  console.log(
    '[VisaPilot] ========================================',
  )

  console.log(
    '[VisaPilot] AI gateway request received',
  )

  let body: AIRequest

  try {
    body =
      await context.request.json() as AIRequest
  } catch {
    return errorResponse(
      'Request body must be valid JSON.',
    )
  }

  if (
    !body ||
    body.operation !==
      'MAP_CLAIMS_TO_CRITERIA'
  ) {
    return errorResponse(
      'Unsupported or missing AI operation.',
    )
  }

  if (!body.input) {
    return errorResponse(
      'AI operation input is required.',
    )
  }

  try {
    const invokeAI:
      StructuredAIInvoker =
      async request => {
        const result =
          await invokeStructuredAI(
            context.env,
            request,
          )

        return {
          content:
            result.content,

          provider:
            result.provider,

          model:
            result.model,
        }
      }

    const result =
      await mapClaimsToCriteria(
        body.input,
        invokeAI,
      )

    console.log(
      `[VisaPilot] AI gateway → ${body.operation} SUCCESS`,
    )

    console.log(
      '[VisaPilot] ========================================',
    )

    return new Response(
      JSON.stringify({
        operation:
          body.operation,

        output:
          result.output,

        execution:
          result.execution,
      }),
      {
        status: 200,

        headers: {
          'Content-Type':
            'application/json',

          'Cache-Control':
            'no-store',
        },
      },
    )
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : String(error)

    console.error(
      '[VisaPilot] AI gateway failed',
    )

    console.error(
      `[VisaPilot] Error → ${message}`,
    )

    console.log(
      '[VisaPilot] ========================================',
    )

    return errorResponse(
      message,
      502,
    )
  }
}