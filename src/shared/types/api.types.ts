/** Standard success envelope every API route returns — keeps frontend fetch handling uniform. */
export interface ApiSuccess<T> {
  success: true;
  message: string;
  data: T;
}

/** Standard error envelope — matches the `{ success, message, errors? }` shape required by AI_INSTRUCTIONS.md. */
export interface ApiError {
  success: false;
  message: string;
  errors?: unknown;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;
