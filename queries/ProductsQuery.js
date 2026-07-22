import { gql } from "@apollo/client";
import { PRODUCT_LIST_FRAGMENT } from "../fragments/ProductListFragment";

export const PRODUCTS_QUERY = gql`
  ${PRODUCT_LIST_FRAGMENT}
  query GetProducts($first: Int = 12) {
    products(first: $first) {
      nodes {
        ...ProductListFragment
      }
    }
  }
`;
