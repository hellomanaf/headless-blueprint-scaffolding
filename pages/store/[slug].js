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
import { STORE_BY_SLUG_QUERY } from "../../queries/StoresQuery";
import { getErrorMessage } from "../../lib/errors";
import styles from "../../styles/store-page.module.css";
import productGridStyles from "../../styles/front-page.module.css";

const PRODUCTS_LIMIT = 48;

export default function StorePage() {
  const router = useRouter();
  const slug = router.query.slug ? String(router.query.slug) : "";

  const siteDataQuery = useQuery(SITE_DATA_QUERY) || {};
  const headerMenuDataQuery = useQuery(HEADER_MENU_QUERY) || {};
  const { data, loading, error } = useQuery(STORE_BY_SLUG_QUERY, {
    variables: { slug, productsLimit: PRODUCTS_LIMIT },
    skip: !slug,
    errorPolicy: "all",
    fetchPolicy: "network-only",
    nextFetchPolicy: "cache-first",
  });

  const siteData = siteDataQuery?.data?.generalSettings || {};
  const menuItems = headerMenuDataQuery?.data?.primaryMenuItems?.nodes || [];
  const { title: siteTitle, description: siteDescription } = siteData;
  const store = data?.vendor;

  if (loading && !store) {
    return (
      <>
        <Header
          siteTitle={siteTitle}
          siteDescription={siteDescription}
          menuItems={menuItems}
        />
        <main className="container">
          <p className={styles.status}>Loading store…</p>
        </main>
        <Footer />
      </>
    );
  }

  if (!store) {
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
            Store not found{slug ? ` for “${slug}”` : ""}.
          </p>
          {details && <p className={styles.status}>{details}</p>}
          <Link href="/stores/" className={styles.backLink}>
            ← All stores
          </Link>
        </main>
        <Footer />
      </>
    );
  }

  const products = store.products || [];

  return (
    <>
      <Head>
        <title>
          {store.name}
          {siteTitle ? ` — ${siteTitle}` : ""}
        </title>
      </Head>

      <Header
        siteTitle={siteTitle}
        siteDescription={siteDescription}
        menuItems={menuItems}
      />

      <main className="container">
        <Link href="/stores/" className={styles.backLink}>
          ← All stores
        </Link>

        <header className={styles.header}>
          {store.logoUrl && (
            <div className={styles.logoWrapper}>
              <Image
                src={store.logoUrl}
                alt=""
                fill
                sizes="96px"
                className={styles.logo}
                priority
              />
            </div>
          )}
          <div>
            <h1 className={styles.title}>{store.name}</h1>
            {store.address && (
              <p className={styles.meta}>{store.address}</p>
            )}
          </div>
        </header>

        {store.description && (
          <div
            className={styles.description}
            dangerouslySetInnerHTML={{ __html: store.description }}
          />
        )}

        <h2 className={styles.sectionTitle}>Products</h2>

        {products.length === 0 ? (
          <p className={styles.status}>No products at this store yet.</p>
        ) : (
          <section
            className={productGridStyles.productGrid}
            aria-label={`Products at ${store.name}`}
          >
            {products.map((product) => (
              <ProductCard
                key={product.databaseId}
                product={product}
                store={store}
              />
            ))}
          </section>
        )}
      </main>

      <Footer />
    </>
  );
}
