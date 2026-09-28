import { config } from "dotenv";
import fs from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve("ai-lab");
const PROFILE_PATH = path.join(ROOT, "profile.txt");
const RESULTS_DIR = path.join(ROOT, "results");

config({
  path: path.join(ROOT, ".env")
});

const SYSTEM_PROMPT = `
You are VisaPilot's Profile Extraction Engine.

Your task is ONLY to extract structured information from the supplied professional profile/document.

You are NOT performing:
- visa eligibility analysis
- legal advice
- EB-1A scoring
- criterion qualification
- final merits analysis
- evidence adjudication

Rules:

1. Extract ONLY information supported by the supplied document.
2. NEVER invent facts.
3. Preserve the candidate's wording where useful.
4. Distinguish claims/assertions from verified evidence.
5. The profile itself is NOT independent verification.
6. Missing information does NOT mean the candidate lacks it.
7. Preserve ambiguity instead of resolving it by guessing.
8. Identify suspicious superlatives and unsupported quantitative claims.
9. Preserve source page numbers whenever possible.
10. Extract information even when it has no obvious visa relevance.
11. Do not discard unusual or miscellaneous information.
12. Sections must be DOCUMENT-DRIVEN. Do not force information into a predetermined section if it does not belong there.
13. If information does not fit another section, place it in otherItems.
14. Each item should contain the actual extracted information, not a placeholder.
15. Do not write long explanations. Extract facts compactly.
16. If something is explicitly claimed but not independently verified, mark it ASSERTED_UNVERIFIED.
17. If the document itself is ambiguous, mark it UNCLEAR.
18. Never transform marketing language into established fact.

Return ONLY valid JSON matching the requested schema.
`;

const EXTRACTION_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    candidate: {
      type: "object",
      additionalProperties: false,
      properties: {
        name: { type: ["string", "null"] },
        currentTitle: { type: ["string", "null"] },
        location: { type: ["string", "null"] },
        nationality: { type: ["string", "null"] },
        age: { type: ["number", "null"] }
      },
      required: [
        "name",
        "currentTitle",
        "location",
        "nationality",
        "age"
      ]
    },

    extraction: {
      type: "object",
      additionalProperties: false,
      properties: {
        quality: {
          type: "string",
          enum: ["BASIC", "GOOD", "RICH"]
        },
        confidence: {
          type: "string",
          enum: ["LOW", "MEDIUM", "HIGH"]
        }
      },
      required: ["quality", "confidence"]
    },

    sections: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          title: { type: "string" },
          items: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              properties: {
                text: { type: "string" },
                sourcePage: { type: ["number", "null"] }
              },
              required: ["text", "sourcePage"]
            }
          }
        },
        required: ["title", "items"]
      }
    },

    claims: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          text: { type: "string" },
          sourcePage: { type: ["number", "null"] },
          verificationStatus: {
            type: "string",
            enum: ["ASSERTED_UNVERIFIED", "UNCLEAR"]
          },
          verificationReason: { type: "string" }
        },
        required: [
          "text",
          "sourcePage",
          "verificationStatus",
          "verificationReason"
        ]
      }
    },

    ambiguities: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          text: { type: "string" },
          sourcePage: { type: ["number", "null"] }
        },
        required: ["text", "sourcePage"]
      }
    },

    otherItems: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          text: { type: "string" },
          sourcePage: { type: ["number", "null"] }
        },
        required: ["text", "sourcePage"]
      }
    }
  },

  required: [
    "candidate",
    "extraction",
    "sections",
    "claims",
    "ambiguities",
    "otherItems"
  ]
};

function cleanJsonText(text) {
  if (!text) {
    throw new Error("Model returned an empty response.");
  }

  let value = text.trim();

  if (value.startsWith("```")) {
    value = value
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();
  }

  const firstBrace = value.indexOf("{");
  const lastBrace = value.lastIndexOf("}");

  if (firstBrace >= 0 && lastBrace > firstBrace) {
    value = value.slice(firstBrace, lastBrace + 1);
  }

  return JSON.parse(value);
}

async function fetchWithTimeout(url, options, timeoutMs = 90000) {
  const controller = new AbortController();

  const timeout = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function parseResponseError(response) {
  const body = await response.text();

  let message = body;

  try {
    const json = JSON.parse(body);

    message =
      json?.error?.message ||
      json?.message ||
      body;
  } catch {
    // Keep raw response text.
  }

  return `${response.status} ${response.statusText}: ${message}`;
}

function buildUserPrompt(profileText) {
  return `
Extract the following professional profile into the required structured JSON.

IMPORTANT:

- Extract all meaningful information.
- Preserve actual details.
- Detect naturally occurring sections rather than using a fixed checklist.
- Keep publications, patents, awards, memberships, judging/reviewing,
  speaking, media, leadership, international experience, compensation,
  quantitative claims and unusual claims when present.
- Do not decide whether anything satisfies an immigration criterion.

DOCUMENT TEXT:

${profileText}
`;
}

async function callGroq(profileText) {
  const response = await fetchWithTimeout(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL,

        messages: [
          {
            role: "system",
            content: SYSTEM_PROMPT
          },
          {
            role: "user",
            content: buildUserPrompt(profileText)
          }
        ],

        temperature: 0,
        max_completion_tokens: 12000,
        reasoning_effort: "low",


        response_format: {
          type: "json_schema",
          json_schema: {
            name: "visa_profile_extraction",
            strict: true,
            schema: EXTRACTION_SCHEMA
          }
        }
      })
    }
  );

  if (!response.ok) {
    throw new Error(await parseResponseError(response));
  }

  const data = await response.json();

  return cleanJsonText(
    data.choices?.[0]?.message?.content
  );
}

async function callMistral(profileText) {
  const response = await fetchWithTimeout(
    "https://api.mistral.ai/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.MISTRAL_API_KEY}`,
        "Content-Type": "application/json"
      },

      body: JSON.stringify({
        model: process.env.MISTRAL_MODEL,

        messages: [
          {
            role: "system",
            content: SYSTEM_PROMPT
          },
          {
            role: "user",
            content: buildUserPrompt(profileText)
          }
        ],

        temperature: 0,

        response_format: {
          type: "json_schema",
          json_schema: {
            name: "visa_profile_extraction",
            schema: EXTRACTION_SCHEMA
          }
        }
      })
    }
  );

  if (!response.ok) {
    throw new Error(await parseResponseError(response));
  }

  const data = await response.json();

  return cleanJsonText(
    data.choices?.[0]?.message?.content
  );
}

async function callNvidia(apiKey, model, profileText) {
  const response = await fetchWithTimeout(
    "https://integrate.api.nvidia.com/v1/chat/completions",
    {
      method: "POST",

      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },

      body: JSON.stringify({
        model,

        messages: [
          {
            role: "system",
            content: SYSTEM_PROMPT
          },
          {
            role: "user",
            content: buildUserPrompt(profileText)
          }
        ],

        temperature: 0,
        max_tokens: 12000
      })
    }
  );

  if (!response.ok) {
    throw new Error(await parseResponseError(response));
  }

  const data = await response.json();

  return cleanJsonText(
    data.choices?.[0]?.message?.content
  );
}

async function callOpenRouter(profileText) {
  const response = await fetchWithTimeout(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      method: "POST",

      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://visapilot.ai",
        "X-Title": "VisaPilot AI Lab"
      },

      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL,

        messages: [
          {
            role: "system",
            content: SYSTEM_PROMPT
          },
          {
            role: "user",
            content: buildUserPrompt(profileText)
          }
        ],

        temperature: 0,

        response_format: {
          type: "json_schema",
          json_schema: {
            name: "visa_profile_extraction",
            strict: true,
            schema: EXTRACTION_SCHEMA
          }
        }
      })
    }
  );

  if (!response.ok) {
    throw new Error(await parseResponseError(response));
  }

  const data = await response.json();

  return {
    output: cleanJsonText(
      data.choices?.[0]?.message?.content
    ),

    actualModel: data.model || null
  };
}

async function callCohere(profileText) {
  const response = await fetchWithTimeout(
    "https://api.cohere.com/v2/chat",
    {
      method: "POST",

      headers: {
        Authorization: `Bearer ${process.env.COHERE_API_KEY}`,
        "Content-Type": "application/json"
      },

      body: JSON.stringify({
        model: process.env.COHERE_MODEL,

        messages: [
          {
            role: "system",
            content: SYSTEM_PROMPT
          },
          {
            role: "user",
            content: buildUserPrompt(profileText)
          }
        ],

        temperature: 0,

        response_format: {
          type: "json_object",
          schema: EXTRACTION_SCHEMA
        }
      })
    }
  );

  if (!response.ok) {
    throw new Error(await parseResponseError(response));
  }

  const data = await response.json();

  const text =
    data.message?.content?.find(
      (item) => item.type === "text"
    )?.text;

  return cleanJsonText(text);
}

/*
 * IMPORTANT:
 *
 * Providers are deliberately ordered.
 *
 * We DO NOT run all models.
 *
 * The next provider is called ONLY when
 * the previous provider fails.
 */

const providers = [
  {
    name: "Groq",
    model: process.env.GROQ_MODEL,
    key: process.env.GROQ_API_KEY,
    call: callGroq
  },

  {
    name: "Mistral",
    model: process.env.MISTRAL_MODEL,
    key: process.env.MISTRAL_API_KEY,
    call: callMistral
  },

  {
    name: "NVIDIA NIM #1",
    model: process.env.NVIDIA_MODEL_1,
    key: process.env.NVIDIA_NIM_API_KEY_1,

    call: (text) =>
      callNvidia(
        process.env.NVIDIA_NIM_API_KEY_1,
        process.env.NVIDIA_MODEL_1,
        text
      )
  },

  {
    name: "NVIDIA NIM #2",
    model: process.env.NVIDIA_MODEL_2,
    key: process.env.NVIDIA_NIM_API_KEY_2,

    call: (text) =>
      callNvidia(
        process.env.NVIDIA_NIM_API_KEY_2,
        process.env.NVIDIA_MODEL_2,
        text
      )
  },

  {
    name: "OpenRouter",
    model: process.env.OPENROUTER_MODEL,
    key: process.env.OPENROUTER_API_KEY,
    call: callOpenRouter
  },

  {
    name: "Cohere",
    model: process.env.COHERE_MODEL,
    key: process.env.COHERE_API_KEY,
    call: callCohere
  }
];

async function main() {
  const profileText = await fs.readFile(
    PROFILE_PATH,
    "utf8"
  );

  if (!profileText.trim()) {
    throw new Error(
      "ai-lab/profile.txt is empty."
    );
  }

  await fs.mkdir(
    RESULTS_DIR,
    { recursive: true }
  );

  console.log("");
  console.log(
    "=================================================="
  );
  console.log(
    "VISAPILOT AI LAB"
  );
  console.log(
    "RICH PROFILE EXTRACTION"
  );
  console.log(
    "=================================================="
  );

  console.log(
    `Input characters: ${profileText.length}`
  );

  console.log("");

  let successfulResult = null;

  const attempts = [];

  /*
   * SEQUENTIAL FALLBACK CHAIN
   *
   * Only one provider is called at a time.
   * Stop immediately after the first success.
   */

  for (const provider of providers) {
    if (!provider.key || !provider.model) {
      console.log(
        `[SKIP] ${provider.name} - key/model not configured`
      );

      attempts.push({
        provider: provider.name,
        model: provider.model || null,
        status: "SKIPPED",
        reason:
          "API key or model not configured"
      });

      continue;
    }

    console.log("");
    console.log(
      `[TRY ] ${provider.name}`
    );

    console.log(
      `       Model: ${provider.model}`
    );

    const started = Date.now();

    try {
      const result =
        await provider.call(profileText);

      const latencyMs =
        Date.now() - started;

      successfulResult = {
        provider: provider.name,

        configuredModel:
          provider.model,

        actualModel:
          result?.actualModel ||
          provider.model,

        status: "SUCCESS",

        latencyMs,

        result:
          result?.output ||
          result
      };

      attempts.push({
        provider: provider.name,

        model: provider.model,

        actualModel:
          result?.actualModel ||
          provider.model,

        status: "SUCCESS",

        latencyMs
      });

      console.log(
        `       SUCCESS in ${latencyMs}ms`
      );

      console.log(
        "       STOPPING FALLBACK CHAIN"
      );

      break;

    } catch (error) {
      const latencyMs =
        Date.now() - started;

      const message =
        error instanceof Error
          ? error.message
          : String(error);

      attempts.push({
        provider: provider.name,

        model: provider.model,

        status: "FAILED",

        latencyMs,

        error: message
      });

      console.log(
        `       FAILED in ${latencyMs}ms`
      );

      console.log(
        `       ${message}`
      );

      console.log(
        "       → Trying next provider..."
      );
    }
  }

  /*
   * SUCCESS
   */

  if (successfulResult) {
    const output = {
      inputCharacters:
        profileText.length,

      completedAt:
        new Date().toISOString(),

      fallbackUsed:
        attempts.some(
          (a) => a.status === "FAILED"
        ),

      attempts,

      finalProvider:
        successfulResult.provider,

      finalModel:
        successfulResult.actualModel,

      result:
        successfulResult.result
    };

    await fs.writeFile(
      path.join(
        RESULTS_DIR,
        "final-profile-extraction.json"
      ),

      JSON.stringify(
        output,
        null,
        2
      ),

      "utf8"
    );

    console.log("");

    console.log(
      "=================================================="
    );

    console.log(
      "PROFILE EXTRACTION SUCCESS"
    );

    console.log(
      "=================================================="
    );

    console.log(
      `Provider: ${successfulResult.provider}`
    );

    console.log(
      `Model: ${successfulResult.actualModel}`
    );

    console.log(
      `Fallback used: ${
        output.fallbackUsed
          ? "YES"
          : "NO"
      }`
    );

    console.log("");

    console.log(
      "Saved: ai-lab/results/final-profile-extraction.json"
    );

    console.log("");

  } else {
    /*
     * ALL PROVIDERS FAILED
     */

    const output = {
      inputCharacters:
        profileText.length,

      completedAt:
        new Date().toISOString(),

      status:
        "ALL_PROVIDERS_FAILED",

      attempts
    };

    await fs.writeFile(
      path.join(
        RESULTS_DIR,
        "final-profile-extraction.json"
      ),

      JSON.stringify(
        output,
        null,
        2
      ),

      "utf8"
    );

    console.log("");

    console.log(
      "=================================================="
    );

    console.log(
      "ALL PROVIDERS FAILED"
    );

    console.log(
      "=================================================="
    );

    for (const attempt of attempts) {
      console.log(
        `${attempt.provider}: ${attempt.status}`
      );
    }

    console.log("");
  }
}

main().catch((error) => {
  console.error("");

  console.error(
    "AI LAB FAILED"
  );

  console.error(
    error instanceof Error
      ? error.message
      : error
  );

  process.exit(1);
});