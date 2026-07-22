import { ApolloLink } from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import {
  getWooAuthToken,
  getWooSessionToken,
  setWooSessionToken,
  clearWooSessionToken,
} from "../lib/wooAuth";

/**
 * Attaches WooCommerce session + customer JWT headers for cart/account.
 */
function createWooSessionMiddleware() {
  return setContext((_, { headers }) => {
    const session = getWooSessionToken();
    const authToken = getWooAuthToken();
    const nextHeaders = { ...headers };

    if (session) {
      nextHeaders["woocommerce-session"] = `Session ${session}`;
    }

    // Prefer Woo customer JWT when present (Faust may also set Authorization).
    if (authToken) {
      nextHeaders.Authorization = `Bearer ${authToken}`;
    }

    return { headers: nextHeaders };
  });
}

/**
 * Persists updated woocommerce-session tokens from GraphQL responses.
 */
function createWooSessionAfterware() {
  return new ApolloLink((operation, forward) => {
    return forward(operation).map((response) => {
      const context = operation.getContext();
      const responseHeaders = context?.response?.headers;

      if (responseHeaders) {
        const sessionHeader =
          typeof responseHeaders.get === "function"
            ? responseHeaders.get("woocommerce-session")
            : null;

        if (sessionHeader) {
          if (sessionHeader.toLowerCase() === "false") {
            clearWooSessionToken();
          } else {
            setWooSessionToken(sessionHeader);
          }
        }
      }

      return response;
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
