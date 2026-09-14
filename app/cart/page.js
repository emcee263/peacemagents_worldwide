"use client";

import Link from "next/link";
import { useCart } from "../../components/CartProvider";

export default function CartPage() {
  const {
    cart,
    cartCount,
    subtotal,
    updateQuantity,
    removeItem,
  } = useCart();

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
          <div className="kicker">
            PEACEMAGENTS WORLDWIDE
          </div>

          <h1>
            YOUR
            <br />
            CART.
          </h1>

          <p className="lede">
            {cartCount === 0
              ? "Your cart is currently empty."
              : `${cartCount} ${
                  cartCount === 1 ? "item" : "items"
                } in your cart.`}
          </p>
        </div>

        {cart.length === 0 ? (
          <div
            className="card"
            style={{ marginBottom: "70px" }}
          >
            <p className="muted">
              Nothing here yet. Find something from the
              collection.
            </p>

            <div style={{ marginTop: "20px" }}>
              <Link
                href="/shop"
                className="btn primary"
              >
                SHOP THE COLLECTION
              </Link>
            </div>
          </div>
        ) : (
          <div className="cart-layout">
            <section className="cart-items">
              {cart.map((item) => (
                <article
                  className="cart-item"
                  key={`${item.productId}-${item.variantId}`}
                >
                  <div className="cart-image">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                      />
                    ) : (
                      <span>PM</span>
                    )}
                  </div>

                  <div className="cart-item-copy">
                    <div className="kicker">
                      PEACEMAGENTS
                    </div>

                    <h2>{item.name}</h2>

                    <p className="muted">
                      {item.size || "ONE SIZE"}
                    </p>

                    <p className="cart-price">
                      $
                      {Number(item.price || 0).toFixed(2)}
                    </p>

                    <div className="cart-controls">
                      <button
                        type="button"
                        onClick={() =>
                          updateQuantity(
                            item.productId,
                            item.variantId,
                            Math.max(
                              1,
                              item.quantity - 1
                            )
                          )
                        }
                      >
                        −
                      </button>

                      <span>{item.quantity}</span>

                      <button
                        type="button"
                        onClick={() =>
                          updateQuantity(
                            item.productId,
                            item.variantId,
                            item.quantity + 1
                          )
                        }
                      >
                        +
                      </button>

                      <button
                        type="button"
                        className="remove"
                        onClick={() =>
                          removeItem(
                            item.productId,
                            item.variantId
                          )
                        }
                      >
                        REMOVE
                      </button>
                    </div>
                  </div>

                  <div className="cart-line-total">
                    $
                    {(
                      Number(item.price || 0) *
                      Number(item.quantity || 0)
                    ).toFixed(2)}
                  </div>
                </article>
              ))}
            </section>

            <aside className="cart-summary card">
              <div className="kicker">
                ORDER SUMMARY
              </div>

              <div className="cart-summary-row">
                <span>Items</span>
                <span>{cartCount}</span>
              </div>

              <div className="cart-summary-row">
                <span>Subtotal</span>
                <strong>
                  ${subtotal.toFixed(2)}
                </strong>
              </div>

              <div className="cart-summary-row muted">
                <span>Shipping</span>
                <span>
                  Calculated at checkout
                </span>
              </div>

              <div className="cart-total">
                <span>TOTAL</span>

                <strong>
                  ${subtotal.toFixed(2)}
                </strong>
              </div>

              <Link
                href="/checkout"
                className="btn primary"
                style={{
                  width: "100%",
                  textAlign: "center",
                  marginTop: "20px",
                }}
              >
                CHECKOUT
              </Link>

              <p
                className="muted"
                style={{ marginTop: "12px" }}
              >
                Your cart is saved on this device.
              </p>
            </aside>
          </div>
        )}
      </main>
    </>
  );
}