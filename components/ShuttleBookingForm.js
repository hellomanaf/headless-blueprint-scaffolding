import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { useMutation, useQuery } from "@apollo/client";
import { getWooApolloClient } from "../lib/wooClient";
import { useCart } from "../context/CartContext";
import { getErrorMessage } from "../lib/errors";
import {
  formatMoney,
  formatPriceEach,
  routeLabel,
  todayDateString,
  tripOptionLabel,
  tripsForDate,
} from "../lib/shuttle";
import { SHUTTLE_QUOTE_QUERY } from "../queries/ShuttleQueries";
import { ADD_SHUTTLE_TO_CART_MUTATION } from "../mutations/ShuttleMutations";
import styles from "../styles/shuttle-booking.module.css";

function Stepper({ id, value, min = 0, max = 20, disabled, onChange }) {
  return (
    <div className={styles.stepper} role="group" aria-labelledby={id}>
      <button
        type="button"
        className={styles.stepperBtn}
        aria-label="Decrease"
        disabled={disabled || value <= min}
        onClick={() => onChange(Math.max(min, value - 1))}
      >
        −
      </button>
      <input
        className={styles.stepperValue}
        type="number"
        min={min}
        max={max}
        value={value}
        disabled={disabled}
        onChange={(e) => {
          const next = Number(e.target.value);
          if (Number.isNaN(next)) return;
          onChange(Math.min(max, Math.max(min, next)));
        }}
        aria-labelledby={id}
      />
      <button
        type="button"
        className={styles.stepperBtn}
        aria-label="Increase"
        disabled={disabled || value >= max}
        onClick={() => onChange(Math.min(max, value + 1))}
      >
        +
      </button>
    </div>
  );
}

export default function ShuttleBookingForm({ product }) {
  const router = useRouter();
  const wooClient = getWooApolloClient();
  const { refetch: refetchCart } = useCart();
  const minDate = todayDateString();

  const [journeyType, setJourneyType] = useState("one_way");
  const [travelDate, setTravelDate] = useState("");
  const [tripId, setTripId] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [returnTripId, setReturnTripId] = useState("");
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const pricing = product?.pricing || {};
  const currency = pricing.currency || "AED";
  const isRoundTrip = journeyType === "round_trip";
  const productId = Number(product?.databaseId);

  const outboundTrips = useMemo(
    () => tripsForDate(product?.trips, travelDate, product?.holidays),
    [product?.trips, product?.holidays, travelDate],
  );

  const returnTrips = useMemo(() => {
    const trips = tripsForDate(product?.trips, returnDate, product?.holidays);
    if (travelDate && returnDate && travelDate === returnDate && tripId) {
      return trips.filter((trip) => trip.id !== tripId);
    }
    return trips;
  }, [product?.trips, product?.holidays, returnDate, travelDate, tripId]);

  useEffect(() => {
    if (tripId && !outboundTrips.some((trip) => trip.id === tripId)) {
      setTripId("");
    }
  }, [outboundTrips, tripId]);

  useEffect(() => {
    if (returnTripId && !returnTrips.some((trip) => trip.id === returnTripId)) {
      setReturnTripId("");
    }
  }, [returnTrips, returnTripId]);

  useEffect(() => {
    if (!isRoundTrip) {
      setReturnDate("");
      setReturnTripId("");
    }
  }, [isRoundTrip]);

  const quoteReady =
    productId &&
    tripId &&
    travelDate &&
    adults + children + infants >= 1 &&
    (!isRoundTrip || (returnDate && returnTripId));

  const quoteVariables = {
    productId,
    journeyType,
    tripId,
    travelDate,
    adults,
    children,
    infants,
    ...(isRoundTrip
      ? { returnTripId, returnDate }
      : { returnTripId: null, returnDate: null }),
  };

  const {
    data: quoteData,
    loading: quoteLoading,
    error: quoteError,
  } = useQuery(SHUTTLE_QUOTE_QUERY, {
    variables: quoteVariables,
    skip: !quoteReady,
    fetchPolicy: "network-only",
    errorPolicy: "none",
  });

  const quote = quoteData?.shuttleQuote || null;
  const quoteMessage = quoteError
    ? getErrorMessage(quoteError, "Unable to quote this booking")
    : "";

  const [addShuttleToCart, { loading: booking }] = useMutation(
    ADD_SHUTTLE_TO_CART_MUTATION,
    { client: wooClient },
  );

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!quoteReady) {
      setError("Select your trip details and at least one passenger.");
      return;
    }

    if (quoteMessage) {
      setError(quoteMessage);
      return;
    }

    try {
      const result = await addShuttleToCart({
        variables: quoteVariables,
      });

      if (result?.errors?.length) {
        throw new Error(result.errors.map((item) => item.message).join(" "));
      }

      const payload = result?.data?.addShuttleToCart?.result;
      if (!payload?.success) {
        throw new Error("Could not add shuttle to cart");
      }

      setMessage("Shuttle added to cart");

      try {
        await refetchCart();
      } catch {
        // Cart refresh is best-effort; booking already succeeded.
      }

      router.push("/checkout/");
    } catch (err) {
      setError(getErrorMessage(err, "Could not book shuttle"));
    }
  }

  const freeUnderAge = pricing.freeUnderAge ?? 1;
  const childAgeMin = pricing.childAgeMin ?? freeUnderAge;
  const childAgeMax = pricing.childAgeMax ?? 11;
  const totalPrice = quote?.booking?.price;
  const remaining = quote?.availability?.remaining;
  const returnRemaining = quote?.returnAvailability?.remaining;

  return (
    <form className={styles.wrap} onSubmit={handleSubmit}>
      <div className={styles.card}>
        <header className={styles.header}>
          <h1 className={styles.title}>Book your shuttle</h1>
          <p className={styles.route}>{routeLabel(product)}</p>
        </header>

        {product?.allowRoundTrip !== false && (
          <fieldset className={styles.fieldset}>
            <legend className={styles.legend}>Journey</legend>
            <div className={styles.radios}>
              <label className={styles.radio}>
                <input
                  type="radio"
                  name="journeyType"
                  value="one_way"
                  checked={journeyType === "one_way"}
                  onChange={() => setJourneyType("one_way")}
                />
                <span>One way</span>
              </label>
              <label className={styles.radio}>
                <input
                  type="radio"
                  name="journeyType"
                  value="round_trip"
                  checked={journeyType === "round_trip"}
                  disabled={product?.allowRoundTrip === false}
                  onChange={() => setJourneyType("round_trip")}
                />
                <span>Round trip</span>
              </label>
            </div>
          </fieldset>
        )}

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Outbound</h2>
          <div className={styles.row}>
            <label className={styles.field}>
              <span className={styles.label}>Travel date</span>
              <input
                className={styles.input}
                type="date"
                min={minDate}
                value={travelDate}
                onChange={(e) => setTravelDate(e.target.value)}
                required
              />
            </label>
            <label className={styles.field}>
              <span className={styles.label}>Trip / departure</span>
              <select
                className={styles.select}
                value={tripId}
                disabled={!travelDate}
                onChange={(e) => setTripId(e.target.value)}
                required
              >
                <option value="">
                  {travelDate ? "Select a departure" : "Select a travel date"}
                </option>
                {outboundTrips.map((trip) => (
                  <option key={trip.id} value={trip.id}>
                    {tripOptionLabel(trip)}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>

        {isRoundTrip && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Return</h2>
            <div className={styles.row}>
              <label className={styles.field}>
                <span className={styles.label}>Return date</span>
                <input
                  className={styles.input}
                  type="date"
                  min={travelDate || minDate}
                  value={returnDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                  required
                />
              </label>
              <label className={styles.field}>
                <span className={styles.label}>Return trip</span>
                <select
                  className={styles.select}
                  value={returnTripId}
                  disabled={!returnDate}
                  onChange={(e) => setReturnTripId(e.target.value)}
                  required
                >
                  <option value="">
                    {returnDate ? "Select a departure" : "Select a return date"}
                  </option>
                  {returnTrips.map((trip) => (
                    <option key={trip.id} value={trip.id}>
                      {tripOptionLabel(trip)}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </section>
        )}

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Passengers</h2>
          <ul className={styles.passengerList}>
            <li className={styles.passengerRow}>
              <div className={styles.passengerInfo}>
                <span id="adults-label" className={styles.passengerName}>
                  Adults
                </span>
                {pricing.adult != null && (
                  <span className={styles.passengerPrice}>
                    {formatPriceEach(pricing.adult, currency)}
                  </span>
                )}
              </div>
              <Stepper
                id="adults-label"
                value={adults}
                min={0}
                disabled={booking}
                onChange={setAdults}
              />
            </li>
            <li className={styles.passengerRow}>
              <div className={styles.passengerInfo}>
                <span id="children-label" className={styles.passengerName}>
                  Children
                </span>
                <span className={styles.passengerHint}>
                  Ages {childAgeMin}–{childAgeMax}
                </span>
                {pricing.child != null && (
                  <span className={styles.passengerPrice}>
                    {formatPriceEach(pricing.child, currency)}
                  </span>
                )}
              </div>
              <Stepper
                id="children-label"
                value={children}
                min={0}
                disabled={booking}
                onChange={setChildren}
              />
            </li>
            <li className={styles.passengerRow}>
              <div className={styles.passengerInfo}>
                <span id="infants-label" className={styles.passengerName}>
                  Infants
                </span>
                <span className={styles.passengerHint}>
                  Under {freeUnderAge} — free, no seat
                </span>
                {pricing.infant != null && Number(pricing.infant) > 0 && (
                  <span className={styles.passengerPrice}>
                    {formatPriceEach(pricing.infant, currency)}
                  </span>
                )}
              </div>
              <Stepper
                id="infants-label"
                value={infants}
                min={0}
                disabled={booking}
                onChange={setInfants}
              />
            </li>
          </ul>
        </section>

        {(quoteLoading || totalPrice != null || remaining != null) && (
          <div className={styles.summary} aria-live="polite">
            {quoteLoading && <p className={styles.summaryMeta}>Updating quote…</p>}
            {!quoteLoading && totalPrice != null && (
              <p className={styles.total}>
                Total{" "}
                <strong>{formatMoney(totalPrice, quote?.currency || currency)}</strong>
                {isRoundTrip ? " (round trip)" : ""}
              </p>
            )}
            {!quoteLoading && remaining != null && (
              <p className={styles.summaryMeta}>
                {remaining} seat{remaining === 1 ? "" : "s"} left outbound
                {isRoundTrip && returnRemaining != null
                  ? ` · ${returnRemaining} return`
                  : ""}
              </p>
            )}
          </div>
        )}
      </div>

      <button
        type="submit"
        className={styles.submit}
        disabled={booking || !quoteReady || Boolean(quoteMessage)}
      >
        {booking ? "Booking…" : "Book shuttle"}
      </button>

      {(error || quoteMessage) && (
        <p className={styles.error} role="alert">
          {error || quoteMessage}
        </p>
      )}
      {message && <p className={styles.success}>{message}</p>}
    </form>
  );
}
