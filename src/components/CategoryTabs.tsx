import * as Tabs from "@radix-ui/react-tabs";
import { CATEGORIES } from "@/hooks/useProducts";

interface CategoryTabsProps {
  selected: string;
  onSelect: (categoryId: string) => void;
}

export default function CategoryTabs({ selected, onSelect }: CategoryTabsProps) {
  return (
    <Tabs.Root value={selected} onValueChange={onSelect}>
      <Tabs.List className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
        <Tabs.Trigger
          value="all"
          className="whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium transition-colors data-[state=active]:bg-primary data-[state=active]:text-primary-foreground bg-secondary text-secondary-foreground hover:bg-secondary/80"
        >
          Todos
        </Tabs.Trigger>
        {CATEGORIES.map((cat) => (
          <Tabs.Trigger
            key={cat.id}
            value={cat.id}
            className="whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium transition-colors data-[state=active]:bg-primary data-[state=active]:text-primary-foreground bg-secondary text-secondary-foreground hover:bg-secondary/80"
          >
            {cat.name}
          </Tabs.Trigger>
        ))}
      </Tabs.List>
    </Tabs.Root>
  );
}
