import { useState, useEffect } from 'react';

/**
 * The battle stage's target width.
 *
 * Inlined here rather than imported from the battle engine (2026-09-02). It
 * used to come from `@/app/battlesim/_utils/viewUtils`, which meant a global
 * web service depended on one tool's internals — backwards, and it broke
 * outright when that engine moved into `@boffmedia/tools-battlesim`. The rule
 * runs the other way: a tool package may depend on the host, never the host on
 * a tool. The package keeps its own copy in `src/lib/useViewportWidth.ts`; this
 * one serves the handful of web pages outside the tool that still size content
 * the same way.
 */
function getTargetWidth() {
  if (typeof window === 'undefined') return 1280;
  // Below the lg breakpoint the stage takes the full width (minus page padding);
  // on desktop it keeps the classic 65%-of-screen rule.
  if (window.innerWidth < 1024) return Math.max(280, Math.round(window.innerWidth - 32));
  return Math.round(window.screen.width * 0.60);
}

const useViewportWidth = () => {
    const [viewportWidth, setViewportWidth] = useState(0);

    useEffect(() => {
        const updateViewportWidth = () => {
            setViewportWidth(window.innerWidth);
        };

        updateViewportWidth();
        window.addEventListener('resize', updateViewportWidth);

        return () => {
            window.removeEventListener('resize', updateViewportWidth);
        };
    }, []);

    const targetW = getTargetWidth();
    const canvasWidth = viewportWidth > targetW ? targetW : viewportWidth;

    return [viewportWidth, canvasWidth];
};

export default useViewportWidth;
