/**
 * Bcrypt hash of the Financeiro module passcode. Deliberately NOT in .env —
 * Next.js expands `$VAR`-looking sequences in .env files, and a bcrypt hash
 * (format `$2b$10$...`) gets silently mangled by that expansion. This value
 * is a one-way hash, not a secret in the same sense as AUTH_SECRET, so a
 * plain constant is the safer place for it.
 */
export const FINANCE_PASSCODE_HASH =
  "$2b$10$7vPNRrhFk0LwLDsTfItVzOjN6DPmm2ucHwpnjU7.zt.aJ3lBPdsiS";
