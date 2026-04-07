// Re-export shared map constants
export { MAP_CONSTANTS, UI_CONSTANTS } from '@/components/shared/map/StandardizedMap';

// Taxi-specific constants
export const MINIMUM_FARE = 100
export const PRICE_PER_BLOCK = 0.5
export const TAXI_SERVICE_ACCOUNT = 0;
export const POSITION_REFRESH_INTERVAL = 5000;

export const ZOOM_CONSTANTS = {
  MIN_ZOOM: 0.5,
  MAX_ZOOM: 5,
  ZOOM_FACTOR: 1.1
} as const;
