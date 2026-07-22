import Link from "next/link";
import Image from "next/image";
import styles from "../styles/product-card.module.css";

function formatPrice(price) {
  if (!price) return null;
  // WooGraphQL often returns HTML currency strings like "$19.00"
  return price.replace(/<[^>]*>/g, "").trim();
}

export default function ProductCard({ product }) {
  const name = product?.name || product?.title || "Untitled product";
  const slug = product?.slug;
  const shortDescription = product?.shortDescription;
  const image = product?.image;
  const price = product?.price;
  const onSale = product?.onSale;
  const salePrice = product?.salePrice;
  const regularPrice = product?.regularPrice;

  const href = slug ? `/product/${slug}/` : "#";
  const displayPrice = formatPrice(onSale && salePrice ? salePrice : price);
  const originalPrice = onSale ? formatPrice(regularPrice) : null;

  return (
    <article className={styles.card}>
      <Link href={href} className={styles.imageLink} title={name}>
        <div className={styles.imageWrapper}>
          {image?.sourceUrl ? (
            <Image
              src={image.sourceUrl}
              alt={image.altText || name}
              fill
              sizes="(max-width: 600px) 100vw, (max-width: 900px) 50vw, 33vw"
              className={styles.image}
            />
          ) : (
            <div className={styles.placeholder} aria-hidden="true" />
          )}
        </div>
      </Link>

      <div className={styles.body}>
        <h2 className={styles.title}>
          <Link href={href} title={name}>
            {name}
          </Link>
        </h2>

        {shortDescription && (
          <div
            className={styles.description}
            dangerouslySetInnerHTML={{ __html: shortDescription }}
          />
        )}

        {displayPrice && (
          <p className={styles.price}>
            {onSale && originalPrice && (
              <span className={styles.regularPrice}>{originalPrice}</span>
            )}
            <span className={onSale ? styles.salePrice : undefined}>
              {displayPrice}
            </span>
          </p>
        )}

        <Link href={href} className={styles.viewProduct}>
          View product
        </Link>
      </div>
    </article>
  );
}
