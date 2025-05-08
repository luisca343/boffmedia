'use client';

import { useState, useEffect } from 'react';
import { useCalcContext } from '../_context/CalcContext';
import { Field } from '@smogon/calc';
import { Terrain, Weather } from '@smogon/calc/dist/data/interface';

interface TerrainOption {
  value: Terrain | undefined;
  label: string;
}

interface WeatherOption {
  value: Weather | undefined;
  label: string;
}

export default function FieldSelector() {
  const { fieldState, updateFieldState } = useCalcContext();
  
  // Instead of local state, use the fieldState from context
  // This prevents the component from maintaining its own state that conflicts with context
  
  // Handle changes directly without setting local state first
  const handleGameTypeChange = (gameType: 'Singles' | 'Doubles') => {
    updateFieldState({ gameType });
  };
  
  const handleWeatherChange = (weather?: Weather) => {
    updateFieldState({ weather });
  };
  
  const handleTerrainChange = (terrain?: Terrain) => {
    updateFieldState({ terrain });
  };
  
  const handleRoomChange = (room: string, value: boolean) => {
    if (room === 'magicRoom') {
      updateFieldState({ isMagicRoom: value });
    } else if (room === 'wonderRoom') {
      updateFieldState({ isWonderRoom: value });
    } else if (room === 'gravity') {
      updateFieldState({ isGravity: value });
    }
  };

  // Weather options
  const weatherOptions: WeatherOption[] = [
    { value: undefined, label: 'None' },
    { value: 'Sun', label: 'Sun' },
    { value: 'Rain', label: 'Rain' },
    { value: 'Sand', label: 'Sand' },
    { value: 'Snow', label: 'Snow' },
  ];
  
  // Terrain options
  const terrainOptions: TerrainOption[] = [
    { value: undefined, label: 'None' },
    { value: 'Electric', label: 'Electric' },
    { value: 'Grassy', label: 'Grassy' },
    { value: 'Misty', label: 'Misty' },
    { value: 'Psychic', label: 'Psychic' },
  ];
  
  return (
    <div className="border border-surface-700 rounded-lg p-3 bg-surface-800 shadow-lg">
      <h2 className="text-sm font-bold mb-2 text-center text-primary-400">Field</h2>
      
      <div className="grid grid-cols-2 gap-2 mb-2">
        {/* Game Type */}
        <div>
          <label className="block text-xs font-medium mb-1 text-surface-200">Game Type</label>
          <select
            className="w-full bg-surface-700 border border-surface-600 rounded px-2 py-1 text-xs"
            value={fieldState.gameType}
            onChange={(e) => handleGameTypeChange(e.target.value as 'Singles' | 'Doubles')}
          >
            <option value="Singles">Singles</option>
            <option value="Doubles">Doubles</option>
          </select>
        </div>
        
        {/* Weather */}
        <div>
          <label className="block text-xs font-medium mb-1 text-surface-200">Weather</label>
          <select
            className="w-full bg-surface-700 border border-surface-600 rounded px-2 py-1 text-xs"
            value={fieldState.weather || ''}
            onChange={(e) => handleWeatherChange(e.target.value as Weather || undefined)}
          >
            {weatherOptions.map(option => (
              <option key={option.label} value={option.value || ''}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        
        {/* Terrain */}
        <div>
          <label className="block text-xs font-medium mb-1 text-surface-200">Terrain</label>
          <select
            className="w-full bg-surface-700 border border-surface-600 rounded px-2 py-1 text-xs"
            value={fieldState.terrain || ''}
            onChange={(e) => handleTerrainChange(e.target.value as Terrain || undefined)}
          >
            {terrainOptions.map(option => (
              <option key={option.label} value={option.value || ''}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        
        {/* Rooms */}
        <div>
          <label className="block text-xs font-medium mb-1 text-surface-200">Rooms</label>
          <div className="flex flex-col gap-1">
            <label className="flex items-center gap-1">
              <input 
                type="checkbox" 
                checked={fieldState.isMagicRoom}
                onChange={(e) => handleRoomChange('magicRoom', e.target.checked)} 
              />
              <span className="text-xs">Magic Room</span>
            </label>
            
            <label className="flex items-center gap-1">
              <input 
                type="checkbox" 
                checked={fieldState.isWonderRoom}
                onChange={(e) => handleRoomChange('wonderRoom', e.target.checked)} 
              />
              <span className="text-xs">Wonder Room</span>
            </label>
            
            <label className="flex items-center gap-1">
              <input 
                type="checkbox" 
                checked={fieldState.isGravity}
                onChange={(e) => handleRoomChange('gravity', e.target.checked)} 
              />
              <span className="text-xs">Gravity</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}