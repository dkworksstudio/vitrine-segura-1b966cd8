import { useState, useEffect } from "react";
import { Flame } from "lucide-react";

export default function UrgencyBanner() {
  const [seconds, setSeconds] = useState(() => {
    const now = new Date();
    const end = new Date(now);
    end.setHours(end.getHours() + 2, 0, 0, 0);
    return Math.max(0, Math.floor((end.getTime() - now.getTime()) / 1000));
  });

  const [count] = useState(() => Math.floor(Math.random() * 30) + 20);

  useEffect(() => {
    const t = setInterval(() => setSeconds((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, []);

  const h = String(Math.floor(seconds / 3600)).padStart(2, "0");
  const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
  const s = String(seconds % 60).padStart(2, "0");

  return (
    <div className="bg-accent text-accent-foreground py-3 px-4">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-center gap-3 text-sm font-bold">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 bg-accent-foreground rounded-full animate-pulse" />
          LOTE DE OFERTAS EXPIRA EM:
        </span>
        <span className="font-mono bg-accent-foreground/20 px-3 py-1 rounded text-base">
          {h}h {m}m {s}s
        </span>
        <span className="flex items-center gap-1 bg-accent-foreground/20 px-3 py-1 rounded text-xs">
          <Flame className="w-3.5 h-3.5" />
          {count} pessoas garantiram descontos agora
        </span>
      </div>
    </div>
  );
}
