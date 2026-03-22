import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { products } = await req.json();

    if (!Array.isArray(products) || products.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: "No products provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const sanitized = products
      .filter((p: any) => p.ml_id && p.title && p.price > 0 && p.permalink)
      .map((p: any) => ({
        ml_id: String(p.ml_id),
        title: String(p.title).slice(0, 500),
        price: Number(p.price),
        original_price: p.original_price ? Number(p.original_price) : null,
        thumbnail: p.thumbnail ? String(p.thumbnail).replace("http://", "https://") : null,
        permalink: String(p.permalink),
        category_id: String(p.category_id),
        category_name: String(p.category_name),
        sold_quantity: Number(p.sold_quantity) || 0,
        condition: p.condition ? String(p.condition) : null,
        free_shipping: Boolean(p.free_shipping),
        synced_at: new Date().toISOString(),
      }));

    console.log(`Received ${products.length} products, ${sanitized.length} valid after sanitization`);

    if (sanitized.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: "No valid products after sanitization" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { error } = await supabase
      .from("products")
      .upsert(sanitized, { onConflict: "ml_id" });

    if (error) {
      console.error("Upsert error:", error);
      return new Response(
        JSON.stringify({ success: false, error: error.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, total: sanitized.length }),
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
