/**
 * Current-user seam. Standalone by design — it does NOT reach into `services/mock`, so deleting the
 * mock backend never breaks it. When real auth (Okta `cia-user`) lands, replace `CURRENT_USER_ID`
 * with the session identity; the mock backend already reads ownership from here (see mock/config.ts).
 */
export const CURRENT_USER_ID = "you@nubank.com.br";

export function getCurrentUserId(): string {
  return CURRENT_USER_ID;
}

export function isCurrentUser(ownerId: string): boolean {
  return ownerId === getCurrentUserId();
}

/** "you@nubank.com.br" → "you". Used for compact owner labels. */
export function ownerHandle(ownerId: string): string {
  return ownerId.split("@")[0] ?? ownerId;
}
