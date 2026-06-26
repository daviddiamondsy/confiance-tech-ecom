import {
  BATTERY_HEALTH_FEATURE,
  BATTERY_HEALTH_SPEC,
  IPHONE_QUALITY_TAIL,
} from "@/lib/device-quality-copy";
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

export function getAdminOpenAiApiKey(): string | null {
  return (
    process.env.ADMIN_OPENAI_API_KEY?.trim() ||
    process.env.OPENAI_API_KEY?.trim() ||
    null
  );
}

export function getAdminOpenAiModel(): string {
  return process.env.ADMIN_OPENAI_MODEL?.trim() || "gpt-4o-mini";
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
    `Condition tag: ${condition}`,
    input.storage?.trim() ? `Default storage label: ${input.storage.trim()}` : null,
    isIphone ? "Device family: iPhone (include 90+ battery health claims for Clean units)" : null,
  ].filter(Boolean);

  return lines.join("\n");
}

const SYSTEM_PROMPT = `You write product copy for Confiance Tech, a Nigerian e-commerce store selling brand new and UK Grade A phones and laptops.

Return JSON only with this shape:
{
  "description": "string",
  "features": ["string"],
  "specifications": { "Label": "value" }
}

Rules:
- description: 2-3 sentences. Mention key specs and trust (inspected, tested, certified).
- features: 6-8 short bullet strings (no leading bullets in the strings).
- specifications: 5-8 rows using labels like Display, Processor, Camera, Battery, Connectivity. Use title case labels.
- Do NOT include a Storage specification row (storage is managed separately).
- For Clean / UK Grade A iPhones: include "90+ Battery Health" in features and "Battery health": "90%+" in specifications.
- For New products: emphasize brand new, factory-fresh, inspected and certified.
- For Clean products: emphasize UK Grade A, accessories included, inspected and certified.
- Be accurate to the real product model. Do not invent wrong chip names or screen sizes.
- Never use em dashes. Use periods or hyphens instead.
- Plain text only. No markdown.`;

export function parseGeneratedProductCopy(raw: unknown): GeneratedProductCopy {
  if (!raw || typeof raw !== "object") {
    throw new Error("INVALID_AI_RESPONSE");
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
    for (const [key, value] of Object.entries(record.specifications as Record<string, unknown>)) {
      const label = key.trim();
      const text = typeof value === "string" ? value.trim() : "";
      if (!label || !text || label.toLowerCase() === "storage") continue;
      specifications[label] = text;
    }
  }

  if (!description || features.length === 0 || Object.keys(specifications).length === 0) {
    throw new Error("INVALID_AI_RESPONSE");
  }

  return { description, features, specifications };
}

/** Post-process AI output to match storefront conventions when tags imply condition. */
export function finalizeGeneratedProductCopy(
  copy: GeneratedProductCopy,
  input: GenerateProductCopyInput
): GeneratedProductCopy {
  const condition = conditionLabel(input.filterSlugs);
  const isIphone = /iphone/i.test(input.productName);
  let description = copy.description;
  const features = [...copy.features];
  const specifications = { ...copy.specifications };

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

  return { description, features, specifications };
}

export async function generateProductCopyWithAi(
  input: GenerateProductCopyInput
): Promise<GeneratedProductCopy> {
  const apiKey = getAdminOpenAiApiKey();
  if (!apiKey) {
    throw new Error("AI_NOT_CONFIGURED");
  }

  const productName = input.productName.trim();
  if (!productName) {
    throw new Error("PRODUCT_NAME_REQUIRED");
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: getAdminOpenAiModel(),
      temperature: 0.35,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: buildUserPrompt(input) },
      ],
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    console.error("[admin-product-copy-ai] OpenAI error", response.status, detail);
    throw new Error("AI_REQUEST_FAILED");
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = payload.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("INVALID_AI_RESPONSE");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error("INVALID_AI_RESPONSE");
  }

  const copy = parseGeneratedProductCopy(parsed);
  return finalizeGeneratedProductCopy(copy, input);
}
