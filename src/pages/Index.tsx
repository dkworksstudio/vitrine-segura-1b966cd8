import { useState } from "react";
import { useProducts } from "@/hooks/useProducts";
import ProductGrid from "@/components/ProductGrid";
import CategoryTabs from "@/components/CategoryTabs";
import { RefreshCw, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export default function Index() {
  const [category, setCategory] = useState("all");
  const [syncing, setSyncing] = useState(false);

  const { data: products = [], isLoading, refetch } = useProducts(
    category === "all" ? undefined : category
  );

  const handleSync = async () => {
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke("sync-ml-products");
      if (error) throw error;
      toast.success(`Sincronização concluída: ${data?.total ?? 0} produtos atualizados`);
      refetch();
    } catch (err: any) {
      toast.error("Erro ao sincronizar: " + (err.message || "tente novamente"));
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-primary" />
            <h1 className="text-lg font-bold text-foreground">Vitrine Segura</h1>
          </div>
          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors active:scale-[0.97]"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "Sincronizando..." : "Sincronizar"}
          </button>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-card border-b">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <h2 className="text-2xl font-bold text-foreground text-wrap-balance">
            Melhores ofertas do Mercado Livre
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Produtos mais vendidos, atualizados automaticamente.
          </p>
        </div>
      </section>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 py-6 space-y-4">
        <CategoryTabs selected={category} onSelect={setCategory} />
        <ProductGrid products={products} isLoading={isLoading} />
      </main>

      {/* Footer */}
      <footer className="border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 py-6 text-center text-xs text-muted-foreground">
          Vitrine Segura · Dados obtidos via API pública do Mercado Livre
        </div>
      </footer>
    </div>
  );
}
