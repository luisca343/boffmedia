import { PhoneIcon, ArrowsPointingInIcon } from "@heroicons/react/24/outline"
import { type CallData, UserStatus } from "../types/call"

interface ExpandedViewProps {
  activeCall: CallData
  currentUserUuid: string
  onJoinCall: () => void
  onExitCall: () => void
  onCollapse: () => void
}

export function ExpandedView({
    activeCall,
    currentUserUuid,
    onJoinCall,
    onExitCall,
    onCollapse,
  }: ExpandedViewProps) {
    const usersInCall = activeCall.users.filter((user) => user.status === UserStatus.IN_CALL)
  
    return (
      <div className="w-full h-full flex flex-col items-center pt-12 pb-24">
        <div className="absolute top-4 right-4">
          <ArrowsPointingInIcon
            className="cursor-pointer hover:text-gray-300"
            height={30}
            width={30}
            strokeWidth={2}
            onClick={onCollapse}
          />
        </div>
        
        <div className="flex-1 flex flex-col items-center justify-center max-h-[80vh] overflow-y-auto">
          <div className="flex flex-wrap justify-center gap-4 mb-6 px-4">
            {activeCall.users.map((user) => (
              <img
                key={user.uuid}
                src={`https://crafatar.com/avatars/${user.uuid}`}
                width={100}
                height={100}
                className={`border-4 rounded-full transition-colors duration-200 ease-in-out
                ${
                  user.status === UserStatus.IN_CALL
                    ? "border-green-500"
                    : user.status === UserStatus.RINGING
                    ? "border-yellow-500"
                    : "border-red-500"
                }`}
                alt={`Avatar of user ${user.uuid}`}
              />
            ))}
          </div>
          <p className="text-center text-lg font-medium mb-4">
            {usersInCall.length === 0 && "Waiting for participants..."}
            {usersInCall.length === 1 && "Waiting for response..."}
            {usersInCall.length > 1 && "In call"}
          </p>
        </div>
  
        <div className="fixed bottom-8 left-0 right-0 flex justify-center gap-x-8">
          <PhoneIcon
            className="text-red-500 hover:text-red-600 cursor-pointer"
            height={50}
            width={50}
            strokeWidth={2}
            onClick={onExitCall}
          />
          {activeCall.users.find((user) => user.uuid === currentUserUuid)?.status === UserStatus.RINGING && (
            <PhoneIcon
              className="text-green-500 hover:text-green-600 cursor-pointer"
              height={50}
              width={50}
              strokeWidth={2}
              onClick={onJoinCall}
            />
          )}
        </div>
      </div>
    )
  }
  