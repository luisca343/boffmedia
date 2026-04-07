export interface Position {
  x: number;
  z: number;
}

export interface MapBounds {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export interface StopPosition {
  actualX: number;
  actualZ: number;
  edgeX: number;
  edgeZ: number;
  isWithinView: boolean;
  angle: number;
}

export interface MapConstants {
  FIXED_MAP_SIZE_X: number;
  FIXED_MAP_SIZE_Z: number;
  DEFAULT_MAP_BOUNDS: MapBounds;
}

export interface DragState {
  isDragging: boolean;
  dragStart: { x: number; y: number };
  lastMapCenter: Position;
}

export interface ViewportDimensions {
  width: number;
  height: number;
}
