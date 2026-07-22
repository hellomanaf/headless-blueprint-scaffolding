import { gql } from "@apollo/client";
import { PRODUCT_FIELDS } from "../fragments/ProductListFragment";

export const PRODUCTS_QUERY = gql`
  ${PRODUCT_FIELDS}
  query GetProducts($first: Int = 12) {
    products(first: $first) {
      nodes {
        __typename
        ...SimpleProductFields
        ...VariableProductFields
        ...ExternalProductFields
        ...GroupProductFields
      }
    }
  }
`;
