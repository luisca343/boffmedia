import { useState, useEffect, useMemo } from 'react';
import { useLocale, useToolT } from "../i18n"
import { MhWildsService } from '../service';

export interface WeaponTree {
  tree: any[];
  treeByKind: Record<string, any[]>;
}

export function useWeaponTreeData() {
  const locale = useLocale();
  const t = useToolT('tools.mhwilds.tree');
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
      const response = await MhWildsService.getWeaponTree<WeaponTree>(locale);
      
      if (!response.data) {
        throw new Error('No data received from weapon tree API');
      }
      
      setWeaponTree(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching weapon tree:', err);
      setError(t('loadErrorDetail'));
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