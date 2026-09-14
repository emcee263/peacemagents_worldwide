"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
import { useAdminGuard } from "../../../lib/admin-guard";

function makeSlug(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function emptyVariant() {
  return {
    size: "",
    sku: "",
    stock: 0,
    price: "",
  };
}

export default function AdminProducts() {
  const { loading: guardLoading, authorized, role } = useAdminGuard();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [published, setPublished] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [existingImage, setExistingImage] = useState("");
  const [variants, setVariants] = useState([emptyVariant()]);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadProducts() {
    if (!supabase) {
      setError("Supabase is not configured.");
      setLoading(false);
      return;
    }

    const { data, error: loadError } = await supabase
      .from("products")
      .select(
        "id,name,slug,description,price,image_url,published,created_at,product_variants(id,size,sku,stock,price)"
      )
      .order("created_at", { ascending: false });

    if (loadError) {
      setError(loadError.message);
    } else {
      setProducts(data || []);
    }

    setLoading(false);
  }

  useEffect(() => {
    if (authorized) {
      loadProducts();
    }
  }, [authorized]);

  function resetForm() {
    setEditingId(null);
    setName("");
    setDescription("");
    setPrice("");
    setPublished(false);
    setImageFile(null);
    setExistingImage("");
    setVariants([emptyVariant()]);
    setMessage("");
    setError("");

    const input = document.getElementById("product-image");
    if (input) input.value = "";
  }

  function editProduct(product) {
    setEditingId(product.id);
    setName(product.name || "");
    setDescription(product.description || "");
    setPrice(product.price ?? "");
    setPublished(Boolean(product.published));
    setExistingImage(product.image_url || "");
    setImageFile(null);

    setVariants(
      product.product_variants?.length
        ? product.product_variants.map((variant) => ({
            id: variant.id,
            size: variant.size || "",
            sku: variant.sku || "",
            stock: variant.stock ?? 0,
            price: variant.price ?? "",
          }))
        : [emptyVariant()]
    );

    setMessage("");
    setError("");

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function updateVariant(index, field, value) {
    setVariants((current) =>
      current.map((variant, variantIndex) =>
        variantIndex === index
          ? { ...variant, [field]: value }
          : variant
      )
    );
  }

  function addVariant() {
    setVariants((current) => [...current, emptyVariant()]);
  }

  function removeVariant(index) {
    setVariants((current) =>
      current.length === 1
        ? [emptyVariant()]
        : current.filter((_, variantIndex) => variantIndex !== index)
    );
  }

  async function uploadImage(file, productSlug) {
    if (!file) return existingImage || null;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      throw new Error("Product image must be JPG, PNG or WebP.");
    }

    if (file.size > 5 * 1024 * 1024) {
      throw new Error("Product image must be 5 MB or smaller.");
    }

    const extension =
      file.name.split(".").pop()?.toLowerCase() || "jpg";

    const safeExtension = ["jpg", "jpeg", "png", "webp"].includes(
      extension
    )
      ? extension
      : "jpg";

    const fileName = `${productSlug}-${Date.now()}.${safeExtension}`;

    const { error: uploadError } = await supabase.storage
      .from("product-images")
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
      });

    if (uploadError) throw new Error(uploadError.message);

    const { data } = supabase.storage
      .from("product-images")
      .getPublicUrl(fileName);

    return data.publicUrl;
  }

  async function saveProduct(event) {
    event.preventDefault();

    setSaving(true);
    setMessage("");
    setError("");

    try {
      if (!supabase) throw new Error("Supabase is not configured.");

      const trimmedName = name.trim();
      if (!trimmedName) throw new Error("Product name is required.");

      const numericPrice = Number(price);
      if (!Number.isFinite(numericPrice) || numericPrice < 0) {
        throw new Error("Enter a valid product price.");
      }

      const slug = makeSlug(trimmedName);
      if (!slug) {
        throw new Error("Product name must contain letters or numbers.");
      }

      const cleanVariants = variants
        .map((variant) => ({
          size: variant.size.trim(),
          sku: variant.sku.trim(),
          stock: Number(variant.stock),
          price:
            variant.price === "" || variant.price === null
              ? null
              : Number(variant.price),
        }))
        .filter(
          (variant) =>
            variant.size ||
            variant.sku ||
            variant.stock !== 0 ||
            variant.price !== null
        );

      for (const variant of cleanVariants) {
        if (!Number.isInteger(variant.stock) || variant.stock < 0) {
          throw new Error("Variant stock must be a whole number of 0 or more.");
        }

        if (
          variant.price !== null &&
          (!Number.isFinite(variant.price) || variant.price < 0)
        ) {
          throw new Error("Every variant price must be valid.");
        }
      }

      const imageUrl = await uploadImage(imageFile, slug);

      const payload = {
        name: trimmedName,
        slug,
        description: description.trim(),
        price: numericPrice,
        image_url: imageUrl,
        published,
      };

      let productId = editingId;

      if (editingId) {
        const { error: updateError } = await supabase
          .from("products")
          .update(payload)
          .eq("id", editingId);

        if (updateError) throw new Error(updateError.message);

        const { error: deleteVariantsError } = await supabase
          .from("product_variants")
          .delete()
          .eq("product_id", editingId);

        if (deleteVariantsError) {
          throw new Error(deleteVariantsError.message);
        }

        setMessage("Product updated successfully.");
      } else {
        const { data, error: insertError } = await supabase
          .from("products")
          .insert(payload)
          .select("id")
          .single();

        if (insertError) throw new Error(insertError.message);

        productId = data.id;
        setMessage("Product created successfully.");
      }

      if (cleanVariants.length > 0) {
        const rows = cleanVariants.map((variant) => ({
          product_id: productId,
          size: variant.size || null,
          sku: variant.sku || null,
          stock: variant.stock,
          price: variant.price,
        }));

        const { error: variantError } = await supabase
          .from("product_variants")
          .insert(rows);

        if (variantError) throw new Error(variantError.message);
      }

      const wasEditing = Boolean(editingId);
      resetForm();
      setMessage(
        wasEditing
          ? "Product and variants updated successfully."
          : "Product and variants created successfully."
      );

      await loadProducts();
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  async function togglePublished(product) {
    setError("");
    setMessage("");

    const { error: updateError } = await supabase
      .from("products")
      .update({ published: !product.published })
      .eq("id", product.id);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setMessage(
      product.published
        ? `${product.name} moved to draft.`
        : `${product.name} is now published.`
    );

    await loadProducts();
  }

  async function deleteProduct(product) {
    const confirmed = window.confirm(
      `Delete "${product.name}"? This cannot be undone.`
    );

    if (!confirmed) return;

    setError("");
    setMessage("");

    const { error: deleteError } = await supabase
      .from("products")
      .delete()
      .eq("id", product.id);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    setMessage(`${product.name} deleted.`);
    await loadProducts();
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
        <p>You do not have permission to manage products.</p>
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
          <div className="kicker">PEACEMAGENTS HQ / PRODUCTS</div>
          <h1>PRODUCT<br />MANAGER.</h1>
          <p className="lede">
            Manage products, images, sizes, SKUs, stock and publication state.
          </p>
          <div style={{ marginTop: "24px" }}>
            <span className="muted">Signed in as {role}.</span>
          </div>
        </div>

        <section style={{ maxWidth: "820px", marginBottom: "64px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "16px",
              marginBottom: "24px",
              flexWrap: "wrap",
            }}
          >
            <div>
              <div className="kicker">
                {editingId ? "EDIT PRODUCT" : "NEW PRODUCT"}
              </div>
              <h2 style={{ margin: "8px 0 0" }}>
                {editingId ? "UPDATE PRODUCT." : "ADD PRODUCT."}
              </h2>
            </div>

            {editingId && (
              <button type="button" className="btn" onClick={resetForm}>
                CANCEL
              </button>
            )}
          </div>

          <form onSubmit={saveProduct}>
            <div style={{ marginBottom: "18px" }}>
              <label htmlFor="product-name" style={{ display: "block", marginBottom: "8px", fontWeight: 700 }}>
                Product name
              </label>
              <input
                id="product-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Calm Rebel Tee"
                required
                style={{ width: "100%", padding: "14px", border: "1px solid #111", background: "#fff", font: "inherit" }}
              />
            </div>

            <div style={{ marginBottom: "18px" }}>
              <label htmlFor="product-description" style={{ display: "block", marginBottom: "8px", fontWeight: 700 }}>
                Description
              </label>
              <textarea
                id="product-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="A clean everyday piece built around the calm-rebel mindset."
                rows={5}
                style={{ width: "100%", padding: "14px", border: "1px solid #111", background: "#fff", font: "inherit", resize: "vertical" }}
              />
            </div>

            <div style={{ marginBottom: "18px" }}>
              <label htmlFor="product-price" style={{ display: "block", marginBottom: "8px", fontWeight: 700 }}>
                Base price
              </label>
              <input
                id="product-price"
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={(event) => setPrice(event.target.value)}
                placeholder="35.00"
                required
                style={{ width: "100%", padding: "14px", border: "1px solid #111", background: "#fff", font: "inherit" }}
              />
            </div>

            <div style={{ marginBottom: "18px" }}>
              <label htmlFor="product-image" style={{ display: "block", marginBottom: "8px", fontWeight: 700 }}>
                Product image
              </label>
              <input
                id="product-image"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(event) => setImageFile(event.target.files?.[0] || null)}
                style={{ width: "100%", padding: "14px", border: "1px solid #111", background: "#fff", font: "inherit" }}
              />
              <p className="muted" style={{ marginTop: "8px" }}>
                JPG, PNG or WebP · maximum 5 MB
              </p>

              {existingImage && (
                <div style={{ marginTop: "14px" }}>
                  <img
                    src={existingImage}
                    alt={name || "Current product"}
                    style={{ width: "180px", height: "180px", objectFit: "cover", display: "block" }}
                  />
                </div>
              )}
            </div>

            <section
              style={{
                border: "1px solid #111",
                padding: "18px",
                marginBottom: "24px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "12px",
                  marginBottom: "18px",
                }}
              >
                <div>
                  <div className="kicker">VARIANTS / INVENTORY</div>
                  <h3 style={{ margin: "6px 0 0" }}>SIZES & STOCK.</h3>
                </div>
                <button type="button" className="btn" onClick={addVariant}>
                  + ADD SIZE
                </button>
              </div>

              <div style={{ display: "grid", gap: "10px" }}>
                {variants.map((variant, index) => (
                  <div
                    key={index}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1.4fr .8fr 1fr auto",
                      gap: "8px",
                      alignItems: "center",
                    }}
                  >
                    <input
                      value={variant.size}
                      onChange={(event) => updateVariant(index, "size", event.target.value)}
                      placeholder="M"
                      aria-label="Size"
                      style={{ padding: "12px", border: "1px solid #111", background: "#fff", font: "inherit", minWidth: 0 }}
                    />
                    <input
                      value={variant.sku}
                      onChange={(event) => updateVariant(index, "sku", event.target.value)}
                      placeholder="PM-CRT-M"
                      aria-label="SKU"
                      style={{ padding: "12px", border: "1px solid #111", background: "#fff", font: "inherit", minWidth: 0 }}
                    />
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={variant.stock}
                      onChange={(event) => updateVariant(index, "stock", event.target.value)}
                      placeholder="0"
                      aria-label="Stock"
                      style={{ padding: "12px", border: "1px solid #111", background: "#fff", font: "inherit", minWidth: 0 }}
                    />
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={variant.price}
                      onChange={(event) => updateVariant(index, "price", event.target.value)}
                      placeholder="Base price"
                      aria-label="Variant price"
                      style={{ padding: "12px", border: "1px solid #111", background: "#fff", font: "inherit", minWidth: 0 }}
                    />
                    <button
                      type="button"
                      className="btn"
                      onClick={() => removeVariant(index)}
                      aria-label={`Remove variant ${index + 1}`}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>

              <p className="muted" style={{ marginBottom: 0, marginTop: "12px" }}>
                Leave variant price empty to use the base product price.
              </p>
            </section>

            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                marginBottom: "24px",
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={published}
                onChange={(event) => setPublished(event.target.checked)}
              />
              <span>Publish this product immediately</span>
            </label>

            {error && (
              <div className="card" style={{ marginBottom: "16px" }}>
                {error}
              </div>
            )}

            {message && (
              <div className="card" style={{ marginBottom: "16px" }}>
                {message}
              </div>
            )}

            <button type="submit" className="btn primary" disabled={saving}>
              {saving
                ? "SAVING..."
                : editingId
                ? "UPDATE PRODUCT"
                : "CREATE PRODUCT"}
            </button>
          </form>
        </section>

        <section>
          <div className="kicker">CATALOGUE</div>
          <h2 style={{ margin: "8px 0 24px" }}>
            {products.length} PRODUCTS.
          </h2>

          {loading ? (
            <p className="muted">Loading products...</p>
          ) : products.length === 0 ? (
            <p className="muted">No products have been created yet.</p>
          ) : (
            <div style={{ display: "grid", gap: "14px", marginBottom: "80px" }}>
              {products.map((product) => {
                const productVariants = product.product_variants || [];
                const stock = productVariants.reduce(
                  (sum, variant) => sum + Number(variant.stock || 0),
                  0
                );
                const lowStock = productVariants.filter(
                  (variant) => Number(variant.stock || 0) <= 5
                ).length;

                return (
                  <article
                    key={product.id}
                    className="card"
                    style={{
                      display: "grid",
                      gridTemplateColumns: "90px 1fr auto",
                      gap: "18px",
                      alignItems: "center",
                    }}
                  >
                    <div
                      style={{
                        width: "90px",
                        height: "90px",
                        background: "#eee",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        overflow: "hidden",
                      }}
                    >
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      ) : (
                        <span>PM</span>
                      )}
                    </div>

                    <div>
                      <h3 style={{ margin: "0 0 6px" }}>{product.name}</h3>
                      <div style={{ marginBottom: "6px" }}>
                        ${Number(product.price).toFixed(2)}
                      </div>
                      <div className="muted">
                        {product.published ? "Published" : "Draft"} ·{" "}
                        {productVariants.length} sizes · {stock} units
                      </div>
                      {lowStock > 0 && (
                        <div style={{ marginTop: "4px", fontWeight: 700 }}>
                          {lowStock} low-stock size{lowStock === 1 ? "" : "s"}
                        </div>
                      )}
                    </div>

                    <div
                      style={{
                        display: "flex",
                        gap: "8px",
                        flexWrap: "wrap",
                        justifyContent: "flex-end",
                      }}
                    >
                      <button type="button" className="btn" onClick={() => editProduct(product)}>
                        EDIT
                      </button>
                      <button type="button" className="btn" onClick={() => togglePublished(product)}>
                        {product.published ? "UNPUBLISH" : "PUBLISH"}
                      </button>
                      <button type="button" className="btn" onClick={() => deleteProduct(product)}>
                        DELETE
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </>
  );
}
