import { gql } from "@apollo/client";

/**
 * Fields are requested on each concrete product type (not the Product
 * interface) so Apollo can match by __typename without WooCommerce entries
 * in possibleTypes.json. Run `npm run generate` after installing WooGraphQL
 * to keep possibleTypes in sync.
 *
 * Airport/vendor data is loaded via ADMV GraphQL (`productAirport`,
 * `airport.products`) — not as fields on WooGraphQL product types.
 */
export const PRODUCT_FIELDS = gql`
  fragment SimpleProductFields on SimpleProduct {
    id
    databaseId
    name
    slug
    shortDescription
    price
    regularPrice
    salePrice
    onSale
    image {
      id
      sourceUrl
      altText
    }
  }

  fragment VariableProductFields on VariableProduct {
    id
    databaseId
    name
    slug
    shortDescription
    price
    regularPrice
    salePrice
    onSale
    image {
      id
      sourceUrl
      altText
    }
  }

  fragment ExternalProductFields on ExternalProduct {
    id
    databaseId
    name
    slug
    shortDescription
    price
    regularPrice
    salePrice
    onSale
    image {
      id
      sourceUrl
      altText
    }
  }

  fragment GroupProductFields on GroupProduct {
    id
    databaseId
    name
    slug
    shortDescription
    image {
      id
      sourceUrl
      altText
    }
  }
`;
