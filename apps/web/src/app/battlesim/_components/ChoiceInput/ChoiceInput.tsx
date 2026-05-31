'use client';

import { Protocol } from '@pkmn/protocol';
import { MoveSelector } from './MoveSelector';
import { SwitchMenu } from './SwitchMenu';

interface ChoiceInputProps {
  request: Protocol.Request;
  makeChoice: (choice: string) => void;
  isWaiting: boolean;
}

export function ChoiceInput({ request, makeChoice, isWaiting }: ChoiceInputProps) {
  if (!isWaiting || !request) return null;

  // Infer requestType if missing (raw PS protocol doesn't include it)
  const requestType = request.requestType || (request.active ? 'move' : request.side ? 'switch' : null);

  if (requestType === 'move') {
    const trapped = request.active?.[0]?.trapped;
    return (
      <div className="flex flex-col gap-3">
        <MoveSelector request={request} makeChoice={makeChoice} />
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
        <p className="text-sm text-muted-foreground">Team Preview — sending default order</p>
        <button
          onClick={() => makeChoice('team 1')}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
        >
          Confirm Team
        </button>
      </div>
    );
  }

  return null;
}
