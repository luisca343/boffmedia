interface StatPanelItem {
  name:    string;
  percent: number;
}

interface StatPanelProps {
  title:     string;
  items:     StatPanelItem[];
  maxItems?: number;
}

export function StatPanel({ title, items, maxItems = 10 }: StatPanelProps) {
  const displayed = items.slice(0, maxItems);

  return (
    <div className="rounded-xl border border-surface-800 bg-surface-950 p-4">
      <h3 className="text-[11px] font-semibold uppercase tracking-wider text-surface-300 mb-3">
        {title}
      </h3>
      <div className="space-y-1">
        {displayed.map((item, i) => (
          <div key={i} className="flex items-center gap-2 py-0.5">
            <span className="flex-1 text-xs text-surface-200 truncate min-w-0">
              {item.name}
            </span>
            <span className="text-xs text-surface-300 tabular-nums font-mono shrink-0 w-12 text-right">
              {item.percent.toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
