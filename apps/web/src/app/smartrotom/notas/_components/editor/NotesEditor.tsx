"use client";

import { useEffect, useMemo, useRef } from "react";
import { useLocale, useTranslations } from "next-intl";
import { CKEditor } from "@ckeditor/ckeditor5-react";
import Bundle from "@/components/shared/ckeditor/ckeditor.js";
import { COLOR_KEYS, COLOR_RGB } from "../../_utils/colors";
import type { Reading, Width } from "../../_hooks/useNotesTheme";

// The prebuilt classic build compiles every plugin in, and a prebuilt bundle
// cannot host plugins that import @ckeditor/* classes (duplicated-modules), so
// the wikilink system is assembled ONLY from runtime APIs on the editor
// instance: the bundled Mention plugin supplies the `[[` picker and the atomic
// chip semantics, and custom converters rewrite its markup to the
// `<a class="wikilink" data-title>` anchors that backlinks/graph derive from.

type Editor = any;

const rgb = (t: string) => `rgb(${t.split(" ").join(", ")})`;
const rgba = (t: string, a: number) => `rgba(${t.split(" ").join(", ")}, ${a})`;

/** Notes written before CKEditor store todos as ul.todo/li[data-done]; upgrade on load. */
export function upgradeLegacyContent(html: string): string {
  return html.replace(/<ul class="todo">([\s\S]*?)<\/ul>/g, (_m, inner: string) => {
    const items = inner.replace(
      /<li[^>]*data-done="(true|false)"[^>]*>([\s\S]*?)<\/li>/g,
      (_mm, done: string, body: string) =>
        `<li><label class="todo-list__label"><input type="checkbox" disabled${
          done === "true" ? ' checked="checked"' : ""
        }><span class="todo-list__label__description">${body}</span></label></li>`,
    );
    return `<ul class="todo-list">${items}</ul>`;
  });
}

interface NotesEditorProps {
  noteId: number;
  initialData: string;
  /** Latest server copy — applied only while unfocused (version restores, refetches). */
  content?: string | null;
  /** Titles offered by the `[[` picker (caller excludes the note itself). */
  linkTargets: () => string[];
  reading: Reading;
  width: Width;
  onSave: (html: string) => void;
  onDirty: () => void;
  onWords: (words: number) => void;
  onOpenTitle: (title: string) => void;
  onCreateLinked: (title: string) => void;
}

export default function NotesEditor(props: NotesEditorProps) {
  const t = useTranslations("notas");
  const locale = useLocale();
  const editorRef = useRef<Editor | null>(null);
  // The config must stay referentially stable; every callback flows through this ref.
  const cb = useRef(props);
  cb.current = props;
  const rawInitial = useRef(props.initialData);
  const initial = useRef(upgradeLegacyContent(props.initialData));

  const config = useMemo(() => {
    // `[[` = marker "[" plus a query that must open with the second "[".
    const feed = (query: string) => {
      if (!query.startsWith("[")) return [];
      const q = query.slice(1);
      const titles = cb.current.linkTargets();
      const matches: Array<Record<string, unknown>> = titles
        .filter((t) => t.toLowerCase().includes(q.toLowerCase()))
        .slice(0, 8)
        .map((t) => ({ id: `[[${t}`, text: t, wikiTitle: t }));
      const trimmed = q.trim();
      if (trimmed && !titles.some((t) => t.toLowerCase() === trimmed.toLowerCase())) {
        matches.push({ id: `[[${trimmed}`, text: trimmed, wikiTitle: trimmed, isNew: true });
      }
      return matches;
    };

    function wikiLinks(editor: Editor) {
      editor.conversion.for("upcast").elementToAttribute({
        view: { name: "a", classes: ["wikilink"], attributes: { "data-title": true } },
        model: {
          key: "mention",
          value: (viewItem: any) => {
            const title = viewItem.getAttribute("data-title") ?? "";
            const text = Array.from(viewItem.getChildren() as Iterable<any>)
              .map((c) => c.data ?? "")
              .join("");
            return {
              id: `[[${title}`,
              uid: Math.random().toString(16).slice(2),
              // The mention post-fixer drops the attribute unless this matches
              // the covered text exactly.
              _text: text || title,
              wikiTitle: title,
            };
          },
        },
        converterPriority: "high",
      });
      editor.conversion.for("downcast").attributeToElement({
        model: "mention",
        view: (value: any, { writer }: any) => {
          if (!value) return;
          const title = value.wikiTitle ?? String(value.id ?? "").replace(/^\[+/, "");
          return writer.createAttributeElement(
            "a",
            { class: "wikilink", "data-title": title },
            { priority: 20, id: value.uid },
          );
        },
        converterPriority: "high",
      });
    }

    return {
      language: locale,
      // Markdown would flip the data format; Title hijacks the first <h1>.
      removePlugins: ["Markdown", "Title", "MediaEmbed", "MediaEmbedToolbar"],
      placeholder: t("editor.placeholder"),
      toolbar: {
        items: [
          "heading",
          "|",
          // No "italic": the prebuilt bundle was generated WITHOUT the Italic
          // plugin (see ckeditor.d.ts imports) — regenerate the build to add it.
          "bold",
          "underline",
          "strikethrough",
          "code",
          "removeFormat",
          "|",
          "fontColor",
          "fontBackgroundColor",
          "|",
          "alignment",
          "outdent",
          "indent",
          "|",
          "bulletedList",
          "numberedList",
          "todoList",
          "|",
          "blockQuote",
          "codeBlock",
          "insertTable",
          "horizontalLine",
          "imageInsert",
          "|",
          "findAndReplace",
          "|",
          "undo",
          "redo",
        ],
      },
      heading: {
        options: [
          { model: "paragraph", title: t("editor.paragraph"), class: "ck-heading_paragraph" },
          { model: "heading1", view: "h1", title: t("editor.heading1"), class: "ck-heading_heading1" },
          { model: "heading2", view: "h2", title: t("editor.heading2"), class: "ck-heading_heading2" },
          { model: "heading3", view: "h3", title: t("editor.heading3"), class: "ck-heading_heading3" },
        ],
      },
      fontColor: {
        colors: COLOR_KEYS.map((k) => ({ color: rgb(COLOR_RGB[k]), label: t(`colors.${k}`) })),
        columns: 7,
        documentColors: 0,
      },
      fontBackgroundColor: {
        colors: COLOR_KEYS.map((k) => ({ color: rgba(COLOR_RGB[k], 0.28), label: t(`colors.${k}`) })),
        columns: 7,
        documentColors: 0,
      },
      table: {
        contentToolbar: ["tableColumn", "tableRow", "mergeTableCells", "tableCellProperties"],
      },
      image: {
        toolbar: [
          "imageTextAlternative",
          "toggleImageCaption",
          "imageStyle:inline",
          "imageStyle:block",
          "imageStyle:side",
        ],
      },
      // Legacy callouts must round-trip untouched.
      htmlSupport: {
        allow: [{ name: "div", classes: ["callout"], attributes: { "data-kind": true } }],
      },
      mention: {
        feeds: [
          {
            marker: "[",
            minimumCharacters: 0,
            feed,
            itemRenderer: (item: any) => {
              const el = document.createElement("span");
              el.className = "nt-mention-item" + (item.isNew ? " nt-mention-new" : "");
              el.textContent = item.isNew ? t("editor.createLinked", { title: item.wikiTitle }) : item.wikiTitle;
              return el;
            },
          },
        ],
      },
      wordCount: { onUpdate: (stats: any) => cb.current.onWords(stats.words) },
      autosave: {
        waitingTime: 700,
        save: (editor: Editor) => {
          cb.current.onSave(editor.getData());
          return Promise.resolve();
        },
      },
      extraPlugins: [wikiLinks],
    };
  }, []);

  // Mirror the app theme onto CKEditor's body-mounted balloon layer.
  useEffect(() => {
    const root = document.querySelector(".nt-app");
    const sync = () => {
      const wrapper = document.querySelector(".ck-body-wrapper");
      if (!wrapper) return;
      wrapper.classList.add("nt-app", "font-nt");
      const t = root?.getAttribute("data-theme");
      if (t) wrapper.setAttribute("data-theme", t);
      else wrapper.removeAttribute("data-theme");
    };
    sync();
    const mo = new MutationObserver(sync);
    mo.observe(document.body, { childList: true });
    if (root) mo.observe(root, { attributes: true, attributeFilter: ["data-theme"] });
    return () => mo.disconnect();
  }, []);

  // Typography prefs ride as classes on the editable, exactly like the old
  // .nt-doc — but through the view writer: CKEditor's renderer owns the
  // editable's class attribute and wipes direct classList edits on refocus.
  useEffect(() => {
    const ed = editorRef.current;
    if (!ed) return;
    const view = ed.editing.view;
    view.change((writer: any) => {
      const root = view.document.getRoot();
      writer[props.reading === "serif" ? "addClass" : "removeClass"]("serif", root);
      writer[props.width === "wide" ? "addClass" : "removeClass"]("wide", root);
    });
  }, [props.reading, props.width]);

  // External content changes (restores, other-user edits) land only while unfocused;
  // a focused editor is the source of truth — never stomp live typing.
  useEffect(() => {
    const ed = editorRef.current;
    if (!ed || props.content == null || props.content === rawInitial.current) return;
    if (ed.ui.focusTracker.isFocused) return;
    const next = upgradeLegacyContent(props.content);
    if (ed.getData() !== next) ed.setData(next);
  }, [props.content]);

  return (
    <CKEditor
      editor={(Bundle as any).Editor}
      config={config as any}
      data={initial.current}
      onReady={(editor: Editor) => {
        editorRef.current = editor;
        // .nt-doc gives the editable the note-page look AND keeps outline
        // scroll-to (EditorColumn) working. It MUST go through the view writer:
        // the renderer re-syncs the editable's class attribute on every
        // focus/blur and drops classes added straight to the DOM element.
        const view = editor.editing.view;
        view.change((writer: any) => {
          const root = view.document.getRoot();
          writer.addClass(["nt-doc", "font-nt"], root);
          if (cb.current.reading === "serif") writer.addClass("serif", root);
          if (cb.current.width === "wide") writer.addClass("wide", root);
        });
        // Plain UI chrome (not renderer-managed) — direct DOM is fine here.
        editor.ui.view.element?.querySelector(".ck-editor__main")?.classList.add("nt-scroll");

        editor.model.document.on("change:data", () => cb.current.onDirty());

        // Blur = the old editor's commit-on-blur.
        editor.ui.focusTracker.on("change:isFocused", (_e: unknown, _n: unknown, focused: boolean) => {
          if (!focused) editor.plugins.get("Autosave").save();
        });

        // Wikilink chip → open that note. A native DOM listener, NOT the view
        // document's `click` event: the latter only fires with a ClickObserver
        // registered, which the prebuilt bundle can't add without importing
        // engine internals. The editable element lives and dies with the editor
        // (key={note.id}), so this needs no teardown.
        const editableEl = editor.ui.getEditableElement() as HTMLElement;
        editableEl.addEventListener("click", (e: MouseEvent) => {
          const anchor = (e.target as HTMLElement | null)?.closest?.("a.wikilink");
          if (anchor) {
            e.preventDefault();
            cb.current.onOpenTitle(anchor.getAttribute("data-title") ?? "");
          }
        });

        // The picker's «Crear …» entry births the linked note.
        editor.commands.get("mention")?.on("execute", (_evt: unknown, args: any[]) => {
          const item = args?.[0]?.mention;
          if (item?.isNew) cb.current.onCreateLinked(item.wikiTitle);
        });
      }}
    />
  );
}
