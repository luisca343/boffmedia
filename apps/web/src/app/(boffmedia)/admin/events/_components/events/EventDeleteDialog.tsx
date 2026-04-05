"use client";

import { useState } from "react";
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/primitives/dialog";
import { Button } from "@/components/ui/primitives/button";
import { toast } from "react-toastify";
import { Calendar, RefreshCw, AlertTriangle } from "lucide-react";
import type { Event } from "@boffmedia/shared";

interface EventDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: Event;
  onSuccess: () => void;
}

export function EventDeleteDialog({ open, onOpenChange, event, onSuccess }: EventDeleteDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleDelete = async () => {
    setIsSubmitting(true);
    try {
      // await eventsService.deleteEvent(event.id)
      toast.success(`El evento "${event.title}" ha sido eliminado.`);
      onSuccess();
    } catch {
      toast.error("Ocurrió un error al intentar eliminar el evento.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[90vh] overflow-y-auto border"
        style={{
          background: "rgba(9,13,27,0.98)",
          borderColor: "rgba(239,68,68,0.2)",
          boxShadow: "0 24px 60px rgba(0,0,0,0.7)",
        }}
      >
        {/* Top neon bar */}
        <div
          className="absolute top-0 left-0 right-0 h-[2px] rounded-t-lg"
          style={{
            background: "linear-gradient(90deg, transparent, rgba(239,68,68,0.6), transparent)",
          }}
        />

        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{
                background: "rgba(239,68,68,0.08)",
                border: "1px solid rgba(239,68,68,0.22)",
              }}
            >
              <AlertTriangle className="w-4 h-4" style={{ color: "rgba(239,68,68,0.8)" }} />
            </div>
            <DialogTitle className="text-surface-50 font-black" style={{ fontFamily: "Orbitron, sans-serif" }}>
              Confirmar Eliminación
            </DialogTitle>
          </div>
          <DialogDescription className="text-surface-400 text-sm">
            Esta acción no se puede deshacer.
          </DialogDescription>
        </DialogHeader>

        <div className="py-3 space-y-4">
          {/* Event preview */}
          <div
            className="flex items-center gap-3 p-4 rounded-lg border"
            style={{
              background: "rgba(249,115,22,0.04)",
              borderColor: "rgba(249,115,22,0.15)",
            }}
          >
            <div
              className="w-11 h-11 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0"
              style={{
                background: "rgba(249,115,22,0.08)",
                border: "1px solid rgba(249,115,22,0.2)",
              }}
            >
              {event.icon ? (
                <img src={event.icon} alt={event.title} className="w-full h-full object-cover" />
              ) : (
                <Calendar className="w-5 h-5" style={{ color: "rgba(249,115,22,0.7)" }} />
              )}
            </div>
            <div className="min-w-0">
              <h4 className="text-sm font-semibold text-surface-100 truncate">{event.title}</h4>
              <p className="text-[11px] font-mono text-surface-600">ID: {event.id}</p>
            </div>
          </div>

          {/* Warning */}
          <p
            className="text-xs font-mono px-3 py-2 rounded"
            style={{
              color: "rgba(239,68,68,0.8)",
              background: "rgba(239,68,68,0.06)",
              border: "1px solid rgba(239,68,68,0.15)",
            }}
          >
            ⚠ Eliminar este evento afectará a todos los participantes y sus registros.
          </p>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            style={{ borderColor: "rgba(249,115,22,0.2)", color: "rgba(249,115,22,0.7)" }}
          >
            Cancelar
          </Button>
          <Button
            variant="error"
            size="sm"
            onClick={handleDelete}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="mr-1.5 w-3.5 h-3.5 animate-spin" />
                Eliminando...
              </>
            ) : (
              "Eliminar Evento"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
