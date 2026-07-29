"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { CreateTransferDto, StarBankAccount, StarBankTransaction } from "@boffmedia/shared"
import {
  rotomAuthedPOSTOrThrow,
  rotomGETOrThrow,
  rotomMultipartPATCHOrThrow,
  rotomMultipartPOSTOrThrow,
} from "@/services/boffAPI"
import type { CreateAccountDto } from "@/types/dto/create-account-dto"

export const starbankKeys = {
  all: ["starbank"] as const,
  accounts: (uuid?: string | null) => ["starbank", "accounts", uuid] as const,
  allAccounts: () => ["starbank", "accounts", "all"] as const,
  balance: (uuid?: string | null) => ["starbank", "balance", uuid] as const,
  transactions: (accountId: number, limit?: number) => ["starbank", "transactions", accountId, limit] as const,
  transfers: (accountId: number) => ["starbank", "transfers", accountId] as const,
}

// ── Reads ────────────────────────────────────────────────────────────────────

/** The signed-in trainer's own accounts — the set the active-account picker draws from. */
export function useAccounts(uuid?: string | null) {
  return useQuery({
    queryKey: starbankKeys.accounts(uuid),
    queryFn: () => rotomGETOrThrow<StarBankAccount[]>(`/starbank/accounts/${uuid}`),
    enabled: Boolean(uuid),
  })
}

/** Every StarBank account on the server — the recipient picker in `enviar` searches this. */
export function useAllAccounts() {
  return useQuery({
    queryKey: starbankKeys.allAccounts(),
    queryFn: () => rotomGETOrThrow<StarBankAccount[]>("/starbank/accounts"),
  })
}

export function useBalance(uuid?: string | null) {
  return useQuery({
    queryKey: starbankKeys.balance(uuid),
    queryFn: () => rotomGETOrThrow<{ balance: number }>(`/starbank/balance/${uuid}`),
    enabled: Boolean(uuid),
  })
}

export function useTransactions(accountId: number, limit?: number) {
  return useQuery({
    queryKey: starbankKeys.transactions(accountId, limit),
    queryFn: () =>
      rotomGETOrThrow<StarBankTransaction[]>(`/starbank/transactions/${accountId}${limit ? `?limit=${limit}` : ""}`),
    enabled: Number.isFinite(accountId) && accountId > 0,
  })
}

export function useTransfers(accountId: number) {
  return useQuery({
    queryKey: starbankKeys.transfers(accountId),
    queryFn: () => rotomGETOrThrow<StarBankTransaction[]>(`/starbank/transfers/${accountId}`),
    enabled: Number.isFinite(accountId) && accountId > 0,
  })
}

// ── Writes ───────────────────────────────────────────────────────────────────

/**
 * Creates a secondary account. Invalidates both the owner's own list and the global
 * directory — the new account has to be findable as a transfer recipient immediately,
 * not just show up in "Mis cuentas" on the next unrelated refetch.
 */
export function useCreateAccountMutation(uuid?: string | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ data, images }: { data: CreateAccountDto; images?: Record<string, File | Blob> }) =>
      rotomMultipartPOSTOrThrow<StarBankAccount>("/starbank/accounts", data, images ?? {}),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: starbankKeys.accounts(uuid) })
      void qc.invalidateQueries({ queryKey: starbankKeys.allAccounts() })
    },
  })
}

/**
 * Renames a secondary account and/or replaces its picture. Both fields are optional, and the
 * API refuses anything that is not a secondary account the caller owns (or, for ROTOM_ADMIN,
 * anyone's).
 *
 * Multipart even for a name-only edit, so one request covers both cases and the picture never
 * needs a second round trip.
 */
export function useUpdateAccountMutation(uuid?: string | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      name,
      image,
    }: {
      id: number
      name?: string
      image?: File | Blob
    }) =>
      rotomMultipartPATCHOrThrow<StarBankAccount>(
        `/starbank/accounts/${id}`,
        name === undefined ? {} : { name },
        image ? { image } : {},
      ),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: starbankKeys.accounts(uuid) })
      void qc.invalidateQueries({ queryKey: starbankKeys.allAccounts() })
    },
  })
}

/**
 * Real money moves here. `rotomPOSTOrThrow` throws on a failed envelope, so `onSuccess`
 * fires ONLY when the server actually settled the transfer — the caller's "sent" screen
 * must be gated on this mutation's success state, never on the promise merely resolving.
 *
 * Invalidates both sides of the transfer (a self-transfer between the sender's own
 * accounts hits both from the same query) plus the global directory, since any account's
 * balance card can be showing on screen regardless of who is signed in.
 */
export function useTransferMutation(uuid?: string | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateTransferDto) => rotomAuthedPOSTOrThrow<void>("/starbank/transfer", data),
    onSuccess: (_result, variables) => {
      void qc.invalidateQueries({ queryKey: starbankKeys.accounts(uuid) })
      void qc.invalidateQueries({ queryKey: starbankKeys.allAccounts() })
      void qc.invalidateQueries({ queryKey: starbankKeys.balance(uuid) })
      void qc.invalidateQueries({ queryKey: starbankKeys.transactions(variables.from) })
      void qc.invalidateQueries({ queryKey: starbankKeys.transactions(variables.to) })
      void qc.invalidateQueries({ queryKey: starbankKeys.transfers(variables.from) })
      void qc.invalidateQueries({ queryKey: starbankKeys.transfers(variables.to) })
    },
  })
}

