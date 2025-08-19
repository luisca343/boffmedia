import { Position, MapBounds, StopPosition } from '../types/map.types';
import { MAP_CONSTANTS, UI_CONSTANTS } from './constants';

/**
 * Coordinate transformation utilities following Single Responsibility Principle
 */
export class CoordinateTransformer {
  private mapBounds: MapBounds;

  constructor(mapBounds: MapBounds) {
    this.mapBounds = mapBounds;
  }

  /**
   * Convert world coordinates to fixed map coordinates (0 to FIXED_MAP_SIZE)
   */
  worldToMapPixels(worldX: number, worldZ: number): Position {
    const normalizedX = (worldX - this.mapBounds.minX) / (this.mapBounds.maxX - this.mapBounds.minX);
    const normalizedZ = (worldZ - this.mapBounds.minZ) / (this.mapBounds.maxZ - this.mapBounds.minZ);
    
    return {
      x: normalizedX * MAP_CONSTANTS.FIXED_MAP_SIZE_X,
      z: normalizedZ * MAP_CONSTANTS.FIXED_MAP_SIZE_Z
    };
  }

  /**
   * Convert fixed map coordinates back to world coordinates
   */
  mapPixelsToWorld(mapX: number, mapZ: number): Position {
    const normalizedX = mapX / MAP_CONSTANTS.FIXED_MAP_SIZE_X;
    const normalizedZ = mapZ / MAP_CONSTANTS.FIXED_MAP_SIZE_Z;

    const worldX = this.mapBounds.minX + normalizedX * (this.mapBounds.maxX - this.mapBounds.minX);
    const worldZ = this.mapBounds.minZ + normalizedZ * (this.mapBounds.maxZ - this.mapBounds.minZ);
    
    return { x: worldX, z: worldZ };
  }

  /**
   * Convert screen coordinates to world coordinates
   */
  screenToWorldCoords(
    screenX: number, 
    screenY: number, 
    mapCenter: Position, 
    zoomLevel: number, 
    viewportWidth: number, 
    viewportHeight: number
  ): Position | null {
    const centerMapPos = this.worldToMapPixels(mapCenter.x, mapCenter.z);
    const containerCenterX = viewportWidth / 2;
    const containerCenterY = viewportHeight / 2;
    
    const mapTopLeftX = containerCenterX - (centerMapPos.x * zoomLevel);
    const mapTopLeftY = containerCenterY - (centerMapPos.z * zoomLevel);

    const mapPosX = (screenX - mapTopLeftX) / zoomLevel;
    const mapPosZ = (screenY - mapTopLeftY) / zoomLevel;

    const worldCoords = this.mapPixelsToWorld(mapPosX, mapPosZ);
    
    return {
      x: Math.round(Math.max(this.mapBounds.minX, Math.min(this.mapBounds.maxX, worldCoords.x))),
      z: Math.round(Math.max(this.mapBounds.minZ, Math.min(this.mapBounds.maxZ, worldCoords.z))),
    };
  }
}

/**
 * Position calculation utilities
 */
export class PositionCalculator {
  private transformer: CoordinateTransformer;

  constructor(transformer: CoordinateTransformer) {
    this.transformer = transformer;
  }

  /**
   * Calculate if a stop is within viewport and get its position
   */
  calculateStopPosition(
    stop: Position,
    mapCenter: Position,
    zoomLevel: number,
    viewportWidth: number,
    viewportHeight: number
  ): StopPosition {
    const stopMapPos = this.transformer.worldToMapPixels(stop.x, stop.z);
    const centerMapPos = this.transformer.worldToMapPixels(mapCenter.x, mapCenter.z);

    const mapCenterViewportX = viewportWidth / 2;
    const mapCenterViewportY = viewportHeight / 2;

    const mapTopLeftX = mapCenterViewportX - (centerMapPos.x * zoomLevel);
    const mapTopLeftY = mapCenterViewportY - (centerMapPos.z * zoomLevel);

    const stopViewportX = mapTopLeftX + (stopMapPos.x * zoomLevel);
    const stopViewportY = mapTopLeftY + (stopMapPos.z * zoomLevel);

    const viewportX = (stopViewportX / viewportWidth) * 100;
    const viewportZ = (stopViewportY / viewportHeight) * 100;

    const isWithinView = this.isWithinViewport(viewportX, viewportZ);
    const { edgeX, edgeZ } = this.calculateEdgePosition(viewportX, viewportZ, isWithinView);
    const angle = Math.atan2(viewportZ - 50, viewportX - 50) * (180 / Math.PI);

    return {
      actualX: Math.max(0, Math.min(100, viewportX)),
      actualZ: Math.max(0, Math.min(100, viewportZ)),
      edgeX: Math.max(5, Math.min(95, edgeX)),
      edgeZ: Math.max(5, Math.min(95, edgeZ)),
      isWithinView,
      angle,
    };
  }

  private isWithinViewport(viewportX: number, viewportZ: number): boolean {
    const margin = UI_CONSTANTS.VIEWPORT_MARGIN;
    return viewportX >= margin && viewportX <= (100 - margin) && 
           viewportZ >= margin && viewportZ <= (100 - margin);
  }

  private calculateEdgePosition(
    viewportX: number, 
    viewportZ: number, 
    isWithinView: boolean
  ): { edgeX: number; edgeZ: number } {
    if (isWithinView) {
      return { edgeX: viewportX, edgeZ: viewportZ };
    }

    const centerX = 50;
    const centerZ = 50;
    const deltaX = viewportX - centerX;
    const deltaZ = viewportZ - centerZ;
    
    const absX = Math.abs(deltaX);
    const absZ = Math.abs(deltaZ);
    const boundary = UI_CONSTANTS.EDGE_BOUNDARY;
    
    let edgeX = viewportX;
    let edgeZ = viewportZ;

    if (absX > absZ) {
      edgeX = centerX + Math.sign(deltaX) * boundary;
      edgeZ = centerZ + deltaZ * (boundary / absX);
    } else {
      edgeZ = centerZ + Math.sign(deltaZ) * boundary;
      edgeX = centerX + deltaX * (boundary / absZ);
    }

    return { edgeX, edgeZ };
  }
}

/**
 * Distance calculation utilities
 */
export const calculateDistance = (pos1: Position, pos2: Position): number => {
  return Math.round(Math.hypot(pos1.x - pos2.x, pos1.z - pos2.z));
};

/**
 * Calculate world movement delta from screen movement
 */
export const calculateWorldMovementDelta = (
  screenDeltaX: number,
  screenDeltaY: number,
  zoomLevel: number,
  mapBounds: MapBounds
): Position => {
  const mapPixelDeltaX = -screenDeltaX / zoomLevel;
  const mapPixelDeltaZ = -screenDeltaY / zoomLevel;
  
  const worldWidth = mapBounds.maxX - mapBounds.minX;
  const worldHeight = mapBounds.maxZ - mapBounds.minZ;

  const worldDeltaX = (mapPixelDeltaX / MAP_CONSTANTS.FIXED_MAP_SIZE_X) * worldWidth;
  const worldDeltaZ = (mapPixelDeltaZ / MAP_CONSTANTS.FIXED_MAP_SIZE_Z) * worldHeight;

  return { x: worldDeltaX, z: worldDeltaZ };
};
