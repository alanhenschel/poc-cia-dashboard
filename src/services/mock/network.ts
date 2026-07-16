import { ApiError } from "@/lib/api-error";
import { LATENCY_MS, READ_ERROR_RATE, WRITE_ERROR_RATE } from "./config";
import { persistStore } from "./store";

/**
 * Mock "network" behavior: latency + optional transient failure, plus write-through persistence.
 * `ApiError` itself lives in `@/lib/api-error` (non-mock) so a real fetch facade throws the same type.
 */

const randomBetween = (min: number, max: number): number =>
  Math.floor(min + Math.random() * (max - min));

/** Resolves after a randomized delay to imitate real network round-trip time. */
export function simulateLatency(): Promise<void> {
  return new Promise((resolve) =>
    setTimeout(resolve, randomBetween(LATENCY_MS.min, LATENCY_MS.max)),
  );
}

/** Rolls a die against `rate` and throws a transient 500 on failure — exercises error/retry UI. */
export function maybeFail(rate: number): void {
  if (rate > 0 && Math.random() < rate) {
    throw ApiError.transient();
  }
}

/** Wraps a mock READ with latency + optional transient failure. */
export async function withRead<T>(op: () => T | Promise<T>): Promise<T> {
  await simulateLatency();
  maybeFail(READ_ERROR_RATE);
  return op();
}

/** Wraps a mock WRITE, then persists the store through to localStorage on success. */
export async function withWrite<T>(op: () => T | Promise<T>): Promise<T> {
  await simulateLatency();
  maybeFail(WRITE_ERROR_RATE);
  const result = await op();
  persistStore();
  return result;
}
