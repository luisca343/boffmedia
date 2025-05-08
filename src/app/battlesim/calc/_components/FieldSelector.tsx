'use client';

import React from 'react';
import { useCalcContext } from '../_context/CalcContext';
import { Field, Side } from '@smogon/calc';
import { Terrain, Weather } from '@smogon/calc/dist/data/interface';

interface TerrainOption {
  value: Terrain | undefined;
  label: string;
}

interface WeatherOption {
  value: Weather | undefined;
  label: string;
}

export default React.memo(function FieldSelector() {
  const { fieldState, updateFieldState } = useCalcContext();
  
  // Handle changes for main field settings
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

  // Handle changes for attacker side
  const handleAttackerSideChange = (field: keyof Side, value: any) => {
    updateFieldState({
      attackerSide: new Side({
        ...fieldState.attackerSide,
        [field]: value
      })
    });
  };

  // Handle changes for defender side
  const handleDefenderSideChange = (field: keyof Side, value: any) => {
    updateFieldState({
      defenderSide: new Side({
        ...fieldState.defenderSide,
        [field]: value
      })
    });
  };
  
  // Weather options
  const weatherOptions: WeatherOption[] = [
    { value: undefined, label: 'None' },
    { value: 'Sun', label: 'Sun' },
    { value: 'Rain', label: 'Rain' },
    { value: 'Sand', label: 'Sand' },
    { value: 'Snow', label: 'Snow' },
    { value: 'Harsh Sunshine', label: 'Harsh Sunshine' },
    { value: 'Heavy Rain', label: 'Heavy Rain' },
    { value: 'Strong Winds', label: 'Strong Winds' }
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
      
      {/* Main field settings */}
      <div className="mb-4">
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

          {/* Level presets - for future enhancement */}
          <div>
            <label className="block text-xs font-medium mb-1 text-surface-200">Common Levels</label>
            <div className="flex gap-1">
              <button className="bg-surface-700 hover:bg-surface-600 text-xs px-2 py-1 rounded flex-1">Level 100</button>
              <button className="bg-surface-700 hover:bg-surface-600 text-xs px-2 py-1 rounded flex-1">Level 50</button>
              <button className="bg-surface-700 hover:bg-surface-600 text-xs px-2 py-1 rounded flex-1">Level 5</button>
            </div>
          </div>
        </div>

        {/* Terrain buttons */}
        <div className="mb-2">
          <label className="block text-xs font-medium mb-1 text-surface-200">Terrain</label>
          <div className="flex flex-wrap gap-1">
            <button 
              className={`px-2 py-1 text-xs rounded ${fieldState.terrain === undefined ? 'bg-surface-600' : 'bg-surface-700 hover:bg-surface-600'}`}
              onClick={() => handleTerrainChange(undefined)}
            >
              None
            </button>
            <button 
              className={`px-2 py-1 text-xs rounded ${fieldState.terrain === 'Electric' ? 'bg-surface-600' : 'bg-surface-700 hover:bg-surface-600'}`}
              onClick={() => handleTerrainChange('Electric')}
            >
              Electric
            </button>
            <button 
              className={`px-2 py-1 text-xs rounded ${fieldState.terrain === 'Grassy' ? 'bg-surface-600' : 'bg-surface-700 hover:bg-surface-600'}`}
              onClick={() => handleTerrainChange('Grassy')}
            >
              Grassy
            </button>
            <button 
              className={`px-2 py-1 text-xs rounded ${fieldState.terrain === 'Misty' ? 'bg-surface-600' : 'bg-surface-700 hover:bg-surface-600'}`}
              onClick={() => handleTerrainChange('Misty')}
            >
              Misty
            </button>
            <button 
              className={`px-2 py-1 text-xs rounded ${fieldState.terrain === 'Psychic' ? 'bg-surface-600' : 'bg-surface-700 hover:bg-surface-600'}`}
              onClick={() => handleTerrainChange('Psychic')}
            >
              Psychic
            </button>
          </div>
        </div>

        {/* Weather buttons - first row */}
        <div className="mb-1">
          <label className="block text-xs font-medium mb-1 text-surface-200">Weather</label>
          <div className="flex flex-wrap gap-1 mb-1">
            <button 
              className={`px-2 py-1 text-xs rounded ${fieldState.weather === undefined ? 'bg-surface-600' : 'bg-surface-700 hover:bg-surface-600'}`}
              onClick={() => handleWeatherChange(undefined)}
            >
              None
            </button>
            <button 
              className={`px-2 py-1 text-xs rounded ${fieldState.weather === 'Sun' ? 'bg-surface-600' : 'bg-surface-700 hover:bg-surface-600'}`}
              onClick={() => handleWeatherChange('Sun')}
            >
              Sun
            </button>
            <button 
              className={`px-2 py-1 text-xs rounded ${fieldState.weather === 'Rain' ? 'bg-surface-600' : 'bg-surface-700 hover:bg-surface-600'}`}
              onClick={() => handleWeatherChange('Rain')}
            >
              Rain
            </button>
            <button 
              className={`px-2 py-1 text-xs rounded ${fieldState.weather === 'Sand' ? 'bg-surface-600' : 'bg-surface-700 hover:bg-surface-600'}`}
              onClick={() => handleWeatherChange('Sand')}
            >
              Sand
            </button>
            <button 
              className={`px-2 py-1 text-xs rounded ${fieldState.weather === 'Snow' ? 'bg-surface-600' : 'bg-surface-700 hover:bg-surface-600'}`}
              onClick={() => handleWeatherChange('Snow')}
            >
              Snow
            </button>
          </div>
          
          {/* Weather buttons - second row */}
          <div className="flex flex-wrap gap-1">
            <button 
              className={`px-2 py-1 text-xs rounded ${fieldState.weather === 'Harsh Sunshine' ? 'bg-surface-600' : 'bg-surface-700 hover:bg-surface-600'}`}
              onClick={() => handleWeatherChange('Harsh Sunshine')}
            >
              Harsh Sunshine
            </button>
            <button 
              className={`px-2 py-1 text-xs rounded ${fieldState.weather === 'Heavy Rain' ? 'bg-surface-600' : 'bg-surface-700 hover:bg-surface-600'}`}
              onClick={() => handleWeatherChange('Heavy Rain')}
            >
              Heavy Rain
            </button>
            <button 
              className={`px-2 py-1 text-xs rounded ${fieldState.weather === 'Strong Winds' ? 'bg-surface-600' : 'bg-surface-700 hover:bg-surface-600'}`}
              onClick={() => handleWeatherChange('Strong Winds')}
            >
              Strong Winds
            </button>
          </div>
        </div>

        {/* Room buttons */}
        <div className="flex flex-wrap gap-1">
          <button 
            className={`px-2 py-1 text-xs rounded ${fieldState.isMagicRoom ? 'bg-surface-600' : 'bg-surface-700 hover:bg-surface-600'}`}
            onClick={() => handleRoomChange('magicRoom', !fieldState.isMagicRoom)}
          >
            Magic Room
          </button>
          <button 
            className={`px-2 py-1 text-xs rounded ${fieldState.isWonderRoom ? 'bg-surface-600' : 'bg-surface-700 hover:bg-surface-600'}`}
            onClick={() => handleRoomChange('wonderRoom', !fieldState.isWonderRoom)}
          >
            Wonder Room
          </button>
          <button 
            className={`px-2 py-1 text-xs rounded ${fieldState.isGravity ? 'bg-surface-600' : 'bg-surface-700 hover:bg-surface-600'}`}
            onClick={() => handleRoomChange('gravity', !fieldState.isGravity)}
          >
            Gravity
          </button>
        </div>
      </div>
      
      {/* Side conditions - two columns layout */}
      <div className="grid grid-cols-2 gap-4">
        {/* Attacker side conditions */}
        <div>
          {/* Hazards */}
          <div className="mb-2">
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-medium text-surface-200">Stealth Rock</label>
              <button 
                className={`px-2 py-0.5 text-xs rounded ${fieldState.attackerSide.isSR ? 'bg-surface-600' : 'bg-surface-700 hover:bg-surface-600'}`}
                onClick={() => handleAttackerSideChange('isSR', !fieldState.attackerSide.isSR)}
              >
                {fieldState.attackerSide.isSR ? 'On' : 'Off'}
              </button>
            </div>

            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-medium text-surface-200">Spikes</label>
              <div className="flex gap-1">
                {[0, 1, 2, 3].map(level => (
                  <button
                    key={`attacker-spikes-${level}`}
                    className={`w-6 text-center py-0.5 text-xs rounded ${fieldState.attackerSide.spikes === level ? 'bg-surface-600' : 'bg-surface-700 hover:bg-surface-600'}`}
                    onClick={() => handleAttackerSideChange('spikes', level)}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Screens */}
          <div className="mb-2 flex flex-wrap gap-1">
            <button 
              className={`px-2 py-1 text-xs rounded ${fieldState.attackerSide.isReflect ? 'bg-surface-600' : 'bg-surface-700 hover:bg-surface-600'}`}
              onClick={() => handleAttackerSideChange('isReflect', !fieldState.attackerSide.isReflect)}
            >
              Reflect
            </button>
            <button 
              className={`px-2 py-1 text-xs rounded ${fieldState.attackerSide.isLightScreen ? 'bg-surface-600' : 'bg-surface-700 hover:bg-surface-600'}`}
              onClick={() => handleAttackerSideChange('isLightScreen', !fieldState.attackerSide.isLightScreen)}
            >
              Light Screen
            </button>
            <button 
              className={`px-2 py-1 text-xs rounded ${fieldState.attackerSide.isAuroraVeil ? 'bg-surface-600' : 'bg-surface-700 hover:bg-surface-600'}`}
              onClick={() => handleAttackerSideChange('isAuroraVeil', !fieldState.attackerSide.isAuroraVeil)}
            >
              Aurora Veil
            </button>
          </div>

          {/* Other conditions */}
          <div className="flex flex-wrap gap-1">
            <button 
              className={`px-2 py-1 text-xs rounded ${fieldState.attackerSide.isProtected ? 'bg-surface-600' : 'bg-surface-700 hover:bg-surface-600'}`}
              onClick={() => handleAttackerSideChange('isProtected', !fieldState.attackerSide.isProtected)}
            >
              Protect
            </button>
            <button 
              className={`px-2 py-1 text-xs rounded ${fieldState.attackerSide.isSeeded ? 'bg-surface-600' : 'bg-surface-700 hover:bg-surface-600'}`}
              onClick={() => handleAttackerSideChange('isSeeded', !fieldState.attackerSide.isSeeded)}
            >
              Leech Seed
            </button>
            <button 
              className={`px-2 py-1 text-xs rounded ${fieldState.attackerSide.isForesight ? 'bg-surface-600' : 'bg-surface-700 hover:bg-surface-600'}`}
              onClick={() => handleAttackerSideChange('isForesight', !fieldState.attackerSide.isForesight)}
            >
              Foresight
            </button>
            <button 
              className={`px-2 py-1 text-xs rounded ${fieldState.attackerSide.isTailwind ? 'bg-surface-600' : 'bg-surface-700 hover:bg-surface-600'}`}
              onClick={() => handleAttackerSideChange('isTailwind', !fieldState.attackerSide.isTailwind)}
            >
              Tailwind
            </button>
            <button 
              className={`px-2 py-1 text-xs rounded ${fieldState.attackerSide.isHelpingHand ? 'bg-surface-600' : 'bg-surface-700 hover:bg-surface-600'}`}
              onClick={() => handleAttackerSideChange('isHelpingHand', !fieldState.attackerSide.isHelpingHand)}
            >
              Helping Hand
            </button>
            <button 
              className={`px-2 py-1 text-xs rounded ${fieldState.attackerSide.isFlowerGift ? 'bg-surface-600' : 'bg-surface-700 hover:bg-surface-600'}`}
              onClick={() => handleAttackerSideChange('isFlowerGift', !fieldState.attackerSide.isFlowerGift)}
            >
              Flower Gift
            </button>
            <button 
              className={`px-2 py-1 text-xs rounded ${fieldState.attackerSide.isFriendGuard ? 'bg-surface-600' : 'bg-surface-700 hover:bg-surface-600'}`}
              onClick={() => handleAttackerSideChange('isFriendGuard', !fieldState.attackerSide.isFriendGuard)}
            >
              Friend Guard
            </button>
            <button 
              className={`px-2 py-1 text-xs rounded ${fieldState.attackerSide.isBattery ? 'bg-surface-600' : 'bg-surface-700 hover:bg-surface-600'}`}
              onClick={() => handleAttackerSideChange('isBattery', !fieldState.attackerSide.isBattery)}
            >
              Battery
            </button>
            <button 
              className={`px-2 py-1 text-xs rounded ${fieldState.attackerSide.isPowerSpot ? 'bg-surface-600' : 'bg-surface-700 hover:bg-surface-600'}`}
              onClick={() => handleAttackerSideChange('isPowerSpot', !fieldState.attackerSide.isPowerSpot)}
            >
              Power Spot
            </button>
            <div className="w-full">
              <select
                className="w-full bg-surface-700 border border-surface-600 rounded px-2 py-1 text-xs"
                value={fieldState.attackerSide.isSwitching || ''}
                onChange={(e) => handleAttackerSideChange('isSwitching', e.target.value || undefined)}
              >
                <option value="">Not Switching</option>
                <option value="out">Switching Out</option>
                <option value="in">Switching In</option>
              </select>
            </div>
          </div>
        </div>

        {/* Defender side conditions */}
        <div>
          {/* Hazards */}
          <div className="mb-2">
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-medium text-surface-200">Stealth Rock</label>
              <button 
                className={`px-2 py-0.5 text-xs rounded ${fieldState.defenderSide.isSR ? 'bg-surface-600' : 'bg-surface-700 hover:bg-surface-600'}`}
                onClick={() => handleDefenderSideChange('isSR', !fieldState.defenderSide.isSR)}
              >
                {fieldState.defenderSide.isSR ? 'On' : 'Off'}
              </button>
            </div>

            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-medium text-surface-200">Spikes</label>
              <div className="flex gap-1">
                {[0, 1, 2, 3].map(level => (
                  <button
                    key={`defender-spikes-${level}`}
                    className={`w-6 text-center py-0.5 text-xs rounded ${fieldState.defenderSide.spikes === level ? 'bg-surface-600' : 'bg-surface-700 hover:bg-surface-600'}`}
                    onClick={() => handleDefenderSideChange('spikes', level)}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Screens */}
          <div className="mb-2 flex flex-wrap gap-1">
            <button 
              className={`px-2 py-1 text-xs rounded ${fieldState.defenderSide.isReflect ? 'bg-surface-600' : 'bg-surface-700 hover:bg-surface-600'}`}
              onClick={() => handleDefenderSideChange('isReflect', !fieldState.defenderSide.isReflect)}
            >
              Reflect
            </button>
            <button 
              className={`px-2 py-1 text-xs rounded ${fieldState.defenderSide.isLightScreen ? 'bg-surface-600' : 'bg-surface-700 hover:bg-surface-600'}`}
              onClick={() => handleDefenderSideChange('isLightScreen', !fieldState.defenderSide.isLightScreen)}
            >
              Light Screen
            </button>
            <button 
              className={`px-2 py-1 text-xs rounded ${fieldState.defenderSide.isAuroraVeil ? 'bg-surface-600' : 'bg-surface-700 hover:bg-surface-600'}`}
              onClick={() => handleDefenderSideChange('isAuroraVeil', !fieldState.defenderSide.isAuroraVeil)}
            >
              Aurora Veil
            </button>
          </div>

          {/* Other conditions */}
          <div className="flex flex-wrap gap-1">
            <button 
              className={`px-2 py-1 text-xs rounded ${fieldState.defenderSide.isProtected ? 'bg-surface-600' : 'bg-surface-700 hover:bg-surface-600'}`}
              onClick={() => handleDefenderSideChange('isProtected', !fieldState.defenderSide.isProtected)}
            >
              Protect
            </button>
            <button 
              className={`px-2 py-1 text-xs rounded ${fieldState.defenderSide.isSeeded ? 'bg-surface-600' : 'bg-surface-700 hover:bg-surface-600'}`}
              onClick={() => handleDefenderSideChange('isSeeded', !fieldState.defenderSide.isSeeded)}
            >
              Leech Seed
            </button>
            <button 
              className={`px-2 py-1 text-xs rounded ${fieldState.defenderSide.isForesight ? 'bg-surface-600' : 'bg-surface-700 hover:bg-surface-600'}`}
              onClick={() => handleDefenderSideChange('isForesight', !fieldState.defenderSide.isForesight)}
            >
              Foresight
            </button>
            <button 
              className={`px-2 py-1 text-xs rounded ${fieldState.defenderSide.isTailwind ? 'bg-surface-600' : 'bg-surface-700 hover:bg-surface-600'}`}
              onClick={() => handleDefenderSideChange('isTailwind', !fieldState.defenderSide.isTailwind)}
            >
              Tailwind
            </button>
            <button 
              className={`px-2 py-1 text-xs rounded ${fieldState.defenderSide.isHelpingHand ? 'bg-surface-600' : 'bg-surface-700 hover:bg-surface-600'}`}
              onClick={() => handleDefenderSideChange('isHelpingHand', !fieldState.defenderSide.isHelpingHand)}
            >
              Helping Hand
            </button>
            <button 
              className={`px-2 py-1 text-xs rounded ${fieldState.defenderSide.isFlowerGift ? 'bg-surface-600' : 'bg-surface-700 hover:bg-surface-600'}`}
              onClick={() => handleDefenderSideChange('isFlowerGift', !fieldState.defenderSide.isFlowerGift)}
            >
              Flower Gift
            </button>
            <button 
              className={`px-2 py-1 text-xs rounded ${fieldState.defenderSide.isFriendGuard ? 'bg-surface-600' : 'bg-surface-700 hover:bg-surface-600'}`}
              onClick={() => handleDefenderSideChange('isFriendGuard', !fieldState.defenderSide.isFriendGuard)}
            >
              Friend Guard
            </button>
            <button 
              className={`px-2 py-1 text-xs rounded ${fieldState.defenderSide.isBattery ? 'bg-surface-600' : 'bg-surface-700 hover:bg-surface-600'}`}
              onClick={() => handleDefenderSideChange('isBattery', !fieldState.defenderSide.isBattery)}
            >
              Battery
            </button>
            <button 
              className={`px-2 py-1 text-xs rounded ${fieldState.defenderSide.isPowerSpot ? 'bg-surface-600' : 'bg-surface-700 hover:bg-surface-600'}`}
              onClick={() => handleDefenderSideChange('isPowerSpot', !fieldState.defenderSide.isPowerSpot)}
            >
              Power Spot
            </button>
            <div className="w-full">
              <select
                className="w-full bg-surface-700 border border-surface-600 rounded px-2 py-1 text-xs"
                value={fieldState.defenderSide.isSwitching || ''}
                onChange={(e) => handleDefenderSideChange('isSwitching', e.target.value || undefined)}
              >
                <option value="">Not Switching</option>
                <option value="out">Switching Out</option>
                <option value="in">Switching In</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});