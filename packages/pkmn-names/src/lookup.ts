/**
 * English display name in, localised display name out.
 *
 * ENGLISH IS THE KEY EVERYWHERE, and that is a rule rather than an
 * implementation detail. `@pkmn` names every move, ability and item in English,
 * the battle protocol speaks English, a Showdown paste is English and a replay
 * file is English. Translating on the way OUT — at the last moment, for display
 * only — means nothing upstream of a `<span>` ever holds a Spanish string, so no
 * team can be exported wrong, no choice can be sent wrong, and switching the
 * language cannot corrupt anything: it re-renders.
 *
 * A name with no entry is returned unchanged. That is the right failure: a
 * CAP move or a Gen 2 berry the tables do not carry shows its English name in a
 * Spanish sentence, which is legible, rather than an id or a blank.
 */

import { ES_ABILITIES, ES_ITEMS, ES_MOVES } from "./data/es.generated";
import type { PkmnNameLocale } from "./preference";

export type PkmnNameKind = "move" | "ability" | "item";

const ES: Record<PkmnNameKind, Record<string, string>> = {
  move: ES_MOVES,
  ability: ES_ABILITIES,
  item: ES_ITEMS,
};

/** `@pkmn`'s id: lowercase, letters and digits only. Kept in step with `toID`. */
export function pkmnNameId(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

export function pkmnName(kind: PkmnNameKind, english: string, locale: PkmnNameLocale): string {
  if (locale === "en" || !english) return english;
  return ES[kind][pkmnNameId(english)] ?? english;
}

/**
 * Every string a search box should accept for one thing — its English name and,
 * when there is one, its Spanish name.
 *
 * Both, ALWAYS, regardless of the current setting. Someone reading Spanish names
 * has years of typing `flamethrower` behind them, and someone reading English
 * ones may well be told "usa Lanzallamas" by a teammate; a search that answers
 * only in the language of the moment is a search that appears broken to whoever
 * is on the other side.
 */
export function pkmnSearchTerms(kind: PkmnNameKind, english: string): string[] {
  const spanish = ES[kind][pkmnNameId(english)];
  return spanish ? [english, spanish] : [english];
}

/** The three lookups bound to one locale, for a component that shows many names. */
export interface PkmnNameTable {
  locale: PkmnNameLocale;
  move(english: string): string;
  ability(english: string): string;
  item(english: string): string;
}

export function pkmnNameTable(locale: PkmnNameLocale): PkmnNameTable {
  return {
    locale,
    move: (english) => pkmnName("move", english, locale),
    ability: (english) => pkmnName("ability", english, locale),
    item: (english) => pkmnName("item", english, locale),
  };
}
