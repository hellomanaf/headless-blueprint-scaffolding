import { useEffect, useMemo, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useQuery } from "@apollo/client";
import { getNextStaticProps } from "@faustwp/core";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { SITE_DATA_QUERY } from "../queries/SiteSettingsQuery";
import { HEADER_MENU_QUERY } from "../queries/MenuQueries";
import { GET_ORDER_QUERY } from "../mutations/CheckoutMutations";
import { getWooApolloClient } from "../lib/wooClient";
import { readLastOrder } from "../lib/orderStorage";
import styles from "../styles/order-received.module.css";

function stripHtml(value) {
  if (!value) return "";
  return String(value).replace(/<[^>]*>/g, "").trim();
}

export default function OrderReceivedPage() {
  const router = useRouter();
  const orderParam = router.query.order;
  const wooClient = getWooApolloClient();

  const [storedOrder, setStoredOrder] = useState(null);

  const siteDataQuery = useQuery(SITE_DATA_QUERY) || {};
  const headerMenuDataQuery = useQuery(HEADER_MENU_QUERY) || {};

  const { data: orderData, loading: orderLoading } = useQuery(GET_ORDER_QUERY, {
    client: wooClient,
    skip: typeof window === "undefined" || !orderParam,
    variables: { id: String(orderParam || "") },
    ssr: false,
    fetchPolicy: "network-only",
  });

  useEffect(() => {
    const last = readLastOrder();
    if (!last) return;

    const matchesParam =
      !orderParam ||
      String(last.orderNumber) === String(orderParam) ||
      String(last.databaseId) === String(orderParam);

    if (matchesParam) {
      setStoredOrder(last);
    }
  }, [orderParam]);

  const siteData = siteDataQuery?.data?.generalSettings || {};
  const menuItems = headerMenuDataQuery?.data?.primaryMenuItems?.nodes || [];
  const { title: siteTitle, description: siteDescription } = siteData;

  const order = orderData?.order || storedOrder;
  const lineItems = order?.lineItems?.nodes || [];

  const billingName = useMemo(() => {
    if (!order?.billing) return "";
    return [order.billing.firstName, order.billing.lastName]
      .filter(Boolean)
      .join(" ");
  }, [order]);

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
          <p className={styles.lead}>Your order has been received.</p>

          {orderLoading && !order && <p>Loading order details…</p>}

          {(order?.orderNumber || order?.databaseId || orderParam) && (
            <p className={styles.meta}>
              Order number:{" "}
              <strong>
                #{order?.orderNumber || order?.databaseId || orderParam}
              </strong>
            </p>
          )}

          {order && (
            <div className={styles.details}>
              <div className={styles.detailRow}>
                <span>Date</span>
                <strong>
                  {order.date
                    ? new Date(order.date).toLocaleString()
                    : "—"}
                </strong>
              </div>
              <div className={styles.detailRow}>
                <span>Status</span>
                <strong>{order.status || "—"}</strong>
              </div>
              <div className={styles.detailRow}>
                <span>Payment</span>
                <strong>{order.paymentMethodTitle || "—"}</strong>
              </div>
              <div className={styles.detailRow}>
                <span>Total</span>
                <strong>{stripHtml(order.total) || "—"}</strong>
              </div>

              {lineItems.length > 0 && (
                <>
                  <h2 className={styles.sectionTitle}>Items</h2>
                  <ul className={styles.lineItems}>
                    {lineItems.map((item, index) => {
                      const name =
                        item.variation?.node?.name ||
                        item.product?.node?.name ||
                        "Item";
                      return (
                        <li key={item.databaseId || index}>
                          <span>
                            {name} × {item.quantity}
                          </span>
                          <span>{stripHtml(item.total)}</span>
                        </li>
                      );
                    })}
                  </ul>
                </>
              )}

              {order.billing && (
                <>
                  <h2 className={styles.sectionTitle}>Billing</h2>
                  <address className={styles.address}>
                    {billingName && <div>{billingName}</div>}
                    {order.billing.address1 && <div>{order.billing.address1}</div>}
                    {order.billing.address2 && <div>{order.billing.address2}</div>}
                    <div>
                      {[order.billing.city, order.billing.state, order.billing.postcode]
                        .filter(Boolean)
                        .join(", ")}
                    </div>
                    {order.billing.country && <div>{order.billing.country}</div>}
                    {order.billing.email && <div>{order.billing.email}</div>}
                    {order.billing.phone && <div>{order.billing.phone}</div>}
                  </address>
                </>
              )}
            </div>
          )}

          {!order && !orderLoading && (
            <p className={styles.hint}>
              Order placed successfully. You can review past orders in your
              account.
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
