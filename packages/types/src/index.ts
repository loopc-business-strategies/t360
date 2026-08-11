export interface ApiErrorBody {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  requestId: string;
}

export interface ApiSuccessBody<T> {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
  requestId: string;
}

export type ApiResponse<T> = ApiSuccessBody<T> | ApiErrorBody;
