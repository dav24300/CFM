export type UploadErrorCode =
  | "MIME_REJECTED"
  | "TOO_LARGE"
  | "STORAGE_FAILED"
  | "STORAGE_READONLY"
  | "CONVERT_FAILED"
  | "INVALID_SETTING_KEY"
  | "UPLOAD_FAILED";

export class UploadError extends Error {
  readonly code: UploadErrorCode;
  readonly hint: string;
  readonly status: number;

  constructor(code: UploadErrorCode, message: string, hint: string, status = 400) {
    super(message);
    this.name = "UploadError";
    this.code = code;
    this.hint = hint;
    this.status = status;
  }
}

export function isUploadError(err: unknown): err is UploadError {
  return err instanceof UploadError;
}
