---
description: NestJS API standards — controllers, services, DTOs, validation, Swagger
applyTo: "apps/api/**/*.ts"
---

## Module Structure

- Each domain module lives in `apps/api/src/api/{domain}/`.
- Register new modules in `apps/api/src/app.module.ts`.
- Use NestJS dependency injection — no manual instantiation.

## DTOs & Validation

- All request DTOs MUST use `class-validator` decorators (`@IsString`, `@IsNumber`, `@IsOptional`, etc.).
- All DTOs and entities MUST include `@ApiProperty()` decorators for Swagger generation.
- Array style: `@ApiProperty({ type: ModelClass, isArray: true })` — NOT `type: [ModelClass]`.
- Controller responses MUST use `@ApiResponse({ status: 200, type: ResponseDto })`.
- Global `ValidationPipe` has `whitelist: true` + `forbidNonWhitelisted: true` — extra properties are silently stripped or rejected.

## ORM Rules

- **TypeORM**: Used for older entity-based modules. Entities use `@Entity()`, `@Column()` decorators.
- **Drizzle**: Used for newer modules. Schemas in `apps/api/src/_db/schema/`. Type-safe, zero runtime.
- **DO NOT mix** TypeORM and Drizzle patterns within a single module.
- New modules should prefer Drizzle unless integrating with existing TypeORM entities.

## Drizzle Workflow

1. Define/update schema in `apps/api/src/_db/schema/`.
2. Run `pnpm --filter api generate` to create migration.
3. Run `pnpm --filter api migrate` to apply.
4. Drizzle config: `apps/api/drizzle.config.ts`.

## Swagger / OpenAPI

- Swagger UI: `http://localhost:34301/api` (dev only).
- Scalar reference: `http://localhost:34301/reference`.
- OpenAPI JSON: `http://localhost:34301/api-json`.
- This JSON feeds `pnpm generate:shared` to produce `packages/shared/src/`.

## Error Handling

- Global exception filter: `apps/api/src/common/filters/global-exception.filter.ts`.
- Use NestJS HTTP exceptions (`HttpException`, `NotFoundException`, etc.).

## Testing

- Unit tests: `pnpm --filter api test` (Jest, maxWorkers=1, 512MB worker limit).
- E2E tests: `pnpm --filter api test:e2e`.
- Coverage threshold: 40% branches/functions/lines/statements.
