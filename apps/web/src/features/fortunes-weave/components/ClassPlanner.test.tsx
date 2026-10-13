// @vitest-environment jsdom
import { useState } from "react"
import { NextIntlClientProvider } from "next-intl"
import { afterEach, describe, expect, it } from "vitest"
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react"
import messages from "../../../../locales/en/tools/otros.json"
import { emptyClassPlan, WEAVE_CLASSES, type ClassRoute } from "../class-model"
import { ClassPlanner } from "./ClassPlanner"

afterEach(cleanup)
const characters = [{ id: "cai", name: "Cai", image: "/cai.webp" }, { id: "leda", name: "Leda", image: "/leda.webp" }]
const classes = WEAVE_CLASSES.filter((entry) => ["archer", "shido", "dancer", "bow-knight"].includes(entry.id))

function Harness() {
  const [plan, setPlan] = useState(emptyClassPlan)
  const assign = (route: ClassRoute, id: string, classId: string) => setPlan((previous) => {
    const assignments = { ...previous[route] }
    if (classId) assignments[id] = classId
    else delete assignments[id]
    return { ...previous, [route]: assignments }
  })
  return <NextIntlClientProvider locale="en" messages={messages}>
    <ClassPlanner classes={classes} characters={characters} plan={plan} onAssign={assign} />
  </NextIntlClientProvider>
}

describe("Class planner interactions", () => {
  it("plans independently by character and route and can remove a plan", () => {
    render(<Harness />)
    fireEvent.click(screen.getByRole("button", { name: "Plan Archer for Cai" }))
    expect(screen.getByRole("button", { name: "Cai: Archer" })).toBeTruthy()
    fireEvent.change(screen.getByRole("combobox", { name: "Route" }), { target: { value: "leda" } })
    expect(screen.getByRole("button", { name: "Cai: No class planned" })).toBeTruthy()
    fireEvent.click(screen.getByRole("button", { name: "Plan Dancer for Cai" }))
    fireEvent.click(screen.getByRole("button", { name: "Leda: No class planned" }))
    fireEvent.click(screen.getByRole("button", { name: "Plan Shido for Leda" }))
    expect(screen.getByRole("button", { name: "Cai: Dancer" })).toBeTruthy()
    fireEvent.change(screen.getByRole("combobox", { name: "Route" }), { target: { value: "cai" } })
    expect(screen.getByRole("button", { name: "Cai: Archer" })).toBeTruthy()
    fireEvent.click(screen.getByRole("button", { name: "Cai: Archer" }))
    fireEvent.click(screen.getByRole("button", { name: "Remove Archer from Cai’s plan" }))
    expect(screen.getByRole("button", { name: "Cai: No class planned" })).toBeTruthy()
  })

  it("keeps comparison picks through filters, limits to three and frees a slot on removal", () => {
    render(<Harness />)
    for (const name of ["Archer", "Shido", "Dancer"]) fireEvent.click(screen.getByRole("button", { name: "Compare " + name }))
    expect((screen.getByRole("button", { name: "Compare Bow Knight" }) as HTMLButtonElement).disabled).toBe(true)
    fireEvent.change(screen.getByRole("combobox", { name: "Weapon" }), { target: { value: "bow" } })
    const comparison = screen.getByRole("region", { name: "Side-by-side comparison" })
    expect(within(comparison).getByRole("article", { name: "Shido" })).toBeTruthy()
    fireEvent.click(within(comparison).getByRole("button", { name: "Remove Shido from comparison" }))
    expect((screen.getByRole("button", { name: "Compare Bow Knight" }) as HTMLButtonElement).disabled).toBe(false)
    fireEvent.click(screen.getByRole("button", { name: "Clear comparison" }))
    expect(screen.queryByRole("region", { name: "Side-by-side comparison" })).toBeNull()
  })
})
