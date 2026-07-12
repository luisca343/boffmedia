"use client";

import { useCallback, useEffect, useState } from "react";
import { Icon, Tooltip, type IconName } from "../ui";

function exec(cmd: string, val?: string) {
  try {
    document.execCommand(cmd, false, val);
  } catch {
    /* noop */
  }
}

interface ToolbarProps {
  onCmd: () => void;
  onInsertLink: (title: string) => void;
}

export function Toolbar({ onCmd }: ToolbarProps) {
  const [st, setSt] = useState<Record<string, boolean>>({});
  const [block, setBlock] = useState("p");

  const refresh = useCallback(() => {
    setSt({
      bold: document.queryCommandState("bold"),
      italic: document.queryCommandState("italic"),
      underline: document.queryCommandState("underline"),
      strike: document.queryCommandState("strikeThrough"),
      ul: document.queryCommandState("insertUnorderedList"),
      ol: document.queryCommandState("insertOrderedList"),
    });
    const sel = window.getSelection();
    if (sel?.anchorNode) {
      const el =
        sel.anchorNode.nodeType === 1
          ? (sel.anchorNode as Element)
          : sel.anchorNode.parentElement;
      const b = el?.closest?.("h1,h2,h3,blockquote,pre,p");
      if (b) setBlock(b.tagName.toLowerCase());
    }
  }, []);

  useEffect(() => {
    document.addEventListener("selectionchange", refresh);
    return () => document.removeEventListener("selectionchange", refresh);
  }, [refresh]);

  const hold = (fn: () => void) => (e: React.MouseEvent) => {
    e.preventDefault();
    fn();
    setTimeout(refresh, 0);
    onCmd();
  };

  const setBlk = (tag: string) => exec("formatBlock", tag === "p" ? "P" : tag.toUpperCase());
  const insertTodo = () =>
    exec("insertHTML", '<ul class="todo"><li data-done="false">Nueva tarea</li></ul>');
  const insertTable = () =>
    exec(
      "insertHTML",
      '<table><thead><tr><th>Col 1</th><th>Col 2</th></tr></thead><tbody><tr><td>—</td><td>—</td></tr><tr><td>—</td><td>—</td></tr></tbody></table><p><br></p>',
    );
  const insertCode = () => exec("insertHTML", "<pre><code>// código</code></pre><p><br></p>");
  const insertLink = () => {
    const t = typeof window !== "undefined" ? window.prompt("Enlazar a nota (título):", "") : "";
    if (t) exec("insertHTML", `<a class="wikilink" data-title="${t}">${t}</a>&nbsp;`);
  };

  const btnCls = (on?: boolean) =>
    `inline-flex h-[30px] min-w-[30px] flex-none items-center justify-center rounded-nt-sm border border-transparent px-1.5 text-[13px] transition-colors ${
      on ? "bg-nt-accent/15 text-nt-accent-fg" : "text-nt-fg-muted hover:bg-nt-hover-strong hover:text-nt-fg"
    }`;

  const B = ({
    icon,
    run,
    on,
    label,
  }: {
    icon: IconName;
    run: () => void;
    on?: boolean;
    label: string;
  }) => (
    <Tooltip label={label}>
      <button className={btnCls(on)} aria-label={label} onMouseDown={hold(run)}>
        <Icon name={icon} size={16} />
      </button>
    </Tooltip>
  );

  const Sep = () => <span className="mx-1.5 h-5 w-px flex-none bg-nt-border-2" />;

  return (
    <div
      className="nt-scroll sticky top-0 z-[5] flex flex-nowrap items-center gap-0.5 overflow-x-auto border-b border-nt-border bg-nt-panel px-2.5 py-1.5"
      role="toolbar"
      aria-label="Formato de texto"
    >
      <select
        className="h-[30px] flex-none rounded-nt-sm border border-transparent bg-transparent px-2 text-[13px] text-nt-fg hover:bg-nt-hover-strong"
        value={["h1", "h2", "h3", "blockquote", "pre"].includes(block) ? block : "p"}
        onMouseDown={(e) => e.stopPropagation()}
        onChange={(e) => {
          setBlk(e.target.value);
          onCmd();
        }}
        aria-label="Estilo de bloque"
      >
        <option value="p">Párrafo</option>
        <option value="h1">Título 1</option>
        <option value="h2">Título 2</option>
        <option value="h3">Título 3</option>
        <option value="blockquote">Cita</option>
      </select>
      <Sep />
      <B icon="bold" run={() => exec("bold")} on={st.bold} label="Negrita ⌘B" />
      <B icon="italic" run={() => exec("italic")} on={st.italic} label="Cursiva ⌘I" />
      <B icon="underline" run={() => exec("underline")} on={st.underline} label="Subrayado ⌘U" />
      <B icon="strike" run={() => exec("strikeThrough")} on={st.strike} label="Tachado" />
      <Sep />
      <B icon="list" run={() => exec("insertUnorderedList")} on={st.ul} label="Lista" />
      <B icon="list-ordered" run={() => exec("insertOrderedList")} on={st.ol} label="Lista numerada" />
      <B icon="list-check" run={insertTodo} label="Lista de tareas" />
      <Sep />
      <B icon="quote" run={() => setBlk("blockquote")} label="Cita" />
      <B icon="code" run={insertCode} label="Bloque de código" />
      <B icon="table" run={insertTable} label="Tabla" />
      <B icon="link" run={insertLink} label="Enlazar nota [[ ]]" />
      <Sep />
      <B icon="undo" run={() => exec("undo")} label="Deshacer ⌘Z" />
      <B icon="redo" run={() => exec("redo")} label="Rehacer" />
    </div>
  );
}
