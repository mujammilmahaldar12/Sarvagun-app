// Common types used across the app

export type ApiResponse<T> = {
  data: T;
  message?: string;
  success: boolean;
};

export type PaginatedResponse<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

export type ApiError = {
  message: string;
  errors?: Record<string, string[]>;
  status?: number;
};

export type LoadingState = "idle" | "loading" | "success" | "error";
