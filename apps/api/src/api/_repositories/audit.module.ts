import { Global, Module } from '@nestjs/common';
import { DrizzleModule } from '@api/_utils/drizzle/drizzle.module';
import { AuditService } from './audit.service';
import { AuditRepository } from './boffmedia/audit.repository';

/**
 * Audit is cross-cutting, so it is provided once and globally.
 *
 * `AuditService` is injected from four unrelated domains (boffmedia, packs,
 * randomizer, gobierno) and, through `AuditoriaRepository`, from feature modules
 * that never mention audit at all — TaxiModule being the one that exposed this.
 * Declaring it per-module means every module that transitively reaches an audit
 * writer has to know to provide it, and missing one is not a type error or a
 * unit-test failure: it is a boot-time UnknownDependenciesException, which is
 * only ever found by actually starting the app.
 *
 * `@Global()` makes it available everywhere from a single AppModule import. The
 * four modules that already declare it locally keep working — a local provider
 * still wins, and the service is stateless, so a second instance costs nothing.
 */
@Global()
@Module({
  imports: [DrizzleModule],
  providers: [AuditService, AuditRepository],
  exports: [AuditService, AuditRepository],
})
export class AuditModule {}
