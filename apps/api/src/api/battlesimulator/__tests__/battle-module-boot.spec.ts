import 'reflect-metadata';
import { BattleModule } from '../battle/battle.module';
import { BattlesimController } from '../battlesim.controller';

/**
 * Every dependency BattlesimController injects must be reachable from
 * BattleModule.
 *
 * THE BUG THIS EXISTS FOR. B14 added a `ReplayService` dependency to
 * `BattlesimController`. That is the N19/A6 trap, which has already shipped
 * twice in this repo: a class injects a provider whose module is not in
 * `imports`, the code type-checks perfectly, every unit spec passes because it
 * hands the class a hand-mocked dependency — and the API fails at BOOT on an
 * unresolvable dependency. `mail.module.ts` did exactly that in 147c8d2da.
 * `tsc` cannot see it, `check-layering` only greps for injection strings, and
 * specs construct providers directly, so all three go green on an application
 * that cannot start.
 *
 * WHY THIS IS STRUCTURAL RATHER THAN A REAL BOOT. Compiling the module through
 * `Test.createTestingModule` is the stronger check and was tried first: it
 * exhausts a 4 GB heap, because BattleModule transitively pulls in
 * Achievement, Packs, Auth and Liga. A gate that dies with an out-of-memory
 * abort is worse than no gate — N13 is the record of two agents reading
 * exactly that abort as a pre-existing environment quirk and reporting a pass
 * they had never seen. So this reads Nest's own decorator metadata instead:
 * no instantiation, no database, no heap risk, and it still fails for the one
 * reason that matters.
 *
 * WHAT IT DOES NOT COVER: only this module, and only constructor injection by
 * type. The general gate over all 27 DRIZZLE-injecting modules is still owed
 * (N19).
 */
describe('BattleModule — every injected dependency is reachable', () => {
  /** Providers a module declares directly. */
  const providersOf = (mod: unknown): unknown[] =>
    (Reflect.getMetadata('providers', mod as object) as unknown[]) ?? [];

  /** What a module makes available to modules that import it. */
  const exportsOf = (mod: unknown): unknown[] =>
    (Reflect.getMetadata('exports', mod as object) as unknown[]) ?? [];

  const importsOf = (mod: unknown): unknown[] =>
    (Reflect.getMetadata('imports', mod as object) as unknown[]) ?? [];

  it('resolves every BattlesimController constructor parameter', () => {
    const deps =
      (Reflect.getMetadata('design:paramtypes', BattlesimController) as unknown[]) ?? [];

    // A walk that finds nothing makes every assertion below vacuously true —
    // the A15/N21 failure mode. Assert the reflection actually read something.
    expect(deps.length).toBeGreaterThan(0);
    expect(deps).toContain(
      // The dependency B14 introduced, named explicitly so this test fails
      // loudly if the constructor is reordered or the param is dropped.
      require('@api/smartrotom/liga/services/replay.service').ReplayService,
    );

    // Everything BattleModule can inject: its own providers, plus whatever the
    // modules it imports export.
    const reachable = new Set<unknown>([
      ...providersOf(BattleModule),
      ...importsOf(BattleModule).flatMap((m) => exportsOf(m)),
    ]);

    const unreachable = deps.filter((d) => d && !reachable.has(d));

    expect(
      unreachable.map((d) => (d as { name?: string })?.name ?? String(d)),
    ).toEqual([]);
  });

  it('fails if LigaModule stops exporting the service, not just if the import goes', () => {
    // The import alone is not enough — a provider that a module does not
    // EXPORT is still unreachable from the importer.
    const { ReplayService } = require('@api/smartrotom/liga/services/replay.service');
    const { LigaModule } = require('@api/smartrotom/liga/liga.module');

    expect(importsOf(BattleModule)).toContain(LigaModule);
    expect(exportsOf(LigaModule)).toContain(ReplayService);
  });
});
