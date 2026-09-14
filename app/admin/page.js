"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useAdminGuard } from "../../lib/admin-guard";

function money(value) {
  return `$${Number(value || 0).toFixed(2)}`;
}

export default function Admin() {
  const { loading: guardLoading, authorized, role } = useAdminGuard();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [variants, setVariants] = useState([]);
  const [profiles, setProfiles] = useState([]);

  async function loadHQ() {
    if (!supabase) {
      setError("Supabase is not configured.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    const [productsRes, ordersRes, profilesRes, variantsRes] =
      await Promise.all([
        supabase
          .from("products")
          .select("id,name,price,published,created_at")
          .order("created_at", { ascending: false }),
        supabase
          .from("orders")
          .select("id,user_id,status,payment_status,total,created_at")
          .order("created_at", { ascending: false }),
        supabase
          .from("profiles")
          .select("id,email,full_name,role,created_at")
          .order("created_at", { ascending: false }),
        supabase
          .from("product_variants")
          .select("id,product_id,size,sku,stock,price"),
      ]);

    const firstError =
      productsRes.error ||
      ordersRes.error ||
      profilesRes.error ||
      variantsRes.error;

    if (firstError) {
      setError(firstError.message);
      setLoading(false);
      return;
    }

    setProducts(productsRes.data || []);
    setOrders(ordersRes.data || []);
    setProfiles(profilesRes.data || []);
    setVariants(variantsRes.data || []);
    setLoading(false);
  }

  useEffect(() => {
    if (authorized) {
      loadHQ();
    }
  }, [authorized]);

  const metrics = useMemo(() => {
    const revenue = orders.reduce(
      (sum, order) => sum + Number(order.total || 0),
      0
    );

    const lowStock = variants.filter(
      (variant) => Number(variant.stock || 0) <= 5
    ).length;

    return {
      products: products.length,
      published: products.filter((product) => product.published).length,
      orders: orders.length,
      pending: orders.filter(
        (order) => ["pending", "processing"].includes(order.status)
      ).length,
      customers: profiles.filter((profile) => profile.role === "customer")
        .length,
      revenue,
      lowStock,
    };
  }, [products, orders, profiles, variants]);

  const profileMap = useMemo(
    () =>
      Object.fromEntries(
        profiles.map((profile) => [profile.id, profile])
      ),
    [profiles]
  );

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
        <p>Your account does not have permission to access the PEACEMAGENTS internal control room.</p>
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
          <div className="kicker">INTERNAL / HQ</div>
          <h1>CONTROL<br />ROOM.</h1>
          <p style={{ marginTop: "12px" }}>
            Signed in with <strong>{role}</strong> permissions.
          </p>
        </div>

        {error && (
          <div className="card" style={{ marginBottom: "24px" }}>
            <strong>HQ DATA ERROR</strong>
            <p style={{ marginBottom: 0 }}>{error}</p>
          </div>
        )}

        {loading ? (
          <p className="muted">Loading live HQ data...</p>
        ) : (
          <>
            <div className="admin-grid">
              <div className="card">
                <div className="kicker">PRODUCTS</div>
                <div className="metric">{metrics.products}</div>
                <div className="muted">{metrics.published} published</div>
              </div>

              <div className="card">
                <div className="kicker">ORDERS</div>
                <div className="metric">{metrics.orders}</div>
                <div className="muted">{metrics.pending} active</div>
              </div>

              <div className="card">
                <div className="kicker">CUSTOMERS</div>
                <div className="metric">{metrics.customers}</div>
                <div className="muted">registered customers</div>
              </div>

              <div className="card">
                <div className="kicker">SALES</div>
                <div className="metric">{money(metrics.revenue)}</div>
                <div className="muted">order totals recorded</div>
              </div>
            </div>

            <section style={{ marginTop: "56px" }}>
              <div className="kicker">OPERATIONS</div>
              <h2 style={{ margin: "8px 0 24px" }}>WHAT NEEDS ATTENTION.</h2>

              <div className="admin-grid">
                <Link href="/admin/products" className="card" style={{ textDecoration: "none" }}>
                  <div className="kicker">LOW STOCK</div>
                  <div className="metric">{metrics.lowStock}</div>
                  <div className="muted">variants at 5 units or below</div>
                </Link>

                <Link href="/admin/orders" className="card" style={{ textDecoration: "none" }}>
                  <div className="kicker">ACTIVE ORDERS</div>
                  <div className="metric">{metrics.pending}</div>
                  <div className="muted">pending or processing</div>
                </Link>
              </div>
            </section>

            <section style={{ marginTop: "56px", marginBottom: "80px" }}>
              <div className="kicker">RECENT ORDERS</div>
              <h2 style={{ margin: "8px 0 24px" }}>LATEST ACTIVITY.</h2>

              {orders.length === 0 ? (
                <p className="muted">No orders have been recorded yet.</p>
              ) : (
                <div style={{ display: "grid", gap: "12px" }}>
                  {orders.slice(0, 5).map((order) => {
                    const customer = profileMap[order.user_id];
                    return (
                      <Link
                        href="/admin/orders"
                        key={order.id}
                        className="card"
                        style={{
                          textDecoration: "none",
                          display: "grid",
                          gridTemplateColumns: "1fr auto",
                          gap: "16px",
                        }}
                      >
                        <div>
                          <strong>
                            {customer?.full_name ||
                              customer?.email ||
                              "Guest customer"}
                          </strong>
                          <div className="muted">
                            {new Date(order.created_at).toLocaleString()}
                          </div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <strong>{money(order.total)}</strong>
                          <div className="muted">
                            {order.status} · {order.payment_status}
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </>
  );
}
