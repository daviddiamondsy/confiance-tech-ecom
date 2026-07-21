import { BATTERY_HEALTH_FEATURE, BATTERY_HEALTH_SPEC } from "@/lib/device-quality-copy";
import { ensureIphoneProductCopy } from "@/lib/iphone-product-copy";
import {
  CLEAN_PRODUCT_FILTER_SLUG,
  NEW_PRODUCT_FILTER_SLUG,
} from "@/lib/product-filter-tags";

export interface GeneratedProductCopy {
  description: string;
  features: string[];
  specifications: Record<string, string>;
}

export interface GenerateProductCopyInput {
  productName: string;
  filterSlugs?: string[];
  storage?: string;
}

const GROQ_CHAT_COMPLETIONS_URL = "https://api.groq.com/openai/v1/chat/completions";
const DEFAULT_GROQ_MODEL = "llama-3.3-70b-versatile";

export function getAdminGroqApiKey(): string | null {
  return (
    process.env.ADMIN_GROQ_API_KEY?.trim() ||
    process.env.GROQ_API_KEY?.trim() ||
    null
  );
}

export function getAdminGroqModel(): string {
  return process.env.ADMIN_GROQ_MODEL?.trim() || DEFAULT_GROQ_MODEL;
}

export class AdminProductCopyAiError extends Error {
  constructor(
    code: string,
    readonly userMessage: string
  ) {
    super(code);
    this.name = "AdminProductCopyAiError";
  }
}

function groqErrorMessage(status: number, body: string): string {
  try {
    const data = JSON.parse(body) as {
      error?: { message?: string; type?: string; code?: string };
    };
    const type = data.error?.type ?? data.error?.code;
    const message = data.error?.message?.trim();

    if (type === "insufficient_quota" || /quota|billing|credits/i.test(message ?? "")) {
      return "Groq quota exceeded. Check billing at console.groq.com or use another API key.";
    }
    if (type === "invalid_api_key" || status === 401) {
      return "Invalid Groq API key. Check ADMIN_GROQ_API_KEY or GROQ_API_KEY in .env.local.";
    }
    if (type === "rate_limit_exceeded" || status === 429) {
      return "Groq rate limit hit. Wait a moment and try again.";
    }
    if (message) {
      return message;
    }
  } catch {
    // Ignore JSON parse errors and fall through.
  }

  return "Could not generate copy. Check your Groq account and try again.";
}

/** Strip markdown fences and parse JSON from model text output. */
export function parseAiJsonContent(content: string): unknown {
  let text = content.trim();

  const fenced = text.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  if (fenced) {
    text = fenced[1].trim();
  } else if (text.startsWith("```")) {
    text = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  }

  try {
    return JSON.parse(text);
  } catch {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(text.slice(start, end + 1));
    }
    throw new Error("invalid json");
  }
}

function conditionLabel(filterSlugs: string[] | undefined): "new" | "clean" | "unspecified" {
  if (filterSlugs?.includes(NEW_PRODUCT_FILTER_SLUG)) return "new";
  if (filterSlugs?.includes(CLEAN_PRODUCT_FILTER_SLUG)) return "clean";
  return "unspecified";
}

function buildUserPrompt(input: GenerateProductCopyInput): string {
  const condition = conditionLabel(input.filterSlugs);
  const isIphone = /iphone/i.test(input.productName);

  const lines = [
    `Product name: ${input.productName.trim()}`,
    `Condition tag (for features/specs only, never for description): ${condition}`,
    input.storage?.trim() ? `Default storage label: ${input.storage.trim()}` : null,
    isIphone
      ? "Device family: iPhone (include Unlocked in features/Connectivity; for Like New also include 90+ battery health in features/specs, not in description)"
      : null,
  ].filter(Boolean);

  return lines.join("\n");
}

const SYSTEM_PROMPT = `You write product copy for Confiance Tech, a Nigerian e-commerce store selling phones and laptops.

Return JSON only with this shape:
{
  "description": "string",
  "features": ["string"],
  "specifications": [{ "label": "Display", "value": "6.1-inch Super Retina XDR" }]
}

Rules:
- description: 2-3 sentences focused on the product itself - display, chip, camera, battery, design, and everyday use. You may end with a short quality line such as inspected and tested. Do NOT mention condition anywhere in the description.
- Never put condition language in the description. Forbidden in description: brand new, factory-fresh, factory fresh, Like New, Grade A, Clean, New product, accessories included, or similar condition claims. Condition belongs only in features when the rules below require it.
- features: 6-8 short bullet strings (no leading bullets in the strings).
- specifications: 5-8 rows as label/value pairs (Display, Processor, Camera, Battery, Connectivity). Use title case labels.
- Do NOT include a Storage specification row (storage is managed separately).
- For all iPhones: include "Unlocked" in features and mention Unlocked in the Connectivity specification value.
- For Like New / Grade A iPhones (condition tag clean): include "90+ Battery Health" in features and a Battery health spec row with value "90%+". Do not put battery-health or Grade A wording in the description.
- Be accurate to the real product model. Do not invent wrong chip names or screen sizes (e.g. iPhone 17e uses A19, not A17).
- Never use em dashes. Use periods or hyphens instead.
- Plain text only. No markdown.`;

export function parseGeneratedProductCopy(raw: unknown): GeneratedProductCopy {
  if (!raw || typeof raw !== "object") {
    throw new AdminProductCopyAiError(
      "INVALID_AI_RESPONSE",
      "AI returned an invalid response. Try again."
    );
  }

  const record = raw as Record<string, unknown>;
  const description = typeof record.description === "string" ? record.description.trim() : "";
  const features = Array.isArray(record.features)
    ? record.features
        .map((feature) => (typeof feature === "string" ? feature.trim() : ""))
        .filter(Boolean)
    : [];
  const specifications: Record<string, string> = {};

  if (record.specifications && typeof record.specifications === "object") {
    if (Array.isArray(record.specifications)) {
      for (const row of record.specifications) {
        if (!row || typeof row !== "object") continue;
        const entry = row as Record<string, unknown>;
        const label = typeof entry.label === "string" ? entry.label.trim() : "";
        const text = typeof entry.value === "string" ? entry.value.trim() : "";
        if (!label || !text || label.toLowerCase() === "storage") continue;
        specifications[label] = text;
      }
    } else {
      for (const [key, value] of Object.entries(record.specifications as Record<string, unknown>)) {
        const label = key.trim();
        const text = typeof value === "string" ? value.trim() : "";
        if (!label || !text || label.toLowerCase() === "storage") continue;
        specifications[label] = text;
      }
    }
  }

  if (!description || features.length === 0 || Object.keys(specifications).length === 0) {
    throw new AdminProductCopyAiError(
      "INVALID_AI_RESPONSE",
      "AI returned incomplete copy. Try again."
    );
  }

  return { description, features, specifications };
}

/** Extract assistant text from a Groq/OpenAI chat completions response. */
export function extractGroqChatContent(payload: {
  choices?: Array<{ message?: { content?: string | null } }>;
}): string | null {
  const content = payload.choices?.[0]?.message?.content;
  return typeof content === "string" && content.trim() ? content.trim() : null;
}

async function requestGroqProductCopy(
  apiKey: string,
  input: GenerateProductCopyInput
): Promise<Response> {
  return fetch(GROQ_CHAT_COMPLETIONS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: getAdminGroqModel(),
      max_tokens: 2048,
      temperature: 0.35,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: buildUserPrompt(input) },
      ],
    }),
  });
}

/** Condition phrases that must not appear in product descriptions. */
const DESCRIPTION_CONDITION_PATTERN =
  /\b(brand\s*new|factory[-\s]?fresh|like\s*new|grade\s*a|accessories\s+included|clean\s+condition|new\s+product)\b/gi;

/** Strip condition claims from description text while keeping product and trust copy. */
export function stripConditionFromDescription(description: string): string {
  return description
    .replace(DESCRIPTION_CONDITION_PATTERN, "")
    .replace(/\b(this|the|a|an)\s+(device|product|unit|phone|iphone)\s+is\s*[.!?]/gi, "")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([.,;:])/g, "$1")
    .replace(/([.!?])\s*[.!?]+/g, "$1")
    .replace(/^\s*[.!?]\s*/g, "")
    .trim();
}

/** Post-process AI output to match storefront conventions when tags imply condition. */
export function finalizeGeneratedProductCopy(
  copy: GeneratedProductCopy,
  input: GenerateProductCopyInput
): GeneratedProductCopy {
  const condition = conditionLabel(input.filterSlugs);
  const isIphone = /iphone/i.test(input.productName);
  let description = stripConditionFromDescription(copy.description);
  let features = [...copy.features];
  let specifications = { ...copy.specifications };

  if (condition === "clean" && isIphone) {
    if (!features.some((feature) => /battery health/i.test(feature))) {
      features.unshift(BATTERY_HEALTH_FEATURE);
    }
    if (!specifications["Battery health"]) {
      specifications["Battery health"] = BATTERY_HEALTH_SPEC;
    }
  }

  if (isIphone) {
    const ensured = ensureIphoneProductCopy({
      name: input.productName,
      features,
      specifications,
    });
    features = ensured.features;
    specifications = ensured.specifications;
  }

  return { description, features, specifications };
}

export async function generateProductCopyWithAi(
  input: GenerateProductCopyInput
): Promise<GeneratedProductCopy> {
  const apiKey = getAdminGroqApiKey();
  if (!apiKey) {
    throw new AdminProductCopyAiError(
      "AI_NOT_CONFIGURED",
      "AI copy generation is not configured. Set ADMIN_GROQ_API_KEY or GROQ_API_KEY."
    );
  }

  const productName = input.productName.trim();
  if (!productName) {
    throw new AdminProductCopyAiError("PRODUCT_NAME_REQUIRED", "Product name is required.");
  }

  const response = await requestGroqProductCopy(apiKey, input);
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    console.error("[admin-product-copy-ai] Groq error", response.status, detail);
    throw new AdminProductCopyAiError(
      "AI_REQUEST_FAILED",
      groqErrorMessage(response.status, detail)
    );
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string | null } }>;
  };
  const content = extractGroqChatContent(payload);
  if (!content) {
    throw new AdminProductCopyAiError(
      "INVALID_AI_RESPONSE",
      "AI returned an empty response. Try again."
    );
  }

  let parsed: unknown;
  try {
    parsed = parseAiJsonContent(content);
  } catch {
    console.error("[admin-product-copy-ai] Unparseable AI content", content.slice(0, 500));
    throw new AdminProductCopyAiError(
      "INVALID_AI_RESPONSE",
      "AI returned an invalid response. Try again."
    );
  }

  const copy = parseGeneratedProductCopy(parsed);
  return finalizeGeneratedProductCopy(copy, input);
}
