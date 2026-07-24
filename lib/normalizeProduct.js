/**
 * Normalize WooGraphQL Product or ADMV AirportProduct into a shape
 * ProductCard / shop UI can render consistently.
 *
 * @param {object} product
 * @param {object} [airportFallback] — parent airport when listing airportProducts
 */
export function normalizeProduct(product, airportFallback) {
  if (!product) return null;

  const airport =
    product.airport ||
    (airportFallback
      ? {
          databaseId:
            airportFallback.databaseId ??
            airportFallback.id ??
            product.airportId,
          name: airportFallback.name,
          slug: airportFallback.slug,
          logoUrl: airportFallback.logoUrl,
        }
      : product.airportId
        ? { databaseId: product.airportId }
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
    airport,
    __typename: product.__typename,
  };
}
