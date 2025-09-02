import { useState, useCallback, useEffect } from 'react'
import { ContextMenuPosition } from '../types/dragDrop'

interface UseContextMenuProps {
  onAction?: (action: string, data?: any) => void
}

export const useContextMenu = ({ onAction }: UseContextMenuProps = {}) => {
  const [isVisible, setIsVisible] = useState(false)
  const [position, setPosition] = useState<ContextMenuPosition>({ x: 0, y: 0 })

  // Show context menu at specific position
  const showContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setPosition({ x: e.clientX, y: e.clientY })
    setIsVisible(true)
  }, [])

  // Hide context menu
  const hideContextMenu = useCallback(() => {
    setIsVisible(false)
  }, [])

  // Handle context menu action
  const handleAction = useCallback((action: string, data?: any) => {
    onAction?.(action, data)
    hideContextMenu()
  }, [onAction, hideContextMenu])

  // Handle global clicks to close context menu
  useEffect(() => {
    if (isVisible) {
      const handleGlobalClick = () => {
        hideContextMenu()
      }

      // Add slight delay to prevent immediate closure
      const timeoutId = setTimeout(() => {
        document.addEventListener('click', handleGlobalClick, { once: true })
      }, 0)

      return () => {
        clearTimeout(timeoutId)
        document.removeEventListener('click', handleGlobalClick)
      }
    }
  }, [isVisible, hideContextMenu])

  // Handle escape key to close context menu
  useEffect(() => {
    if (isVisible) {
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          hideContextMenu()
        }
      }

      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [isVisible, hideContextMenu])

  return {
    isVisible,
    position,
    showContextMenu,
    hideContextMenu,
    handleAction
  }
}

// Specialized hook for battle team context menu
export const useBattleTeamContextMenu = (
  onAddToBattleTeam: (teamId: string, position: number) => void
) => {
  const { isVisible, position, showContextMenu, hideContextMenu, handleAction } = useContextMenu({
    onAction: (action, data) => {
      if (action === 'addToBattleTeam' && data) {
        onAddToBattleTeam(data.teamId, data.position)
      }
    }
  })

  const handleAddToBattleTeam = useCallback((teamId: string, position: number) => {
    handleAction('addToBattleTeam', { teamId, position })
  }, [handleAction])

  return {
    isVisible,
    position,
    showContextMenu,
    hideContextMenu,
    handleAddToBattleTeam
  }
}
