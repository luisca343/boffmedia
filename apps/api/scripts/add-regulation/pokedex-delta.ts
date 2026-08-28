/**
 * Builds the species backfill the Champions mod needs.
 *
 * @pkmn/sim ships its own snapshot of Showdown's data and lags master by some
 * margin. The Champions Megas live in Showdown's BASE `data/pokedex.ts` — the
 * Champions mod directory has never contained a `pokedex.ts` at all — so any
 * species newer than the installed sim is simply absent at runtime, and the
 * formats-data tiers that reference it resolve to nothing.
 *
 * We therefore emit only the species present upstream and missing from the
 * installed sim, and attach them to the root Champions mod so every descendant
 * mod inherits them. Emitting the whole upstream pokedex instead would work,
 * but it would shadow the sim's own species table with a frozen copy — sim
 * upgrades would then silently stop affecting species data.
 */
import * as fs from 'fs';
import * as path from 'path';
import * as ts from 'typescript';

export interface PokedexDelta {
  /** Synthetic Showdown-shaped source, ready for the shared converter. */
  source: string;
  /** Species ids included, in upstream order. */
  added: string[];
}

/**
 * @param repoDir  Showdown checkout root.
 * @param knownIds Species ids the installed @pkmn/sim already knows.
 */
export function buildPokedexDelta(
  repoDir: string,
  knownIds: ReadonlySet<string>,
): PokedexDelta {
  const file = path.join(repoDir, 'data', 'pokedex.ts');
  // Normalized so the sliced entry blocks carry LF like the rest of the output.
  const raw = fs.readFileSync(file, 'utf-8').replace(/\r\n/g, '\n');
  const source = ts.createSourceFile(
    file,
    raw,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );

  let table: ts.ObjectLiteralExpression | null = null;
  const findTable = (node: ts.Node): void => {
    if (table) return;
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name)) {
      if (
        node.name.text === 'Pokedex' &&
        node.initializer &&
        ts.isObjectLiteralExpression(node.initializer)
      ) {
        table = node.initializer;
        return;
      }
    }
    ts.forEachChild(node, findTable);
  };
  findTable(source);

  if (!table) {
    throw new Error(`Could not find "export const Pokedex" in ${file}.`);
  }

  const added: string[] = [];
  const blocks: string[] = [];

  for (const prop of (table as ts.ObjectLiteralExpression).properties) {
    if (!ts.isPropertyAssignment(prop)) continue;
    const id = ts.isIdentifier(prop.name)
      ? prop.name.text
      : ts.isStringLiteral(prop.name)
        ? prop.name.text
        : null;
    if (!id || knownIds.has(id)) continue;

    added.push(id);
    // Slice the original text so nested structure, comments and formatting
    // survive untouched; re-printing via the AST would reflow the whole entry.
    blocks.push(raw.slice(prop.getStart(source), prop.getEnd()));
  }

  // No type annotation: the shared converter falls back to the configured
  // ModdedSpeciesDataTable, which is the type we want on the output anyway.
  const synthetic =
    'export const Pokedex = {\n' +
    blocks.map((b) => `\t${b},`).join('\n') +
    '\n};\n';

  return { source: synthetic, added };
}
