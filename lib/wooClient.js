import {
  ApolloClient,
  HttpLink,
  InMemoryCache,
  from,
} from "@apollo/client";
import possibleTypes from "../possibleTypes.json";

let browserClient;

function createWooClient(ssrMode) {
  return new ApolloClient({
    link: from([
      new HttpLink({
        uri: "/api/woo-graphql",
        credentials: "same-origin",
      }),
    ]),
    cache: new InMemoryCache({
      possibleTypes,
    }),
    defaultOptions: {
      watchQuery: {
        fetchPolicy: "network-only",
        errorPolicy: "all",
      },
      query: {
        fetchPolicy: "network-only",
        errorPolicy: "all",
      },
      mutate: {
        errorPolicy: "all",
      },
    },
    ssrMode,
  });
}

/**
 * Apollo client for cart/checkout/account operations.
 * Talks to the same-origin /api/woo-graphql proxy so Woo sessions persist.
 */
export function getWooApolloClient() {
  if (typeof window === "undefined") {
    return createWooClient(true);
  }

  if (!browserClient) {
    browserClient = createWooClient(false);
  }

  return browserClient;
}
