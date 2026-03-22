import { supabase } from "@/integrations/supabase/client";

export async function syncProducts(): Promise<{ total: number }> {
  const { data, error } = await supabase.functions.invoke("sync-ml-products");

  if (error) throw error;
  if (!data?.success) throw new Error(data?.error || "Erro desconhecido");
  return { total: data.total ?? 0 };
}
