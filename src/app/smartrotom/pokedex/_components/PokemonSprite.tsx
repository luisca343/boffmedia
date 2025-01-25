"use client"

import { useEffect, useState } from "react"
import { StatusIconv2 } from "./StatusIcon"
import { InternalLink } from "@/components/nav/Link"
import { usePokemonStore } from "@/stores/pokemonStore"
import { Loading } from "@/components/smartrotom/Loading"
import { getItemSprite, getPokemonImage, getPokemonNameFromIdAndForm, getPokemonSprite, PokedexStatus } from "../dexUtils"

export type PokemonSpriteProps = {
  children?: any
  id: number
  form: string
  palette: string
  width?: number
  height?: number
  pixelated?: boolean
  hide?: boolean
  showStatus?: boolean
  forceBlack?: boolean
  displayName?: boolean
  hideCaught?: boolean
  hideSeen?: boolean
}

export type PokemonSpriteLinkProps = PokemonSpriteProps & {
  text?: string
  link?: boolean
}

export function getVisibility(status: PokedexStatus, hideCaught: boolean, hideSeen: boolean) {
  if (hideCaught && status === PokedexStatus.CAUGHT) return false
  if (hideSeen && status === PokedexStatus.SEEN) return false
  return true
}

export function PokemonSpriteLink({
  children,
  id,
  form,
  palette,
  width = 80,
  height = 80,
  pixelated = true,
  hide = false,
  showStatus = true,
  displayName = false,
  hideCaught = false,
  hideSeen = false,
}: PokemonSpriteLinkProps) {
  const [spriteData, setSpriteData] = useState<{ url: string; type: string; status: PokedexStatus } | undefined>(
    undefined,
  )
  const { pokedexData } = usePokemonStore()

  useEffect(() => {
    if (!pokedexData) return
    if (pixelated) {
      getPokemonSprite(id, form, palette, hide, pokedexData).then((res) => {
        setSpriteData(res)
      })
    } else {
      getPokemonImage(id, form, palette, hide, pokedexData).then((res) => {
        setSpriteData(res)
      })
    }
  }, [pokedexData, id, form, palette, hide, pixelated])

  if (!spriteData || !pokedexData) return <Loading width={width} height={height} />
  if (!getVisibility(spriteData.status, hideCaught, hideSeen)) return null

  const spriteContent = (
    <PokemonSprite
      id={id}
      form={form}
      palette={palette}
      width={width}
      height={height}
      pixelated={pixelated}
      hide={hide}
      showStatus={showStatus}
      forceBlack={false}
      displayName={displayName}
      hideCaught={hideCaught}
      hideSeen={hideSeen}
    >
      {children}
    </PokemonSprite>
  )

  return (
    <InternalLink
      className="flex flex-col items-center hover:bg-surface-400 rounded-sm text-center w-24 2xl:w-20 text-surface-50"
      href={`/pokedex/entrada/${id}/${form}`}
    >
      {spriteContent}
    </InternalLink>
  )
}

export function PokemonSprite({
  children,
  id,
  form,
  palette,
  width = 100,
  height = 100,
  pixelated = true,
  hide = false,
  showStatus = false,
  forceBlack = false,
  displayName = false,
  hideCaught = false,
  hideSeen = false,
}: PokemonSpriteProps) {
  const [spriteData, setSpriteData] = useState<{ url: string; type: string; status: PokedexStatus } | undefined>(
    undefined,
  )
  const { pokedexData } = usePokemonStore()

  useEffect(() => {
    if (!pokedexData) return
    if (pixelated) {
      getPokemonSprite(id, form, palette, hide, pokedexData).then((res) => {
        setSpriteData(res)
      })
    } else {
      getPokemonImage(id, form, palette, hide, pokedexData).then((res) => {
        setSpriteData(res)
      })
    }
  }, [pokedexData, id, form, palette, hide, pixelated]) // Added form to dependencies

  if (!spriteData || !pokedexData) return <Loading width={width} height={height} />
  if (!getVisibility(spriteData.status, hideCaught, hideSeen)) return null
  return (
    <>
      <div
        style={{ width, maxHeight: height }}
        className={` relative ${spriteData?.type === "sprite" ? "mb-2 mt-[-0.5rem]" : ""}`}
      >
        <img
          width={width}
          height={height}
          src={spriteData?.url || "/placeholder.svg"}
          alt="pokemon"
          style={{ imageRendering: "pixelated" }}
          className={` ${spriteData.status === PokedexStatus.UNSEEN && hide || forceBlack ? "brightness-0" : ""}`}
        />
        {showStatus && (
          <div className="absolute top-1 right-1">
            <StatusIconv2 status={spriteData.status} palette={palette} width={width} height={height} />
          </div>
        )}
      </div>
      {displayName && <PokemonNameElement id={id} form={form} palette={palette} hide={hide} />}
      {children && <div className="text-xs hidden 2xl:block">{children}</div>}
    </>
  )
}

export function PokemonNameElement({
  id,
  form,
  palette,
  hide = true,
}: { id: number; form: string; palette: string; hide?: boolean }) {
  const { getPokemonByDex } = usePokemonStore()
  const [pokemon, setPokemon] = useState() as any

  useEffect(() => {
    if (!getPokemonByDex) return
    getPokemonByDex(id).then((p) => {
      setPokemon(p)
    })
  }, [getPokemonByDex, id])

  return <span className="text-xs text-white text-center">{getPokemonNameFromIdAndForm(id, form, pokemon)}</span>
}

export function ItemSprite({ name, width = 100, height = 100 }: { name: string; width?: number; height?: number }) {
  const [imageUrl, setImageUrl] = useState() as any
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    getItemSprite(name).then((img) => {
      setImageUrl(img)
      setLoaded(true)
    })
  }, [])

  if (!loaded) return <Loading width={width} height={height} />
  return (
    <img
      width={width}
      height={height}
      src={imageUrl?.url || "/placeholder.svg"}
      alt="item"
      style={{ imageRendering: "pixelated" }}
    />
  )
}

