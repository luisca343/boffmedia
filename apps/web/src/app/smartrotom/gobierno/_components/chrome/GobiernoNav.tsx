"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Icon, Seal } from "../ui"
import { NAV_GROUPS, hrefOf, type NavItem } from "../../_utils/nav"
import { DEPARTMENTS, TONES } from "../../_utils/tones"
import { useOfficer } from "../../_hooks/useOfficer"
import { useCounters } from "../../_hooks/queries"

export function GobiernoNav() {
  const pathname = usePathname()
  const { isAdmin } = useOfficer()
  const { data: counters } = useCounters()

  const isOn = (item: NavItem) => {
    const href = hrefOf(item.slug)
    return item.slug === "" ? pathname === href : pathname.startsWith(href)
  }

  return (
    // Desktop: a 244px column of grouped departments. Below md it becomes a horizontal
    // scroller — the group labels drop away and the items run in one strip.
    <nav
      aria-label="Departamentos"
      className="gt-scroll flex flex-none gap-1.5 overflow-x-auto border-b border-gt-line-strong bg-gradient-to-b from-[#f3ecdd] to-[#efe7d6] p-2 md:w-[244px] md:flex-col md:gap-0 md:overflow-x-visible md:overflow-y-auto md:border-b-0 md:border-r md:px-3 md:pb-2.5 md:pt-3.5 lg:w-[244px]"
    >
      {NAV_GROUPS.filter((g) => !g.restricted || isAdmin).map((group) => {
        const tone = TONES[DEPARTMENTS[group.dep].tone]
        return (
          <div key={group.dep} className="flex flex-none items-center gap-1.5 md:mb-3 md:block">
            <div className="hidden items-center gap-[7px] px-2.5 pb-[5px] pt-1.5 font-gt-mono text-[9.5px] font-bold uppercase tracking-[.2em] text-gt-ink-400 after:h-px after:flex-1 after:bg-gt-line after:content-[''] md:flex">
              {group.label}
              {group.restricted && <Icon name="lock" size={10} className="text-gt-ink-300" />}
            </div>

            {group.items.map((item) => {
              const on = isOn(item)
              const count = item.counter ? (counters?.[item.counter] ?? 0) : 0
              return (
                <Link
                  key={item.slug}
                  href={hrefOf(item.slug)}
                  aria-current={on ? "page" : undefined}
                  // The active item lifts onto bright paper and grows a department-coloured
                  // tab down its left edge — the same spine the cards use.
                  className={`relative flex flex-none items-center gap-2.5 whitespace-nowrap rounded-gt-sm border px-2.5 py-2 font-gt text-[13.5px] font-semibold transition-colors md:w-full ${
                    on
                      ? "gt-spine border-gt-line bg-gt-paper-0 text-gt-ink-900 shadow-gt-sm"
                      : "border-transparent text-gt-ink-600 hover:bg-gt-paper-1 hover:text-gt-ink-900"
                  }`}
                  style={on ? { ["--gt-dep" as string]: tone.css } : undefined}
                >
                  <Icon
                    name={item.icon}
                    size={17}
                    stroke={on ? 2.2 : 1.9}
                    className={`flex-none ${on ? tone.text : "text-gt-ink-400"}`}
                  />
                  <span className="flex-1 text-left">{item.label}</span>
                  {count > 0 && (
                    <span
                      className={`min-w-[18px] rounded-[9px] px-1.5 py-px text-center font-gt-mono text-[10px] font-bold tabular-nums ${
                        on ? `${tone.solidBg} text-white` : "bg-gt-paper-3 text-gt-ink-500"
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </Link>
              )
            })}
          </div>
        )
      })}

      <div className="mt-auto hidden border-t border-gt-line px-2.5 pb-1 pt-3 md:block">
        <div className="flex items-center gap-[7px]">
          <Seal size={26} ring={false} />
          <div className="font-gt-mono text-[9px] leading-normal text-gt-ink-400">
            Plataforma cívica
            <br />
            <span className="text-gt-ok">● Sistema operativo · v1.0</span>
          </div>
        </div>
      </div>
    </nav>
  )
}
