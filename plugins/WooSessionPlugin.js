import { ApolloLink, Observable } from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import {
  getWooAuthToken,
  getWooSessionToken,
  setWooSessionToken,
  clearWooSessionToken,
  clearWooAuthToken,
} from "../lib/wooAuth";

function isPoisonedAuthError(errors = []) {
  return errors.some((error) =>
    /internal server error|jwt|invalid-secret|not configured|invalid-jwt|expired|authorization/i.test(
      error?.message || "",
    ),
  );
}

/**
 * Attaches WooCommerce session for Faust catalog requests.
 * Customer JWT is intentionally NOT attached here — account/cart use
 * `/api/woo-graphql`, and a bad JWT on Faust requests causes WP 500s
 * that break stores / products / shuttle queries.
 */
function createWooSessionMiddleware() {
  return setContext((_, { headers }) => {
    const session = getWooSessionToken();
    const nextHeaders = { ...headers };

    if (session) {
      nextHeaders["woocommerce-session"] = `Session ${session}`;
    }

    return { headers: nextHeaders };
  });
}

/**
 * Persists updated woocommerce-session tokens from GraphQL responses.
 * Also clears a stale JWT left in localStorage if WP returns auth/500 errors.
 */
function createWooSessionAfterware() {
  return new ApolloLink((operation, forward) => {
    return new Observable((observer) => {
      const subscription = forward(operation).subscribe({
        next: (response) => {
          const context = operation.getContext();
          const responseHeaders = context?.response?.headers;

          if (responseHeaders && typeof responseHeaders.get === "function") {
            const sessionHeader = responseHeaders.get("woocommerce-session");
            if (sessionHeader) {
              if (sessionHeader.toLowerCase() === "false") {
                clearWooSessionToken();
              } else {
                setWooSessionToken(sessionHeader);
              }
            }
          }

          const errors = response?.errors || [];
          if (isPoisonedAuthError(errors) && getWooAuthToken()) {
            clearWooAuthToken();
          }

          observer.next(response);
        },
        error: (networkError) => {
          const resultErrors = networkError?.result?.errors || [];
          if (
            (isPoisonedAuthError(resultErrors) ||
              /internal server error/i.test(networkError?.message || "")) &&
            getWooAuthToken()
          ) {
            clearWooAuthToken();
          }
          observer.error(networkError);
        },
        complete: () => observer.complete(),
      });

      return () => subscription.unsubscribe();
    });
  });
}

/**
 * Faust plugin that wires WooCommerce session handling into Apollo Client.
 */
export class WooSessionPlugin {
  apply({ addFilter }) {
    addFilter("apolloClientOptions", "woo-session", (apolloClientOptions) => {
      const existingLink = apolloClientOptions?.link;
      if (!existingLink) {
        return apolloClientOptions;
      }

      const middleware = createWooSessionMiddleware();
      const afterware = createWooSessionAfterware();

      return {
        ...apolloClientOptions,
        link: middleware.concat(afterware).concat(existingLink),
      };
    });
  }
}
