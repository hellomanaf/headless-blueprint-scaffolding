const WOO_SESSION_KEY = "woo-session";
const WOO_AUTH_TOKEN_KEY = "woo-auth-token";

function canUseStorage() {
  return typeof window !== "undefined";
}

export function getWooSessionToken() {
  if (!canUseStorage()) return null;
  return window.localStorage.getItem(WOO_SESSION_KEY);
}

export function setWooSessionToken(token) {
  if (!canUseStorage() || !token) return;
  // Server may return "Session xxx" or just the raw token.
  const cleaned = token.replace(/^Session\s+/i, "").trim();
  if (!cleaned || cleaned.toLowerCase() === "false") {
    window.localStorage.removeItem(WOO_SESSION_KEY);
    return;
  }
  window.localStorage.setItem(WOO_SESSION_KEY, cleaned);
}

export function clearWooSessionToken() {
  if (!canUseStorage()) return;
  window.localStorage.removeItem(WOO_SESSION_KEY);
}

export function getWooAuthToken() {
  if (!canUseStorage()) return null;
  return window.localStorage.getItem(WOO_AUTH_TOKEN_KEY);
}

export function setWooAuthToken(token) {
  if (!canUseStorage()) return;
  if (!token) {
    window.localStorage.removeItem(WOO_AUTH_TOKEN_KEY);
    return;
  }
  window.localStorage.setItem(WOO_AUTH_TOKEN_KEY, token);
}

export function clearWooAuthToken() {
  if (!canUseStorage()) return;
  window.localStorage.removeItem(WOO_AUTH_TOKEN_KEY);
}

export function clearWooAuth() {
  clearWooAuthToken();
}
