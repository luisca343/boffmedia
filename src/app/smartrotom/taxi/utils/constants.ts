import { MapConstants } from '../types/map.types';

export const MINIMUM_FARE = 100
export const PRICE_PER_BLOCK = 0.5
export const TAXI_SERVICE_ACCOUNT = 0;
export const POSITION_REFRESH_INTERVAL = 5000;

export const MAP_CONSTANTS: MapConstants = {
  FIXED_MAP_SIZE_X: 2048,
  FIXED_MAP_SIZE_Z: 2048 * 1.09523809524,
  DEFAULT_MAP_BOUNDS: {
    minX: -5120,
    maxX: 5631,
    minZ: -6144,
    maxZ: 5631
  }
};

export const ZOOM_CONSTANTS = {
  MIN_ZOOM: 0.5,
  MAX_ZOOM: 5,
  ZOOM_FACTOR: 1.1
} as const;

export const UI_CONSTANTS = {
  VIEWPORT_MARGIN: 5,
  EDGE_BOUNDARY: 45
} as const;
