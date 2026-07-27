'use client';

import { useState, useCallback } from 'react';
import { MoveSelector } from './MoveSelector';
import { useTranslations } from 'next-intl';
import { SwitchMenu } from './SwitchMenu';
import { ActionButtons, type BattleMechanic } from './ActionButtons';
import type { BattleRequest } from '../../types';

interface ChoiceInputProps {
  request: BattleRequest;
  makeChoice: (choice: string) => void;
  isWaiting: boolean;
  mechanicUsed: boolean;
}

export function ChoiceInput({ request, makeChoice, isWaiting, mechanicUsed }: ChoiceInputProps) {
  const t = useTranslations('battlesim');
  const [activeMechanic, setActiveMechanic] = useState<BattleMechanic | null>(null);

  const handleToggle = useCallback((mechanic: BattleMechanic) => {
    setActiveMechanic((prev) => (prev === mechanic ? null : mechanic));
  }, []);

  const handleMakeChoice = useCallback((choice: string) => {
    if (activeMechanic) {
      makeChoice(`${choice} ${activeMechanic}`);
    } else {
      makeChoice(choice);
    }
    setActiveMechanic(null);
  }, [activeMechanic, makeChoice]);

  if (!isWaiting || !request) return null;

  // Infer requestType if missing (raw PS protocol doesn't include it)
  const requestType = request.requestType || (request.active ? 'move' : request.side ? 'switch' : null);

  if (requestType === 'move') {
    const trapped = request.active?.[0]?.trapped;
    const hasActions = request.active?.[0] && (
      request.active[0].canMegaEvo ||
      request.active[0].zMoves ||
      request.active[0].canDynamax ||
      request.active[0].canTerastallize
    );

    return (
      <div className="flex flex-col gap-3">
        <MoveSelector
          request={request}
          makeChoice={handleMakeChoice}
          activeMechanic={activeMechanic}
        />
        {hasActions && (
          <ActionButtons
            request={request}
            activeMechanic={activeMechanic}
            onToggle={handleToggle}
            disabled={mechanicUsed}
          />
        )}
        {!trapped && request.side?.pokemon && (
          <SwitchMenu request={request} makeChoice={makeChoice} />
        )}
      </div>
    );
  }

  if (requestType === 'switch') {
    return (
      <SwitchMenu
        request={request}
        makeChoice={makeChoice}
      />
    );
  }

  // Team preview (rarely used in random battles)
  if (requestType === 'team') {
    return (
      <div className="flex flex-col gap-2 p-4 bg-card rounded-lg border">
        <p className="text-sm text-muted-foreground">{t('choiceInput.teamPreviewDefault')}</p>
        <button
          onClick={() => makeChoice('team 1')}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
        >
          {t('choiceInput.confirmTeam')}
        </button>
      </div>
    );
  }

  return null;
}
