import { SortingStrategy } from '@dnd-kit/sortable';

// Custom strategy that completely prevents any visual reordering or transformations
export const noReorderStrategy: SortingStrategy = () => {
  // Always return zero transformation for all items
  return {
    x: 0,
    y: 0,
    scaleX: 1,
    scaleY: 1,
  };
};

// Alternative stable strategy that maintains positions without any transforms
export const stablePositionStrategy: SortingStrategy = () => {
  // Return identity transform to prevent any visual movement
  return {
    x: 0,
    y: 0,
    scaleX: 1,
    scaleY: 1,
  };
};