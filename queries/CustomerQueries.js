import { gql } from "@apollo/client";
import { CUSTOMER_FRAGMENT } from "../mutations/CustomerMutations";

export const GET_CUSTOMER_QUERY = gql`
  ${CUSTOMER_FRAGMENT}
  query GetCustomer {
    viewer {
      id
      name
      email
    }
    customer {
      ...CustomerFragment
      sessionToken
      orders(first: 20) {
        nodes {
          databaseId
          orderNumber
          date
          status
          total
          lineItems {
            nodes {
              quantity
              total
              product {
                node {
                  ... on SimpleProduct {
                    name
                  }
                  ... on VariableProduct {
                    name
                  }
                  ... on ExternalProduct {
                    name
                  }
                  ... on GroupProduct {
                    name
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`;
