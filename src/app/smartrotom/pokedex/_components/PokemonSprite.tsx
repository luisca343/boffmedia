"use client"

import { useEffect, useState } from "react"
import { StatusIconv2 } from "./StatusIcon"
import { InternalLink } from "@/components/nav/Link"
import { usePokemonStore } from "@/stores/pokemonStore"
import { Loading } from "@/components/smartrotom/Loading"
import { getItemSprite, getPokemonNameFromIdAndForm, getVisibility, PokedexStatus } from "../dexUtils"
import { usePokemonSprite } from "../_hooks/usePokemonSprite"
import { usePokedexData } from "@/hooks/usePokedexData"
import Image from "next/image"

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
  inverted?: boolean
  url?: string

  className?: string
}

export type PokemonSpriteLinkProps = PokemonSpriteProps & {
  text?: string
  link?: boolean
}

export function PokemonSpriteLink({children, id, form, palette, width = 80, height = 80, url, pixelated = true, hide = false, showStatus = true, displayName = false, hideCaught = false, hideSeen = false }: PokemonSpriteLinkProps) {
  const {getPokemonStatus, getVisibility} = usePokedexData()
  const status = getPokemonStatus(id, form)
  const isVisible = getVisibility(id, form, hideCaught, hideSeen)

  if (!isVisible) return null

  let spriteContent = null

  if (url) {
    spriteContent = (
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
        url={url}
      />
    )
  } else {
    spriteContent = (
      <PokemonSpriteOld
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
      />
    )
  }

  return (
    <InternalLink
      className="flex flex-col items-center hover:bg-surface-400 rounded-sm text-center w-24 2xl:w-20 text-surface-50"
      href={`/pokedex/entrada/${id}/${form}`}
    >
      {spriteContent}
    </InternalLink>
  )
}



export function PokemonSprite({ children, id, form, palette, width = 100, height = 100, url, pixelated = true, hide = false, showStatus = false, forceBlack = false, displayName = false, hideCaught = false, hideSeen = false, inverted = false, className }: PokemonSpriteProps) {
  const { getPokemonStatus, getVisibility } = usePokedexData()
  const status = getPokemonStatus(id, form)
  const isVisible = getVisibility(id, form, hideCaught, hideSeen)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  
  useEffect(() => {
    if (url) {
      const formattedUrl = url.startsWith('http') || url.startsWith('/') 
        ? url 
        : `${url.replace(/\\/g, '/')}`;
      
      setImageUrl(formattedUrl)
      setIsLoading(false)
      return
    }
    
    setImageUrl("/placeholder.svg")
    setIsLoading(false)
}, [id, form, palette, url])

  if (isLoading) return <Loading width={width} height={height} />
  if (!isVisible) return null

  return (
    <>
      <div
        style={{ width, maxHeight: height }}
        className={`relative ${className}`}
      >
        <Image
          width={width}
          height={height}
          src={imageUrl || "/placeholder.svg"}
          alt="pokemon"
          style={{ imageRendering: pixelated ? "pixelated" : "auto" }}
          className={`${(status === PokedexStatus.UNSEEN && hide) || forceBlack ? `brightness-0 ${inverted ? "invert" : ""}` : ""}`}
        />
        {showStatus && (
          <div className="absolute top-1 right-1">
            <StatusIconv2 status={status} palette={palette} width={width} height={height} />
          </div>
        )}
      </div>
      {displayName && <PokemonNameElement id={id} form={form} palette={palette} hide={status === PokedexStatus.UNSEEN && hide} />}
      {children && <div className="text-xs hidden 2xl:block">{children}</div>}
    </>
  )
}

export function PokemonSpriteOld({ children, id, form, palette, width = 100, height = 100, url, pixelated = true, hide = false, showStatus = false, forceBlack = false, displayName = false, hideCaught = false, hideSeen = false, inverted = false, className }: PokemonSpriteProps) {
  const spriteData = usePokemonSprite(id, form, palette, hide, pixelated)

  if (!spriteData) return <Loading width={width} height={height} />
  if (!getVisibility(spriteData.status, hideCaught, hideSeen)) return null

  return (
    <>
      <div
        style={{ width, maxHeight: height }}
        className={`relative ${spriteData?.type === "sprite" ? "mb-2 mt-[-0.5rem]" : ""} ${className}`}
      >
        <img
          width={width}
          height={height}
          src={spriteData?.url || "/placeholder.svg"}
          alt="pokemon"
          style={{ imageRendering: "pixelated" }}
          className={`${(spriteData.status === PokedexStatus.UNSEEN && hide) || forceBlack ? `brightness-0 ${inverted ? "invert" : ""}` : ""}`}
        />
        {showStatus && (
          <div className="absolute top-1 right-1">
            <StatusIconv2 status={spriteData.status} palette={palette} width={width} height={height} />
          </div>
        )}
      </div>
      {displayName && <PokemonNameElement id={id} form={form} palette={palette} hide={spriteData.status === PokedexStatus.UNSEEN && hide} />}
      {children && <div className="text-xs hidden 2xl:block">{children}</div>}
    </>
  )
}

export function PokemonNameElement({
  id,
  form,
  palette,
  hide = false,
}: { id: number; form: string; palette: string; hide?: boolean }) {
  const { getPokemonByDex } = usePokemonStore()
  const [pokemon, setPokemon] = useState() as any

  useEffect(() => {
    if (!getPokemonByDex) return
    getPokemonByDex(id).then((p) => {
      setPokemon(p)
    })
  }, [getPokemonByDex, id, setPokemon]) // Added setPokemon to dependencies

  return <span className="text-xs text-white text-center">{hide ? '???' : getPokemonNameFromIdAndForm(id, form, pokemon)}</span>
}

export function ItemSprite({ name, width = 100, height = 100 }: { name: string; width?: number; height?: number }) {
  const [imageUrl, setImageUrl] = useState() as any
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    getItemSprite(name).then((img) => {
      setImageUrl(img)
      setLoaded(true)
    })
  }, [name]) // Added name to dependencies

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

