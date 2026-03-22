import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const CATEGORIES = [
  { id: "MLB1055", name: "Celulares e Telefones" },
  { id: "MLB1648", name: "Informática" },
  { id: "MLB1574", name: "Eletrodomésticos" },
  { id: "MLB1246", name: "Beleza e Cuidado Pessoal" },
  { id: "MLB1276", name: "Esportes e Fitness" },
  { id: "MLB1132", name: "Casa e Decoração" },
];

async function fetchCategory(categoryId: string, categoryName: string) {
  const url = `https://api.mercadolibre.com/sites/MLB/search?category=${categoryId}&sort=sold_quantity_desc&limit=30`;

  const res = await fetch(url);

  if (!res.ok) {
    console.error(`Search error for ${categoryName}: ${res.status} - ${await res.text()}`);
    return [];
  }

  const data = await res.json();
  return (data.results || [])
    .filter((item: any) => item.price && item.price > 0)
    .map((item: any) => ({
      ml_id: item.id,
      title: String(item.title).slice(0, 500),
      price: Number(item.price),
      original_price: item.original_price ? Number(item.original_price) : null,
      thumbnail: (item.thumbnail || "").replace("http://", "https://"),
      permalink: item.permalink,
      category_id: categoryId,
      category_name: categoryName,
      sold_quantity: Number(item.sold_quantity) || 0,
      condition: item.condition || null,
      free_shipping: item.shipping?.free_shipping || false,
      synced_at: new Date().toISOString(),
    }));
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const promises = CATEGORIES.map((cat) => fetchCategory(cat.id, cat.name));
    const results = await Promise.allSettled(promises);

    const allProducts: any[] = [];
    for (const r of results) {
      if (r.status === "fulfilled") allProducts.push(...r.value);
    }

    console.log(`Fetched ${allProducts.length} products from ML API`);

    if (allProducts.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: "No products fetched from ML" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { error } = await supabase
      .from("products")
      .upsert(allProducts, { onConflict: "ml_id" });

    if (error) {
      console.error("Upsert error:", error);
      return new Response(
        JSON.stringify({ success: false, error: error.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, total: allProducts.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
