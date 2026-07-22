import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { useQuery } from "@apollo/client";
import { getNextStaticProps } from "@faustwp/core";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import AddToCartButton from "../../components/AddToCartButton";
import { SITE_DATA_QUERY } from "../../queries/SiteSettingsQuery";
import { HEADER_MENU_QUERY } from "../../queries/MenuQueries";
import { PRODUCT_BY_SLUG_QUERY } from "../../queries/ProductBySlugQuery";
import styles from "../../styles/product-page.module.css";

function formatPrice(price) {
  if (!price) return null;
  return price.replace(/<[^>]*>/g, "").trim();
}

export default function ProductPage(props) {
  const router = useRouter();
  const slug = props.slug || router.query.slug;

  const siteDataQuery = useQuery(SITE_DATA_QUERY) || {};
  const headerMenuDataQuery = useQuery(HEADER_MENU_QUERY) || {};
  const { data, loading, error } = useQuery(PRODUCT_BY_SLUG_QUERY, {
    variables: { slug },
    skip: !slug,
  });

  const siteData = siteDataQuery?.data?.generalSettings || {};
  const menuItems = headerMenuDataQuery?.data?.primaryMenuItems?.nodes || {
    nodes: [],
  };
  const { title: siteTitle, description: siteDescription } = siteData;
  const product = data?.product;

  if (loading && !product) {
    return (
      <>
        <Header
          siteTitle={siteTitle}
          siteDescription={siteDescription}
          menuItems={menuItems}
        />
        <main className="container">
          <p className={styles.status}>Loading product…</p>
        </main>
        <Footer />
      </>
    );
  }

  if (error || !product) {
    return (
      <>
        <Header
          siteTitle={siteTitle}
          siteDescription={siteDescription}
          menuItems={menuItems}
        />
        <main className="container">
          <p className={styles.status}>
            Product not found.
            {error?.message ? ` (${error.message})` : null}
          </p>
          <Link href="/" className={styles.backLink}>
            ← Back to shop
          </Link>
        </main>
        <Footer />
      </>
    );
  }

  const displayPrice = formatPrice(
    product.onSale && product.salePrice ? product.salePrice : product.price,
  );
  const originalPrice = product.onSale
    ? formatPrice(product.regularPrice)
    : null;

  return (
    <>
      <Head>
        <title>
          {product.name}
          {siteTitle ? ` — ${siteTitle}` : ""}
        </title>
      </Head>

      <Header
        siteTitle={siteTitle}
        siteDescription={siteDescription}
        menuItems={menuItems}
      />

      <main className="container">
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
      </main>

      <Footer />
    </>
  );
}

export async function getStaticProps(context) {
  const slug = context.params?.slug;

  return getNextStaticProps(context, {
    Page: ProductPage,
    props: { slug },
    revalidate: 60,
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
      slug: seedNode?.slug || ctx?.params?.slug,
    }),
  },
];
