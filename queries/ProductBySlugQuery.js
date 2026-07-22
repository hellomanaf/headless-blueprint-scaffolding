import { gql } from "@apollo/client";
import { PRODUCT_FIELDS } from "../fragments/ProductListFragment";

export const PRODUCT_BY_SLUG_QUERY = gql`
  ${PRODUCT_FIELDS}
  query GetProductBySlug($slug: ID!) {
    product(id: $slug, idType: SLUG) {
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
`;
