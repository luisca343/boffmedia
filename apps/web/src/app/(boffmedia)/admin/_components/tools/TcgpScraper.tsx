"use client";

import { useEffect, useState } from "react";
import { env } from "@/config/env.public";
import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/primitives/button";
import { boffPOST } from "@/services/boffAPI";

interface FetchStatusData {
  status:    "fetching" | "success" | "error";
  message:   string;
  timestamp: string;
}

const STATUS_STYLES: Record<FetchStatusData["status"], { dot: string; label: string }> = {
  success: { dot: "bg-green-400",  label: "text-green-400"  },
  error:   { dot: "bg-red-400",    label: "text-red-400"    },
  fetching:{ dot: "bg-amber-400 animate-pulse", label: "text-amber-400" },
};

export function TcgpScraper() {
  const [status, setStatus] = useState<FetchStatusData | null>(null);
  const [triggering, setTriggering] = useState(false);

  useEffect(() => {
    const eventSource = new EventSource(
      `${env.NEXT_PUBLIC_API}/tools/ptcgp/scrape/status`
    );
    eventSource.onmessage = (event) => {
      setStatus(JSON.parse(event.data) as FetchStatusData);
    };
    return () => eventSource.close();
  }, []);

  const triggerFetch = async () => {
    setTriggering(true);
    try {
      await boffPOST("/tools/ptcgp/scrape/refresh", { method: "POST" });
    } catch (error) {
      console.error("Failed to trigger fetch:", error);
    } finally {
      setTriggering(false);
    }
  };

  return (
    <div className="space-y-4 max-w-md">
      <p className="text-sm text-surface-400">
        Lanza un scrape de cartas de Pokémon TCG Pocket y actualiza los datos en la base de datos.
      </p>

      <div className="rounded-xl border border-surface-700/80 bg-surface-800/50 shadow-sm p-4 space-y-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-surface-500">
          Estado del scraper
        </p>

        {status ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full shrink-0 ${STATUS_STYLES[status.status].dot}`} />
              <span className={`text-sm font-medium ${STATUS_STYLES[status.status].label}`}>
                {status.status === "fetching" ? "Obteniendo datos…" :
                 status.status === "success"  ? "Datos actualizados" :
                 "Error al obtener datos"}
              </span>
            </div>
            <p className="text-sm text-surface-300">{status.message}</p>
            <p className="text-xs text-surface-500">
              Última actualización: {new Date(status.timestamp).toLocaleString()}
            </p>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-surface-500 text-sm">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>Conectando…</span>
          </div>
        )}

        <Button onClick={triggerFetch} disabled={triggering} className="w-full sm:w-auto">
          {triggering ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Iniciando...</>
          ) : (
            <><RefreshCw className="w-4 h-4 mr-2" />Cargar datos de TCG</>
          )}
        </Button>
      </div>
    </div>
  );
}
