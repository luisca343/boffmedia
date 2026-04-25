'use client';

import { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, Copy, Download, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { spriteUrl, handleSpriteError } from '@/features/vgc-tracker/types';

/** Sprite URL routed through the Next.js proxy — same-origin, no CORS needed. */
function proxySpriteUrl(speciesName: string): string {
  const name = speciesName.toLowerCase().replace(/[^a-z0-9\- ]/g, '').replace(/\s+/g, '-');
  return `/api/sprite?name=${encodeURIComponent(name)}`;
}
import { buildShareUrl, type RecapSummary } from '@/features/vgc-tracker/utils/recapShare';

interface Props {
  summary: RecapSummary;
  onClose: () => void;
}

export function RecapModal({ summary, onClose }: Props) {
  const t = useTranslations('vgc.tracker.recap');
  const cardRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const winRate =
    summary.w + summary.l > 0
      ? Math.round((summary.w / (summary.w + summary.l)) * 100)
      : null;

  const eloDelta =
    summary.curElo !== undefined && summary.startElo !== undefined
      ? summary.curElo - summary.startElo
      : null;

  const handleCopyLink = async () => {
    const url = buildShareUrl(summary, window.location.origin);
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = async () => {
    if (!cardRef.current) return;
    setDownloading(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#03050f',
        scale: 2,
        logging: false,
      });
      const link = document.createElement('a');
      link.download = `vgc_recap_${summary.label.replace(/[^a-z0-9]/gi, '_')}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } finally {
      setDownloading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-surface-900 border border-surface-700 rounded-xl w-full max-w-md mx-4 shadow-2xl">
        {/* Dialog header */}
        <div className="flex items-center justify-between p-4 border-b border-surface-700">
          <h2 className="font-semibold text-surface-50">{t('title')}</h2>
          <button onClick={onClose} className="text-surface-400 hover:text-surface-50 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Recap card (this is what gets captured) */}
        <div className="p-4">
          <div
            ref={cardRef}
            className="rounded-xl bg-surface-950 border border-surface-800 p-5 space-y-4"
          >
            {/* Title row */}
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-surface-50 font-bold text-lg leading-tight">{summary.label}</p>
                <p className="text-surface-500 text-xs mt-0.5">
                  {summary.format} · {summary.reg}
                  {summary.type === 'tournament' && (
                    <span className="ml-1.5 text-amber-400">Tournament</span>
                  )}
                </p>
              </div>
              {winRate !== null && (
                <div className={`text-2xl font-bold tabular-nums ${winRate >= 50 ? 'text-green-400' : 'text-red-400'}`}>
                  {winRate}%
                </div>
              )}
            </div>

            {/* Record */}
            <div className="flex items-center gap-4">
              <RecapStat value={summary.w} label="W" color="text-green-400" />
              <RecapStat value={summary.l} label="L" color="text-red-400" />
              {summary.d > 0 && <RecapStat value={summary.d} label="D" color="text-yellow-400" />}
              {summary.type === 'ladder' && summary.curElo !== undefined && (
                <div className="ml-auto text-right">
                  <p className="text-surface-50 font-bold tabular-nums">
                    {summary.curElo}
                    {eloDelta !== null && (
                      <span className={`text-sm ml-1 ${eloDelta >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {eloDelta >= 0 ? '+' : ''}{Number(eloDelta.toFixed(1))}
                      </span>
                    )}
                  </p>
                  <p className="text-surface-600 text-[10px]">ELO</p>
                </div>
              )}
            </div>

            {/* Pokémon sprites */}
            {summary.pkmn.length > 0 && (
              <div className="flex items-center gap-1 pt-1 border-t border-surface-800">
                {summary.pkmn.map((name) => (
                  <img
                    key={name}
                    src={proxySpriteUrl(name)}
                    alt={name}
                    title={name}
                    className="w-10 h-10 object-contain"
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 p-4 pt-0">
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-surface-800 hover:bg-surface-700 text-surface-200 text-sm transition-colors disabled:opacity-50"
          >
            <Download size={14} />
            {downloading ? t('downloading') : t('downloadImage')}
          </button>
          <button
            onClick={handleCopyLink}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-primary-600 hover:bg-primary-500 text-white text-sm font-medium transition-colors"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? t('copied') : t('copyLink')}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function RecapStat({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div className="text-center">
      <p className={`text-2xl font-bold tabular-nums ${color}`}>{value}</p>
      <p className="text-surface-600 text-[10px]">{label}</p>
    </div>
  );
}
