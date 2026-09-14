import Link from "next/link";
import { getPublishedProducts } from "../lib/products";

export const dynamic = "force-dynamic";

export default async function Home() {
  const products = await getPublishedProducts();

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

          <div className="nav-links">
            <Link href="/">Home</Link>
            <Link href="/shop">Shop</Link>
            <Link href="/about">About</Link>
            <Link href="/account">Account</Link>
          </div>
        </div>
      </nav>

      <main>
        <section className="hero container">
          <div className="kicker">PEACEMAGENTS WORLDWIDE</div>

          <h1>
            STAY CALM.
            <br />
            MOVE LOUD.
          </h1>

          <p className="lede">
            Streetwear for the calm rebels. Bold ideas. Quiet energy. No
            borders.
          </p>

          <div style={{ marginTop: "28px" }}>
            <Link href="/shop" className="btn primary">
              SHOP THE COLLECTION
            </Link>
          </div>
        </section>

        <section className="section container">
          <div className="section-head">
            <div>
              <div className="kicker">01 / DROP</div>
              <h2>Quiet energy.</h2>
            </div>

            <Link href="/shop" className="btn">
              View all
            </Link>
          </div>

          <div className="grid">
            {products.slice(0, 4).map((product) => (
              <Link
                href={`/shop/${product.slug || product.id}`}
                className="product"
                key={product.id}
              >
                <div className="product-art">
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

                <div className="product-info">
                  <div className="product-title">{product.name}</div>
                  <div className="product-price">
                    ${Number(product.price).toFixed(2)}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
