"use client";

import { useState, useCallback, useEffect, useRef } from "react";

interface UseApiOptions<T> {
  initialData?: T;
  revalidateOnFocus?: boolean;
  dedupingInterval?: number;
  enabled?: boolean;
}

interface UseApiReturn<T, P> {
  data: T | undefined;
  error: Error | null;
  isLoading: boolean;
  isValidating: boolean;
  mutate: (data?: T) => void;
  refetch: (params?: P) => Promise<void>;
}

/**
 * Custom hook for data fetching with caching and deduplication
 * Similar to SWR/React Query pattern but simpler
 */
export function useApi<T, P = void>(
  fetcher: (params: P) => Promise<T>,
  params: P,
  options: UseApiOptions<T> = {}
): UseApiReturn<T, P> {
  const {
    initialData,
    revalidateOnFocus = true,
    dedupingInterval = 2000,
    enabled = true,
  } = options;

  const [data, setData] = useState<T | undefined>(initialData);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(!initialData);
  const [isValidating, setIsValidating] = useState(false);

  const lastFetchTime = useRef<number>(0);
  const paramsRef = useRef(params);
  paramsRef.current = params;

  const fetch = useCallback(
    async (fetchParams?: P) => {
      if (!enabled) return;

      const now = Date.now();
      if (now - lastFetchTime.current < dedupingInterval) {
        return;
      }

      setIsValidating(true);
      if (!data) setIsLoading(true);

      try {
        const result = await fetcher(fetchParams ?? paramsRef.current);
        setData(result);
        setError(null);
        lastFetchTime.current = now;
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Unknown error"));
      } finally {
        setIsLoading(false);
        setIsValidating(false);
      }
    },
    [fetcher, data, dedupingInterval, enabled]
  );

  useEffect(() => {
    if (enabled) {
      fetch();
    }
  }, [fetch, enabled]);

  // Revalidate on focus
  useEffect(() => {
    if (!revalidateOnFocus || !enabled) return;

    const handleFocus = () => {
      fetch();
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [fetch, revalidateOnFocus, enabled]);

  const mutate = useCallback((newData?: T) => {
    if (newData !== undefined) {
      setData(newData);
    }
  }, []);

  return { data, error, isLoading, isValidating, mutate, refetch: fetch };
}

