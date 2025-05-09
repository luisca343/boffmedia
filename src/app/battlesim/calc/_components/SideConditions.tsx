'use client';

import React from 'react';
import { Side } from '@smogon/calc';

interface SideConditionsProps {
  side: Side;
  onSideChange: (field: keyof Side, value: any) => void;
}

export default function SideConditions({ side, onSideChange }: SideConditionsProps) {
  return (
    <div>
      {/* Stealth Rock */}
      <div className="flex justify-between items-center mb-2">
        <button 
          className="px-3 py-1 text-xs rounded bg-surface-700 hover:bg-surface-600"
          onClick={() => onSideChange('isSR', !side.isSR)}
        >
          Stealth Rock
        </button>
        <div className={`px-3 py-1 text-xs ${side.isSR ? 'text-primary-400' : 'text-surface-400'}`}>
          {side.isSR ? 'On' : 'Off'}
        </div>
      </div>
      
      {/* Spikes */}
      <div className="flex items-center gap-2 mb-2">
        <div className="text-xs text-surface-300">Spikes</div>
        <div className="flex gap-1">
          {[0, 1, 2, 3].map(level => (
            <button
              key={`spikes-${level}`}
              className={`w-6 h-6 text-center text-xs rounded ${side.spikes === level ? 'bg-surface-600' : 'bg-surface-700 hover:bg-surface-600'}`}
              onClick={() => onSideChange('spikes', level)}
            >
              {level}
            </button>
          ))}
        </div>
      </div>
      
      {/* Screens */}
      <div className="grid grid-cols-2 gap-1 mb-1">
        <button 
          className={`px-2 py-1 text-xs rounded ${side.isReflect ? 'bg-surface-600' : 'bg-surface-700 hover:bg-surface-600'}`}
          onClick={() => onSideChange('isReflect', !side.isReflect)}
        >
          Reflect
        </button>
        <button 
          className={`px-2 py-1 text-xs rounded ${side.isLightScreen ? 'bg-surface-600' : 'bg-surface-700 hover:bg-surface-600'}`}
          onClick={() => onSideChange('isLightScreen', !side.isLightScreen)}
        >
          Light Screen
        </button>
      </div>

      {/* Other conditions */}
      <button 
        className={`px-2 py-1 text-xs rounded w-full mb-1 ${side.isProtected ? 'bg-surface-600' : 'bg-surface-700 hover:bg-surface-600'}`}
        onClick={() => onSideChange('isProtected', !side.isProtected)}
      >
        Protect
      </button>
      
      <button 
        className={`px-2 py-1 text-xs rounded w-full mb-1 ${side.isSeeded ? 'bg-surface-600' : 'bg-surface-700 hover:bg-surface-600'}`}
        onClick={() => onSideChange('isSeeded', !side.isSeeded)}
      >
        Leech Seed
      </button>
      
      <button 
        className={`px-2 py-1 text-xs rounded w-full mb-1 ${side.isForesight ? 'bg-surface-600' : 'bg-surface-700 hover:bg-surface-600'}`}
        onClick={() => onSideChange('isForesight', !side.isForesight)}
      >
        Foresight
      </button>
      
      <button 
        className={`px-2 py-1 text-xs rounded w-full mb-1 ${side.isTailwind ? 'bg-surface-600' : 'bg-surface-700 hover:bg-surface-600'}`}
        onClick={() => onSideChange('isTailwind', !side.isTailwind)}
      >
        Tailwind
      </button>
      
      <button 
        className={`px-2 py-1 text-xs rounded w-full mb-1 ${side.isHelpingHand ? 'bg-surface-600' : 'bg-surface-700 hover:bg-surface-600'}`}
        onClick={() => onSideChange('isHelpingHand', !side.isHelpingHand)}
      >
        Helping Hand
      </button>
      
      <button 
        className={`px-2 py-1 text-xs rounded w-full mb-1 ${side.isFlowerGift ? 'bg-surface-600' : 'bg-surface-700 hover:bg-surface-600'}`}
        onClick={() => onSideChange('isFlowerGift', !side.isFlowerGift)}
      >
        Flower Gift
      </button>
      
      <button 
        className={`px-2 py-1 text-xs rounded w-full mb-1 ${side.isFriendGuard ? 'bg-surface-600' : 'bg-surface-700 hover:bg-surface-600'}`}
        onClick={() => onSideChange('isFriendGuard', !side.isFriendGuard)}
      >
        Friend Guard
      </button>
      
      <button 
        className={`px-2 py-1 text-xs rounded w-full mb-1 ${side.isAuroraVeil ? 'bg-surface-600' : 'bg-surface-700 hover:bg-surface-600'}`}
        onClick={() => onSideChange('isAuroraVeil', !side.isAuroraVeil)}
      >
        Aurora Veil
      </button>
      
      <button 
        className={`px-2 py-1 text-xs rounded w-full mb-1 ${side.isBattery ? 'bg-surface-600' : 'bg-surface-700 hover:bg-surface-600'}`}
        onClick={() => onSideChange('isBattery', !side.isBattery)}
      >
        Battery
      </button>
      
      <button 
        className={`px-2 py-1 text-xs rounded w-full mb-1 ${side.isPowerSpot ? 'bg-surface-600' : 'bg-surface-700 hover:bg-surface-600'}`}
        onClick={() => onSideChange('isPowerSpot', !side.isPowerSpot)}
      >
        Power Spot
      </button>

      {/* Switching */}
      <select
        className="w-full bg-surface-700 border border-surface-600 rounded px-2 py-1 text-xs mb-2"
        value={side.isSwitching || ''}
        onChange={(e) => onSideChange('isSwitching', e.target.value || undefined)}
      >
        <option value="">Not Switching</option>
        <option value="out">Switching Out</option>
        <option value="in">Switching In</option>
      </select>
      
      {/* Export */}
      <button className="bg-surface-700 hover:bg-surface-600 text-xs px-4 py-1 rounded text-surface-300">
        Export
      </button>
    </div>
  );
}