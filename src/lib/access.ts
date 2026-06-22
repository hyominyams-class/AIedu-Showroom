export const ACCESS_STORAGE_KEY = "access_granted";

export const ACCESS_COOKIE_NAME = "showroom_access";

export const ACCESS_COOKIE_VALUE = "granted";

export const DEFAULT_TRAINING_ACCESS_CODE = "showroom2026";

export function isValidAccessCode(code: string) {
  const expected = process.env.TRAINING_ACCESS_CODE ?? DEFAULT_TRAINING_ACCESS_CODE;
  return code.trim() === expected;
}
