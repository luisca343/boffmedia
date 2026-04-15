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

  // Parse the body text once more to collect any @pkmn/sim types referenced
  // in method/function signatures (e.g. `pokemon: Pokemon`). These need to be
  // added to the import statement.
  const bodyWrapper = ts.createSourceFile(
    '__body__.ts',
    `const __x__ = ${extracted.bodyText}`,
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
  lines.push(importStatement);
  lines.push('');
  if (config.note) {
    lines.push(`// NOTE: ${config.note}`);
  }
  lines.push(`export const ${extracted.name}: ${primaryType} = ${extracted.bodyText};`);
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
