import { MangaResult } from '@/services/api/boffmedia/mangaService';
import { Badge } from '@/components/ui/primitives/badge';
import { BookOpen } from 'lucide-react';

interface MangaCardProps {
  manga: MangaResult;
  onClick: () => void;
}

export function MangaCard({ manga, onClick }: MangaCardProps) {
  return (
    <button
      onClick={onClick}
      className="group flex flex-col rounded-lg border border-edge/50 bg-layer-2/40 overflow-hidden hover:border-primary-active/60 hover:bg-layer-2/70 transition-all duration-150 text-left w-full"
    >
      {/* Cover */}
      <div className="relative w-full aspect-[3/4] bg-layer-1 overflow-hidden">
        {manga.coverUrl ? (
           
          <img
            src={manga.coverUrl}
            alt={manga.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <BookOpen className="h-10 w-10 text-ink-dim" />
          </div>
        )}
        {/* Source badge */}
        <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded text-[10px] font-medium bg-layer-1/80 text-ink-muted border border-edge/60 backdrop-blur-sm">
          {manga.source}
        </span>
      </div>

      {/* Info */}
      <div className="flex flex-col gap-1.5 p-3 flex-1">
        <p className="text-sm font-semibold text-ink line-clamp-2 leading-snug">{manga.title}</p>

        {manga.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-auto pt-1">
            {manga.tags.slice(0, 3).map(tag => (
              <Badge key={tag} className="text-[10px] px-1.5 py-0 bg-layer-3/60 text-ink-muted border-edge/40">
                {tag}
              </Badge>
            ))}
            {manga.tags.length > 3 && (
              <span className="text-[10px] text-ink-muted">+{manga.tags.length - 3}</span>
            )}
          </div>
        )}
      </div>
    </button>
  );
}
