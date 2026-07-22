import { createContext, useContext, useMemo } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { GET_CART_QUERY } from "../queries/CartQueries";
import {
  ADD_TO_CART_MUTATION,
  UPDATE_CART_ITEM_QUANTITIES_MUTATION,
  REMOVE_ITEMS_FROM_CART_MUTATION,
  EMPTY_CART_MUTATION,
} from "../mutations/CartMutations";

const CartContext = createContext(null);

function stripHtml(value) {
  if (!value) return "";
  return value.replace(/<[^>]*>/g, "").trim();
}

export function CartProvider({ children }) {
  const { data, loading, error, refetch } = useQuery(GET_CART_QUERY, {
    ssr: false,
    fetchPolicy: "network-only",
    notifyOnNetworkStatusChange: true,
  });

  const [addToCartMutation, addState] = useMutation(ADD_TO_CART_MUTATION);
  const [updateQuantitiesMutation, updateState] = useMutation(
    UPDATE_CART_ITEM_QUANTITIES_MUTATION,
  );
  const [removeItemsMutation, removeState] = useMutation(
    REMOVE_ITEMS_FROM_CART_MUTATION,
  );
  const [emptyCartMutation, emptyState] = useMutation(EMPTY_CART_MUTATION);

  const cart = data?.cart || null;
  const itemCount = cart?.contents?.itemCount || 0;
  const items = cart?.contents?.nodes || [];

  const value = useMemo(
    () => ({
      cart,
      items,
      itemCount,
      loading,
      error,
      refetch,
      isUpdating:
        addState.loading ||
        updateState.loading ||
        removeState.loading ||
        emptyState.loading,
      formatPrice: stripHtml,
      async addToCart({ productId, quantity = 1, variationId, extraData }) {
        const result = await addToCartMutation({
          variables: {
            input: {
              productId,
              quantity,
              ...(variationId ? { variationId } : {}),
              ...(extraData ? { extraData } : {}),
            },
          },
        });
        await refetch();
        return result;
      },
      async updateQuantity(key, quantity) {
        const result = await updateQuantitiesMutation({
          variables: {
            input: {
              items: [{ key, quantity }],
            },
          },
        });
        await refetch();
        return result;
      },
      async removeItem(key) {
        const result = await removeItemsMutation({
          variables: {
            input: {
              keys: [key],
            },
          },
        });
        await refetch();
        return result;
      },
      async emptyCart() {
        const result = await emptyCartMutation({
          variables: { input: { clearPersistentCart: true } },
        });
        await refetch();
        return result;
      },
    }),
    [
      cart,
      items,
      itemCount,
      loading,
      error,
      refetch,
      addState.loading,
      updateState.loading,
      removeState.loading,
      emptyState.loading,
      addToCartMutation,
      updateQuantitiesMutation,
      removeItemsMutation,
      emptyCartMutation,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
