import * as Tabs from "@radix-ui/react-tabs";
import { CATEGORIES } from "@/hooks/useProducts";
import { Home, Smartphone, Sparkles, Headphones, Shirt, Baby, Car, Dumbbell } from "lucide-react";

const iconMap: Record<string, any> = {
  MLB1132: Home,
  MLB1055: Smartphone,
  MLB1246: Sparkles,
  MLB1648: Headphones,
  MLB1574: Dumbbell,
  MLB1276: Car,
};

interface CategoryTabsProps {
  selected: string;
  onSelect: (categoryId: string) => void;
}

export default function CategoryTabs({ selected, onSelect }: CategoryTabsProps) {
  return (
    <Tabs.Root value={selected} onValueChange={onSelect}>
      <Tabs.List className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide justify-center flex-wrap">
        <Tabs.Trigger
          value="all"
          className="flex items-center gap-1.5 whitespace-nowrap px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wide transition-colors data-[state=active]:bg-primary data-[state=active]:text-primary-foreground bg-secondary text-secondary-foreground hover:bg-secondary/80"
        >
          🏠 Todos
        </Tabs.Trigger>
        {CATEGORIES.map((cat) => {
          const Icon = iconMap[cat.id] || Shirt;
          return (
            <Tabs.Trigger
              key={cat.id}
              value={cat.id}
              className="flex items-center gap-1.5 whitespace-nowrap px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wide transition-colors data-[state=active]:bg-primary data-[state=active]:text-primary-foreground bg-secondary text-secondary-foreground hover:bg-secondary/80"
            >
              <Icon className="w-3.5 h-3.5" />
              {cat.name.split(" ")[0]}
            </Tabs.Trigger>
          );
        })}
      </Tabs.List>
    </Tabs.Root>
  );
}
