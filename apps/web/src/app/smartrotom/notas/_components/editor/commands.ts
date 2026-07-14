"use client";

// Formatting commands for the hand-rolled contentEditable editor. Everything
// funnels through execCommand (insertHTML/insertText included) so the browser's
// native undo stack records every change — direct DOM mutation would not.

export function exec(cmd: string, val?: string) {
  try {
    document.execCommand(cmd, false, val);
  } catch {
    /* noop */
  }
}

// Colors and alignment must land as inline styles, not <font>/align attributes;
// everything else keeps the semantic tags the stored notes already use, so the
// flag is flipped back immediately.
export function execStyled(cmd: string, val?: string) {
  exec("styleWithCSS", "true");
  exec(cmd, val);
  exec("styleWithCSS", "false");
}

export function selectionElement(): Element | null {
  const node = window.getSelection()?.anchorNode;
  if (!node) return null;
  return node.nodeType === Node.ELEMENT_NODE ? (node as Element) : node.parentElement;
}

/** Closest ancestor of the caret matching `selector`, only within this pane's doc. */
export function closestInDoc(doc: HTMLElement | null, selector: string): Element | null {
  const el = selectionElement();
  if (!el || !doc?.contains(el)) return null;
  const hit = el.closest(selector);
  return hit && doc.contains(hit) ? hit : null;
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const cssRgb = (triplet: string, alpha?: number) =>
  alpha != null
    ? `rgba(${triplet.split(" ").join(", ")}, ${alpha})`
    : `rgb(${triplet.split(" ").join(", ")})`;

export function applyTextColor(triplet: string | null) {
  execStyled("foreColor", triplet ? cssRgb(triplet) : "inherit");
}

/** Translucent so the same swatch reads on both the dark and the light canvas. */
export function applyHighlight(triplet: string | null) {
  execStyled("hiliteColor", triplet ? cssRgb(triplet, 0.28) : "transparent");
}

// insertUnorderedList on an EMPTY block nests the list INSIDE it (`<p><ul>`),
// invalid HTML that shatters any later insertHTML parse. Empty blocks get the
// list via insertHTML (clean sibling); everything else keeps the native toggle.
export function toggleList(kind: "ul" | "ol") {
  const el = selectionElement();
  const block = el?.closest("p, div, h1, h2, h3");
  const empty = block && !(block.textContent ?? "").trim() && !block.querySelector("ul,ol,table");
  if (empty && !el?.closest("li")) {
    exec("insertHTML", kind === "ul" ? "<ul><li><br></li></ul>" : "<ol><li><br></li></ol>");
  } else {
    exec(kind === "ul" ? "insertUnorderedList" : "insertOrderedList");
  }
}

export type Align = "left" | "center" | "right";

export function applyAlign(align: Align) {
  execStyled(
    align === "center" ? "justifyCenter" : align === "right" ? "justifyRight" : "justifyLeft",
  );
}

/** Wraps the selection in <code>, or unwraps the inline <code> under the caret. */
export function toggleInlineCode(doc: HTMLElement | null) {
  const code = closestInDoc(doc, "code");
  if (code && !code.closest("pre")) {
    const sel = window.getSelection();
    const range = document.createRange();
    range.selectNode(code);
    sel?.removeAllRanges();
    sel?.addRange(range);
    exec("insertText", code.textContent ?? "");
    return;
  }
  const sel = window.getSelection();
  const text = sel && !sel.isCollapsed ? sel.toString() : "";
  if (!text) return;
  // The zero-width space parks the caret OUTSIDE the chip, so typing continues unstyled.
  exec("insertHTML", `<code>${escapeHtml(text)}</code>\u200B`);
}

export function insertHR() {
  exec("insertHTML", "<hr><p><br></p>");
}

export type CalloutKind = "info" | "success" | "warning" | "error";

export function insertCallout(kind: CalloutKind) {
  const text = window.getSelection()?.toString().trim() ?? "";
  const body = text ? escapeHtml(text) : "<br>";
  // The trailing paragraph is the escape hatch when the callout lands last in the doc.
  exec("insertHTML", `<div class="callout" data-kind="${kind}"><p>${body}</p></div><p><br></p>`);
}
