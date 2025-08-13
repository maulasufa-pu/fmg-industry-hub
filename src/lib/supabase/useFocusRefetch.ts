// src/lib/supabase/useFocusRefetch.ts
"use client";

import { useEffect, useRef, useCallback, useState } from "react";

interface FocusRefetchOptions<T = unknown> {
  /** Maximum number of retries if refresh fails */
  maxRetries?: number;
  /** Delay in ms between retries */
  retryDelay?: number;
  /** Timeout in ms for each refresh operation */
  reloadTimeout?: number;
  /** Callback called when refresh succeeds */
  onSuccess?: (data: T) => void;
  /** Callback called when refresh fails */
  onError?: (error: Error) => void;
}

/**
 * Hook to refresh data when tab/window gets focus back
 * Uses AbortController and loading guard to prevent stuck state
 * @template T Type of data returned by the refresh function
 * @param reload Function to call to refresh data
 * @param abortCurrent Function to cancel ongoing operation
 * @param options Optional configuration for retries, timeout, and callbacks
 * 
 * @example
 * ```typescript
 * const { data, refetch, abort } = useQuery();
 * 
 * useFocusRefetch(refetch, abort, {
 *   maxRetries: 3,
 *   retryDelay: 1000,
 *   reloadTimeout: 5000,
 *   onSuccess: (data) => console.log('Refresh success:', data),
 *   onError: (error) => console.error('Refresh failed:', error)
 * });
 * ```
 */
export function useFocusRefetch<T>(
  reload: (signal?: AbortSignal) => Promise<T>,
  abortCurrent: () => void,
  options: FocusRefetchOptions<T> = {}
) {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    reloadTimeout = 10000,
    onSuccess,
    onError
  } = options;

  const justFocusedRef = useRef(false);
  const retryCountRef = useRef(0);
  const mountedRef = useRef(true);
  const reloadingRef = useRef<Promise<T> | undefined>(undefined);
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const abortControllerRef = useRef<AbortController | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const safeReload = useCallback(async () => {
    if (!mountedRef.current || isLoading) return;
    setIsLoading(true);
    abortCurrent();
    if (abortControllerRef.current) abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    try {
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutRef.current = setTimeout(() => {
          reject(new Error(`Reload timeout after ${reloadTimeout}ms`));
        }, reloadTimeout);
      });

      const reloadPromise = reload(signal);
      reloadingRef.current = reloadPromise;

      try {
        const result = await Promise.race([reloadPromise, timeoutPromise]);
        if (reloadingRef.current === reloadPromise && mountedRef.current) {
          retryCountRef.current = 0;
          onSuccess?.(result);
        }
      } finally {
        if (reloadingRef.current === reloadPromise) {
          reloadingRef.current = undefined;
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (errorMessage === 'AbortError') {
        // Request aborted, do not retry
        setIsLoading(false);
        return;
      }
      console.error(`Reload failed: ${errorMessage}`);
      if (mountedRef.current) {
        onError?.(error instanceof Error ? error : new Error(errorMessage));
        if (retryCountRef.current < maxRetries) {
          retryCountRef.current++;
          setTimeout(safeReload, retryDelay);
        } else {
          retryCountRef.current = 0;
        }
      }
    } finally {
      setIsLoading(false);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    }
  }, [reload, abortCurrent, maxRetries, retryDelay, reloadTimeout, onSuccess, onError, isLoading]);

  useEffect(() => {
    mountedRef.current = true;

    const onFocus = async () => {
      if (!mountedRef.current || justFocusedRef.current) return;
      justFocusedRef.current = true;
      await safeReload();
      if (mountedRef.current) {
        justFocusedRef.current = false;
      }
    };

    const onVisible = () => {
      if (document.visibilityState === "visible") {
        onFocus();
      } else {
        abortCurrent();
        if (abortControllerRef.current) abortControllerRef.current.abort();
      }
    };

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      mountedRef.current = false;
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisible);
      abortCurrent();
      if (abortControllerRef.current) abortControllerRef.current.abort();
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [safeReload, abortCurrent]);

  return {
    abort: () => {
      abortCurrent();
      if (abortControllerRef.current) abortControllerRef.current.abort();
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    }
  };
}
