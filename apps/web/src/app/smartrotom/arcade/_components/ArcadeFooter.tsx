interface ArcadeFooterProps {
    title: string;
    version?: string;
    description?: string;
    showPixelDecoration?: boolean;
  }
  
  export default function ArcadeFooter({
    title,
    version = "1.0",
    description,
    showPixelDecoration = true
  }: ArcadeFooterProps) {
    return (
      <div className="bg-indigo-950/80 rounded-lg border border-indigo-800 p-2 text-center mt-4">
        <p className="text-cyan-400 font-bold">
          {title} v{version} • Arcade Edition
        </p>
        {description && (
          <p className="text-surface-400 text-xs mt-1">
            {description}
          </p>
        )}
        
        {showPixelDecoration && (
          <div className="flex justify-center gap-6 mt-2">
            {['bg-red-500', 'bg-secondary-500', 'bg-yellow-500', 'bg-highlight-500', 'bg-accent-500'].map((color, index) => (
              <div key={index} className={`h-3 w-3 ${color}`}></div>
            ))}
          </div>
        )}
      </div>
    );
  }