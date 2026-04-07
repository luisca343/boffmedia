import { PhoneIcon, ArrowsPointingOutIcon } from "@heroicons/react/24/outline"
import { CabezaJugador } from "../minecraft/CabezaMC"
import { type CallData, UserStatus } from "../types/call"
import { useState, useEffect } from "react"

interface CollapsedViewProps {
  activeCall: CallData
  currentUserUuid: string
  onJoinCall: () => void
  onExitCall: () => void
  onExpand: () => void
  callStartTime: number
}

export function CollapsedView({ 
  activeCall, 
  currentUserUuid, 
  onJoinCall, 
  onExitCall, 
  onExpand,
  callStartTime 
}: CollapsedViewProps) {
    const [callDuration, setCallDuration] = useState("00:00")
    const currentUser = activeCall.users.find((user) => user.uuid === currentUserUuid)
    const isUserInCall = currentUser?.status === UserStatus.IN_CALL
    const isUserRinging = currentUser?.status === UserStatus.RINGING
    const usersInCall = activeCall.users.filter((user) => user.status === UserStatus.IN_CALL)
  
    useEffect(() => {
      if (!isUserInCall || !callStartTime) return
      
      const updateDuration = () => {
        const elapsed = Math.floor((Date.now() - callStartTime) / 1000)
        const minutes = Math.floor(elapsed / 60)
        const seconds = elapsed % 60
        setCallDuration(`${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`)
      }
      
      updateDuration()
      const interval = setInterval(updateDuration, 1000)
      return () => clearInterval(interval)
    }, [callStartTime, isUserInCall])
  
    return (
      <div className="flex flex-col gap-2 w-full p-2 animate-in slide-in-from-left duration-300">
        {/* Top row with caller info and expand button */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {/* Caller Avatar */}
            {activeCall.caller !== currentUserUuid && (
              <div className="flex-shrink-0">
                <CabezaJugador
                  width={36}
                  height={36}
                  uuid={activeCall.caller}
                  nombreNPC={activeCall.caller}
                  autoRotate={false}
                  tag={false}
                  zoom={1}
                />
              </div>
            )}
            
            {/* Call Info */}
            <div className="flex flex-col justify-center min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className={`text-xs font-semibold ${
                  isUserRinging ? "text-yellow-400 animate-pulse" : "text-surface-100"
                }`}>
                  {isUserRinging ? "Incoming..." : isUserInCall ? "In Call" : "Calling..."}
                </span>
                {usersInCall.length > 1 && (
                  <span className="text-xs text-surface-400">
                    ({usersInCall.length})
                  </span>
                )}
              </div>
              {isUserInCall && (
                <span className="text-[10px] text-surface-400 font-mono">
                  {callDuration}
                </span>
              )}
            </div>
          </div>
          
          {/* Expand Button */}
          <button
            onClick={onExpand}
            className="flex-shrink-0 p-1.5 hover:bg-surface-700 rounded-lg transition-all duration-200 hover:scale-110 active:scale-95"
            aria-label="Expand call view"
          >
            <ArrowsPointingOutIcon
              className="text-surface-300 hover:text-surface-100"
              height={20}
              width={20}
              strokeWidth={2.5}
            />
          </button>
        </div>
        
        {/* Bottom row with action buttons */}
        <div className="flex items-center justify-center gap-4">
          {/* Answer Button - only show when ringing */}
          {isUserRinging && (
            <button
              onClick={onJoinCall}
              className="group relative bg-highlight-500 hover:bg-highlight-600 active:bg-highlight-700 p-2.5 rounded-full transition-all duration-200 shadow-md hover:shadow-lg hover:scale-110 active:scale-95 animate-pulse"
              aria-label="Answer call"
            >
              <PhoneIcon
                className="text-white"
                height={20}
                width={20}
                strokeWidth={2.5}
              />
            </button>
          )}
          
          {/* End Call Button */}
          <button
            onClick={onExitCall}
            className="group relative bg-red-500 hover:bg-red-600 active:bg-red-700 p-2.5 rounded-full transition-all duration-200 shadow-md hover:shadow-lg hover:scale-110 active:scale-95"
            aria-label="End call"
          >
            <PhoneIcon
              className="text-white transform rotate-[135deg]"
              height={20}
              width={20}
              strokeWidth={2.5}
            />
          </button>
        </div>
      </div>
    )
  }
  
  