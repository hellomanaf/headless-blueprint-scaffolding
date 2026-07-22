import { gql } from "@apollo/client";
import { CUSTOMER_FRAGMENT } from "../mutations/CustomerMutations";

/**
 * Avoid `viewer` here — a misconfigured JWT plugin can 500 the whole query.
 * Registered customers have a non-null databaseId.
 */
export const GET_CUSTOMER_QUERY = gql`
  ${CUSTOMER_FRAGMENT}
  query GetCustomer {
    customer {
      ...CustomerFragment
      orders(first: 20) {
        nodes {
          databaseId
          orderNumber
          date
          status
          total
        }
      }
    }
  }
`;
