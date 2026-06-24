interface PostgresErrorLike {
  code?: string;
  message?: string;
}

export function getPostgresErrorCode(error: unknown): string | undefined {
  if (typeof error !== "object" || error === null) return undefined;
  const code = (error as PostgresErrorLike).code;
  return typeof code === "string" ? code : undefined;
}

export function isPostgresErrorCode(error: unknown, code: string): boolean {
  return getPostgresErrorCode(error) === code;
}
