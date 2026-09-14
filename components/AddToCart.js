"use client";

import { useState } from "react";
import { useCart } from "./CartProvider";

export default function AddToCart({ product, variants }) {
  const { addItem, cart } = useCart();

  const availableVariants = variants.filter(
    (variant) => Number(variant.stock) > 0
  );

  const [selectedVariantId, setSelectedVariantId] = useState(
  () => availableVariants[0]?.id || ""
);

const [message, setMessage] = useState("");

  const selectedVariant = variants.find(
    (variant) => variant.id === selectedVariantId
  );

  const currentQuantity = selectedVariant
    ? cart.find(
        (item) =>
          item.productId === product.id &&
          item.variantId === selectedVariant.id
      )?.quantity || 0
    : 0;

  function handleAdd() {
    if (!selectedVariant) {
      setMessage("Select an available size to continue.");
      return;
    }

    const stock = Number(selectedVariant.stock) || 0;

    if (stock <= 0) {
      setMessage("This size is currently out of stock.");
      return;
    }

    if (currentQuantity >= stock) {
      setMessage(
        stock === 1
          ? "Only 1 available for this size."
          : `Only ${stock} available for this size.`
      );
      return;
    }

    const price =
      selectedVariant.price !== null
        ? Number(selectedVariant.price)
        : Number(product.price);

    addItem({
      productId: product.id,
      variantId: selectedVariant.id,
      name: product.name,
      size: selectedVariant.size,
      price,
      imageUrl: product.image_url,
      stock,
      quantity: 1,
    });

    setMessage("Added to cart.");
  }

  return (
    <div>
      {variants.length > 0 ? (
        <>
          <div className="kicker">SELECT SIZE</div>

          <div className="sizes">
            {variants.map((variant) => {
              const inStock = Number(variant.stock) > 0;
              const selected = variant.id === selectedVariantId;

              return (
                <button
                  className="size"
                  key={variant.id}
                  type="button"
                  disabled={!inStock}
                  onClick={() => {
                    if (!inStock) return;

                    setSelectedVariantId(variant.id);
                    setMessage("");
                  }}
                  style={{
                    opacity: inStock ? 1 : 0.35,
                    cursor: inStock
                      ? "pointer"
                      : "not-allowed",
                    background: selected ? "#111" : "#fff",
                    color: selected ? "#fff" : "#111",
                    borderColor: selected
                      ? "#111"
                      : "var(--line)",
                  }}
                >
                  {variant.size || "ONE SIZE"}
                </button>
              );
            })}
          </div>

          {availableVariants.length === 0 ? (
            <p
              className="muted"
              style={{ marginTop: "14px" }}
            >
              Currently out of stock.
            </p>
          ) : (
            <>
              <button
                className="btn primary"
                type="button"
                onClick={handleAdd}
              >
                ADD TO CART
              </button>

              {message ? (
                <p
                  className="muted"
                  style={{ marginTop: "12px" }}
                >
                  {message}
                </p>
              ) : null}
            </>
          )}
        </>
      ) : (
        <>
          <p className="muted">
            This item currently has no size variants.
          </p>

          <p className="muted">
            Inventory has not yet been configured for this item.
          </p>
        </>
      )}
    </div>
  );
}