"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../../lib/supabase";
import { useAdminGuard } from "../../../lib/admin-guard";

function money(value) {
  return `$${Number(value || 0).toFixed(2)}`;
}

export default function Customers() {
  const { loading: guardLoading, authorized, role } = useAdminGuard();
  const [profiles, setProfiles] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadCustomers() {
    if (!supabase) {
      setError("Supabase is not configured.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    const [profilesRes, ordersRes] = await Promise.all([
      supabase
        .from("profiles")
        .select("id,email,full_name,role,created_at")
        .order("created_at", { ascending: false }),
      supabase
        .from("orders")
        .select("id,user_id,total,status,created_at")
        .order("created_at", { ascending: false }),
    ]);

    if (profilesRes.error || ordersRes.error) {
      setError((profilesRes.error || ordersRes.error).message);
    } else {
      setProfiles(profilesRes.data || []);
      setOrders(ordersRes.data || []);
    }

    setLoading(false);
  }

  useEffect(() => {
    if (authorized) {
      loadCustomers();
    }
  }, [authorized]);

  const orderStats = useMemo(() => {
    const map = {};

    for (const order of orders) {
      if (!map[order.user_id]) {
        map[order.user_id] = {
          count: 0,
          total: 0,
          active: 0,
        };
      }

      map[order.user_id].count += 1;
      map[order.user_id].total += Number(order.total || 0);

      if (["pending", "processing", "shipped"].includes(order.status)) {
        map[order.user_id].active += 1;
      }
    }

    return map;
  }, [orders]);

  const customers = profiles.filter((profile) => profile.role === "customer");

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
        <p>Your account does not have permission to access the PEACEMAGENTS internal customer system.</p>
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
          <div className="kicker">HQ / CUSTOMERS</div>
          <h1>CUSTOMERS.</h1>
          <p style={{ marginTop: "12px" }}>
            Signed in with <strong>{role}</strong> permissions.
          </p>
        </div>

        {error && (
          <div className="card" style={{ marginBottom: "24px" }}>
            {error}
          </div>
        )}

        {loading ? (
          <p className="muted">Loading customer accounts...</p>
        ) : (
          <>
            <div className="admin-grid" style={{ marginBottom: "28px" }}>
              <div className="card">
                <div className="kicker">CUSTOMERS</div>
                <div className="metric">{customers.length}</div>
              </div>
              <div className="card">
                <div className="kicker">ORDERS</div>
                <div className="metric">{orders.length}</div>
              </div>
            </div>

            {customers.length === 0 ? (
              <p className="muted">No customer accounts yet.</p>
            ) : (
              <div style={{ display: "grid", gap: "12px", marginBottom: "80px" }}>
                {customers.map((customer) => {
                  const stats = orderStats[customer.id] || {
                    count: 0,
                    total: 0,
                    active: 0,
                  };

                  return (
                    <article
                      key={customer.id}
                      className="card"
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr auto",
                        gap: "18px",
                        alignItems: "center",
                      }}
                    >
                      <div>
                        <strong>
                          {customer.full_name || "Unnamed customer"}
                        </strong>
                        <div className="muted">
                          {customer.email || "No email stored"}
                        </div>
                        <div className="muted">
                          Joined{" "}
                          {customer.created_at
                            ? new Date(customer.created_at).toLocaleDateString()
                            : "—"}
                        </div>
                      </div>

                      <div style={{ textAlign: "right" }}>
                        <strong>{stats.count}</strong>
                        <div className="muted">orders</div>
                        <div className="muted">
                          {money(stats.total)} lifetime
                        </div>
                        {stats.active > 0 && (
                          <div style={{ marginTop: "4px", fontWeight: 700 }}>
                            {stats.active} active
                          </div>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </>
        )}
      </main>
    </>
  );
}
