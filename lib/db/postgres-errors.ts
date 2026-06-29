interface PostgresErrorLike {
  code?: string;
  message?: string;
}

export function getPostgresErrorCode(error: unknown): string | undefined {
  if (typeof error !== "object" || error === null) return undefined;
  const code = (error as PostgresErrorLike).code;
  return typeof code === "string" ? code : undefined;
}

export function getPostgresErrorMessage(error: unknown): string | undefined {
  if (error instanceof Error && error.message.trim()) {
    return error.message.trim();
  }
  if (typeof error === "object" && error !== null) {
    const message = (error as PostgresErrorLike).message;
    if (typeof message === "string" && message.trim()) {
      return message.trim();
    }
  }
  return undefined;
}

export function isPostgresErrorCode(error: unknown, code: string): boolean {
  return getPostgresErrorCode(error) === code;
}

export function isMissingShippingColumnsError(error: unknown): boolean {
  const message = (getPostgresErrorMessage(error) ?? "").toLowerCase();
  return (
    message.includes("china_shipping_yuan") ||
    message.includes("international_shipping_ngn") ||
    message.includes("local_delivery_ngn") ||
    (message.includes("column") && message.includes("does not exist"))
  );
}
