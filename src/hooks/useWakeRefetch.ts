import { useEffect, useCallback, useRef } from "react";
import { CLIENT_WAKE_EVENT } from "@/lib/wakeRefetch";

interface WakeRefetchOptions {
  /** Callback untuk menangani error */
  onError?: (error: Error) => void;
  /** Minimum delay antara refetch dalam ms */
  debounceMs?: number;
  /** Maximum retry attempts */
  maxRetries?: number;
  /** Delay antara retry dalam ms */
  retryDelay?: number;
}

/**
 * Hook untuk menjalankan callback setiap kali tab kembali fokus/visible (via WAKE_EVENT).
 * Includes error handling, debouncing, dan retry logic.
 * 
 * @param cb - Callback yang akan dijalankan
 * @param options - Konfigurasi opsional untuk error handling dan debouncing
 */
export function useWakeRefetch(
  cb: () => void | Promise<void>, 
  options: WakeRefetchOptions = {}
): void {
  const {
    onError,
    debounceMs = 1000,
    maxRetries = 3,
    retryDelay = 1000
  } = options;

  const lastRunRef = useRef(0);
  const retryCountRef = useRef(0);
  const mountedRef = useRef(true);

  const handleError = useCallback((error: unknown) => {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    console.error("Wake refetch failed:", errorObj);
    onError?.(errorObj);
    
    // Retry logic dengan exponential backoff
    if (mountedRef.current && retryCountRef.current < maxRetries) {
      retryCountRef.current++;
      const backoffDelay = retryDelay * Math.pow(2, retryCountRef.current - 1);
      const currentRetry = retryCountRef.current;
      
      // Buat fungsi retry yang mandiri
      const retryAttempt = () => {
        // Pastikan retry count masih sama dan komponen masih mounted
        if (mountedRef.current && retryCountRef.current === currentRetry) {
          void cb();
        }
      };
      
      setTimeout(retryAttempt, backoffDelay);
    }
    // Tidak reset counter disini - biarkan sukses yang reset
  }, [maxRetries, onError, retryDelay, cb]);

  const runCallback = useCallback(async () => {
    const now = Date.now();
    if (now - lastRunRef.current < debounceMs) {
      return; // Debounce
    }
    lastRunRef.current = now;

    try {
      await cb();
      retryCountRef.current = 0; // Reset on success
    } catch (error) {
      handleError(error);
    }
  }, [cb, debounceMs, handleError]);

  useEffect(() => {
    mountedRef.current = true;
    const handler = () => void runCallback();
    window.addEventListener(CLIENT_WAKE_EVENT, handler);
    
    return () => {
      mountedRef.current = false;
      window.removeEventListener(CLIENT_WAKE_EVENT, handler);
    };
  }, [runCallback]);
}