import { useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useMutation, useQuery } from "@apollo/client";
import { getNextStaticProps } from "@faustwp/core";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useCart } from "../context/CartContext";
import { SITE_DATA_QUERY } from "../queries/SiteSettingsQuery";
import { HEADER_MENU_QUERY } from "../queries/MenuQueries";
import { GET_CUSTOMER_QUERY } from "../queries/CustomerQueries";
import {
  CHECKOUT_MUTATION,
  PAYMENT_GATEWAYS_QUERY,
} from "../mutations/CheckoutMutations";
import { getWooApolloClient } from "../lib/wooClient";
import { getErrorMessage } from "../lib/errors";
import styles from "../styles/checkout.module.css";

const emptyAddress = {
  firstName: "",
  lastName: "",
  company: "",
  address1: "",
  address2: "",
  city: "",
  state: "",
  postcode: "",
  country: "US",
  email: "",
  phone: "",
};

export default function CheckoutPage() {
  const router = useRouter();
  const wooClient = getWooApolloClient();
  const siteDataQuery = useQuery(SITE_DATA_QUERY) || {};
  const headerMenuDataQuery = useQuery(HEADER_MENU_QUERY) || {};
  const { cart, items, loading: cartLoading, formatPrice, refetch } = useCart();
  const { data: customerData } = useQuery(GET_CUSTOMER_QUERY, {
    client: wooClient,
    ssr: false,
    skip: typeof window === "undefined",
    fetchPolicy: "network-only",
  });
  const { data: gatewaysData } = useQuery(PAYMENT_GATEWAYS_QUERY, {
    client: wooClient,
    ssr: false,
    skip: typeof window === "undefined",
  });
  const [checkout, { loading: checkingOut }] = useMutation(CHECKOUT_MUTATION, {
    client: wooClient,
  });

  const [billing, setBilling] = useState(emptyAddress);
  const [shipToDifferent, setShipToDifferent] = useState(false);
  const [shipping, setShipping] = useState(emptyAddress);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [orderNotes, setOrderNotes] = useState("");
  const [error, setError] = useState("");

  const siteData = siteDataQuery?.data?.generalSettings || {};
  const menuItems = headerMenuDataQuery?.data?.primaryMenuItems?.nodes || [];
  const { title: siteTitle, description: siteDescription } = siteData;
  const gateways = gatewaysData?.paymentGateways?.nodes || [];
  const customer = customerData?.customer;

  useEffect(() => {
    if (!customer) return;
    setBilling((prev) => ({
      ...prev,
      firstName: customer.billing?.firstName || customer.firstName || "",
      lastName: customer.billing?.lastName || customer.lastName || "",
      company: customer.billing?.company || "",
      address1: customer.billing?.address1 || "",
      address2: customer.billing?.address2 || "",
      city: customer.billing?.city || "",
      state: customer.billing?.state || "",
      postcode: customer.billing?.postcode || "",
      country: customer.billing?.country || prev.country || "US",
      email: customer.billing?.email || customer.email || "",
      phone: customer.billing?.phone || "",
    }));
    setShipping((prev) => ({
      ...prev,
      firstName: customer.shipping?.firstName || customer.firstName || "",
      lastName: customer.shipping?.lastName || customer.lastName || "",
      company: customer.shipping?.company || "",
      address1: customer.shipping?.address1 || "",
      address2: customer.shipping?.address2 || "",
      city: customer.shipping?.city || "",
      state: customer.shipping?.state || "",
      postcode: customer.shipping?.postcode || "",
      country: customer.shipping?.country || prev.country || "US",
    }));
  }, [customer]);

  useEffect(() => {
    if (!paymentMethod && gateways.length > 0) {
      setPaymentMethod(gateways[0].id);
    }
  }, [gateways, paymentMethod]);

  function updateBilling(field, value) {
    setBilling((prev) => ({ ...prev, [field]: value }));
  }

  function updateShipping(field, value) {
    setShipping((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!items?.length) {
      setError("Your cart is empty.");
      return;
    }

    if (!paymentMethod) {
      setError("Please select a payment method.");
      return;
    }

    try {
      const result = await checkout({
        variables: {
          input: {
            paymentMethod,
            billing,
            shipping: shipToDifferent ? shipping : billing,
            customerNote: orderNotes || undefined,
            shipToDifferentAddress: shipToDifferent,
          },
        },
      });

      if (result?.errors?.length) {
        throw new Error(result.errors.map((item) => item.message).join(" "));
      }

      const payload = result?.data?.checkout;
      if (!payload?.order && payload?.result !== "success") {
        throw new Error(payload?.result || "Checkout failed");
      }

      if (payload.redirect) {
        window.location.href = payload.redirect;
        return;
      }

      await refetch();
      const orderNumber = payload.order?.orderNumber || payload.order?.databaseId;
      router.push(`/order-received/?order=${orderNumber || ""}`);
    } catch (err) {
      setError(getErrorMessage(err, "Checkout failed"));
    }
  }

  const isEmpty = !cartLoading && (!items || items.length === 0);

  return (
    <>
      <Head>
        <title>{siteTitle ? `Checkout — ${siteTitle}` : "Checkout"}</title>
      </Head>

      <Header
        siteTitle={siteTitle}
        siteDescription={siteDescription}
        menuItems={menuItems}
      />

      <main className="container">
        <h1 className={styles.title}>Checkout</h1>

        {isEmpty && (
          <div className={styles.empty}>
            <p>Your cart is empty.</p>
            <Link href="/">Return to shop</Link>
          </div>
        )}

        {!isEmpty && (
          <form className={styles.layout} onSubmit={handleSubmit}>
            <div className={styles.fields}>
              <h2>Billing details</h2>
              <AddressFields values={billing} onChange={updateBilling} includeContact />

              <label className={styles.checkbox}>
                <input
                  type="checkbox"
                  checked={shipToDifferent}
                  onChange={(e) => setShipToDifferent(e.target.checked)}
                />
                Ship to a different address
              </label>

              {shipToDifferent && (
                <>
                  <h2>Shipping details</h2>
                  <AddressFields values={shipping} onChange={updateShipping} />
                </>
              )}

              <label className={styles.blockLabel}>
                Order notes
                <textarea
                  rows={3}
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  placeholder="Notes about your order"
                />
              </label>
            </div>

            <aside className={styles.sidebar}>
              <h2>Your order</h2>
              <ul className={styles.lineItems}>
                {items.map((item) => {
                  const product = item.product?.node;
                  const name = item.variation?.node?.name || product?.name;
                  return (
                    <li key={item.key}>
                      <span>
                        {name} × {item.quantity}
                      </span>
                      <span>{formatPrice(item.total)}</span>
                    </li>
                  );
                })}
              </ul>

              <div className={styles.totalRow}>
                <span>Subtotal</span>
                <strong>{formatPrice(cart?.subtotal)}</strong>
              </div>
              <div className={styles.totalRow}>
                <span>Total</span>
                <strong>{formatPrice(cart?.total)}</strong>
              </div>

              <h3>Payment</h3>
              {gateways.length === 0 && (
                <p className={styles.hint}>
                  No payment gateways available. Enable at least one method in
                  WooCommerce (e.g. Cash on delivery).
                </p>
              )}
              <div className={styles.gateways}>
                {gateways.map((gateway) => (
                  <label key={gateway.id} className={styles.gateway}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={gateway.id}
                      checked={paymentMethod === gateway.id}
                      onChange={() => setPaymentMethod(gateway.id)}
                    />
                    <span>
                      <strong>{gateway.title}</strong>
                      {gateway.description && (
                        <span
                          className={styles.gatewayDesc}
                          dangerouslySetInnerHTML={{
                            __html: gateway.description,
                          }}
                        />
                      )}
                    </span>
                  </label>
                ))}
              </div>

              {error && <p className={styles.error}>{error}</p>}

              <button
                type="submit"
                className={styles.submit}
                disabled={checkingOut || gateways.length === 0}
              >
                {checkingOut ? "Placing order…" : "Place order"}
              </button>
            </aside>
          </form>
        )}
      </main>

      <Footer />
    </>
  );
}

function AddressFields({ values, onChange, includeContact = false }) {
  return (
    <div className={styles.grid}>
      <label>
        First name *
        <input
          required
          value={values.firstName}
          onChange={(e) => onChange("firstName", e.target.value)}
        />
      </label>
      <label>
        Last name *
        <input
          required
          value={values.lastName}
          onChange={(e) => onChange("lastName", e.target.value)}
        />
      </label>
      <label className={styles.full}>
        Company
        <input
          value={values.company}
          onChange={(e) => onChange("company", e.target.value)}
        />
      </label>
      <label className={styles.full}>
        Address *
        <input
          required
          value={values.address1}
          onChange={(e) => onChange("address1", e.target.value)}
        />
      </label>
      <label className={styles.full}>
        Apartment, suite, etc.
        <input
          value={values.address2}
          onChange={(e) => onChange("address2", e.target.value)}
        />
      </label>
      <label>
        City *
        <input
          required
          value={values.city}
          onChange={(e) => onChange("city", e.target.value)}
        />
      </label>
      <label>
        State
        <input
          value={values.state}
          onChange={(e) => onChange("state", e.target.value)}
        />
      </label>
      <label>
        Postcode *
        <input
          required
          value={values.postcode}
          onChange={(e) => onChange("postcode", e.target.value)}
        />
      </label>
      <label>
        Country *
        <input
          required
          value={values.country}
          onChange={(e) => onChange("country", e.target.value)}
          placeholder="US"
        />
      </label>
      {includeContact && (
        <>
          <label>
            Email *
            <input
              required
              type="email"
              value={values.email}
              onChange={(e) => onChange("email", e.target.value)}
            />
          </label>
          <label>
            Phone
            <input
              value={values.phone}
              onChange={(e) => onChange("phone", e.target.value)}
            />
          </label>
        </>
      )}
    </div>
  );
}

export async function getStaticProps(context) {
  return getNextStaticProps(context, {
    Page: CheckoutPage,
    revalidate: 60,
  });
}

CheckoutPage.queries = [
  { query: SITE_DATA_QUERY },
  { query: HEADER_MENU_QUERY },
];
