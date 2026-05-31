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

  if (request.requestType === 'move') {
    return (
      <MoveSelector
        request={request}
        makeChoice={makeChoice}
      />
    );
  }

  if (request.requestType === 'switch') {
    return (
      <SwitchMenu
        request={request}
        makeChoice={makeChoice}
      />
    );
  }

  // Team preview (rarely used in random battles)
  if (request.requestType === 'team') {
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
