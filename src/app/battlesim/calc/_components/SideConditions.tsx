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
          className={`px-3 py-1 text-xs rounded transition-colors ${
            side.isSR 
              ? 'bg-primary-500 text-white shadow-md' 
              : 'bg-surface-700 hover:bg-surface-600 active:bg-primary-800/50'
          }`}
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
              className={`w-6 h-6 text-center text-xs rounded transition-colors ${
                side.spikes === level 
                  ? 'bg-primary-500 text-white shadow-md' 
                  : 'bg-surface-700 hover:bg-surface-600 active:bg-primary-800/50'
              }`}
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
          className={`px-2 py-1 text-xs rounded transition-colors ${
            side.isReflect 
              ? 'bg-primary-500 text-white shadow-md' 
              : 'bg-surface-700 hover:bg-surface-600 active:bg-primary-800/50'
          }`}
          onClick={() => onSideChange('isReflect', !side.isReflect)}
        >
          Reflect
        </button>
        <button 
          className={`px-2 py-1 text-xs rounded transition-colors ${
            side.isLightScreen 
              ? 'bg-primary-500 text-white shadow-md' 
              : 'bg-surface-700 hover:bg-surface-600 active:bg-primary-800/50'
          }`}
          onClick={() => onSideChange('isLightScreen', !side.isLightScreen)}
        >
          Light Screen
        </button>
      </div>

      {/* Other conditions */}
      <button 
        className={`px-2 py-1 text-xs rounded w-full mb-1 transition-colors ${
          side.isProtected 
            ? 'bg-primary-500 text-white shadow-md' 
            : 'bg-surface-700 hover:bg-surface-600 active:bg-primary-800/50'
        }`}
        onClick={() => onSideChange('isProtected', !side.isProtected)}
      >
        Protect
      </button>
      
      <button 
        className={`px-2 py-1 text-xs rounded w-full mb-1 transition-colors ${
          side.isSeeded 
            ? 'bg-primary-500 text-white shadow-md' 
            : 'bg-surface-700 hover:bg-surface-600 active:bg-primary-800/50'
        }`}
        onClick={() => onSideChange('isSeeded', !side.isSeeded)}
      >
        Leech Seed
      </button>
      
      <button 
        className={`px-2 py-1 text-xs rounded w-full mb-1 transition-colors ${
          side.isForesight 
            ? 'bg-primary-500 text-white shadow-md' 
            : 'bg-surface-700 hover:bg-surface-600 active:bg-primary-800/50'
        }`}
        onClick={() => onSideChange('isForesight', !side.isForesight)}
      >
        Foresight
      </button>
      
      <button 
        className={`px-2 py-1 text-xs rounded w-full mb-1 transition-colors ${
          side.isTailwind 
            ? 'bg-primary-500 text-white shadow-md' 
            : 'bg-surface-700 hover:bg-surface-600 active:bg-primary-800/50'
        }`}
        onClick={() => onSideChange('isTailwind', !side.isTailwind)}
      >
        Tailwind
      </button>
      
      <button 
        className={`px-2 py-1 text-xs rounded w-full mb-1 transition-colors ${
          side.isHelpingHand 
            ? 'bg-primary-500 text-white shadow-md' 
            : 'bg-surface-700 hover:bg-surface-600 active:bg-primary-800/50'
        }`}
        onClick={() => onSideChange('isHelpingHand', !side.isHelpingHand)}
      >
        Helping Hand
      </button>
      
      <button 
        className={`px-2 py-1 text-xs rounded w-full mb-1 transition-colors ${
          side.isFlowerGift 
            ? 'bg-primary-500 text-white shadow-md' 
            : 'bg-surface-700 hover:bg-surface-600 active:bg-primary-800/50'
        }`}
        onClick={() => onSideChange('isFlowerGift', !side.isFlowerGift)}
      >
        Flower Gift
      </button>
      
      <button 
        className={`px-2 py-1 text-xs rounded w-full mb-1 transition-colors ${
          side.isFriendGuard 
            ? 'bg-primary-500 text-white shadow-md' 
            : 'bg-surface-700 hover:bg-surface-600 active:bg-primary-800/50'
        }`}
        onClick={() => onSideChange('isFriendGuard', !side.isFriendGuard)}
      >
        Friend Guard
      </button>
      
      <button 
        className={`px-2 py-1 text-xs rounded w-full mb-1 transition-colors ${
          side.isAuroraVeil 
            ? 'bg-primary-500 text-white shadow-md' 
            : 'bg-surface-700 hover:bg-surface-600 active:bg-primary-800/50'
        }`}
        onClick={() => onSideChange('isAuroraVeil', !side.isAuroraVeil)}
      >
        Aurora Veil
      </button>
      
      <button 
        className={`px-2 py-1 text-xs rounded w-full mb-1 transition-colors ${
          side.isBattery 
            ? 'bg-primary-500 text-white shadow-md' 
            : 'bg-surface-700 hover:bg-surface-600 active:bg-primary-800/50'
        }`}
        onClick={() => onSideChange('isBattery', !side.isBattery)}
      >
        Battery
      </button>
      
      <button 
        className={`px-2 py-1 text-xs rounded w-full mb-1 transition-colors ${
          side.isPowerSpot 
            ? 'bg-primary-500 text-white shadow-md' 
            : 'bg-surface-700 hover:bg-surface-600 active:bg-primary-800/50'
        }`}
        onClick={() => onSideChange('isPowerSpot', !side.isPowerSpot)}
      >
        Power Spot
      </button>

      {/* Switching */}
      <select
        className="w-full bg-surface-700 border border-surface-600 rounded px-2 py-1 text-xs mb-2 hover:border-primary-500/70 focus:border-primary-500 focus:ring-1 focus:ring-primary-500/50 focus:outline-none"
        value={side.isSwitching || ''}
        onChange={(e) => onSideChange('isSwitching', e.target.value || undefined)}
      >
        <option value="">Not Switching</option>
        <option value="out">Switching Out</option>
        <option value="in">Switching In</option>
      </select>
      
      {/* Export */}
      <button className="bg-surface-700 hover:bg-surface-600 active:bg-primary-800/50 transition-colors text-xs px-4 py-1 rounded text-surface-300">
        Export
      </button>
    </div>
  );
}