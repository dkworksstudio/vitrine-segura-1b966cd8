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
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Accept": "application/json",
    },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OAuth failed (${res.status}): ${text}`);
  }

  const data = await res.json();
  return data.access_token;
}

async function fetchCategory(
  categoryId: string,
  categoryName: string,
  accessToken: string
): Promise<any[]> {
  const headers: Record<string, string> = {
    "Accept": "application/json",
    "User-Agent": "VitrineSegura/1.0",
  };
  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }

  // Try search endpoint first
  const searchUrl = `https://api.mercadolibre.com/sites/MLB/search?category=${categoryId}&sort=sold_quantity_desc&limit=30`;
  console.log(`Trying search: ${searchUrl}`);
  
  let res = await fetch(searchUrl, { headers });
  
  if (res.ok) {
    const data = await res.json();
    return data.results || [];
  }
  
  console.log(`Search returned ${res.status}, trying highlights...`);
  
  // Fallback: category highlights
  const highlightsUrl = `https://api.mercadolibre.com/highlights/MLB/category/${categoryId}`;
  res = await fetch(highlightsUrl, { headers });
  
  if (res.ok) {
    const highlights = await res.json();
    const itemIds = (highlights.content || []).slice(0, 30).map((h: any) => h.id);
    
    if (itemIds.length > 0) {
      const itemsUrl = `https://api.mercadolibre.com/items?ids=${itemIds.join(",")}`;
      const itemsRes = await fetch(itemsUrl, { headers });
      
      if (itemsRes.ok) {
        const itemsData = await itemsRes.json();
        return itemsData
          .filter((r: any) => r.code === 200)
          .map((r: any) => r.body);
      }
    }
  }
  
  console.log(`Highlights returned ${res.status}, trying trends...`);
  
  // Fallback 2: trends
  const trendsUrl = `https://api.mercadolibre.com/trends/MLB/${categoryId}`;
  res = await fetch(trendsUrl, { headers });
  
  if (res.ok) {
    const trends = await res.json();
    // Trends returns keyword trends, need to search each
    const allItems: any[] = [];
    for (const trend of (trends || []).slice(0, 5)) {
      const keyword = trend.keyword;
      if (!keyword) continue;
      const kUrl = `https://api.mercadolibre.com/sites/MLB/search?q=${encodeURIComponent(keyword)}&category=${categoryId}&limit=6`;
      const kRes = await fetch(kUrl, { headers });
      if (kRes.ok) {
        const kData = await kRes.json();
        allItems.push(...(kData.results || []));
      }
    }
    return allItems;
  }
  
  console.error(`All endpoints failed for ${categoryName}`);
  return [];
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

    let accessToken = "";
    try {
      accessToken = await getAccessToken();
      console.log("OAuth token obtained");
    } catch (e) {
      console.error("OAuth error:", e.message);
    }

    let totalProducts = 0;

    for (const category of CATEGORIES) {
      try {
        const results = await fetchCategory(category.id, category.name, accessToken);
        console.log(`Got ${results.length} results for ${category.name}`);

        const products = results
          .filter((item: any) => item.price && item.price > 0)
          .map((item: any) => ({
            ml_id: item.id,
            title: item.title,
            price: item.price,
            original_price: item.original_price || null,
            thumbnail: (item.thumbnail || "").replace("http://", "https://"),
            permalink: item.permalink,
            category_id: category.id,
            category_name: category.name,
            sold_quantity: item.sold_quantity || 0,
            condition: item.condition || null,
            free_shipping: item.shipping?.free_shipping || false,
            synced_at: new Date().toISOString(),
          }));

        console.log(`Valid products: ${products.length}`);

        if (products.length) {
          const { error } = await supabase
            .from("products")
            .upsert(products, { onConflict: "ml_id" });

          if (error) {
            console.error(`Upsert error for ${category.name}:`, error);
          } else {
            totalProducts += products.length;
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
