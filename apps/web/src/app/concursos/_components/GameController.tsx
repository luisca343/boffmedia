"use client";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@boffmedia/ui";
import type { ConcursosRoomDto } from "@boffmedia/shared";
import { ConcursosActionDto } from "@boffmedia/shared";
import { ConcursosService } from "@/services/api/boffmedia/concursosService";
import { useApiError } from "@/hooks/useApiError";

export function GameController({
  room,
  token,
  connected,
  onRoom,
}: {
  room: ConcursosRoomDto;
  token: string;
  connected: boolean;
  onRoom: (next: ConcursosRoomDto) => void;
}) {
  const t = useTranslations("concursos");
  const apiError = useApiError();
  const [selection, setSelection] = useState<{
    roundId: number;
    choice: number;
  } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [remaining, setRemaining] = useState(0);
  const game = room.game;
  const choice =
    game && selection?.roundId === game.roundId ? selection.choice : null;
  const entity = room.entities.find((e) =>
    e.memberIds.includes(room.memberId ?? ""),
  );
  const canCommit =
    room.mode === "individual" || entity?.captainId === room.memberId;
  const memberName = (id?: string) =>
    room.members.find((m) => m.id === id)?.nickname ?? "";
  const entityName = (id: string) => {
    const unit = room.entities.find((e) => e.id === id);
    return room.mode === "teams"
      ? t("team", { number: unit?.label ?? "" })
      : (unit?.label ?? "");
  };
  useEffect(() => {
    setSelection(null);
    setError("");
  }, [game?.roundId]);
  const deadline = game?.paused
    ? game.resumeAt
    : game?.stage === "result"
      ? game.advanceAt
      : game?.stage === "question"
        ? game.deadlineAt
        : game?.stage === "board"
          ? game.selectionSkipAt
          : undefined;
  useEffect(() => {
    if (!deadline || !game) {
      setRemaining(Math.ceil((game?.remainingMs ?? 0) / 1000));
      return;
    }
    const received = performance.now();
    const update = () =>
      setRemaining(
        Math.max(
          0,
          Math.ceil(
            (deadline - game.serverNow - (performance.now() - received)) / 1000,
          ),
        ),
      );
    update();
    const timer = setInterval(update, 250);
    return () => clearInterval(timer);
  }, [game?.serverNow, deadline, game?.remainingMs, game?.paused]);
  async function run(operation: () => Promise<ConcursosRoomDto>) {
    setBusy(true);
    setError("");
    try {
      onRoom(await operation());
    } catch (failure) {
      setError(apiError(failure, t("connectionError")));
    } finally {
      setBusy(false);
    }
  }
  const act = (body: ConcursosActionDto) =>
    run(() =>
      ConcursosService.action(room.code, token, {
        ...body,
        ...(body.action === ConcursosActionDto.action.CHOOSE && {
          roundId: game!.roundId,
          selectionRevision: game!.selectionRevision,
        }),
        ...(room.mode === "teams" &&
          (body.action === ConcursosActionDto.action.CHOOSE ||
            body.action === ConcursosActionDto.action.ANSWER) && {
            captainRevision: entity?.captainRevision ?? 0,
          }),
      }),
    );
  const ownAnswer = game?.own?.answer;
  const locked = ownAnswer !== undefined;
  const paused = game?.paused ?? false;
  const unavailable = busy || !connected;
  return (
    <section className="grid gap-4">
      {error && (
        <p role="alert" className="border border-bad p-3 text-bad">
          {error}
        </p>
      )}
      <p>{t(room.mode === "individual" ? "individualMode" : "teamsMode")}</p>
      <p className="text-sm text-txt-muted">
        {t(room.pacing === "automatic" ? "automaticPacing" : "directedPacing")}
      </p>
      {!game && room.mode === "teams" && (
        <div className="grid gap-2">
          <p>{t("chooseTeam")}</p>
          {[...room.entities]
            .sort((a, b) => b.score - a.score)
            .map((unit) => (
              <Button
                key={unit.id}
                disabled={unavailable || entity?.id === unit.id}
                onClick={() =>
                  run(() => ConcursosService.group(room.code, token, unit.id))
                }
              >
                {entityName(unit.id)}
              </Button>
            ))}
        </div>
      )}
      {room.mode === "teams" && entity && (
        <p>
          {t(entity.temporaryCaptain ? "temporaryCaptain" : "captain", {
            name: memberName(entity.captainId),
          })}
        </p>
      )}
      {!game && <p className="text-sm text-txt-muted">{t("waitingStart")}</p>}
      {game?.paused && (
        <div role="status" className="border border-accent p-3">
          <p className="font-bold">{t("paused")}</p>
          <p>
            {t(
              game.pauseReason === "host_disconnected"
                ? "hostDisconnected"
                : game.pauseReason === "players_disconnected"
                  ? "playersDisconnected"
                  : "hostPaused",
            )}
          </p>
          {game.resumeAt !== undefined ? (
            <p role="timer">{t("resumeCountdown", { count: remaining })}</p>
          ) : (
            <p>{t("waitingResume")}</p>
          )}
          {game.remainingMs !== undefined && (
            <p>
              {t("frozenSeconds", {
                count: Math.ceil(game.remainingMs / 1000),
              })}
            </p>
          )}
        </div>
      )}
      {game && (
        <>
          <p className="font-bold">{game.phaseTitle}</p>
          <ul className="grid grid-cols-2 gap-2 text-sm">
            {[...room.entities]
              .sort((a, b) => b.score - a.score)
              .map((unit) => (
                <li key={unit.id} className="break-words">
                  {t("score", {
                    name: entityName(unit.id),
                    points: unit.score,
                  })}
                </li>
              ))}
          </ul>
          {game.stage === "board" && (
            <>
              <p>{t("chooses", { name: entityName(game.selectorId) })}</p>
              {!paused && game.selectionSkipAt !== undefined && (
                <p role="timer">
                  {t("absentSelectorCountdown", { count: remaining })}
                </p>
              )}
              {game.board.map((item, index) => (
                <Button
                  key={item.id}
                  disabled={
                    unavailable ||
                    paused ||
                    entity?.id !== game.selectorId ||
                    !canCommit
                  }
                  onClick={() =>
                    act({
                      action: ConcursosActionDto.action.CHOOSE,
                      questionId: item.id,
                    })
                  }
                >
                  {item.category} · {index + 1}
                </Button>
              ))}
            </>
          )}
          {(game.stage === "question" || game.stage === "result") &&
            game.question && (
              <>
                <h2 className="break-words text-xl font-bold">
                  {game.question.prompt}
                </h2>
                {game.stage === "question" && (
                  <>
                    <p role="timer">
                      {t(paused ? "frozenSeconds" : "seconds", {
                        count: remaining,
                      })}
                    </p>
                    {game.question.choices.map((option, index) => (
                      <Button
                        key={index}
                        disabled={
                          unavailable ||
                          locked ||
                          remaining === 0 ||
                          (paused &&
                            !room.recoverySettings
                              .allowLocalSelectionWhilePaused)
                        }
                        variant={choice === index ? "pri" : undefined}
                        onClick={() =>
                          setSelection({ roundId: game.roundId, choice: index })
                        }
                      >
                        {option}
                      </Button>
                    ))}
                    {locked ? (
                      <p role="status">
                        {t("answerSent", {
                          answer: game.question.choices[ownAnswer],
                        })}
                      </p>
                    ) : (
                      <>
                        {room.mode === "teams" && (
                          <Button
                            disabled={
                              unavailable ||
                              paused ||
                              choice === null ||
                              remaining === 0
                            }
                            onClick={() =>
                              act({
                                action: ConcursosActionDto.action.PROPOSE,
                                roundId: game.roundId,
                                choice: choice!,
                              })
                            }
                          >
                            {t("sendProposal")}
                          </Button>
                        )}
                        {(room.mode === "individual" || canCommit) && (
                          <Button
                            disabled={
                              unavailable ||
                              paused ||
                              choice === null ||
                              remaining === 0
                            }
                            onClick={() =>
                              act({
                                action: ConcursosActionDto.action.ANSWER,
                                roundId: game.roundId,
                                choice: choice!,
                              })
                            }
                          >
                            {t(
                              room.mode === "individual"
                                ? "sendAnswer"
                                : "confirmTeamAnswer",
                            )}
                          </Button>
                        )}
                      </>
                    )}
                    {room.mode === "teams" && (
                      <>
                        <p className="font-bold">{t("privateProposals")}</p>
                        <ul>
                          {game.own?.proposals.map((proposal) => (
                            <li key={proposal.memberId}>
                              {memberName(proposal.memberId)}:{" "}
                              {game.question!.choices[proposal.choice]}
                            </li>
                          ))}
                        </ul>
                      </>
                    )}
                  </>
                )}
                {game.stage === "result" && (
                  <>
                    <p>
                      {t("solution", {
                        answer:
                          game.question.choices[game.question.correctIndex!],
                      })}
                    </p>
                    <ul>
                      {game.results?.map((result) => (
                        <li key={result.entityId}>
                          {entityName(result.entityId)}:{" "}
                          {result.answer === undefined
                            ? t("noAnswer")
                            : game.question!.choices[result.answer]}{" "}
                          · {t(result.correct ? "correct" : "incorrect")} ·{" "}
                          {t("earnedPoints", { points: result.points })}
                        </li>
                      ))}
                    </ul>
                    {!paused && game.advanceAt !== undefined ? (
                      <p role="timer" className="font-bold">
                        {t("nextCountdown", { count: remaining })}
                      </p>
                    ) : !paused ? (
                      <p>{t("waitingNext")}</p>
                    ) : null}
                  </>
                )}
              </>
            )}
          <ul
            aria-label={t("participantConnections")}
            className="grid gap-1 text-sm text-txt-muted"
          >
            {room.members.map((member) => (
              <li key={member.id}>
                {member.nickname} ·{" "}
                {t(member.connected ? "online" : "offlineReserved")}
              </li>
            ))}
          </ul>
          {game.stage === "finished" && (
            <p className="text-xl font-bold">{t("finished")}</p>
          )}
        </>
      )}
    </section>
  );
}
