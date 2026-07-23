import { gql } from "@apollo/client";

/**
 * ADMV Airport type (vendor = airport in this marketplace).
 * See admv/v1 REST + WPGraphQL airport schema.
 */
export const AIRPORT_FIELDS = gql`
  fragment AirportFields on Airport {
    id
    databaseId
    name
    slug
    status
    description
    email
    phone
    address
    logoUrl
    bannerUrl
    createdAt
  }
`;

/**
 * Published products returned by airportProducts / Airport.products.
 * Field names differ from WooGraphQL Product (imageUrl vs image.sourceUrl).
 */
export const AIRPORT_PRODUCT_FIELDS = gql`
  fragment AirportProductFields on AirportProduct {
    databaseId
    name
    slug
    permalink
    type
    sku
    price
    regularPrice
    salePrice
    onSale
    stockStatus
    imageUrl
    shortDescription
    airportId
  }
`;
