import { useEffect, useRef } from "react";

/**
 * Trap and restore focus within a container dialog or modal.
 *
 * When the effect mounts (on dialog open), it:
 * 1. Saves the element that had focus before
 * 2. Finds all focusable elements in the container
 * 3. Traps keyboard Tab/Shift+Tab within the container
 * 4. Restores focus to the saved element on cleanup (when dialog closes)
 *
 * Pass the container ref and an optional initial focus element. If no initial
 * focus is provided, the first focusable element is focused. Cleanup is
 * automatic when the component unmounts or the container becomes null.
 *
 * Call sites: Picker (input focus), SetEditor (Picker usage)
 */
export function useFocusTrap(
  containerRef: React.RefObject<HTMLElement | null>,
  initialFocusRef?: React.RefObject<HTMLElement | null>
) {
  const savedFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Save the element that currently has focus
    savedFocusRef.current = (document.activeElement as HTMLElement) || null;

    // Get all focusable elements within the container
    const focusableElements = container.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const first = focusableElements[0];
    const last = focusableElements[focusableElements.length - 1];

    // Set initial focus: use provided ref, or focus the first element
    const initialFocus = initialFocusRef?.current || first;
    if (initialFocus) {
      initialFocus.focus();
    }

    // Trap Tab/Shift+Tab within the container
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;

      if (e.shiftKey) {
        // Shift+Tab on the first element wraps to the last
        if (document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        }
      } else {
        // Tab on the last element wraps to the first
        if (document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };

    container.addEventListener("keydown", handleKeyDown);

    // Cleanup: remove event listener and restore focus
    return () => {
      container.removeEventListener("keydown", handleKeyDown);
      if (savedFocusRef.current && document.body.contains(savedFocusRef.current)) {
        savedFocusRef.current.focus();
      }
    };
  }, [containerRef, initialFocusRef]);
}
