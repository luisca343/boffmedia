import { PokeSprite } from "./PokeSprite"

interface SpriteSlot {
  dex: number
  name: string
}

interface TeamSpritesProps {
  slots: SpriteSlot[]
  size?: number
  max?: number
  gap?: number
  onSelect?: (slot: SpriteSlot) => void
}

export function TeamSprites({ slots, size = 32, max = 6, gap = 2, onSelect }: TeamSpritesProps) {
  return (
    <div className="flex" style={{ gap }}>
      {slots.slice(0, max).map((s, i) => {
        const sprite = <PokeSprite key={i} dex={s.dex} name={s.name} size={size} />
        if (onSelect) {
          return (
            <button
              key={i}
              type="button"
              className="cursor-pointer border-0 bg-transparent p-0 rounded hover:ring-2 hover:ring-secondary"
              title={s.name}
              onClick={(e) => { e.stopPropagation(); onSelect(s) }}
            >
              {sprite}
            </button>
          )
        }
        return <span key={i} title={s.name} className="inline-flex">{sprite}</span>
      })}
    </div>
  )
}
