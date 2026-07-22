import { gql } from "@apollo/client";

export const CHECKOUT_MUTATION = gql`
  mutation Checkout($input: CheckoutInput!) {
    checkout(input: $input) {
      result
      redirect
      order {
        databaseId
        orderNumber
        status
        total
        date
        paymentMethodTitle
        billing {
          firstName
          lastName
          email
          phone
          address1
          address2
          city
          state
          postcode
          country
        }
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
