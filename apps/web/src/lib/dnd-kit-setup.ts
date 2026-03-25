import { useState, useCallback } from 'react'
import { 
  DragEndEvent, 
  DragStartEvent, 
  useSensors, 
  useSensor, 
  PointerSensor, 
  KeyboardSensor, 
  MouseSensor,
  closestCenter, 
  pointerWithin, 
  Active, 
  ClientRect, 
  DroppableContainer,
  CollisionDetection,
  PointerActivationConstraint 
} from '@dnd-kit/core'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { RectMap } from '@dnd-kit/core/dist/store'
import { Coordinates } from '@dnd-kit/core/dist/types'

// Types for different sensor configurations
export interface SensorConfig {
  type: 'pointer' | 'mouse' | 'keyboard'
  activationConstraint?: PointerActivationConstraint
}

// Default sensor configurations
export const DEFAULT_SENSOR_CONFIGS = {
  pointer: {
    type: 'pointer' as const,
    activationConstraint: {
      distance: 8,
    } as PointerActivationConstraint,
  },
  mouse: {
    type: 'mouse' as const,
    activationConstraint: {
      distance: 5,
    } as PointerActivationConstraint,
  },
  keyboard: {
    type: 'keyboard' as const,
  },
} as const

// Custom collision detection that prioritizes pointer collisions
export const createCustomCollisionDetection = (): CollisionDetection => {
  return (args: { 
    active: Active
    collisionRect: ClientRect
    droppableRects: RectMap
    droppableContainers: DroppableContainer[]
    pointerCoordinates: Coordinates | null 
  }) => {
    // First, check if the pointer is within any droppable area
    const pointerCollisions = pointerWithin(args)
    
    // If there are pointer collisions, use those
    if (pointerCollisions.length > 0) {
      return pointerCollisions
    }
    
    // Fallback to closestCenter if no pointer collisions
    return closestCenter(args)
  }
}

// Hook for setting up DnD Kit sensors with default configuration
export function useDndSensors() {
  const pointerSensor = useSensor(PointerSensor, {
    activationConstraint: DEFAULT_SENSOR_CONFIGS.pointer.activationConstraint,
  })
  
  const keyboardSensor = useSensor(KeyboardSensor, {
    coordinateGetter: sortableKeyboardCoordinates,
  })
  
  return useSensors(pointerSensor, keyboardSensor)
}

// Hook for setting up DnD Kit sensors with mouse instead of pointer
export function useDndSensorsWithMouse() {
  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint: DEFAULT_SENSOR_CONFIGS.mouse.activationConstraint,
  })
  
  const keyboardSensor = useSensor(KeyboardSensor, {
    coordinateGetter: sortableKeyboardCoordinates,
  })
  
  return useSensors(mouseSensor, keyboardSensor)
}

// Hook for managing active drag item state
export const useActiveDragItem = <T = any>() => {
  console.log('useActiveDragItem')
  const [activeDragItem, setActiveDragItem] = useState<T | null>(null)
  console.log('activeDragItem', activeDragItem)

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveDragItem(event.active.data.current as T)
  }, [])

  const handleDragEnd = useCallback((event: DragEndEvent, onDragEnd?: (event: DragEndEvent) => void) => {
    setActiveDragItem(null)
    onDragEnd?.(event)
  }, [])

  return {
    activeDragItem,
    setActiveDragItem,
    handleDragStart,
    handleDragEnd,
  }
}

// Generic drag end handler for array reordering (like in AppList)
export const createArrayReorderHandler = <T extends { id: string | number }>(
  items: T[],
  setItems: (items: T[]) => void,
  onReorder?: (newOrder: T[]) => void
) => {
  return (event: DragEndEvent) => {
    const { active, over } = event
    
    if (!over || active.id === over.id) {
      return
    }

    const activeIndex = items.findIndex(item => item.id === active.id)
    const overIndex = items.findIndex(item => item.id === over.id)

    if (activeIndex === -1 || overIndex === -1) {
      return
    }

    // Manual array move implementation to avoid additional dependencies
    const result = Array.from(items)
    const [removed] = result.splice(activeIndex, 1)
    result.splice(overIndex, 0, removed)

    setItems(result)
    onReorder?.(result)
  }
}

// Drop animation configurations
export const DROP_ANIMATIONS = {
  none: null,
  default: {
    duration: 200,
    easing: 'ease',
  },
  fast: {
    duration: 150,
    easing: 'ease-out',
  },
  slow: {
    duration: 300,
    easing: 'ease-in-out',
  },
} as const

// Common collision detection strategies
export const COLLISION_STRATEGIES = {
  closestCenter,
  pointerWithin,
  custom: createCustomCollisionDetection(),
} as const

// Utility function to create complete DnD setup - renamed to avoid hook rules
export function createDndContextConfig(options: {
  sensorConfigs?: SensorConfig[]
  collisionDetection?: CollisionDetection
  onDragStart?: (event: DragStartEvent) => void
  onDragEnd?: (event: DragEndEvent) => void
}) {
  // Note: This function returns configuration, not hooks
  // Components should call useDndSensors directly
  return {
    sensorConfigs: options.sensorConfigs,
    collisionDetection: options.collisionDetection || COLLISION_STRATEGIES.closestCenter,
    onDragStart: options.onDragStart,
    onDragEnd: options.onDragEnd,
  }
}
