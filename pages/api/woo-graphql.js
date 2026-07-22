const SESSION_COOKIE = "woo-session";
const AUTH_COOKIE = "woo-auth-token";

function getWordpressGraphqlUrl() {
  const base = process.env.NEXT_PUBLIC_WORDPRESS_URL;
  if (!base) {
    throw new Error("NEXT_PUBLIC_WORDPRESS_URL is not configured");
  }
  return `${base.replace(/\/$/, "")}/graphql`;
}

function cleanSessionToken(value) {
  if (!value) return null;
  const cleaned = String(value).replace(/^Session\s+/i, "").trim();
  if (!cleaned || cleaned.toLowerCase() === "false") return null;
  return cleaned;
}

function parseCookies(header = "") {
  return header.split(";").reduce((acc, part) => {
    const [rawKey, ...rest] = part.trim().split("=");
    if (!rawKey) return acc;
    acc[rawKey] = decodeURIComponent(rest.join("=") || "");
    return acc;
  }, {});
}

function serializeCookie(name, value, { maxAge, httpOnly = true } = {}) {
  const chunks = [
    `${name}=${encodeURIComponent(value)}`,
    "Path=/",
    "SameSite=Lax",
  ];

  if (httpOnly) chunks.push("HttpOnly");
  if (process.env.NODE_ENV === "production") chunks.push("Secure");
  if (typeof maxAge === "number") chunks.push(`Max-Age=${maxAge}`);

  return chunks.join("; ");
}

function shouldClearAuth(errors = []) {
  return errors.some((error) =>
    /internal server error|jwt|invalid-secret|not configured|invalid-jwt|expired/i.test(
      error?.message || "",
    ),
  );
}

function isLoginOperation(body) {
  const query = body?.query || "";
  return /\bmutation\b[\s\S]*\blogin\b/i.test(query);
}

async function postGraphql(headers, body) {
  const upstream = await fetch(getWordpressGraphqlUrl(), {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  const data = await upstream.json();
  return { upstream, data };
}

/**
 * Same-origin GraphQL proxy so the WooCommerce session token can be stored
 * in an HttpOnly cookie (avoids CORS blocking the woocommerce-session header).
 */
export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ errors: [{ message: "Method not allowed" }] });
  }

  try {
    const cookies = parseCookies(req.headers.cookie || "");
    const sessionFromCookie = cleanSessionToken(cookies[SESSION_COOKIE]);
    const authFromCookie = cookies[AUTH_COOKIE] || null;
    const authFromHeader = req.headers.authorization || null;
    const hasAuth = Boolean(authFromHeader || authFromCookie);

    const upstreamHeaders = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };

    if (sessionFromCookie) {
      upstreamHeaders["woocommerce-session"] = `Session ${sessionFromCookie}`;
    }

    if (authFromHeader) {
      upstreamHeaders.Authorization = authFromHeader;
    } else if (authFromCookie) {
      upstreamHeaders.Authorization = `Bearer ${authFromCookie}`;
    }

    let { upstream, data } = await postGraphql(upstreamHeaders, req.body);
    const cookiesToSet = [];

    // Bad/misconfigured JWT often poisons every Woo request with a 500.
    // Retry once without Authorization for non-login operations.
    if (
      hasAuth &&
      !isLoginOperation(req.body) &&
      shouldClearAuth(data?.errors || [])
    ) {
      delete upstreamHeaders.Authorization;
      const retried = await postGraphql(upstreamHeaders, req.body);
      upstream = retried.upstream;
      data = retried.data;
      cookiesToSet.push(serializeCookie(AUTH_COOKIE, "", { maxAge: 0 }));
    }

    const rawSession = upstream.headers.get("woocommerce-session");
    const nextSession = cleanSessionToken(rawSession);

    if (rawSession && String(rawSession).toLowerCase() === "false") {
      cookiesToSet.push(serializeCookie(SESSION_COOKIE, "", { maxAge: 0 }));
    } else if (nextSession) {
      cookiesToSet.push(
        serializeCookie(SESSION_COOKIE, nextSession, {
          maxAge: 60 * 60 * 24 * 14,
        }),
      );
    }

    const authToken =
      data?.data?.login?.authToken ||
      data?.data?.registerCustomer?.authToken ||
      null;

    if (authToken) {
      cookiesToSet.push(
        serializeCookie(AUTH_COOKIE, authToken, {
          maxAge: 60 * 60 * 24 * 7,
        }),
      );
    }

    if (req.body?.wooLogout) {
      cookiesToSet.push(serializeCookie(AUTH_COOKIE, "", { maxAge: 0 }));
      cookiesToSet.push(serializeCookie(SESSION_COOKIE, "", { maxAge: 0 }));
    }

    if (cookiesToSet.length) {
      res.setHeader("Set-Cookie", cookiesToSet);
    }

    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({
      errors: [{ message: error.message || "Woo GraphQL proxy failed" }],
    });
  }
}
