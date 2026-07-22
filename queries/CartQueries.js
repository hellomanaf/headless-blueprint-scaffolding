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
              id
              databaseId
              name
              slug
              price
              image {
                sourceUrl
                altText
              }
            }
            ... on VariableProduct {
              id
              databaseId
              name
              slug
              price
              image {
                sourceUrl
                altText
              }
            }
            ... on ExternalProduct {
              id
              databaseId
              name
              slug
              price
              image {
                sourceUrl
                altText
              }
            }
            ... on GroupProduct {
              id
              databaseId
              name
              slug
              image {
                sourceUrl
                altText
              }
            }
          }
        }
        variation {
          node {
            id
            databaseId
            name
            price
            image {
              sourceUrl
              altText
            }
          }
        }
      }
    }
    subtotal
    subtotalTax
    shippingTotal
    total
    totalTax
    discountTotal
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
