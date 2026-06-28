/**
 * Determines the status of an event based on its start and end dates
 * @param startDate The event's start date
 * @param endDate The event's end date (optional)
 * @returns Object containing status label and CSS class
 */
export function getEventStatus(startDate: string | Date, endDate?: string | Date | null) {
  const now = new Date();
  const start = new Date(startDate);
  
  // Handle invalid endDate more gracefully
  const hasValidEndDate = endDate && !isNaN(new Date(endDate).getTime());
  const end = hasValidEndDate ? new Date(endDate) : null;
  
  // First check if the end date is invalid or missing
  if (!hasValidEndDate) {
    return { 
      label: "En Curso", 
      class: "bg-success/20 text-success-hover border-success-border/30" 
    };
  }
  
  // Then check the event's timeline status
  if (now < start) {
    return { 
      label: "Próximo", 
      class: "bg-primary/20 text-primary-hover border-primary/30" 
    };
  } else if (now > end!) {
    return { 
      label: "Finalizado", 
      class: "bg-layer-3/20 text-ink-muted border-edge/30" 
    };
  } else {
    return { 
      label: "En Curso", 
      class: "bg-success/20 text-success-hover border-success-border/30" 
    };
  }
}