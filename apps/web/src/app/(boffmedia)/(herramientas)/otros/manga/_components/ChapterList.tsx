import { MangaChapter } from '@/services/api/boffmedia/mangaService';
import { Checkbox } from '@/components/ui/primitives/checkbox';
import { Badge } from '@/components/ui/primitives/badge';
import { CheckSquare, HardDrive, Square } from 'lucide-react';

interface ChapterListProps {
  chapters: MangaChapter[];
  selected: Set<string>;          // selected chapter URLs
  localFiles: Set<string>;        // filenames already on disk
  onToggle: (url: string) => void;
  onSelectAll: () => void;
  onSelectMissing: () => void;
  onClearAll: () => void;
  /** Derives a CBZ filename for a chapter for local matching. */
  toFilename: (chapter: MangaChapter) => string;
}

export function ChapterList({
  chapters,
  selected,
  localFiles,
  onToggle,
  onSelectAll,
  onSelectMissing,
  onClearAll,
  toFilename,
}: ChapterListProps) {
  const allSelected = chapters.length > 0 && chapters.every(c => selected.has(c.url));

  return (
    <div className="flex flex-col gap-3">
      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap text-xs text-ink-muted">
        <button
          onClick={allSelected ? onClearAll : onSelectAll}
          className="flex items-center gap-1.5 hover:text-ink transition-colors"
        >
          {allSelected
            ? <><Square className="h-3.5 w-3.5" /> Deseleccionar todos</>
            : <><CheckSquare className="h-3.5 w-3.5" /> Seleccionar todos ({chapters.length})</>
          }
        </button>
        <span className="text-ink-dim">·</span>
        <button onClick={onSelectMissing} className="flex items-center gap-1.5 hover:text-ink transition-colors">
          <HardDrive className="h-3.5 w-3.5" /> Solo faltantes
        </button>
        {selected.size > 0 && (
          <>
            <span className="text-ink-dim">·</span>
            <button onClick={onClearAll} className="hover:text-red-400 transition-colors">
              Limpiar ({selected.size})
            </button>
          </>
        )}
      </div>

      {/* Chapter rows */}
      <div className="rounded-lg border border-edge/50 divide-y divide-edge/30 max-h-[420px] overflow-y-auto">
        {chapters.map(chapter => {
          const isSelected  = selected.has(chapter.url);
          const isLocal     = localFiles.has(toFilename(chapter));
          return (
            <div
              key={chapter.url}
              onClick={() => onToggle(chapter.url)}
              className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors duration-100 select-none
                ${isSelected
                  ? 'bg-primary-soft/20 hover:bg-primary-soft/30'
                  : isLocal
                    ? 'bg-green-900/10 hover:bg-green-900/20'
                    : 'hover:bg-layer-3/20'
                }`}
            >
              <Checkbox
                checked={isSelected}
                onCheckedChange={() => onToggle(chapter.url)}
                onClick={e => e.stopPropagation()}
                className="border-edge data-[state=checked]:bg-primary-active data-[state=checked]:border-primary-active shrink-0"
              />
              <span
                className={`flex-1 text-sm truncate ${isLocal ? 'text-green-300' : 'text-ink'}`}
                title={chapter.title}
              >
                {chapter.title}
              </span>
              {isLocal && (
                <span title="Ya descargado">
                  <HardDrive className="h-3.5 w-3.5 text-green-500/70 shrink-0" />
                </span>
              )}
              <Badge className="bg-layer-3/40 text-ink-muted border-edge/40 text-[10px] shrink-0">
                #{chapter.number}
              </Badge>
            </div>
          );
        })}
      </div>
    </div>
  );
}
