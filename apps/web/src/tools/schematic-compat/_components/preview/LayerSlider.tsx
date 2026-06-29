"use client";

interface LayerSliderProps {
  value: number;
  max: number;
  onChange: (y: number) => void;
}

export function LayerSlider({ value, max, onChange }: LayerSliderProps) {
  return (
    <div className="flex shrink-0 items-center gap-2.5 border-t border-edge/40 px-3 py-2">
      <span className="w-3 shrink-0 text-center text-[11px] font-medium text-ink-muted">Y</span>
      <input
        type="range"
        min={0}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1.5 flex-1 cursor-pointer accent-accent"
      />
      <span className="w-14 shrink-0 text-right font-mono text-[11px] tabular-nums text-ink-muted">
        {value}/{max}
      </span>
    </div>
  );
}
