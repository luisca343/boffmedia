---
description: NestJS API standards for controllers, services, DTOs, guards, and database access
applyTo: "apps/api/**/*.ts"
---

## Module structure

- Each domain gets a module directory under `src/api/` with: `controller.ts`, `facade-service.ts`, `service.ts`, `module.ts`, `dto/`, `entities/`, `repositories/`.
- Register new modules in `app.module.ts` imports array.
- Use the facade service pattern: controller → facade → service/repository.

## DTOs & validation

- Every endpoint body/params/query requires a DTO class with `class-validator` decorators.
- Include `@ApiProperty()` on every DTO field for Swagger spec accuracy.
- Include `@ApiResponse()` on controller methods.
- The global `ValidationPipe` has `whitelist: true` and `forbidNonWhitelisted: true` — extra properties are rejected.

## Database

- **Drizzle** (preferred for new modules): schemas in `_db/schema/`, inject via `@Inject(DRIZZLE) db: MySql2Database`.
- **TypeORM** (legacy): entity-based modules in `_repositories/`. Do not add new TypeORM entities.
- Never mix both ORMs within a single module.
- Repository pattern: extend `BaseRepositoryImpl<T, CreateDto, UpdateDto>`, register with a DI token from `repository.token.ts`.

## Auth & roles

- Protected endpoints use `@UseGuards(JwtAuthGuard, RolesGuard)`.
- Role-restricted endpoints use `@Roles('BOFF_ADMIN')` decorator.
- Available roles: `BOFF_ADMIN`, `ROTOM_ADMIN`, `ROTOM_FURRET`.

## Error handling

- Throw domain-specific exceptions from `common/exceptions/app.exception.ts`.
- `GlobalExceptionFilter` handles formatting and logging.
- Use Pino logger (`this.logger.*`) — never `console.*`.

## Response format

- `ResponseInterceptor` wraps all responses in `{ success, statusCode, message, data }`.
- Use `ResponseService` for consistent response building.

## Testing

- Integration tests: `*.integration.spec.ts` for controller tests.
- Unit tests: `*.spec.ts` for services.
- Run with `pnpm --filter api test` (4GB heap, single worker).
