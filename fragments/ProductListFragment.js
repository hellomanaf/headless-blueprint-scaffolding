import { gql } from "@apollo/client";

export const PRODUCT_LIST_FRAGMENT = gql`
  fragment ProductListFragment on Product {
    id
    databaseId
    name
    slug
    shortDescription
    ... on SimpleProduct {
      price
      regularPrice
      salePrice
      onSale
    }
    ... on VariableProduct {
      price
      regularPrice
      salePrice
      onSale
    }
    ... on ExternalProduct {
      price
      regularPrice
      salePrice
      onSale
    }
    image {
      id
      sourceUrl
      altText
    }
  }
`;
