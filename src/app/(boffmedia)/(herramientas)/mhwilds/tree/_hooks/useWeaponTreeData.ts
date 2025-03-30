import { useState, useEffect, useMemo } from 'react';
import { useLocale } from 'next-intl';
import { mhWildsService } from '@/services/api/tools/mhWildsService';

export interface WeaponTree {
  tree: any[];
  treeByKind: Record<string, any[]>;
}

export function useWeaponTreeData() {
  const locale = useLocale();
  const [weaponTree, setWeaponTree] = useState<WeaponTree | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeWeaponType, setActiveWeaponType] = useState<string>('all');

  // Extract weapon types
  const weaponTypes = useMemo(() => {
    if (!weaponTree?.treeByKind) return [];
    return Object.keys(weaponTree.treeByKind).sort();
  }, [weaponTree]);

  // Filter weapons based on selected type
  const filteredTree = useMemo(() => {
    if (!weaponTree) return [];
    
    if (activeWeaponType === 'all') {
      return weaponTree.tree;
    }
    
    return weaponTree.treeByKind[activeWeaponType] || [];
  }, [weaponTree, activeWeaponType]);

  // Fetch weapon tree data
  const fetchWeaponTree = async () => {
    try {
      setLoading(true);
      const response = await mhWildsService.getWeaponTree(locale);
      
      if (!response.data) {
        throw new Error('No data received from weapon tree API');
      }
      
      setWeaponTree(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching weapon tree:', err);
      setError('Error loading weapon tree data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Initialize data fetching
  useEffect(() => {
    fetchWeaponTree();
  }, [locale]);

  return {
    weaponTree,
    weaponTypes,
    filteredTree,
    activeWeaponType,
    setActiveWeaponType,
    loading,
    error,
    refreshData: fetchWeaponTree,
    isLoading: loading
  };
}