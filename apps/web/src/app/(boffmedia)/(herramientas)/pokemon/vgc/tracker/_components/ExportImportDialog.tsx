'use client';

import { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Download, Upload, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import {
  downloadJson,
  exportAll,
  exportSession,
  importData,
  parseExportFile,
  type ImportResult,
} from '@/features/vgc-tracker/utils/exportImport';
import { useTrackerSync } from '@/features/vgc-tracker/context/TrackerSyncContext';

interface Props {
  sessionId?: string;
  sessionLabel?: string;
  onImportDone: () => void;
  onClose: () => void;
}

export function ExportImportDialog({ sessionId, sessionLabel, onImportDone, onClose }: Props) {
  const t = useTranslations('vgc.tracker');
  const { pushChange } = useTrackerSync();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [importError, setImportError] = useState('');

  const handleExportSession = async () => {
    if (!sessionId) return;
    setBusy(true);
    try {
      const data = await exportSession(sessionId);
      const label = sessionLabel?.replace(/[^a-z0-9]/gi, '_') ?? 'session';
      downloadJson(data, `vgc_session_${label}.json`);
    } finally {
      setBusy(false);
    }
  };

  const handleExportAll = async () => {
    setBusy(true);
    try {
      const data = await exportAll();
      downloadJson(data, `vgc_tracker_backup_${new Date().toISOString().slice(0, 10)}.json`);
    } finally {
      setBusy(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setBusy(true);
    setImportError('');
    setResult(null);
    try {
      const text = await file.text();
      const data = parseExportFile(text);
      const res = await importData(data, (table, id, entity) => {
        pushChange(table, id, entity);
      });
      setResult(res);
      onImportDone();
    } catch {
      setImportError(t('exportImport.importError'));
    } finally {
      setBusy(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-layer-1 border border-edge rounded-xl w-full max-w-sm mx-4 shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-edge">
          <h2 className="font-semibold text-ink">{t('exportImport.title')}</h2>
          <button onClick={onClose} className="text-ink-muted hover:text-ink transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-4 flex flex-col gap-3">
          {/* Export */}
          <div className="flex flex-col gap-2">
            {sessionId && (
              <button
                onClick={handleExportSession}
                disabled={busy}
                className="flex items-center gap-2 w-full px-3 py-2.5 rounded-lg bg-layer-2 border border-edge hover:border-edge text-ink text-sm transition-colors disabled:opacity-50"
              >
                <Download size={15} className="text-primary-hover shrink-0" />
                <span>{t('exportImport.exportSession')}</span>
                {sessionLabel && <span className="text-ink-muted truncate">— {sessionLabel}</span>}
              </button>
            )}
            <button
              onClick={handleExportAll}
              disabled={busy}
              className="flex items-center gap-2 w-full px-3 py-2.5 rounded-lg bg-layer-2 border border-edge hover:border-edge text-ink text-sm transition-colors disabled:opacity-50"
            >
              <Download size={15} className="text-primary-hover shrink-0" />
              <span>{t('exportImport.exportAll')}</span>
            </button>
          </div>

          <div className="border-t border-edge" />

          {/* Import */}
          <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={handleFileChange} />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={busy}
            className="flex items-center gap-2 w-full px-3 py-2.5 rounded-lg bg-layer-2 border border-edge hover:border-edge text-ink text-sm transition-colors disabled:opacity-50"
          >
            <Upload size={15} className="text-amber-400 shrink-0" />
            <div className="text-left">
              <span className="block">{t('exportImport.importFile')}</span>
              <span className="text-ink-muted text-xs">{t('exportImport.importHint')}</span>
            </div>
          </button>

          {result && (
            <p className="text-green-400 text-xs text-center">
              {t('exportImport.importSuccess', { sessions: result.sessions, matches: result.matches })}
            </p>
          )}
          {importError && <p className="text-red-400 text-xs text-center">{importError}</p>}
        </div>
      </div>
    </div>,
    document.body,
  );
}
