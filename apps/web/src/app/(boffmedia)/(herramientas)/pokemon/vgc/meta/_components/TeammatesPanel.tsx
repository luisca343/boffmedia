import { cn } from "@/lib/utils";
import { spriteUrl, handleSpriteError } from "@/features/vgc-tracker/types";

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
    <div className="rounded-xl border border-surface-800 bg-surface-950 p-4">
      <h3 className="text-[11px] font-semibold uppercase tracking-wider text-surface-300 mb-3">
        {title}
      </h3>
      <div className="space-y-1">
        {items.map((item, i) => (
          <button
            key={i}
            onClick={onSelect ? () => onSelect(nameToId(item.name)) : undefined}
            disabled={!onSelect}
            className={cn(
              "w-full flex items-center gap-2 py-0.5 -mx-1 px-1 rounded",
              onSelect
                ? "hover:bg-surface-800/60 transition-colors cursor-pointer"
                : "cursor-default"
            )}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
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
            <span className="text-xs text-surface-300 tabular-nums font-mono shrink-0 w-12 text-right">
              {item.percent.toFixed(1)}%
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
