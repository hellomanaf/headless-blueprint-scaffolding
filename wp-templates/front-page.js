import Head from "next/head";
import Header from "../components/Header";
import EntryHeader from "../components/EntryHeader";
import Footer from "../components/Footer";
import ProductCard from "../components/ProductCard";
import style from "../styles/front-page.module.css";
import { SITE_DATA_QUERY } from "../queries/SiteSettingsQuery";
import { HEADER_MENU_QUERY } from "../queries/MenuQueries";
import { PRODUCTS_QUERY } from "../queries/ProductsQuery";
import { useQuery } from "@apollo/client";
import { getNextStaticProps } from "@faustwp/core";

const PRODUCTS_PER_PAGE = 12;

export default function FrontPage(props) {
  // Loading state for previews
  if (props.loading) {
    return <>Loading...</>;
  }

  const siteDataQuery = useQuery(SITE_DATA_QUERY) || {};
  const headerMenuDataQuery = useQuery(HEADER_MENU_QUERY) || {};
  const productsQuery = useQuery(PRODUCTS_QUERY, {
    variables: { first: PRODUCTS_PER_PAGE },
  }) || {};

  const siteData = siteDataQuery?.data?.generalSettings || {};
  const menuItems = headerMenuDataQuery?.data?.primaryMenuItems?.nodes || {
    nodes: [],
  };
  const { title: siteTitle, description: siteDescription } = siteData;
  const products = productsQuery?.data?.products?.nodes || [];
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

        {productsLoading && <p className={style.status}>Loading products…</p>}

        {productsError && (
          <p className={style.status}>
            Could not load products. Make sure the{" "}
            <strong>WPGraphQL for WooCommerce</strong> plugin is installed and
            active on your WordPress site.
            {productsError.message ? ` (${productsError.message})` : null}
          </p>
        )}

        {!productsLoading && !productsError && products.length === 0 && (
          <p className={style.status}>No products found.</p>
        )}

        {products.length > 0 && (
          <section className={style.productGrid} aria-label="Products">
            {products.map((product) => (
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
];
