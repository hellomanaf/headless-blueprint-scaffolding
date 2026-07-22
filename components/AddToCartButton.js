import { useState } from "react";
import { useCart } from "../context/CartContext";
import { getErrorMessage } from "../lib/errors";
import styles from "../styles/add-to-cart.module.css";

export default function AddToCartButton({
  productId,
  stockStatus,
  className = "",
}) {
  const { addToCart, isUpdating } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const outOfStock = stockStatus === "OUT_OF_STOCK";

  async function handleAddToCart(event) {
    event.preventDefault();
    setMessage("");
    setError("");

    try {
      await addToCart({
        productId,
        quantity: Number(quantity) || 1,
      });
      setMessage("Added to cart");
    } catch (err) {
      setError(getErrorMessage(err, "Could not add to cart"));
    }
  }

  return (
    <form className={`${styles.form} ${className}`} onSubmit={handleAddToCart}>
      <label className={styles.qtyLabel}>
        Qty
        <input
          className={styles.qtyInput}
          type="number"
          min="1"
          value={quantity}
          disabled={outOfStock || isUpdating}
          onChange={(e) => setQuantity(e.target.value)}
        />
      </label>

      <button
        type="submit"
        className={styles.button}
        disabled={outOfStock || isUpdating || !productId}
      >
        {outOfStock ? "Out of stock" : isUpdating ? "Adding…" : "Add to cart"}
      </button>

      {message && <p className={styles.success}>{message}</p>}
      {error && <p className={styles.error}>{error}</p>}
    </form>
  );
}
