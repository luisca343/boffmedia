interface DecorativeDividerProps {
  colorClaro: string;
  colorMedio: string;
  style?: 'simple' | 'ornate';
}

export function DecorativeDivider({ colorClaro, colorMedio, style = 'ornate' }: DecorativeDividerProps) {
  if (style === 'simple') {
    return (
      <div className="flex justify-center py-3">
        <div className="w-16 h-0.5 rounded-full" style={{ backgroundColor: colorMedio }} />
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center space-x-3 py-3">
      <div className="w-8 h-0.5 rounded-full" style={{ backgroundColor: colorMedio }} />
      <div 
        className="w-3 h-3 rounded-full border-2 bg-white dark:bg-slate-800" 
        style={{ borderColor: colorClaro }} 
      />
      <div className="w-8 h-0.5 rounded-full" style={{ backgroundColor: colorMedio }} />
    </div>
  );
}
