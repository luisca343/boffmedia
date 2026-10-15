"use client";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { Button, Field, Input, Panel } from "@boffmedia/ui";
import type {
  ConcursosRoomDto,
  ConcursosDeviceRecoveryDto,
} from "@boffmedia/shared";
import { ConcursosService } from "@/services/api/boffmedia/concursosService";
import { ConcursosSocket } from "@/services/api/boffmedia/concursosSocket";
import { ApiError } from "@/services/http/core";
import { useApiError } from "@/hooks/useApiError";
import {
  guestCapability,
  restoreRecoveryAttempt,
  saveRecoveryAttempt,
  forgetRecoveryAttempt,
  saveGuestSession,
  type GuestRoomSession,
} from "../guest-session";

export function DeviceRecovery({
  initialCode,
  initialNickname,
  onRecovered,
  onBack,
}: {
  initialCode: string;
  initialNickname: string;
  onRecovered: (room: ConcursosRoomDto, session: GuestRoomSession) => void;
  onBack: () => void;
}) {
  const t = useTranslations("concursos");
  const apiError = useApiError();
  const [code, setCode] = useState(initialCode);
  const [nickname, setNickname] = useState(initialNickname);
  const [attempt, setAttempt] = useState<GuestRoomSession | null>(null);
  const [request, setRequest] = useState<ConcursosDeviceRecoveryDto | null>(
    null,
  );
  const [channel, setChannel] = useState<ConcursosSocket | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [online, setOnline] = useState(false);
  const [retry, setRetry] = useState(0);
  const [resettable, setResettable] = useState(false);
  const [remaining, setRemaining] = useState(0);
  useEffect(() => {
    const saved = restoreRecoveryAttempt();
    if (saved) {
      setCode(saved.code);
      setNickname(saved.nickname);
      setAttempt(saved);
    }
  }, []);
  const complete = useCallback(
    (room: ConcursosRoomDto, credential: GuestRoomSession) => {
      const session = {
        ...credential,
        nickname:
          room.members.find((m) => m.id === room.memberId)?.nickname ??
          credential.nickname,
      };
      saveGuestSession(session);
      forgetRecoveryAttempt(credential);
      onRecovered(room, session);
    },
    [onRecovered],
  );
  useEffect(() => {
    if (!attempt) return;
    let cancelled = false;
    let socket: ConcursosSocket | undefined;
    setOnline(false);
    setResettable(false);
    setError("");
    const start = async () => {
      try {
        const response = await ConcursosService.recoverDevice(
          attempt.code,
          attempt.nickname,
          attempt.token,
        );
        if (cancelled) return;
        if (response.room) {
          complete(response.room, attempt);
          return;
        }
        const recovery = response.recovery!;
        setRequest(recovery);
        if (recovery.status !== "pending") {
          setResettable(true);
          return;
        }
        socket = new ConcursosSocket(
          attempt.code,
          attempt.token,
          (room) => {
            if (!cancelled) complete(room, attempt);
          },
          (connected, failure) => {
            if (!cancelled) {
              setOnline(connected);
              if (failure) setError(apiError(failure, t("connectionError")));
            }
          },
          (next) => {
            if (cancelled) return;
            setRequest(next);
            if (next.status !== "pending") {
              socket?.stop();
              setResettable(true);
              setOnline(false);
            }
          },
        );
        setChannel(socket);
      } catch (failure) {
        if (cancelled) return;
        setError(apiError(failure, t("connectionError")));
        setResettable(
          failure instanceof ApiError &&
            failure.statusCode >= 400 &&
            failure.statusCode < 500,
        );
      }
    };
    void start();
    return () => {
      cancelled = true;
      socket?.stop();
    };
  }, [attempt, retry, complete, apiError, t]);
  useEffect(() => {
    if (!request) return;
    const received = performance.now();
    const update = () =>
      setRemaining(
        Math.max(
          0,
          Math.ceil(
            (request.expiresAt -
              request.serverNow -
              (performance.now() - received)) /
              1000,
          ),
        ),
      );
    update();
    const timer = setInterval(update, 250);
    return () => clearInterval(timer);
  }, [request]);
  function submit(event: FormEvent) {
    event.preventDefault();
    const roomCode = code.trim().toUpperCase();
    const clean = nickname.trim().normalize("NFC");
    if (!/^[A-Z]{6}$/.test(roomCode) || !clean) {
      setError(t("fieldsRequired"));
      return;
    }
    const next = { code: roomCode, nickname: clean, token: guestCapability() };
    saveRecoveryAttempt(next);
    setRequest(null);
    setAttempt(next);
  }
  async function cancel() {
    if (!channel || !request) return;
    setBusy(true);
    setError("");
    try {
      await channel.cancelRecovery(request.id);
    } catch (failure) {
      setError(apiError(failure, t("connectionError")));
    } finally {
      setBusy(false);
    }
  }
  function reset() {
    if (attempt) forgetRecoveryAttempt(attempt);
    setAttempt(null);
    setRequest(null);
    setChannel(null);
    setError("");
    setResettable(false);
  }
  return (
    <Panel title={t("recoverPlayer")}>
      <div className="grid gap-4">
        {error && (
          <p role="alert" className="border border-bad p-3 text-bad">
            {error}
          </p>
        )}
        {!attempt ? (
          <form onSubmit={submit} className="grid gap-4">
            <p>{t("deviceRecoveryIntro")}</p>
            <Field label={t("codeLabel")}>
              <Input
                value={code}
                onChange={(event) =>
                  setCode(
                    event.target.value
                      .toUpperCase()
                      .replace(/[^A-Z]/g, "")
                      .slice(0, 6),
                  )
                }
                maxLength={6}
                required
                autoComplete="off"
              />
            </Field>
            <Field label={t("nicknameLabel")}>
              <Input
                value={nickname}
                onChange={(event) => setNickname(event.target.value)}
                maxLength={24}
                required
                autoComplete="nickname"
              />
            </Field>
            <Button type="submit" variant="pri">
              {t("requestDeviceRecovery")}
            </Button>
            <Button type="button" onClick={onBack}>
              {t("backToEntry")}
            </Button>
          </form>
        ) : (
          <>
            <p>
              {t("recoveringName", {
                name: request?.nickname ?? attempt.nickname,
              })}
            </p>
            {request?.status === "pending" ? (
              <>
                <p>{t("compareRecoveryCode")}</p>
                <p className="font-mono text-3xl tracking-widest">
                  {request.verificationCode}
                </p>
                <p role="status">{t("waitingDeviceApproval")}</p>
                <p role="timer">{t("recoveryExpires", { count: remaining })}</p>
                <p className="text-sm text-txt-muted">
                  {t("recoveryPreservesState")}
                </p>
                <Button onClick={cancel} disabled={!online || busy}>
                  {t("cancelRecovery")}
                </Button>
              </>
            ) : request ? (
              <p role="status">{t(`deviceRecoveryStatus.${request.status}`)}</p>
            ) : (
              <p role="status">{t("connectingRecovery")}</p>
            )}
            {!online && !resettable && (
              <Button onClick={() => setRetry((value) => value + 1)}>
                {t("retryRecovery")}
              </Button>
            )}
            {resettable && (
              <Button onClick={reset}>{t("newRecoveryRequest")}</Button>
            )}
          </>
        )}
      </div>
    </Panel>
  );
}
