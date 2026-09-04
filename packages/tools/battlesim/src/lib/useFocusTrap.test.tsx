import { describe, it, expect, afterEach } from "vitest";
import { cleanup, fireEvent, render } from "@testing-library/react";
import * as React from "react";
import { useFocusTrap } from "./useFocusTrap";

// This package's vitest config does not set `globals: true`, so Testing
// Library never registers its automatic cleanup: without this every render
// stacks another copy in the document and the queries below find duplicates.
afterEach(cleanup);

/** A dialog shaped like the ones the teambuilder actually opens. */
function Dialog({ withInitial = true }: { withInitial?: boolean }) {
  const modalRef = React.useRef<HTMLDivElement | null>(null);
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  useFocusTrap(modalRef, withInitial ? inputRef : undefined);
  return (
    <div ref={modalRef} data-testid="modal">
      <input ref={inputRef} data-testid="search" />
      <button data-testid="first">first</button>
      <button data-testid="last">last</button>
    </div>
  );
}

function Harness({ open, withInitial }: { open: boolean; withInitial?: boolean }) {
  return (
    <div>
      <button data-testid="opener">opener</button>
      {open ? <Dialog withInitial={withInitial} /> : null}
    </div>
  );
}

describe("useFocusTrap", () => {
  it("moves focus into the dialog, to the element the caller nominated", () => {
    const { getByTestId } = render(<Harness open />);
    expect(document.activeElement).toBe(getByTestId("search"));
  });

  it("falls back to the first focusable element when none is nominated", () => {
    const { getByTestId } = render(<Harness open withInitial={false} />);
    // The input is first in DOM order, so it is also the fallback target.
    expect(document.activeElement).toBe(getByTestId("search"));
  });

  it("wraps Tab from the last element back to the first, so focus cannot leave", () => {
    const { getByTestId } = render(<Harness open />);
    const last = getByTestId("last");
    last.focus();
    expect(document.activeElement).toBe(last);

    fireEvent.keyDown(getByTestId("modal"), { key: "Tab" });

    // Without the trap, Tab would move to whatever follows the dialog.
    expect(document.activeElement).toBe(getByTestId("search"));
  });

  it("wraps Shift+Tab from the first element to the last", () => {
    const { getByTestId } = render(<Harness open />);
    const search = getByTestId("search");
    search.focus();

    fireEvent.keyDown(getByTestId("modal"), { key: "Tab", shiftKey: true });

    expect(document.activeElement).toBe(getByTestId("last"));
  });

  it("returns focus to whatever opened it when the dialog closes", () => {
    const { getByTestId, rerender } = render(<Harness open={false} />);
    const opener = getByTestId("opener");
    opener.focus();
    expect(document.activeElement).toBe(opener);

    rerender(<Harness open />);
    expect(document.activeElement).toBe(getByTestId("search"));

    rerender(<Harness open={false} />);

    // The point of the whole hook: a keyboard user is put back where they were,
    // not dumped at the top of the document.
    expect(document.activeElement).toBe(opener);
  });
});
