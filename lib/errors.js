/**
 * Pull a readable message from Apollo/network/GraphQL errors.
 */
export function getErrorMessage(error, fallback = "Something went wrong") {
  if (!error) return fallback;

  if (Array.isArray(error.graphQLErrors) && error.graphQLErrors.length > 0) {
    return error.graphQLErrors.map((item) => item.message).join(" ");
  }

  const networkResult = error.networkError?.result;
  if (networkResult?.errors?.length) {
    return networkResult.errors.map((item) => item.message).join(" ");
  }

  if (typeof networkResult?.message === "string") {
    return networkResult.message;
  }

  if (error.message && !error.message.includes("Received status code")) {
    return error.message;
  }

  if (error.networkError?.message) {
    return error.networkError.message;
  }

  return fallback;
}

/**
 * WordPress usernames cannot contain "@". Build a safe username from email.
 */
export function usernameFromEmail(email = "") {
  const local = String(email).split("@")[0] || "user";
  const cleaned = local.replace(/[^a-zA-Z0-9._-]/g, "").slice(0, 50);
  return cleaned || `user${Date.now()}`;
}

export function sanitizeUsername(username = "", email = "") {
  const raw = String(username || "").trim();
  // If username is blank or looks like an email, derive from email local-part.
  if (!raw || raw.includes("@")) {
    return usernameFromEmail(email || raw);
  }
  const cleaned = raw.replace(/[^a-zA-Z0-9._-]/g, "").slice(0, 60);
  return cleaned || usernameFromEmail(email);
}
