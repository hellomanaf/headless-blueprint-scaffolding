import { gql } from "@apollo/client";

export const SHUTTLE_PRODUCT_BY_SLUG_QUERY = gql`
  query GetShuttleProductBySlug($slug: String!) {
    shuttleProduct(slug: $slug) {
      databaseId
      name
      slug
      routeName
      origin {
        name
        lat
        lng
      }
      destination {
        name
        lat
        lng
      }
      durationMinutes
      defaultCapacity
      mapImage {
        id
        url
        alt
      }
      allowRoundTrip
      holidays
      pricing {
        adult
        child
        infant
        freeUnderAge
        childAgeMin
        childAgeMax
        currency
      }
      trips {
        id
        label
        days
        schedulePreset
        validFrom
        validUntil
        blackoutDates
        departureTime
        arrivalTime
        durationMinutes
        capacity
        origin {
          name
        }
        destination {
          name
        }
        map {
          id
          url
          alt
        }
        active
      }
    }
  }
`;

export const SHUTTLE_PRODUCT_BY_ID_QUERY = gql`
  query GetShuttleProductById($databaseId: Int!) {
    shuttleProduct(databaseId: $databaseId) {
      databaseId
      name
      slug
      routeName
      origin {
        name
        lat
        lng
      }
      destination {
        name
        lat
        lng
      }
      durationMinutes
      defaultCapacity
      mapImage {
        id
        url
        alt
      }
      allowRoundTrip
      holidays
      pricing {
        adult
        child
        infant
        freeUnderAge
        childAgeMin
        childAgeMax
        currency
      }
      trips {
        id
        label
        days
        schedulePreset
        validFrom
        validUntil
        blackoutDates
        departureTime
        arrivalTime
        durationMinutes
        capacity
        origin {
          name
        }
        destination {
          name
        }
        map {
          id
          url
          alt
        }
        active
      }
    }
  }
`;

export const SHUTTLE_AVAILABLE_DATES_QUERY = gql`
  query GetShuttleAvailableDates(
    $productId: Int!
    $tripId: String!
    $from: String!
    $to: String!
  ) {
    shuttleAvailableDates(
      productId: $productId
      tripId: $tripId
      from: $from
      to: $to
    ) {
      dates
      holidays
      blackouts
      validFrom
      validUntil
    }
  }
`;

export const SHUTTLE_AVAILABILITY_QUERY = gql`
  query GetShuttleAvailability(
    $productId: Int!
    $tripId: String!
    $travelDate: String!
  ) {
    shuttleAvailability(
      productId: $productId
      tripId: $tripId
      travelDate: $travelDate
    ) {
      capacity
      booked
      remaining
    }
  }
`;

export const SHUTTLE_QUOTE_QUERY = gql`
  query GetShuttleQuote(
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
    shuttleQuote(
      productId: $productId
      journeyType: $journeyType
      tripId: $tripId
      travelDate: $travelDate
      adults: $adults
      children: $children
      infants: $infants
      returnTripId: $returnTripId
      returnDate: $returnDate
    ) {
      currency
      pricing {
        adult
        child
        infant
        freeUnderAge
      }
      availability {
        remaining
        capacity
        booked
      }
      returnAvailability {
        remaining
        capacity
        booked
      }
      booking {
        journeyType
        tripId
        tripLabel
        travelDate
        departureTime
        arrivalTime
        origin
        destination
        returnTripId
        returnTripLabel
        returnDate
        adults
        children
        infants
        seats
        legs
        oneWayPrice
        price
      }
    }
  }
`;
