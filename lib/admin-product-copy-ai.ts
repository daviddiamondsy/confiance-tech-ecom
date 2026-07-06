import {
  BATTERY_HEALTH_FEATURE,
  BATTERY_HEALTH_SPEC,
  IPHONE_QUALITY_TAIL,
} from "@/lib/device-quality-copy";
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

export function getAdminAnthropicApiKey(): string | null {
  return (
    process.env.ADMIN_ANTHROPIC_API_KEY?.trim() ||
    process.env.ANTHROPIC_API_KEY?.trim() ||
    null
  );
}

export function getAdminAnthropicModel(): string {
  return process.env.ADMIN_ANTHROPIC_MODEL?.trim() || "claude-haiku-4-5";
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

function anthropicErrorMessage(status: number, body: string): string {
  try {
    const data = JSON.parse(body) as {
      error?: { message?: string; type?: string };
    };
    const type = data.error?.type;
    const message = data.error?.message?.trim();

    if (type === "insufficient_quota_error") {
      return "Anthropic quota exceeded. Add billing credits at console.anthropic.com or use another API key.";
    }
    if (type === "authentication_error" || status === 401) {
      return "Invalid Anthropic API key. Check ADMIN_ANTHROPIC_API_KEY or ANTHROPIC_API_KEY in .env.local.";
    }
    if (type === "rate_limit_error") {
      return "Anthropic rate limit hit. Wait a moment and try again.";
    }
    if (message) {
      return message;
    }
  } catch {
    // Ignore JSON parse errors and fall through.
  }

  return "Could not generate copy. Check your Anthropic account and try again.";
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

const PRODUCT_COPY_OUTPUT_SCHEMA = {
  type: "object",
  properties: {
    description: { type: "string" },
    features: {
      type: "array",
      items: { type: "string" },
    },
    specifications: {
      type: "array",
      items: {
        type: "object",
        properties: {
          label: { type: "string" },
          value: { type: "string" },
        },
        required: ["label", "value"],
        additionalProperties: false,
      },
    },
  },
  required: ["description", "features", "specifications"],
  additionalProperties: false,
} as const;

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
    `Condition tag: ${condition}`,
    input.storage?.trim() ? `Default storage label: ${input.storage.trim()}` : null,
    isIphone
      ? "Device family: iPhone (include Unlocked, and 90+ battery health claims for Like New units)"
      : null,
  ].filter(Boolean);

  return lines.join("\n");
}

const SYSTEM_PROMPT = `You write product copy for Confiance Tech, a Nigerian e-commerce store selling brand new and UK Grade A phones and laptops.

Return JSON only with this shape:
{
  "description": "string",
  "features": ["string"],
  "specifications": [{ "label": "Display", "value": "6.1-inch Super Retina XDR" }]
}

Rules:
- description: 2-3 sentences. Mention key specs and trust (inspected, tested, certified).
- features: 6-8 short bullet strings (no leading bullets in the strings).
- specifications: 5-8 rows as label/value pairs (Display, Processor, Camera, Battery, Connectivity). Use title case labels.
- Do NOT include a Storage specification row (storage is managed separately).
- For all iPhones: include "Unlocked" in features and mention Unlocked in the Connectivity specification value.
- For Like New / UK Grade A iPhones: include "90+ Battery Health" in features and a Battery health spec row with value "90%+".
- For New products: emphasize brand new, factory-fresh, inspected and certified.
- For Like New products: emphasize UK Grade A, accessories included, inspected and certified.
- Be accurate to the real product model. Do not invent wrong chip names or screen sizes.
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

/** Extract JSON text from an Anthropic Messages API response payload. */
export function extractAnthropicMessageText(payload: {
  content?: Array<{ type?: string; text?: string }>;
}): string | null {
  const textBlock = payload.content?.find((block) => block.type === "text" && block.text?.trim());
  return textBlock?.text?.trim() ?? null;
}

async function requestAnthropicProductCopy(
  apiKey: string,
  input: GenerateProductCopyInput,
  useStructuredOutput: boolean
): Promise<Response> {
  const body: Record<string, unknown> = {
    model: getAdminAnthropicModel(),
    max_tokens: 2048,
    temperature: 0.35,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: buildUserPrompt(input) }],
  };

  if (useStructuredOutput) {
    body.output_config = {
      format: {
        type: "json_schema",
        schema: PRODUCT_COPY_OUTPUT_SCHEMA,
      },
    };
  }

  return fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

/** Post-process AI output to match storefront conventions when tags imply condition. */
export function finalizeGeneratedProductCopy(
  copy: GeneratedProductCopy,
  input: GenerateProductCopyInput
): GeneratedProductCopy {
  const condition = conditionLabel(input.filterSlugs);
  const isIphone = /iphone/i.test(input.productName);
  let description = copy.description;
  let features = [...copy.features];
  let specifications = { ...copy.specifications };

  if (condition === "clean" && isIphone) {
    if (!features.some((feature) => /battery health/i.test(feature))) {
      features.unshift(BATTERY_HEALTH_FEATURE);
    }
    if (!specifications["Battery health"]) {
      specifications["Battery health"] = BATTERY_HEALTH_SPEC;
    }
    if (!description.includes("90+")) {
      description = `${description} ${IPHONE_QUALITY_TAIL}`.trim();
    }
  } else if (condition === "new" && !/brand new|factory/i.test(description)) {
    description = `${description} Brand new product. Inspected, tested, and certified.`.trim();
  } else if (condition === "clean" && !/grade a|accessories/i.test(description)) {
    description =
      `${description} UK Grade A condition with accessories included. Inspected, tested, and certified.`.trim();
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
  const apiKey = getAdminAnthropicApiKey();
  if (!apiKey) {
    throw new AdminProductCopyAiError(
      "AI_NOT_CONFIGURED",
      "AI copy generation is not configured. Set ADMIN_ANTHROPIC_API_KEY or ANTHROPIC_API_KEY."
    );
  }

  const productName = input.productName.trim();
  if (!productName) {
    throw new AdminProductCopyAiError("PRODUCT_NAME_REQUIRED", "Product name is required.");
  }

  let response = await requestAnthropicProductCopy(apiKey, input, true);
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    const retryWithoutStructured =
      response.status === 400 &&
      /output_config|structured|json_schema|format/i.test(detail);

    if (retryWithoutStructured) {
      console.warn("[admin-product-copy-ai] Structured output unavailable; retrying plain JSON");
      response = await requestAnthropicProductCopy(apiKey, input, false);
    } else {
      console.error("[admin-product-copy-ai] Anthropic error", response.status, detail);
      throw new AdminProductCopyAiError(
        "AI_REQUEST_FAILED",
        anthropicErrorMessage(response.status, detail)
      );
    }
  }

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    console.error("[admin-product-copy-ai] Anthropic error", response.status, detail);
    throw new AdminProductCopyAiError(
      "AI_REQUEST_FAILED",
      anthropicErrorMessage(response.status, detail)
    );
  }

  const payload = (await response.json()) as {
    content?: Array<{ type?: string; text?: string }>;
  };
  const content = extractAnthropicMessageText(payload);
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
