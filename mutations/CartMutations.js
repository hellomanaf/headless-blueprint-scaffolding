import { gql } from "@apollo/client";
import { CART_FRAGMENT } from "../queries/CartQueries";

export const ADD_TO_CART_MUTATION = gql`
  ${CART_FRAGMENT}
  mutation AddToCart($input: AddToCartInput!) {
    addToCart(input: $input) {
      cart {
        ...CartFragment
      }
    }
  }
`;

export const UPDATE_CART_ITEM_QUANTITIES_MUTATION = gql`
  ${CART_FRAGMENT}
  mutation UpdateItemQuantities($input: UpdateItemQuantitiesInput!) {
    updateItemQuantities(input: $input) {
      cart {
        ...CartFragment
      }
    }
  }
`;

export const REMOVE_ITEMS_FROM_CART_MUTATION = gql`
  ${CART_FRAGMENT}
  mutation RemoveItemsFromCart($input: RemoveItemsFromCartInput!) {
    removeItemsFromCart(input: $input) {
      cart {
        ...CartFragment
      }
    }
  }
`;

export const EMPTY_CART_MUTATION = gql`
  ${CART_FRAGMENT}
  mutation EmptyCart($input: EmptyCartInput!) {
    emptyCart(input: $input) {
      cart {
        ...CartFragment
      }
    }
  }
`;
