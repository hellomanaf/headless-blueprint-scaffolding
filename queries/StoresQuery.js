import { gql } from "@apollo/client";
import {
  STORE_FIELDS,
  VENDOR_PRODUCT_FIELDS,
} from "../fragments/StoreFragment";

export const STORES_QUERY = gql`
  ${STORE_FIELDS}
  query GetStores($limit: Int = 50, $offset: Int = 0, $status: String = "approved") {
    vendors(limit: $limit, offset: $offset, status: $status) {
      ...StoreFields
    }
  }
`;

/**
 * Approved stores with nested published products (AD Multi Store Marketplace).
 * Used to list/filter the shop and attach store names to cards.
 */
export const STORES_WITH_PRODUCTS_QUERY = gql`
  ${STORE_FIELDS}
  ${VENDOR_PRODUCT_FIELDS}
  query GetStoresWithProducts(
    $limit: Int = 50
    $offset: Int = 0
    $status: String = "approved"
    $productsLimit: Int = 100
  ) {
    vendors(limit: $limit, offset: $offset, status: $status) {
      ...StoreFields
      products(limit: $productsLimit) {
        ...VendorProductFields
      }
    }
  }
`;

export const STORE_BY_SLUG_QUERY = gql`
  ${STORE_FIELDS}
  ${VENDOR_PRODUCT_FIELDS}
  query GetStoreBySlug($slug: String!, $productsLimit: Int = 24) {
    vendor(slug: $slug) {
      ...StoreFields
      products(limit: $productsLimit) {
        ...VendorProductFields
      }
    }
  }
`;

export const VENDOR_PRODUCTS_QUERY = gql`
  ${VENDOR_PRODUCT_FIELDS}
  query GetVendorProducts($vendorId: Int!, $limit: Int = 24, $offset: Int = 0) {
    vendorProducts(vendorId: $vendorId, limit: $limit, offset: $offset) {
      ...VendorProductFields
    }
  }
`;

export const PRODUCT_VENDOR_QUERY = gql`
  ${STORE_FIELDS}
  query GetProductVendor($productId: Int!) {
    productVendor(productId: $productId) {
      ...StoreFields
    }
  }
`;
