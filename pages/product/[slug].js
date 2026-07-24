import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { useQuery } from "@apollo/client";
import { getNextStaticProps } from "@faustwp/core";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import AddToCartButton from "../../components/AddToCartButton";
import ShuttleBookingForm from "../../components/ShuttleBookingForm";
import { SITE_DATA_QUERY } from "../../queries/SiteSettingsQuery";
import { HEADER_MENU_QUERY } from "../../queries/MenuQueries";
import { PRODUCT_BY_SLUG_QUERY } from "../../queries/ProductBySlugQuery";
import { PRODUCT_AIRPORT_QUERY } from "../../queries/AirportsQuery";
import { SHUTTLE_PRODUCT_BY_SLUG_QUERY } from "../../queries/ShuttleQueries";
import { getErrorMessage } from "../../lib/errors";
import { REVALIDATE_SECONDS } from "../../lib/revalidate";
import styles from "../../styles/product-page.module.css";

function formatPrice(price) {
  if (!price) return null;
  return price.replace(/<[^>]*>/g, "").trim();
}

function resolveProduct(data, slug) {
  const bySlug = data?.bySlug?.nodes?.[0];
  if (bySlug) return bySlug;

  const searchNodes = data?.bySearch?.nodes || [];
  const exact = searchNodes.find(
    (item) => String(item?.slug).toLowerCase() === String(slug).toLowerCase(),
  );
  return exact || searchNodes[0] || null;
}

function ProductShell({
  siteTitle,
  siteDescription,
  menuItems,
  children,
  title,
}) {
  return (
    <>
      <Head>
        {title ? (
          <title>
            {title}
            {siteTitle ? ` — ${siteTitle}` : ""}
          </title>
        ) : null}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Caveat:wght@500;600;700&display=swap"
          rel="stylesheet"
        />
      </Head>
      <Header
        siteTitle={siteTitle}
        siteDescription={siteDescription}
        menuItems={menuItems}
      />
      <main className="container">{children}</main>
      <Footer />
    </>
  );
}

function ShuttleProductPage({
  shuttle,
  siteTitle,
  siteDescription,
  menuItems,
}) {
  const mapImage = shuttle.mapImage;

  return (
    <ProductShell
      siteTitle={siteTitle}
      siteDescription={siteDescription}
      menuItems={menuItems}
      title={shuttle.name || "Book your shuttle"}
    >
      <Link href="/" className={styles.backLink}>
        ← Back to shop
      </Link>

      <article className={styles.shuttleLayout}>
        <div className={styles.shuttleMedia}>
          {mapImage?.url ? (
            <Image
              src={mapImage.url}
              alt={mapImage.alt || shuttle.routeName || shuttle.name}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className={styles.image}
              priority
            />
          ) : (
            <div className={styles.placeholder} aria-hidden="true" />
          )}
        </div>

        <div className={styles.shuttleDetails}>
          <ShuttleBookingForm product={shuttle} />

          {shuttle.name && (
            <p className={styles.shuttleProductName}>{shuttle.name}</p>
          )}
        </div>
      </article>
    </ProductShell>
  );
}

export default function ProductPage(props) {
  const router = useRouter();
  const slug = props.slug || router.query.slug;
  const slugValue = String(slug || "");

  const siteDataQuery = useQuery(SITE_DATA_QUERY) || {};
  const headerMenuDataQuery = useQuery(HEADER_MENU_QUERY) || {};

  const {
    data: shuttleData,
    loading: shuttleLoading,
  } = useQuery(SHUTTLE_PRODUCT_BY_SLUG_QUERY, {
    variables: { slug: slugValue },
    skip: !slugValue,
    errorPolicy: "ignore",
    fetchPolicy: "network-only",
    nextFetchPolicy: "cache-first",
  });

  const shuttle = shuttleData?.shuttleProduct || null;

  const { data, loading, error } = useQuery(PRODUCT_BY_SLUG_QUERY, {
    variables: { slug: slugValue },
    skip: !slugValue,
    errorPolicy: "all",
    fetchPolicy: "network-only",
    nextFetchPolicy: "cache-first",
  });

  const siteData = siteDataQuery?.data?.generalSettings || {};
  const menuItems = headerMenuDataQuery?.data?.primaryMenuItems?.nodes || {
    nodes: [],
  };
  const { title: siteTitle, description: siteDescription } = siteData;
  const product = resolveProduct(data, slug);

  const { data: airportData } = useQuery(PRODUCT_AIRPORT_QUERY, {
    variables: { productId: Number(product?.databaseId) },
    skip: !product?.databaseId || Boolean(shuttle),
    errorPolicy: "all",
  });
  const airport = airportData?.productAirport || null;

  // Prefer shuttle booking UI when AD Shuttle Product resolves for this slug.
  if (shuttle) {
    return (
      <ShuttleProductPage
        shuttle={shuttle}
        siteTitle={siteTitle}
        siteDescription={siteDescription}
        menuItems={menuItems}
      />
    );
  }

  // Wait for shuttle check so we don't flash the generic PDP first.
  if (shuttleLoading || (loading && !product)) {
    return (
      <ProductShell
        siteTitle={siteTitle}
        siteDescription={siteDescription}
        menuItems={menuItems}
      >
        <p className={styles.status}>Loading product…</p>
      </ProductShell>
    );
  }

  if (!product) {
    const details = getErrorMessage(error, "");
    return (
      <ProductShell
        siteTitle={siteTitle}
        siteDescription={siteDescription}
        menuItems={menuItems}
      >
        <p className={styles.status}>
          Product not found
          {slug ? ` for “${slug}”` : ""}.
        </p>
        {details && !/internal server error/i.test(details) && (
          <p className={styles.status}>{details}</p>
        )}
        <p className={styles.status}>
          If you recently changed the product category or name, confirm the
          product slug in WordPress (Products → edit product → permalink) and
          visit Settings → Permalinks → Save to flush rewrite rules.
        </p>
        <Link href="/" className={styles.backLink}>
          ← Back to shop
        </Link>
      </ProductShell>
    );
  }

  const displayPrice = formatPrice(
    product.onSale && product.salePrice ? product.salePrice : product.price,
  );
  const originalPrice = product.onSale
    ? formatPrice(product.regularPrice)
    : null;

  return (
    <ProductShell
      siteTitle={siteTitle}
      siteDescription={siteDescription}
      menuItems={menuItems}
      title={product.name}
    >
      <Link href="/" className={styles.backLink}>
        ← Back to shop
      </Link>

      <article className={styles.layout}>
        <div className={styles.imageWrapper}>
          {product.image?.sourceUrl ? (
            <Image
              src={product.image.sourceUrl}
              alt={product.image.altText || product.name}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className={styles.image}
              priority
            />
          ) : (
            <div className={styles.placeholder} aria-hidden="true" />
          )}
        </div>

        <div className={styles.details}>
          <h1 className={styles.title}>{product.name}</h1>

          {airport?.name && (
            <p className={styles.vendor}>
              {airport.slug ? (
                <Link
                  href={`/airport/${airport.slug}/`}
                  className={styles.vendorLink}
                >
                  {airport.name}
                </Link>
              ) : (
                airport.name
              )}
            </p>
          )}

          {displayPrice && (
            <p className={styles.price}>
              {product.onSale && originalPrice && (
                <span className={styles.regularPrice}>{originalPrice}</span>
              )}
              <span className={product.onSale ? styles.salePrice : undefined}>
                {displayPrice}
              </span>
            </p>
          )}

          <AddToCartButton
            productId={product.databaseId}
            stockStatus={product.stockStatus}
          />

          {product.shortDescription && (
            <div
              className={styles.shortDescription}
              dangerouslySetInnerHTML={{ __html: product.shortDescription }}
            />
          )}

          {product.description && (
            <div
              className={styles.description}
              dangerouslySetInnerHTML={{ __html: product.description }}
            />
          )}
        </div>
      </article>
    </ProductShell>
  );
}

export async function getStaticProps(context) {
  const slug = context.params?.slug;

  return getNextStaticProps(context, {
    Page: ProductPage,
    props: { slug },
    revalidate: REVALIDATE_SECONDS,
  });
}

export async function getStaticPaths() {
  return {
    paths: [],
    fallback: "blocking",
  };
}

ProductPage.queries = [
  {
    query: SITE_DATA_QUERY,
  },
  {
    query: HEADER_MENU_QUERY,
  },
  {
    query: PRODUCT_BY_SLUG_QUERY,
    variables: (seedNode, ctx) => ({
      slug: String(seedNode?.slug || ctx?.params?.slug || ""),
    }),
  },
];
