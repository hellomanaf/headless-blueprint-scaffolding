import { gql } from "@apollo/client";
import { PRODUCT_FIELDS } from "../fragments/ProductListFragment";

/**
 * Look up by exact slug first, then search fallback (handles renamed slugs).
 */
export const PRODUCT_BY_SLUG_QUERY = gql`
  ${PRODUCT_FIELDS}
  query GetProductBySlug($slug: String!) {
    bySlug: products(first: 1, where: { slugIn: [$slug] }) {
      nodes {
        __typename
        ...SimpleProductFields
        ...VariableProductFields
        ...ExternalProductFields
        ...GroupProductFields
        ... on SimpleProduct {
          description
          stockStatus
        }
        ... on VariableProduct {
          description
          stockStatus
        }
        ... on ExternalProduct {
          description
        }
        ... on GroupProduct {
          description
        }
      }
    }
    bySearch: products(first: 5, where: { search: $slug }) {
      nodes {
        __typename
        ...SimpleProductFields
        ...VariableProductFields
        ...ExternalProductFields
        ...GroupProductFields
        ... on SimpleProduct {
          description
          stockStatus
        }
        ... on VariableProduct {
          description
          stockStatus
        }
        ... on ExternalProduct {
          description
        }
        ... on GroupProduct {
          description
        }
      }
    }
  }
`;
