import { useState, useCallback, useEffect, useRef } from "react"
import { toast } from "react-toastify"
import { getSmartRotomUser } from "@/lib/utils"
import { useBoffSession } from "@/services/useBoffSession"
import { leaveCall, setCall } from "@/services/mcef/mcefApi"
import useSocketStore from "@/stores/useSocketStore"
import { type CallData, type UserData, UserStatus } from "../types/call"
import { ExpandedView } from "./ExpandedView"
import { CollapsedView } from "./CollapsedView"

export function CallStatus() {
  const { socket } = useSocketStore()
  const { session } = useBoffSession()
  const [activeCall, setActiveCall] = useState<CallData>({
    users: [],
    caller: "",
    chatId: "",
  })
  const [isExpanded, setIsExpanded] = useState(false)
  const [callStartTime, setCallStartTime] = useState<number>(0)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    const intervalId = setInterval(() => {
      const activeUser = activeCall.users.find((user) => user.uuid === getSmartRotomUser(session).uuid)
      if (callStartTime && Date.now() - callStartTime > 3000000 && activeUser?.status === UserStatus.RINGING) {
        toast.error("Llamada perdida")
        exitCall()
      }
    }, 1000)
    return () => clearInterval(intervalId)
  }, [activeCall.users, callStartTime, session])

  const playSound = useCallback(async () => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    if (audioRef.current) {
      if (!audioRef.current.paused) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      } else {
        audioRef.current.loop = true;
        audioRef.current.play().catch(() => playSound());
      }
    }
  }, []);

  const stopSound = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
  }, [])

  const startCall = useCallback(
    (data: CallData) => {
      if (!socket) return
      if (getSmartRotomUser(session).uuid !== data.caller) {
        playSound()
      } else {
        setCall(data)
      }
      setCallStartTime(Date.now())
      setActiveCall({
        ...data,
        users: data.users.map((user) =>
          user.uuid === data.caller ? { ...user, status: UserStatus.IN_CALL } : { ...user, status: UserStatus.RINGING },
        ),
      })
    },
    [playSound, socket, session],
  )

  const clearCall = useCallback(() => {
    console.log("Clearing call")
    setActiveCall({ users: [], caller: "", chatId: "" })
  }, [])

  useEffect(() => {
    if (!socket) return

    const activeUser = activeCall.users.find((user) => user.uuid === getSmartRotomUser(session).uuid)

    const users = activeCall.users.reduce(
      (acc, user) => {
        if (!acc[user.status]) acc[user.status] = []
        acc[user.status].push(user.uuid)
        return acc
      },
      {} as Record<UserStatus, string[]>,
    )

    if (activeUser?.status !== UserStatus.RINGING) {
      stopSound()
    }

    if (activeCall.users.length > 1 && (users.RINGING?.length || 0) + (users.IN_CALL?.length || 0) <= 1) {
      exitCall()
    }

    const handleCall = (data: CallData) => {
      const uuid = getSmartRotomUser(session).uuid
      if (data.caller === uuid) {
        setIsExpanded(true)
      }
      startCall(data)
    }

    const handleExitCall = (data: { call: CallData; user: UserData }) => {
      const updatedUsers = activeCall.users.map((user) =>
        user.uuid === data.user.uuid ? { ...user, status: UserStatus.IDLE } : user,
      )
      if (updatedUsers.length === 0) return clearCall()
      setActiveCall((prevState) => ({ ...prevState, users: updatedUsers }))
    }

    const handleJoinCall = (data: UserData) => {
      const updatedUsers = activeCall.users.map((user) =>
        user.uuid === data.uuid ? { ...user, status: UserStatus.IN_CALL } : user,
      )
      setActiveCall((prevState) => ({ ...prevState, users: updatedUsers }))
    }

    socket.on("chat:call", handleCall)
    socket.on("chat:exitcall", handleExitCall)
    socket.on("chat:joincall", handleJoinCall)

    return () => {
      socket.off("chat:call", handleCall)
      socket.off("chat:exitcall", handleExitCall)
      socket.off("chat:joincall", handleJoinCall)
    }
  }, [socket, session, startCall, clearCall, activeCall.users, stopSound])

  function joinCall(data?: CallData) {
    const callData = data || activeCall
    if (!socket) return

    socket.emit("chat:joincall", {
      call: callData,
      user: getSmartRotomUser(session),
    })

    setCall(callData)
      .then((result) => {
        if (result.error) {
          console.error("Error setting call", result.error)
          return
        }
        const smartRotomResponse = result.data!
        if (smartRotomResponse.status === 200) {
          console.log("Only one user in call, stopping sound")
        }
        if (smartRotomResponse.status === 201) {
          console.log("User joined call, data:", smartRotomResponse.data)
        }
      })
      .catch((error) => console.error("Error setting call", error))
  }

  function exitCall() {
    console.log("Exiting call")
    if (!socket) return clearCall()
    socket.emit("chat:exitcall", {
      call: activeCall,
      user: getSmartRotomUser(session),
      startTime: callStartTime,
    })
    clearCall()

    leaveCall(activeCall)
      .then((result) => {
        if (result.error) {
          console.error("Error leaving call", result.error)
          return
        }
        const smartRotomResponse = result.data!
        console.log("Leave Call:", smartRotomResponse)
      })
      .catch((error) => console.error("Error leaving call", error))
  }

  if (!activeCall.caller) return null

  return (
    <nav
      style={
        isExpanded
          ? { background: "radial-gradient(900px 600px at 50% -8%, rgba(0,168,132,.26), transparent 60%), linear-gradient(180deg,#0d171d,#060d11)" }
          : undefined
      }
      className={`fixed transition-all duration-300 ease-in-out ${
        isExpanded
          ? "inset-0 z-50 flex flex-col"
          : "left-3 top-16 z-30 w-[320px] max-w-[calc(100vw-24px)] overflow-hidden rounded-[16px] border border-[#2a3942] bg-[#111b21] shadow-[0_24px_60px_-18px_rgba(0,0,0,.55)]"
      } text-[#e9edef] ${activeCall.caller ? "" : "hidden"}`}
    >
      <audio ref={audioRef} src="/smartrotom/audio/apps/chatapp/denden.mp3" preload="auto"></audio>
      {isExpanded ? (
        <ExpandedView
          activeCall={activeCall}
          currentUserUuid={getSmartRotomUser(session).uuid}
          onJoinCall={() => joinCall()}
          onExitCall={exitCall}
          onCollapse={() => setIsExpanded(false)}
          callStartTime={callStartTime}
        />
      ) : (
        <CollapsedView
          activeCall={activeCall}
          currentUserUuid={getSmartRotomUser(session).uuid}
          onJoinCall={() => joinCall()}
          onExitCall={exitCall}
          onExpand={() => setIsExpanded(true)}
          callStartTime={callStartTime}
        />
      )}
    </nav>
  )
}

