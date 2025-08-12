import { PhoneIcon, ArrowsPointingOutIcon } from "@heroicons/react/24/outline"
import { CabezaJugador } from "../minecraft/CabezaMC"
import { type CallData, UserStatus } from "../types/call"

interface CollapsedViewProps {
  activeCall: CallData
  currentUserUuid: string
  onJoinCall: () => void
  onExitCall: () => void
  onExpand: () => void
}

export function CollapsedView({ activeCall, currentUserUuid, onJoinCall, onExitCall, onExpand }: CollapsedViewProps) {
    return (
      <div className="flex justify-evenly items-center w-full">
        {activeCall.caller !== currentUserUuid && (
          <CabezaJugador
            width={30}
            height={30}
            uuid={activeCall.caller}
            nombreNPC={activeCall.caller}
            autoRotate={false}
            tag={false}
            zoom={1}
          />
        )}
        <PhoneIcon
          className="text-red-500 hover:text-red-600 cursor-pointer"
          height={30}
          width={30}
          strokeWidth={2}
          onClick={onExitCall}
        />
        {activeCall.users.find((user) => user.uuid === currentUserUuid)?.status === UserStatus.RINGING && (
          <PhoneIcon
            className="text-highlight-500 hover:text-highlight-600 cursor-pointer"
            height={30}
            width={30}
            strokeWidth={2}
            onClick={onJoinCall}
          />
        )}
        <ArrowsPointingOutIcon
          className="cursor-pointer hover:text-surface-300"
          height={30}
          width={30}
          strokeWidth={2}
          onClick={onExpand}
        />
      </div>
    )
  }
  
  