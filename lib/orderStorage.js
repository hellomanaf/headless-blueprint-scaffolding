const LAST_ORDER_KEY = "woo-last-order";

export function saveLastOrder(order) {
  if (typeof window === "undefined" || !order) return;
  try {
    window.sessionStorage.setItem(LAST_ORDER_KEY, JSON.stringify(order));
  } catch {
    // ignore quota / private mode errors
  }
}

export function readLastOrder() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(LAST_ORDER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearLastOrder() {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(LAST_ORDER_KEY);
  } catch {
    // ignore
  }
}

/**
 * Extract order id from a WooCommerce thank-you / payment redirect URL.
 */
export function orderIdFromRedirect(url = "") {
  if (!url) return null;
  const received = String(url).match(/order-received\/(\d+)/i);
  if (received?.[1]) return received[1];
  const orderParam = String(url).match(/[?&]order_id=(\d+)/i);
  if (orderParam?.[1]) return orderParam[1];
  return null;
}

/**
 * True when redirect should leave the headless site (external payment).
 */
export function isExternalPaymentRedirect(url = "") {
  if (!url) return false;
  const value = String(url);
  if (/order-received/i.test(value)) return false;
  if (/checkout\/order-pay/i.test(value)) return true;
  try {
    const target = new URL(value, window.location.origin);
    return target.origin !== window.location.origin;
  } catch {
    return false;
  }
}
