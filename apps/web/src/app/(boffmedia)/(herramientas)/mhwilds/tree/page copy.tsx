"use client"

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWeaponTreeData } from './_hooks/useWeaponTreeData';
import { Button } from '@/components/ui/primitives/button';

export function WeaponElement({ weapon }: { weapon: any }) {
    return (
      <div className="bg-white shadow-md rounded-lg p-4 cursor-pointer w-32 h-32 overflow-hidden flex flex-col">
        <h2 className="text-xs font-bold ">{weapon.name}</h2>
        {/*
        <p className="text-xs line-clamp-2">{weapon.description}</p>
        <div className="mt-auto">
          <p className="text-xs text-surface-500">Type: {weapon.type}</p>
          <p className="text-xs text-surface-500">Attack: {weapon.attack}</p>
          <p className="text-xs text-surface-500">Element: {weapon.element}</p>
          <p className="text-xs text-surface-500">Rarity: {weapon.rarity}</p>
        </div> */}
      </div>
    );
  }
export default function WeaponTree() {
  const {
    weaponTypes,
    filteredTree,
    activeWeaponType,
    setActiveWeaponType,
    loading,
    error,
    refreshData
  } = useWeaponTreeData();
  
  const [selectedWeapon, setSelectedWeapon] = useState<any>(null);
  const router = useRouter();
  
  const handleWeaponClick = (weapon: any) => {
    setSelectedWeapon(weapon);
  };
  
  const closeWeaponDetails = () => {
    setSelectedWeapon(null);
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-amber-500"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded my-4">
        <p>{error}</p>
        <Button
          variant="error"
          onClick={() => refreshData()}
          
        >
          Try Again
        </Button>
      </div>
    );
  }

  function getTotalBranches(weapon: any): number {
    if (!weapon.children || weapon.children.length <= 1) {
      return 0;
    }
    
    // Number of branches at this level is children - 1
    const branchesAtThisLevel = Math.max(0, weapon.children.length - 1);

    console.log("----------------------");
    console.log("Weapon:", weapon.name);
    console.log("Branches at this level:", branchesAtThisLevel);
    
    
    // Add branches from the first child's entire subtree
    const firstChildBranches = getTotalBranches(weapon.children[0]);
    
    return branchesAtThisLevel + firstChildBranches;
  }

  function renderTree(weapon: any) {
    return (
      <div className='flex flex-row gap-4 relative' key={weapon.id}>
        <div className="flex-shrink-0 z-10">
          <div 
            className={`absolute left-16 top-32 w-0.5 bg-red-500`} 
            style={{ height: (64 * getTotalBranches(weapon)) + "px" }}
          ></div>
          <WeaponElement weapon={weapon} />
        </div>
        {weapon.children && weapon.children.length > 0 && (
          <div className="flex flex-col gap-2 relative">
            {/* Horizontal line from parent to branch point - now red */}
            <div className="absolute top-16 left-[-16px] w-16 h-0.5 bg-red-500"></div>
            
            {weapon.children.map((child: any, index: number) => (
              <div key={child.id} className="relative">
                {/* Vertical line connecting siblings - now red */}
                {index > 0 && weapon.children.length > 1 && (
                  <div className="absolute -left-20 top-0 w-0.5 h-16 bg-red-500"></div>
                )}
                {/* Branch point for multiple children - now red */}
                {weapon.children.length > 1 && index > 0 && (
                  <div className="absolute -left-20 top-16 w-16 h-0.5 bg-red-500"></div>
                )}
                {renderTree(child)}
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4">
        {filteredTree.length > 0 ? (
            <div className="flex flex-col gap-4">
                {filteredTree.map((weapon: any) => renderTree(weapon))}
            </div>
        ) : (
            <div className="bg-surface-100 border border-surface-300 text-surface-700 px-4 py-3 rounded my-4">
                <p>No weapons found for the selected type.</p>
            </div>
        )}
    </div>
  );
}