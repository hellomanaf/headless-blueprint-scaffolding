import Head from "next/head";
import { useMemo, useState } from "react";
import Header from "../components/Header";
import EntryHeader from "../components/EntryHeader";
import Footer from "../components/Footer";
import ProductCard from "../components/ProductCard";
import style from "../styles/front-page.module.css";
import { SITE_DATA_QUERY } from "../queries/SiteSettingsQuery";
import { HEADER_MENU_QUERY } from "../queries/MenuQueries";
import { STORES_WITH_PRODUCTS_QUERY } from "../queries/StoresQuery";
import { useQuery } from "@apollo/client";

const PRODUCTS_LIMIT = 100;

export default function FrontPage(props) {
  const [selectedStoreId, setSelectedStoreId] = useState("all");
  const isPreviewLoading = Boolean(props.loading);

  const siteDataQuery = useQuery(SITE_DATA_QUERY, {
    skip: isPreviewLoading,
  }) || {};
  const headerMenuDataQuery = useQuery(HEADER_MENU_QUERY, {
    skip: isPreviewLoading,
  }) || {};
  const storesQuery =
    useQuery(STORES_WITH_PRODUCTS_QUERY, {
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

  const stores = storesQuery?.data?.vendors || [];

  const catalog = useMemo(() => {
    const items = [];
    for (const store of stores) {
      for (const product of store.products || []) {
        items.push({ product, store });
      }
    }
    return items;
  }, [stores]);

  const filteredCatalog = useMemo(() => {
    if (selectedStoreId === "all") return catalog;
    return catalog.filter(
      (item) => String(item.store.databaseId) === String(selectedStoreId),
    );
  }, [catalog, selectedStoreId]);

  if (isPreviewLoading) {
    return <>Loading...</>;
  }

  const siteData = siteDataQuery?.data?.generalSettings || {};
  const menuItems = headerMenuDataQuery?.data?.primaryMenuItems?.nodes || {
    nodes: [],
  };
  const { title: siteTitle, description: siteDescription } = siteData;
  const loading = storesQuery?.loading && !storesQuery?.data;
  const error = storesQuery?.error;

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

        {stores.length > 0 && (
          <div
            className={style.storeFilters}
            role="group"
            aria-label="Filter by store"
          >
            <button
              type="button"
              className={
                selectedStoreId === "all"
                  ? style.filterActive
                  : style.filterButton
              }
              onClick={() => setSelectedStoreId("all")}
            >
              All stores
            </button>
            {stores.map((store) => {
              const id = String(store.databaseId);
              return (
                <button
                  key={id}
                  type="button"
                  className={
                    selectedStoreId === id
                      ? style.filterActive
                      : style.filterButton
                  }
                  onClick={() => setSelectedStoreId(id)}
                >
                  {store.name}
                </button>
              );
            })}
          </div>
        )}

        {loading && <p className={style.status}>Loading products…</p>}

        {error && (
          <p className={style.status}>
            Could not load store products. Confirm the AD Multi Store
            Marketplace GraphQL schema (`vendors` / `Store.products`) is
            available on your WordPress site.
            {error.message ? ` (${error.message})` : null}
          </p>
        )}

        {!loading && !error && filteredCatalog.length === 0 && (
          <p className={style.status}>
            {selectedStoreId === "all"
              ? "No products found."
              : "No products found for this store."}
          </p>
        )}

        {filteredCatalog.length > 0 && (
          <section className={style.productGrid} aria-label="Products">
            {filteredCatalog.map(({ product, store }) => (
              <ProductCard
                key={`${store.databaseId}-${product.databaseId}`}
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

FrontPage.queries = [
  {
    query: SITE_DATA_QUERY,
  },
  {
    query: HEADER_MENU_QUERY,
  },
];
