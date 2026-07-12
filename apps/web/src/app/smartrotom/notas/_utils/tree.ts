import type { NoteFolder } from "@boffmedia/shared";

export interface FolderNode extends NoteFolder {
  children: FolderNode[];
  depth: number;
}

/** A folder id plus all of its descendants (for "notes in this folder" views). */
export function descendants(folders: NoteFolder[], rootId: number): Set<number> {
  const childrenOf = new Map<number | null, NoteFolder[]>();
  for (const f of folders) {
    const key = f.parentId ?? null;
    (childrenOf.get(key) ?? childrenOf.set(key, []).get(key)!).push(f);
  }
  const out = new Set<number>();
  const walk = (id: number) => {
    out.add(id);
    for (const c of childrenOf.get(id) ?? []) walk(c.id);
  };
  walk(rootId);
  return out;
}

/** Nest a flat folder list into a tree (roots = null parent). */
export function buildFolderTree(folders: NoteFolder[]): FolderNode[] {
  const childrenOf = new Map<number | null, NoteFolder[]>();
  for (const f of folders) {
    const key = f.parentId ?? null;
    (childrenOf.get(key) ?? childrenOf.set(key, []).get(key)!).push(f);
  }
  const build = (parent: number | null, depth: number): FolderNode[] =>
    (childrenOf.get(parent) ?? []).map((f) => ({
      ...f,
      depth,
      children: build(f.id, depth + 1),
    }));
  return build(null, 0);
}
