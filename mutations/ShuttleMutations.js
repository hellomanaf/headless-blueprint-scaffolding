import { gql } from "@apollo/client";

export const ADD_SHUTTLE_TO_CART_MUTATION = gql`
  mutation AddShuttleToCart(
    $productId: Int!
    $journeyType: String!
    $tripId: String!
    $travelDate: String!
    $adults: Int!
    $children: Int!
    $infants: Int!
    $returnTripId: String
    $returnDate: String
  ) {
    addShuttleToCart(
      input: {
        productId: $productId
        journeyType: $journeyType
        tripId: $tripId
        travelDate: $travelDate
        adults: $adults
        children: $children
        infants: $infants
        returnTripId: $returnTripId
        returnDate: $returnDate
      }
    ) {
      result {
        success
        cartItemKey
        cartUrl
        checkoutUrl
        cartCount
        cartTotal
        booking {
          price
          seats
          legs
          tripLabel
          returnTripLabel
        }
      }
    }
  }
`;
