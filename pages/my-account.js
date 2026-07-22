import { useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useMutation, useQuery } from "@apollo/client";
import { getNextStaticProps } from "@faustwp/core";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { SITE_DATA_QUERY } from "../queries/SiteSettingsQuery";
import { HEADER_MENU_QUERY } from "../queries/MenuQueries";
import { GET_CUSTOMER_QUERY } from "../queries/CustomerQueries";
import {
  LOGIN_MUTATION,
  REGISTER_CUSTOMER_MUTATION,
  UPDATE_CUSTOMER_MUTATION,
} from "../mutations/CustomerMutations";
import {
  clearWooAuth,
  getWooAuthToken,
  setWooAuthToken,
} from "../lib/wooAuth";
import styles from "../styles/my-account.module.css";

function stripHtml(value) {
  if (!value) return "";
  return value.replace(/<[^>]*>/g, "").trim();
}

export default function MyAccountPage() {
  const siteDataQuery = useQuery(SITE_DATA_QUERY) || {};
  const headerMenuDataQuery = useQuery(HEADER_MENU_QUERY) || {};
  const { data, loading, error, refetch } = useQuery(GET_CUSTOMER_QUERY, {
    ssr: false,
    fetchPolicy: "network-only",
  });

  const [login] = useMutation(LOGIN_MUTATION);
  const [registerCustomer] = useMutation(REGISTER_CUSTOMER_MUTATION);
  const [updateCustomer] = useMutation(UPDATE_CUSTOMER_MUTATION);

  const [tab, setTab] = useState("dashboard");
  const [authMode, setAuthMode] = useState("login");
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [busy, setBusy] = useState(false);
  const [hasAuthToken, setHasAuthToken] = useState(false);

  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [registerForm, setRegisterForm] = useState({
    email: "",
    username: "",
    password: "",
    firstName: "",
    lastName: "",
  });
  const [accountForm, setAccountForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
  });
  const [billingForm, setBillingForm] = useState({});
  const [shippingForm, setShippingForm] = useState({});

  const siteData = siteDataQuery?.data?.generalSettings || {};
  const menuItems = headerMenuDataQuery?.data?.primaryMenuItems?.nodes || [];
  const { title: siteTitle, description: siteDescription } = siteData;

  const viewer = data?.viewer;
  const customer = data?.customer;
  const isLoggedIn = Boolean(viewer?.id || hasAuthToken);
  const orders = customer?.orders?.nodes || [];

  useEffect(() => {
    setHasAuthToken(Boolean(getWooAuthToken()));
  }, []);

  useEffect(() => {
    if (!customer) return;
    setAccountForm({
      firstName: customer.firstName || "",
      lastName: customer.lastName || "",
      email: customer.email || "",
    });
    setBillingForm({
      firstName: customer.billing?.firstName || "",
      lastName: customer.billing?.lastName || "",
      company: customer.billing?.company || "",
      address1: customer.billing?.address1 || "",
      address2: customer.billing?.address2 || "",
      city: customer.billing?.city || "",
      state: customer.billing?.state || "",
      postcode: customer.billing?.postcode || "",
      country: customer.billing?.country || "",
      email: customer.billing?.email || customer.email || "",
      phone: customer.billing?.phone || "",
    });
    setShippingForm({
      firstName: customer.shipping?.firstName || "",
      lastName: customer.shipping?.lastName || "",
      company: customer.shipping?.company || "",
      address1: customer.shipping?.address1 || "",
      address2: customer.shipping?.address2 || "",
      city: customer.shipping?.city || "",
      state: customer.shipping?.state || "",
      postcode: customer.shipping?.postcode || "",
      country: customer.shipping?.country || "",
    });
  }, [customer]);

  async function handleLogin(event) {
    event.preventDefault();
    setFormError("");
    setFormSuccess("");
    setBusy(true);
    try {
      const result = await login({
        variables: {
          input: {
            username: loginForm.username,
            password: loginForm.password,
          },
        },
      });
      const authToken = result?.data?.login?.authToken;
      if (!authToken) {
        throw new Error(
          "Login succeeded but no auth token was returned. Install WPGraphQL JWT Authentication.",
        );
      }
      setWooAuthToken(authToken);
      setHasAuthToken(true);
      setFormSuccess("Logged in successfully.");
      await refetch();
    } catch (err) {
      setFormError(err.message || "Login failed");
    } finally {
      setBusy(false);
    }
  }

  async function handleRegister(event) {
    event.preventDefault();
    setFormError("");
    setFormSuccess("");
    setBusy(true);
    try {
      const result = await registerCustomer({
        variables: {
          input: {
            email: registerForm.email,
            username: registerForm.username || registerForm.email,
            password: registerForm.password,
            firstName: registerForm.firstName,
            lastName: registerForm.lastName,
          },
        },
      });
      const authToken = result?.data?.registerCustomer?.authToken;
      if (authToken) {
        setWooAuthToken(authToken);
        setHasAuthToken(true);
      }
      setFormSuccess("Account created successfully.");
      await refetch();
    } catch (err) {
      setFormError(err.message || "Registration failed");
    } finally {
      setBusy(false);
    }
  }

  async function handleLogout() {
    clearWooAuth();
    setHasAuthToken(false);
    setFormSuccess("Logged out.");
    setTab("dashboard");
    await refetch();
  }

  async function handleUpdateAccount(event) {
    event.preventDefault();
    setFormError("");
    setFormSuccess("");
    setBusy(true);
    try {
      await updateCustomer({
        variables: {
          input: {
            firstName: accountForm.firstName,
            lastName: accountForm.lastName,
            email: accountForm.email,
          },
        },
      });
      setFormSuccess("Account details updated.");
      await refetch();
    } catch (err) {
      setFormError(err.message || "Could not update account");
    } finally {
      setBusy(false);
    }
  }

  async function handleUpdateAddresses(event) {
    event.preventDefault();
    setFormError("");
    setFormSuccess("");
    setBusy(true);
    try {
      await updateCustomer({
        variables: {
          input: {
            billing: billingForm,
            shipping: shippingForm,
          },
        },
      });
      setFormSuccess("Addresses updated.");
      await refetch();
    } catch (err) {
      setFormError(err.message || "Could not update addresses");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Head>
        <title>{siteTitle ? `My Account — ${siteTitle}` : "My Account"}</title>
      </Head>

      <Header
        siteTitle={siteTitle}
        siteDescription={siteDescription}
        menuItems={menuItems}
      />

      <main className="container">
        <h1 className={styles.title}>My Account</h1>

        {loading && !data && <p>Loading…</p>}
        {error && <p className={styles.error}>{error.message}</p>}
        {formError && <p className={styles.error}>{formError}</p>}
        {formSuccess && <p className={styles.success}>{formSuccess}</p>}

        {!isLoggedIn ? (
          <div className={styles.auth}>
            <div className={styles.authTabs}>
              <button
                type="button"
                className={authMode === "login" ? styles.activeTab : ""}
                onClick={() => setAuthMode("login")}
              >
                Login
              </button>
              <button
                type="button"
                className={authMode === "register" ? styles.activeTab : ""}
                onClick={() => setAuthMode("register")}
              >
                Register
              </button>
            </div>

            {authMode === "login" ? (
              <form className={styles.form} onSubmit={handleLogin}>
                <label>
                  Username or email
                  <input
                    required
                    value={loginForm.username}
                    onChange={(e) =>
                      setLoginForm((prev) => ({
                        ...prev,
                        username: e.target.value,
                      }))
                    }
                  />
                </label>
                <label>
                  Password
                  <input
                    required
                    type="password"
                    value={loginForm.password}
                    onChange={(e) =>
                      setLoginForm((prev) => ({
                        ...prev,
                        password: e.target.value,
                      }))
                    }
                  />
                </label>
                <button type="submit" disabled={busy}>
                  {busy ? "Logging in…" : "Log in"}
                </button>
                <p className={styles.hint}>
                  Requires the <strong>WPGraphQL JWT Authentication</strong>{" "}
                  plugin on WordPress.
                </p>
              </form>
            ) : (
              <form className={styles.form} onSubmit={handleRegister}>
                <label>
                  First name
                  <input
                    value={registerForm.firstName}
                    onChange={(e) =>
                      setRegisterForm((prev) => ({
                        ...prev,
                        firstName: e.target.value,
                      }))
                    }
                  />
                </label>
                <label>
                  Last name
                  <input
                    value={registerForm.lastName}
                    onChange={(e) =>
                      setRegisterForm((prev) => ({
                        ...prev,
                        lastName: e.target.value,
                      }))
                    }
                  />
                </label>
                <label>
                  Email *
                  <input
                    required
                    type="email"
                    value={registerForm.email}
                    onChange={(e) =>
                      setRegisterForm((prev) => ({
                        ...prev,
                        email: e.target.value,
                      }))
                    }
                  />
                </label>
                <label>
                  Username
                  <input
                    value={registerForm.username}
                    onChange={(e) =>
                      setRegisterForm((prev) => ({
                        ...prev,
                        username: e.target.value,
                      }))
                    }
                    placeholder="Defaults to email"
                  />
                </label>
                <label>
                  Password *
                  <input
                    required
                    type="password"
                    value={registerForm.password}
                    onChange={(e) =>
                      setRegisterForm((prev) => ({
                        ...prev,
                        password: e.target.value,
                      }))
                    }
                  />
                </label>
                <button type="submit" disabled={busy}>
                  {busy ? "Creating…" : "Create account"}
                </button>
              </form>
            )}
          </div>
        ) : (
          <div className={styles.layout}>
            <nav className={styles.nav}>
              {[
                ["dashboard", "Dashboard"],
                ["orders", "Orders"],
                ["addresses", "Addresses"],
                ["account", "Account details"],
              ].map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  className={tab === id ? styles.activeNav : ""}
                  onClick={() => setTab(id)}
                >
                  {label}
                </button>
              ))}
              <button type="button" onClick={handleLogout}>
                Log out
              </button>
            </nav>

            <section className={styles.content}>
              {tab === "dashboard" && (
                <div>
                  <p>
                    Hello{" "}
                    <strong>
                      {customer?.firstName ||
                        customer?.displayName ||
                        viewer?.name ||
                        "there"}
                    </strong>
                    .
                  </p>
                  <p>
                    From your account dashboard you can view recent orders,
                    manage shipping and billing addresses, and edit your account
                    details.
                  </p>
                  <p>
                    <Link href="/">Continue shopping</Link>
                  </p>
                </div>
              )}

              {tab === "orders" && (
                <div>
                  <h2>Orders</h2>
                  {orders.length === 0 ? (
                    <p>No orders yet.</p>
                  ) : (
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th>Order</th>
                          <th>Date</th>
                          <th>Status</th>
                          <th>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.map((order) => (
                          <tr key={order.databaseId}>
                            <td>#{order.orderNumber || order.databaseId}</td>
                            <td>
                              {order.date
                                ? new Date(order.date).toLocaleDateString()
                                : "—"}
                            </td>
                            <td>{order.status}</td>
                            <td>{stripHtml(order.total)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {tab === "addresses" && (
                <form className={styles.form} onSubmit={handleUpdateAddresses}>
                  <h2>Billing address</h2>
                  <AddressEditor
                    values={billingForm}
                    onChange={setBillingForm}
                    includeContact
                  />
                  <h2>Shipping address</h2>
                  <AddressEditor
                    values={shippingForm}
                    onChange={setShippingForm}
                  />
                  <button type="submit" disabled={busy}>
                    {busy ? "Saving…" : "Save addresses"}
                  </button>
                </form>
              )}

              {tab === "account" && (
                <form className={styles.form} onSubmit={handleUpdateAccount}>
                  <h2>Account details</h2>
                  <label>
                    First name
                    <input
                      value={accountForm.firstName}
                      onChange={(e) =>
                        setAccountForm((prev) => ({
                          ...prev,
                          firstName: e.target.value,
                        }))
                      }
                    />
                  </label>
                  <label>
                    Last name
                    <input
                      value={accountForm.lastName}
                      onChange={(e) =>
                        setAccountForm((prev) => ({
                          ...prev,
                          lastName: e.target.value,
                        }))
                      }
                    />
                  </label>
                  <label>
                    Email
                    <input
                      type="email"
                      required
                      value={accountForm.email}
                      onChange={(e) =>
                        setAccountForm((prev) => ({
                          ...prev,
                          email: e.target.value,
                        }))
                      }
                    />
                  </label>
                  <button type="submit" disabled={busy}>
                    {busy ? "Saving…" : "Save changes"}
                  </button>
                </form>
              )}
            </section>
          </div>
        )}
      </main>

      <Footer />
    </>
  );
}

function AddressEditor({ values, onChange, includeContact = false }) {
  function setField(field, value) {
    onChange((prev) => ({ ...prev, [field]: value }));
  }

  return (
    <div className={styles.grid}>
      <label>
        First name
        <input
          value={values.firstName || ""}
          onChange={(e) => setField("firstName", e.target.value)}
        />
      </label>
      <label>
        Last name
        <input
          value={values.lastName || ""}
          onChange={(e) => setField("lastName", e.target.value)}
        />
      </label>
      <label className={styles.full}>
        Address
        <input
          value={values.address1 || ""}
          onChange={(e) => setField("address1", e.target.value)}
        />
      </label>
      <label>
        City
        <input
          value={values.city || ""}
          onChange={(e) => setField("city", e.target.value)}
        />
      </label>
      <label>
        State
        <input
          value={values.state || ""}
          onChange={(e) => setField("state", e.target.value)}
        />
      </label>
      <label>
        Postcode
        <input
          value={values.postcode || ""}
          onChange={(e) => setField("postcode", e.target.value)}
        />
      </label>
      <label>
        Country
        <input
          value={values.country || ""}
          onChange={(e) => setField("country", e.target.value)}
        />
      </label>
      {includeContact && (
        <>
          <label>
            Email
            <input
              type="email"
              value={values.email || ""}
              onChange={(e) => setField("email", e.target.value)}
            />
          </label>
          <label>
            Phone
            <input
              value={values.phone || ""}
              onChange={(e) => setField("phone", e.target.value)}
            />
          </label>
        </>
      )}
    </div>
  );
}

export async function getStaticProps(context) {
  return getNextStaticProps(context, {
    Page: MyAccountPage,
    revalidate: 60,
  });
}

MyAccountPage.queries = [
  { query: SITE_DATA_QUERY },
  { query: HEADER_MENU_QUERY },
];
