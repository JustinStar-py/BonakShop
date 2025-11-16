// DEPRECATED: `lib/session.ts` was replaced by `lib/auth.ts`.
// Keep this file as a shim to avoid import errors while migrating.
// Please update imports to use `getAuthUserFromRequest` from `@/lib/auth`.

export function _deprecated_session_shim() {
  throw new Error('lib/session.ts is deprecated; use lib/auth.ts -> getAuthUserFromRequest(req)');
}
