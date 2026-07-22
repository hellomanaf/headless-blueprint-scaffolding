import { gql } from "@apollo/client";

export const CUSTOMER_FRAGMENT = gql`
  fragment CustomerFragment on Customer {
    id
    databaseId
    email
    firstName
    lastName
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
  }
`;

export const LOGIN_MUTATION = gql`
  ${CUSTOMER_FRAGMENT}
  mutation LoginUser($username: String!, $password: String!) {
    login(input: { username: $username, password: $password }) {
      authToken
      refreshToken
      customer {
        ...CustomerFragment
      }
    }
  }
`;

/**
 * Avoid requesting authToken/refreshToken first — those fields 400 when JWT
 * auth is not available. A second mutation with tokens is used when present.
 */
export const REGISTER_CUSTOMER_MUTATION = gql`
  ${CUSTOMER_FRAGMENT}
  mutation RegisterCustomer($input: RegisterCustomerInput!) {
    registerCustomer(input: $input) {
      customer {
        ...CustomerFragment
      }
    }
  }
`;

export const REGISTER_CUSTOMER_WITH_AUTH_MUTATION = gql`
  ${CUSTOMER_FRAGMENT}
  mutation RegisterCustomerWithAuth($input: RegisterCustomerInput!) {
    registerCustomer(input: $input) {
      authToken
      refreshToken
      customer {
        ...CustomerFragment
      }
    }
  }
`;

export const UPDATE_CUSTOMER_MUTATION = gql`
  ${CUSTOMER_FRAGMENT}
  mutation UpdateCustomer($input: UpdateCustomerInput!) {
    updateCustomer(input: $input) {
      customer {
        ...CustomerFragment
      }
    }
  }
`;
