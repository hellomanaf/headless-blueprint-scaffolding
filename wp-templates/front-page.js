import Head from "next/head";
import { useMemo, useState } from "react";
import Header from "../components/Header";
import EntryHeader from "../components/EntryHeader";
import Footer from "../components/Footer";
import ProductCard from "../components/ProductCard";
import style from "../styles/front-page.module.css";
import { SITE_DATA_QUERY } from "../queries/SiteSettingsQuery";
import { HEADER_MENU_QUERY } from "../queries/MenuQueries";
import { PRODUCTS_QUERY } from "../queries/ProductsQuery";
import { AIRPORTS_QUERY } from "../queries/AirportsQuery";
import { useQuery } from "@apollo/client";
import { getNextStaticProps } from "@faustwp/core";

const PRODUCTS_PER_PAGE = 24;

export default function FrontPage(props) {
  const [selectedAirportId, setSelectedAirportId] = useState("all");
  const isPreviewLoading = Boolean(props.loading);

  const siteDataQuery = useQuery(SITE_DATA_QUERY, {
    skip: isPreviewLoading,
  }) || {};
  const headerMenuDataQuery = useQuery(HEADER_MENU_QUERY, {
    skip: isPreviewLoading,
  }) || {};
  const productsQuery =
    useQuery(PRODUCTS_QUERY, {
      variables: { first: PRODUCTS_PER_PAGE },
      errorPolicy: "all",
      skip: isPreviewLoading,
    }) || {};
  const airportsQuery =
    useQuery(AIRPORTS_QUERY, {
      variables: { limit: 100, status: "approved" },
      errorPolicy: "all",
      skip: isPreviewLoading,
    }) || {};

  const products = productsQuery?.data?.products?.nodes || [];
  const filteredProducts = useMemo(() => {
    if (selectedAirportId === "all") return products;
    return products.filter((product) => {
      const airportId =
        product?.airport?.databaseId ?? product?.airportId ?? null;
      return String(airportId) === String(selectedAirportId);
    });
  }, [products, selectedAirportId]);

  if (isPreviewLoading) {
    return <>Loading...</>;
  }

  const siteData = siteDataQuery?.data?.generalSettings || {};
  const menuItems = headerMenuDataQuery?.data?.primaryMenuItems?.nodes || {
    nodes: [],
  };
  const { title: siteTitle, description: siteDescription } = siteData;
  const airports = airportsQuery?.data?.airports || [];
  const productsLoading = productsQuery?.loading && !productsQuery?.data;
  const productsError = productsQuery?.error;

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

        {productsLoading && <p className={style.status}>Loading products…</p>}

        {productsError && (
          <p className={style.status}>
            Could not load products. Make sure the{" "}
            <strong>WPGraphQL for WooCommerce</strong> plugin is installed and
            the ADMV airport fields are registered on product types.
            {productsError.message ? ` (${productsError.message})` : null}
          </p>
        )}

        {!productsLoading && !productsError && filteredProducts.length === 0 && (
          <p className={style.status}>
            {selectedAirportId === "all"
              ? "No products found."
              : "No products found for this airport."}
          </p>
        )}

        {filteredProducts.length > 0 && (
          <section className={style.productGrid} aria-label="Products">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </section>
        )}
      </main>

      <Footer />
    </>
  );
}

export async function getStaticProps(context) {
  return getNextStaticProps(context, {
    Page: FrontPage,
    revalidate: 60,
  });
}

FrontPage.queries = [
  {
    query: SITE_DATA_QUERY,
  },
  {
    query: HEADER_MENU_QUERY,
  },
  {
    query: PRODUCTS_QUERY,
    variables: () => ({
      first: PRODUCTS_PER_PAGE,
    }),
  },
  {
    query: AIRPORTS_QUERY,
    variables: () => ({
      limit: 100,
      status: "approved",
    }),
  },
];
