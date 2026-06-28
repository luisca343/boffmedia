'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { X, ClipboardPaste, Check, Pencil, Eye, EyeOff, ChevronDown, ChevronRight, GripVertical } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useCalculatorStore, defaultPokemon } from '../../_store/calculatorStore'
import type { SavedEntry, CalcPokemon } from '../../_types/calculator'
import { pokesToPaste } from '../../_lib/pokesToPaste'
import { getSpriteUrl, handleSpriteError } from '../../_lib/spriteUtils'
import { parseShowdownPaste } from '@/features/vgc-tracker/showdown-parse'
import { useLegalPokemon, toId } from '../../_hooks/useLegalPokemon'
import { useGameData } from '../../_hooks/usePokemonData'

// ─── EntryCard ────────────────────────────────────────────────────────────────

function EntryCard({
  entry,
  useChampions,
  isDragging,
  isDropTarget,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  onLoadTeam,
  onLoadMany,
  onCopy,
  onDelete,
  onRename,
  copying,
}: {
  entry: SavedEntry
  useChampions: boolean
  isDragging: boolean
  isDropTarget: boolean
  onDragStart: () => void
  onDragEnd: () => void
  onDragOver: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent) => void
  onLoadTeam: () => void
  onLoadMany: () => void
  onCopy: () => void
  onDelete: () => void
  onRename: (name: string) => void
  copying: boolean
}) {
  const t = useTranslations('vgc.calc.saved')
  const [renaming, setRenaming] = useState(false)
  const [renameVal, setRenameVal] = useState(entry.name)
  const [expanded, setExpanded] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (renaming) inputRef.current?.focus()
  }, [renaming])

  function commitRename() {
    const trimmed = renameVal.trim()
    if (trimmed) onRename(trimmed)
    setRenaming(false)
  }

  const paste = useMemo(
    () => (expanded ? pokesToPaste(entry.pokeList, useChampions) : ''),
    [expanded, entry.pokeList, useChampions],
  )

  const dateLabel = new Date(entry.savedAt).toLocaleDateString(undefined, {
    month: 'short', day: 'numeric',
  })

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      onDrop={onDrop}
      className={`border rounded-lg overflow-hidden bg-layer-1/60 transition-all ${
        isDragging ? 'opacity-40' : ''
      } ${
        isDropTarget ? 'border-primary/60 ring-1 ring-primary/30' : 'border-edge/40'
      }`}
    >
      {/* Header row */}
      <div className="flex items-start gap-1.5 px-2.5 pt-2 pb-1.5">
        <GripVertical className="w-3 h-3 shrink-0 mt-0.5 text-ink-dim cursor-grab" />
        {renaming ? (
          <input
            ref={inputRef}
            value={renameVal}
            onChange={(e) => setRenameVal(e.target.value)}
            onBlur={commitRename}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitRename()
              if (e.key === 'Escape') { setRenameVal(entry.name); setRenaming(false) }
            }}
            className="flex-1 bg-layer-2 border border-edge rounded px-2 py-0.5 text-xs text-ink focus:outline-none focus:border-primary"
          />
        ) : (
          <span className="flex-1 text-xs font-bold text-ink leading-tight">{entry.name}</span>
        )}
        <span className="text-[9px] text-ink-dim shrink-0 mt-0.5">{dateLabel}</span>
      </div>

      {/* Sprite strip */}
      <div className="flex items-center gap-1 px-2.5 pb-1.5 flex-wrap">
        {entry.pokeList.map((p, i) => (
          <img
            key={i}
            src={getSpriteUrl(p.name)}
            onError={handleSpriteError}
            width={28} height={28}
            className="object-contain"
            style={{ imageRendering: 'pixelated' }}
            alt={p.name}
            title={p.name}
          />
        ))}
        <span className="text-[9px] text-ink-dim ml-auto">
          {t('pokemon', { count: entry.pokeList.length })}
        </span>
      </div>

      {/* Action row */}
      <div className="flex flex-wrap items-center gap-1 px-2.5 pb-2">
        <ActionBtn onClick={onLoadTeam} title={t('loadAsTeam')} color="orange" />
        <ActionBtn onClick={onLoadMany} title={t('loadAsThreats')} color="violet" />
        <span className="w-px h-3 bg-layer-3/50" />
        <button
          type="button"
          onClick={onCopy}
          className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-semibold border transition-all ${
            copying
              ? 'bg-green-500/15 border-green-500/35 text-green-400'
              : 'bg-layer-2/50 border-edge/50 text-ink-muted hover:text-ink'
          }`}
        >
          {copying ? <Check className="w-2.5 h-2.5" /> : <ClipboardPaste className="w-2.5 h-2.5" />}
          {copying ? t('copied') : t('copy')}
        </button>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-semibold border border-edge/50 bg-layer-2/50 text-ink-muted hover:text-ink transition-all"
        >
          {expanded ? <EyeOff className="w-2.5 h-2.5" /> : <Eye className="w-2.5 h-2.5" />}
          {t('view')}
        </button>
        <button
          type="button"
          onClick={() => { setRenaming(true); setRenameVal(entry.name) }}
          className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-semibold border border-edge/50 bg-layer-2/50 text-ink-muted hover:text-ink transition-all"
        >
          <Pencil className="w-2.5 h-2.5" />
          {t('rename')}
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-semibold border border-edge/50 bg-layer-2/50 text-ink-muted hover:text-red-400 hover:border-red-500/30 transition-all ml-auto"
        >
          <X className="w-2.5 h-2.5" />
          {t('delete')}
        </button>
      </div>

      {/* Paste preview */}
      {expanded && (
        <div className="px-2.5 pb-2.5">
          <pre className="text-[9px] font-mono text-ink-muted bg-base border border-edge/40 rounded p-2 whitespace-pre-wrap leading-relaxed max-h-40 overflow-y-auto">
            {paste}
          </pre>
        </div>
      )}
    </div>
  )
}

function ActionBtn({
  onClick, title, color,
}: { onClick: () => void; title: string; color: 'orange' | 'violet' }) {
  const cls = color === 'orange'
    ? 'bg-primary/10 border-primary/30 text-primary-hover hover:bg-primary/20'
    : 'bg-secondary/10 border-secondary/30 text-secondary-hover hover:bg-secondary/20'
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-1.5 py-0.5 rounded text-[9px] font-bold border transition-all ${cls}`}
    >
      {title}
    </button>
  )
}

// ─── SaveRow ──────────────────────────────────────────────────────────────────

function SaveRow({
  label,
  count,
  disabled,
  disabledTitle,
  onSave,
}: {
  label: string
  count: number
  disabled: boolean
  disabledTitle: string
  onSave: (name: string) => void
}) {
  const t = useTranslations('vgc.calc.saved')
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  function commit() {
    if (!name.trim()) return
    onSave(name.trim())
    setName('')
    setOpen(false)
  }

  return (
    <div>
      {!open ? (
        <button
          type="button"
          onClick={() => !disabled && setOpen(true)}
          disabled={disabled}
          title={disabled ? disabledTitle : undefined}
          className="w-full flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold text-ink-muted hover:text-primary-hover disabled:text-ink-dim disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight className="w-3 h-3" />
          {label}
          {count > 0 && (
            <span className="ml-auto text-[9px] text-ink-dim">{count}</span>
          )}
        </button>
      ) : (
        <div className="px-2.5 py-2 flex items-center gap-1.5">
          <ChevronDown className="w-3 h-3 text-primary-hover shrink-0" />
          <input
            ref={inputRef}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commit()
              if (e.key === 'Escape') { setOpen(false); setName('') }
            }}
            placeholder={t('namePlaceholder')}
            className="flex-1 min-w-0 bg-layer-2 border border-edge rounded px-2 py-1 text-xs text-ink placeholder:text-ink-dim focus:outline-none focus:border-primary"
          />
          <button
            type="button"
            onClick={commit}
            disabled={!name.trim()}
            className="px-2 py-1 rounded text-[10px] font-bold bg-primary/20 border border-primary/40 text-primary-hover hover:bg-primary/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all shrink-0"
          >
            {t('saveButton')}
          </button>
          <button
            type="button"
            onClick={() => { setOpen(false); setName('') }}
            className="text-ink-dim hover:text-ink shrink-0 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  )
}

// ─── ImportSection ────────────────────────────────────────────────────────────

function ImportSection({
  regulationId,
  onImport,
  onClose,
}: {
  regulationId: string
  onImport: (name: string, pokeList: CalcPokemon[]) => void
  onClose: () => void
}) {
  const t = useTranslations('vgc.calc.saved')
  const { moveMap, isLoaded } = useGameData(regulationId)
  const legalPokemon = useLegalPokemon(regulationId)
  const [text, setText] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')

  const preview = useMemo(() => (text.trim() ? parseShowdownPaste(text) : []), [text])

  function handleSave() {
    if (!text.trim() || !preview.length) { setError(t('importError')); return }
    if (!name.trim()) { setError(t('importNameRequired')); return }

    const pokeList: CalcPokemon[] = preview.slice(0, 12).map((slot) => {
      const match = legalPokemon.find((lp) => toId(lp.name) === toId(slot.speciesName))
      const speciesName = match?.name ?? slot.speciesName
      const firstAbility = match ? Object.values(match.abilities).filter(Boolean)[0] ?? '' : ''

      const moves = ([0, 1, 2, 3] as const).map((i) => {
        const moveName = slot.moves[i] ?? ''
        const data = moveMap.get(moveName)
        if (data) return { name: data.name, bp: data.basePower, type: data.type, category: data.category as 'Physical' | 'Special' | 'Status', crit: false }
        return { name: moveName, bp: 0, type: 'Normal', category: 'Physical' as const, crit: false }
      }) as CalcPokemon['moves']

      return {
        ...defaultPokemon(speciesName),
        ability: slot.ability ?? firstAbility,
        item: slot.item ?? 'None',
        nature: slot.nature ?? 'Hardy',
        moves,
      }
    }).filter((p) => !!p.name)

    onImport(name.trim(), pokeList)
    setText('')
    setName('')
    setError('')
    onClose()
  }

  return (
    <div className="bg-base/70 border-b border-edge/40 px-2.5 py-2.5 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-black uppercase tracking-wider text-ink-muted">
          {t('importTitle')}
        </span>
        <button type="button" onClick={onClose} className="text-ink-dim hover:text-ink transition-colors">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <textarea
        value={text}
        onChange={(e) => { setText(e.target.value); setError('') }}
        placeholder={t('importPlaceholder')}
        className="w-full h-28 bg-layer-1 border border-edge rounded px-2 py-1.5 text-[10px] font-mono text-ink placeholder:text-ink-dim focus:outline-none focus:border-primary resize-none"
      />

      <div className="flex items-center gap-1.5">
        <input
          value={name}
          onChange={(e) => { setName(e.target.value); setError('') }}
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          placeholder={t('importNamePlaceholder')}
          className="flex-1 min-w-0 bg-layer-1 border border-edge rounded px-2 py-1 text-[10px] text-ink placeholder:text-ink-dim focus:outline-none focus:border-primary"
        />
        <button
          type="button"
          onClick={handleSave}
          disabled={!preview.length || !name.trim() || !isLoaded}
          className="px-2 py-1 rounded text-[10px] font-bold bg-primary/20 border border-primary/40 text-primary-hover hover:bg-primary/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all shrink-0"
        >
          {t('importSave')}
        </button>
      </div>

      {error && <p className="text-[10px] text-red-400">{error}</p>}
      {!error && preview.length > 0 && (
        <p className="text-[10px] text-ink-dim">
          {preview.length} Pokémon {!isLoaded && '· ' + t('importLoading')}
        </p>
      )}
    </div>
  )
}

// ─── Main Panel ───────────────────────────────────────────────────────────────

export function SavedTeamsPanel({ onClose }: { onClose: () => void }) {
  const t = useTranslations('vgc.calc.saved')
  const {
    saved, team, many, regulation, useChampions,
    hydrateFromStorage, saveGroup, deleteSaved, renameSaved, reorderSaved,
    loadSavedAsTeam, loadSavedAsManyList,
  } = useCalculatorStore()

  const [importOpen, setImportOpen] = useState(false)
  const [copyingId, setCopyingId] = useState<number | null>(null)
  const [draggingId, setDraggingId] = useState<number | null>(null)
  const [overIdx, setOverIdx] = useState<number | null>(null)

  useEffect(() => {
    hydrateFromStorage()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Newest first for display; indices map back as: displayIdx → savedIdx = saved.length - 1 - displayIdx
  const displayedSaved = useMemo(() => [...saved].reverse(), [saved])

  function handleCopy(entry: SavedEntry) {
    const text = pokesToPaste(entry.pokeList, useChampions)
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        setCopyingId(entry.id)
        setTimeout(() => setCopyingId(null), 1500)
      })
    } else {
      window.prompt('Copy this paste:', text)
      setCopyingId(entry.id)
      setTimeout(() => setCopyingId(null), 1500)
    }
  }

  function handleDrop(e: React.DragEvent, toDisplayIdx: number) {
    e.preventDefault()
    if (draggingId === null) return
    const fromDisplayIdx = displayedSaved.findIndex((entry) => entry.id === draggingId)
    if (fromDisplayIdx === -1 || fromDisplayIdx === toDisplayIdx) return
    const len = saved.length
    reorderSaved(len - 1 - fromDisplayIdx, len - 1 - toDisplayIdx)
    setDraggingId(null)
    setOverIdx(null)
  }

  return (
    <div className="flex flex-col h-full bg-base">
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between px-3 py-2.5 border-b border-edge/40 bg-layer-1/90">
        <span className="text-[10px] font-black uppercase tracking-widest text-ink">
          {t('title')}
        </span>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setImportOpen((v) => !v)}
            className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-semibold border transition-all ${
              importOpen
                ? 'bg-primary/15 border-primary/35 text-primary-hover'
                : 'bg-layer-2/50 border-edge/50 text-ink-muted hover:text-ink'
            }`}
          >
            <ClipboardPaste className="w-3 h-3" />
            {t('importButton')}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="text-ink-dim hover:text-ink transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Import section */}
      {importOpen && (
        <ImportSection
          regulationId={regulation}
          onImport={(name, pokeList) => saveGroup(name, pokeList)}
          onClose={() => setImportOpen(false)}
        />
      )}

      {/* Save current team/many */}
      <div className="shrink-0 border-b border-edge/30">
        <SaveRow
          label={t('saveTeam')}
          count={team.length}
          disabled={team.length === 0}
          disabledTitle={t('noTeam')}
          onSave={(name) => saveGroup(name, team)}
        />
        <SaveRow
          label={t('saveThreats')}
          count={many.length}
          disabled={many.length === 0}
          disabledTitle={t('noThreats')}
          onSave={(name) => saveGroup(name, many)}
        />
      </div>

      {/* Saved entries */}
      <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-2">
        {saved.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-12 px-4 text-center">
            <div className="text-3xl opacity-20">💾</div>
            <p className="text-[11px] font-semibold text-ink-muted">{t('empty')}</p>
            <p className="text-[10px] text-ink-dim leading-relaxed">
              Save your team or paste a set using the buttons above.
            </p>
          </div>
        ) : (
          displayedSaved.map((entry, displayIdx) => (
            <EntryCard
              key={entry.id}
              entry={entry}
              useChampions={useChampions}
              isDragging={draggingId === entry.id}
              isDropTarget={overIdx === displayIdx && draggingId !== entry.id}
              onDragStart={() => setDraggingId(entry.id)}
              onDragEnd={() => { setDraggingId(null); setOverIdx(null) }}
              onDragOver={(e) => { e.preventDefault(); setOverIdx(displayIdx) }}
              onDrop={(e) => handleDrop(e, displayIdx)}
              onLoadTeam={() => loadSavedAsTeam(entry.id)}
              onLoadMany={() => loadSavedAsManyList(entry.id)}
              onCopy={() => handleCopy(entry)}
              onDelete={() => deleteSaved(entry.id)}
              onRename={(name) => renameSaved(entry.id, name)}
              copying={copyingId === entry.id}
            />
          ))
        )}
      </div>
    </div>
  )
}
