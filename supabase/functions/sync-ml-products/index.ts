import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const CATEGORIES = [
  { id: "MLB1055", name: "Celulares e Telefones" },
  { id: "MLB1648", name: "Informática" },
  { id: "MLB1574", name: "Eletrodomésticos" },
  { id: "MLB1246", name: "Beleza e Cuidado Pessoal" },
  { id: "MLB1276", name: "Esportes e Fitness" },
  { id: "MLB1132", name: "Casa e Decoração" },
];

type ProductPayload = {
  ml_id: string;
  title: string;
  price: number;
  original_price: number | null;
  thumbnail: string | null;
  permalink: string;
  category_id: string;
  category_name: string;
  sold_quantity: number;
  condition: string | null;
  free_shipping: boolean;
  synced_at: string;
};

const mlTokenUrl = "https://api.mercadolibre.com/oauth/token";

function responseJSON(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function parseBody(req: Request): Promise<any> {
  const raw = await req.text();
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

async function getMlAccessToken() {
  const clientId = Deno.env.get("ML_CLIENT_ID");
  const clientSecret = Deno.env.get("ML_CLIENT_SECRET");

  if (!clientId || !clientSecret) {
    throw new Error("ML_CLIENT_ID/ML_CLIENT_SECRET não configurados");
  }

  const tokenRes = await fetch(mlTokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  if (!tokenRes.ok) {
    const errorText = await tokenRes.text();
    throw new Error(`Falha no OAuth ML [${tokenRes.status}]: ${errorText.slice(0, 200)}`);
  }

  const tokenData = await tokenRes.json();
  if (!tokenData?.access_token) {
    throw new Error("OAuth ML sem access_token");
  }

  return String(tokenData.access_token);
}

async function fetchWithRetry(url: string, token: string, retries = 2): Promise<any> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });

    if (res.status === 429 && attempt < retries) {
      await new Promise((resolve) => setTimeout(resolve, 600 * (attempt + 1)));
      continue;
    }

    const text = await res.text();
    if (!res.ok) {
      throw new Error(`ML request failed [${res.status}] ${text.slice(0, 180)}`);
    }

    return text ? JSON.parse(text) : {};
  }

  return {};
}

function sanitizeIncoming(products: any[]): ProductPayload[] {
  return products
    .filter((p) => p?.ml_id && p?.title && Number(p?.price) > 0 && p?.permalink)
    .map((p) => ({
      ml_id: String(p.ml_id),
      title: String(p.title).slice(0, 500),
      price: Number(p.price),
      original_price:
        p.original_price !== null && p.original_price !== undefined && Number(p.original_price) > 0
          ? Number(p.original_price)
          : null,
      thumbnail: p.thumbnail ? String(p.thumbnail).replace("http://", "https://") : null,
      permalink: String(p.permalink),
      category_id: String(p.category_id || ""),
      category_name: String(p.category_name || ""),
      sold_quantity: Number(p.sold_quantity) || 0,
      condition: p.condition ? String(p.condition) : null,
      free_shipping: Boolean(p.free_shipping),
      synced_at: new Date().toISOString(),
    }))
    .filter((p) => p.category_id && p.category_name);
}

function normalizeFromItem(
  item: any,
  fallback?: {
    thumbnail?: string | null;
    permalink?: string;
    category_id?: string;
    category_name?: string;
  }
): ProductPayload | null {
  const itemId = String(item?.id ?? "");
  if (!itemId) return null;

  const price = Number(item?.price ?? 0);
  if (!Number.isFinite(price) || price <= 0) return null;

  const title = String(item?.title ?? "").slice(0, 500);
  if (!title) return null;

  const permalink = String(item?.permalink ?? fallback?.permalink ?? "") ||
    `https://www.mercadolivre.com.br/p/${itemId}`;

  const categoryId = String(fallback?.category_id ?? item?.category_id ?? "");
  const categoryName = String(fallback?.category_name ?? item?.category_name ?? "");

  if (!categoryId || !categoryName) return null;

  const thumb = item?.thumbnail ?? item?.pictures?.[0]?.url ?? fallback?.thumbnail ?? null;
  const originalPriceRaw = Number(item?.original_price ?? 0);
  const soldRaw = Number(item?.sold_quantity ?? 0);
  const shipping = item?.shipping ?? {};

  return {
    ml_id: itemId,
    title,
    price,
    original_price: Number.isFinite(originalPriceRaw) && originalPriceRaw > 0 ? originalPriceRaw : null,
    thumbnail: thumb ? String(thumb).replace("http://", "https://") : null,
    permalink,
    category_id: categoryId,
    category_name: categoryName,
    sold_quantity: Number.isFinite(soldRaw) ? soldRaw : 0,
    condition: item?.condition ?? null,
    free_shipping: Boolean(shipping?.free_shipping),
    synced_at: new Date().toISOString(),
  };
}

async function fetchProductIds(categoryId: string, token: string): Promise<string[]> {
  const ids = new Set<string>();

  // Highlights for main category
  try {
    const data = await fetchWithRetry(
      `https://api.mercadolibre.com/highlights/MLB/category/${categoryId}`,
      token, 1
    );
    for (const entry of data?.content || []) {
      if (entry?.id) ids.add(String(entry.id));
    }
  } catch {}

  // Subcategory highlights
  try {
    const catData = await fetchWithRetry(
      `https://api.mercadolibre.com/categories/${categoryId}`,
      token, 1
    );
    const children = (catData?.children_categories || []).slice(0, 20);
    await Promise.allSettled(
      children.map(async (child: any) => {
        try {
          const sub = await fetchWithRetry(
            `https://api.mercadolibre.com/highlights/MLB/category/${child.id}`,
            token, 1
          );
          for (const entry of sub?.content || []) {
            if (entry?.id) ids.add(String(entry.id));
          }
        } catch {}
      })
    );
  } catch {}

  return Array.from(ids);
}

async function fetchItemsForIds(
  ids: string[],
  token: string,
  fallbackCategory: { category_id: string; category_name: string }
): Promise<ProductPayload[]> {
  const results: ProductPayload[] = [];
  const batchSize = 20;

  for (let i = 0; i < ids.length; i += batchSize) {
    const batch = ids.slice(i, i + batchSize);
    try {
      const details = await fetchWithRetry(
        `https://api.mercadolibre.com/items?ids=${batch.join(",")}`,
        token,
        1
      );

      for (const entry of Array.isArray(details) ? details : []) {
        if (entry?.code !== 200 || !entry?.body) continue;
        const normalized = normalizeFromItem(entry.body, fallbackCategory);
        if (normalized) results.push(normalized);
      }
    } catch (err: any) {
      console.warn(`Batch item fetch failed (${fallbackCategory.category_name}): ${err.message?.slice(0, 120)}`);
    }

    if (i + batchSize < ids.length) {
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
  }

  return Array.from(new Map(results.map((product) => [product.ml_id, product])).values());
}

async function syncFromMlCatalog(supabase: ReturnType<typeof createClient>) {
  const token = await getMlAccessToken();
  const collected: ProductPayload[] = [];

  for (const category of CATEGORIES) {
    const ids = await fetchProductIds(category.id, token);
    console.log(`${category.name}: ${ids.length} IDs from highlights`);

    const selected = ids.slice(0, 120);
    const normalized = await fetchItemsForIds(selected, token, {
      category_id: category.id,
      category_name: category.name,
    });
    const categoryProducts = normalized.slice(0, 30);

    console.log(`${category.name}: ${categoryProducts.length} products normalized`);
    collected.push(...categoryProducts);
  }

  const uniqueProducts = Array.from(new Map(collected.map((product) => [product.ml_id, product])).values());
  console.log(`Total products fetched: ${uniqueProducts.length}`);

  if (uniqueProducts.length === 0) {
    // Don't fail if we already have products in DB
    const { count } = await supabase.from("products").select("*", { count: "exact", head: true });
    if (count && count > 0) {
      console.warn("No new products fetched, but DB has existing products");
      return count;
    }
    throw new Error("No products fetched from ML");
  }

  const { error: upsertError } = await supabase
    .from("products")
    .upsert(uniqueProducts, { onConflict: "ml_id" });

  if (upsertError) {
    throw new Error(`Erro no upsert: ${upsertError.message}`);
  }

  return uniqueProducts.length;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await parseBody(req);
    const products = Array.isArray(body?.products) ? body.products : null;

    if (products && products.length > 0) {
      const sanitized = sanitizeIncoming(products);

      console.log(
        `Received ${products.length} products from client, ${sanitized.length} valid after sanitization`
      );

      if (sanitized.length === 0) {
        return responseJSON({ success: false, error: "No valid products after sanitization" }, 400);
      }

      const { error } = await supabase
        .from("products")
        .upsert(sanitized, { onConflict: "ml_id" });

      if (error) {
        console.error("Upsert error:", error);
        return responseJSON({ success: false, error: error.message }, 500);
      }

      return responseJSON({ success: true, total: sanitized.length, source: "client_payload" });
    }

    const total = await syncFromMlCatalog(supabase);
    return responseJSON({ success: true, total, source: "ml_catalog_items" });
  } catch (error: any) {
    console.error("Error:", error);
    return responseJSON({ success: false, error: error.message }, 500);
  }
});
