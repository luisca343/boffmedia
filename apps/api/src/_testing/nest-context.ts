import type { ArgumentsHost, ExecutionContext } from '@nestjs/common';

/**
 * One fake `ExecutionContext`/`ArgumentsHost` for the whole suite.
 *
 * Eight specs used to hand-roll their own object literal with exactly the two
 * or three methods their subject happened to call that day. When the filters
 * and interceptors started reading `getType()` — the guard that keeps them from
 * writing an HTTP response inside a Necord/Discord context — five of those
 * literals began throwing `TypeError: ... .getType is not a function`, and each
 * had to be found and patched separately. Everything Nest hands a guard,
 * interceptor or filter is answered here, so the next such addition breaks one
 * file instead of five.
 *
 * Deliberately NOT a `jest.Mocked<>`: these are plain closures, so a spec that
 * wants to assert on a call still passes its own `jest.fn()` in as the request
 * or response.
 */
export interface FakeNestContext {
  /** What `switchToHttp().getRequest()` returns. */
  request?: unknown;
  /** What `switchToHttp().getResponse()` returns. */
  response?: unknown;
  /** Route handler and controller class — the pair `Reflector` keys metadata
   *  on, so a spec exercising `@Roles`/`@SkipEnvelope` must pass the real ones. */
  handler?: unknown;
  cls?: unknown;
  /**
   * Nest's transport discriminator. Defaults to `'http'` because that is the
   * only branch most specs care about; pass `'ws'` or Necord's context name to
   * exercise the early return that stops a filter from calling
   * `response.status()` on something that is not an Express response.
   */
  type?: string;
}

export function fakeExecutionContext(
  opts: FakeNestContext = {},
): ExecutionContext {
  const { request = {}, response = {}, handler, cls, type = 'http' } = opts;

  const args = [request, response];
  const notHttp = (kind: string) => () => {
    throw new Error(
      `fakeExecutionContext: switchTo${kind}() was called on an http fake. ` +
        `Build the fake with { type: '${kind.toLowerCase()}' } and stub it explicitly.`,
    );
  };

  return {
    getType: () => type,
    getArgs: () => args,
    getArgByIndex: (index: number) => args[index],
    getHandler: () => handler,
    getClass: () => cls,
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => response,
      getNext: () => undefined,
    }),
    switchToRpc: notHttp('Rpc'),
    switchToWs: notHttp('Ws'),
  } as unknown as ExecutionContext;
}

/** Same object, narrowed. `ExecutionContext extends ArgumentsHost`, so filters
 *  (which only ever see the host) get the identical fake under the name their
 *  signature uses. */
export function fakeArgumentsHost(opts: FakeNestContext = {}): ArgumentsHost {
  return fakeExecutionContext(opts);
}
