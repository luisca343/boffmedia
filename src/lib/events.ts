/**
 * Determines the status of an event based on its start and end dates
 * @param startDate The event's start date
 * @param endDate The event's end date (optional)
 * @param t Optional translation function for localizing status labels
 * @returns Object containing status key, label, and CSS class
 */
export function getEventStatus(
  startDate: string | Date, 
  endDate?: string | Date | null,
  t?: (key: string) => string
) {
  const now = new Date();
  const start = new Date(startDate);
  
  // Handle invalid endDate more gracefully
  const hasValidEndDate = endDate && !isNaN(new Date(endDate).getTime());
  const end = hasValidEndDate ? new Date(endDate) : null;
  
  // First check if the end date is invalid or missing
  if (!hasValidEndDate) {
    return { 
      key: 'active',
      label: t ? t('admin.eventStatus.active') : "En Curso", 
      class: "bg-success-500/20 text-success-400 border-success-500/30" 
    };
  }
  
  // Then check the event's timeline status
  if (now < start) {
    return { 
      key: 'upcoming',
      label: t ? t('admin.eventStatus.upcoming') : "Próximo", 
      class: "bg-primary-500/20 text-primary-400 border-primary-500/30" 
    };
  } else if (now > end!) {
    return { 
      key: 'completed',
      label: t ? t('admin.eventStatus.completed') : "Finalizado", 
      class: "bg-surface-500/20 text-surface-400 border-surface-500/30" 
    };
  } else {
    return { 
      key: 'active',
      label: t ? t('admin.eventStatus.active') : "En Curso", 
      class: "bg-success-500/20 text-success-400 border-success-500/30" 
    };
  }
}