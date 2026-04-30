## API Standards (NestJS)

- All request DTOs must use `class-validator` decorators.
- New DTOs/entities exposed in Swagger must include `@ApiProperty` (and controller responses should include `@ApiResponse`).
- Array Swagger decorators must use stable codegen style:
  - Object arrays: `@ApiProperty({ type: ModelClass, isArray: true })`
  - Primitive arrays: `@ApiProperty({ type: String, isArray: true })` or `Number`/`Boolean`
  - Avoid `type: [ModelClass]` for new code.
- Global `ValidationPipe` assumptions must be respected (`whitelist: true`, `forbidNonWhitelisted: true`).
- Do not mix TypeORM and Drizzle patterns inside the same module.
- Shared models are generated from OpenAPI in `packages/shared/src/`.
  - Never edit generated files manually.
  - After DTO/API schema changes, run `pnpm generate:shared`.
