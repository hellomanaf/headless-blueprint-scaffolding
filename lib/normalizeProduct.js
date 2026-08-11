/**
 * Normalize WooGraphQL Product or ADMV VendorProduct into a shape
 * ProductCard / shop UI can render consistently.
 *
 * @param {object} product
 * @param {object} [storeFallback] — parent store when listing vendorProducts
 */
export function normalizeProduct(product, storeFallback) {
  if (!product) return null;

  const store =
    product.vendor ||
    product.store ||
    (storeFallback
      ? {
          databaseId:
            storeFallback.databaseId ??
            storeFallback.id ??
            product.vendorId,
          name: storeFallback.name,
          slug: storeFallback.slug,
          logoUrl: storeFallback.logoUrl,
        }
      : product.vendorId
        ? { databaseId: product.vendorId }
        : null);

  const image =
    product.image?.sourceUrl || product.image?.mediaItemUrl
      ? product.image
      : product.imageUrl
        ? {
            sourceUrl: product.imageUrl,
            altText: product.name,
          }
        : null;

  return {
    id: product.id || String(product.databaseId),
    databaseId: product.databaseId,
    name: product.name,
    slug: product.slug,
    type: product.type || null,
    shortDescription: product.shortDescription,
    description: product.description,
    price: product.price,
    regularPrice: product.regularPrice,
    salePrice: product.salePrice,
    onSale: product.onSale,
    stockStatus: product.stockStatus,
    image,
    store,
    __typename: product.__typename,
  };
}
