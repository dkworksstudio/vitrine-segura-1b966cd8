import { supabase } from "@/integrations/supabase/client";
import { CATEGORIES } from "./useProducts";

const ML_SEARCH_URL = "https://api.mercadolibre.com/sites/MLB/search";

interface MLProduct {
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
}

async function fetchCategoryProducts(categoryId: string, categoryName: string): Promise<MLProduct[]> {
  const url = `${ML_SEARCH_URL}?category=${categoryId}&sort=sold_quantity_desc&limit=30`;
  
  const res = await fetch(url);
  if (!res.ok) {
    console.error(`ML API error for ${categoryName}: ${res.status}`);
    return [];
  }
  
  const data = await res.json();
  const results = data.results || [];
  
  return results
    .filter((item: any) => item.price && item.price > 0)
    .map((item: any) => ({
      ml_id: item.id,
      title: item.title,
      price: item.price,
      original_price: item.original_price || null,
      thumbnail: (item.thumbnail || "").replace("http://", "https://"),
      permalink: item.permalink,
      category_id: categoryId,
      category_name: categoryName,
      sold_quantity: item.sold_quantity || 0,
      condition: item.condition || null,
      free_shipping: item.shipping?.free_shipping || false,
    }));
}

export async function syncProducts(): Promise<{ total: number }> {
  const allProducts: MLProduct[] = [];
  
  // Fetch all categories in parallel from browser
  const promises = CATEGORIES.map((cat) => 
    fetchCategoryProducts(cat.id, cat.name)
  );
  
  const results = await Promise.allSettled(promises);
  
  for (const result of results) {
    if (result.status === "fulfilled") {
      allProducts.push(...result.value);
    }
  }
  
  if (allProducts.length === 0) {
    throw new Error("Nenhum produto encontrado na API do Mercado Livre");
  }
  
  // Send to edge function for upsert (uses service role key)
  const { data, error } = await supabase.functions.invoke("sync-ml-products", {
    body: { products: allProducts },
  });
  
  if (error) throw error;
  return { total: data?.total ?? 0 };
}
