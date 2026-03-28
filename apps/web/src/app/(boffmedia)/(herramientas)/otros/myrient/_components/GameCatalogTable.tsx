'use client';

import { useState, useMemo } from 'react';
import { Checkbox } from '@/components/ui/primitives/checkbox';
import { Input } from '@/components/ui/primitives/input';
import { Button } from '@/components/ui/primitives/button';
import { Badge } from '@/components/ui/primitives/badge';
import { Search, ChevronLeft, ChevronRight, CheckSquare, Square } from 'lucide-react';
import { GameFileEntry } from '@/services/api/boffmedia/scrapeService';

const PAGE_SIZE = 50;

interface GameCatalogTableProps {
  files: GameFileEntry[];
  selected: Set<string>;
  onToggle: (name: string) => void;
  onSelectAll: (names: string[]) => void;
  onClearAll: () => void;
}

export default function GameCatalogTable({
  files,
  selected,
  onToggle,
  onSelectAll,
  onClearAll,
}: GameCatalogTableProps) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return files;
    return files.filter(f => f.name.toLowerCase().includes(q));
  }, [files, search]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const pageNames = paginated.map(f => f.name);
  const allPageSelected = pageNames.length > 0 && pageNames.every(n => selected.has(n));
  const somePageSelected = pageNames.some(n => selected.has(n));

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(0);
  };

  const togglePage = () => {
    if (allPageSelected) {
      // deselect all on this page
      const next = new Set(selected);
      pageNames.forEach(n => next.delete(n));
      onSelectAll([...next]);
    } else {
      onSelectAll([...selected, ...pageNames]);
    }
  };

  const handleSelectAllFiltered = () => {
    onSelectAll([...selected, ...filtered.map(f => f.name)]);
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Search + bulk controls */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-400" />
          <Input
            value={search}
            onChange={e => handleSearchChange(e.target.value)}
            placeholder="Buscar juego..."
            className="pl-9 bg-surface-800/60 border-surface-600 text-surface-100 placeholder-surface-400"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {search && filtered.length !== files.length && (
            <Button
              size="sm"
              variant="outline"
              className="border-surface-600 text-surface-300 hover:bg-surface-700"
              onClick={handleSelectAllFiltered}
            >
              <CheckSquare className="h-4 w-4 mr-1" />
              Sel. {filtered.length} resultado{filtered.length !== 1 ? 's' : ''}
            </Button>
          )}
          {selected.size > 0 && (
            <Button
              size="sm"
              variant="outline"
              className="border-surface-600 text-surface-400 hover:bg-surface-700"
              onClick={onClearAll}
            >
              <Square className="h-4 w-4 mr-1" />
              Limpiar ({selected.size})
            </Button>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-3 text-sm text-surface-400">
        <span>{filtered.length} juego{filtered.length !== 1 ? 's' : ''} encontrado{filtered.length !== 1 ? 's' : ''}</span>
        {selected.size > 0 && (
          <Badge className="bg-primary-600/20 text-primary-300 border-primary-600/40">
            {selected.size} seleccionado{selected.size !== 1 ? 's' : ''}
          </Badge>
        )}
      </div>

      {/* Table */}
      <div className="rounded-lg border border-surface-700/50 overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-2 bg-surface-800/80 border-b border-surface-700/50">
          <Checkbox
            checked={allPageSelected}
            onCheckedChange={togglePage}
            className="border-surface-500 data-[state=checked]:bg-primary-600 data-[state=checked]:border-primary-600"
            aria-label="Seleccionar página"
          />
          <span className="text-xs font-medium text-surface-400 uppercase tracking-wide flex-1">
            Nombre
          </span>
          <span className="text-xs font-medium text-surface-400 uppercase tracking-wide w-24 text-right">
            Tamaño
          </span>
        </div>

        {/* Rows */}
        <div className="divide-y divide-surface-700/30">
          {paginated.length === 0 ? (
            <div className="px-4 py-8 text-center text-surface-500">
              No se encontraron juegos con ese término.
            </div>
          ) : (
            paginated.map(file => (
              <div
                key={file.name}
                onClick={() => onToggle(file.name)}
                className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors duration-100
                  ${selected.has(file.name)
                    ? 'bg-primary-900/20 hover:bg-primary-900/30'
                    : 'hover:bg-surface-700/30'
                  }`}
              >
                <Checkbox
                  checked={selected.has(file.name)}
                  onCheckedChange={() => onToggle(file.name)}
                  onClick={e => e.stopPropagation()}
                  className="border-surface-500 data-[state=checked]:bg-primary-600 data-[state=checked]:border-primary-600 shrink-0"
                />
                <span className="flex-1 text-sm text-surface-200 truncate" title={file.name}>
                  {file.name}
                </span>
                <span className="text-xs text-surface-400 w-24 text-right shrink-0">
                  {file.size}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-surface-400">
          <span>
            Pág. {page + 1} / {totalPages}
          </span>
          <div className="flex gap-1">
            <Button
              size="icon"
              variant="ghost"
              disabled={page === 0}
              onClick={() => setPage(p => p - 1)}
              className="h-8 w-8 text-surface-400 hover:text-surface-100 hover:bg-surface-700"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              disabled={page >= totalPages - 1}
              onClick={() => setPage(p => p + 1)}
              className="h-8 w-8 text-surface-400 hover:text-surface-100 hover:bg-surface-700"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
