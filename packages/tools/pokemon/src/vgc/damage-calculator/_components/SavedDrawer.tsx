"use client"

import * as React from "react"
import { useVgcT } from "../../i18n";
import { cn } from "@boffmedia/ui/cn"
import { Button, Icon, Input } from "@boffmedia/ui"
import { SideDrawer } from "./ui/SideDrawer"
import { Callout } from "./ui/Callout"
import { PokemonSprite } from "./ui/PokemonSprite"
import { useCalculatorStore } from "../_store/calculatorStore"

// save / load / delete team groups (localStorage-backed).
export function SavedDrawer({ onClose }: { onClose: () => void }) {
  const tv = useVgcT("calc")
  const ts = useVgcT("calc.saved")
  const { saved, team, poke1, poke2, saveGroup, deleteSaved, loadSavedAsTeam, hydrateFromStorage } = useCalculatorStore()
  const [name, setName] = React.useState("")

  React.useEffect(() => {
    hydrateFromStorage()
  }, [hydrateFromStorage])

  const save = () => {
    const n = name.trim()
    if (!n) return
    const pokeList = team.length ? team : [poke1, poke2]
    saveGroup(n, JSON.parse(JSON.stringify(pokeList)))
    setName("")
  }
  const load = (id: number) => {
    loadSavedAsTeam(id)
    onClose()
  }

  return (
    <SideDrawer title={ts("title")} icon="bookmark" onClose={onClose}>
      <div className="mb-4 flex gap-2">
        <Input
          value={name}
          placeholder={ts("namePlaceholder")}
          aria-label={ts("namePlaceholder")}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") save()
          }}
        />
        <Button size="sm" icon="bookmark" onClick={save}>
          {ts("saveButton")}
        </Button>
      </div>

      {saved.length === 0 && <Callout>{tv("ui.saveNote")}</Callout>}

      <div className="grid gap-2">
        {saved.map((s) => (
          <div key={s.id} className="flex items-stretch gap-1.5">
            <button
              type="button"
              onClick={() => load(s.id)}
              title={s.name}
              className={cn(
                "cut-tag cut-tag-edge [--cut-line:var(--line)] [--cut-tag:8px] flex min-w-0 flex-1 items-center gap-[10px] border border-solid border-line bg-base px-3 py-[10px] text-left",
                "transition-[border-color,background] duration-[140ms] hover:border-accent-line hover:bg-panel-2",
              )}
            >
              <span className="min-w-0 flex-1 truncate font-display text-[14px]/[1.1] font-bold uppercase tracking-[0.03em]">{s.name}</span>
              <span className="ml-auto flex flex-none gap-0.5">
                {(s.pokeList || []).slice(0, 6).map((p, i) => (
                  <PokemonSprite key={i} name={p.name} size={24} />
                ))}
              </span>
            </button>
            <button
              type="button"
              aria-label={`${ts("delete")} ${s.name}`}
              onClick={() => deleteSaved(s.id)}
              className="grid w-[26px] place-items-center border border-solid border-transparent text-txt-dim hover:border-[color-mix(in_srgb,var(--bad)_40%,transparent)] hover:text-bad"
            >
              <Icon name="trash" size={14} />
            </button>
          </div>
        ))}
      </div>
    </SideDrawer>
  )
}
