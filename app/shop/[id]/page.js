import Link from "next/link";
import { getPublishedProduct } from "../../../lib/products";

export const dynamic = "force-dynamic";

export default async function Product({ params }) {
  const product = await getPublishedProduct(params.id);

  if (!product) {
    return (
      <>
        <nav className="nav">
          <div className="container nav-inner">
            <Link href="/" className="brand">
              <span className="pm">PM</span>
              <span className="brand-name">
                PEACEMAGENTS
                <br />
                WORLDWIDE
              </span>
            </Link>

            <Link href="/shop">← Shop</Link>
          </div>
        </nav>

        <main className="container">
          <div className="subnav">
            <div className="kicker">PEACEMAGENTS WORLDWIDE</div>

            <h1>
              PRODUCT
              <br />
              NOT FOUND.
            </h1>

            <p className="lede">
              This product may have been removed or is not currently
              published.
            </p>

            <div style={{ marginTop: "32px" }}>
              <Link href="/shop" className="btn primary">
                BACK TO SHOP
              </Link>
            </div>
          </div>
        </main>
      </>
    );
  }

  const variants = product.product_variants || [];

  const hasVariants = variants.length > 0;

  const availableVariants = variants.filter(
    (variant) => Number(variant.stock) > 0
  );

  const displayPrice =
    hasVariants && availableVariants.length > 0
      ? Math.min(
          ...availableVariants.map((variant) =>
            variant.price !== null
              ? Number(variant.price)
              : Number(product.price)
          )
        )
      : Number(product.price);

  return (
    <>
      <nav className="nav">
        <div className="container nav-inner">
          <Link href="/" className="brand">
            <span className="pm">PM</span>
            <span className="brand-name">
              PEACEMAGENTS
              <br />
              WORLDWIDE
            </span>
          </Link>

          <Link href="/shop">← Shop</Link>
        </div>
      </nav>

      <main className="container">
        <div className="detail">
          <div className="detail-art">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            ) : (
              <span>PM</span>
            )}
          </div>

          <div className="detail-copy">
            <div className="kicker">PEACEMAGENTS WORLDWIDE</div>

            <h2>{product.name}</h2>

            <div className="metric">
              ${displayPrice.toFixed(2)}
            </div>

            <p className="lede">
              {product.description ||
                "A PEACEMAGENTS WORLDWIDE piece built around the calm-rebel mindset."}
            </p>

            {hasVariants ? (
              <>
                <div className="kicker">SELECT SIZE</div>

                <div className="sizes">
                  {variants.map((variant) => {
                    const inStock = Number(variant.stock) > 0;

                    return (
                      <button
                        className="size"
                        key={variant.id}
                        type="button"
                        disabled={!inStock}
                        title={
                          inStock
                            ? `${variant.stock} available`
                            : "Out of stock"
                        }
                        style={{
                          opacity: inStock ? 1 : 0.35,
                          cursor: inStock ? "pointer" : "not-allowed",
                        }}
                      >
                        {variant.size || "ONE SIZE"}
                      </button>
                    );
                  })}
                </div>

                {availableVariants.length === 0 ? (
                  <p className="muted" style={{ marginTop: "14px" }}>
                    Currently out of stock.
                  </p>
                ) : (
                  <p className="muted" style={{ marginTop: "14px" }}>
                    Select an available size to continue.
                  </p>
                )}
              </>
            ) : (
              <p className="muted">
                This item currently has no size variants.
              </p>
            )}

            <button
              className="btn primary"
              type="button"
              disabled
              title="Cart integration is coming next."
            >
              ADD TO CART
            </button>

            <p className="muted" style={{ marginTop: "14px" }}>
              Cart integration comes next.
            </p>
          </div>
        </div>
      </main>
    </>
  );
}
