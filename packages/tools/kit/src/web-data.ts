/**
 * The browser implementation of `ToolData`: IndexedDB for the documents and the
 * queue, the page itself for the replay.
 *
 * IndexedDB rather than localStorage because a collection is not a setting —
 * it can be thousands of rows, it is written while the player works, and
 * localStorage's synchronous string bucket would both block the UI and run into
 * its own quota. Raw IndexedDB rather than Dexie because this package is the
 * host contract: it stays dependency-free so that adding it to a host is never
 * a dependency negotiation.
 *
 * Durability here is weaker than the desktop's SQLite and that is a property of
 * the platform, not an oversight: clearing site data takes the queue with it.
 * The desktop host is the one that can promise a queued write survives.
 */

import type {
  ToolData,
  ToolDb,
  ToolDoc,
  ToolFlushResult,
  ToolOutbox,
  ToolOutboxEntry,
  ToolOutboxOp,
  ToolOutboxRejection,
} from "./data";
import { ToolApiError } from "./host";
import type { ToolApi } from "./host";

const DB_NAME = "boffmedia.tools";
const DB_VERSION = 1;
const DOCS = "docs";
const OUTBOX = "outbox";

let opened: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (opened) return opened;
  opened = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(DOCS)) {
        // Composite key, so one tool's collection can be range-scanned without
        // reading anyone else's rows.
        db.createObjectStore(DOCS, { keyPath: ["ns", "collection", "id"] });
      }
      if (!db.objectStoreNames.contains(OUTBOX)) {
        const store = db.createObjectStore(OUTBOX, { keyPath: "opId" });
        store.createIndex("ns_createdAt", ["ns", "createdAt"]);
        // An entry with no `dedupeKey` is simply absent from this index —
        // IndexedDB skips records whose key path is undefined — which is
        // exactly the behaviour the SQLite side gets from a partial index.
        store.createIndex("ns_dedupe", ["ns", "dedupeKey"]);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("indexedDB open failed"));
  });
  return opened;
}

function tx<T>(
  store: string,
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<T> | void,
): Promise<T | undefined> {
  return openDb().then(
    (db) =>
      new Promise<T | undefined>((resolve, reject) => {
        const transaction = db.transaction(store, mode);
        const request = run(transaction.objectStore(store));
        let result: T | undefined;
        if (request) request.onsuccess = () => (result = request.result);
        transaction.oncomplete = () => resolve(result);
        transaction.onerror = () => reject(transaction.error);
        transaction.onabort = () => reject(transaction.error);
      }),
  );
}

function createWebDb(namespace: string): ToolDb {
  return {
    async get<T>(collection: string, id: string): Promise<T | null> {
      const row = await tx<{ value: T } | undefined>(DOCS, "readonly", (store) =>
        store.get([namespace, collection, id]),
      );
      return row?.value ?? null;
    },
    async put(collection, id, value) {
      await tx(DOCS, "readwrite", (store) =>
        store.put({ ns: namespace, collection, id, value, updatedAt: Date.now() }),
      );
    },
    async remove(collection, id) {
      await tx(DOCS, "readwrite", (store) => store.delete([namespace, collection, id]));
    },
    async list<T>(collection: string): Promise<Array<ToolDoc<T>>> {
      const range = IDBKeyRange.bound(
        [namespace, collection, ""],
        // `￿` is the conventional upper bound for a string range: no id
        // sorts above it, so the scan stops at this collection's last row
        // instead of walking into the next tool's.
        [namespace, collection, "￿"],
      );
      const rows =
        (await tx<Array<{ id: string; value: T; updatedAt: number }>>(DOCS, "readonly", (store) =>
          store.getAll(range),
        )) ?? [];
      return rows
        .map((row) => ({ id: row.id, value: row.value, updatedAt: row.updatedAt }))
        .sort((a, b) => b.updatedAt - a.updatedAt || a.id.localeCompare(b.id));
    },
    async clear(collection) {
      const range = IDBKeyRange.bound(
        [namespace, collection, ""],
        [namespace, collection, "￿"],
      );
      await tx(DOCS, "readwrite", (store) => store.delete(range));
    },
  };
}

/** Statuses that will never succeed on a retry — see the Rust twin. */
function isPermanent(status: number): boolean {
  return status >= 400 && status < 500 && status !== 408 && status !== 429;
}

function createWebOutbox(namespace: string, api: () => ToolApi): ToolOutbox {
  const listeners = new Set<(pending: number) => void>();

  async function rows(): Promise<ToolOutboxEntry[]> {
    const all =
      (await tx<Array<ToolOutboxEntry & { ns: string }>>(OUTBOX, "readonly", (store) =>
        store.index("ns_createdAt").getAll(
          IDBKeyRange.bound([namespace, -Infinity], [namespace, Infinity]),
        ),
      )) ?? [];
    return all.sort((a, b) => a.createdAt - b.createdAt);
  }

  async function announce(): Promise<void> {
    const pending = (await rows()).length;
    for (const listener of listeners) listener(pending);
  }

  return {
    async enqueue(op: ToolOutboxOp) {
      const opId = crypto.randomUUID();
      if (op.dedupeKey !== undefined) {
        // Replace rather than accumulate: the newest intent is the whole
        // intent. Done as a read-then-write because IndexedDB has no upsert on
        // a secondary index.
        const existing =
          (await tx<Array<{ opId: string }>>(OUTBOX, "readonly", (store) =>
            store.index("ns_dedupe").getAll(IDBKeyRange.only([namespace, op.dedupeKey])),
          )) ?? [];
        for (const entry of existing) {
          await tx(OUTBOX, "readwrite", (store) => store.delete(entry.opId));
        }
      }
      await tx(OUTBOX, "readwrite", (store) =>
        store.put({
          opId,
          ns: namespace,
          method: op.method,
          path: op.path,
          body: op.body,
          dedupeKey: op.dedupeKey,
          createdAt: Date.now(),
          attempts: 0,
          lastError: null,
        }),
      );
      void announce();
      return opId;
    },

    pending: rows,

    async flush(): Promise<ToolFlushResult> {
      const queued = await rows();
      const rejected: ToolOutboxRejection[] = [];
      let sent = 0;
      let stopped: string | null = null;

      for (const entry of queued) {
        try {
          await api().request(entry.path, {
            method: entry.method,
            body: entry.body,
            // A queued write is the player's own, so it always needs the
            // session; failing fast beats sending it anonymously to be refused.
            auth: "required",
          });
          await tx(OUTBOX, "readwrite", (store) => store.delete(entry.opId));
          sent += 1;
        } catch (err) {
          const status = err instanceof ToolApiError ? err.status : 0;
          const message = err instanceof Error ? err.message : String(err);
          if (isPermanent(status)) {
            await tx(OUTBOX, "readwrite", (store) => store.delete(entry.opId));
            rejected.push({ opId: entry.opId, path: entry.path, status, message });
            continue;
          }
          // Stop the run rather than skipping ahead: these are ordered writes,
          // and applying a later one over a failed earlier one produces a state
          // the player never asked for.
          await tx(OUTBOX, "readwrite", (store) =>
            store.put({ ...entry, ns: namespace, attempts: entry.attempts + 1, lastError: message }),
          );
          stopped = message;
          break;
        }
      }

      const remaining = (await rows()).length;
      void announce();
      return { sent, rejected, remaining, stopped };
    },

    subscribe(listener) {
      listeners.add(listener);
      void rows().then((all) => listener(all.length));
      return () => listeners.delete(listener);
    },
  };
}

/**
 * The browser `ToolData`. Handles are memoised per namespace so a component
 * that calls `toolDb("x")` on every render does not build a new one each time,
 * and so `subscribe` on one handle sees what another wrote.
 */
export function createWebData(api: () => ToolApi): ToolData {
  const dbs = new Map<string, ToolDb>();
  const outboxes = new Map<string, ToolOutbox>();

  // Replay when the connection comes back, without every tool having to
  // remember to. Only the queues this page has actually touched are flushed —
  // a namespace nobody opened has nothing pending by construction. Wrapped in a
  // guard because this module is imported during SSR, where `window` is absent.
  if (typeof window !== "undefined") {
    window.addEventListener("online", () => {
      for (const outbox of outboxes.values()) void outbox.flush();
    });
  }

  return {
    db(namespace) {
      let db = dbs.get(namespace);
      if (!db) {
        db = createWebDb(namespace);
        dbs.set(namespace, db);
      }
      return db;
    },
    outbox(namespace) {
      let outbox = outboxes.get(namespace);
      if (!outbox) {
        outbox = createWebOutbox(namespace, api);
        outboxes.set(namespace, outbox);
      }
      return outbox;
    },
  };
}
