import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useQuery } from "@apollo/client";
import { getNextStaticProps } from "@faustwp/core";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { SITE_DATA_QUERY } from "../queries/SiteSettingsQuery";
import { HEADER_MENU_QUERY } from "../queries/MenuQueries";
import styles from "../styles/order-received.module.css";

export default function OrderReceivedPage() {
  const router = useRouter();
  const order = router.query.order;
  const siteDataQuery = useQuery(SITE_DATA_QUERY) || {};
  const headerMenuDataQuery = useQuery(HEADER_MENU_QUERY) || {};

  const siteData = siteDataQuery?.data?.generalSettings || {};
  const menuItems = headerMenuDataQuery?.data?.primaryMenuItems?.nodes || [];
  const { title: siteTitle, description: siteDescription } = siteData;

  return (
    <>
      <Head>
        <title>
          {siteTitle ? `Order received — ${siteTitle}` : "Order received"}
        </title>
      </Head>

      <Header
        siteTitle={siteTitle}
        siteDescription={siteDescription}
        menuItems={menuItems}
      />

      <main className="container">
        <div className={styles.box}>
          <h1 className={styles.title}>Thank you</h1>
          <p>Your order has been received.</p>
          {order && (
            <p>
              Order number: <strong>#{order}</strong>
            </p>
          )}
          <div className={styles.actions}>
            <Link href="/" className={styles.button}>
              Continue shopping
            </Link>
            <Link href="/my-account/" className={styles.link}>
              View my account
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}

export async function getStaticProps(context) {
  return getNextStaticProps(context, {
    Page: OrderReceivedPage,
    revalidate: 60,
  });
}

OrderReceivedPage.queries = [
  { query: SITE_DATA_QUERY },
  { query: HEADER_MENU_QUERY },
];
