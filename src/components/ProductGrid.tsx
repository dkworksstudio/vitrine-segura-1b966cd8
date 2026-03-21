import ProductCard from "./ProductCard";
import type { Product } from "@/hooks/useProducts";

interface ProductGridProps {
  products: Product[];
  isLoading: boolean;
}

export default function ProductGrid({ products, isLoading }: ProductGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="rounded-xl bg-card animate-pulse border border-border">
            <div className="aspect-square bg-muted rounded-t-xl" />
            <div className="p-3 space-y-2">
              <div className="h-3 bg-muted rounded w-1/3" />
              <div className="h-3 bg-muted rounded w-full" />
              <div className="h-3 bg-muted rounded w-2/3" />
              <div className="h-5 bg-muted rounded w-1/2" />
              <div className="h-8 bg-muted rounded w-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!products.length) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <p className="text-sm">Nenhum produto encontrado nesta categoria.</p>
        <p className="text-xs mt-1">Tente sincronizar os produtos.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
      {products.map((product, i) => (
        <ProductCard
          key={product.id}
          title={product.title}
          price={product.price}
          originalPrice={product.original_price}
          thumbnail={product.thumbnail}
          permalink={product.permalink}
          soldQuantity={product.sold_quantity}
          freeShipping={product.free_shipping}
          featured={i === 0}
        />
      ))}
    </div>
  );
}
