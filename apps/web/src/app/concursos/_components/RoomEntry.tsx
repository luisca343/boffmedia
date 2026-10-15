"use client";
import { useEffect, useState, useCallback, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { Button, Field, Input, Panel } from "@boffmedia/ui";
import type { ConcursosRoomDto } from "@boffmedia/shared";
import { ConcursosSocket } from "@/services/api/boffmedia/concursosSocket";
import { ConcursosService } from "@/services/api/boffmedia/concursosService";
import { useApiError } from "@/hooks/useApiError";
import {
  forgetGuestSession,
  guestCapability,
  restoreGuestSession,
  saveGuestSession,
  type GuestRoomSession,
} from "../guest-session";

import { GameController } from "./GameController";

export function RoomEntry() {
  const t = useTranslations("concursos");
  const apiError = useApiError();
  const [code, setCode] = useState("");
  const [nickname, setNickname] = useState("");
  const [session, setSession] = useState<GuestRoomSession | null>(null);
  const [room, setRoom] = useState<ConcursosRoomDto | null>(null);
  const [busy, setBusy] = useState(false);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState("");
  const [retrySession, setRetrySession] = useState<GuestRoomSession | null>(
    null,
  );

  const acceptRoom = useCallback((next: ConcursosRoomDto) => {
    setRoom((previous) =>
      previous?.game &&
      next.game &&
      previous.game.serverNow > next.game.serverNow
        ? previous
        : next,
    );
  }, []);
  useEffect(() => {
    const saved = restoreGuestSession();
    if (saved) {
      setCode(saved.code);
      setNickname(saved.nickname);
      setSession(saved);
    }
  }, []);

  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    let channel: ConcursosSocket | undefined;
    let retry: ReturnType<typeof setTimeout>;
    setConnected(false);
    const connect = async () => {
      try {
        const next = await ConcursosService.recover(
          session.code,
          session.nickname,
          session.token,
        );
        if (cancelled) return;
        acceptRoom(next);
        if (next.status === "closed") {
          forgetGuestSession();
          return;
        }
        channel = new ConcursosSocket(
          session.code,
          session.token,
          (snapshot) => {
            acceptRoom(snapshot);
            if (snapshot.status === "closed") forgetGuestSession();
          },
          (online, failure) => {
            if (cancelled) return;
            setConnected(online);
            setError(online ? "" : apiError(failure, t("connectionError")));
          },
        );
      } catch (failure) {
        if (cancelled) return;
        setConnected(false);
        setError(apiError(failure, t("connectionError")));
        retry = setTimeout(connect, 5000);
      }
    };
    void connect();
    return () => {
      cancelled = true;
      clearTimeout(retry);
      channel?.stop();
    };
  }, [session, apiError, t, acceptRoom]);

  async function join(event: FormEvent) {
    event.preventDefault();
    const cleanCode = code.trim().toUpperCase();
    const cleanNickname = nickname.trim().normalize("NFC");
    if (!/^[A-Z]{6}$/.test(cleanCode) || !cleanNickname) {
      setError(t("fieldsRequired"));
      return;
    }
    const attempt =
      retrySession?.code === cleanCode &&
      retrySession.nickname === cleanNickname
        ? retrySession
        : {
            code: cleanCode,
            nickname: cleanNickname,
            token: guestCapability(),
          };
    setRetrySession(attempt);
    saveGuestSession(attempt);
    setBusy(true);
    setError("");
    try {
      const joined = await ConcursosService.recover(
        attempt.code,
        attempt.nickname,
        attempt.token,
      );
      setRoom(joined);
      setSession(attempt);
      setConnected(false);
    } catch (failure) {
      setError(apiError(failure, t("connectionError")));
    } finally {
      setBusy(false);
    }
  }

  async function leave() {
    if (!session) return;
    if (!room) {
      setRetrySession(session);
      setSession(null);
      setError("");
      return;
    }
    setBusy(true);
    try {
      if (room?.status !== "closed")
        await ConcursosService.leave(session.code, session.token);
      forgetGuestSession();
      setSession(null);
      setRoom(null);
      setRetrySession(null);
      setCode("");
      setNickname("");
      setError("");
    } catch (failure) {
      setError(apiError(failure, t("connectionError")));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main
      data-ds="boffmedia"
      className="min-h-screen bg-base px-5 py-8 text-txt"
    >
      <div className="mx-auto grid max-w-md gap-6">
        <header>
          <p className="font-mono text-xs uppercase tracking-widest text-accent">
            Boffmedia
          </p>
          <h1 className="mt-2 font-display text-4xl font-bold">{t("title")}</h1>
          {!room?.game && <p className="mt-3 text-txt-muted">{t("intro")}</p>}
        </header>
        {error && (
          <p role="alert" className="border border-bad p-3 text-bad">
            {error}
          </p>
        )}
        {!session ? (
          <Panel title={t("joinTitle")}>
            <form onSubmit={join} className="grid gap-5">
              <Field label={t("codeLabel")} hint={t("codeHint")}>
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
                  autoCapitalize="characters"
                  autoComplete="off"
                  maxLength={6}
                  placeholder={t("codePlaceholder")}
                  required
                  className="font-mono text-2xl tracking-widest"
                />
              </Field>
              <Field label={t("nicknameLabel")}>
                <Input
                  value={nickname}
                  onChange={(event) => setNickname(event.target.value)}
                  autoComplete="nickname"
                  maxLength={24}
                  placeholder={t("nicknamePlaceholder")}
                  required
                />
              </Field>
              <Button
                type="submit"
                variant="pri"
                size="lg"
                loading={busy}
                disabled={busy || code.length !== 6 || !nickname.trim()}
              >
                {t("join")}
              </Button>
              <p className="text-sm text-txt-muted">{t("noAccount")}</p>
            </form>
          </Panel>
        ) : (
          <Panel
            title={
              room?.status === "closed"
                ? t("closedTitle")
                : room?.game
                  ? t("playingTitle")
                  : t("lobbyTitle")
            }
          >
            <div className="grid gap-4">
              <p className="font-mono text-3xl tracking-widest text-accent">
                {session.code}
              </p>
              <p role="status" className="text-sm text-txt-muted">
                {room?.status === "closed"
                  ? t("closed")
                  : connected
                    ? t("connected")
                    : t("reconnecting")}
              </p>
              {room?.status !== "closed" && !room?.game && (
                <>
                  <p>{t("youJoined", { nickname: session.nickname })}</p>
                  <p className="text-sm text-txt-muted">
                    {t("members", {
                      count: room?.members.length ?? 0,
                      capacity: room?.capacity ?? 4,
                    })}
                  </p>
                  <ul className="grid gap-2">
                    {room?.members.map((member) => (
                      <li
                        key={member.id}
                        className="border border-line px-3 py-2"
                      >
                        <span>{member.nickname}</span>
                        {member.id === room.memberId && (
                          <span className="ml-2 text-accent">{t("you")}</span>
                        )}
                        <span className="ml-2 text-sm text-txt-muted">
                          {member.connected ? t("online") : t("reconnecting")}
                        </span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
              {room && room.status !== "closed" && (
                <GameController
                  room={room}
                  token={session.token}
                  connected={connected}
                  onRoom={acceptRoom}
                />
              )}
              <Button
                onClick={leave}
                loading={busy}
                disabled={
                  busy ||
                  (room?.status === "playing" &&
                    room.game?.stage !== "finished")
                }
              >
                {room?.status === "closed" ? t("anotherRoom") : t("leave")}
              </Button>
            </div>
          </Panel>
        )}
      </div>
    </main>
  );
}
