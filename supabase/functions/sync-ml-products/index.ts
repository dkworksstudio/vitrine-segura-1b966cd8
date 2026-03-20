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

async function getAccessToken(): Promise<string> {
  const clientId = Deno.env.get("ML_CLIENT_ID")!;
  const clientSecret = Deno.env.get("ML_CLIENT_SECRET")!;

  const res = await fetch("https://api.mercadolibre.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OAuth failed: ${res.status} ${text}`);
  }

  const data = await res.json();
  return data.access_token;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const accessToken = await getAccessToken();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    let totalProducts = 0;

    for (const category of CATEGORIES) {
      try {
        // Step 1: Get trending/highlighted items
        const highlightsRes = await fetch(
          `https://api.mercadolibre.com/highlights/MLB/category/${category.id}`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );

        if (!highlightsRes.ok) continue;

        const highlights = await highlightsRes.json();
        const contentItems = highlights?.content || [];

        // Collect item IDs (resolve product IDs to items if needed)
        const itemIds: string[] = [];

        for (const item of contentItems.slice(0, 20)) {
          if (item.type === "ITEM" && item.id) {
            itemIds.push(item.id);
          } else if (item.type === "PRODUCT" && item.id) {
            try {
              const prodRes = await fetch(
                `https://api.mercadolibre.com/products/${item.id}`,
                { headers: { Authorization: `Bearer ${accessToken}` } }
              );
              if (prodRes.ok) {
                const prodData = await prodRes.json();
                const buyBox = prodData.buy_box_winner;
                if (buyBox?.item_id) {
                  itemIds.push(buyBox.item_id);
                }
              }
            } catch {}
          }
        }

        if (!itemIds.length) continue;

        // Step 2: Multi-get items for real prices
        const batchSize = 20;
        for (let i = 0; i < itemIds.length; i += batchSize) {
          const batch = itemIds.slice(i, i + batchSize);
          const multiRes = await fetch(
            `https://api.mercadolibre.com/items?ids=${batch.join(",")}&attributes=id,title,price,original_price,thumbnail,permalink,sold_quantity,condition,shipping`,
            { headers: { Authorization: `Bearer ${accessToken}` } }
          );

          if (!multiRes.ok) continue;

          const multiData = await multiRes.json();
          const products = multiData
            .filter((r: any) => r.code === 200 && r.body)
            .map((r: any) => ({
              ml_id: r.body.id,
              title: r.body.title,
              price: r.body.price || 0,
              original_price: r.body.original_price || null,
              thumbnail: r.body.thumbnail?.replace("http://", "https://") || null,
              permalink: r.body.permalink,
              category_id: category.id,
              category_name: category.name,
              sold_quantity: r.body.sold_quantity || 0,
              condition: r.body.condition || null,
              free_shipping: r.body.shipping?.free_shipping || false,
              synced_at: new Date().toISOString(),
            }));

          if (products.length) {
            const { error } = await supabase
              .from("products")
              .upsert(products, { onConflict: "ml_id" });

            if (!error) totalProducts += products.length;
          }
        }
      } catch (catError) {
        console.error(`Error processing ${category.name}:`, catError);
      }
    }

    return new Response(
      JSON.stringify({ success: true, total: totalProducts }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Sync error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
