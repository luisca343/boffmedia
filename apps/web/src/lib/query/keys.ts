/**
 * The query-key convention for the Boffmedia surfaces on TanStack Query.
 *
 * ONE rule, and every key in `hooks/{events,forum,profile}` obeys it:
 *
 *     [domain, resource, ...ids, params?]
 *
 *   - `domain`   — the API area (`events` | `forum` | `profile`). ALWAYS first,
 *                  so `invalidateQueries({ queryKey: ["forum"] })` reaches every
 *                  forum query and nothing else.
 *   - `resource` — the endpoint noun (`list`, `thread`, `posts`, `trophies`…).
 *   - `ids`      — path identifiers, outermost first (categorySlug, then
 *                  threadId), so a partial prefix is still a meaningful scope.
 *   - `params`   — at most ONE object, always last, for query-string values.
 *
 * The reason `queryKey()` exists rather than hand-written arrays: React Query
 * hashes the key with a stable stringifier, but only over what it is given — a
 * param object carrying `undefined` values hashes DIFFERENTLY from the same
 * object without them (`{limit: 20, sort: undefined}` ≠ `{limit: 20}`), so two
 * callers asking for the same page would each get their own cache entry and
 * their own request. Normalising here is what makes deduplication actually
 * happen.
 */

/** API areas migrated to the query layer. Adding one here is the opt-in. */
export const QUERY_DOMAINS = ["events", "forum", "profile"] as const
export type QueryDomain = (typeof QUERY_DOMAINS)[number]

/** Values usable as a path identifier inside a key. */
export type QueryId = string | number | boolean | null | undefined

export type QueryParams = Record<string, unknown>

/**
 * What callers may PASS as params, which is deliberately wider than
 * {@link QueryParams}.
 *
 * A declared `interface` (EventFilters, ListThreadsParams…) is not assignable to
 * `Record<string, unknown>`: only type ALIASES get an implicit index signature,
 * interfaces do not, because a later declaration merge could add an
 * incompatible member. Typing the parameter as `Record<string, unknown>` would
 * therefore reject every real filter type in this codebase and push callers
 * into casts at each call site — which is where the `undefined` values this
 * module exists to normalise would quietly come back.
 */
export type QueryParamsInput = object

/**
 * Drops `undefined`/`null` entries and sorts what is left by key, so callers
 * that build the same request from different code paths land on one cache
 * entry. Returns `undefined` when nothing survives — an empty object is still a
 * distinct key segment, and `[.., {}]` must not differ from `[..]`.
 */
export function normalizeParams(params?: QueryParamsInput): QueryParams | undefined {
  if (!params) return undefined
  const entries = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
  if (entries.length === 0) return undefined
  return Object.fromEntries(entries)
}

/**
 * Builds a key that follows the convention above. `ids` keeps `null`/`undefined`
 * entries on purpose: a hook that is `enabled: false` while its id is missing
 * must NOT share a cache entry with the same hook once the id arrives.
 */
export function queryKey(
  domain: QueryDomain,
  resource: string,
  ids: readonly QueryId[] = [],
  params?: QueryParamsInput,
): readonly unknown[] {
  const normalized = normalizeParams(params)
  return normalized === undefined
    ? [domain, resource, ...ids]
    : [domain, resource, ...ids, normalized]
}

/** The whole domain, for a blanket invalidation after a cross-cutting write. */
export function domainKey(domain: QueryDomain): readonly unknown[] {
  return [domain]
}

/**
 * Convention check, used by the tests and safe to call from a dev assertion:
 * a key must start with a known domain followed by a non-empty resource string,
 * and may carry at most one object — as its last element.
 */
export function isConventionalQueryKey(key: readonly unknown[]): boolean {
  if (key.length < 2) return false
  if (!QUERY_DOMAINS.includes(key[0] as QueryDomain)) return false
  if (typeof key[1] !== "string" || key[1].length === 0) return false

  const objectIndexes = key
    .map((part, i) => (isPlainObject(part) ? i : -1))
    .filter((i) => i >= 0)
  if (objectIndexes.length > 1) return false
  if (objectIndexes.length === 1 && objectIndexes[0] !== key.length - 1) return false
  return true
}

function isPlainObject(value: unknown): value is QueryParams {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}
