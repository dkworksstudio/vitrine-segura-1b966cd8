import { supabase } from "@/integrations/supabase/client";

export async function syncProducts(): Promise<{ total: number }> {
  const { data, error } = await supabase.functions.invoke("sync-ml-products", {
    body: {},
  });

  if (error) throw error;
  if (!data?.success) throw new Error(data?.error || "Erro desconhecido");
  return { total: Number(data.total ?? 0) };
}
