"use client";

import { useEffect, useRef, useState } from "react";
import { wrap, type Remote } from "comlink";
import type { CompatWorkerAPI } from "../_lib/worker/worker-api";

type EngineStatus = "idle" | "connecting" | "ready" | "error";

export function useCompatEngine() {
  const workerRef = useRef<Worker | null>(null);
  const apiRef = useRef<Remote<CompatWorkerAPI> | null>(null);
  const [status, setStatus] = useState<EngineStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setStatus("connecting");

    const worker = new Worker(
      new URL("../_lib/worker/compat.worker.ts", import.meta.url),
      { type: "module" }
    );

    workerRef.current = worker;
    const api = wrap<CompatWorkerAPI>(worker);
    apiRef.current = api;

    api
      .ping()
      .then((response) => {
        if (response === "pong") {
          setStatus("ready");
        } else {
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
