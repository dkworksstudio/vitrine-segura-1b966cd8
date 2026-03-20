import ProductCard from "./ProductCard";
import type { Product } from "@/hooks/useProducts";

interface ProductGridProps {
  products: Product[];
  isLoading: boolean;
}

export default function ProductGrid({ products, isLoading }: ProductGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="rounded-lg bg-card animate-pulse">
            <div className="aspect-square bg-muted rounded-t-lg" />
            <div className="p-3 space-y-2">
              <div className="h-3 bg-muted rounded w-full" />
              <div className="h-3 bg-muted rounded w-2/3" />
              <div className="h-4 bg-muted rounded w-1/2" />
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
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          title={product.title}
          price={product.price}
          originalPrice={product.original_price}
          thumbnail={product.thumbnail}
          permalink={product.permalink}
          soldQuantity={product.sold_quantity}
          freeShipping={product.free_shipping}
        />
      ))}
    </div>
  );
}
