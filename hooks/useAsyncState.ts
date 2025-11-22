import { useState, useCallback, useRef, useEffect } from 'react';

export interface LoadingState {
  isLoading: boolean;
  error: Error | null;
  data: any;
}

interface UseAsyncStateOptions {
  initialData?: any;
  onError?: (error: Error) => void;
  onSuccess?: (data: any) => void;
}

export function useAsyncState<T = any>(options: UseAsyncStateOptions = {}) {
  const [state, setState] = useState<LoadingState>({
    isLoading: false,
    error: null,
    data: options.initialData || null,
  });
  
  const isMountedRef = useRef(true);

  const execute = useCallback(async (asyncFunction: () => Promise<T>) => {
    if (!isMountedRef.current) return;
    
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const result = await asyncFunction();
      
      if (!isMountedRef.current) return;
      
      setState({ isLoading: false, error: null, data: result });
      options.onSuccess?.(result);
      
      return result;
    } catch (error) {
      if (!isMountedRef.current) return;
      
      const errorObj = error instanceof Error ? error : new Error(String(error));
      setState({ isLoading: false, error: errorObj, data: null });
      options.onError?.(errorObj);
      
      throw errorObj;
    }
  }, [options]);

  const reset = useCallback(() => {
    setState({
      isLoading: false,
      error: null,
      data: options.initialData || null,
    });
  }, [options.initialData]);

  const setData = useCallback((data: T) => {
    setState(prev => ({ ...prev, data, error: null }));
  }, []);

  const setError = useCallback((error: Error | string) => {
    const errorObj = error instanceof Error ? error : new Error(error);
    setState(prev => ({ ...prev, error: errorObj, isLoading: false }));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return {
    ...state,
    execute,
    reset,
    setData,
    setError,
  };
}

// Simple loading hook for boolean states
export function useLoading(initialState: boolean = false) {
  const [isLoading, setIsLoading] = useState(initialState);
  
  const withLoading = useCallback(async <T>(asyncFunction: () => Promise<T>): Promise<T> => {
    setIsLoading(true);
    try {
      const result = await asyncFunction();
      setIsLoading(false);
      return result;
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  }, []);

  return {
    isLoading,
    setIsLoading,
    withLoading,
  };
}