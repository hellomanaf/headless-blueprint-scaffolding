import { gql } from "@apollo/client";

/**
 * Fields are requested on each concrete product type (not the Product
 * interface) so Apollo can match by __typename without WooCommerce entries
 * in possibleTypes.json. Run `npm run generate` after installing WooGraphQL
 * to keep possibleTypes in sync.
 *
 * `airport` / `airportId` come from the ADMV multivendor plugin when it
 * registers those fields on WooGraphQL product types.
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
    airportId
    airport {
      databaseId
      name
      slug
      logoUrl
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
    airportId
    airport {
      databaseId
      name
      slug
      logoUrl
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
    airportId
    airport {
      databaseId
      name
      slug
      logoUrl
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
    airportId
    airport {
      databaseId
      name
      slug
      logoUrl
    }
  }
`;
