"use client";

import { exec, selectionElement } from "./commands";

// Structural table edits. Each operation mutates a detached CLONE and swaps it
// in through insertHTML over a range selecting the live table, so the edit
// lands on the browser's native undo stack — direct DOM surgery would be
// invisible to ⌘Z and desync it from the typing history.

export function caretCell(doc: HTMLElement | null): HTMLTableCellElement | null {
  const el = selectionElement();
  if (!el || !doc?.contains(el)) return null;
  const cell = el.closest("td,th");
  return cell && doc.contains(cell) ? (cell as HTMLTableCellElement) : null;
}

interface Ctx {
  table: HTMLTableElement;
  clone: HTMLTableElement;
  row: number;
  col: number;
}

function ctxOf(cell: HTMLTableCellElement): Ctx | null {
  const table = cell.closest("table");
  const row = cell.parentElement;
  if (!table || !(row instanceof HTMLTableRowElement)) return null;
  return {
    table,
    clone: table.cloneNode(true) as HTMLTableElement,
    row: Array.from(table.rows).indexOf(row),
    col: cell.cellIndex,
  };
}

function placeCaret(target: Node) {
  const sel = window.getSelection();
  const range = document.createRange();
  range.selectNodeContents(target);
  range.collapse(true);
  sel?.removeAllRanges();
  sel?.addRange(range);
}

/** Swaps the live table for the mutated clone and re-seats the caret (clamped). */
function swap(doc: HTMLElement, ctx: Ctx, caret: { row: number; col: number }) {
  const index = Array.from(doc.querySelectorAll("table")).indexOf(ctx.table);
  const sel = window.getSelection();
  const range = document.createRange();
  range.selectNode(ctx.table);
  sel?.removeAllRanges();
  sel?.addRange(range);
  exec("insertHTML", ctx.clone.outerHTML);

  const next = doc.querySelectorAll("table")[index];
  if (!(next instanceof HTMLTableElement) || next.rows.length === 0) return;
  const row = next.rows[Math.max(0, Math.min(caret.row, next.rows.length - 1))];
  const cell = row.cells[Math.max(0, Math.min(caret.col, row.cells.length - 1))];
  if (cell) placeCaret(cell);
}

function freshCell(tag: "td" | "th") {
  const c = document.createElement(tag);
  c.innerHTML = "<br>";
  return c;
}

function retag(cell: HTMLTableCellElement, tag: "td" | "th") {
  const next = document.createElement(tag);
  for (const a of Array.from(cell.attributes)) next.setAttribute(a.name, a.value);
  while (cell.firstChild) next.append(cell.firstChild);
  cell.replaceWith(next);
}

function dropIfEmpty(section: Element | null) {
  if (section && section.tagName !== "TABLE" && !section.querySelector("tr")) section.remove();
}

export function insertRow(
  doc: HTMLElement,
  cell: HTMLTableCellElement,
  where: "above" | "below",
  caretCol?: number,
) {
  const ctx = ctxOf(cell);
  const ref = ctx?.clone.rows[ctx.row];
  if (!ctx || !ref) return;
  const tr = document.createElement("tr");
  for (let i = 0; i < ref.cells.length; i++) tr.append(freshCell("td"));
  if (ref.closest("thead")) {
    // Body rows never enter the header: from the header row, both directions
    // land the new row at the top of the body.
    const tbody = ctx.clone.tBodies[0] ?? ctx.clone.createTBody();
    tbody.insertBefore(tr, tbody.firstChild);
  } else if (where === "above") {
    ref.before(tr);
  } else {
    ref.after(tr);
  }
  swap(doc, ctx, { row: Array.from(ctx.clone.rows).indexOf(tr), col: caretCol ?? ctx.col });
}

export function insertCol(doc: HTMLElement, cell: HTMLTableCellElement, where: "left" | "right") {
  const ctx = ctxOf(cell);
  if (!ctx) return;
  const at = ctx.col + (where === "right" ? 1 : 0);
  for (const row of Array.from(ctx.clone.rows)) {
    const tag = row.cells[0]?.tagName === "TH" ? "th" : "td";
    row.insertBefore(freshCell(tag), row.cells[at] ?? null);
  }
  swap(doc, ctx, { row: ctx.row, col: at });
}

export function deleteRow(doc: HTMLElement, cell: HTMLTableCellElement) {
  const ctx = ctxOf(cell);
  if (!ctx) return;
  if (ctx.clone.rows.length <= 1) return deleteTable(doc, cell);
  const row = ctx.clone.rows[ctx.row];
  const section = row.parentElement;
  row.remove();
  dropIfEmpty(section);
  swap(doc, ctx, { row: ctx.row, col: ctx.col });
}

export function deleteCol(doc: HTMLElement, cell: HTMLTableCellElement) {
  const ctx = ctxOf(cell);
  if (!ctx) return;
  if ((ctx.clone.rows[ctx.row]?.cells.length ?? 0) <= 1) return deleteTable(doc, cell);
  for (const row of Array.from(ctx.clone.rows)) row.cells[ctx.col]?.remove();
  swap(doc, ctx, { row: ctx.row, col: ctx.col });
}

export function toggleHeader(doc: HTMLElement, cell: HTMLTableCellElement) {
  const ctx = ctxOf(cell);
  if (!ctx) return;
  const { clone } = ctx;
  if (clone.tHead) {
    const head = clone.tHead;
    const tbody = clone.tBodies[0] ?? clone.createTBody();
    for (const row of Array.from(head.rows).reverse()) {
      for (const c of Array.from(row.cells)) retag(c, "td");
      tbody.insertBefore(row, tbody.firstChild);
    }
    head.remove();
  } else {
    const first = clone.rows[0];
    if (!first) return;
    for (const c of Array.from(first.cells)) retag(c, "th");
    const section = first.parentElement;
    clone.createTHead().append(first);
    dropIfEmpty(section);
  }
  swap(doc, ctx, { row: ctx.row, col: ctx.col });
}

export function deleteTable(doc: HTMLElement, cell: HTMLTableCellElement) {
  const table = cell.closest("table");
  if (!table || !doc.contains(table)) return;
  const sel = window.getSelection();
  const range = document.createRange();
  range.selectNode(table);
  sel?.removeAllRanges();
  sel?.addRange(range);
  exec("delete");
}

/** A header row plus `rows` body rows × `cols`, ready for insertHTML. */
export function tableHTML(rows: number, cols: number): string {
  const th = `<tr>${"<th><br></th>".repeat(cols)}</tr>`;
  const tr = `<tr>${"<td><br></td>".repeat(cols)}</tr>`;
  return `<table><thead>${th}</thead><tbody>${tr.repeat(rows)}</tbody></table><p><br></p>`;
}

/** Tab / Shift+Tab cell hopping; Tab past the last cell grows a row. Returns handled. */
export function tableTab(doc: HTMLElement | null, back: boolean): boolean {
  const cell = doc ? caretCell(doc) : null;
  if (!cell || !doc) return false;
  const table = cell.closest("table");
  if (!table) return false;
  const cells = Array.from(table.rows).flatMap((r) => Array.from(r.cells));
  const i = cells.indexOf(cell);
  const next = cells[back ? i - 1 : i + 1];
  if (next) placeCaret(next);
  else if (!back) insertRow(doc, cell, "below", 0);
  return true;
}
