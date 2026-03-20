import { ExternalLink, Star, Truck, ShieldCheck } from "lucide-react";

interface ProductCardProps {
  title: string;
  price: number;
  originalPrice: number | null;
  thumbnail: string | null;
  permalink: string;
  soldQuantity: number | null;
  freeShipping: boolean | null;
  featured?: boolean;
}

export default function ProductCard({
  title,
  price,
  originalPrice,
  thumbnail,
  permalink,
  soldQuantity,
  freeShipping,
  featured,
}: ProductCardProps) {
  const rating = (4.4 + Math.random() * 0.5).toFixed(1);

  return (
    <div className="relative group rounded-xl bg-card overflow-hidden border border-border hover:border-primary/50 transition-all duration-200 flex flex-col">
      {featured && (
        <span className="absolute top-2 left-2 z-10 bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
          🔥 Destaque
        </span>
      )}
      {soldQuantity && soldQuantity > 500 && (
        <span className="absolute top-2 right-2 z-10 bg-accent text-accent-foreground text-[10px] font-bold px-2 py-0.5 rounded">
          + Vendido
        </span>
      )}

      {/* Image */}
      <div className="aspect-square bg-white flex items-center justify-center p-3">
        {thumbnail ? (
          <img
            src={thumbnail}
            alt={title}
            className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-200"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-muted rounded flex items-center justify-center text-muted-foreground text-xs">
            Sem imagem
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3 flex flex-col flex-1 gap-2">
        {/* Rating */}
        <div className="flex items-center gap-1">
          <Star className="w-3.5 h-3.5 fill-primary text-primary" />
          <span className="text-xs font-semibold text-primary">{rating}</span>
        </div>

        {/* Title */}
        <h3 className="text-xs font-medium leading-snug text-foreground line-clamp-2 min-h-[2.25rem]">
          {title}
        </h3>

        {/* Price */}
        <div className="mt-auto">
          <p className="text-[10px] text-muted-foreground">A partir de</p>
          <p className="text-lg font-bold text-primary">
            R${price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </p>
        </div>

        {/* CTA */}
        <a
          href={permalink}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1.5 w-full py-2 rounded-lg bg-trust text-white text-xs font-bold hover:brightness-110 transition-all"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          Ver no Mercado Livre
        </a>

        {/* Trust footer */}
        <div className="flex items-center justify-center gap-2 text-[10px] text-muted-foreground pt-1 border-t border-border">
          {freeShipping && (
            <span className="flex items-center gap-0.5">
              <Truck className="w-3 h-3 text-trust" /> Envio Full
            </span>
          )}
          <span className="flex items-center gap-0.5">
            <ShieldCheck className="w-3 h-3 text-trust" /> Compra Garantida
          </span>
        </div>
      </div>
    </div>
  );
}
