"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useCart } from "../../components/CartProvider";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      "Supabase configuration is missing. Please try again from the deployed site."
    );
  }

  return createClient(url, key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
}

export default function CheckoutPage() {
  const { cart, subtotal, clearCart } = useCart();

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [order, setOrder] = useState(null);

  async function handlePlaceOrder() {
    if (loading || cart.length === 0) return;

    setLoading(true);
    setErrorMessage("");

    const items = cart.map((item) => ({
      productId: item.productId,
      variantId: item.variantId,
      quantity: Number(item.quantity),
    }));

    try {
      const supabase = getSupabase();

      const { data, error } = await supabase.rpc(
        "create_order",
        {
          p_items: items,
        }
      );

      if (error) {
        console.error("CREATE ORDER ERROR:", error);
        throw new Error(
          error.message || "Unable to create your order."
        );
      }

      if (!data || !data.orderId) {
        throw new Error(
          "The order was not created correctly."
        );
      }

      setOrder(data);
      clearCart();
    } catch (error) {
      console.error("CHECKOUT ERROR:", error);

      setErrorMessage(
        error?.message ||
          "Something went wrong while creating your order. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  if (order) {
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

            <Link href="/shop">Shop</Link>
          </div>
        </nav>

        <main className="container">
          <div className="subnav">
            <div className="kicker">
              PEACEMAGENTS WORLDWIDE
            </div>

            <h1>
              ORDER
              <br />
              RECEIVED.
            </h1>

            <p className="lede">
              Your order has been created successfully.
            </p>

            <div
              style={{
                marginTop: "28px",
                padding: "20px",
                border: "1px solid var(--line)",
                borderRadius: "18px",
                background: "#fff",
              }}
            >
              <div className="kicker">
                ORDER NUMBER
              </div>

              <div
                style={{
                  marginTop: "8px",
                  fontSize: "15px",
                  fontWeight: 800,
                  wordBreak: "break-all",
                }}
              >
                {order.orderId}
              </div>

              <div
                style={{
                  marginTop: "18px",
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "20px",
                  fontWeight: 900,
                }}
              >
                <span>TOTAL</span>

                <span>
                  ${Number(order.total || 0).toFixed(2)}
                </span>
              </div>
            </div>

            <div style={{ marginTop: "28px" }}>
              <Link
                href="/shop"
                className="btn primary"
              >
                CONTINUE SHOPPING
              </Link>
            </div>
          </div>
        </main>
      </>
    );
  }

  if (cart.length === 0) {
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

            <Link href="/shop">Shop</Link>
          </div>
        </nav>

        <main className="container">
          <div className="subnav">
            <div className="kicker">
              CHECKOUT
            </div>

            <h1>
              YOUR CART
              <br />
              IS EMPTY.
            </h1>

            <p className="lede">
              Add something from the shop before
              continuing to checkout.
            </p>

            <div style={{ marginTop: "28px" }}>
              <Link
                href="/shop"
                className="btn primary"
              >
                BACK TO SHOP
              </Link>
            </div>
          </div>
        </main>
      </>
    );
  }

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

          <Link href="/cart">← Cart</Link>
        </div>
      </nav>

      <main className="container">
        <div className="subnav">
          <div className="kicker">
            PEACEMAGENTS WORLDWIDE
          </div>

          <h1>
            CHECKOUT
            <br />
            REVIEW.
          </h1>

          <p className="lede">
            Review your order before creating it.
          </p>
        </div>

        <div className="cart-layout">
          <section className="cart-items">
            {cart.map((item) => (
              <div
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
                    {item.size || "ONE SIZE"}
                  </div>

                  <h2>{item.name}</h2>

                  <div className="cart-price">
                    $
                    {Number(item.price || 0).toFixed(2)}
                  </div>

                  <div className="muted">
                    Quantity: {item.quantity}
                  </div>
                </div>

                <div className="cart-line-total">
                  $
                  {(
                    Number(item.price || 0) *
                    Number(item.quantity || 0)
                  ).toFixed(2)}
                </div>
              </div>
            ))}
          </section>

          <aside className="cart-summary">
            <div className="kicker">
              ORDER SUMMARY
            </div>

            <div className="cart-summary-row">
              <span>Items</span>

              <span>
                {cart.reduce(
                  (total, item) =>
                    total + Number(item.quantity || 0),
                  0
                )}
              </span>
            </div>

            <div className="cart-summary-row">
              <span>Subtotal</span>

              <span>
                ${Number(subtotal || 0).toFixed(2)}
              </span>
            </div>

            <div className="cart-total">
              <span>TOTAL</span>

              <span>
                ${Number(subtotal || 0).toFixed(2)}
              </span>
            </div>

            {errorMessage ? (
              <div
                style={{
                  marginTop: "16px",
                  padding: "14px",
                  border: "1px solid #d8b4b4",
                  borderRadius: "12px",
                  background: "#fff7f7",
                }}
              >
                <p
                  className="muted"
                  style={{
                    margin: 0,
                    color: "#9b1c1c",
                  }}
                >
                  {errorMessage}
                </p>
              </div>
            ) : null}

            <button
              className="btn primary"
              type="button"
              onClick={handlePlaceOrder}
              disabled={loading}
              style={{
                marginTop: "22px",
                width: "100%",
                opacity: loading ? 0.6 : 1,
                cursor: loading
                  ? "wait"
                  : "pointer",
              }}
            >
              {loading
                ? "CREATING ORDER..."
                : "PLACE ORDER"}
            </button>

            <p
              className="muted"
              style={{ marginTop: "14px" }}
            >
              Your order will be created with the
              current database price and inventory.
              Payment integration will be connected
              separately once PEACEMAGENTS production
              Stripe is ready.
            </p>
          </aside>
        </div>
      </main>
    </>
  );
}