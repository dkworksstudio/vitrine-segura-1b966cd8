import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Product {
  id: string;
  ml_id: string;
  title: string;
  price: number;
  original_price: number | null;
  thumbnail: string | null;
  permalink: string;
  category_id: string;
  category_name: string;
  sold_quantity: number | null;
  condition: string | null;
  free_shipping: boolean | null;
  synced_at: string;
}

export const CATEGORIES = [
  { id: "MLB1055", name: "Celulares e Telefones" },
  { id: "MLB1648", name: "Informática" },
  { id: "MLB1574", name: "Eletrodomésticos" },
  { id: "MLB1246", name: "Beleza e Cuidado Pessoal" },
  { id: "MLB1276", name: "Esportes e Fitness" },
  { id: "MLB1132", name: "Casa e Decoração" },
];

export function useProducts(categoryId?: string) {
  return useQuery({
    queryKey: ["products", categoryId],
    queryFn: async () => {
      let query = supabase
        .from("products")
        .select("*")
        .order("sold_quantity", { ascending: false });

      if (categoryId) {
        query = query.eq("category_id", categoryId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Product[];
    },
  });
}
