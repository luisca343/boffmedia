#!/usr/bin/env ts-node
/**
 * CLI entry point for the Showdown → @pkmn/sim mod conversion tool.
 *
 * Usage:
 *   ts-node apps/api/scripts/convert-showdown-mod/index.ts <source-dir> <output-dir>
 *
 *   Or via the npm script (from apps/api/):
 *   pnpm convert-mod -- <source-dir> <output-dir>
 *
 * <source-dir>   Path to a Pokémon Showdown mod directory containing the
 *                original abilities.ts, moves.ts, scripts.ts, etc.
 *
 * <output-dir>   Path where the @pkmn/sim-compatible files will be written.
 *                Will be created if it does not exist.
 *
 * The tool:
 *   1. Reads every Showdown mod file it has a config entry for.
 *   2. Parses each file with the TypeScript compiler API.
 *   3. Rewrites type imports (inline `import('…').Type` → top-level
 *      `import type {Type} from '@pkmn/sim'`).
 *   4. Auto-detects any additional @pkmn/sim types used in method / function
 *      signatures and adds them to the import statement.
 *   5. Writes the converted files to <output-dir>.
 *   6. Generates an index.ts barrel file.
 *
 * Re-running the tool is safe; existing output files are overwritten.
 */

import * as fs from 'fs';
import * as path from 'path';

import { FILE_CONFIGS } from './config';
import { convertFile, generateIndex, validateOutput, ConversionResult } from './converter';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function printUsage(): void {
  console.log('Usage:');
  console.log(
    '  ts-node apps/api/scripts/convert-showdown-mod/index.ts <source-dir> <output-dir>',
  );
  console.log('');
  console.log('Options:');
  console.log('  --validate   Run structural validation on generated files (default: true)');
  console.log('  --dry-run    Parse and transform but do not write files');
}

function resolveDir(raw: string): string {
  return path.isAbsolute(raw) ? raw : path.resolve(process.cwd(), raw);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main(): void {
  // ── Parse argv ────────────────────────────────────────────────────────────
  const argv = process.argv.slice(2);
  const dryRun = argv.includes('--dry-run');
  const noValidate = argv.includes('--no-validate');
  const positional = argv.filter((a) => !a.startsWith('--'));

  if (positional.length < 2) {
    printUsage();
    process.exit(1);
  }

  const sourceDir = resolveDir(positional[0]);
  const outputDir = resolveDir(positional[1]);

  if (!fs.existsSync(sourceDir)) {
    console.error(`ERROR: Source directory not found: ${sourceDir}`);
    process.exit(1);
  }

  // ── Ensure output directory ───────────────────────────────────────────────
  if (!dryRun) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log(`Source : ${sourceDir}`);
  console.log(`Output : ${dryRun ? '(dry-run – no files written)' : outputDir}`);
  console.log('');

  // ── Convert each configured file ─────────────────────────────────────────
  const processedSourceFiles: string[] = [];
  let errorCount = 0;

  for (const fileName of Object.keys(FILE_CONFIGS)) {
    const sourcePath = path.join(sourceDir, fileName);

    if (!fs.existsSync(sourcePath)) {
      console.log(`  skip  ${fileName} (not present in source directory)`);
      continue;
    }

    let rawSource: string;
    try {
      rawSource = fs.readFileSync(sourcePath, 'utf-8');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error(`  ERROR ${fileName}: could not read file – ${msg}`);
      errorCount++;
      continue;
    }

    const result: ConversionResult = convertFile(sourcePath, rawSource);

    if (result.skipped || result.output === null) {
      console.log(`  skip  ${fileName}: ${result.reason}`);
      continue;
    }

    // ── Validate ─────────────────────────────────────────────────────────
    if (!noValidate) {
      const validationErrors = validateOutput(result.output, result.config!);
      if (validationErrors.length > 0) {
        console.error(`  ERROR ${fileName}: validation failed`);
        for (const err of validationErrors) {
          console.error(`         · ${err}`);
        }
        errorCount++;
        continue;
      }
    }

    // ── Write ─────────────────────────────────────────────────────────────
    const outputFile = path.join(outputDir, result.config!.outputFile);

    if (!dryRun) {
      try {
        fs.writeFileSync(outputFile, result.output, 'utf-8');
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error(`  ERROR ${fileName}: could not write output – ${msg}`);
        errorCount++;
        continue;
      }
    }

    const extraNote =
      result.extraImports.length > 0
        ? `  [+imports: ${result.extraImports.join(', ')}]`
        : '';
    console.log(`  done  ${fileName} → ${result.config!.outputFile}${extraNote}`);
    processedSourceFiles.push(path.basename(sourcePath));
  }

  // ── Generate & write index.ts ─────────────────────────────────────────────
  if (processedSourceFiles.length > 0) {
    // generateIndex expects base file names to match FILE_CONFIGS keys
    const indexContent = generateIndex(processedSourceFiles);
    const indexPath = path.join(outputDir, 'index.ts');

    if (!dryRun) {
      fs.writeFileSync(indexPath, indexContent, 'utf-8');
    }

    const exported = indexContent
      .split('\n')
      .filter((l) => l.startsWith('export'))
      .map((l) => l.replace(/^export\s*/, '').split(' ')[0]);
    console.log(`  done  index.ts (exports: ${exported.join(', ')})`);
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log('');
  console.log(
    `Converted ${processedSourceFiles.length} file(s).` +
      (errorCount > 0 ? `  ${errorCount} error(s) – review output above.` : ''),
  );

  if (errorCount > 0) process.exit(1);
}

main();
