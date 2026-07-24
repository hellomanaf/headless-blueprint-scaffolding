import { createContext, useContext, useMemo } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { GET_CART_QUERY } from "../queries/CartQueries";
import {
  ADD_TO_CART_MUTATION,
  UPDATE_CART_ITEM_QUANTITIES_MUTATION,
  REMOVE_ITEMS_FROM_CART_MUTATION,
  EMPTY_CART_MUTATION,
} from "../mutations/CartMutations";
import { getWooApolloClient } from "../lib/wooClient";
import { getErrorMessage } from "../lib/errors";

const CartContext = createContext(null);

function stripHtml(value) {
  if (!value) return "";
  return String(value)
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/\s+/g, " ")
    .trim();
}

function writeCart(cache, cart) {
  if (!cart) return;
  cache.writeQuery({
    query: GET_CART_QUERY,
    data: { cart },
  });
}

export function CartProvider({ children }) {
  const client = getWooApolloClient();

  const { data, loading, error, refetch } = useQuery(GET_CART_QUERY, {
    client,
    ssr: false,
    skip: typeof window === "undefined",
    fetchPolicy: "network-only",
    errorPolicy: "all",
    notifyOnNetworkStatusChange: true,
  });

  const [addToCartMutation, addState] = useMutation(ADD_TO_CART_MUTATION, {
    client,
    update: (cache, result) => writeCart(cache, result?.data?.addToCart?.cart),
  });
  const [updateQuantitiesMutation, updateState] = useMutation(
    UPDATE_CART_ITEM_QUANTITIES_MUTATION,
    {
      client,
      update: (cache, result) =>
        writeCart(cache, result?.data?.updateItemQuantities?.cart),
    },
  );
  const [removeItemsMutation, removeState] = useMutation(
    REMOVE_ITEMS_FROM_CART_MUTATION,
    {
      client,
      update: (cache, result) =>
        writeCart(cache, result?.data?.removeItemsFromCart?.cart),
    },
  );
  const [emptyCartMutation, emptyState] = useMutation(EMPTY_CART_MUTATION, {
    client,
    update: (cache, result) => writeCart(cache, result?.data?.emptyCart?.cart),
  });

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
              productId: Number(productId),
              quantity: Number(quantity) || 1,
              ...(variationId ? { variationId: Number(variationId) } : {}),
              ...(extraData ? { extraData } : {}),
            },
          },
        });

        if (result?.errors?.length) {
          throw new Error(result.errors.map((item) => item.message).join(" "));
        }

        await refetch();
        return result;
      },
      async updateQuantity(key, quantity) {
        const result = await updateQuantitiesMutation({
          variables: {
            input: {
              items: [{ key, quantity: Number(quantity) }],
            },
          },
        });
        if (result?.errors?.length) {
          throw new Error(result.errors.map((item) => item.message).join(" "));
        }
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
        if (result?.errors?.length) {
          throw new Error(result.errors.map((item) => item.message).join(" "));
        }
        await refetch();
        return result;
      },
      async emptyCart() {
        const result = await emptyCartMutation({
          variables: { input: {} },
        });
        if (result?.errors?.length) {
          throw new Error(result.errors.map((item) => item.message).join(" "));
        }
        await refetch();
        return result;
      },
      getErrorMessage,
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
