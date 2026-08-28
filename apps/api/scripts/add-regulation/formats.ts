/**
 * Reads format definitions out of Showdown's `config/formats.ts`.
 *
 * Formats are looked up by their exact upstream `name` because that is the only
 * stable handle: the sim derives a format's id by lowercasing the name and
 * dropping every non-alphanumeric character, and the `mod` a format points at
 * is free to change between regulations. Reg M-A moved from `champions` to
 * `championsregma` exactly that way, so resolving `mod` from upstream on every
 * run — rather than trusting what we generated last time — is what keeps an
 * existing regulation from silently inheriting a newer regulation's legality.
 */
import * as fs from 'fs';
import * as path from 'path';
import * as ts from 'typescript';

/** Mirrors the sim's own id derivation (`toID`). */
export function toFormatId(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '');
}

/** The subset of format fields we carry across. Everything else is dropped. */
export interface UpstreamFormat {
  name: string;
  mod?: string;
  gameType?: string;
  searchShow?: boolean;
  challengeShow?: boolean;
  tournamentShow?: boolean;
  bestOfDefault?: boolean;
  teraPreviewDefault?: boolean;
  ruleset?: string[];
  banlist?: string[];
  restricted?: string[];
  unbanlist?: string[];
}

const STRING_FIELDS = ['name', 'mod', 'gameType'] as const;
const BOOLEAN_FIELDS = [
  'searchShow',
  'challengeShow',
  'tournamentShow',
  'bestOfDefault',
  'teraPreviewDefault',
] as const;
const ARRAY_FIELDS = ['ruleset', 'banlist', 'restricted', 'unbanlist'] as const;

function literalString(node: ts.Node): string | undefined {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
    return node.text;
  }
  return undefined;
}

function literalBoolean(node: ts.Node): boolean | undefined {
  if (node.kind === ts.SyntaxKind.TrueKeyword) return true;
  if (node.kind === ts.SyntaxKind.FalseKeyword) return false;
  return undefined;
}

function literalStringArray(node: ts.Node): string[] | undefined {
  if (!ts.isArrayLiteralExpression(node)) return undefined;
  const out: string[] = [];
  for (const el of node.elements) {
    const s = literalString(el);
    // A non-literal element (spread, concat, computed) means we cannot
    // faithfully reproduce the array, so we drop the field rather than emit a
    // half-copy that looks authoritative.
    if (s === undefined) return undefined;
    out.push(s);
  }
  return out;
}

function readFormat(obj: ts.ObjectLiteralExpression): UpstreamFormat | null {
  const out: Record<string, unknown> = {};

  for (const prop of obj.properties) {
    if (!ts.isPropertyAssignment(prop)) continue;
    const key = ts.isIdentifier(prop.name)
      ? prop.name.text
      : literalString(prop.name);
    if (!key) continue;

    if ((STRING_FIELDS as readonly string[]).includes(key)) {
      const v = literalString(prop.initializer);
      if (v !== undefined) out[key] = v;
    } else if ((BOOLEAN_FIELDS as readonly string[]).includes(key)) {
      const v = literalBoolean(prop.initializer);
      if (v !== undefined) out[key] = v;
    } else if ((ARRAY_FIELDS as readonly string[]).includes(key)) {
      const v = literalStringArray(prop.initializer);
      if (v !== undefined) out[key] = v;
    }
  }

  if (typeof out.name !== 'string' || !out.name) return null;
  return out as unknown as UpstreamFormat;
}

/** Parses every format entry in `config/formats.ts`, keyed by derived format id. */
export function loadUpstreamFormats(repoDir: string): Map<string, UpstreamFormat> {
  const file = path.join(repoDir, 'config', 'formats.ts');
  const raw = fs.readFileSync(file, 'utf-8');
  const source = ts.createSourceFile(
    file,
    raw,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );

  const byId = new Map<string, UpstreamFormat>();

  const visit = (node: ts.Node): void => {
    if (ts.isObjectLiteralExpression(node)) {
      const format = readFormat(node);
      // Section headers are `{section: '...'}` with no name and are skipped by
      // readFormat returning null.
      if (format) {
        const id = toFormatId(format.name);
        if (id && !byId.has(id)) byId.set(id, format);
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(source);

  return byId;
}

/**
 * Walks a mod's `inherit` chain, nearest-ancestor last.
 *
 * `['championsregma', 'champions']` means championsregma inherits from
 * champions, so champions must be registered with the sim first.
 */
export function resolveModChain(repoDir: string, modId: string): string[] {
  const chain: string[] = [];
  const seen = new Set<string>();
  let current: string | undefined = modId;

  while (current) {
    if (seen.has(current)) {
      throw new Error(
        `Circular mod inheritance detected at "${current}" (chain: ${chain.join(' -> ')}).`,
      );
    }
    seen.add(current);
    chain.push(current);

    const scripts = path.join(repoDir, 'data', 'mods', current, 'scripts.ts');
    if (!fs.existsSync(scripts)) break;
    const match = /^\s*inherit\s*:\s*['"]([^'"]+)['"]/m.exec(
      fs.readFileSync(scripts, 'utf-8'),
    );
    // No `inherit` means the parent is the sim's base data, which we never
    // generate — the chain ends here.
    current = match ? match[1] : undefined;
  }

  return chain;
}
