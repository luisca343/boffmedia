"use client"

import { useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import { StatusIconv2 } from "./StatusIcon"
import Link from "next/link"
import { usePokemonStore } from "@/stores/pokemonStore"
import { Loading } from "@/components/smartrotom/Loading"
import { getItemSprite, getPokemonNameFromIdAndForm, getVisibility, PokedexStatus } from "../dexUtils"
import { usePokemonSprite } from "../_hooks/usePokemonSprite"
import { usePokedexData } from "@/hooks/usePokedexData"
import Image from "next/image"
import { useSpriteManifestStore } from "@/stores/spriteManifestStore"
import { getSpriteUrl } from "@/utils/spriteUtils"

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

export function PokemonSpriteLink({children, id, form, palette, width = 80, height = 80, pixelated = true, hide = false, showStatus = true, displayName = false, hideCaught = false, hideSeen = false }: PokemonSpriteLinkProps) {
  const {getPokemonStatus, getVisibility} = usePokedexData()
  const status = getPokemonStatus(id, form)
  const isVisible = getVisibility(id, form, hideCaught, hideSeen)

  if (!isVisible) return null

  return (
    <Link
      className="flex w-24 flex-col items-center rounded-sm text-center text-pk-surface-100 hover:bg-pk-surface-800 2xl:w-20"
      href={`/smartrotom/pokedex/entrada/${id}/${form}`}
    >
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
      />
    </Link>
  )
}

export function PokemonSprite({ 
  children, 
  id, 
  form, 
  palette, 
  width = 100, 
  height = 100, 
  url, 
  pixelated = true, 
  hide = false, 
  showStatus = false, 
  forceBlack = false, 
  displayName = false, 
  hideCaught = false, 
  hideSeen = false, 
  inverted = false, 
  className 
}: PokemonSpriteProps) {
  const t = useTranslations("pokedex")
  const { getPokemonStatus, getVisibility } = usePokedexData()
  const status = getPokemonStatus(id, form)
  const isVisible = getVisibility(id, form, hideCaught, hideSeen)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  
  useEffect(() => {
    // If URL is directly provided, use it
    if (url) {
      const formattedUrl = url.startsWith('http') || url.startsWith('/') 
        ? url 
        : `${url.replace(/\\/g, '/')}`;
      
      setImageUrl(formattedUrl);
      setIsLoading(false);
      return;
    }
    
    // Get sprite URL using the utility function
    const spriteUrl = getSpriteUrl({ id, form, palette });
    setImageUrl(spriteUrl || "/placeholder.svg");
    setIsLoading(false);
  }, [id, form, palette, url]);

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
          alt={t("sprite.pokemonAlt")}
          style={{ imageRendering: pixelated ? "pixelated" : "auto",  height: 'auto' }}
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
  const t = useTranslations("pokedex")
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
      alt={t("sprite.itemAlt")}
      style={{ imageRendering: "pixelated" }}
    />
  )
}

