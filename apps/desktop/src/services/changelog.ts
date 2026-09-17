import type {
  ChangelogListEntity,
  MarkChangelogSeenDto,
} from "@boffmedia/shared";

import {
  isDesktop,
  toolApiBaseUrl,
  toolApiRequest,
  toolDbGet,
  toolDbPut,
} from "../runtime";

type ApiEnvelope<T> = {
  success: boolean;
  data?: T;
  message?: string;
};

export type ChangelogLoad = {
  data: ChangelogListEntity | null;
  fromCache: boolean;
};

const CACHE_NAMESPACE = "launcher";
const CACHE_COLLECTION = "changelog";

function cacheId(locale: string, accountId?: number | null): string {
  return `boffmedia:desktop:${accountId ?? "anonymous"}:${locale}`;
}

function query(locale: string): string {
  const params = new URLSearchParams({
    product: "boffmedia",
    platform: "desktop",
    locale,
    limit: "50",
  });
  return `/changelogs?${params.toString()}`;
}

async function request<T>(request: {
  path: string;
  method?: string;
  body?: unknown;
  auth?: "optional" | "required";
}): Promise<ApiEnvelope<T>> {
  if (isDesktop()) {
    return await toolApiRequest<ApiEnvelope<T>>(request);
  }
  const response = await fetch(`${toolApiBaseUrl()}${request.path}`, {
    method: request.method ?? "GET",
    headers: request.body ? { "Content-Type": "application/json" } : undefined,
    body: request.body ? JSON.stringify(request.body) : undefined,
  });
  return (await response.json()) as ApiEnvelope<T>;
}

async function readCache(
  locale: string,
  accountId?: number | null,
): Promise<ChangelogListEntity | null> {
  if (!isDesktop()) return null;
  try {
    const value = await toolDbGet(
      CACHE_NAMESPACE,
      CACHE_COLLECTION,
      cacheId(locale, accountId),
    );
    if (!value) return null;
    const parsed = JSON.parse(value) as ChangelogListEntity;
    return Array.isArray(parsed.items) && typeof parsed.unreadCount === "number"
      ? parsed
      : null;
  } catch {
    return null;
  }
}

export async function cacheChangelog(
  locale: string,
  data: ChangelogListEntity,
  accountId?: number | null,
): Promise<void> {
  if (!isDesktop()) return;
  try {
    await toolDbPut(
      CACHE_NAMESPACE,
      CACHE_COLLECTION,
      cacheId(locale, accountId),
      JSON.stringify(data),
    );
  } catch {
    // A cache failure must not hide a feed that was already loaded online.
  }
}

/** Load the desktop product feed, falling back to the last valid response in
 * the launcher-owned SQLite store when the API is unreachable. */
export async function loadChangelog(
  locale: string,
  accountId?: number | null,
): Promise<ChangelogLoad> {
  try {
    const response = await request<ChangelogListEntity>({
      path: query(locale),
      auth: "optional",
    });
    if (!response.success || !response.data)
      throw new Error(response.message ?? "changelog request failed");
    await cacheChangelog(locale, response.data, accountId);
    return { data: response.data, fromCache: false };
  } catch {
    return { data: await readCache(locale, accountId), fromCache: true };
  }
}

export async function markChangelogSeen(input: {
  entryId: number;
  product: "boffmedia" | "smartrotom";
  platform: "all" | "web" | "desktop";
}): Promise<boolean> {
  if (!isDesktop()) return false;
  try {
    const response = await request<{ success: boolean }>({
      path: "/changelogs/seen",
      method: "POST",
      body: input as MarkChangelogSeenDto,
      auth: "required",
    });
    return response.success;
  } catch {
    return false;
  }
}
