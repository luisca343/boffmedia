import { Card, CardContent } from "@/components/ui/primitives/card";
import { ToolSectionHeader } from "@/components/boffmedia-old/tools/ToolSectionHeader";

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
    <Card className="hover:shadow-sm">
      <CardContent className="p-4">
        <ToolSectionHeader label={title} color="neutral" compact />
        <div className="space-y-0">
          {displayed.map((item, i) => (
            <div key={i} className="flex items-center gap-2 py-1 border-b border-surface-700/30 last:border-b-0">
              <span className="flex-1 text-xs text-surface-200 truncate min-w-0">
                {item.name}
              </span>
              <span className="text-xs text-surface-400 tabular-nums font-mono shrink-0 w-14 text-right">
                {item.percent.toFixed(2)}%
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
