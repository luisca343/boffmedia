import { describe, expect, it } from "vitest"
import { handleSpriteError, SPRITE_FALLBACK_URL, spriteUrl } from "../types"

function createSpriteEvent(src: string) {
  const image = {
    src,
    dataset: {} as DOMStringMap,
    style: { visibility: "" } as CSSStyleDeclaration,
  } as unknown as HTMLImageElement

  return {
    image,
    event: { currentTarget: image } as Parameters<typeof handleSpriteError>[0],
  }
}

describe("handleSpriteError", () => {
  it("ends on a visible inline fallback when every remote candidate fails", () => {
    const { image, event } = createSpriteEvent(spriteUrl("Kommo-o"))

    handleSpriteError(event)
    expect(image.src).toContain("/sprites/home-centered/kommoo.png")

    handleSpriteError(event)
    expect(image.src).toBe("https://play.pokemonshowdown.com/sprites/dex/substitute.png")

    handleSpriteError(event)
    expect(image.src).toBe(SPRITE_FALLBACK_URL)
  })

  it("hides the element instead of restoring a broken glyph if the inline fallback fails", () => {
    const { image, event } = createSpriteEvent(SPRITE_FALLBACK_URL)
    image.dataset.pokemonSpriteFallback = "final"

    handleSpriteError(event)

    expect(image.style.visibility).toBe("hidden")
  })
})
