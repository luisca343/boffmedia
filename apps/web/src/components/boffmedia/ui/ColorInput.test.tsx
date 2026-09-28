// @vitest-environment jsdom
import { createRef, useState } from "react"
import { afterEach, describe, expect, it } from "vitest"
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react"
import { ColorInput, Field } from "@boffmedia/ui"

afterEach(cleanup)

describe("shared color input", () => {
  it("keeps the selected color visible and forwards the accessible name and native ref", () => {
    const ref = createRef<HTMLInputElement>()
    function Form() {
      const [color, setColor] = useState("#f08080")
      return <Field label="Row color" hint="Choose a row color"><ColorInput ref={ref} value={color} onChange={(event) => setColor(event.target.value)} /></Field>
    }
    render(<Form />)
    const input = screen.getByLabelText("Row color") as HTMLInputElement
    expect(ref.current).toBe(input)
    expect(input.getAttribute("aria-describedby")).toBeTruthy()
    expect(input.parentElement?.querySelector<HTMLElement>("[data-color-swatch]")?.style.backgroundColor).toBe("rgb(240, 128, 128)")
    expect(input.parentElement?.style.backgroundColor).toBe("rgb(240, 128, 128)")
    expect(input.parentElement?.style.color).toBe("rgb(0, 0, 0)")
    fireEvent.change(input, { target: { value: "#123456" } })
    expect(screen.getByText("#123456")).toBeTruthy()
    expect(input.parentElement?.querySelector<HTMLElement>("[data-color-swatch]")?.style.backgroundColor).toBe("rgb(18, 52, 86)")
    expect(input.parentElement?.style.backgroundColor).toBe("rgb(18, 52, 86)")
    expect(input.parentElement?.style.color).toBe("rgb(255, 255, 255)")
  })

  it("updates an uncontrolled swatch and preserves native form submission and reset", async () => {
    const { container } = render(<form><ColorInput aria-label="Color" name="color" defaultValue="#abcdef" size="sm" /></form>)
    fireEvent.change(screen.getByLabelText("Color"), { target: { value: "#987654" } })
    expect(screen.getByText("#987654")).toBeTruthy()
    expect(new FormData(container.querySelector("form")!).get("color")).toBe("#987654")
    await act(async () => container.querySelector("form")!.reset())
    expect(screen.getByText("#abcdef")).toBeTruthy()
    expect(new FormData(container.querySelector("form")!).get("color")).toBe("#abcdef")
  })

  it("respects a disabled fieldset and Field error descriptions", () => {
    render(<fieldset disabled><Field label="Color" error="Color unavailable"><ColorInput value="#abcdef" /></Field></fieldset>)
    const input = screen.getByLabelText("Color")
    expect(input.matches(":disabled")).toBe(true)
    expect(input.getAttribute("aria-invalid")).toBe("true")
    expect(document.getElementById(input.getAttribute("aria-describedby")!)?.textContent).toBe("Color unavailable")
  })
})
