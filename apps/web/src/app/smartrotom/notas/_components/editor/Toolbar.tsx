"use client";

import { useCallback, useEffect, useState, type RefObject } from "react";
import { Icon, Tooltip, type IconName } from "../ui";
import { COLOR_KEYS, COLOR_RGB } from "../../_utils/colors";
import {
  applyAlign,
  applyHighlight,
  applyTextColor,
  exec,
  insertCallout,
  insertHR,
  selectionElement,
  toggleInlineCode,
  toggleList,
  type CalloutKind,
} from "./commands";
import { caretCell, tableHTML } from "./tableOps";
import { Popover, PopRow, PopSep } from "./Popover";
import { TABLE_ACTIONS } from "./TableMenu";

interface ToolbarProps {
  onCmd: () => void;
  docRef: RefObject<HTMLDivElement | null>;
}

type PopKind = "color" | "highlight" | "align" | "table" | "insert";

const CALLOUTS: Array<{ kind: CalloutKind; label: string; icon: IconName; iconClass: string }> = [
  { kind: "info", label: "Aviso — info", icon: "info", iconClass: "text-nt-c-info" },
  { kind: "success", label: "Aviso — éxito", icon: "circle-check", iconClass: "text-nt-c-success" },
  { kind: "warning", label: "Aviso — atención", icon: "triangle-alert", iconClass: "text-nt-c-warning" },
  { kind: "error", label: "Aviso — error", icon: "octagon-alert", iconClass: "text-nt-c-error" },
];

export function Toolbar({ onCmd, docRef }: ToolbarProps) {
  const [st, setSt] = useState<Record<string, boolean>>({});
  const [block, setBlock] = useState("p");
  const [pop, setPop] = useState<{ kind: PopKind; x: number; y: number } | null>(null);
  const [grid, setGrid] = useState({ r: 0, c: 0 });

  const refresh = useCallback(() => {
    const doc = docRef.current;
    const el = selectionElement();
    const within = !!(doc && el && doc.contains(el));
    const q = (cmd: string) => within && document.queryCommandState(cmd);
    setSt({
      bold: q("bold"),
      italic: q("italic"),
      underline: q("underline"),
      strike: q("strikeThrough"),
      ul: q("insertUnorderedList"),
      ol: q("insertOrderedList"),
      alignCenter: q("justifyCenter"),
      alignRight: q("justifyRight"),
      inList: within && !!el?.closest("li"),
      inTable: within && !!el?.closest("td,th"),
      inCode: within && !!el?.closest("code") && !el?.closest("pre"),
    });
    if (within) {
      const b = el?.closest?.("h1,h2,h3,blockquote,pre,p");
      if (b) setBlock(b.tagName.toLowerCase());
    }
  }, [docRef]);

  useEffect(() => {
    document.addEventListener("selectionchange", refresh);
    return () => document.removeEventListener("selectionchange", refresh);
  }, [refresh]);

  const after = useCallback(() => {
    setTimeout(refresh, 0);
    onCmd();
  }, [refresh, onCmd]);

  const hold = (fn: () => void) => (e: React.MouseEvent) => {
    e.preventDefault();
    fn();
    after();
  };

  // Popover plumbing. Every mousedown inside a popover is default-prevented,
  // so the editor's selection survives and commands land on the same range.
  const runPop = (fn: () => void) => () => {
    setPop(null);
    fn();
    after();
  };

  const openPop = (kind: PopKind) => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setGrid({ r: 0, c: 0 });
    setPop((p) => (p?.kind === kind ? null : { kind, x: r.left, y: r.bottom + 6 }));
  };

  const cellRun = (fn: (doc: HTMLElement, cell: HTMLTableCellElement) => void) =>
    runPop(() => {
      const doc = docRef.current;
      const cell = caretCell(doc);
      if (doc && cell) fn(doc, cell);
    });

  const setBlk = (tag: string) => exec("formatBlock", tag === "p" ? "P" : tag.toUpperCase());
  const insertTodo = () =>
    exec("insertHTML", '<ul class="todo"><li data-done="false">Nueva tarea</li></ul>');
  const insertCode = () => exec("insertHTML", "<pre><code>// código</code></pre><p><br></p>");
  // Types the trigger for the writer; the pane's picker takes it from there.
  const insertLink = () => exec("insertText", "[[");

  const btnCls = (on?: boolean) =>
    `inline-flex h-[30px] min-w-[30px] flex-none items-center justify-center rounded-nt-sm border border-transparent px-1.5 text-[13px] transition-colors disabled:opacity-30 ${
      on ? "bg-nt-accent/15 text-nt-accent-fg" : "text-nt-fg-muted hover:bg-nt-hover-strong hover:text-nt-fg"
    }`;

  const B = ({
    icon,
    run,
    on,
    label,
    disabled,
  }: {
    icon: IconName;
    run: () => void;
    on?: boolean;
    label: string;
    disabled?: boolean;
  }) => (
    <Tooltip label={label}>
      <button className={btnCls(on)} aria-label={label} disabled={disabled} onMouseDown={hold(run)}>
        <Icon name={icon} size={16} />
      </button>
    </Tooltip>
  );

  const PB = ({ icon, kind, label, on }: { icon: IconName; kind: PopKind; label: string; on?: boolean }) => (
    <Tooltip label={label}>
      <button
        className={`${btnCls(on || pop?.kind === kind)} !px-1`}
        aria-label={label}
        aria-expanded={pop?.kind === kind}
        onMouseDown={openPop(kind)}
      >
        <Icon name={icon} size={16} />
        <Icon name="chevron-down" size={10} className="ml-0.5 opacity-60" />
      </button>
    </Tooltip>
  );

  const Sep = () => <span className="mx-1.5 h-5 w-px flex-none bg-nt-border-2" />;

  const swatches = (mode: "color" | "highlight") => (
    <div className="grid w-max grid-cols-4 gap-1.5 p-1">
      {COLOR_KEYS.map((k) => (
        <button
          key={k}
          aria-label={`Color ${k}`}
          onClick={runPop(() =>
            mode === "color" ? applyTextColor(COLOR_RGB[k]) : applyHighlight(COLOR_RGB[k]),
          )}
          className="h-[22px] w-[22px] rounded-[6px] border border-nt-border-2 transition-transform hover:scale-110"
          style={{
            background:
              mode === "color"
                ? `rgb(${COLOR_RGB[k]})`
                : `rgba(${COLOR_RGB[k].split(" ").join(", ")}, 0.4)`,
          }}
        />
      ))}
      <button
        aria-label="Quitar color"
        title="Quitar color"
        onClick={runPop(() => (mode === "color" ? applyTextColor(null) : applyHighlight(null)))}
        className="inline-flex h-[22px] w-[22px] items-center justify-center rounded-[6px] border border-dashed border-nt-border-2 text-nt-fg-subtle hover:text-nt-fg"
      >
        <Icon name="x" size={12} />
      </button>
    </div>
  );

  const alignIcon: IconName = st.alignCenter ? "align-center" : st.alignRight ? "align-right" : "align-left";

  return (
    <>
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
        <B icon="code" run={() => toggleInlineCode(docRef.current)} on={st.inCode} label="Código en línea" />
        <B icon="eraser" run={() => exec("removeFormat")} label="Limpiar formato" />
        <Sep />
        <PB icon="baseline" kind="color" label="Color de texto" />
        <PB icon="highlighter" kind="highlight" label="Resaltar" />
        <Sep />
        <PB icon={alignIcon} kind="align" label="Alineación" on={st.alignCenter || st.alignRight} />
        <B icon="outdent" run={() => exec("outdent")} label="Reducir sangría" disabled={!st.inList} />
        <B icon="indent" run={() => exec("indent")} label="Aumentar sangría" disabled={!st.inList} />
        <Sep />
        <B icon="list" run={() => toggleList("ul")} on={st.ul} label="Lista" />
        <B icon="list-ordered" run={() => toggleList("ol")} on={st.ol} label="Lista numerada" />
        <B icon="list-check" run={insertTodo} label="Lista de tareas" />
        <Sep />
        <B icon="quote" run={() => setBlk("blockquote")} label="Cita" />
        <B icon="code-block" run={insertCode} label="Bloque de código" />
        <PB icon="table" kind="table" label="Tabla" on={st.inTable} />
        <PB icon="plus-circle" kind="insert" label="Insertar" />
        <B icon="link" run={insertLink} label="Enlazar nota [[ ]]" />
        <Sep />
        <B icon="undo" run={() => exec("undo")} label="Deshacer ⌘Z" />
        <B icon="redo" run={() => exec("redo")} label="Rehacer" />
      </div>

      {pop?.kind === "color" && (
        <Popover x={pop.x} y={pop.y} width={124} onClose={() => setPop(null)}>
          {swatches("color")}
        </Popover>
      )}
      {pop?.kind === "highlight" && (
        <Popover x={pop.x} y={pop.y} width={124} onClose={() => setPop(null)}>
          {swatches("highlight")}
        </Popover>
      )}
      {pop?.kind === "align" && (
        <Popover x={pop.x} y={pop.y} width={168} onClose={() => setPop(null)}>
          <PopRow
            icon="align-left"
            label="Izquierda"
            active={!st.alignCenter && !st.alignRight}
            onRun={runPop(() => applyAlign("left"))}
          />
          <PopRow
            icon="align-center"
            label="Centrar"
            active={st.alignCenter}
            onRun={runPop(() => applyAlign("center"))}
          />
          <PopRow
            icon="align-right"
            label="Derecha"
            active={st.alignRight}
            onRun={runPop(() => applyAlign("right"))}
          />
        </Popover>
      )}
      {pop?.kind === "table" && (
        <Popover x={pop.x} y={pop.y} width={208} onClose={() => setPop(null)}>
          <div className="p-1" onMouseLeave={() => setGrid({ r: 0, c: 0 })}>
            <div className="grid w-max grid-cols-7 gap-[3px]">
              {Array.from({ length: 35 }, (_, i) => {
                const r = Math.floor(i / 7) + 1;
                const c = (i % 7) + 1;
                const on = r <= grid.r && c <= grid.c;
                return (
                  <button
                    key={i}
                    aria-label={`Tabla de ${r} × ${c}`}
                    onMouseEnter={() => setGrid({ r, c })}
                    onClick={runPop(() => exec("insertHTML", tableHTML(r, c)))}
                    className={`h-[15px] w-[15px] rounded-[3px] border ${
                      on ? "border-nt-accent bg-nt-accent/25" : "border-nt-border-2 bg-nt-hover"
                    }`}
                  />
                );
              })}
            </div>
            <div className="pt-1.5 text-center text-[11px] text-nt-fg-subtle">
              {grid.r > 0 ? `${grid.r} × ${grid.c} + encabezado` : "Filas × columnas"}
            </div>
          </div>
          <PopSep />
          {TABLE_ACTIONS.map((a, i) =>
            a === "sep" ? null : (
              <PopRow
                key={i}
                icon={a.icon}
                label={a.label}
                danger={a.danger}
                disabled={!st.inTable}
                onRun={cellRun(a.run)}
              />
            ),
          )}
        </Popover>
      )}
      {pop?.kind === "insert" && (
        <Popover x={pop.x} y={pop.y} width={196} onClose={() => setPop(null)}>
          <PopRow icon="minus" label="Línea divisoria" kbd="---" onRun={runPop(insertHR)} />
          <PopSep />
          {CALLOUTS.map((c) => (
            <PopRow
              key={c.kind}
              icon={c.icon}
              iconClass={c.iconClass}
              label={c.label}
              onRun={runPop(() => insertCallout(c.kind))}
            />
          ))}
        </Popover>
      )}
    </>
  );
}
