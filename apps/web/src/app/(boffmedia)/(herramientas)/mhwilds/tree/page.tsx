"use client"

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWeaponTreeData } from './_hooks/useWeaponTreeData';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/primitives/button';

export function WeaponElement({ weapon }: { weapon: any }) {
  // Extract element information
  const elementInfo = weapon.specials?.find((special: any) => special.kind === "element");
  const elementType = elementInfo?.element || "none";

  return (
    <div className="rounded-lg p-2.5 cursor-pointer min-w-32 overflow-hidden flex flex-col relative transition-all duration-200 bg-surface-900/80 border border-surface-700/40 hover:bg-surface-800/90 hover:border-primary-500/30">
      {/* Rarity badge */}
      <span
        className="absolute top-0 right-0 text-[10px] px-1.5 rounded-bl font-mono"
        style={{ background: "rgba(15,23,42,0.8)", color: "rgba(251,146,60,0.8)", borderLeft: "1px solid rgba(71,85,105,0.3)", borderBottom: "1px solid rgba(71,85,105,0.3)" }}
      >
        R{weapon.rarity}
      </span>
      
      {/* Weapon name */}
      <h2 className="text-xs font-bold text-surface-100 mb-1" title={weapon.name}>
        {weapon.name}
      </h2>
      
      {/* Damage display with icon */}
      <div className="flex items-center gap-1.5 text-xs text-surface-200 mt-0.5">
        <div className="w-3.5 h-3.5 relative flex-shrink-0">
          <img 
            src="/img/games/mhwilds/attack.webp" 
            alt="Attack" 
            className="w-full h-full object-contain"
          />
        </div>
        <span>{weapon.damage?.display || 0}</span>
      </div>
      
      {/* Element display with icon */}
      {elementInfo && elementType !== "none" && (
        <div className="flex items-center gap-1.5 text-xs text-surface-300 mt-1">
          <div className="w-3.5 h-3.5 relative flex-shrink-0">
            <img 
              src={`/img/games/mhwilds/${elementType}.webp`} 
              alt={elementType} 
              className="w-full h-full object-contain"
            />
          </div>
          <span>{elementInfo.damage.display}</span>
          {elementInfo.hidden && (
            <span className="text-[8px] text-surface-400">(hidden)</span>
          )}
        </div>
      )}
    </div>
  );
}

export default function WeaponTree() {
  const t = useTranslations('mhwilds');
  
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
      <div className="flex items-center justify-center min-h-[400px] gap-3">
        <div className="relative w-10 h-10">
          <div
            className="absolute inset-0 rounded-full animate-spin"
            style={{ border: "2px solid transparent", borderTopColor: "rgba(249,115,22,0.8)", borderRightColor: "rgba(249,115,22,0.3)" }}
          />
          <div
            className="absolute inset-[3px] rounded-full animate-spin"
            style={{ border: "2px solid transparent", borderTopColor: "rgba(34,211,238,0.6)", borderRightColor: "rgba(34,211,238,0.2)", animationDirection: "reverse" }}
          />
        </div>
        <span
          className="text-sm font-black uppercase tracking-widest"
          style={{ fontFamily: "Orbitron, sans-serif", color: "rgba(251,146,60,0.9)" }}
        >
          {t('loading')}...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="flex flex-col items-center gap-3 px-4 py-6 rounded-xl my-4"
        style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.25)" }}
      >
        <p className="text-sm" style={{ color: "rgba(252,165,165,0.9)" }}>{error}</p>
        <Button
          variant="ghost"
          size="sm"
          className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
          onClick={() => refreshData()}
        >
          {t('build_planner.retry')}
        </Button>
      </div>
    );
  }

  // Helper function to extract element from a weapon
  function getWeaponElement(weapon: any): string {
    const elementSpecial = weapon.specials?.find((special: any) => special.kind === "element");
    return elementSpecial?.element || "none";
  }
  
  // Helper function to extract Roman numeral from weapon name
  function getRomanNumeral(weapon: any): number {
    const name = weapon.name || '';
    if (name.includes(" V")) return 5;
    if (name.includes(" IV")) return 4;
    if (name.includes(" III")) return 3;
    if (name.includes(" II")) return 2;
    if (name.includes(" I")) return 1;
    return 0;
  }

  // Helper function to find the next Roman numeral in sequence
  function getNextRomanNumeral(parentWeapon: any): number {
    const parentNumeral = getRomanNumeral(parentWeapon);
    return parentNumeral + 1;
  }

  // Custom sort function for weapons by element and Roman numerals
  function sortWeaponsByElementAndSequence(weapons: any[], parentWeapon: any = null): any[] {
    // Group weapons by element
    const weaponsByElement: {[key: string]: any[]} = {};
    const parentElement = parentWeapon ? getWeaponElement(parentWeapon) : "none";
    const nextNumeral = parentWeapon ? getNextRomanNumeral(parentWeapon) : 0;
    
    weapons.forEach(weapon => {
      const element = getWeaponElement(weapon);
      if (!weaponsByElement[element]) {
        weaponsByElement[element] = [];
      }
      weaponsByElement[element].push(weapon);
    });
    
    // First, check if we need to prioritize weapons with next numeral in sequence
    if (nextNumeral > 0 && nextNumeral <= 5) {
      const weaponsWithNextNumeral = weapons.filter(w => getRomanNumeral(w) === nextNumeral);
      if (weaponsWithNextNumeral.length > 0) {
        // Further sort these by element if needed
        const remainingWeapons = weapons.filter(w => getRomanNumeral(w) !== nextNumeral);
        return [...weaponsWithNextNumeral, ...sortWeaponsByElement(remainingWeapons, parentElement)];
      }
    }
    
    // If no next numeral is found, fall back to element-based sorting
    return sortWeaponsByElement(weapons, parentElement);
  }
  
  // Element-based sorting (kept as a separate function)
  function sortWeaponsByElement(weapons: any[], parentElement: string = "none"): any[] {
    // Group weapons by element
    const weaponsByElement: {[key: string]: any[]} = {};
    
    weapons.forEach(weapon => {
      const element = getWeaponElement(weapon);
      if (!weaponsByElement[element]) {
        weaponsByElement[element] = [];
      }
      weaponsByElement[element].push(weapon);
    });
    
    // If parent has no element, prioritize children with no element
    if (parentElement === "none" && weaponsByElement["none"]) {
      // Put "none" element weapons first
      const noneElementWeapons = weaponsByElement["none"];
      delete weaponsByElement["none"];
      
      // Combine the arrays with none element first
      return [...noneElementWeapons, ...Object.values(weaponsByElement).flat()];
    }
    
    // Otherwise, try to match parent's element if possible
    if (weaponsByElement[parentElement]) {
      const matchingElementWeapons = weaponsByElement[parentElement];
      delete weaponsByElement[parentElement];
      
      // Combine with matching element first
      return [...matchingElementWeapons, ...Object.values(weaponsByElement).flat()];
    }
    
    // Default case, just flatten all
    return Object.values(weaponsByElement).flat();
  }

  // Function to convert the tree structure to a table format
  function buildWeaponTable(rootWeapons: any[]) {
    const rows: any[][] = [];
    // Sort root weapons by element
    const sortedRootWeapons = sortWeaponsByElement(rootWeapons);
    
    function processWeapon(weapon: any, rowIndex: number, hasParent: boolean = false) {
      // Ensure the row exists
      if (!rows[rowIndex]) {
        rows[rowIndex] = Array(9).fill(null); // Create 9 columns (0-8)
      }
      
      // Calculate column based on rarity
      const rarity = weapon.rarity || 1;
      const column = rarity === 1 
      ? (hasParent ? 1 : Math.min(1, rows[rowIndex].findIndex(cell => cell === null))) 
      : rarity;
      
      // Place the weapon in the appropriate column
      rows[rowIndex][column] = weapon;
      
      // Process children if they exist
      if (weapon.children && weapon.children.length > 0) {
        // Sort children by element with parent element context and Roman numeral sequence
        const sortedChildren = sortWeaponsByElementAndSequence(weapon.children, weapon);
        
        sortedChildren.forEach((child: any, index: number) => {
          // First child continues in the same row
          if (index === 0) {
            processWeapon(child, rowIndex, true); // Pass true to indicate it has a parent
          } else {
            // Other children start new rows
            processWeapon(child, rows.length, true); // Pass true to indicate it has a parent
          }
        });
      }
    }
    
    // Process each root weapon
    sortedRootWeapons.forEach((weapon, index) => {
      if (index === 0) {
        processWeapon(weapon, 0, false); // Root weapons don't have parents
      } else {
        processWeapon(weapon, rows.length, false); // Root weapons don't have parents
      }
    });
    
    return rows;
  }

  function renderWeaponTable() {
    const tableRows = buildWeaponTable(filteredTree);
    
    // Function to find a weapon's position in the table
    const findWeaponPosition = (weaponId: string) => {
      for (let rowIdx = 0; rowIdx < tableRows.length; rowIdx++) {
        const colIdx = tableRows[rowIdx].findIndex(w => w && w.id === weaponId);
        if (colIdx !== -1) {
          return { rowIdx, colIdx };
        }
      }
      return null;
    };
    
    return (
      <div className="overflow-x-auto rounded-xl p-4" style={{ background: "rgba(15,23,42,0.5)", border: "1px solid rgba(71,85,105,0.3)" }}>
        <table className="min-w-full border-collapse">
          <tbody>
            {tableRows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((weapon, colIndex) => (
                  <td key={colIndex} className="p-2 relative">
                    {weapon && (
                      <>
                        <div 
                          className="relative z-10"
                          onClick={() => handleWeaponClick(weapon)}
                        >
                          <WeaponElement weapon={weapon} />
                        </div>
                        
                        {/* Draw lines from this weapon to its direct children */}
                        {weapon.children && weapon.children.length > 0 && (
                          <>
                            {weapon.children.map((child: any) => {
                              // Find this child's position in the table
                              const childPosition = findWeaponPosition(child.id);
                              
                              if (!childPosition) return null;
                              
                              const { rowIdx: childRowIdx, colIdx: childColIdx } = childPosition;
                              
                              // Only proceed if we found the child
                              if (childRowIdx !== undefined && childColIdx !== undefined) {
                                // Same row connection (keep existing code)
                                if (childRowIdx === rowIndex && childColIdx > colIndex) {
                                  const distance = childColIdx - colIndex;
                                  
                                  return (
                                    <div key={`${child.id}-same-row`} className="absolute inset-0 pointer-events-none">
                                      {/* Horizontal dashed line from parent to child */}
                                      <div 
                                        className="absolute border-t-2 border-dashed border-primary-400"
                                        style={{
                                          height: '0',
                                          left: '50%',
                                          width: `${distance * 100}%`,
                                          top: '50%',
                                          zIndex: 1
                                        }}
                                      />
                                    </div>
                                  );
                                }
                                // Different row connection - update to dashed lines
                                else {
                                  // Calculate positions and dimensions for the connection
                                  const rowDifference = childRowIdx - rowIndex;
                                  const colDifference = childColIdx - colIndex;
                                  
                                  return (
                                    <div key={`${child.id}-diff-row`} className="absolute inset-0 pointer-events-none">
                                      {/* Vertical dashed line going down from parent */}
                                      <div 
                                        className="absolute border-l-2 border-dashed border-primary-400"
                                        style={{
                                          left: '50%',
                                          top: '50%',
                                          width: '0',
                                          height: `${rowDifference * 144}px`,
                                          transform: 'translateX(-50%)',
                                          zIndex: 2
                                        }}
                                      />
                                      
                                      {/* Horizontal dashed line connecting to child */}
                                      <div 
                                        className="absolute border-t-2 border-dashed border-primary-400"
                                        style={{
                                          left: colDifference > 0 ? '50%' : `calc(50% + ${colDifference * 144}px)`,
                                          top: `calc(50% + ${rowDifference * 144}px)`,
                                          width: `${Math.abs(colDifference) * 144}px`,
                                          height: '0',
                                          zIndex: 2
                                        }}
                                      />
                                    </div>
                                  );
                                }
                              }
                              return null;
                            })}
                          </>
                        )}
                      </>
                    )}
                    
                    {!weapon && <div className="w-32 h-32"></div>}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="mx-auto p-4">
      <h1
        className="font-black uppercase tracking-widest mb-6"
        style={{ fontFamily: "Orbitron, sans-serif", color: "rgb(226,232,240)", fontSize: "clamp(1.25rem, 3vw, 1.75rem)" }}
      >
        {t('weapon_type')} — {t(`weapons.${activeWeaponType.toLowerCase().replace(' ', '-')}`)}
      </h1>

      {/* Weapon Type Filter */}
      <div
        className="mb-6 rounded-xl p-4"
        style={{
          background: "linear-gradient(145deg, rgba(30,41,59,0.85), rgba(15,23,42,0.9))",
          border: "1px solid rgba(249,115,22,0.18)",
        }}
      >
        <h2 className="text-[10px] font-mono uppercase tracking-widest text-surface-500 mb-3">
          {t('weapon_type')}
        </h2>
        <div className="flex flex-wrap gap-2">
          {weaponTypes.map((type) => (
            <button
              key={type}
              type="button"
              className={`px-3 py-1.5 rounded-lg text-xs font-mono uppercase tracking-wider transition-all duration-200 ${
                activeWeaponType === type ? "text-primary-300" : "text-surface-400 hover:text-surface-200"
              }`}
              style={
                activeWeaponType === type
                  ? { background: "rgba(249,115,22,0.12)", border: "1px solid rgba(249,115,22,0.35)" }
                  : { background: "transparent", border: "1px solid rgba(71,85,105,0.25)" }
              }
              onClick={() => setActiveWeaponType(type)}
            >
              {t(`weapons.${type.toLowerCase().replace(' ', '-')}`)}
            </button>
          ))}
        </div>
      </div>

      {filteredTree.length > 0 ? (
        renderWeaponTable()
      ) : (
        <div
          className="text-surface-300 px-4 py-6 rounded-xl my-4 text-center"
          style={{ background: "rgba(15,23,42,0.5)", border: "1px solid rgba(71,85,105,0.3)" }}
        >
          <p>{t('build_planner.no_equipment_found')}</p>
        </div>
      )}
    </div>
  );
}