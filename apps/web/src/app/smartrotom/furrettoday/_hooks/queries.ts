"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import type {
  ClapResponse,
  CreateNewsDto,
  EditorialBoardMember,
  News,
  NewsComment,
  NewsIssue,
  NewsResponse,
  UpdateNewsDto,
} from "@boffmedia/shared";

import {
  apiAuthedDELETEOrThrow,
  apiAuthedPOSTOrThrow,
  apiAuthedPUTOrThrow,
  rotomGETOrThrow,
  rotomPOSTOrThrow,
  rotomAuthedDELETEOrThrow,
  rotomAuthedPOSTOrThrow,
} from "@/services/boffAPI";
import { useBoffSession } from "@/services/useBoffSession";
import { useRotomUuid } from "@/components/smartrotom/behavior/useRotomUuid";

import { toArticle, type FtArticle } from "../_utils/article";

export const furretKeys = {
  all: () => ["furret", "news"] as const,
  article: (id: number) => ["furret", "news", id] as const,
  comments: (id: number) => ["furret", "news", id, "comments"] as const,
  board: () => ["furret", "board"] as const,
  issues: () => ["furret", "issues"] as const,
};

/**
 * The whole issue, in one request. Every screen reads from this: the API has no
 * pagination and the newsroom holds tens of rows, not thousands, so slicing it
 * client-side is cheaper than six endpoints — and it means the home, browse and
 * article screens all share one cache entry.
 */
export function useNewsroom() {
  const query = useQuery({
    queryKey: furretKeys.all(),
    queryFn: () => rotomGETOrThrow<NewsResponse>("/documents/news"),
  });

  const articles = useMemo<FtArticle[]>(
    () => (query.data?.news ?? []).map(toArticle),
    [query.data],
  );

  // The API's `featured` is the cover. It can be absent (nothing featured yet),
  // in which case the newest published article carries the cover.
  const cover = useMemo<FtArticle | null>(() => {
    const flagged = query.data?.featured;
    if (flagged) return toArticle(flagged);
    return articles.find((a) => a.published) ?? null;
  }, [query.data, articles]);

  const published = useMemo(
    () => articles.filter((a) => a.published && a.id !== cover?.id),
    [articles, cover],
  );

  return { ...query, articles, cover, published };
}

/** A single article. Seeded from the newsroom cache so a click paints instantly. */
export function useArticle(id: number) {
  const client = useQueryClient();

  return useQuery({
    queryKey: furretKeys.article(id),
    queryFn: () => rotomGETOrThrow<News>(`/documents/news/${id}`),
    enabled: Number.isFinite(id) && id > 0,
    select: toArticle,
    initialData: () => {
      const cached = client.getQueryData<NewsResponse>(furretKeys.all());
      return cached?.news.find((n) => n.id === id);
    },
  });
}

export function useComments(newsId: number) {
  return useQuery({
    queryKey: furretKeys.comments(newsId),
    queryFn: () => rotomGETOrThrow<NewsComment[]>(`/documents/news/${newsId}/comments`),
    enabled: Number.isFinite(newsId) && newsId > 0,
  });
}

/** The masthead — derived server-side by grouping news on (author, authorRole). */
export function useEditorialBoard() {
  return useQuery({
    queryKey: furretKeys.board(),
    queryFn: () => rotomGETOrThrow<EditorialBoardMember[]>("/documents/news/board"),
    staleTime: 10 * 60_000,
  });
}

/** The back-issue archive — derived server-side by grouping news on `issue`. */
export function useIssues() {
  return useQuery({
    queryKey: furretKeys.issues(),
    queryFn: () => rotomGETOrThrow<NewsIssue[]>("/documents/news/issues"),
    staleTime: 10 * 60_000,
  });
}

export function usePostComment(newsId: number) {
  const client = useQueryClient();
  const uuid = useRotomUuid();

  const mutation = useMutation({
    mutationFn: (body: string) =>
      rotomPOSTOrThrow<NewsComment>(`/documents/news/${newsId}/comments`, { uuid: uuid!, body }),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: furretKeys.comments(newsId) });
    },
  });

  // Commenting is gated on being signed in — the comment is keyed by uuid.
  return { ...mutation, canComment: Boolean(uuid) };
}

export function useDeleteComment(newsId: number) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (commentId: number) => rotomAuthedDELETEOrThrow(`/documents/news/comments/${commentId}`),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: furretKeys.comments(newsId) });
    },
  });
}

/**
 * Applause. Optimistic: the counter is a vanity figure, so a reader should see
 * their clap land immediately rather than wait for a round trip — and a failure
 * simply rolls the number back.
 */
export function useClap(newsId: number) {
  const client = useQueryClient();

  return useMutation({
    mutationFn: () => rotomPOSTOrThrow<ClapResponse>(`/documents/news/${newsId}/clap`, {}),
    onMutate: async () => {
      await client.cancelQueries({ queryKey: furretKeys.article(newsId) });
      const previous = client.getQueryData<News>(furretKeys.article(newsId));
      if (previous) {
        client.setQueryData<News>(furretKeys.article(newsId), {
          ...previous,
          claps: (previous.claps ?? 0) + 1,
        });
      }
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        client.setQueryData(furretKeys.article(newsId), context.previous);
      }
    },
    onSettled: () => {
      void client.invalidateQueries({ queryKey: furretKeys.article(newsId) });
    },
  });
}

export function useSubscribeNewsletter() {
  return useMutation({
    mutationFn: (email: string) => rotomPOSTOrThrow("/documents/newsletter", { email }),
  });
}

/**
 * Publish/feature flags. The API takes the whole set at once (the full list of
 * published ids + the single featured id), so a toggle sends the resulting
 * state, not a delta.
 */
export function useUpdateNewsStatus() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: { published: number[]; featured: number }) =>
      rotomAuthedPOSTOrThrow("/documents/newsstatus", data),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: furretKeys.all() });
    },
  });
}

/** Create/update/delete are token-authed (they are not rotom* calls). */
export function useSaveArticle() {
  const client = useQueryClient();
  const { session } = useBoffSession();
  const token = session?.user?.accessToken ?? "";

  return useMutation({
    mutationFn: ({ id, data }: { id: number | null; data: UpdateNewsDto }) =>
      id === null
        ? apiAuthedPOSTOrThrow<News>("/smartrotom/documents/news", data as CreateNewsDto, token)
        : apiAuthedPUTOrThrow<News>(`/smartrotom/documents/news/${id}`, data, token),
    onSuccess: (saved) => {
      void client.invalidateQueries({ queryKey: furretKeys.all() });
      void client.invalidateQueries({ queryKey: furretKeys.article(saved.id) });
    },
  });
}

export function useDeleteArticle() {
  const client = useQueryClient();
  const { session } = useBoffSession();
  const token = session?.user?.accessToken ?? "";

  return useMutation({
    mutationFn: (id: number) => apiAuthedDELETEOrThrow(`/smartrotom/documents/news/${id}`, token),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: furretKeys.all() });
    },
  });
}
