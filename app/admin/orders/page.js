"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../../lib/supabase";
import { useAdminGuard } from "../../../lib/admin-guard";

const STATUSES = ["pending", "processing", "shipped", "completed", "cancelled"];

function money(value) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString();
}

export default function Orders() {
  const { loading: guardLoading, authorized, role } = useAdminGuard();
  const [orders, setOrders] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState("");
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");

  async function loadOrders() {
    if (!supabase) {
      setError("Supabase is not configured.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    const [ordersRes, profilesRes, itemsRes] = await Promise.all([
      supabase
        .from("orders")
        .select("id,user_id,status,payment_status,total,created_at")
        .order("created_at", { ascending: false }),
      supabase
        .from("profiles")
        .select("id,email,full_name,role"),
      supabase
        .from("order_items")
        .select(
          "id,order_id,product_id,variant_id,quantity,unit_price,products(name),product_variants(size,sku)"
        ),
    ]);

    const firstError = ordersRes.error || profilesRes.error || itemsRes.error;

    if (firstError) {
      setError(firstError.message);
    } else {
      setOrders(ordersRes.data || []);
      setProfiles(profilesRes.data || []);
      setItems(itemsRes.data || []);
    }

    setLoading(false);
  }

  useEffect(() => {
    if (authorized) {
      loadOrders();
    }
  }, [authorized]);

  const profileMap = useMemo(
    () =>
      Object.fromEntries(
        profiles.map((profile) => [profile.id, profile])
      ),
    [profiles]
  );

  const itemMap = useMemo(() => {
    const map = {};
    for (const item of items) {
      if (!map[item.order_id]) map[item.order_id] = [];
      map[item.order_id].push(item);
    }
    return map;
  }, [items]);

  const visibleOrders = useMemo(() => {
    if (filter === "all") return orders;
    return orders.filter((order) => order.status === filter);
  }, [orders, filter]);

  async function updateStatus(orderId, status) {
    setSavingId(orderId);
    setError("");

    const { error: updateError } = await supabase
      .from("orders")
      .update({ status })
      .eq("id", orderId);

    if (updateError) {
      setError(updateError.message);
    } else {
      setOrders((current) =>
        current.map((order) =>
          order.id === orderId ? { ...order, status } : order
        )
      );
    }

    setSavingId("");
  }

  if (guardLoading) {
    return (
      <main className="container" style={{ paddingTop: "120px" }}>
        <div className="kicker">PEACEMAGENTS WORLDWIDE</div>
        <h1>CHECKING<br />ACCESS.</h1>
        <p>Verifying your HQ permissions...</p>
      </main>
    );
  }

  if (!authorized) {
    return (
      <main className="container" style={{ paddingTop: "120px" }}>
        <div className="kicker">ACCESS DENIED</div>
        <h1>HQ<br />ONLY.</h1>
        <p>Your account does not have permission to access the PEACEMAGENTS internal order system.</p>
        <div style={{ marginTop: "32px" }}>
          <Link href="/account" className="button">GO TO ACCOUNT</Link>{" "}
          <Link href="/" className="button">RETURN TO STORE</Link>
        </div>
      </main>
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
              WORLDWIDE HQ
            </span>
          </Link>
          <div className="nav-links">
            <Link href="/admin">HQ</Link>
            <Link href="/admin/products">Products</Link>
            <Link href="/admin/orders">Orders</Link>
            <Link href="/admin/customers">Customers</Link>
            <Link href="/shop">Store</Link>
          </div>
        </div>
      </nav>

      <main className="container">
        <div className="subnav">
          <Link href="/admin">← HQ</Link>
          <div className="kicker">HQ / ORDERS</div>
          <h1>ORDERS.</h1>
          <p style={{ marginTop: "12px" }}>
            Signed in with <strong>{role}</strong> permissions.
          </p>
        </div>

        <div
          style={{
            display: "flex",
            gap: "8px",
            flexWrap: "wrap",
            marginBottom: "28px",
          }}
        >
          {["all", ...STATUSES].map((value) => (
            <button
              key={value}
              type="button"
              className={filter === value ? "btn primary" : "btn"}
              onClick={() => setFilter(value)}
            >
              {value.toUpperCase()}
            </button>
          ))}
        </div>

        {error && (
          <div className="card" style={{ marginBottom: "24px" }}>
            {error}
          </div>
        )}

        {loading ? (
          <p className="muted">Loading live orders...</p>
        ) : visibleOrders.length === 0 ? (
          <p className="muted">No orders in this view.</p>
        ) : (
          <div style={{ display: "grid", gap: "14px", marginBottom: "80px" }}>
            {visibleOrders.map((order) => {
              const customer = profileMap[order.user_id];
              const orderItems = itemMap[order.id] || [];

              return (
                <article
                  key={order.id}
                  className="card"
                  style={{ padding: "22px" }}
                >
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr auto",
                      gap: "18px",
                      alignItems: "start",
                    }}
                  >
                    <div>
                      <div className="kicker">
                        ORDER / {order.id.slice(0, 8).toUpperCase()}
                      </div>
                      <h3 style={{ margin: "8px 0 6px" }}>
                        {customer?.full_name ||
                          customer?.email ||
                          "Customer"}
                      </h3>
                      <div className="muted">
                        {customer?.email || "No email"} ·{" "}
                        {formatDate(order.created_at)}
                      </div>
                    </div>

                    <div style={{ textAlign: "right" }}>
                      <strong style={{ fontSize: "1.2rem" }}>
                        {money(order.total)}
                      </strong>
                      <div className="muted">
                        {order.payment_status}
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      marginTop: "20px",
                      paddingTop: "18px",
                      borderTop: "1px solid #ddd",
                    }}
                  >
                    {orderItems.length === 0 ? (
                      <div className="muted">No order items recorded.</div>
                    ) : (
                      <div style={{ display: "grid", gap: "8px" }}>
                        {orderItems.map((item) => (
                          <div
                            key={item.id}
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              gap: "16px",
                            }}
                          >
                            <span>
                              {item.products?.name || "Product"}
                              {item.product_variants?.size
                                ? ` · ${item.product_variants.size}`
                                : ""}
                              {" × "}
                              {item.quantity}
                            </span>
                            <span>{money(item.unit_price * item.quantity)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div
                    style={{
                      marginTop: "20px",
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      flexWrap: "wrap",
                    }}
                  >
                    <label style={{ fontWeight: 700 }}>Status</label>
                    <select
                      value={order.status}
                      disabled={savingId === order.id}
                      onChange={(event) =>
                        updateStatus(order.id, event.target.value)
                      }
                      style={{
                        padding: "12px",
                        border: "1px solid #111",
                        background: "#fff",
                        font: "inherit",
                      }}
                    >
                      {STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                    {savingId === order.id && (
                      <span className="muted">Saving...</span>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>
    </>
  );
}
