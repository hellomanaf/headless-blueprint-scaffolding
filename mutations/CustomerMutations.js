import { gql } from "@apollo/client";

export const CUSTOMER_FRAGMENT = gql`
  fragment CustomerFragment on Customer {
    id
    databaseId
    email
    firstName
    lastName
    displayName
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
  mutation LoginUser($input: LoginInput!) {
    login(input: $input) {
      authToken
      refreshToken
      customer {
        ...CustomerFragment
      }
    }
  }
`;

export const REGISTER_CUSTOMER_MUTATION = gql`
  ${CUSTOMER_FRAGMENT}
  mutation RegisterCustomer($input: RegisterCustomerInput!) {
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
