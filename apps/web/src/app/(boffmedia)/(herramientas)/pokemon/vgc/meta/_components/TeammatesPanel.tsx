import { cn } from "@/lib/utils";
import { spriteUrl, handleSpriteError } from "@/features/vgc-tracker/types";
import { Card, CardContent } from "@/components/ui/primitives/card";
import { ToolSectionHeader } from "@/components/boffmedia-old/tools/ToolSectionHeader";

interface TeammateEntry {
  name:    string;
  percent: number;
}

interface Props {
  title:     string;
  items:     TeammateEntry[];
  onSelect?: (speciesId: string) => void;
}

function nameToId(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function TeammatesPanel({ title, items, onSelect }: Props) {
  return (
    <Card className="hover:shadow-sm">
      <CardContent className="p-4">
        <ToolSectionHeader label={title} color="neutral" compact />
        <div className="space-y-0">
          {items.map((item, i) => (
            <button
              key={i}
              onClick={onSelect ? () => onSelect(nameToId(item.name)) : undefined}
              disabled={!onSelect}
              className={cn(
                "w-full flex items-center gap-2 py-1 -mx-1 px-1 rounded border-b border-surface-700/30 last:border-b-0",
                onSelect
                  ? "hover:bg-surface-700/40 transition-colors cursor-pointer"
                  : "cursor-default"
              )}
            >
              { }
              <img
                src={spriteUrl(item.name)}
                alt={item.name}
                width={32}
                height={32}
                className="object-contain shrink-0"
                onError={handleSpriteError}
              />
              <span className="flex-1 text-xs text-surface-200 truncate min-w-0 text-left">
                {item.name}
              </span>
              <span className="text-xs text-surface-400 tabular-nums font-mono shrink-0 w-14 text-right">
                {item.percent.toFixed(2)}%
              </span>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
