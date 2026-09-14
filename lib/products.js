import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export function getServerSupabase() {
  if (!url || !key) {
    console.error("PRODUCTS: Supabase server configuration missing");
    return null;
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

export async function getPublishedProducts() {
  const supabase = getServerSupabase();

  if (!supabase) return [];

  const { data, error } = await supabase
    .from("products")
    .select("id,name,slug,description,price,image_url")
    .eq("published", true)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("PRODUCTS QUERY ERROR:", error.message);
    return [];
  }

  return data || [];
}

export async function getPublishedProduct(slug) {
  const supabase = getServerSupabase();

  if (!supabase) return null;

  const { data, error } = await supabase
    .from("products")
    .select(`
      id,
      name,
      slug,
      description,
      price,
      image_url,
      product_variants(
        id,
        sku,
        size,
        stock,
        price
      )
    `)
    .eq("published", true)
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    console.error("PRODUCT QUERY ERROR:", error.message);
    return null;
  }

  if (!data) return null;

  return {
    ...data,
    product_variants: (data.product_variants || []).sort((a, b) => {
      const order = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"];

      const aIndex = order.indexOf((a.size || "").toUpperCase());
      const bIndex = order.indexOf((b.size || "").toUpperCase());

      if (aIndex === -1 && bIndex === -1) {
        return (a.size || "").localeCompare(b.size || "");
      }

      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;

      return aIndex - bIndex;
    }),
  };
}
