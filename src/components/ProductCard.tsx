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
    <div className="relative group rounded-lg bg-card overflow-hidden border border-border hover:border-primary/50 transition-all duration-200 flex flex-col">
      {featured && (
        <span className="absolute top-1 left-1 z-10 bg-primary text-primary-foreground text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase">
          🔥 Destaque
        </span>
      )}
      {soldQuantity && soldQuantity > 500 && (
        <span className="absolute top-1 right-1 z-10 bg-accent text-accent-foreground text-[8px] font-bold px-1.5 py-0.5 rounded">
          + Vendido
        </span>
      )}

      {/* Image */}
      <div className="aspect-square bg-white flex items-center justify-center p-1.5">
        {thumbnail ? (
          <img
            src={thumbnail}
            alt={title}
            className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-200"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-muted rounded flex items-center justify-center text-muted-foreground text-[10px]">
            Sem imagem
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-2 flex flex-col flex-1 gap-1">
        {/* Rating */}
        <div className="flex items-center gap-0.5">
          <Star className="w-3 h-3 fill-primary text-primary" />
          <span className="text-[10px] font-semibold text-primary">{rating}</span>
        </div>

        {/* Title */}
        <h3 className="text-[10px] font-medium leading-tight text-foreground line-clamp-2 min-h-[1.8rem]">
          {title}
        </h3>

        {/* Price */}
        <div className="mt-auto">
          <p className="text-[8px] text-muted-foreground">A partir de</p>
          <p className="text-sm font-bold text-primary">
            R${price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </p>
        </div>

        {/* CTA */}
        <a
          href={`${permalink}${permalink.includes('?') ? '&' : '?'}matt_tool=7566231704682871&matt_word=&matt_source=vitrine-segura`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1 w-full py-1.5 rounded-md bg-trust text-white text-[10px] font-bold hover:brightness-110 transition-all"
        >
          <ExternalLink className="w-3 h-3" />
          Ver no Mercado Livre
        </a>

        {/* Trust footer */}
        <div className="flex items-center justify-center gap-1.5 text-[8px] text-muted-foreground pt-1 border-t border-border">
          {freeShipping && (
            <span className="flex items-center gap-0.5">
              <Truck className="w-2.5 h-2.5 text-trust" /> Envio Full
            </span>
          )}
          <span className="flex items-center gap-0.5">
            <ShieldCheck className="w-2.5 h-2.5 text-trust" /> Compra Garantida
          </span>
        </div>
      </div>
    </div>
  );
}
