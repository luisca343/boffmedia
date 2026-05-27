import React from "react"
import { ScatterItem, ScatterPosition } from "../_ui/board-decor/ScatterConfig"
import { PostIt } from "../_ui/board-decor/PostIt"
import { NewspaperClipping } from "../_ui/board-decor/NewspaperClipping"
import { Polaroid } from "../_ui/board-decor/Polaroid"
import { Doodle } from "../_ui/board-decor/Doodle"
import { InkBlot } from "../_ui/board-decor/InkBlot"
import { WantedPoster } from "../_ui/board-decor/WantedPoster"

export interface ScatterLayerProps {
  items: ScatterItem[]
}

function positionStyle(p: ScatterPosition): React.CSSProperties {
  return {
    position: "absolute",
    top: p.top,
    bottom: p.bottom,
    left: p.left,
    right: p.right,
    zIndex: p.zIndex ?? 3,
    pointerEvents: "none",
  }
}

export function ScatterLayer({ items }: ScatterLayerProps) {
  return (
    <>
      {items.map((item) => {
        switch (item.type) {
          case "post-it":
            return (
              <div key={item.id} style={positionStyle(item.position)}>
                <PostIt
                  color={item.color}
                  tilt={item.tilt}
                  size={item.size}
                  footer={item.footer}
                >
                  {item.content}
                </PostIt>
              </div>
            )

          case "wanted-poster":
            return (
              <div key={item.id} style={positionStyle(item.position)}>
                <WantedPoster
                  name={item.name}
                  label={item.label}
                  emblem={item.emblem}
                  emblemColor={item.emblemColor}
                  reward={item.reward}
                  tilt={item.tilt}
                  width={item.width}
                />
              </div>
            )

          case "doodle":
            return (
              <div key={item.id} style={positionStyle(item.position)}>
                <Doodle kind={item.kind} tilt={item.tilt} size={item.size} />
              </div>
            )

          case "newspaper":
            return (
              <div key={item.id} style={positionStyle(item.position)}>
                <NewspaperClipping
                  headline={item.headline}
                  body={item.body}
                  source={item.source}
                  tilt={item.tilt}
                  width={item.width}
                />
              </div>
            )

          case "ink-blot":
            return (
              <div key={item.id} style={positionStyle(item.position)}>
                <InkBlot size={item.size} tilt={item.tilt} color={item.color} />
              </div>
            )

          case "polaroid":
            return (
              <div key={item.id} style={positionStyle(item.position)}>
                <Polaroid
                  caption={item.caption}
                  tilt={item.tilt}
                  size={item.size}
                  image={item.image}
                />
              </div>
            )

          default:
            return null
        }
      })}
    </>
  )
}
