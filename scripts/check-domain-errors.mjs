#!/usr/bin/env node
// Domain error migration guard — counts services still importing Nest HTTP exceptions.
// Fails when the count grows or if a service imports both domain and HTTP errors.
// Goal: migrate services to throw domain errors instead of BadRequestException etc.
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, sep } from "node:path";

const ROOT = "apps/api/src";
// HTTP exceptions to track
const HTTP_EXCEPTIONS = [
  "BadRequestException",
  "ConflictException",
  "NotFoundException",
  "UnauthorizedException",
  "ForbiddenException",
];
// Prettier writes these imports across several lines:
//
//   import {
//     BadRequestException,
//   } from '@nestjs/common';
//
// so a line-oriented regex sees nothing. The first version of this guard used
// one and counted 35 of the 97 services that actually import an HTTP exception
// — a new service written with the default formatting would have slipped past
// it silently. Match the whole import block instead.
const NESTJS_COMMON_IMPORT = /import\s*(?:type\s*)?{([\s\S]*?)}\s*from\s*['"]@nestjs\/common['"]/g;

function importsHttpException(src) {
  for (const match of src.matchAll(NESTJS_COMMON_IMPORT)) {
    const named = match[1];
    if (HTTP_EXCEPTIONS.some((name) => named.includes(name))) return true;
  }
  return false;
}

const DOMAIN_ERROR_IMPORT = "domain-error";

const SKIP_DIRS = new Set(["node_modules", "dist", ".next", "generated"]);

// Services importing HTTP exceptions. This ratchets DOWN as services are migrated.
// 2026-09-04: users service migrated. 97 remain.
const HTTP_EXCEPTION_BASELINE = 97;

function serviceFiles(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) {
      if (!SKIP_DIRS.has(entry)) serviceFiles(path, out);
    } else if (entry.endsWith(".service.ts") && !entry.endsWith(".spec.ts")) {
      out.push(path);
    }
  }
  return out;
}

const violations = [];
const httpExceptionServices = [];
const mixedErrorServices = [];

for (const file of serviceFiles(ROOT)) {
  const src = readFileSync(file, "utf8");
  const hasHttpExceptions = importsHttpException(src);
  const hasDomainErrors = src.includes(DOMAIN_ERROR_IMPORT);

  if (hasHttpExceptions && hasDomainErrors) {
    // A service transitioning should not mix both error systems
    mixedErrorServices.push(file);
    violations.push(
      `${file}  imports both HTTP exceptions and domain errors — complete migration to one system`
    );
  }

  if (hasHttpExceptions) {
    httpExceptionServices.push(file);
  }
}

if (httpExceptionServices.length > HTTP_EXCEPTION_BASELINE) {
  violations.push(
    `HTTP exception imports grew ${HTTP_EXCEPTION_BASELINE} → ${httpExceptionServices.length} — baseline is a ratchet; migrate services to domain errors`
  );
} else if (httpExceptionServices.length < HTTP_EXCEPTION_BASELINE) {
  violations.push(
    `HTTP exception imports are down to ${httpExceptionServices.length} (baseline says ${HTTP_EXCEPTION_BASELINE}) — lower HTTP_EXCEPTION_BASELINE to ${httpExceptionServices.length} in scripts/check-domain-errors.mjs so the ratchet ratchets`
  );
}

console.log(
  `domain-errors: ${httpExceptionServices.length} service(s) importing Nest HTTP exceptions (baseline ${HTTP_EXCEPTION_BASELINE}); ${mixedErrorServices.length} mixing both error systems`
);

if (violations.length) {
  console.error(`\n✗ Domain error migration check failed (${violations.length}):\n`);
  for (const v of violations) console.error("  " + v);
  console.error("");
  process.exit(1);
}
console.log("✓ Domain errors: HTTP exception count within baseline");
