import Head from "next/head";
import { useMemo, useState } from "react";
import Header from "../components/Header";
import EntryHeader from "../components/EntryHeader";
import Footer from "../components/Footer";
import ProductCard from "../components/ProductCard";
import style from "../styles/front-page.module.css";
import { SITE_DATA_QUERY } from "../queries/SiteSettingsQuery";
import { HEADER_MENU_QUERY } from "../queries/MenuQueries";
import { AIRPORTS_WITH_PRODUCTS_QUERY } from "../queries/AirportsQuery";
import { useQuery } from "@apollo/client";

const PRODUCTS_LIMIT = 100;

export default function FrontPage(props) {
  const [selectedAirportId, setSelectedAirportId] = useState("all");
  const isPreviewLoading = Boolean(props.loading);

  const siteDataQuery = useQuery(SITE_DATA_QUERY, {
    skip: isPreviewLoading,
  }) || {};
  const headerMenuDataQuery = useQuery(HEADER_MENU_QUERY, {
    skip: isPreviewLoading,
  }) || {};
  const airportsQuery =
    useQuery(AIRPORTS_WITH_PRODUCTS_QUERY, {
      variables: {
        limit: 100,
        status: "approved",
        productsLimit: PRODUCTS_LIMIT,
      },
      errorPolicy: "all",
      skip: isPreviewLoading,
      fetchPolicy: "network-only",
      nextFetchPolicy: "cache-first",
    }) || {};

  const airports = airportsQuery?.data?.airports || [];

  const catalog = useMemo(() => {
    const items = [];
    for (const airport of airports) {
      for (const product of airport.products || []) {
        items.push({ product, airport });
      }
    }
    return items;
  }, [airports]);

  const filteredCatalog = useMemo(() => {
    if (selectedAirportId === "all") return catalog;
    return catalog.filter(
      (item) => String(item.airport.databaseId) === String(selectedAirportId),
    );
  }, [catalog, selectedAirportId]);

  if (isPreviewLoading) {
    return <>Loading...</>;
  }

  const siteData = siteDataQuery?.data?.generalSettings || {};
  const menuItems = headerMenuDataQuery?.data?.primaryMenuItems?.nodes || {
    nodes: [],
  };
  const { title: siteTitle, description: siteDescription } = siteData;
  const loading = airportsQuery?.loading && !airportsQuery?.data;
  const error = airportsQuery?.error;

  return (
    <>
      <Head>
        <title>{siteTitle ? `${siteTitle} — Shop` : "Shop"}</title>
      </Head>

      <Header
        siteTitle={siteTitle}
        siteDescription={siteDescription}
        menuItems={menuItems}
      />

      <main className="container">
        <EntryHeader title="Shop" />

        {airports.length > 0 && (
          <div
            className={style.airportFilters}
            role="group"
            aria-label="Filter by airport"
          >
            <button
              type="button"
              className={
                selectedAirportId === "all"
                  ? style.filterActive
                  : style.filterButton
              }
              onClick={() => setSelectedAirportId("all")}
            >
              All airports
            </button>
            {airports.map((airport) => {
              const id = String(airport.databaseId);
              return (
                <button
                  key={id}
                  type="button"
                  className={
                    selectedAirportId === id
                      ? style.filterActive
                      : style.filterButton
                  }
                  onClick={() => setSelectedAirportId(id)}
                >
                  {airport.name}
                </button>
              );
            })}
          </div>
        )}

        {loading && <p className={style.status}>Loading products…</p>}

        {error && (
          <p className={style.status}>
            Could not load airport products. Confirm the ADMV GraphQL schema
            (`airports` / `Airport.products`) is available on your WordPress
            site.
            {error.message ? ` (${error.message})` : null}
          </p>
        )}

        {!loading && !error && filteredCatalog.length === 0 && (
          <p className={style.status}>
            {selectedAirportId === "all"
              ? "No products found."
              : "No products found for this airport."}
          </p>
        )}

        {filteredCatalog.length > 0 && (
          <section className={style.productGrid} aria-label="Products">
            {filteredCatalog.map(({ product, airport }) => (
              <ProductCard
                key={`${airport.databaseId}-${product.databaseId}`}
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

FrontPage.queries = [
  {
    query: SITE_DATA_QUERY,
  },
  {
    query: HEADER_MENU_QUERY,
  },
];
