import { PhoneIcon, ArrowsPointingInIcon } from "@heroicons/react/24/outline"
import { type CallData, UserStatus } from "../types/call"
import { useEffect, useState } from "react"

interface ExpandedViewProps {
  activeCall: CallData
  currentUserUuid: string
  onJoinCall: () => void
  onExitCall: () => void
  onCollapse: () => void
  callStartTime: number
}

export function ExpandedView({
    activeCall,
    currentUserUuid,
    onJoinCall,
    onExitCall,
    onCollapse,
    callStartTime,
  }: ExpandedViewProps) {
    const usersInCall = activeCall.users.filter((user) => user.status === UserStatus.IN_CALL)
    const usersRinging = activeCall.users.filter((user) => user.status === UserStatus.RINGING)
    const [callDuration, setCallDuration] = useState("00:00")
    const currentUser = activeCall.users.find((user) => user.uuid === currentUserUuid)
    const isUserInCall = currentUser?.status === UserStatus.IN_CALL
  
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
  
    const getStatusMessage = () => {
      if (usersInCall.length === 0) return "Waiting for participants..."
      if (usersInCall.length === 1 && usersRinging.length > 0) return "Ringing..."
      if (usersInCall.length === 1) return "Connecting..."
      return `${usersInCall.length} participants`
    }
  
    return (
      <div className="w-full h-full flex flex-col items-center pt-12 pb-24 bg-gradient-to-b from-surface-900 to-surface-800 animate-in fade-in duration-300">
        <div className="absolute top-4 right-4 z-10">
          <ArrowsPointingInIcon
            className="cursor-pointer hover:text-surface-300 hover:scale-110 transition-all duration-200 drop-shadow-lg"
            height={32}
            width={32}
            strokeWidth={2.5}
            onClick={onCollapse}
          />
        </div>
        
        <div className="flex-1 flex flex-col items-center justify-center max-h-[80vh] overflow-y-auto w-full px-4">
          {/* Call Duration Timer */}
          {isUserInCall && (
            <div className="text-surface-300 text-sm font-mono mb-6 animate-in slide-in-from-top duration-500">
              {callDuration}
            </div>
          )}
          
          {/* User Avatars Grid */}
          <div className="flex flex-wrap justify-center gap-6 mb-8 max-w-2xl">
            {activeCall.users.map((user, index) => (
              <div
                key={user.uuid}
                className="flex flex-col items-center gap-2 animate-in zoom-in duration-300"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="relative">
                  <img
                    src={`https://mc-heads.net/avatar/${user.uuid}`}
                    width={100}
                    height={100}
                    className={`rounded-full transition-all duration-300 shadow-lg
                    ${
                      user.status === UserStatus.IN_CALL
                        ? "border-4 border-highlight-500 shadow-highlight-500/50 scale-100"
                        : user.status === UserStatus.RINGING
                        ? "border-4 border-yellow-500 shadow-yellow-500/50 animate-pulse"
                        : "border-4 border-red-500 shadow-red-500/50 opacity-50"
                    }`}
                    alt={`Avatar of user ${user.uuid}`}
                  />
                  {/* Status Indicator Dot */}
                  <div
                    className={`absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-surface-900
                    ${
                      user.status === UserStatus.IN_CALL
                        ? "bg-highlight-500"
                        : user.status === UserStatus.RINGING
                        ? "bg-yellow-500 animate-pulse"
                        : "bg-red-500"
                    }`}
                  />
                </div>
                {/* User UUID Label */}
                <span className="text-xs text-surface-400 max-w-[100px] truncate">
                  {user.uuid === currentUserUuid ? "You" : user.username}
                </span>
              </div>
            ))}
          </div>
          
          {/* Status Message */}
          <p className="text-center text-xl font-medium mb-4 text-surface-100 animate-in fade-in duration-500">
            {getStatusMessage()}
          </p>
          
          {/* Additional Status Info */}
          {usersRinging.length > 0 && (
            <p className="text-center text-sm text-surface-400 animate-pulse">
              Waiting for {usersRinging.length} {usersRinging.length === 1 ? 'person' : 'people'} to join...
            </p>
          )}
        </div>
  
        {/* Action Buttons */}
        <div className="fixed bottom-8 left-0 right-0 flex justify-center items-center gap-x-12 animate-in slide-in-from-bottom duration-500">
          {/* End Call Button */}
          <button
            onClick={onExitCall}
            className="group relative bg-red-500 hover:bg-red-600 active:bg-red-700 p-5 rounded-full transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-110 active:scale-95"
            aria-label="End call"
          >
            <PhoneIcon
              className="text-white transform rotate-[135deg]"
              height={32}
              width={32}
              strokeWidth={2.5}
            />
            <span className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-surface-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              End Call
            </span>
          </button>
          
          {/* Answer Call Button */}
          {currentUser?.status === UserStatus.RINGING && (
            <button
              onClick={onJoinCall}
              className="group relative bg-highlight-500 hover:bg-highlight-600 active:bg-highlight-700 p-5 rounded-full transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-110 active:scale-95 animate-pulse"
              aria-label="Answer call"
            >
              <PhoneIcon
                className="text-white"
                height={32}
                width={32}
                strokeWidth={2.5}
              />
              <span className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-surface-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                Answer
              </span>
            </button>
          )}
        </div>
      </div>
    )
  }
  