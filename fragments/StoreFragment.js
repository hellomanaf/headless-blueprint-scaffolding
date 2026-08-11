import { gql } from "@apollo/client";

/**
 * AD Multi Store Marketplace `Store` type.
 * GraphQL query names remain vendors / vendor / productVendor / vendorProducts.
 */
export const STORE_FIELDS = gql`
  fragment StoreFields on Store {
    id
    databaseId
    name
    slug
    status
    description
    email
    phone
    address
    logoId
    logoUrl
    bannerId
    bannerUrl
    createdAt
  }
`;

/**
 * Published products from vendorProducts / Store.products.
 * Field names differ from WooGraphQL Product (imageUrl vs image.sourceUrl).
 */
export const VENDOR_PRODUCT_FIELDS = gql`
  fragment VendorProductFields on VendorProduct {
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
    vendorId
  }
`;
