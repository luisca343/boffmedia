"use client"

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWeaponTreeData } from './_hooks/useWeaponTreeData';

export function WeaponElement({ weapon }: { weapon: any }) {
    // Extract element information
    const elementInfo = weapon.specials?.find((special: any) => special.kind === "element");
    const elementType = elementInfo?.element || "none";
    
    return (
      <div className="bg-white shadow-md rounded-lg p-4 cursor-pointer w-32 h-32 overflow-hidden flex flex-col">
        <h2 className="text-xs font-bold">{weapon.name}</h2>
        {elementInfo && (
          <span className="text-xs text-gray-500">{elementType}: {elementInfo.damage.display}</span>
        )}
        {/*
        <p className="text-xs line-clamp-2">{weapon.description}</p>
        <div className="mt-auto">
          <p className="text-xs text-gray-500">Type: {weapon.type}</p>
          <p className="text-xs text-gray-500">Attack: {weapon.attack}</p>
          <p className="text-xs text-gray-500">Element: {weapon.element}</p>
          <p className="text-xs text-gray-500">Rarity: {weapon.rarity}</p>
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
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary-400"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded my-4">
        <p>{error}</p>
        <button 
          onClick={() => refreshData()}
          className="mt-2 bg-red-500 hover:bg-red-600 text-white py-1 px-3 rounded"
        >
          Try Again
        </button>
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
      <div className="overflow-x-auto">
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
                          <span className="absolute top-0 right-0 bg-gray-200 text-xs px-1 rounded-bl">R{weapon.rarity}</span>
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
                                      {/* Horizontal line from parent to child */}
                                      <div 
                                        className="absolute bg-primary-400"
                                        style={{
                                          height: '2px',
                                          left: '50%',
                                          width: `${distance * 100}%`,
                                          top: '50%',
                                          zIndex: 1
                                        }}
                                      />
                                    </div>
                                  );
                                }
                                // Different row connection (new code)
                                else {
                                  // Calculate positions and dimensions for the connection
                                  const rowDifference = childRowIdx - rowIndex;
                                  const colDifference = childColIdx - colIndex;
                                  
                                  // We'll make a curved connection using multiple divs
                                  return (
                                    <div key={`${child.id}-diff-row`} className="absolute inset-0 pointer-events-none">
                                      {/* Vertical line going down from parent */}
                                      <div 
                                        className="absolute bg-primary-400"
                                        style={{
                                          left: '50%',
                                          top: '50%',
                                          width: '2px',
                                          height: `${rowDifference * 144}px`,
                                          transform: 'translateX(-50%)',
                                          zIndex: 2
                                        }}
                                      />
                                      
                                      {/* Horizontal line connecting to child */}
                                      <div 
                                        className="absolute bg-primary-400"
                                        style={{
                                          left: colDifference > 0 ? '50%' : `calc(50% + ${colDifference * 144}px)`,
                                          top: `calc(50% + ${rowDifference * 144}px - 1px)`,
                                          width: `${Math.abs(colDifference) * 144}px`,
                                          height: '2px',
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
    <div className="container mx-auto p-4">
      {filteredTree.length > 0 ? (
        renderWeaponTable()
      ) : (
        <div className="bg-gray-100 border border-gray-300 text-gray-700 px-4 py-3 rounded my-4">
          <p>No weapons found for the selected type.</p>
        </div>
      )}
    </div>
  );
}