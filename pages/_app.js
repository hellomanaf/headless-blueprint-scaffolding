import "../faust.config";
import React from "react";
import { useRouter } from "next/router";
import { FaustProvider } from "@faustwp/core";
import { CartProvider } from "../context/CartContext";
import "../styles/globals.css";

export default function MyApp({ Component, pageProps }) {
  const router = useRouter();

  return (
    <FaustProvider pageProps={pageProps}>
      <CartProvider>
        <Component {...pageProps} key={router.asPath} />
      </CartProvider>
    </FaustProvider>
  );
}
