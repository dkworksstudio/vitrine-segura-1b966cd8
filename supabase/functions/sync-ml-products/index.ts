import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const CATEGORIES = [
  { id: "MLB1055", name: "Celulares e Telefones", keywords: ["smartphone", "celular samsung", "iphone", "fone bluetooth", "carregador celular", "capinha celular"] },
  { id: "MLB1648", name: "Informática", keywords: ["notebook", "mouse gamer", "teclado mecanico", "monitor", "ssd", "webcam"] },
  { id: "MLB1574", name: "Eletrodomésticos", keywords: ["air fryer", "aspirador robo", "cafeteira", "liquidificador", "microondas", "ventilador"] },
  { id: "MLB1246", name: "Beleza e Cuidado Pessoal", keywords: ["perfume masculino", "maquiagem", "secador cabelo", "protetor solar", "creme hidratante", "escova alisadora"] },
  { id: "MLB1276", name: "Esportes e Fitness", keywords: ["tenis corrida", "whey protein", "haltere", "bicicleta", "smartwatch", "colchonete yoga"] },
  { id: "MLB1132", name: "Casa e Decoração", keywords: ["luminaria", "organizador", "tapete", "cortina", "prateleira", "travesseiro"] },
];

async function getAccessToken(): Promise<string> {
  const clientId = Deno.env.get("ML_CLIENT_ID")!;
  const clientSecret = Deno.env.get("ML_CLIENT_SECRET")!;

  const res = await fetch("https://api.mercadolibre.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", "Accept": "application/json" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  if (!res.ok) throw new Error(`OAuth failed: ${res.status}`);
  const data = await res.json();
  return data.access_token;
}

async function fetchWithAuth(url: string, token: string): Promise<Response> {
  const headers: Record<string, string> = {
    "Accept": "application/json",
    "User-Agent": "VitrineSegura/1.0",
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return fetch(url, { headers });
}

async function fetchItemDetails(itemIds: string[], token: string): Promise<any[]> {
  const items: any[] = [];
  // ML allows up to 20 items per multi-get
  for (let i = 0; i < itemIds.length; i += 20) {
    const batch = itemIds.slice(i, i + 20);
    const url = `https://api.mercadolibre.com/items?ids=${batch.join(",")}&attributes=id,title,price,original_price,thumbnail,permalink,sold_quantity,condition,shipping`;
    const res = await fetchWithAuth(url, token);
    if (res.ok) {
      const data = await res.json();
      items.push(...data.filter((r: any) => r.code === 200).map((r: any) => r.body));
    } else {
      console.error(`Items batch failed: ${res.status}`);
    }
  }
  return items;
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
        let results: any[] = [];

        // Strategy 1: Try search endpoint  
        const searchUrl = `https://api.mercadolibre.com/sites/MLB/search?category=${category.id}&sort=sold_quantity_desc&limit=30`;
        const searchRes = await fetchWithAuth(searchUrl, accessToken);
        
        if (searchRes.ok) {
          const searchData = await searchRes.json();
          results = searchData.results || [];
          console.log(`Search OK for ${category.name}: ${results.length} results`);
        } else {
          console.log(`Search ${searchRes.status} for ${category.name}, trying keywords...`);
          
          // Strategy 2: Search by keywords (may bypass geo-block)
          const seenIds = new Set<string>();
          for (const keyword of category.keywords) {
            try {
              const kwUrl = `https://api.mercadolibre.com/sites/MLB/search?q=${encodeURIComponent(keyword)}&sort=sold_quantity_desc&limit=6`;
              const kwRes = await fetchWithAuth(kwUrl, accessToken);
              if (kwRes.ok) {
                const kwData = await kwRes.json();
                for (const item of (kwData.results || [])) {
                  if (!seenIds.has(item.id)) {
                    seenIds.add(item.id);
                    results.push(item);
                  }
                }
              }
            } catch (e) {
              // skip keyword
            }
          }
          console.log(`Keywords got ${results.length} results for ${category.name}`);
          
          // Strategy 3: If keywords also fail, try trends + item details
          if (results.length === 0) {
            console.log(`Trying trends for ${category.name}...`);
            const trendsUrl = `https://api.mercadolibre.com/trends/MLB/${category.id}`;
            const trendsRes = await fetchWithAuth(trendsUrl, accessToken);
            if (trendsRes.ok) {
              const trends = await trendsRes.json();
              const trendKeywords = (trends || []).slice(0, 5).map((t: any) => t.keyword).filter(Boolean);
              for (const kw of trendKeywords) {
                try {
                  const kwUrl = `https://api.mercadolibre.com/sites/MLB/search?q=${encodeURIComponent(kw)}&limit=6`;
                  const kwRes = await fetchWithAuth(kwUrl, accessToken);
                  if (kwRes.ok) {
                    const kwData = await kwRes.json();
                    for (const item of (kwData.results || [])) {
                      if (!seenIds.has(item.id)) {
                        seenIds.add(item.id);
                        results.push(item);
                      }
                    }
                  }
                } catch (e) {
                  // skip
                }
              }
              console.log(`Trends got ${results.length} results for ${category.name}`);
            }
          }
        }

        const products = results
          .filter((item: any) => item.price && item.price > 0)
          .slice(0, 30)
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

        console.log(`Upserting ${products.length} products for ${category.name}`);

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
