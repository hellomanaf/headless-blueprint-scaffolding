import { gql } from "@apollo/client";
import { PRODUCT_FIELDS } from "../fragments/ProductListFragment";

/**
 * Use products(where: { slugIn }) instead of product(idType: SLUG).
 * The singular SLUG resolver often returns a generic "Internal server error"
 * after category/permalink changes in WooCommerce.
 */
export const PRODUCT_BY_SLUG_QUERY = gql`
  ${PRODUCT_FIELDS}
  query GetProductBySlug($slug: String!) {
    products(first: 1, where: { slugIn: [$slug] }) {
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
