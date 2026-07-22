import { gql } from "@apollo/client";
import { PRODUCT_LIST_FRAGMENT } from "../fragments/ProductListFragment";

export const PRODUCT_BY_SLUG_QUERY = gql`
  ${PRODUCT_LIST_FRAGMENT}
  query GetProductBySlug($slug: ID!) {
    product(id: $slug, idType: SLUG) {
      ...ProductListFragment
      description
      ... on SimpleProduct {
        stockStatus
      }
      ... on VariableProduct {
        stockStatus
      }
    }
  }
`;
