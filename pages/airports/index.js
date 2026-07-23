import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
import { useQuery } from "@apollo/client";
import Header from "../components/Header";
import Footer from "../components/Footer";
import EntryHeader from "../components/EntryHeader";
import { SITE_DATA_QUERY } from "../queries/SiteSettingsQuery";
import { HEADER_MENU_QUERY } from "../queries/MenuQueries";
import { AIRPORTS_QUERY } from "../queries/AirportsQuery";
import styles from "../styles/airports.module.css";

export default function AirportsPage() {
  const siteDataQuery = useQuery(SITE_DATA_QUERY) || {};
  const headerMenuDataQuery = useQuery(HEADER_MENU_QUERY) || {};
  const airportsQuery = useQuery(AIRPORTS_QUERY, {
    variables: { limit: 100, status: "approved" },
    errorPolicy: "all",
  }) || {};

  const siteData = siteDataQuery?.data?.generalSettings || {};
  const menuItems = headerMenuDataQuery?.data?.primaryMenuItems?.nodes || [];
  const { title: siteTitle, description: siteDescription } = siteData;
  const airports = airportsQuery?.data?.airports || [];
  const loading = airportsQuery?.loading && !airportsQuery?.data;
  const error = airportsQuery?.error;

  return (
    <>
      <Head>
        <title>{siteTitle ? `Airports — ${siteTitle}` : "Airports"}</title>
      </Head>

      <Header
        siteTitle={siteTitle}
        siteDescription={siteDescription}
        menuItems={menuItems}
      />

      <main className="container">
        <EntryHeader title="Airports" />
        <p className={styles.intro}>
          Browse products by airport store.
        </p>

        {loading && <p className={styles.status}>Loading airports…</p>}

        {error && (
          <p className={styles.status}>
            Could not load airports. Confirm the ADMV GraphQL schema is
            available on your WordPress site.
            {error.message ? ` (${error.message})` : null}
          </p>
        )}

        {!loading && !error && airports.length === 0 && (
          <p className={styles.status}>No approved airports found.</p>
        )}

        {airports.length > 0 && (
          <section className={styles.grid} aria-label="Airports">
            {airports.map((airport) => (
              <article key={airport.databaseId || airport.id} className={styles.card}>
                <Link
                  href={`/airport/${airport.slug}/`}
                  className={styles.cardLink}
                >
                  <div className={styles.logoWrapper}>
                    {airport.logoUrl ? (
                      <Image
                        src={airport.logoUrl}
                        alt=""
                        fill
                        sizes="(max-width: 600px) 100vw, 33vw"
                        className={styles.logo}
                      />
                    ) : (
                      <div className={styles.logoPlaceholder} aria-hidden="true" />
                    )}
                  </div>
                  <h2 className={styles.name}>{airport.name}</h2>
                  {airport.address && (
                    <p className={styles.address}>{airport.address}</p>
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
