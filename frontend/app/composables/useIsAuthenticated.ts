// Cheap "is there likely a session" check via a non-httpOnly marker cookie
// the backend sets alongside the real (httpOnly) JWT cookies. `isAuthenticated()`
// is a plain cookie read for one-off checks (template v-if guards, which get
// re-evaluated whenever any other reactive value in the same render changes).
//
// `useAuthState()` wraps the same check in a ref that login/register/logout
// explicitly update — query `enabled` options need a real reactive dependency,
// since a plain `enabled: isAuthenticated()` boolean is only evaluated once at
// setup and would never flip to true after an in-session login without a full
// page reload.
export function isAuthenticated(): boolean {
  if (import.meta.server) return false;
  return document.cookie.split('; ').some(cookie => cookie === 'zazzle_session=1');
}

const authState = ref(false);

export function useAuthState() {
  return authState;
}

export function syncAuthState(value?: boolean) {
  authState.value = value ?? isAuthenticated();
}
