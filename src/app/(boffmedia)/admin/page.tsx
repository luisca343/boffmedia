"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useBoffSession } from "../../../services/useBoffSession";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import { boffPOST } from "@/services/boffAPI";
import UnauthorizedPage from "../_components/Unauthorized";

interface FetchStatusData {
  status: "fetching" | "success" | "error";
  message: string;
  timestamp: string;
}

export default function AdminPage() {
  const { session } = useBoffSession();

  const [status, setStatus] = useState<FetchStatusData | null>(null);

  useEffect(() => {
    const eventSource = new EventSource(
      `${process.env.NEXT_PUBLIC_API}/tools/ptcgp/scrape/status`
    );
    console.log("eventSource:", eventSource);

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data) as FetchStatusData;
      setStatus(data);
    };

    return () => {
      eventSource.close();
    };
  }, []);

  const triggerFetch = async () => {
    try {
      await boffPOST("/tools/ptcgp/scrape/refresh", { method: "POST" });
    } catch (error) {
      console.error("Failed to trigger fetch:", error);
    }
  };

  if (!session?.user.roles.includes("BOFF_ADMIN")) {
    return <UnauthorizedPage />;
  }

  return (
    <div>
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Cargar datos de TCGP</CardTitle>
        </CardHeader>
        <CardContent>
          {status && (
            <div className="space-y-2">
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
                Última actualización:{" "}
                {new Date(status.timestamp).toLocaleString()}
              </p>
            </div>
          )}
          <Button onClick={triggerFetch} className="mt-4 w-full">
            Cargar datos de TCG
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
