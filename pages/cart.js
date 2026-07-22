import { useState } from "react";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { useQuery } from "@apollo/client";
import { getNextStaticProps } from "@faustwp/core";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useCart } from "../context/CartContext";
import { SITE_DATA_QUERY } from "../queries/SiteSettingsQuery";
import { HEADER_MENU_QUERY } from "../queries/MenuQueries";
import styles from "../styles/cart.module.css";

export default function CartPage() {
  const siteDataQuery = useQuery(SITE_DATA_QUERY) || {};
  const headerMenuDataQuery = useQuery(HEADER_MENU_QUERY) || {};
  const {
    items,
    cart,
    loading,
    error,
    isUpdating,
    formatPrice,
    updateQuantity,
    removeItem,
    emptyCart,
  } = useCart();
  const [actionError, setActionError] = useState("");

  const siteData = siteDataQuery?.data?.generalSettings || {};
  const menuItems = headerMenuDataQuery?.data?.primaryMenuItems?.nodes || [];
  const { title: siteTitle, description: siteDescription } = siteData;

  async function handleQuantityChange(key, quantity) {
    setActionError("");
    const qty = Number(quantity);
    if (qty < 1) return;
    try {
      await updateQuantity(key, qty);
    } catch (err) {
      setActionError(err.message || "Could not update quantity");
    }
  }

  async function handleRemove(key) {
    setActionError("");
    try {
      await removeItem(key);
    } catch (err) {
      setActionError(err.message || "Could not remove item");
    }
  }

  async function handleEmpty() {
    setActionError("");
    try {
      await emptyCart();
    } catch (err) {
      setActionError(err.message || "Could not empty cart");
    }
  }

  return (
    <>
      <Head>
        <title>{siteTitle ? `Cart — ${siteTitle}` : "Cart"}</title>
      </Head>

      <Header
        siteTitle={siteTitle}
        siteDescription={siteDescription}
        menuItems={menuItems}
      />

      <main className="container">
        <h1 className={styles.title}>Cart</h1>

        {loading && !cart && <p>Loading cart…</p>}
        {error && (
          <p className={styles.error}>
            {/internal server error/i.test(error.message)
              ? "Could not load cart from the store. Try refreshing. If this persists, check WooCommerce / WPGraphQL on WordPress."
              : error.message}
          </p>
        )}
        {actionError && <p className={styles.error}>{actionError}</p>}

        {!loading && !error && (!items || items.length === 0) && (
          <div className={styles.empty}>
            <p>Your cart is empty.</p>
            <Link href="/" className={styles.linkButton}>
              Continue shopping
            </Link>
          </div>
        )}

        {error && (!items || items.length === 0) && (
          <div className={styles.empty}>
            <Link href="/" className={styles.linkButton}>
              Continue shopping
            </Link>
          </div>
        )}

        {items?.length > 0 && (
          <>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Price</th>
                    <th>Quantity</th>
                    <th>Total</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => {
                    const product = item.product?.node;
                    const variation = item.variation?.node;
                    const name = variation?.name || product?.name;
                    const image =
                      variation?.image?.sourceUrl || product?.image?.sourceUrl;
                    const alt =
                      variation?.image?.altText ||
                      product?.image?.altText ||
                      name;
                    const unitPrice = formatPrice(
                      variation?.price || product?.price,
                    );

                    return (
                      <tr key={item.key}>
                        <td className={styles.productCell}>
                          {image ? (
                            <Image
                              src={image}
                              alt={alt}
                              width={64}
                              height={64}
                              className={styles.thumb}
                            />
                          ) : (
                            <div className={styles.thumbPlaceholder} />
                          )}
                          <Link href={`/product/${product?.slug}/`}>
                            {name}
                          </Link>
                        </td>
                        <td>{unitPrice}</td>
                        <td>
                          <input
                            type="number"
                            min="1"
                            className={styles.qty}
                            value={item.quantity}
                            disabled={isUpdating}
                            onChange={(e) =>
                              handleQuantityChange(item.key, e.target.value)
                            }
                          />
                        </td>
                        <td>{formatPrice(item.total)}</td>
                        <td>
                          <button
                            type="button"
                            className={styles.remove}
                            disabled={isUpdating}
                            onClick={() => handleRemove(item.key)}
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className={styles.summary}>
              <div className={styles.totals}>
                <div className={styles.totalRow}>
                  <span>Subtotal</span>
                  <strong>{formatPrice(cart?.subtotal)}</strong>
                </div>
                <div className={styles.totalRow}>
                  <span>Total</span>
                  <strong>{formatPrice(cart?.total)}</strong>
                </div>
              </div>

              <div className={styles.actions}>
                <button
                  type="button"
                  className={styles.secondaryButton}
                  disabled={isUpdating}
                  onClick={handleEmpty}
                >
                  Empty cart
                </button>
                <Link href="/checkout/" className={styles.primaryButton}>
                  Proceed to checkout
                </Link>
              </div>
            </div>
          </>
        )}
      </main>

      <Footer />
    </>
  );
}

export async function getStaticProps(context) {
  return getNextStaticProps(context, {
    Page: CartPage,
    revalidate: 60,
  });
}

CartPage.queries = [
  { query: SITE_DATA_QUERY },
  { query: HEADER_MENU_QUERY },
];
