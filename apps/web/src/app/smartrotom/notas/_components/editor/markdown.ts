"use client";

import type { KeyboardEvent } from "react";
import { exec, toggleList } from "./commands";

// Markdown-style triggers typed at the start of a plain paragraph convert the
// block when the trailing space (or Enter, for fences and rules) lands. The
// marker is deleted through execCommand so the conversion stays on the native
// undo stack.

const SPACE_RULES: Array<{ re: RegExp; run: () => void }> = [
  { re: /^#$/, run: () => exec("formatBlock", "H1") },
  { re: /^##$/, run: () => exec("formatBlock", "H2") },
  { re: /^###$/, run: () => exec("formatBlock", "H3") },
  { re: /^[-*]$/, run: () => toggleList("ul") },
  { re: /^1[.)]$/, run: () => toggleList("ol") },
  { re: /^>$/, run: () => exec("formatBlock", "BLOCKQUOTE") },
  {
    re: /^\[ ?\]$/,
    run: () => exec("insertHTML", '<ul class="todo"><li data-done="false"><br></li></ul>'),
  },
];

const ENTER_RULES: Array<{ re: RegExp; run: () => void }> = [
  { re: /^```$/, run: () => exec("formatBlock", "PRE") },
  { re: /^(---|\*\*\*)$/, run: () => exec("insertHTML", "<hr><p><br></p>") },
];

/** Converts a `# `/`- `/`> `/…: true if the key was consumed by a conversion. */
export function markdownShortcut(e: KeyboardEvent<HTMLDivElement>, doc: HTMLElement | null): boolean {
  if (e.key !== " " && e.key !== "Enter") return false;
  const sel = window.getSelection();
  const node = sel?.anchorNode;
  if (!sel?.isCollapsed || !node || node.nodeType !== Node.TEXT_NODE || !doc?.contains(node)) {
    return false;
  }

  // Only a marker that IS the whole start of a plain block converts — never
  // inside lists, headings, cells or code. DIV covers Chromium's legacy
  // separator and bare text at the doc root (formatBlock wraps both fine).
  const block = node.parentElement?.closest("p, div, h1, h2, h3, li, pre, blockquote, td, th");
  if (!block || !["P", "DIV"].includes(block.tagName) || node.parentElement !== block || block.firstChild !== node) {
    return false;
  }

  const prefix = (node.textContent ?? "").slice(0, sel.anchorOffset);
  const rule = (e.key === " " ? SPACE_RULES : ENTER_RULES).find((r) => r.re.test(prefix));
  if (!rule) return false;

  const range = document.createRange();
  range.setStart(node, 0);
  range.setEnd(node, sel.anchorOffset);
  sel.removeAllRanges();
  sel.addRange(range);
  exec("delete");
  rule.run();
  e.preventDefault();
  return true;
}
