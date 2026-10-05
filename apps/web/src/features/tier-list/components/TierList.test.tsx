// @vitest-environment jsdom
import { createElement, useState } from "react"
import { NextIntlClientProvider, useTranslations } from "next-intl"
import { afterEach, describe, expect, it } from "vitest"
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react"
import { configureUi } from "@boffmedia/ui"
import messages from "../../../../locales/en/tier-lists.json"
import { TierList } from "./TierList"
import { fixture } from "../testing/fixtures"
import type { TierListDocument } from "../core/schema"
import { createDocument } from "../core/engine"

configureUi({ useTranslate: () => (key: string) => key, useTranslateRoot: () => useTranslations() })
afterEach(cleanup)
function mount(initial: TierListDocument, custom = false) {
  function Host() {
    const [doc, setDoc] = useState(initial)
    return createElement("div", { "data-testid": "embedded-page" },
      createElement("p", {}, "Unrelated host content"),
      createElement(TierList, { template: doc.template, instance: doc.instance, items: doc.items,
        onChange: (instance) => setDoc({ ...doc, instance }),
        renderItem: custom ? ({ item }) => createElement("span", {}, `Custom: ${item.name}`) : undefined,
      }))
  }
  return render(<NextIntlClientProvider locale="en" messages={messages}><Host /></NextIntlClientProvider>)
}
const row = (id: string) => document.querySelector(`[data-tier-row="${id}"]`) as HTMLElement

describe("embedded accessible board", () => {
  it("shows locked cards without drag instructions while other cards can join several rows", () => {
    const base = fixture("multi", { keepSourceVisible: true })
    const items = base.items.map((item) => item.id === "one" ? { ...item, fixedRowId: "s" } : item)
    mount(createDocument({ ...base.template, source: { type: "static", items }, initialPlacements: { s: ["one"] } }, items))
    const locked = within(row("s")).getByRole("button", { name: "Assign One" })
    expect(locked.getAttribute("aria-roledescription")).toBeNull()
    expect(locked.title).toBe("Locked to S")
    expect(within(row("source")).queryByRole("button", { name: "Assign One" })).toBeNull()
    fireEvent.click(locked)
    expect((screen.getByRole("checkbox", { name: "S" }) as HTMLInputElement).disabled).toBe(true)
    expect(screen.queryByRole("checkbox", { name: "A" })).toBeNull()
    expect(screen.queryByRole("button", { name: "Remove from all rows" })).toBeNull()
    fireEvent.click(screen.getByRole("button", { name: "Done" }))
    fireEvent.click(screen.getByRole("button", { name: "Assign Two" }))
    fireEvent.click(screen.getByRole("checkbox", { name: "S" }))
    fireEvent.click(screen.getByRole("checkbox", { name: "A" }))
    expect(screen.getByText("Assigned to: S, A")).toBeTruthy()
    fireEvent.click(screen.getByRole("button", { name: "Done" }))
    expect(within(row("s")).getByRole("button", { name: "Assign Two" })).toBeTruthy()
    expect(within(row("a")).getByRole("button", { name: "Assign Two" })).toBeTruthy()
    expect(screen.getByText("1 of 2 assigned")).toBeTruthy()
  })

  it("recovers from completed and filtered-empty collections", () => {
    const base = fixture()
    mount(createDocument({ ...base.template, initialPlacements: { s: ["one", "two", "three"] } }, base.items))
    expect(screen.getByText(/All items are assigned/)).toBeTruthy()
    fireEvent.click(screen.getByRole("button", { name: "Show all items" }))
    expect(within(row("source")).getAllByRole("button", { name: /^Assign / })).toHaveLength(3)
    fireEvent.change(screen.getByPlaceholderText("Search items…"), { target: { value: "missing" } })
    expect(screen.getByText("No matching items.")).toBeTruthy()
    fireEvent.click(screen.getByRole("button", { name: "Show all items" }))
    expect((screen.getByPlaceholderText("Search items…") as HTMLInputElement).value).toBe("")
    expect(within(row("source")).getAllByRole("button", { name: /^Assign / })).toHaveLength(3)
  })
  it("assigns, moves and reorders by click with no drag dependency", () => {
    mount(fixture())
    fireEvent.click(screen.getByRole("button", { name: "Assign One" }))
    fireEvent.click(screen.getByRole("radio", { name: "S" }))
    expect(within(row("s")).getByRole("button", { name: "Assign One" })).toBeTruthy()
    expect(within(row("source")).queryByRole("button", { name: "Assign One" })).toBeNull()
    fireEvent.click(screen.getByRole("button", { name: "Assign Two" }))
    fireEvent.click(screen.getByRole("radio", { name: "S" }))
    fireEvent.click(within(row("s")).getByRole("button", { name: "Assign Two" }))
    fireEvent.click(screen.getByRole("button", { name: "Move earlier" }))
    expect(within(row("s")).getAllByRole("button", { name: /^Assign / }).map((b) => b.getAttribute("aria-label"))).toEqual(["Assign Two", "Assign One"])
    fireEvent.click(screen.getByRole("radio", { name: "A" }))
    expect(within(row("s")).queryByRole("button", { name: "Assign Two" })).toBeNull()
    expect(within(row("a")).getByRole("button", { name: "Assign Two" })).toBeTruthy()
    expect(screen.getByText("Unrelated host content")).toBeTruthy()
  })
  it("keeps independent checkboxes, filters the source and supports custom rendering", () => {
    mount(fixture("multi", { keepSourceVisible: true }), true)
    fireEvent.click(within(row("source")).getByRole("button", { name: "Assign One" }))
    fireEvent.click(screen.getByRole("checkbox", { name: "S" }))
    fireEvent.click(screen.getByRole("checkbox", { name: "A" }))
    expect(within(row("s")).getByText("Custom: One")).toBeTruthy()
    expect(within(row("a")).getByText("Custom: One")).toBeTruthy()
    expect(within(row("source")).getByText("Custom: One")).toBeTruthy()
    fireEvent.click(screen.getByRole("checkbox", { name: "S" }))
    expect(within(row("s")).queryByText("Custom: One")).toBeNull()
    fireEvent.keyDown(document, { key: "Escape" })
    fireEvent.change(screen.getByPlaceholderText("Search items…"), { target: { value: "Two" } })
    expect(within(row("source")).getByText("Custom: Two")).toBeTruthy()
    expect(within(row("source")).queryByText("Custom: One")).toBeNull()
  })
  it("falls back cleanly after an image fails to load", () => {
    const doc = fixture()
    doc.items[0].image = "https://unconfigured.test/missing.png"
    mount(doc)
    fireEvent.error(screen.getByAltText("One"))
    expect(screen.queryByAltText("One")).toBeNull()
    expect(within(row("source")).getByRole("button", { name: "Assign One" }).textContent).toContain("One")
  })
  it("recovers assigned cards through All/Assigned and combines filters with search", () => {
    mount(fixture())
    const filter = screen.getByRole("combobox", { name: "Filter items" })
    expect((filter as HTMLSelectElement).value).toBe("unassigned")
    fireEvent.click(within(row("source")).getByRole("button", { name: "Assign One" }))
    fireEvent.click(screen.getByRole("radio", { name: "S" }))
    expect(within(row("source")).queryByRole("button", { name: "Assign One" })).toBeNull()
    fireEvent.change(filter, { target: { value: "all" } })
    expect(within(row("source")).getAllByRole("button", { name: /^Assign / })).toHaveLength(3)
    fireEvent.change(filter, { target: { value: "assigned" } })
    expect(within(row("source")).getAllByRole("button", { name: /^Assign / })).toHaveLength(1)
    fireEvent.change(screen.getByPlaceholderText("Search items…"), { target: { value: "Two" } })
    expect(within(row("source")).queryByRole("button", { name: "Assign One" })).toBeNull()
    fireEvent.change(screen.getByPlaceholderText("Search items…"), { target: { value: "" } })
    fireEvent.click(within(row("source")).getByRole("button", { name: "Assign One" }))
    fireEvent.click(screen.getByRole("radio", { name: "A" }))
    expect(within(row("a")).getByRole("button", { name: "Assign One" })).toBeTruthy()
    expect(within(row("s")).queryByRole("button", { name: "Assign One" })).toBeNull()
    fireEvent.change(filter, { target: { value: "unassigned" } })
    expect(within(row("source")).getAllByRole("button", { name: /^Assign / })).toHaveLength(2)
  })
})
