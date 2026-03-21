import { useState } from "react";
import { useProducts } from "@/hooks/useProducts";
import ProductGrid from "@/components/ProductGrid";
import CategoryTabs from "@/components/CategoryTabs";
import TrustBadges from "@/components/TrustBadges";
import UrgencyBanner from "@/components/UrgencyBanner";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import logoVitrine from "@/assets/logo-vitrine-segura.png";
import logoDk from "@/assets/logo-dk-works.png";

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
      {/* Hero */}
      <header className="relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 pt-10 pb-8 text-center space-y-6">
          {/* Logo area */}
          <img src={logoVitrine} alt="Vitrine Segura" className="h-24 md:h-32 mx-auto" />

          {/* Title */}
          <div>
            <h2 className="text-2xl md:text-4xl font-black italic text-foreground uppercase">
              Achadinhos <span className="text-primary">Úteis</span>
            </h2>
            <p className="text-sm text-muted-foreground mt-2">
              Os melhores produtos do Mercado Livre hoje
            </p>
          </div>

          {/* Trust Badges */}
          <TrustBadges />

          {/* Sync button */}
          <button
            onClick={handleSync}
            disabled={syncing}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-primary text-primary-foreground hover:brightness-110 disabled:opacity-50 transition-all active:scale-[0.97]"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "Sincronizando..." : "Sincronizar Produtos"}
          </button>
        </div>
      </header>

      {/* Category Tabs */}
      <section className="max-w-7xl mx-auto px-4 py-4">
        <CategoryTabs selected={category} onSelect={setCategory} />
      </section>

      {/* Urgency Banner */}
      <UrgencyBanner />

      {/* Products */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <ProductGrid products={products} isLoading={isLoading} />
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-8">
        <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col items-center gap-4 text-center text-xs text-muted-foreground">
          <p>Vitrine Segura · Dados obtidos via API pública do Mercado Livre</p>
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-2">
              <span>Desenvolvido por</span>
              <img src={logoDk} alt="DK Works Studio" className="h-6" />
            </div>
            <div className="flex items-center gap-3 text-[10px]">
              <a href="https://wa.me/5549989232307" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                📱 (49) 98923-2307
              </a>
              <span>·</span>
              <a href="https://dkworksstudio.base44.app/" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                🌐 dkworksstudio.base44.app
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
