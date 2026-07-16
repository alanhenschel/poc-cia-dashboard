/**
 * Mock-backend behavior knobs. Centralized so the "feel" of the fake network (latency, flakiness,
 * cache freshness) is tunable in one place and clearly separated from the domain logic.
 *
 * NOTE (documented deviation from context.md): the RFC's adaptive TTLs are minutes-to-hours
 * (60s / 5min / 30min / 2h). Those are invisible in a short demo session, so the mock uses a
 * COMPRESSED freshness window (see FRESH_WINDOW_MS) purely so the stale-while-revalidate UI
 * actually renders. Real TTL semantics move server-side when cia-backend exists.
 */

import { CURRENT_USER_ID } from "@/lib/session";

/**
 * The signed-in user for this mock session. Owned resources get `can_mutate: true`.
 * Sourced from the non-mock session seam so the mock and the UI agree on identity, and so
 * `lib/session.ts` has no dependency on `services/mock`.
 */
export const MOCK_PRINCIPAL = CURRENT_USER_ID;

/** Artificial network latency range (ms) applied to every mock call. */
export const LATENCY_MS = { min: 180, max: 620 } as const;

/** Probability [0..1] that a READ call fails with a transient 500, to exercise error/retry UI. */
export const READ_ERROR_RATE = 0.04;

/** Probability that a MUTATION call fails transiently. Kept low to avoid demo frustration. */
export const WRITE_ERROR_RATE = 0.0;

/** Compressed freshness window (ms) for a widget result before it goes stale. See NOTE above. */
export const FRESH_WINDOW_MS = 30_000;

/** How long a stale value is served while "revalidating" before the next poll returns fresh. */
export const REVALIDATE_MS = 4_000;

/** Retry-After (seconds) reported for the seeded rate_limited demo widget. */
export const RATE_LIMIT_RETRY_SECONDS = 12;

/** Default and max list page sizes (context.md: default 20, max 50). */
export const PAGE_SIZE_DEFAULT = 20;
export const PAGE_SIZE_MAX = 50;
