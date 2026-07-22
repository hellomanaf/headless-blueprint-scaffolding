import { gql } from "@apollo/client";

export const ORDER_FIELDS = gql`
  fragment OrderFields on Order {
    databaseId
    orderNumber
    status
    total
    subtotal
    shippingTotal
    totalTax
    discountTotal
    date
    paymentMethodTitle
    customerNote
    billing {
      firstName
      lastName
      company
      address1
      address2
      city
      state
      postcode
      country
      email
      phone
    }
    shipping {
      firstName
      lastName
      company
      address1
      address2
      city
      state
      postcode
      country
    }
    lineItems {
      nodes {
        databaseId
        quantity
        total
        subtotal
        product {
          node {
            ... on SimpleProduct {
              name
              slug
            }
            ... on VariableProduct {
              name
              slug
            }
            ... on ExternalProduct {
              name
              slug
            }
            ... on GroupProduct {
              name
              slug
            }
          }
        }
        variation {
          node {
            name
          }
        }
      }
    }
  }
`;

export const CHECKOUT_MUTATION = gql`
  ${ORDER_FIELDS}
  mutation Checkout($input: CheckoutInput!) {
    checkout(input: $input) {
      result
      redirect
      order {
        ...OrderFields
      }
    }
  }
`;

export const PAYMENT_GATEWAYS_QUERY = gql`
  query PaymentGateways {
    paymentGateways {
      nodes {
        id
        title
        description
      }
    }
  }
`;

export const GET_ORDER_QUERY = gql`
  ${ORDER_FIELDS}
  query GetOrder($id: ID!) {
    order(id: $id, idType: DATABASE_ID) {
      ...OrderFields
    }
  }
`;
