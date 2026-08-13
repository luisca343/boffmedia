"use client";

import { useEffect, useRef, useState } from "react";
import { wrap, type Remote } from "comlink";
import type { ViewerWorkerAPI } from "../_lib/viewer-api";

type EngineStatus = "idle" | "connecting" | "ready" | "error";

/** Boots the viewer's own worker (the 8 read-only engine ops) and Comlink-wraps it. */
export function useViewerEngine() {
  const workerRef = useRef<Worker | null>(null);
  const apiRef = useRef<Remote<ViewerWorkerAPI> | null>(null);
  const [status, setStatus] = useState<EngineStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setStatus("connecting");

    const worker = new Worker(new URL("../_lib/viewer.worker.ts", import.meta.url), {
      type: "module",
    });

    workerRef.current = worker;
    const api = wrap<ViewerWorkerAPI>(worker);
    apiRef.current = api;

    api
      .ping()
      .then((response) => {
        if (response === "pong") setStatus("ready");
        else {
          setError("Unexpected ping response");
          setStatus("error");
        }
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Worker failed to initialize");
        setStatus("error");
      });

    return () => {
      worker.terminate();
      workerRef.current = null;
      apiRef.current = null;
    };
  }, []);

  return { api: apiRef.current, status, error };
}
