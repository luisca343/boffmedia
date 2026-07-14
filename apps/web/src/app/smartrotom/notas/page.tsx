"use client";

import { useCallback, useEffect, useMemo, useState, type MouseEvent } from "react";
import { useNotesData } from "./_hooks/useNotesData";
import { useNoteContents } from "./_hooks/useNoteContents";
import { useNotesTheme } from "./_hooks/useNotesTheme";
import { descendants } from "./_utils/tree";
import { DocumentsService } from "@/services/api/smartrotom/documentsService";
import { toast, ToastHost, ContextMenu, type MenuState } from "./_components/ui";
import { TopNav } from "./_components/TopNav";
import { Sidebar } from "./_components/Sidebar";
import { NoteList } from "./_components/NoteList";
import { EditorColumn } from "./_components/EditorColumn";
import { CommandPalette, type Command } from "./_components/overlays/CommandPalette";
import { QuickCapture } from "./_components/overlays/QuickCapture";
import { TemplatePicker } from "./_components/overlays/TemplatePicker";
import { TagPicker } from "./_components/overlays/TagPicker";
import { ShareDialog } from "./_components/overlays/ShareDialog";
import { VersionHistory } from "./_components/overlays/VersionHistory";
import { GraphView } from "./_components/overlays/GraphView";
import { TweaksPanel } from "./_components/overlays/TweaksPanel";
import type { NoteVM, View, SortKey, ModalKind } from "./_types";

export default function NotesPage() {
  const { notes, trash, folders, tags, actions } = useNotesData();
  const { contentById, cacheContent } = useNoteContents(notes);
  const theme = useNotesTheme();

  const [view, setView] = useState<View>({ type: "smart", id: "all" });
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("updated");
  const [tabs, setTabs] = useState<number[]>([]);
  const [activeTab, setActiveTab] = useState<number | null>(null);
  const [splitId, setSplitId] = useState<number | null>(null);
  const [showCtx, setShowCtx] = useState(true);
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});
  const [railOpen, setRailOpen] = useState(false);
  const [modal, setModal] = useState<ModalKind | null>(null);
  const [modalNote, setModalNote] = useState<NoteVM | null>(null);
  const [menu, setMenu] = useState<MenuState | null>(null);
  const [tagPick, setTagPick] = useState<{ note: NoteVM; x: number; y: number } | null>(null);
  const [dropTarget, setDropTarget] = useState<number | null>(null);

  const allNotes = view.type === "trash" ? trash : notes;
  const noteById = useMemo(() => new Map(allNotes.map((n) => [n.id, n])), [allNotes]);
  const tabNotes = tabs.map((id) => notes.find((n) => n.id === id)).filter(Boolean) as NoteVM[];
  const active = activeTab != null ? notes.find((n) => n.id === activeTab) ?? null : null;
  const splitNote = splitId != null ? notes.find((n) => n.id === splitId) ?? null : null;

  const viewNotes = useMemo(() => {
    let arr = view.type === "trash" ? trash : notes.slice();
    if (view.type === "folder") {
      const set = descendants(folders, Number(view.id));
      arr = arr.filter((n) => n.folderId != null && set.has(n.folderId));
    } else if (view.type === "tag") {
      arr = arr.filter((n) => n.tags.includes(Number(view.id)));
    } else if (view.id === "pinned") {
      arr = arr.filter((n) => n.pinned);
    } else if (view.id === "shared") {
      arr = arr.filter((n) => n.sharedWith.length);
    } else if (view.id === "recent") {
      arr = arr.slice().sort((a, b) => b.updatedMs - a.updatedMs).slice(0, 8);
    }
    if (search) {
      const q = search.toLowerCase();
      arr = arr.filter((n) => n.title.toLowerCase().includes(q));
    }
    const s = arr.slice();
    if (sort === "updated" || view.id === "recent") s.sort((a, b) => b.updatedMs - a.updatedMs);
    else if (sort === "created") s.sort((a, b) => b.createdMs - a.createdMs);
    else if (sort === "title") s.sort((a, b) => a.title.localeCompare(b.title));
    if (view.id !== "recent") s.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));
    return s;
  }, [notes, trash, view, search, sort, folders]);

  // ---- open / tabs ----
  const openNote = useCallback((id: number, intoSplit?: boolean) => {
    if (intoSplit) {
      setSplitId(id);
      return;
    }
    setTabs((t) => (t.includes(id) ? t : [...t, id]));
    setActiveTab(id);
    setRailOpen(false);
  }, []);

  const closeTab = useCallback(
    (id: number) => {
      setTabs((t) => {
        const nt = t.filter((x) => x !== id);
        if (activeTab === id) setActiveTab(nt[nt.length - 1] ?? null);
        return nt;
      });
      if (splitId === id) setSplitId(null);
    },
    [activeTab, splitId],
  );

  const newNote = useCallback(async () => {
    const id = await actions.newNote({
      folderId: view.type === "folder" ? Number(view.id) : null,
    });
    if (id != null) openNote(id);
    toast("Nota creada");
  }, [actions, view, openNote]);

  const openTitle = useCallback(
    async (title: string) => {
      const found = notes.find((n) => n.title === title);
      if (found) openNote(found.id);
      else {
        const id = await actions.newNote({ title, content: `<h1>${title}</h1><p><br></p>` });
        if (id != null) openNote(id);
      }
    },
    [notes, actions, openNote],
  );

  // Creating from the link picker must not steal the writer's cursor, so the new
  // note is created in the background instead of being opened like `openTitle` does.
  const createLinked = useCallback(
    async (title: string) => {
      const id = await actions.newNote({ title, content: `<h1>${title}</h1><p><br></p>` });
      if (id != null) toast(`Nota «${title}» creada`);
    },
    [actions],
  );

  // ---- pane handlers ----
  const onCommit = useCallback(
    (id: number, html: string, title: string) => {
      cacheContent(id, html);
      actions.saveNote(id, { content: html, title });
    },
    [actions, cacheContent],
  );

  const noteMenu = useCallback(
    (n: NoteVM, e: MouseEvent) => {
      setMenu({
        x: e.clientX,
        y: e.clientY,
        items: [
          { icon: "file-text", label: "Abrir", onClick: () => openNote(n.id) },
          { icon: "split", label: "Abrir en panel dividido", onClick: () => setSplitId(n.id) },
          { sep: true },
          {
            icon: "pin",
            label: n.pinned ? "Desanclar" : "Anclar",
            onClick: () => actions.setPinned(n.id, !n.pinned),
          },
          { icon: "share", label: "Compartir", onClick: () => { setModalNote(n); setModal("share"); } },
          {
            icon: "copy",
            label: "Duplicar",
            onClick: async () => {
              const res = await DocumentsService.getDocument(n.id);
              // Falling back to an empty template here would duplicate the note with its
              // body silently dropped, so a failed read must abort the copy outright.
              if (!res.success || !res.data) {
                toast(res.userMessage ?? "No se pudo leer la nota para duplicarla", "error");
                return;
              }
              await actions.newNote({
                title: `${n.title} (copia)`,
                content: res.data.content ?? `<h1>${n.title}</h1><p><br></p>`,
              });
            },
          },
          { sep: true },
          view.type === "trash"
            ? { icon: "history", label: "Restaurar", onClick: () => actions.restoreNote(n.id) }
            : {
                icon: "trash",
                label: "Eliminar",
                danger: true,
                onClick: () => {
                  actions.deleteNote(n.id);
                  closeTab(n.id);
                  toast("Movida a la papelera", "warn");
                },
              },
        ],
      });
    },
    [actions, openNote, closeTab, view.type],
  );

  const paneHandlers = {
    onCommit,
    onTogglePin: (n: NoteVM) => actions.setPinned(n.id, !n.pinned),
    onShare: (n: NoteVM) => { setModalNote(n); setModal("share"); },
    onHistory: (n: NoteVM) => { setModalNote(n); setModal("history"); },
    onMore: noteMenu,
    onOpenTitle: openTitle,
    onCreateLinked: createLinked,
    onAddTag: (n: NoteVM, e: MouseEvent) => setTagPick({ note: n, x: e.clientX, y: e.clientY }),
    onRemoveTag: (id: number, tagId: number) => actions.toggleTag(id, tagId),
  };

  // ---- commands ----
  const commands: Command[] = [
    { id: "new", label: "Nueva nota", icon: "plus", kbd: "⌘N", run: newNote },
    { id: "qc", label: "Captura rápida", icon: "zap", kbd: "⌘⇧N", run: () => setModal("qc") },
    { id: "tpl", label: "Nueva desde plantilla", icon: "layers", run: () => setModal("templates") },
    { id: "split", label: "Vista dividida", icon: "split", kbd: "⌘\\", run: () => activeTab && setSplitId(activeTab) },
    { id: "graph", label: "Abrir grafo de conocimiento", icon: "network", run: () => setModal("graph") },
    {
      id: "theme",
      label: "Cambiar tema claro / oscuro",
      icon: theme.theme === "dark" ? "sun" : "moon",
      run: theme.toggleTheme,
    },
    { id: "pin", label: "Anclar / desanclar nota actual", icon: "pin", run: () => active && actions.setPinned(active.id, !active.pinned) },
  ];

  // ---- keyboard ----
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setModal((m) => (m === "cmdk" ? null : "cmdk"));
      } else if (mod && e.shiftKey && e.key.toLowerCase() === "n") {
        e.preventDefault();
        setModal("qc");
      } else if (mod && e.key.toLowerCase() === "n") {
        e.preventDefault();
        void newNote();
      } else if (mod && e.key === "\\") {
        e.preventDefault();
        setSplitId((s) => (s ? null : activeTab));
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [newNote, activeTab]);

  const liveNotes = notes; // for palette / graph / backlinks

  return (
    <div
      className="nt-app flex h-[calc(100dvh_-_3rem)] w-full min-w-0 flex-col overflow-hidden bg-nt-bg font-nt text-nt-fg"
      data-theme={theme.theme}
      style={theme.accentStyle}
    >
      <TopNav
        activeTitle={active?.title ?? null}
        onMenu={() => setRailOpen((o) => !o)}
        onSearch={() => setModal("cmdk")}
        onGraph={() => setModal("graph")}
        onTemplates={() => setModal("templates")}
      />

      <div className="relative flex min-h-0 flex-1">
        {railOpen && (
          <div
            className="fixed inset-x-0 bottom-0 top-12 z-[55] bg-black/50 md:hidden"
            onClick={() => setRailOpen(false)}
          />
        )}
        <Sidebar
          folders={folders}
          tags={tags}
          notes={notes}
          view={view}
          setView={(v) => { setView(v); setRailOpen(false); }}
          expanded={expanded}
          toggleExpand={(id) => setExpanded((x) => ({ ...x, [id]: !x[id] }))}
          onNew={newNote}
          onCapture={() => setModal("qc")}
          onNewFolder={async () => {
            const name = window.prompt("Nombre de la carpeta:");
            if (name?.trim()) {
              await actions.createFolder(name.trim());
              toast("Carpeta creada", "info");
            }
          }}
          onMoveNote={(id, folderId) => actions.moveNote(id, folderId)}
          dropTarget={dropTarget}
          setDropTarget={setDropTarget}
          theme={theme.theme}
          toggleTheme={theme.toggleTheme}
          railOpen={railOpen}
        />

        <NoteList
          notes={viewNotes}
          folders={folders}
          tags={tags}
          view={view}
          search={search}
          setSearch={setSearch}
          sort={sort}
          setSort={setSort}
          activeId={activeTab}
          onOpen={openNote}
          onNew={newNote}
          onContext={noteMenu}
        />

        <EditorColumn
          {...paneHandlers}
          active={active}
          splitNote={splitNote}
          tabs={tabNotes}
          activeTab={activeTab}
          onSelectTab={openNote}
          onCloseTab={closeTab}
          onNewTab={newNote}
          showCtx={showCtx}
          onToggleCtx={() => setShowCtx((s) => !s)}
          onSplit={(id) => setSplitId(id)}
          onCloseSplit={() => setSplitId(null)}
          notes={liveNotes}
          folders={folders}
          tags={tags}
          reading={theme.reading}
          width={theme.width}
          contentById={contentById}
          onCacheContent={cacheContent}
          onNew={newNote}
          onOpenTemplates={() => setModal("templates")}
          onOpenGraph={() => setModal("graph")}
        />
      </div>

      {modal === "cmdk" && (
        <CommandPalette
          notes={liveNotes}
          commands={commands}
          onClose={() => setModal(null)}
          onOpenNote={openNote}
        />
      )}
      {modal === "qc" && (
        <QuickCapture
          onClose={() => setModal(null)}
          onSave={async (init) => {
            const id = await actions.newNote(init);
            if (id != null) openNote(id);
            toast("Nota creada");
          }}
        />
      )}
      {modal === "templates" && (
        <TemplatePicker
          onClose={() => setModal(null)}
          onPick={async (t) => {
            const id = await actions.newNote({ title: t.name, content: t.content });
            if (id != null) openNote(id);
          }}
        />
      )}
      {modal === "share" && modalNote && (
        <ShareDialog
          note={notes.find((n) => n.id === modalNote.id) ?? modalNote}
          onClose={() => setModal(null)}
          onShare={(uuid) => { actions.shareNote(modalNote.id, uuid); toast("Compartida"); }}
          onUnshare={(uuid) => actions.unshareNote(modalNote.id, uuid)}
          onTogglePublic={(isPublic) => actions.setPublic(modalNote.id, isPublic)}
        />
      )}
      {modal === "history" && modalNote && (
        <VersionHistory
          note={modalNote}
          onClose={() => setModal(null)}
          onRestore={async (versionId) => {
            await DocumentsService.restoreVersion(versionId);
            await actions.refetchNotes();
            toast("Versión restaurada", "info");
          }}
        />
      )}
      {modal === "graph" && (
        <GraphView
          notes={liveNotes}
          activeId={activeTab}
          contentById={contentById}
          onClose={() => setModal(null)}
          onOpenNote={openNote}
        />
      )}

      {menu && <ContextMenu x={menu.x} y={menu.y} items={menu.items} onClose={() => setMenu(null)} />}
      {tagPick && (
        <TagPicker
          tags={tags}
          current={tagPick.note.tags}
          x={tagPick.x}
          y={tagPick.y}
          onClose={() => setTagPick(null)}
          onToggle={(tagId) => actions.toggleTag(tagPick.note.id, tagId)}
          onCreate={async (label) => {
            await actions.createTag(label);
            toast("Etiqueta creada", "info");
          }}
        />
      )}

      <TweaksPanel />
      <ToastHost />
    </div>
  );
}
