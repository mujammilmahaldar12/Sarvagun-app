import { useState, useEffect } from "react";
import { LoadingState } from "../types/api";

type UseQueryOptions<T> = {
  queryFn: () => Promise<T>;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  enabled?: boolean;
};

export function useQuery<T>({
  queryFn,
  onSuccess,
  onError,
  enabled = true,
}: UseQueryOptions<T>) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [status, setStatus] = useState<LoadingState>("idle");

  const refetch = async () => {
    try {
      setStatus("loading");
      setError(null);
      const result = await queryFn();
      setData(result);
      setStatus("success");
      onSuccess?.(result);
    } catch (err) {
      const error = err as Error;
      setError(error);
      setStatus("error");
      onError?.(error);
    }
  };

  useEffect(() => {
    if (enabled) {
      refetch();
    }
  }, [enabled]);

  return {
    data,
    error,
    isLoading: status === "loading",
    isError: status === "error",
    isSuccess: status === "success",
    refetch,
  };
}
