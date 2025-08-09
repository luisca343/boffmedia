"use client"

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useBoffSession } from "@/services/useBoffSession";
import { User, UserPlus, Loader2, Lock, CheckCircle, Clock } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import type { Event } from "@/types/events";
import { EventsService } from "@/services/api/boffmedia/eventsService";
import { getEventStatus } from "@/lib/events";

interface EventRegistrationButtonProps {
  event: Event;
}

export function EventRegistrationButton({ event }: EventRegistrationButtonProps) {
  const { session } = useBoffSession();
  const router = useRouter();
  const [isRegistering, setIsRegistering] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [participants, setParticipants] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Check if the current user is already registered for this event
  useEffect(() => {
    async function checkRegistration() {
      if (!session?.user?.id || !event.id) return;
      
      try {
        setIsLoading(true);
        const result = await EventsService.getEventParticipants(event.id);
        setParticipants(result.data || []);
        
        // Check if user is already registered
        const userIsRegistered = result.data?.some(
          (participant) => participant.userId === parseInt(session.user.id)
        );
        setIsRegistered(!!userIsRegistered);
      } catch (error) {
        console.error("Error checking registration status:", error);
      } finally {
        setIsLoading(false);
      }
    }
    
    checkRegistration();
  }, [session?.user?.id, event.id]);
  
  const handleRegistration = async () => {
    if (!session?.user?.id) {
      // Redirect to login
      router.push(`/login?redirect=/events/${event.id}`);
      return;
    }
    
    try {
      setIsRegistering(true);
      
      if (isRegistered) {
        // TODO: Implement unregister logic if needed
        toast.info("La cancelación de registro no está disponible en este momento");
        setIsRegistering(false);
        return;
      }
      
      // Register for the event
      const joinEventData = {
        userId: parseInt(session.user.id),
        nickname: session.user.username || session.user.name || "",
        avatar: session.user.image || undefined,
      };
      
      const response = await EventsService.joinEvent(event.id, joinEventData);
      
      if (response.statusCode === 200) {
        setIsRegistered(true);
        toast.success("¡Te has registrado exitosamente para este evento!");
        
        // Refresh participant list
        const updatedParticipants = await EventsService.getEventParticipants(event.id);
        setParticipants(updatedParticipants.data || []);
      } else {
        toast.error(response.message || "No se pudo completar el registro");
      }
    } catch (error: any) {
      toast.error(
        error.message || 
        "Ocurrió un error durante el registro. Inténtalo de nuevo."
      );
      console.error("Registration error:", error);
    } finally {
      setIsRegistering(false);
    }
  };
  
  const status = getEventStatus(event.startDate, event.endDate);
  const isUpcoming = status.label === "Próximo";
  const isActive = status.label === "En Curso";
  
  const canRegister = isUpcoming || (event.type === "server" && isActive);

  if (!canRegister) {
    return (
      <Button disabled className="w-full bg-surface-700/50 text-surface-400 cursor-not-allowed border border-surface-600">
        <Lock className="mr-2 h-4 w-4" />
        Registro Cerrado
      </Button>
    );
  }
  
  if (isLoading) {
    return (
      <Button disabled className="w-full bg-surface-700/50 border border-purple-500/30">
        <Loader2 className="mr-2 h-4 w-4 animate-spin text-purple-400" />
        <span className="text-surface-300">Verificando registro...</span>
      </Button>
    );
  }
  
  return (
    <Button
      className={
        isRegistered 
          ? "w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 font-semibold shadow-lg" 
          : "w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
      }
      onClick={handleRegistration}
      disabled={isRegistering}
    >
      {isRegistering ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Procesando...
        </>
      ) : isRegistered ? (
        <>
          <CheckCircle className="mr-2 h-4 w-4" />
          ¡Registrado!
        </>
      ) : (
        <>
          <UserPlus className="mr-2 h-4 w-4" />
          {isActive ? 'Unirse Ahora' : 'Registrarse'}
        </>
      )}
    </Button>
  );
}