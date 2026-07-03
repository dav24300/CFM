export class DomainError extends Error {
  constructor(
    readonly code: string,
    message?: string
  ) {
    super(message ?? code);
    this.name = "DomainError";
  }
}

export function domainError(code: string, message?: string): DomainError {
  return new DomainError(code, message);
}
