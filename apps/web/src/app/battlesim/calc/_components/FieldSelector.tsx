'use client';

import React from 'react';
import { useCalcContext } from '../_context/CalcContext';
import { Field, Side } from '@smogon/calc';
import { Terrain, Weather } from '@smogon/calc/dist/data/interface';
import SideConditions from './SideConditions';

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

  return (
    <div className="border border-edge rounded-lg p-4 bg-layer-2 shadow-lg">
      <h2 className="text-sm font-bold mb-3 text-center text-primary-hover">Field</h2>
      
      {/* Game Type Toggle */}
      <div className="flex justify-center gap-1 mb-2.5">
        <button
          className={`px-4 py-1 text-xs rounded-md transition-colors ${
            fieldState.gameType === 'Singles' 
              ? 'bg-primary text-white shadow-md' 
              : 'bg-layer-3 hover:bg-layer-3 active:bg-primary-soft/50'
          }`}
          onClick={() => handleGameTypeChange('Singles')}
        >
          Singles
        </button>
        <button
          className={`px-4 py-1 text-xs rounded-md transition-colors ${
            fieldState.gameType === 'Doubles' 
              ? 'bg-primary text-white shadow-md' 
              : 'bg-layer-3 hover:bg-layer-3 active:bg-primary-soft/50'
          }`}
          onClick={() => handleGameTypeChange('Doubles')}
        >
          Doubles
        </button>
      </div>
      
      {/* Level Buttons */}
      <div className="flex justify-center gap-1 mb-2.5">
        <button className="bg-layer-3 hover:bg-layer-3 active:bg-primary-soft/50 transition-colors text-xs px-4 py-1 rounded">
          Level 100
        </button>
        <button className="bg-layer-3 hover:bg-layer-3 active:bg-primary-soft/50 transition-colors text-xs px-4 py-1 rounded">
          Level 50
        </button>
        <button className="bg-layer-3 hover:bg-layer-3 active:bg-primary-soft/50 transition-colors text-xs px-4 py-1 rounded">
          Level 5
        </button>
      </div>
      
      {/* Terrain Buttons */}
      <div className="flex flex-wrap justify-center gap-1 mb-2.5">
        <button 
          className={`px-3 py-1 text-xs rounded transition-colors ${
            fieldState.terrain === 'Electric' 
              ? 'bg-primary text-white shadow-md' 
              : 'bg-layer-3 hover:bg-layer-3 active:bg-primary-soft/50'
          }`}
          onClick={() => handleTerrainChange('Electric')}
        >
          Electric
        </button>
        <button 
          className={`px-3 py-1 text-xs rounded transition-colors ${
            fieldState.terrain === 'Grassy' 
              ? 'bg-primary text-white shadow-md' 
              : 'bg-layer-3 hover:bg-layer-3 active:bg-primary-soft/50'
          }`}
          onClick={() => handleTerrainChange('Grassy')}
        >
          Grassy
        </button>
        <button 
          className={`px-3 py-1 text-xs rounded transition-colors ${
            fieldState.terrain === 'Misty' 
              ? 'bg-primary text-white shadow-md' 
              : 'bg-layer-3 hover:bg-layer-3 active:bg-primary-soft/50'
          }`}
          onClick={() => handleTerrainChange('Misty')}
        >
          Misty
        </button>
        <button 
          className={`px-3 py-1 text-xs rounded transition-colors ${
            fieldState.terrain === 'Psychic' 
              ? 'bg-primary text-white shadow-md' 
              : 'bg-layer-3 hover:bg-layer-3 active:bg-primary-soft/50'
          }`}
          onClick={() => handleTerrainChange('Psychic')}
        >
          Psychic Terrain
        </button>
      </div>
      
      {/* Weather Buttons - First Row */}
      <div className="flex justify-center gap-1 mb-1">
        <button 
          className={`px-3 py-1 text-xs rounded transition-colors ${
            fieldState.weather === undefined 
              ? 'bg-primary text-white shadow-md' 
              : 'bg-layer-3 hover:bg-layer-3 active:bg-primary-soft/50'
          }`}
          onClick={() => handleWeatherChange(undefined)}
        >
          None
        </button>
        <button 
          className={`px-3 py-1 text-xs rounded transition-colors ${
            fieldState.weather === 'Sun' 
              ? 'bg-primary text-white shadow-md' 
              : 'bg-layer-3 hover:bg-layer-3 active:bg-primary-soft/50'
          }`}
          onClick={() => handleWeatherChange('Sun')}
        >
          Sun
        </button>
        <button 
          className={`px-3 py-1 text-xs rounded transition-colors ${
            fieldState.weather === 'Rain' 
              ? 'bg-primary text-white shadow-md' 
              : 'bg-layer-3 hover:bg-layer-3 active:bg-primary-soft/50'
          }`}
          onClick={() => handleWeatherChange('Rain')}
        >
          Rain
        </button>
        <button 
          className={`px-3 py-1 text-xs rounded transition-colors ${
            fieldState.weather === 'Sand' 
              ? 'bg-primary text-white shadow-md' 
              : 'bg-layer-3 hover:bg-layer-3 active:bg-primary-soft/50'
          }`}
          onClick={() => handleWeatherChange('Sand')}
        >
          Sand
        </button>
        <button 
          className={`px-3 py-1 text-xs rounded transition-colors ${
            fieldState.weather === 'Snow' 
              ? 'bg-primary text-white shadow-md' 
              : 'bg-layer-3 hover:bg-layer-3 active:bg-primary-soft/50'
          }`}
          onClick={() => handleWeatherChange('Snow')}
        >
          Snow
        </button>
      </div>
      
      {/* Weather Buttons - Second Row */}
      <div className="flex justify-center gap-1 mb-2.5">
        <button 
          className={`px-3 py-1 text-xs rounded transition-colors ${
            fieldState.weather === 'Harsh Sunshine' 
              ? 'bg-primary text-white shadow-md' 
              : 'bg-layer-3 hover:bg-layer-3 active:bg-primary-soft/50'
          }`}
          onClick={() => handleWeatherChange('Harsh Sunshine')}
        >
          Harsh Sunshine
        </button>
        <button 
          className={`px-3 py-1 text-xs rounded transition-colors ${
            fieldState.weather === 'Heavy Rain' 
              ? 'bg-primary text-white shadow-md' 
              : 'bg-layer-3 hover:bg-layer-3 active:bg-primary-soft/50'
          }`}
          onClick={() => handleWeatherChange('Heavy Rain')}
        >
          Heavy Rain
        </button>
        <button 
          className={`px-3 py-1 text-xs rounded transition-colors ${
            fieldState.weather === 'Strong Winds' 
              ? 'bg-primary text-white shadow-md' 
              : 'bg-layer-3 hover:bg-layer-3 active:bg-primary-soft/50'
          }`}
          onClick={() => handleWeatherChange('Strong Winds')}
        >
          Strong Winds
        </button>
      </div>
      
      {/* Room Buttons */}
      <div className="flex justify-center gap-1 mb-3">
        <button 
          className={`px-3 py-1 text-xs rounded transition-colors ${
            fieldState.isMagicRoom 
              ? 'bg-primary text-white shadow-md' 
              : 'bg-layer-3 hover:bg-layer-3 active:bg-primary-soft/50'
          }`}
          onClick={() => handleRoomChange('magicRoom', !fieldState.isMagicRoom)}
        >
          Magic Room
        </button>
        <button 
          className={`px-3 py-1 text-xs rounded transition-colors ${
            fieldState.isWonderRoom 
              ? 'bg-primary text-white shadow-md' 
              : 'bg-layer-3 hover:bg-layer-3 active:bg-primary-soft/50'
          }`}
          onClick={() => handleRoomChange('wonderRoom', !fieldState.isWonderRoom)}
        >
          Wonder Room
        </button>
        <button 
          className={`px-3 py-1 text-xs rounded transition-colors ${
            fieldState.isGravity 
              ? 'bg-primary text-white shadow-md' 
              : 'bg-layer-3 hover:bg-layer-3 active:bg-primary-soft/50'
          }`}
          onClick={() => handleRoomChange('gravity', !fieldState.isGravity)}
        >
          Gravity
        </button>
      </div>
      
      {/* Horizontal divider */}
      <div className="border-t border-edge mb-3"></div>
      
      {/* Side conditions - two columns layout */}
      <div className="grid grid-cols-2 gap-4">
        {/* Attacker side */}
        <SideConditions 
          side={fieldState.attackerSide} 
          onSideChange={handleAttackerSideChange} 
        />
        
        {/* Defender side */}
        <SideConditions 
          side={fieldState.defenderSide} 
          onSideChange={handleDefenderSideChange} 
        />
      </div>
    </div>
  );
});