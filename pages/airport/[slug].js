import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/router";
import { useQuery } from "@apollo/client";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import ProductCard from "../../components/ProductCard";
import { SITE_DATA_QUERY } from "../../queries/SiteSettingsQuery";
import { HEADER_MENU_QUERY } from "../../queries/MenuQueries";
import { AIRPORT_BY_SLUG_QUERY } from "../../queries/AirportsQuery";
import { getErrorMessage } from "../../lib/errors";
import styles from "../../styles/airport-page.module.css";
import productGridStyles from "../../styles/front-page.module.css";

const PRODUCTS_LIMIT = 48;

export default function AirportPage() {
  const router = useRouter();
  const slug = router.query.slug ? String(router.query.slug) : "";

  const siteDataQuery = useQuery(SITE_DATA_QUERY) || {};
  const headerMenuDataQuery = useQuery(HEADER_MENU_QUERY) || {};
  const { data, loading, error } = useQuery(AIRPORT_BY_SLUG_QUERY, {
    variables: { slug, productsLimit: PRODUCTS_LIMIT },
    skip: !slug,
    errorPolicy: "all",
    fetchPolicy: "network-only",
    nextFetchPolicy: "cache-first",
  });

  const siteData = siteDataQuery?.data?.generalSettings || {};
  const menuItems = headerMenuDataQuery?.data?.primaryMenuItems?.nodes || [];
  const { title: siteTitle, description: siteDescription } = siteData;
  const airport = data?.airport;

  if (loading && !airport) {
    return (
      <>
        <Header
          siteTitle={siteTitle}
          siteDescription={siteDescription}
          menuItems={menuItems}
        />
        <main className="container">
          <p className={styles.status}>Loading airport…</p>
        </main>
        <Footer />
      </>
    );
  }

  if (!airport) {
    const details = getErrorMessage(error, "");
    return (
      <>
        <Header
          siteTitle={siteTitle}
          siteDescription={siteDescription}
          menuItems={menuItems}
        />
        <main className="container">
          <p className={styles.status}>
            Airport not found{slug ? ` for “${slug}”` : ""}.
          </p>
          {details && <p className={styles.status}>{details}</p>}
          <Link href="/airports/" className={styles.backLink}>
            ← All airports
          </Link>
        </main>
        <Footer />
      </>
    );
  }

  const products = airport.products || [];

  return (
    <>
      <Head>
        <title>
          {airport.name}
          {siteTitle ? ` — ${siteTitle}` : ""}
        </title>
      </Head>

      <Header
        siteTitle={siteTitle}
        siteDescription={siteDescription}
        menuItems={menuItems}
      />

      <main className="container">
        <Link href="/airports/" className={styles.backLink}>
          ← All airports
        </Link>

        <header className={styles.header}>
          {airport.logoUrl && (
            <div className={styles.logoWrapper}>
              <Image
                src={airport.logoUrl}
                alt=""
                fill
                sizes="96px"
                className={styles.logo}
                priority
              />
            </div>
          )}
          <div>
            <h1 className={styles.title}>{airport.name}</h1>
            {airport.address && (
              <p className={styles.meta}>{airport.address}</p>
            )}
          </div>
        </header>

        {airport.description && (
          <div
            className={styles.description}
            dangerouslySetInnerHTML={{ __html: airport.description }}
          />
        )}

        <h2 className={styles.sectionTitle}>Products</h2>

        {products.length === 0 ? (
          <p className={styles.status}>No products at this airport yet.</p>
        ) : (
          <section
            className={productGridStyles.productGrid}
            aria-label={`Products at ${airport.name}`}
          >
            {products.map((product) => (
              <ProductCard
                key={product.databaseId}
                product={product}
                airport={airport}
              />
            ))}
          </section>
        )}
      </main>

      <Footer />
    </>
  );
}
