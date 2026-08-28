/**
 * Core AST-based parser and transformer for converting Showdown mod TypeScript
 * files into @pkmn/sim-compatible mod files.
 *
 * Pipeline:
 *  1. parse()     – uses the TypeScript compiler API to understand the source
 *  2. transform() – maps Showdown type annotations to @pkmn/sim equivalents
 *  3. generate()  – emits clean PKMN/PS-format TypeScript source
 */

import * as path from 'path';
import * as ts from 'typescript';

import { FILE_CONFIGS, FileConfig, INDEX_EXPORT_ORDER, PKMN_SIM_EXPORTED_TYPES } from './config';

// ---------------------------------------------------------------------------
// Public result types
// ---------------------------------------------------------------------------

export interface ConversionResult {
  /** Original source file path. */
  sourceFile: string;
  /** Generated PKMN/PS-format TypeScript source, or null if skipped. */
  output: string | null;
  /** True when this file was intentionally skipped (no config, not found, etc.). */
  skipped: boolean;
  /** Human-readable reason for skipping. */
  reason?: string;
  /**
   * Types from @pkmn/sim that were detected in function-body signatures and
   * added to the generated import statement beyond the primary table type.
   */
  extraImports: string[];
  /** Config used for this file (for downstream index generation). */
  config: FileConfig | null;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Walks an AST node recursively and collects all identifier names that are
 * used as type references (e.g. `foo: SomeType`) AND are available as named
 * exports from `@pkmn/sim`.
 */
function collectTypeReferences(root: ts.Node): Set<string> {
  const refs = new Set<string>();

  function visit(node: ts.Node): void {
    if (ts.isTypeReferenceNode(node)) {
      const typeName = node.typeName;
      if (ts.isIdentifier(typeName) && PKMN_SIM_EXPORTED_TYPES.has(typeName.text)) {
        refs.add(typeName.text);
      }
    }
    ts.forEachChild(node, visit);
  }

  ts.forEachChild(root, visit);
  return refs;
}

/**
 * Resolves the PKMN/PS type name from a TypeScript type node, handling both:
 *  - Inline import types: `import('../../../sim/dex-abilities').ModdedAbilityDataTable`
 *  - Bare identifiers:    `ModdedBattleScriptsData`
 *
 * Returns null when the type cannot be resolved (e.g. complex union types).
 */
function resolveTypeName(typeNode: ts.TypeNode): string | null {
  // import('path').TypeName  (ImportTypeNode with optional qualifier)
  if (ts.isImportTypeNode(typeNode)) {
    const { qualifier } = typeNode;
    if (!qualifier) return null;
    if (ts.isIdentifier(qualifier)) return qualifier.text;
    // Qualified name: import('path').NS.TypeName → take right-most segment
    if (ts.isQualifiedName(qualifier)) return qualifier.right.text;
    return null;
  }

  // Bare type reference: ModdedBattleScriptsData
  if (ts.isTypeReferenceNode(typeNode)) {
    const { typeName } = typeNode;
    if (ts.isIdentifier(typeName)) return typeName.text;
  }

  return null;
}

/**
 * Finds the first exported `const` declaration in a source file whose name
 * matches `expectedName`. Returns info needed for code generation.
 */
interface ExtractedDecl {
  name: string;
  resolvedTypeName: string | null;
  bodyText: string;
}

function extractExportedConst(
  sourceFile: ts.SourceFile,
  rawSource: string,
  expectedName: string,
): ExtractedDecl | null {
  for (const stmt of sourceFile.statements) {
    if (!ts.isVariableStatement(stmt)) continue;

    const isExported = stmt.modifiers?.some(
      (m) => m.kind === ts.SyntaxKind.ExportKeyword,
    );
    if (!isExported) continue;

    for (const decl of stmt.declarationList.declarations) {
      if (!ts.isIdentifier(decl.name)) continue;
      if (decl.name.text !== expectedName) continue;

      const typeName = decl.type ? resolveTypeName(decl.type) : null;

      // Extract the initializer text verbatim (preserves all nested logic,
      // comments, and formatting from the original source).
      const bodyText = decl.initializer
        ? rawSource.slice(
            decl.initializer.getStart(sourceFile),
            decl.initializer.getEnd(),
          )
        : '{}';

      return { name: decl.name.text, resolvedTypeName: typeName, bodyText };
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Showdown-only field stripping
// ---------------------------------------------------------------------------

/**
 * Fields present in Pokémon Showdown source data that have no counterpart in
 * the @pkmn/sim TypeScript types. Keeping them causes TS2561 "unknown property"
 * errors. They are safe to drop because @pkmn/sim never reads them at runtime.
 *
 * Keyed by the file base name so we only strip fields relevant to that table.
 */
const SHOWDOWN_ONLY_FIELDS: Readonly<Record<string, ReadonlyArray<string>>> = {
  'pokedex.ts': [
    'isCosmeticForme', // runtime marker; cosmetic forms are listed via cosmeticFormes on base
  ],
};

/**
 * Removes lines that consist solely of a Showdown-internal property assignment
 * (e.g. `\t\tisCosmeticForme: true,`) from the body text of a data table entry.
 * Only strips fields registered in SHOWDOWN_ONLY_FIELDS for the given file.
 */
function stripShowdownOnlyFields(bodyText: string, fileName: string): string {
  const fields = SHOWDOWN_ONLY_FIELDS[fileName];
  if (!fields || fields.length === 0) return bodyText;

  // Build a regex that matches any indentation + field: value, line
  const pattern = new RegExp(
    `^[ \\t]*(${fields.map((f) => f.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})\\s*:.*,?\\s*$`,
    'gm',
  );
  return bodyText.replace(pattern, '');
}


/**
 * Strips cosmetic-form stubs from a Showdown Pokédex body.
 *
 * In the Showdown source, cosmetic formes (e.g. Burmy-Sandy, Vivillon-Polar)
 * are stored as minimal stubs — `{ name, baseSpecies, forme, color }` — because
 * they share all battle stats with the base species.  @pkmn/sim's
 * `ModdedSpeciesData` does NOT allow partial entries (it requires `num`, `types`,
 * `abilities`, `baseStats`, etc.), so these stubs cause TS2322 errors.
 *
 * They are also unnecessary in a mod: the base-gen dex already knows about
 * cosmetic formes via `cosmeticFormes` on the base species.  We can safely
 * remove them from the mod table.
 *
 * Only applied when fileName is 'pokedex.ts'.
 */
function stripCosmeticFormStubs(bodyText: string, fileName: string): string {
  if (fileName !== 'pokedex.ts') return bodyText;

  // Walk the body text brace-by-brace, collecting top-level entry blocks and
  // dropping the ones that look like cosmetic stubs (have baseSpecies + forme
  // but no num or types).
  const lines = bodyText.split('\n');
  const out: string[] = [];
  let removedCount = 0;

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    // A top-level entry starts with optional whitespace + identifier + ': {'
    if (/^[ \t]+\w+:\s*\{/.test(line)) {
      const blockLines: string[] = [line];
      let depth = (line.match(/\{/g) || []).length - (line.match(/\}/g) || []).length;
      i++;
      while (i < lines.length && depth > 0) {
        const l = lines[i];
        depth += (l.match(/\{/g) || []).length;
        depth -= (l.match(/\}/g) || []).length;
        blockLines.push(l);
        i++;
      }
      const block = blockLines.join('\n');
      const hasBase = block.includes('baseSpecies:');
      const hasForme = block.includes('forme:');
      const hasNum = /\bnum\s*:/.test(block);
      const hasTypes = block.includes('types:');
      if (hasBase && hasForme && !hasNum && !hasTypes) {
        removedCount++;
        // drop the block
      } else {
        out.push(...blockLines);
      }
    } else {
      out.push(line);
      i++;
    }
  }

  if (removedCount > 0) {
    console.log(`    [pokedex] Stripped ${removedCount} cosmetic-form stubs`);
  }
  return out.join('\n');
}

/**
 * True when a converted table contains any executable code — a method, a
 * function expression or an arrow — as opposed to being pure data.
 *
 * Pure tables (pokedex, learnsets, formats-data) type-check cleanly and are left
 * fully checked; only the code-bearing ones get a suppression header.
 */
function containsExecutableCode(root: ts.Node): boolean {
  let found = false;
  const visit = (node: ts.Node): void => {
    if (found) return;
    if (
      ts.isMethodDeclaration(node) ||
      ts.isFunctionExpression(node) ||
      ts.isArrowFunction(node) ||
      ts.isFunctionDeclaration(node)
    ) {
      found = true;
      return;
    }
    ts.forEachChild(node, visit);
  };
  visit(root);
  return found;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Converts a single Showdown mod TypeScript file to @pkmn/sim format.
 *
 * @param filePath  Absolute path to the source file (used for config lookup
 *                  and TypeScript parsing diagnostics).
 * @param rawSource Raw TypeScript source text.
 */
export function convertFile(filePath: string, rawSource: string): ConversionResult {
  const baseName = path.basename(filePath);
  const config = FILE_CONFIGS[baseName] ?? null;

  if (!config) {
    return {
      sourceFile: filePath,
      output: null,
      skipped: true,
      reason: `No conversion config for "${baseName}". Add an entry to config.ts to handle this file.`,
      extraImports: [],
      config: null,
    };
  }

  // ── Parse ──────────────────────────────────────────────────────────────────
  const sourceFile = ts.createSourceFile(
    filePath,
    rawSource,
    ts.ScriptTarget.Latest,
    /* setParentNodes */ true,
    ts.ScriptKind.TS,
  );

  const extracted = extractExportedConst(sourceFile, rawSource, config.exportName);
  if (!extracted) {
    return {
      sourceFile: filePath,
      output: null,
      skipped: true,
      reason: `Could not find "export const ${config.exportName}" in ${baseName}.`,
      extraImports: [],
      config,
    };
  }

  // ── Transform ──────────────────────────────────────────────────────────────
  // Prefer the type name resolved from the source annotation; fall back to the
  // configured default so the tool remains correct even when the source adds a
  // new type annotation style.
  const primaryType = extracted.resolvedTypeName ?? config.pkmnType;

  // Strip Showdown-internal fields that have no equivalent in @pkmn/sim types.
  // These are properties used by the Showdown runtime or data pipeline that are
  // not part of the exported ModdedSpeciesData / ModdedMoveData etc. interfaces.
  let bodyText = stripShowdownOnlyFields(extracted.bodyText, baseName);
  bodyText = stripCosmeticFormStubs(bodyText, baseName);

  // Parse the body text once more to collect any @pkmn/sim types referenced
  // in method/function signatures (e.g. `pokemon: Pokemon`). These need to be
  // added to the import statement.
  const bodyWrapper = ts.createSourceFile(
    '__body__.ts',
    `const __x__ = ${bodyText}`,
    ts.ScriptTarget.Latest,
    /* setParentNodes */ true,
    ts.ScriptKind.TS,
  );
  const extraTypeRefs = collectTypeReferences(bodyWrapper);
  // The primary type is already in the import; remove it from extras.
  extraTypeRefs.delete(primaryType);
  const extraImports = [...extraTypeRefs].sort();

  // ── Generate ───────────────────────────────────────────────────────────────
  const allImportedTypes = [primaryType, ...extraImports];
  const importStatement = `import type {${allImportedTypes.join(', ')}} from '@pkmn/sim';`;

  const lines: string[] = [];

  // Showdown's battle handlers rely on `this` rebinding and on effect fields
  // that @pkmn/sim's Modded* interfaces do not declare, so a code-bearing table
  // cannot type-check against them however it is annotated. This is vendored
  // upstream source, not ours, and every upstream release adds handlers — so
  // suppress on any table that carries executable code rather than curating a
  // list of file names that silently falls behind.
  if (containsExecutableCode(bodyWrapper)) {
    lines.push('/* eslint-disable @typescript-eslint/ban-ts-comment */');
    lines.push(
      `// @ts-nocheck — vendored Pokémon Showdown ${baseName.replace(/\.ts$/, '')} ` +
        `mod table: battle-engine callbacks are not statically typeable against @pkmn/sim.`,
    );
  }

  lines.push(importStatement);
  lines.push('');
  if (config.note) {
    lines.push(`// NOTE: ${config.note}`);
  }
  lines.push(`export const ${extracted.name}: ${primaryType} = ${bodyText};`);
  lines.push('');

  return {
    sourceFile: filePath,
    output: lines.join('\n'),
    skipped: false,
    extraImports,
    config,
  };
}

/**
 * Generates an `index.ts` barrel file that re-exports all processed PKMN/PS
 * mod tables in the order expected by @pkmn/sim.
 *
 * @param processedFiles  List of source file paths that were successfully converted.
 */
export function generateIndex(processedFiles: string[]): string {
  // Build a set of base names that were actually converted.
  const converted = new Set(processedFiles.map((f) => path.basename(f)));

  const lines: string[] = [];

  for (const fileName of INDEX_EXPORT_ORDER) {
    if (!converted.has(fileName)) continue;

    const fileConfig = FILE_CONFIGS[fileName];
    if (!fileConfig || !fileConfig.inIndex) continue;

    const moduleName = `./${path.basename(fileConfig.outputFile, '.ts')}`;
    const exportClause = fileConfig.indexExportAs
      ? `{${fileConfig.exportName} as ${fileConfig.indexExportAs}}`
      : `{${fileConfig.exportName}}`;

    lines.push(`export ${exportClause} from '${moduleName}';`);
  }

  lines.push('');
  return lines.join('\n');
}

/**
 * Validates the generated output by checking structural invariants:
 *  - The file imports from '@pkmn/sim'
 *  - The file exports the expected constant name
 *
 * Returns a list of validation error messages (empty = valid).
 */
export function validateOutput(output: string, config: FileConfig): string[] {
  const errors: string[] = [];

  if (!output.includes("from '@pkmn/sim'")) {
    errors.push(`Missing import from '@pkmn/sim'`);
  }

  const exportPattern = new RegExp(
    `export\\s+const\\s+${config.exportName}\\s*:`,
  );
  if (!exportPattern.test(output)) {
    errors.push(`Missing "export const ${config.exportName}:" declaration`);
  }

  return errors;
}
