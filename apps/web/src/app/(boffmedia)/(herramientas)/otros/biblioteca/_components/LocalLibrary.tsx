'use client';

import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/primitives/card';
import { Button } from '@/components/ui/primitives/button';
import { Badge } from '@/components/ui/primitives/badge';
import { Input } from '@/components/ui/primitives/input';
import {
  RefreshCw, Loader2, HardDrive, Download, Search, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { ScrapeService, LocalGameEntry, LocalGamesResult } from '@/services/api/boffmedia/scrapeService';
import { FloatingSection } from '@/app/(boffmedia)/_components/layout/FloatingSection';
import { CONSOLES } from './consoles';
import { ConsolePicker } from './ConsolePicker';
import { RegionFilter } from './RegionFilter';

// ─── Constants ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 50;

// ─── Game table ───────────────────────────────────────────────────────────────

function GameTable({ files, consoleKey }: { files: LocalGameEntry[]; consoleKey: string }) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? files.filter(f => f.filename.toLowerCase().includes(q)) : files;
  }, [files, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const handleSearch = (v: string) => { setSearch(v); setPage(0); };

  return (
    <div className="flex flex-col gap-4">
      {/* Search + stats */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-surface-500" />
          <Input
            value={search}
            onChange={e => handleSearch(e.target.value)}
            placeholder="Buscar juego..."
            className="pl-8 h-8 bg-surface-800/60 border-surface-600 text-surface-100 placeholder-surface-400 text-sm"
          />
        </div>
        <div className="flex items-center gap-2 text-sm text-surface-400">
          <span>{filtered.length} archivo{filtered.length !== 1 ? 's' : ''}</span>
          {search && filtered.length !== files.length && (
            <Badge className="bg-surface-700/40 text-surface-300 border-surface-600/40">
              de {files.length}
            </Badge>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-surface-700/50 overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-2 bg-surface-800/80 border-b border-surface-700/50">
          <span className="text-xs font-medium text-surface-400 uppercase tracking-wide flex-1">Nombre</span>
          <span className="text-xs font-medium text-surface-400 uppercase tracking-wide w-24 text-right">Tamaño</span>
          <span className="w-24" />
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
                key={file.filename}
                className="flex items-center gap-3 px-4 py-2.5 hover:bg-surface-700/20 transition-colors duration-100"
              >
                <span className="flex-1 text-sm text-surface-200 truncate" title={file.filename}>
                  {file.filename}
                </span>
                <span className="text-xs text-surface-400 w-24 text-right shrink-0">{file.size}</span>
                <div className="w-24 flex justify-end shrink-0">
                  <a
                    href={ScrapeService.getServeFileUrl(consoleKey, file.filename)}
                    download={file.filename}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-primary-600/20 border border-primary-600/40 text-primary-300 hover:bg-primary-600/30 hover:text-primary-200 transition-colors"
                  >
                    <Download className="h-3 w-3" />
                    Descargar
                  </a>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-surface-400">
          <span>Pág. {page + 1} / {totalPages}</span>
          <div className="flex gap-1">
            <Button size="icon" variant="ghost" disabled={page === 0} onClick={() => setPage(p => p - 1)}
              className="h-8 w-8 text-surface-400 hover:text-surface-100 hover:bg-surface-700">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="ghost" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}
              className="h-8 w-8 text-surface-400 hover:text-surface-100 hover:bg-surface-700">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function LocalLibrary() {
  const [selectedConsole, setSelectedConsole] = useState<string | null>(null);
  const [regions, setRegions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [library, setLibrary] = useState<LocalGamesResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const addRegion    = useCallback((r: string) => setRegions(prev => [...prev, r]), []);
  const removeRegion = useCallback((r: string) => setRegions(prev => prev.filter(x => x !== r)), []);

  const handleConsoleSelect = (key: string) => {
    setSelectedConsole(key);
    setLibrary(null);
    setError(null);
  };

  const loadLibrary = async () => {
    if (!selectedConsole) return;
    setLoading(true);
    setError(null);
    try {
      const res = await ScrapeService.getLocalGames(selectedConsole, regions);
      if (!res.success || !res.data) throw new Error(res.error ?? 'Error al cargar la biblioteca');
      setLibrary(res.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <FloatingSection className="min-h-screen pb-20">
      <div className="container mx-auto px-4 py-10 max-w-4xl flex flex-col gap-8">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold text-surface-50">
            Biblioteca{' '}
            <span className="bg-gradient-to-r from-primary-400 to-primary-600 bg-clip-text text-transparent">Local</span>
          </h1>
          <p className="text-surface-400 mt-1 text-sm">
            Explora los juegos descargados en el servidor y descárgalos a tu dispositivo.
          </p>
        </motion.div>

        {/* 1. Console picker */}
        <Card className="bg-surface-800/40 border-surface-700/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-surface-200">1. Selecciona una consola</CardTitle>
          </CardHeader>
          <CardContent>
            <ConsolePicker selected={selectedConsole} onSelect={handleConsoleSelect} />
          </CardContent>
        </Card>

        {/* 2. Region filter + load */}
        <AnimatePresence>
          {selectedConsole && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
              <Card className="bg-surface-800/40 border-surface-700/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base text-surface-200">
                    2. Filtra por región <span className="text-surface-500 font-normal text-sm">(opcional)</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <RegionFilter regions={regions} onAdd={addRegion} onRemove={removeRegion} />
                  <div className="flex items-center gap-3 pt-1 border-t border-surface-700/40">
                    <div className="text-sm text-surface-400">
                      Consola: <span className="text-primary-300 font-medium">{CONSOLES[selectedConsole]?.label}</span>
                    </div>
                    {regions.length > 0 && (
                      <div className="text-sm text-surface-400">
                        · Regiones: <span className="text-surface-200">{regions.join(', ')}</span>
                      </div>
                    )}
                    <Button onClick={loadLibrary} disabled={loading} className="ml-auto bg-primary-600 hover:bg-primary-500 text-white">
                      {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                      {library ? 'Recargar' : 'Cargar biblioteca'}
                    </Button>
                  </div>
                  {error && (
                    <p className="text-sm text-red-400 bg-red-900/20 border border-red-800/40 rounded-md px-3 py-2">{error}</p>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 3. Library */}
        <AnimatePresence>
          {library && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <Card className="bg-surface-800/40 border-surface-700/50">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <CardTitle className="text-base text-surface-200">3. Biblioteca</CardTitle>
                    <div className="flex items-center gap-3 text-sm text-surface-400">
                      <span className="flex items-center gap-1.5">
                        <HardDrive className="h-3.5 w-3.5 text-green-400" />
                        <span className="text-green-300">{library.count} archivo{library.count !== 1 ? 's' : ''}</span>
                      </span>
                      <span>·</span>
                      <span>{library.totalSize}</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {library.count === 0 ? (
                    <p className="text-surface-500 text-sm py-4 text-center">
                      No hay juegos descargados para esta consola{regions.length > 0 ? ' con los filtros seleccionados' : ''}.
                    </p>
                  ) : (
                    <GameTable files={library.files} consoleKey={selectedConsole!} />
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </FloatingSection>
  );
}
