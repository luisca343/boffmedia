import { useCallback, useState } from 'react';

const MECHANIC_EVENT_MARKERS = ['|-mega|', '|-terastallize|', '|-zpower|', '|-burst|', '|-primal|'];

export function hasMechanicBeenUsed(htmlLog: string[]): boolean {
  return htmlLog.some((line) => MECHANIC_EVENT_MARKERS.some((marker) => line.includes(marker)));
}

export type ActiveMechanic = 'terastallize' | 'mega' | 'dynamax' | 'zmove' | null;

export function useChoiceMechanics(
  baseSender: (choice: string) => void,
) {
  const [activeMechanic, setActiveMechanic] = useState<ActiveMechanic>(null);

  const makeChoiceWithMechanic = useCallback((choice: string) => {
    if (activeMechanic) {
      baseSender(`${choice} ${activeMechanic}`);
      setActiveMechanic(null);
    } else {
      baseSender(choice);
    }
  }, [activeMechanic, baseSender]);

  return {
    activeMechanic,
    setActiveMechanic,
    makeChoiceWithMechanic,
  };
}
