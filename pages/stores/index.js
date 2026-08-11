import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
import { useQuery } from "@apollo/client";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import EntryHeader from "../../components/EntryHeader";
import { SITE_DATA_QUERY } from "../../queries/SiteSettingsQuery";
import { HEADER_MENU_QUERY } from "../../queries/MenuQueries";
import { STORES_QUERY } from "../../queries/StoresQuery";
import styles from "../../styles/stores.module.css";

export default function StoresPage() {
  const siteDataQuery = useQuery(SITE_DATA_QUERY) || {};
  const headerMenuDataQuery = useQuery(HEADER_MENU_QUERY) || {};
  const storesQuery = useQuery(STORES_QUERY, {
    variables: { limit: 100, status: "approved" },
    errorPolicy: "all",
    fetchPolicy: "network-only",
    nextFetchPolicy: "cache-first",
  }) || {};

  const siteData = siteDataQuery?.data?.generalSettings || {};
  const menuItems = headerMenuDataQuery?.data?.primaryMenuItems?.nodes || [];
  const { title: siteTitle, description: siteDescription } = siteData;
  const stores = storesQuery?.data?.vendors || [];
  const loading = storesQuery?.loading && !storesQuery?.data;
  const error = storesQuery?.error;

  return (
    <>
      <Head>
        <title>{siteTitle ? `Stores — ${siteTitle}` : "Stores"}</title>
      </Head>

      <Header
        siteTitle={siteTitle}
        siteDescription={siteDescription}
        menuItems={menuItems}
      />

      <main className="container">
        <EntryHeader title="Stores" />
        <p className={styles.intro}>Browse products by store.</p>

        {loading && <p className={styles.status}>Loading stores…</p>}

        {error && (
          <p className={styles.status}>
            Could not load stores. Confirm the AD Multi Store Marketplace
            GraphQL schema is available on your WordPress site.
            {error.message ? ` (${error.message})` : null}
          </p>
        )}

        {!loading && !error && stores.length === 0 && (
          <p className={styles.status}>No approved stores found.</p>
        )}

        {stores.length > 0 && (
          <section className={styles.grid} aria-label="Stores">
            {stores.map((store) => (
              <article key={store.databaseId || store.id} className={styles.card}>
                <Link
                  href={`/store/${store.slug}/`}
                  className={styles.cardLink}
                >
                  <div className={styles.logoWrapper}>
                    {store.logoUrl ? (
                      <Image
                        src={store.logoUrl}
                        alt=""
                        fill
                        sizes="(max-width: 600px) 100vw, 33vw"
                        className={styles.logo}
                      />
                    ) : (
                      <div className={styles.logoPlaceholder} aria-hidden="true" />
                    )}
                  </div>
                  <h2 className={styles.name}>{store.name}</h2>
                  {store.address && (
                    <p className={styles.address}>{store.address}</p>
                  )}
                </Link>
              </article>
            ))}
          </section>
        )}
      </main>

      <Footer />
    </>
  );
}
