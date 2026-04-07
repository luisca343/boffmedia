import { SortingStrategy } from '@dnd-kit/sortable';

// A stable position strategy that disables all transforms (no visual movement)
// This strategy disables all transforms (no visual movement)
export const stablePositionStrategy: SortingStrategy = () => {
  // Always return identity transform (no movement)
  return { x: 0, y: 0, scaleX: 1, scaleY: 1 };
};