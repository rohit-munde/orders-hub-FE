export type ApiErrorDetails = {
  status: number | null;
  error?: string | null;
  path?: string | null;
  timeStamp?: string | null;
  validationErrors?: Record<string, string> | null;
};

export class ApiError extends Error {
  readonly status: number | null;
  readonly error: string | null;
  readonly path: string | null;
  readonly timeStamp: string | null;
  readonly validationErrors: Record<string, string> | null;

  constructor(message: string, details: ApiErrorDetails = { status: null }) {
    super(message);
    this.name = 'ApiError';
    this.status = details.status;
    this.error = details.error ?? null;
    this.path = details.path ?? null;
    this.timeStamp = details.timeStamp ?? null;
    this.validationErrors = details.validationErrors ?? null;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
