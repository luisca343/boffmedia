---
description: Shared types — auto-generated from OpenAPI, never manually edit
applyTo: "packages/shared/src/**/*.ts"
---

## CRITICAL: Auto-Generated Code

`packages/shared/src/` is **auto-generated** from the NestJS OpenAPI spec. NEVER manually edit these files.

## How Types Are Generated

1. NestJS server must be running on port 34301.
2. Run `pnpm generate:shared` (runs `openapi-typescript-codegen` against `http://localhost:34301/api-json`).
3. Output goes to `packages/shared/src/`.

## How to Add a New Type

1. Define the DTO/entity in NestJS with `@ApiProperty()` decorators.
2. Add `@ApiResponse()` decorators to the controller.
3. Start the API server (`pnpm dev:api`).
4. Run `pnpm generate:shared`.
5. Import the type in the client: `import { MyType } from '@boffmedia/shared'`.

## Client Usage

- TypeScript path alias `@boffmedia/shared` resolves to `packages/shared/src/index.ts`.
- Never redefine or duplicate these types on the client.
- Both `apps/web` and `apps/api` depend on `@boffmedia/shared` (workspace link).

## Package Config

- Entry: `./src/index.ts`
- Types: `./src/index.ts`
- Exports: `.` → `./src/index.ts`, `./roles` → `./src/roles.ts`
