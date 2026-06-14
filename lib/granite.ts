/**
 * Core IBM Watsonx / Granite API Client.
 * Handles IAM token lifecycle caching, requests execution, timeouts, and retries.
 */

const IAM_URL =
  "https://iam.cloud.ibm.com/identity/token";

const API_VERSION = "2023-05-29";

// Bounded limits suited for Next.js Serverless Functions (10s Vercel Hobby tier)
const DEFAULT_TIMEOUT_MS = 7_000;

const DEFAULT_MAX_RETRIES = 1;

const DEFAULT_MAX_TOKENS = 512;

const DEFAULT_TEMPERATURE = 0.2;

export interface GraniteMessage {
  role: "system" | "user" | "assistant";

  content: string;
}

export interface GraniteChatOptions {
  modelId?: string;

  maxTokens?: number;

  temperature?: number;

  timeoutMs?: number;

  retries?: number;
}

export interface GraniteUsage {
  promptTokens: number;

  completionTokens: number;

  totalTokens: number;
}

export interface GraniteChatResponse {
  text: string;

  usage: GraniteUsage;
}

interface WatsonxChatResponse {
  choices: Array<{
    message: {
      role: string;

      content: string;
    };
  }>;

  usage?: {
    prompt_tokens?: number;

    completion_tokens?: number;

    total_tokens?: number;
  };
}

let cachedToken: string | null = null;

let tokenExpiry = 0;

function getRequiredEnv(
  key: string
): string {
  const value = process.env[key];

  if (!value) {
    throw new Error(
      `Missing required environment variable: ${key}`
    );
  }

  return value;
}

// Requests an IAM token using the Watsonx API key and caches it in-memory.
// Cache is set for 50 minutes to avoid redundant network overhead on every request.
export async function getIamToken(): Promise<string> {
  const now = Date.now();

  if (
    cachedToken &&
    now < tokenExpiry
  ) {
    return cachedToken;
  }

  const apiKey =
    getRequiredEnv(
      "WATSONX_API_KEY"
    );

  const response = await fetch(
    IAM_URL,
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/x-www-form-urlencoded",
      },

      body: new URLSearchParams({
        grant_type:
          "urn:ibm:params:oauth:grant-type:apikey",

        apikey: apiKey,
      }),
    }
  );

  if (!response.ok) {
    throw new Error(
      `Failed to obtain IAM token (${response.status})`
    );
  }

  const data =
    (await response.json()) as {
      access_token: string;
    };

  cachedToken =
    data.access_token;

  tokenExpiry =
    Date.now() +
    50 * 60 * 1000;

  return cachedToken;
}

function extractAssistantText(
  response: WatsonxChatResponse
): string {
  const text =
    response.choices?.[0]
      ?.message?.content;

  if (!text) {
    throw new Error(
      "Granite response contained no assistant message."
    );
  }

  return text;
}

// Extracts the first matching JSON block from raw text.
// Handles cases where the model returns wrapper text or markdown code fences.
export function extractJsonBlock(
  text: string
): string {
  const match =
    text.match(
      /\{[\s\S]*\}/
    );

  if (!match) {
    throw new Error(
      "No JSON object found in Granite response."
    );
  }

  return match[0];
}

// Single execution handler for Watsonx Chat completions.
// Incorporates the custom timeout boundaries, AbortController, and retries.
export async function graniteChat(
  messages: GraniteMessage[],

  options: GraniteChatOptions = {}
): Promise<GraniteChatResponse> {
  const token =
    await getIamToken();

  const modelId =
    options.modelId ??
    getRequiredEnv(
      "WATSONX_MODEL_ID"
    );

  const projectId =
    getRequiredEnv(
      "WATSONX_PROJECT_ID"
    );

  const url =
    getRequiredEnv(
      "WATSONX_URL"
    );

  const timeoutMs =
    options.timeoutMs ??
    DEFAULT_TIMEOUT_MS;

  const retries =
    options.retries ??
    DEFAULT_MAX_RETRIES;

  const maxTokens =
    options.maxTokens ??
    DEFAULT_MAX_TOKENS;

  const temperature =
    options.temperature ??
    DEFAULT_TEMPERATURE;

  for (
    let attempt = 1;
    attempt <= retries + 1;
    attempt++
  ) {
    const controller =
      new AbortController();

    const timeout =
      setTimeout(() => {
        controller.abort();
      }, timeoutMs);

    try {
      const response =
        await fetch(
          `${url}/ml/v1/text/chat?version=${API_VERSION}`,
          {
            method: "POST",

            signal:
              controller.signal,

            headers: {
              Authorization:
                `Bearer ${token}`,

              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              model_id: modelId,

              project_id:
                projectId,

              messages,

              max_tokens:
                maxTokens,

              temperature,
            }),
          }
        );

      if (!response.ok) {
        const errorText =
          await response.text();

        throw new Error(
          `Granite request failed (${response.status}): ${errorText}`
        );
      }

      const data =
        (await response.json()) as WatsonxChatResponse;

      return {
        text:
          extractAssistantText(
            data
          ),

        usage: {
          promptTokens:
            data.usage
              ?.prompt_tokens ??
            0,

          completionTokens:
            data.usage
              ?.completion_tokens ??
            0,

          totalTokens:
            data.usage
              ?.total_tokens ??
            0,
        },
      };
    } catch (error) {
      const isLastAttempt =
        attempt ===
        retries + 1;

      if (isLastAttempt) {
        throw error;
      }
    } finally {
      clearTimeout(
        timeout
      );
    }
  }

  throw new Error(
    "Granite request failed."
  );
}