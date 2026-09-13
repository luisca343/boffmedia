import { useCallback, useEffect, useState } from "react";
import type { ArmorPiece, Charm, Decoration, Weapon, WishlistEntry } from "../../types";

export const WISHLIST_STORAGE_KEY = "mhw-wishlist-v1";

const listeners = new Set<() => void>();

export function wishlistKey(kind: WishlistEntry["kind"], id: string | number): string {
  return `${kind}:${String(id)}`;
}

export function weaponWishlistEntry(weapon: Pick<Weapon, "id" | "name" | "rarity" | "kind" | "gameId">): WishlistEntry {
  return {
    key: wishlistKey("weapon", weapon.id),
    kind: "weapon",
    id: String(weapon.id),
    name: weapon.name,
    rarity: weapon.rarity,
    weaponKind: weapon.kind,
    gameId: weapon.gameId,
  };
}

export function armorWishlistEntry(piece: Pick<ArmorPiece, "id" | "name" | "rarity" | "kind" | "rank">): WishlistEntry {
  return {
    key: wishlistKey("armor", piece.id),
    kind: "armor",
    id: String(piece.id),
    name: piece.name,
    rarity: piece.rarity,
    armorKind: piece.kind,
    rank: piece.rank,
  };
}

export function charmWishlistEntry(charm: Charm & { gameId?: number }): WishlistEntry {
  return {
    key: wishlistKey("charm", charm.id),
    kind: "charm",
    id: String(charm.id),
    name: charm.name,
    rarity: charm.rarity,
    gameId: charm.gameId ?? charm.charm.gameId,
    charmLevel: charm.level,
  };
}

export function decorationWishlistEntry(decoration: Pick<Decoration, "id" | "name" | "rarity" | "slot" | "gameId">): WishlistEntry {
  return {
    key: wishlistKey("decoration", decoration.id),
    kind: "decoration",
    id: String(decoration.id),
    name: decoration.name,
    rarity: decoration.rarity,
    gameId: decoration.gameId,
    decorationSlot: decoration.slot,
  };
}

const WISHLIST_KINDS = new Set<WishlistEntry["kind"]>(["weapon", "armor", "charm", "decoration"]);

export function readWishlist(): WishlistEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const value: unknown = JSON.parse(localStorage.getItem(WISHLIST_STORAGE_KEY) || "[]");
    if (!Array.isArray(value)) return [];
    return value.filter(
      (entry): entry is WishlistEntry =>
        !!entry &&
        typeof entry === "object" &&
        WISHLIST_KINDS.has((entry as WishlistEntry).kind) &&
        typeof (entry as WishlistEntry).key === "string" &&
        typeof (entry as WishlistEntry).id === "string" &&
        typeof (entry as WishlistEntry).name === "string",
    );
  } catch {
    return [];
  }
}

function publish(entries: WishlistEntry[]): void {
  try {
    localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(entries));
  } catch {
    /* The planner remains usable when browser storage is unavailable. */
  }
  for (const listener of listeners) listener();
}

export function useWishlist() {
  const [entries, setEntries] = useState<WishlistEntry[]>(readWishlist);

  useEffect(() => {
    const refresh = () => setEntries(readWishlist());
    listeners.add(refresh);
    window.addEventListener("storage", refresh);
    refresh();
    return () => {
      listeners.delete(refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const add = useCallback((entry: WishlistEntry) => {
    const current = readWishlist();
    if (current.some((item) => item.key === entry.key)) return;
    publish([...current, entry]);
  }, []);

  const addMany = useCallback((nextEntries: WishlistEntry[]) => {
    const current = readWishlist();
    const known = new Set(current.map((entry) => entry.key));
    const additions = nextEntries.filter((entry) => {
      if (known.has(entry.key)) return false;
      known.add(entry.key);
      return true;
    });
    if (additions.length) publish([...current, ...additions]);
  }, []);

  const remove = useCallback((key: string) => {
    const current = readWishlist();
    const next = current.filter((entry) => entry.key !== key);
    if (next.length !== current.length) publish(next);
  }, []);

  const toggle = useCallback((entry: WishlistEntry) => {
    const current = readWishlist();
    const exists = current.some((item) => item.key === entry.key);
    publish(exists ? current.filter((item) => item.key !== entry.key) : [...current, entry]);
  }, []);

  const clear = useCallback(() => {
    if (readWishlist().length) publish([]);
  }, []);

  const has = useCallback((key: string) => entries.some((entry) => entry.key === key), [entries]);

  return { entries, add, addMany, remove, toggle, clear, has };
}
