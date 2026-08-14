export type ApiSuccessResponse<T> = {
  success: boolean;
  message: string;
  payload: T;
};

export type ApiErrorResponse = {
  timeStamp: string;
  status: number;
  error: string;
  message: string;
  path: string;
  validationErrors: Record<string, string> | null;
};
