export type JevErrorCode =
  | "missing_key"
  | "unavailable"
  | "rate_limited"
  | "network"
  | "malformed";

export class JevError extends Error {
  constructor(
    public code: JevErrorCode,
    message: string,
    public detail?: string,
  ) {
    super(message);
    this.name = "JevError";
  }
}
