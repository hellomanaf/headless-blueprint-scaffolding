import { gql } from "@apollo/client";
import {
  AIRPORT_FIELDS,
  AIRPORT_PRODUCT_FIELDS,
} from "../fragments/AirportFragment";

export const AIRPORTS_QUERY = gql`
  ${AIRPORT_FIELDS}
  query GetAirports($limit: Int = 50, $offset: Int = 0, $status: String = "approved") {
    airports(limit: $limit, offset: $offset, status: $status) {
      ...AirportFields
    }
  }
`;

export const AIRPORT_BY_SLUG_QUERY = gql`
  ${AIRPORT_FIELDS}
  ${AIRPORT_PRODUCT_FIELDS}
  query GetAirportBySlug($slug: String!, $productsLimit: Int = 24) {
    airport(slug: $slug) {
      ...AirportFields
      products(limit: $productsLimit) {
        ...AirportProductFields
      }
    }
  }
`;

export const AIRPORT_PRODUCTS_QUERY = gql`
  ${AIRPORT_PRODUCT_FIELDS}
  query GetAirportProducts($airportId: Int!, $limit: Int = 24, $offset: Int = 0) {
    airportProducts(airportId: $airportId, limit: $limit, offset: $offset) {
      ...AirportProductFields
    }
  }
`;

export const PRODUCT_AIRPORT_QUERY = gql`
  ${AIRPORT_FIELDS}
  query GetProductAirport($productId: Int!) {
    productAirport(productId: $productId) {
      ...AirportFields
    }
  }
`;
