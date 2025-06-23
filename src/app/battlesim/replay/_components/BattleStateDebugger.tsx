import React, { useEffect, useState } from 'react';
import { Protocol } from "@pkmn/protocol";

interface ActionType {
  index: number;
  type: string;
  args: string[];
  kwArgs: Record<string, any>;
  raw: string;
}

interface StateItem {
  action: number;
  state: ActionType;
}

interface BattleStateDebuggerProps {
  battleLog: string;
  currentAction: number;
  isPlaying: boolean;
}

const BattleStateDebugger = ({ battleLog, currentAction, isPlaying }: BattleStateDebuggerProps) => {
  const [parsedActions, setParsedActions] = useState<ActionType[]>([]);
  const [stateStack, setStateStack] = useState<StateItem[]>([]);
  
  useEffect(() => {
    if (!battleLog) return;
    
    // Parse battle log into discrete actions
    const actions = battleLog.split('\n').map((line, index) => {
      const { args, kwArgs } = Protocol.parseBattleLine(line);
      return {
        index,
        type: args[0],
        args: args.slice(1).map(arg => String(arg)), // Convert all args to strings
        kwArgs,
        raw: line
      };
    });
    setParsedActions(actions);
  }, [battleLog]);

  // Track state changes
  useEffect(() => {
    if (currentAction >= 0 && parsedActions[currentAction]) {
      setStateStack(prev => [...prev, {
        action: currentAction,
        state: parsedActions[currentAction]
      }].slice(-5)); // Keep last 5 state changes
    }
  }, [currentAction, parsedActions]);

  return (
    <div className="p-4 bg-surface-800 text-surface-50 rounded-lg">
      <h3 className="text-lg font-bold mb-2">Battle State Debug</h3>
      
      <div className="mb-4">
        <div className="text-sm font-semibold mb-1">Playback Status:</div>
        <div className="flex space-x-4">
          <div>Action: {currentAction}/{parsedActions.length}</div>
          <div>Playing: {isPlaying ? 'Yes' : 'No'}</div>
        </div>
      </div>
      
      <div className="mb-4">
        <div className="text-sm font-semibold mb-1">Recent State Changes:</div>
        <div className="space-y-2">
          {stateStack.map((item, i) => (
            <div key={i} className="p-2 bg-surface-700 rounded">
              <div className="text-xs text-surface-300">Action {item.action}</div>
              <div className="font-mono text-sm">{item.state.type}: {item.state.args.join(', ')}</div>
            </div>
          ))}
        </div>
      </div>
      
      <div>
        <div className="text-sm font-semibold mb-1">Current Action:</div>
        {parsedActions[currentAction] && (
          <pre className="text-xs bg-surface-700 p-2 rounded overflow-x-auto">
            {JSON.stringify(parsedActions[currentAction], null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
};

export default BattleStateDebugger;