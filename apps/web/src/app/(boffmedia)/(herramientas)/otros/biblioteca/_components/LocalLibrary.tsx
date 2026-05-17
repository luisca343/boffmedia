'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/primitives/card';
import { Button } from '@/components/ui/primitives/button';
import { Badge } from '@/components/ui/primitives/badge';
import { Input } from '@/components/ui/primitives/input';
import { Search, Loader2, Download, HardDrive, ChevronDown, ChevronUp } from 'lucide-react';
import {
  ScrapeService,
  SearchConsoleResult,
  SearchLocalGamesResult,
} from '@/services/api/boffmedia/scrapeService';
import { FloatingSection } from '@/app/(boffmedia)/_components/layout/FloatingSection';
import { CONSOLES, MANUFACTURER_COLORS } from '../../_components/consoles';
import { ConsolePicker } from '../../_components/ConsolePicker';
import { RegionFilter } from '../../_components/RegionFilter';

// ─── Console result group ─────────────────────────────────────────────────────

function ConsoleGroup({ result }: { result: SearchConsoleResult }) {
  const [expanded, setExpanded] = useState(true);
  const info = CONSOLES[result.consoleKey];
  const color = info ? MANUFACTURER_COLORS[info.manufacturer] : 'text-surface-400';

  return (
    <div className="rounded-lg border border-surface-700/50 overflow-hidden">
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center gap-3 px-4 py-3 bg-surface-800/60 hover:bg-surface-800/80 transition-colors text-left"
      >
        <span className={`text-sm font-semibold ${color}`}>{result.consoleLabel}</span>
        <Badge className="bg-surface-700/40 text-surface-300 border-surface-600/40 ml-auto mr-2 shrink-0">
          {result.count} archivo{result.count !== 1 ? 's' : ''}
        </Badge>
        {expanded
          ? <ChevronUp className="h-4 w-4 text-surface-500 shrink-0" />
          : <ChevronDown className="h-4 w-4 text-surface-500 shrink-0" />
        }
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="divide-y divide-surface-700/30">
              {result.files.map(file => (
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
                      href={ScrapeService.getServeFileUrl(result.consoleKey, file.filename)}
                      download={file.filename}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-primary-600/20 border border-primary-600/40 text-primary-300 hover:bg-primary-600/30 hover:text-primary-200 transition-colors"
                    >
                      <Download className="h-3 w-3" />
                      Descargar
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function LocalLibrary() {
  const [selectedConsole, setSelectedConsole] = useState<string | null>(null);
  const [regions, setRegions] = useState<string[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchLocalGamesResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const addRegion    = useCallback((r: string) => setRegions(prev => [...prev, r]), []);
  const removeRegion = useCallback((r: string) => setRegions(prev => prev.filter(x => x !== r)), []);

  // Toggle: clicking the active console deselects it (→ search all)
  const handleConsoleSelect = (key: string) => {
    setSelectedConsole(prev => (prev === key ? null : key));
    setResults(null);
  };

  const handleSearch = async () => {
    setLoading(true);
    setError(null);
    try {
      let data: SearchLocalGamesResult;

      if (selectedConsole) {
        // Single console: load all files, filter by query client-side
        const res = await ScrapeService.getLocalGames(selectedConsole, regions);
        if (!res.success || !res.data) throw new Error(res.error ?? 'Error al cargar la biblioteca');
        const q = query.trim().toLowerCase();
        const files = q
          ? res.data.files.filter(f => f.filename.toLowerCase().includes(q))
          : res.data.files;
        data = {
          query: query.trim(),
          totalCount: files.length,
          consoles: files.length > 0
            ? [{ consoleKey: selectedConsole, consoleLabel: res.data.consoleLabel, count: files.length, files }]
            : [],
        };
      } else {
        // No console selected: search across all
        const res = await ScrapeService.searchLocalGames(query.trim(), regions);
        if (!res.success || !res.data) throw new Error(res.error ?? 'Error al buscar');
        data = res.data;
      }

      setResults(data);
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

        {/* Search form */}
        <Card className="bg-surface-800/40 border-surface-700/50">
          <CardContent className="pt-5 flex flex-col gap-5">

            {/* Query + button */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-500" />
                <Input
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  placeholder='Ej: "Pokémon", "Mario"… o vacío para ver todo'
                  className="pl-9 bg-surface-800/60 border-surface-600 text-surface-100 placeholder-surface-400"
                />
              </div>
              <Button
                onClick={handleSearch}
                disabled={loading}
                className="bg-primary-600 hover:bg-primary-500 text-white shrink-0"
              >
                {loading
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : <Search className="h-4 w-4" />
                }
                <span className="ml-2">Buscar</span>
              </Button>
            </div>

            {/* Console picker */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-surface-400 uppercase tracking-wide">Consola</span>
                {selectedConsole
                  ? <Badge className="bg-primary-600/20 text-primary-300 border-primary-600/40 text-xs">
                      {CONSOLES[selectedConsole]?.shortLabel ?? selectedConsole}
                    </Badge>
                  : <span className="text-xs text-surface-500">ninguna seleccionada = todas las plataformas</span>
                }
              </div>
              <ConsolePicker selected={selectedConsole} onSelect={handleConsoleSelect} compact />
            </div>

            {/* Region filter */}
            <div className="flex flex-col gap-2 pt-1 border-t border-surface-700/40">
              <span className="text-xs font-medium text-surface-400 uppercase tracking-wide">
                Región <span className="normal-case font-normal text-surface-500">(opcional)</span>
              </span>
              <RegionFilter regions={regions} onAdd={addRegion} onRemove={removeRegion} />
            </div>

            {error && (
              <p className="text-sm text-red-400 bg-red-900/20 border border-red-800/40 rounded-md px-3 py-2">{error}</p>
            )}
          </CardContent>
        </Card>

        {/* Results */}
        <AnimatePresence>
          {results && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-col gap-4"
            >
              <div className="flex items-center justify-between flex-wrap gap-2">
                <p className="text-sm text-surface-300">
                  {results.query
                    ? <>Resultados para <span className="text-primary-300 font-medium">&ldquo;{results.query}&rdquo;</span></>
                    : <span>Todos los juegos</span>
                  }
                  {selectedConsole && (
                    <> · <span className="text-surface-400">{CONSOLES[selectedConsole]?.label}</span></>
                  )}
                </p>
                <div className="flex items-center gap-3 text-sm text-surface-400">
                  <span className="flex items-center gap-1.5">
                    <HardDrive className="h-3.5 w-3.5 text-green-400" />
                    <span className="text-green-300">
                      {results.totalCount} archivo{results.totalCount !== 1 ? 's' : ''}
                    </span>
                  </span>
                  {!selectedConsole && (
                    <>
                      <span>·</span>
                      <span>{results.consoles.length} consola{results.consoles.length !== 1 ? 's' : ''}</span>
                    </>
                  )}
                </div>
              </div>

              {results.totalCount === 0 ? (
                <p className="text-surface-500 text-sm py-8 text-center">
                  No se encontraron juegos
                  {results.query ? ` para "${results.query}"` : ''}
                  {regions.length > 0 ? ' con los filtros de región seleccionados' : ''}.
                </p>
              ) : (
                <div className="flex flex-col gap-3">
                  {results.consoles.map(c => (
                    <ConsoleGroup key={c.consoleKey} result={c} />
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </FloatingSection>
  );
}
