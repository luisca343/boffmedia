/**
 * Durable tool data, and the queue of writes still owed to the server.
 *
 * This is the seam behind "every tool should do something useful with no
 * connection". `storage` (localStorage) is for conveniences a player would not
 * miss — a remembered filter, the last open tab. This is for the things they
 * WOULD miss: a card collection, a tracker's matches, anything they typed.
 *
 * The shape is deliberately two pieces, because offline-first is two problems:
 *
 * * `ToolDb` — what the tool knows. Write to it first and render from it, so
 *   the screen tells the truth about what the player just did whether or not
 *   the network was there for it.
 * * `ToolOutbox` — what the tool owes. Queue the API call beside the local
 *   write; the host replays it, in order, when the server can be reached.
 *
 * A tool that only reads (mhwilds, the seed finder) needs neither. A tool that
 * writes should use both, and should not treat a queued op as delivered — see
 * `flush`'s `rejected`.
 *
 * # What the hosts guarantee
 *
 * On the desktop this is SQLite under the app's data directory, replayed by
 * Rust (which is the only side that can read the session), so a queue survives
 * a webview cache clear, a reload and a restart. On the web it is IndexedDB
 * replayed by the page — same shape, weaker durability, which is the honest
 * limit of what a browser tab can promise.
 */

/** JSON-serialisable document storage, scoped to one tool. */
export interface ToolDb {
  get<T = unknown>(collection: string, id: string): Promise<T | null>;
  put(collection: string, id: string, value: unknown): Promise<void>;
  remove(collection: string, id: string): Promise<void>;
  /** Most recently written first. */
  list<T = unknown>(collection: string): Promise<Array<ToolDoc<T>>>;
  clear(collection: string): Promise<void>;
}

export interface ToolDoc<T = unknown> {
  id: string;
  value: T;
  /** Epoch ms of the last local write. */
  updatedAt: number;
}

export interface ToolOutboxOp {
  method: "POST" | "PUT" | "PATCH" | "DELETE";
  /** API path with a leading slash, e.g. `/tools/tcgp/collection/a1-001`. */
  path: string;
  body?: unknown;
  /**
   * Collapses superseded writes: a later op with the same key REPLACES an
   * earlier pending one, so a card nudged from 3 to 4 to 5 while offline sends
   * one PUT of 5 rather than three.
   *
   * Only correct for ops that carry the whole final state. An op that means
   * "add one" must NOT have a dedupe key — collapsing those loses writes.
   */
  dedupeKey?: string;
}

export interface ToolOutboxEntry extends ToolOutboxOp {
  opId: string;
  createdAt: number;
  attempts: number;
  lastError?: string | null;
}

export interface ToolOutboxRejection {
  opId: string;
  path: string;
  status: number;
  message: string;
}

export interface ToolFlushResult {
  sent: number;
  /**
   * Ops the server refused for good (a 4xx that is not 408/429). They are gone
   * from the queue and were never applied, so a tool that wrote optimistically
   * has to reconcile — this is the one field a caller must not ignore.
   */
  rejected: ToolOutboxRejection[];
  /** Still queued after this run. */
  remaining: number;
  /** Set when the run stopped early (no network, a 5xx), with the reason. */
  stopped?: string | null;
}

export interface ToolOutbox {
  /** Queue a write. Returns the op id, which is also its idempotency key. */
  enqueue(op: ToolOutboxOp): Promise<string>;
  pending(): Promise<ToolOutboxEntry[]>;
  /** Replay now. Hosts also do this on their own when the network returns. */
  flush(): Promise<ToolFlushResult>;
  /** Fires with the pending count whenever the queue changes. */
  subscribe(listener: (pending: number) => void): () => void;
}

/**
 * Both scoped by a namespace, which is the tool's id (`pokemon.tcgpocket`).
 * Namespacing is by convention rather than enforcement: every tool is
 * first-party code in one page, so this separates neighbours, it does not
 * defend against them.
 */
export interface ToolData {
  db(namespace: string): ToolDb;
  outbox(namespace: string): ToolOutbox;
}
