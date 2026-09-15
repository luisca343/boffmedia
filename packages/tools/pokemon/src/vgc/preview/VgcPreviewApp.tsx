"use client";

import { useCallback, useEffect, useRef, useState, type PointerEvent } from "react";
import { Button, Input } from "@boffmedia/ui";
import { DkApp, DkBar, DkBody, DkChip, DkSpacer, DkTitle } from "@boffmedia/ui/datakit";
import { useVgcT } from "../i18n";
import { VgcService, type ChampionsRegulation } from "../service";
import { toID } from "@boffmedia/pokemon-identity";
import {
  getFallbackRecognitionCandidates,
  recognizeSlotTemplates,
  type RecognitionCandidate,
  type SlotRecognition,
  type TemplateProgress,
} from "./recognition";
import { cropBounds, DEFAULT_PREVIEW_ROIS, moveRoi, type PreviewRoi } from "./roi";

type CameraError = "unsupported" | "permission" | "notFound" | "busy" | "unknown";

interface VideoInput {
  deviceId: string;
  label: string;
}

interface CaptureSize {
  width: number;
  height: number;
}

interface SlotCrop {
  roi: PreviewRoi;
  dataUrl: string;
}

interface DragState {
  roiId: string;
  clientX: number;
  clientY: number;
}

function listVideoInputs(): Promise<VideoInput[]> {
  if (!navigator.mediaDevices?.enumerateDevices) return Promise.resolve([]);

  return navigator.mediaDevices.enumerateDevices().then((devices) =>
    devices
      .filter((device): device is MediaDeviceInfo => device.kind === "videoinput" && Boolean(device.deviceId))
      .map((device) => ({ deviceId: device.deviceId, label: device.label })),
  );
}

function classifyCameraError(error: unknown): CameraError {
  if (!(error instanceof DOMException)) return "unknown";
  if (error.name === "NotAllowedError" || error.name === "SecurityError") return "permission";
  if (error.name === "NotFoundError" || error.name === "OverconstrainedError") return "notFound";
  if (error.name === "NotReadableError" || error.name === "AbortError") return "busy";
  return "unknown";
}

function stopTracks(stream: MediaStream | null): void {
  stream?.getTracks().forEach((track) => track.stop());
}

function loadFrame(source: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("frame_load_failed"));
    image.src = source;
  });
}

function latestActiveChampionsRegulation(regulations: ChampionsRegulation[]): ChampionsRegulation | undefined {
  const active = regulations.filter((regulation) => regulation.active === 1);
  return [...(active.length > 0 ? active : regulations)]
    .sort((left, right) => {
      const leftKey = regulationSortKey(left);
      const rightKey = regulationSortKey(right);
      return rightKey.localeCompare(leftKey) || right.createdAt.localeCompare(left.createdAt);
    })[0];
}

function regulationSortKey(regulation: ChampionsRegulation): string {
  const source = `${regulation.formatId} ${regulation.id}`.toLowerCase();
  const year = source.match(/(?:champions)?vgc(\d{4})/)?.[1] ?? "0000";
  const phase = source.match(/regm([a-z]+)$/)?.[1] ?? source.match(/reg([a-z]+)$/)?.[1] ?? "";
  return `${year}-${phase.padEnd(4, " ")}`;
}

export function VgcPreviewApp() {
  const t = useVgcT("preview");
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [devices, setDevices] = useState<VideoInput[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState("");
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [resolution, setResolution] = useState<CaptureSize | null>(null);
  const [capturedFrame, setCapturedFrame] = useState<string | null>(null);
  const [error, setError] = useState<CameraError | null>(null);
  const [loading, setLoading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [rois, setRois] = useState<PreviewRoi[]>(() => DEFAULT_PREVIEW_ROIS.map((roi) => ({ ...roi })));
  const [calibrating, setCalibrating] = useState(false);
  const [selectedRoiId, setSelectedRoiId] = useState(DEFAULT_PREVIEW_ROIS[0].id);
  const [dragging, setDragging] = useState<DragState | null>(null);
  const [slotCrops, setSlotCrops] = useState<SlotCrop[]>([]);
  const [slotNames, setSlotNames] = useState<Record<string, string>>({});
  const [recognitionCandidates, setRecognitionCandidates] = useState<RecognitionCandidate[]>([]);
  const [rosterRegulation, setRosterRegulation] = useState<string | null>(null);
  const [rosterLoading, setRosterLoading] = useState(true);
  const [recognizing, setRecognizing] = useState(false);
  const [recognitionResults, setRecognitionResults] = useState<SlotRecognition[]>([]);
  const [templateProgress, setTemplateProgress] = useState<TemplateProgress>({
    completed: 0,
    total: 0,
    loaded: 0,
    failed: 0,
  });
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;

    const loadCandidates = async () => {
      setRosterLoading(true);
      try {
        const regulations = await VgcService.getChampionsRegulations();
        const activeRegulation = latestActiveChampionsRegulation(regulations.data ?? []);
        const legal = activeRegulation
          ? await VgcService.getChampionsLegalPokemon(activeRegulation.id)
          : null;
        const candidates = (legal?.data ?? [])
          .map((pokemon) => ({ id: toID(pokemon.name), name: pokemon.name }))
          .filter((candidate, index, all) => candidate.id && all.findIndex((other) => other.id === candidate.id) === index);

        if (candidates.length > 0) {
          if (!cancelled) {
            setRecognitionCandidates(candidates);
            setRosterRegulation(activeRegulation?.name ?? activeRegulation?.formatId ?? null);
          }
          return;
        }
        throw new Error("champions_roster_empty");
      } catch {
        const fallback = await getFallbackRecognitionCandidates();
        if (!cancelled) {
          setRecognitionCandidates(fallback);
          setRosterRegulation(null);
        }
      } finally {
        if (!cancelled) setRosterLoading(false);
      }
    };

    void loadCandidates();
    return () => {
      cancelled = true;
    };
  }, []);

  const refreshDevices = useCallback(async () => {
    if (!navigator.mediaDevices?.enumerateDevices) {
      setError("unsupported");
      return;
    }

    try {
      const inputs = await listVideoInputs();
      setDevices(inputs);
      setSelectedDeviceId((current) =>
        current && inputs.some((input) => input.deviceId === current) ? current : (inputs[0]?.deviceId ?? ""),
      );
    } catch {
      setError("unknown");
    }
  }, []);

  useEffect(() => {
    void refreshDevices();
    const mediaDevices = navigator.mediaDevices;
    if (!mediaDevices) return;

    const onDeviceChange = () => void refreshDevices();
    mediaDevices.addEventListener("devicechange", onDeviceChange);
    return () => mediaDevices.removeEventListener("devicechange", onDeviceChange);
  }, [refreshDevices]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.srcObject = stream;
    if (stream) void video.play().catch(() => undefined);
    return () => {
      video.srcObject = null;
    };
  }, [stream]);

  useEffect(() => {
    return () => stopTracks(streamRef.current);
  }, []);

  const disconnect = useCallback(() => {
    stopTracks(streamRef.current);
    streamRef.current = null;
    setStream(null);
    setResolution(null);
  }, []);

  const connect = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("unsupported");
      return;
    }

    setLoading(true);
    setError(null);
    disconnect();

    try {
      const video: MediaTrackConstraints = {
        width: { ideal: 1920 },
        height: { ideal: 1080 },
        frameRate: { ideal: 30 },
        ...(selectedDeviceId ? { deviceId: { exact: selectedDeviceId } } : {}),
      };
      const nextStream = await navigator.mediaDevices.getUserMedia({ video, audio: false });
      streamRef.current = nextStream;
      setStream(nextStream);
      await refreshDevices();
    } catch (caught) {
      setError(classifyCameraError(caught));
    } finally {
      setLoading(false);
    }
  }, [disconnect, refreshDevices, selectedDeviceId]);

  const captureFrame = useCallback(() => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0 || video.videoHeight === 0) return;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0, canvas.width, canvas.height);
    setCapturedFrame(canvas.toDataURL("image/png"));
    setSlotCrops([]);
    setRecognitionResults([]);
    setResolution({ width: canvas.width, height: canvas.height });
  }, []);

  const extractSlots = useCallback(async () => {
    if (!capturedFrame) return;
    setExtracting(true);
    try {
      const image = await loadFrame(capturedFrame);
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      if (!context) return;

      const crops = rois.map((roi) => {
        const bounds = cropBounds(roi, image.naturalWidth, image.naturalHeight);
        canvas.width = bounds.width;
        canvas.height = bounds.height;
        context.clearRect(0, 0, bounds.width, bounds.height);
        context.drawImage(
          image,
          bounds.left,
          bounds.top,
          bounds.width,
          bounds.height,
          0,
          0,
          bounds.width,
          bounds.height,
        );
        return { roi, dataUrl: canvas.toDataURL("image/png") };
      });
      setSlotCrops(crops);
      setRecognitionResults([]);
    } catch {
      setError("unknown");
    } finally {
      setExtracting(false);
    }
  }, [capturedFrame, rois]);

  const startRoiDrag = useCallback((event: PointerEvent<HTMLButtonElement>, roiId: string) => {
    event.preventDefault();
    event.stopPropagation();
    setSelectedRoiId(roiId);
    if (!calibrating) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging({ roiId, clientX: event.clientX, clientY: event.clientY });
  }, [calibrating]);

  const moveRoiDrag = useCallback((event: PointerEvent<HTMLDivElement>) => {
    if (!dragging || !overlayRef.current) return;
    const bounds = overlayRef.current.getBoundingClientRect();
    const deltaX = (event.clientX - dragging.clientX) / bounds.width;
    const deltaY = (event.clientY - dragging.clientY) / bounds.height;
    if (deltaX === 0 && deltaY === 0) return;

    setRois((current) => current.map((roi) => (roi.id === dragging.roiId ? moveRoi(roi, deltaX, deltaY) : roi)));
    setSlotCrops([]);
    setRecognitionResults([]);
    setDragging({ roiId: dragging.roiId, clientX: event.clientX, clientY: event.clientY });
  }, [dragging]);

  const resetRois = useCallback(() => {
    setRois(DEFAULT_PREVIEW_ROIS.map((roi) => ({ ...roi })));
    setSlotCrops([]);
    setRecognitionResults([]);
  }, []);

  const recognize = useCallback(async () => {
    if (slotCrops.length === 0 || recognitionCandidates.length === 0) return;
    setRecognizing(true);
    setError(null);
    setRecognitionResults([]);
    try {
      const results = await recognizeSlotTemplates(
        slotCrops.map(({ roi, dataUrl }) => ({ slotId: roi.id, side: roi.side, dataUrl })),
        recognitionCandidates,
        setTemplateProgress,
      );
      setRecognitionResults(results);
    } catch {
      setError("unknown");
    } finally {
      setRecognizing(false);
    }
  }, [recognitionCandidates, slotCrops]);

  const applyRecognition = useCallback((result: SlotRecognition) => {
    if (!result.best) return;
    setSlotNames((current) => ({ ...current, [result.slotId]: result.best?.name ?? "" }));
  }, []);

  const errorMessage = error ? t(`errors.${error}`) : null;
  const selectedLabel = devices.find((device) => device.deviceId === selectedDeviceId)?.label;
  const selectedRoi = rois.find((roi) => roi.id === selectedRoiId);
  const selectedRoiLabel = selectedRoi
    ? t(`slots.${selectedRoi.side}`, { number: selectedRoi.slotIndex + 1 })
    : "";
  const selectedRoiBounds = selectedRoi && resolution
    ? cropBounds(selectedRoi, resolution.width, resolution.height)
    : null;

  return (
    <DkApp>
      <DkBar>
        <DkTitle icon="camera" label={t("title")} sub={t("subtitle")} />
        <DkSpacer />
        <DkChip icon={stream ? "check" : "camera"} tone={stream ? "var(--ok)" : undefined}>
          {stream ? t("status.connected") : t("status.disconnected")}
        </DkChip>
      </DkBar>

      <DkBody>
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_19rem]">
          <section className="grid min-w-0 gap-3">
            <div
              ref={overlayRef}
              className="relative aspect-video overflow-hidden border border-line-2 bg-black"
              onPointerMove={moveRoiDrag}
              onPointerUp={() => setDragging(null)}
              onPointerCancel={() => setDragging(null)}
            >
              {stream && (
                <video
                  ref={videoRef}
                  className={capturedFrame ? "hidden" : "h-full w-full object-contain"}
                  autoPlay
                  muted
                  playsInline
                  onLoadedMetadata={(event) =>
                    setResolution({ width: event.currentTarget.videoWidth, height: event.currentTarget.videoHeight })
                  }
                />
              )}
              {capturedFrame ? (
                <img className="h-full w-full object-contain" src={capturedFrame} alt={t("capture.alt")} />
              ) : !stream ? (
                <div className="absolute inset-0 grid place-items-center p-6 text-center text-sm text-txt-dim">
                  {t("empty")}
                </div>
              ) : null}
              {capturedFrame && (
                <div className="pointer-events-none absolute inset-0">
                  {rois.map((roi) => {
                    const active = roi.id === selectedRoiId;
                    return (
                      <button
                        key={roi.id}
                        type="button"
                        className={`pointer-events-auto absolute touch-none border-2 text-left transition-colors ${
                          active ? "border-accent bg-accent/15" : "border-white/75 bg-black/10 hover:border-accent"
                        }`}
                        style={{
                          left: `${roi.x * 100}%`,
                          top: `${roi.y * 100}%`,
                          width: `${roi.width * 100}%`,
                          height: `${roi.height * 100}%`,
                        }}
                        aria-label={t(`slots.${roi.side}`, { number: roi.slotIndex + 1 })}
                        onPointerDown={(event) => startRoiDrag(event, roi.id)}
                        onClick={() => setSelectedRoiId(roi.id)}
                      >
                        <span className="absolute -left-px -top-px bg-black/75 px-1.5 py-0.5 font-mono text-[10px] font-bold text-white">
                          {roi.slotIndex + 1}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
              {capturedFrame && calibrating && selectedRoi && (
                <div className="pointer-events-none absolute bottom-2 left-2 z-10 max-w-[calc(100%-1rem)] border border-accent/60 bg-black/85 px-2.5 py-2 text-white shadow-lg">
                  <p className="truncate text-xs font-bold">{selectedRoiLabel}</p>
                  <p className="mt-1 font-mono text-[10px] text-accent">
                    {t("calibration.normalized", {
                      x: selectedRoi.x.toFixed(4),
                      y: selectedRoi.y.toFixed(4),
                      width: selectedRoi.width.toFixed(4),
                      height: selectedRoi.height.toFixed(4),
                    })}
                  </p>
                  {selectedRoiBounds && (
                    <p className="mt-0.5 font-mono text-[10px] text-white/75">
                      {t("calibration.pixels", selectedRoiBounds)}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button variant="pri" icon="play" onClick={() => void connect()} loading={loading}>
                {stream ? t("buttons.reconnect") : t("buttons.connect")}
              </Button>
              <Button icon="pause" onClick={disconnect} disabled={!stream}>
                {t("buttons.disconnect")}
              </Button>
              <Button icon="camera" onClick={captureFrame} disabled={!stream}>
                {t("buttons.capture")}
              </Button>
              {capturedFrame && (
                <>
                  <Button
                    icon="target"
                    variant={calibrating ? "pri" : "default"}
                    onClick={() => setCalibrating((current) => !current)}
                  >
                    {t("buttons.calibrate")}
                  </Button>
                  <Button icon="layers" onClick={() => void extractSlots()} loading={extracting}>
                    {t("buttons.extract")}
                  </Button>
                  <Button
                    icon="search"
                    onClick={() => void recognize()}
                    loading={recognizing}
                    disabled={slotCrops.length === 0 || rosterLoading || recognitionCandidates.length === 0}
                  >
                    {t("buttons.recognize")}
                  </Button>
                </>
              )}
              {resolution && (
                <span className="font-mono text-xs text-txt-dim">
                  {resolution.width}x{resolution.height}
                </span>
              )}
            </div>

            {errorMessage && (
              <p className="border border-bad/40 bg-bad/10 px-3 py-2 text-sm text-bad" role="alert">
                {errorMessage}
              </p>
            )}
          </section>

          <aside className="grid content-start gap-4">
            <div className="border border-line-2 bg-panel p-4">
              <h2 className="font-display text-sm font-bold uppercase tracking-[0.08em] text-txt">{t("source.title")}</h2>
              <p className="mt-2 text-sm leading-6 text-txt-muted">{t("source.description")}</p>
              <label className="mt-4 grid gap-1.5 text-xs font-bold uppercase tracking-[0.08em] text-txt-dim">
                {t("source.camera")}
                <select
                  className="h-10 min-w-0 border border-line-2 bg-base px-2 text-sm font-normal normal-case tracking-normal text-txt outline-none focus:border-accent"
                  value={selectedDeviceId}
                  onChange={(event) => setSelectedDeviceId(event.target.value)}
                  disabled={loading}
                >
                  {devices.length === 0 && <option value="">{t("source.noCameras")}</option>}
                  {devices.map((device, index) => (
                    <option key={device.deviceId} value={device.deviceId}>
                      {device.label || t("source.unnamed", { number: index + 1 })}
                    </option>
                  ))}
                </select>
              </label>
              <Button className="mt-3" size="sm" icon="refresh" onClick={() => void refreshDevices()}>
                {t("buttons.refresh")}
              </Button>
            </div>

            {capturedFrame ? (
              <div className="border border-line-2 bg-panel p-4">
                <h2 className="font-display text-sm font-bold uppercase tracking-[0.08em] text-txt">{t("calibration.title")}</h2>
                <p className="mt-2 text-sm leading-6 text-txt-muted">{t("calibration.description")}</p>
                <p className="mt-3 font-mono text-xs text-txt-dim">{t("calibration.selected", { slot: selectedRoiLabel })}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button size="sm" icon="target" variant={calibrating ? "pri" : "default"} onClick={() => setCalibrating((current) => !current)}>
                    {t("buttons.calibrate")}
                  </Button>
                  <Button size="sm" icon="refresh" onClick={resetRois}>
                    {t("buttons.reset")}
                  </Button>
                </div>
                <div className="mt-4 border-t border-line-2 pt-3">
                  <p className="font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-txt-dim">{t("calibration.values")}</p>
                  <div className="mt-2 grid max-h-64 gap-1 overflow-y-auto pr-1">
                    {rois.map((roi) => {
                      const active = roi.id === selectedRoiId;
                      const bounds = resolution ? cropBounds(roi, resolution.width, resolution.height) : null;
                      return (
                        <button
                          key={roi.id}
                          type="button"
                          className={`grid min-w-0 gap-0.5 border px-2 py-1.5 text-left ${
                            active ? "border-accent bg-accent/10" : "border-line-2 bg-base hover:border-accent/60"
                          }`}
                          aria-pressed={active}
                          onClick={() => setSelectedRoiId(roi.id)}
                        >
                          <span className="truncate text-[10px] font-bold text-txt">
                            {t(`slots.${roi.side}`, { number: roi.slotIndex + 1 })}
                          </span>
                          <span className="font-mono text-[9px] leading-4 text-txt-dim">
                            {t("calibration.normalized", {
                              x: roi.x.toFixed(4),
                              y: roi.y.toFixed(4),
                              width: roi.width.toFixed(4),
                              height: roi.height.toFixed(4),
                            })}
                          </span>
                          {bounds && (
                            <span className="font-mono text-[9px] leading-4 text-txt-dim">
                              {t("calibration.pixels", bounds)}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <p className="mt-3 border-t border-line-2 pt-3 font-mono text-[10px] text-txt-dim">
                  {rosterLoading
                    ? t("recognition.rosterLoading")
                    : `${t("recognition.roster", { count: recognitionCandidates.length })}${rosterRegulation ? ` · ${rosterRegulation}` : ""}`}
                </p>
              </div>
            ) : (
              <div className="border border-line-2 bg-panel p-4">
                <h2 className="font-display text-sm font-bold uppercase tracking-[0.08em] text-txt">{t("next.title")}</h2>
                <p className="mt-2 text-sm leading-6 text-txt-muted">{t("next.description")}</p>
                {selectedLabel && <p className="mt-3 truncate font-mono text-xs text-txt-dim">{selectedLabel}</p>}
              </div>
            )}
          </aside>

          {capturedFrame && slotCrops.length > 0 && (
            <section className="grid gap-3 lg:col-span-2">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-display text-sm font-bold uppercase tracking-[0.08em] text-txt">{t("slots.title")}</h2>
                  <p className="mt-1 text-sm text-txt-muted">{t("slots.description")}</p>
                </div>
                <span className="font-mono text-xs text-txt-dim">{t("capture.localOnly")}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
                {slotCrops.map(({ roi, dataUrl }) => {
                  const label = t(`slots.${roi.side}`, { number: roi.slotIndex + 1 });
                  return (
                    <div key={roi.id} className="grid gap-2 border border-line-2 bg-panel p-2">
                      <img className="aspect-square w-full bg-black object-contain" src={dataUrl} alt={label} />
                      <p className="truncate font-mono text-[10px] uppercase tracking-[0.08em] text-txt-dim">{label}</p>
                      <Input
                        size="sm"
                        value={slotNames[roi.id] ?? ""}
                        placeholder={t("slots.placeholder")}
                        aria-label={label}
                        onChange={(event) => setSlotNames((current) => ({ ...current, [roi.id]: event.target.value }))}
                      />
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {capturedFrame && slotCrops.length > 0 && recognizing && (
            <section className="grid gap-2 border border-accent/40 bg-accent/5 p-3 lg:col-span-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-mono text-xs font-bold uppercase tracking-[0.08em] text-txt">{t("recognition.loading")}</p>
                <span className="font-mono text-xs text-txt-dim">
                  {t("recognition.progress", { completed: templateProgress.completed, total: templateProgress.total })}
                </span>
              </div>
              <div className="h-1 overflow-hidden bg-line-2">
                <div
                  className="h-full bg-accent transition-[width]"
                  style={{
                    width: `${templateProgress.total > 0 ? (templateProgress.completed / templateProgress.total) * 100 : 0}%`,
                  }}
                />
              </div>
            </section>
          )}

          {capturedFrame && recognitionResults.length > 0 && (
            <section className="grid gap-3 lg:col-span-2">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-display text-sm font-bold uppercase tracking-[0.08em] text-txt">{t("recognition.title")}</h2>
                  <p className="mt-1 text-sm text-txt-muted">{t("recognition.description")}</p>
                  <a
                    className="mt-1 inline-block font-mono text-[10px] text-txt-dim underline decoration-line-2 underline-offset-2"
                    href="https://championsbattledata.com/"
                    rel="noreferrer"
                    target="_blank"
                  >
                    {t("recognition.source")}
                  </a>
                </div>
                <span className="font-mono text-xs text-txt-dim">
                  {t("recognition.roster", { count: recognitionCandidates.length })}
                </span>
              </div>
              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {recognitionResults.map((result) => {
                  const roi = slotCrops.find((crop) => crop.roi.id === result.slotId)?.roi;
                  if (!roi) return null;
                  const slotLabel = t(`slots.${roi.side}`, { number: roi.slotIndex + 1 });
                  return (
                    <div key={result.slotId} className="grid gap-2 border border-line-2 bg-panel p-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-txt-dim">{slotLabel}</p>
                        <span
                          className={`shrink-0 font-mono text-[10px] font-bold uppercase tracking-[0.08em] ${
                            result.status === "match"
                              ? "text-ok"
                              : result.status === "review"
                                ? "text-warn"
                                : "text-bad"
                          }`}
                        >
                          {t(`recognition.status.${result.status}`)}
                        </span>
                      </div>
                      {result.best ? (
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate font-display text-base font-bold text-txt">{result.best.name}</p>
                            <p className="font-mono text-[10px] text-txt-dim">
                              {t("recognition.confidence", { value: Math.round(result.best.confidence * 100) })}
                            </p>
                          </div>
                          <Button size="sm" icon="check" onClick={() => applyRecognition(result)}>
                            {t("recognition.use")}
                          </Button>
                        </div>
                      ) : (
                        <p className="text-sm text-txt-muted">{t("recognition.noMatch")}</p>
                      )}
                      {result.candidates.length > 1 && (
                        <div className="grid gap-1 border-t border-line-2 pt-2">
                          <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-txt-dim">{t("recognition.alternatives")}</p>
                          {result.candidates.slice(1).map((candidate) => (
                            <button
                              key={candidate.id}
                              type="button"
                              className="flex items-center justify-between gap-2 border border-line-2 bg-base px-2 py-1.5 text-left text-xs text-txt hover:border-accent"
                              onClick={() => setSlotNames((current) => ({ ...current, [result.slotId]: candidate.name }))}
                            >
                              <span className="truncate">{candidate.name}</span>
                              <span className="font-mono text-[10px] text-txt-dim">{Math.round(candidate.confidence * 100)}%</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      </DkBody>
    </DkApp>
  );
}
