import { Star, Truck, ShieldCheck, ExternalLink } from "lucide-react";

const badges = [
  { icon: Star, label: "4.5+ Estrelas" },
  { icon: Truck, label: "Envio Full" },
  { icon: ShieldCheck, label: "Compra Segura" },
  { icon: ExternalLink, label: "Link Oficial" },
];

export default function TrustBadges() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-3xl mx-auto">
      {badges.map((b) => (
        <div
          key={b.label}
          className="flex flex-col items-center gap-1.5 bg-foreground/10 backdrop-blur rounded-lg px-4 py-3"
        >
          <b.icon className="w-5 h-5 text-primary" />
          <span className="text-xs font-semibold uppercase tracking-wide text-foreground">
            {b.label}
          </span>
        </div>
      ))}
    </div>
  );
}
