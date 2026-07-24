import { gql } from "@apollo/client";

export const CART_FRAGMENT = gql`
  fragment CartFragment on Cart {
    contents {
      itemCount
      productCount
      nodes {
        key
        quantity
        total
        subtotal
        product {
          node {
            __typename
            ... on SimpleProduct {
              databaseId
              slug
              name
              price
              image {
                sourceUrl
                altText
              }
            }
            ... on VariableProduct {
              databaseId
              slug
              name
              price
              image {
                sourceUrl
                altText
              }
            }
            ... on ExternalProduct {
              databaseId
              slug
              name
              price
              image {
                sourceUrl
                altText
              }
            }
            ... on GroupProduct {
              databaseId
              slug
              name
              image {
                sourceUrl
                altText
              }
            }
          }
        }
      }
    }
    subtotal
    total
    isEmpty
  }
`;

export const GET_CART_QUERY = gql`
  ${CART_FRAGMENT}
  query GetCart {
    cart {
      ...CartFragment
    }
  }
`;
