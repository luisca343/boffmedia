"use client";

/**
 * Which element is actually scrolling.
 *
 * On the web the answer is the document: the codex is a `document`-layout tool,
 * the page grows with it, and `window.scrollTo` / `document.body.style.overflow`
 * are the right handles. In the launcher they are the WRONG handles and fail
 * silently — the tool is rendered inside the host's `overflow-y-auto` div, so
 * `window.scrollTo(0, 0)` scrolls a document that never moved, "back to the
 * grid" lands the player halfway down the list they were reading, and the
 * lightbox's scroll lock locks a body that was not scrolling in the first place
 * while the grid keeps moving behind it.
 *
 * So: walk up from the tool's own root to the nearest ancestor that actually
 * scrolls, and fall back to the document when there is none. One answer, both
 * hosts, no host wiring — the host's container is found rather than announced.
 */

/** The nearest scrollable ancestor of `el`, or `null` for "the document". */
export function scrollportOf(el: Element | null): HTMLElement | null {
  let node = el?.parentElement ?? null;
  while (node) {
    const style = getComputedStyle(node);
    const overflowY = style.overflowY;
    if (
      (overflowY === "auto" || overflowY === "scroll" || overflowY === "overlay") &&
      // A container that is `overflow-y-auto` but not actually clipping anything
      // is not the scroller — the host's wrapper qualifies, an incidental
      // `overflow-auto` on a full-height flex child does not.
      node.scrollHeight > node.clientHeight + 1
    ) {
      return node;
    }
    node = node.parentElement;
  }
  return null;
}

/** Current offset of whichever scroller owns `el`. */
export function scrollTopOf(el: Element | null): number {
  const port = scrollportOf(el);
  return port ? port.scrollTop : window.scrollY;
}

/** Scroll whichever scroller owns `el`, honouring reduced motion. */
export function scrollPortTo(el: Element | null, top: number, smooth = false): void {
  const behavior: ScrollBehavior =
    smooth && !window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "smooth" : "auto";
  const port = scrollportOf(el);
  if (port) port.scrollTo({ top, behavior });
  else window.scrollTo({ top, behavior });
}

/**
 * Freeze the scroller behind a modal and return the undo.
 *
 * The web version compensated for the vanishing scrollbar with a body padding,
 * which is still right when the document is the scroller; when it is a div, the
 * same compensation goes on the div instead. Overlay scrollbars (the launcher's
 * webview on macOS, and any browser configured that way) report a width of 0
 * and get no padding, which is correct rather than a special case.
 */
export function lockScrollport(el: Element | null): () => void {
  const port = scrollportOf(el);
  const target: HTMLElement = port ?? document.body;
  const gap = port
    ? port.offsetWidth - port.clientWidth
    : window.innerWidth - document.documentElement.clientWidth;
  const prevOverflow = target.style.overflow;
  const prevPadding = target.style.paddingRight;
  target.style.overflow = "hidden";
  if (gap > 0) {
    const current = parseFloat(getComputedStyle(target).paddingRight) || 0;
    target.style.paddingRight = `${current + gap}px`;
  }
  return () => {
    target.style.overflow = prevOverflow;
    target.style.paddingRight = prevPadding;
  };
}

/**
 * Restore a scroll offset on content that is still growing.
 *
 * Returning from a fiche to the grid re-renders three hundred cards whose art
 * loads lazily, so the scroller reaches its final height over many frames, not
 * in one. A single scroll issued too early is silently clamped to whatever the
 * page can reach at that instant — two animation frames put the player 860px
 * above where they left, and even a "wait until it is tall enough" check gave
 * up at 600ms and landed at 540 of 1400.
 *
 * So it FOLLOWS the growth: every frame it scrolls as far toward the target as
 * the content currently allows, and stops as soon as it arrives (or after ~2s,
 * so a genuinely shorter list settles instead of spinning).
 *
 * Only used where the host restores nothing itself (`MewNav.restoresScroll`),
 * so it never races a browser doing the same job.
 */
export function scrollPortToSettled(el: Element | null, top: number): void {
  if (top <= 0) return scrollPortTo(el, 0);
  const deadline = performance.now() + 2000;
  const attempt = () => {
    const port = scrollportOf(el);
    const reachable = port
      ? port.scrollHeight - port.clientHeight
      : document.documentElement.scrollHeight - window.innerHeight;
    scrollPortTo(el, Math.min(top, Math.max(0, reachable)));
    const arrived = reachable >= top;
    if (!arrived && performance.now() < deadline) requestAnimationFrame(attempt);
  };
  requestAnimationFrame(attempt);
}
