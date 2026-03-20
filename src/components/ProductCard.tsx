import { ExternalLink, Truck } from "lucide-react";

interface ProductCardProps {
  title: string;
  price: number;
  originalPrice: number | null;
  thumbnail: string | null;
  permalink: string;
  soldQuantity: number | null;
  freeShipping: boolean | null;
}

export default function ProductCard({
  title,
  price,
  originalPrice,
  thumbnail,
  permalink,
  soldQuantity,
  freeShipping,
}: ProductCardProps) {
  const discount =
    originalPrice && originalPrice > price
      ? Math.round(((originalPrice - price) / originalPrice) * 100)
      : null;

  return (
    <a
      href={permalink}
      target="_blank"
      rel="noopener noreferrer"
      className="group block rounded-lg bg-card overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200"
    >
      <div className="relative aspect-square bg-white flex items-center justify-center p-2">
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
        {discount && (
          <span className="absolute top-1.5 left-1.5 bg-green-600 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded">
            -{discount}%
          </span>
        )}
      </div>

      <div className="p-3 space-y-1.5">
        <h3 className="text-xs font-medium leading-snug text-foreground line-clamp-2 min-h-[2.25rem]">
          {title}
        </h3>

        <div className="space-y-0.5">
          {originalPrice && originalPrice > price && (
            <p className="text-[10px] text-muted-foreground line-through">
              R$ {originalPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
          )}
          <p className="text-sm font-bold text-foreground">
            R$ {price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </p>
        </div>

        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
          {freeShipping && (
            <span className="flex items-center gap-0.5 text-green-600 font-medium">
              <Truck className="w-3 h-3" />
              Frete grátis
            </span>
          )}
          {soldQuantity != null && soldQuantity > 0 && (
            <span>{soldQuantity.toLocaleString("pt-BR")} vendidos</span>
          )}
        </div>

        <div className="flex items-center gap-1 text-[10px] text-primary font-medium pt-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <ExternalLink className="w-3 h-3" />
          Ver no Mercado Livre
        </div>
      </div>
    </a>
  );
}
