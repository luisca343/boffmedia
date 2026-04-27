"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/primitives/card";
import { Button } from "@/components/ui/primitives/button";
import { Badge } from "@/components/ui/primitives/badge";
import { boffPOST } from "@/services/boffAPI";

interface FetchStatusData {
  status:    "fetching" | "success" | "error";
  message:   string;
  timestamp: string;
}

export function TcgpScraper() {
  const [status, setStatus] = useState<FetchStatusData | null>(null);

  useEffect(() => {
    const eventSource = new EventSource(
      `${process.env.NEXT_PUBLIC_API}/tools/ptcgp/scrape/status`
    );
    eventSource.onmessage = (event) => {
      setStatus(JSON.parse(event.data) as FetchStatusData);
    };
    return () => eventSource.close();
  }, []);

  const triggerFetch = async () => {
    try {
      await boffPOST("/tools/ptcgp/scrape/refresh", { method: "POST" });
    } catch (error) {
      console.error("Failed to trigger fetch:", error);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Cargar datos de TCGP</CardTitle>
      </CardHeader>
      <CardContent>
        {status && (
          <div className="space-y-2 mb-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Estado:</span>
              <Badge
                variant={
                  status.status === "success"
                    ? "default"
                    : status.status === "error"
                    ? "destructive"
                    : "default"
                }
              >
                {status.status}
              </Badge>
            </div>
            <p className="text-sm">{status.message}</p>
            <p className="text-xs text-surface-500">
              Última actualización: {new Date(status.timestamp).toLocaleString()}
            </p>
          </div>
        )}
        <Button onClick={triggerFetch} className="w-full">
          Cargar datos de TCG
        </Button>
      </CardContent>
    </Card>
  );
}
