import Link from "next/link";
import { getPublishedProducts } from "../../lib/products";

export const dynamic = "force-dynamic";

const fallbackProducts = [
  ["pm-001", "Calm Rebel Tee", "$35"],
  ["pm-002", "Worldwide Hoodie", "$70"],
  ["pm-003", "PM Core Cap", "$28"],
  ["pm-004", "Quiet Energy Tee", "$35"],
  ["pm-005", "No Borders Crew", "$62"],
  ["pm-006", "PM Daily Tote", "$24"],
];

export default async function Shop() {
  const products = await getPublishedProducts();
  const usingDatabase = products.length > 0;

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

      <main className="container">
        <div className="subnav">
          <div className="kicker">COLLECTION / 2026</div>

          <h1>
            THE WORLDWIDE
            <br />
            COLLECTION.
          </h1>

          <p className="muted">
            {usingDatabase
              ? "The latest PEACEMAGENTS collection."
              : "A first mock catalogue for PEACEMAGENTS."}
          </p>
        </div>

        <div className="grid">
          {usingDatabase
            ? products.map((product) => (
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
              ))
            : fallbackProducts.map(([id, name, price]) => (
                <Link
                  href={`/shop/${id}`}
                  className="product"
                  key={id}
                >
                  <div className="product-art">
                    <span>PM</span>
                  </div>

                  <div className="product-info">
                    <div className="product-title">{name}</div>
                    <div className="product-price">{price}</div>
                  </div>
                </Link>
              ))}
        </div>
      </main>
    </>
  );
}
