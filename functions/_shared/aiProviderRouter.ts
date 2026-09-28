export interface AIProviderEnv {
  GROQ_API_KEY?: string
  GROQ_MODEL?: string

  OPENROUTER_API_KEY?: string
  OPENROUTER_MODEL?: string

  GEMINI_API_KEY?: string
  GOOGLE_AI_STUDIO_KEY?: string
  GEMINI_MODEL?: string

  COHERE_API_KEY?: string
  COHERE_MODEL?: string

  MISTRAL_API_KEY?: string
  MISTRAL_MODEL?: string

  NVIDIA_NIM_API_KEY_1?: string
  NVIDIA_MODEL_1?: string

  NVIDIA_NIM_API_KEY_2?: string
  NVIDIA_MODEL_2?: string

  // Local LLM (LM Studio) — dev only, never required in production
  USE_LOCAL_MODEL?: string
  LOCAL_LLM_ENDPOINT?: string
  LOCAL_LLM_MODEL?: string
}

export type AIProviderAttemptStatus =
  | 'SUCCESS'
  | 'FAILED'
  | 'SKIPPED'

export type AIProviderAttempt = {
  provider: string
  model: string
  status: AIProviderAttemptStatus
  latencyMs: number
  actualModel?: string
  statusCode?: number
  error?: string
  reason?: string
}

export type StructuredAIRequest = {
  operation: string
  systemPrompt: string
  userPrompt?: string
  responseSchema: unknown
  responseSchemaName: string
}

export type StructuredAIResult = {
  content: string
  provider: string
  model: string
  fallbackUsed: boolean
  attempts: AIProviderAttempt[]
  latencyMs: number
}

type ProviderResult = {
  content: string
  actualModel: string
}

type ProviderDefinition = {
  name: string
  model: string
  key?: string
  call: () => Promise<ProviderResult>
}

const PROVIDER_TIMEOUT_MS = 30_000
// Local models are much slower — give them up to 3 minutes
const LOCAL_PROVIDER_TIMEOUT_MS = 180_000

function buildMessages(
  systemPrompt: string,
  userPrompt?: string,
) {
  const messages: Array<{
    role: 'system' | 'user'
    content: string
  }> = [
    {
      role: 'system',
      content: systemPrompt,
    },
  ]

  if (userPrompt) {
    messages.push({
      role: 'user',
      content: userPrompt,
    })
  }

  return messages
}

async function readProviderError(
  response: Response,
) {
  const body = await response.text()

  let message = body

  try {
    const parsed = JSON.parse(body)

    message =
      parsed?.error?.message ||
      parsed?.message ||
      body
  } catch {
    // Keep raw response text.
  }

  return {
    statusCode: response.status,
    message: `${response.status} ${response.statusText}: ${message}`,
  }
}

async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number,
) {
  const controller = new AbortController()

  const timeout = setTimeout(() => {
    controller.abort()
  }, timeoutMs)

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    })
  } catch (error) {
    if (
      error instanceof Error &&
      error.name === 'AbortError'
    ) {
      throw new Error(
        `Provider request timed out after ${timeoutMs / 1000}s.`,
      )
    }

    throw error
  } finally {
    clearTimeout(timeout)
  }
}

function createStructuredResponseFormat(
  responseSchemaName: string,
  responseSchema: unknown,
) {
  return {
    type: 'json_schema',
    json_schema: {
      name: responseSchemaName,
      strict: true,
      schema: responseSchema,
    },
  }
}

async function callOpenAICompatibleProvider(
  providerName: string,
  url: string,
  apiKey: string,
  model: string,
  requestBody: Record<string, unknown>,
  timeoutMs = PROVIDER_TIMEOUT_MS,
): Promise<ProviderResult> {
  console.log(
    `[VisaPilot] ${providerName} → sending request`,
  )

  const response =
    await fetchWithTimeout(
      url,
      {
        method: 'POST',

        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },

        body: JSON.stringify({
          model,
          ...requestBody,
        }),
      },
      timeoutMs,
    )

  if (!response.ok) {
    const providerError =
      await readProviderError(response)

    throw Object.assign(
      new Error(providerError.message),
      {
        statusCode:
          providerError.statusCode,
      },
    )
  }

  const payload =
    await response.json() as {
      choices?: Array<{
        message?: {
          content?: string
        }
      }>
      model?: string
    }

  const content =
    payload.choices?.[0]?.message?.content

  if (!content) {
    throw new Error(
      'Provider returned no message content.',
    )
  }

  return {
    content,
    actualModel:
      payload.model || model,
  }
}

async function callCohere(
  apiKey: string,
  model: string,
  requestBody: Record<string, unknown>,
): Promise<ProviderResult> {
  console.log(
    '[VisaPilot] Cohere → sending request',
  )

  const response =
    await fetchWithTimeout(
      'https://api.cohere.com/v2/chat',
      {
        method: 'POST',

        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },

        body: JSON.stringify({
          model,
          ...requestBody,
        }),
      },
      PROVIDER_TIMEOUT_MS,
    )

  if (!response.ok) {
    const providerError =
      await readProviderError(response)

    throw Object.assign(
      new Error(providerError.message),
      {
        statusCode:
          providerError.statusCode,
      },
    )
  }

  const payload =
    await response.json() as {
      message?: {
        content?: Array<{
          type?: string
          text?: string
        }>
      }
    }

  const content =
    payload.message?.content?.find(
      item => item.type === 'text',
    )?.text

  if (!content) {
    throw new Error(
      'Cohere returned no text content.',
    )
  }

  return {
    content,
    actualModel: model,
  }
}

function getErrorDetails(
  error: unknown,
) {
  const message =
    error instanceof Error
      ? error.message
      : String(error)

  const statusCode =
    typeof error === 'object' &&
    error !== null &&
    'statusCode' in error
      ? Number(
          (
            error as {
              statusCode?: number
            }
          ).statusCode,
        )
      : undefined

  return {
    message,
    statusCode,
  }
}

/**
 * Common VisaPilot AI provider router.
 *
 * Responsibilities:
 * - provider ordering
 * - API-key availability
 * - model selection
 * - provider-specific request formatting
 * - timeout handling
 * - sequential fallback
 * - provider execution telemetry
 *
 * It does NOT:
 * - interpret the AI output
 * - validate domain-specific schemas
 * - make legal decisions
 * - know anything about EB-1A criteria
 */
export async function invokeStructuredAI(
  env: AIProviderEnv,
  request: StructuredAIRequest,
): Promise<StructuredAIResult> {
  const requestStartedAt = Date.now()

  console.log(
    '[VisaPilot] ========================================',
  )

  console.log(
    `[VisaPilot] AI operation → ${request.operation}`,
  )

  const messages =
    buildMessages(
      request.systemPrompt,
      request.userPrompt,
    )

  const structuredResponseFormat =
    createStructuredResponseFormat(
      request.responseSchemaName,
      request.responseSchema,
    )

  const providers: ProviderDefinition[] = [
    // ─── Local LLM (LM Studio) ──────────────────────────────────────────────
    // Active only when USE_LOCAL_MODEL=true in .dev.vars.
    // If the local server is down or fails, falls through to cloud providers.
    // Set USE_LOCAL_MODEL=false (or delete the line) to skip entirely.
    ...(env.USE_LOCAL_MODEL === 'true' && env.LOCAL_LLM_ENDPOINT
      ? [{
          name: 'LM Studio (Local)',
          model: env.LOCAL_LLM_MODEL || 'local-model',
          key: 'local',  // LM Studio ignores the key — dummy value required by ProviderDefinition
          call: () => callOpenAICompatibleProvider(
            'LM Studio (Local)',
            env.LOCAL_LLM_ENDPOINT!,
            'local',
            env.LOCAL_LLM_MODEL || 'local-model',
            {
              temperature: 0,
              messages,
              // LM Studio accepts only 'json_schema' or 'text'.
              // Use 'text' — parseModelOutput() handles raw JSON extraction from the text response.
              response_format: { type: 'text' },
            },
            LOCAL_PROVIDER_TIMEOUT_MS,  // 3 min — local models are much slower than cloud APIs
          ),
        }]
      : []),
    // ─── Cloud Providers ─────────────────────────────────────────────────────
    {
      name: 'Groq',
      model:
        env.GROQ_MODEL ||
        'openai/gpt-oss-120b',
      key: env.GROQ_API_KEY,
      call: () =>
        callOpenAICompatibleProvider(
          'Groq',
          'https://api.groq.com/openai/v1/chat/completions',
          env.GROQ_API_KEY!,
          env.GROQ_MODEL ||
            'openai/gpt-oss-120b',
          {
            temperature: 0,
            max_tokens: 12000,
            messages,
            response_format:
              structuredResponseFormat,
          },
        ),
    },

    {
      name: 'OpenRouter',
      model:
        env.OPENROUTER_MODEL ||
        'openrouter/auto',
      key:
        env.OPENROUTER_API_KEY,
      call: () =>
        callOpenAICompatibleProvider(
          'OpenRouter',
          'https://openrouter.ai/api/v1/chat/completions',
          env.OPENROUTER_API_KEY!,
          env.OPENROUTER_MODEL ||
            'openrouter/auto',
          {
            temperature: 0,
            messages,
            response_format:
              structuredResponseFormat,
          },
        ),
    },

    {
      name: 'Google AI Studio (Gemini)',
      model:
        env.GEMINI_MODEL ||
        'gemini-2.0-flash',
      key:
        env.GEMINI_API_KEY ||
        env.GOOGLE_AI_STUDIO_KEY,
      call: () =>
        callOpenAICompatibleProvider(
          'Google AI Studio (Gemini)',
          'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
          (env.GEMINI_API_KEY || env.GOOGLE_AI_STUDIO_KEY)!,
          env.GEMINI_MODEL ||
            'gemini-2.0-flash',
          {
            temperature: 0,
            messages,
            response_format: { type: 'json_object' },
          },
        ),
    },

    {
      name: 'Cohere',
      model:
        env.COHERE_MODEL ||
        'command-a-plus-05-2026',
      key:
        env.COHERE_API_KEY,
      call: () =>
        callCohere(
          env.COHERE_API_KEY!,
          env.COHERE_MODEL ||
            'command-a-plus-05-2026',
          {
            temperature: 0,
            messages,
            response_format: {
              type: 'json_object',
              schema: request.responseSchema,
            },
          },
        ),
    },

    {
      name: 'Mistral',
      model:
        env.MISTRAL_MODEL ||
        'mistral-medium-3-5',
      key: env.MISTRAL_API_KEY,
      call: () =>
        callOpenAICompatibleProvider(
          'Mistral',
          'https://api.mistral.ai/v1/chat/completions',
          env.MISTRAL_API_KEY!,
          env.MISTRAL_MODEL ||
            'mistral-medium-3-5',
          {
            temperature: 0,
            messages,
            response_format: {
              type: 'json_schema',
              json_schema: {
                name:
                  request.responseSchemaName,
                strict: true,
                schema:
                  request.responseSchema,
              },
            },
          },
        ),
    },

    {
      name: 'NVIDIA NIM #1',
      model:
        env.NVIDIA_MODEL_1 ||
        'z-ai/glm-5.3',
      key:
        env.NVIDIA_NIM_API_KEY_1,
      call: () =>
        callOpenAICompatibleProvider(
          'NVIDIA NIM #1',
          'https://integrate.api.nvidia.com/v1/chat/completions',
          env.NVIDIA_NIM_API_KEY_1!,
          env.NVIDIA_MODEL_1 ||
            'z-ai/glm-5.3',
          {
            temperature: 0,
            max_tokens:
              12000,
            messages,
            response_format: structuredResponseFormat,
          },
        ),
    },

    {
      name: 'NVIDIA NIM #2',
      model:
        env.NVIDIA_MODEL_2 ||
        'z-ai/glm-5.3-flash',
      key:
        env.NVIDIA_NIM_API_KEY_2,
      call: () =>
        callOpenAICompatibleProvider(
          'NVIDIA NIM #2',
          'https://integrate.api.nvidia.com/v1/chat/completions',
          env.NVIDIA_NIM_API_KEY_2!,
          env.NVIDIA_MODEL_2 ||
            'z-ai/glm-5.3-flash',
          {
            temperature: 0,
            max_tokens:
              12000,
            messages,
            response_format: structuredResponseFormat,
          },
        ),
    },
  ]

  const attempts: AIProviderAttempt[] = []

  for (
    let index = 0;
    index < providers.length;
    index += 1
  ) {
    const provider =
      providers[index]

    if (!provider.key) {
      console.log(
        `[VisaPilot] Attempt ${index + 1}/6 → ${provider.name} SKIPPED (no API key configured)`,
      )

      attempts.push({
        provider:
          provider.name,

        model:
          provider.model,

        status:
          'SKIPPED',

        latencyMs: 0,

        reason:
          'API key not configured',
      })

      continue
    }

    const providerStartedAt =
      Date.now()

    console.log(
      `[VisaPilot] Attempt ${index + 1}/6 → ${provider.name}`,
    )

    console.log(
      `[VisaPilot] Model → ${provider.model}`,
    )

    try {
      const result =
        await provider.call()

      const latencyMs =
        Date.now() -
        providerStartedAt

      console.log(
        `[VisaPilot] ${provider.name} → SUCCESS (${latencyMs}ms)`,
      )

      attempts.push({
        provider:
          provider.name,

        model:
          provider.model,

        actualModel:
          result.actualModel,

        status:
          'SUCCESS',

        latencyMs,
      })

      const fallbackUsed =
        attempts.some(
          attempt =>
            attempt.status ===
            'FAILED',
        )

      const totalLatency =
        Date.now() -
        requestStartedAt

      console.log(
        `[VisaPilot] Fallback used → ${
          fallbackUsed
            ? 'YES'
            : 'NO'
        }`,
      )

      console.log(
        `[VisaPilot] ${request.operation} completed in ${totalLatency}ms`,
      )

      console.log(
        '[VisaPilot] ========================================',
      )

      return {
        content:
          result.content,

        provider:
          provider.name,

        model:
          result.actualModel,

        fallbackUsed,

        attempts,

        latencyMs:
          totalLatency,
      }
    } catch (error) {
      const latencyMs =
        Date.now() -
        providerStartedAt

      const {
        message,
        statusCode,
      } =
        getErrorDetails(error)

      console.error(
        `[VisaPilot] ${provider.name} → FAILED (${latencyMs}ms)`,
      )

      console.error(
        `[VisaPilot] Error → ${message}`,
      )

      attempts.push({
        provider:
          provider.name,

        model:
          provider.model,

        status:
          'FAILED',

        latencyMs,

        statusCode,

        error:
          message,
      })

      console.log(
        '[VisaPilot] Falling back to next provider...',
      )
    }
  }

  console.error(
    `[VisaPilot] ALL CONFIGURED PROVIDERS FAILED for ${request.operation}`,
  )

  console.log(
    `[VisaPilot] Total request time: ${
      Date.now() -
      requestStartedAt
    }ms`,
  )

  console.log(
    '[VisaPilot] ========================================',
  )

  throw new Error(
    JSON.stringify({
      message:
        `All configured AI providers failed for operation ${request.operation}.`,

      attempts,
    }),
  )
}