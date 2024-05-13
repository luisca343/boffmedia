import useSocketStore from "@/app/useSocketStore";
import { getSmartRotomUser } from "@/lib/utils";
import { PhoneIcon, ArrowsPointingOutIcon, ArrowsPointingInIcon } from '@heroicons/react/24/outline'
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useRef, useState } from "react"
import { toast } from "react-toastify";
import { CabezaJugador } from "./CabezaMC";
import { mcefQuery } from "@/services/mcefHelper";
import { SmartRotomResponse } from "@/types";
import { set } from "react-hook-form";



enum UserStatus {
    RINGING='RINGING',
    IN_CALL='IN_CALL',
    IDLE='IDLE'
}

interface UserData {
    uuid: string;
    status: UserStatus;
}

interface CallData {
    users: UserData[];
    caller: string;
    callId: string;
}

export function CallStatus(){
    const { socket } = useSocketStore();
    const { data: session } = useSession();
    const [activeCall, setActiveCall] = useState<CallData>({ users: [], caller: '', callId: '' });
    const [isExpanded, setIsExpanded] = useState(false);
    const [callStartTime, setCallStartTime] = useState<number>(0);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        const intervalId = setInterval(() => {
            const activeUser = activeCall.users.find(user => user.uuid === getSmartRotomUser(session).uuid);
            if (callStartTime && Date.now() - callStartTime > 6000 && activeUser?.status === UserStatus.RINGING) {
                toast.error('Llamada perdida');
                exitCall();
            }

        }, 1000);
        return () => {
            clearInterval(intervalId);
        };
    }, [activeCall.users, callStartTime, session]);

    const playSound = useCallback(async () => {
        await new Promise(resolve => setTimeout(resolve, 500));
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
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }
    }, []);

    const startCall = useCallback((data: CallData) => {
        if (!socket) return;
        if(getSmartRotomUser(session).uuid !== data.caller) playSound();
        setCallStartTime(Date.now());
        setActiveCall({
            ...data,
            users: data.users.map(user =>
                user.uuid === data.caller ? { ...user, status: UserStatus.IN_CALL } : { ...user, status: UserStatus.RINGING }
            )
        });
    }, [playSound, socket]);

    const clearCall = useCallback(() => {
        console.log('Clearing call');
        setActiveCall({ users: [], caller: '', callId: '' });
    }, []);

    
    useEffect(() => {
        if (!socket) return;

        const activeUser = activeCall.users.find(user => user.uuid === getSmartRotomUser(session).uuid);


        const users = activeCall.users.reduce((acc, user) => {
            if (!acc[user.status]) acc[user.status] = [];
            acc[user.status].push(user.uuid);
            return acc;
        }, {} as Record<UserStatus, string[]>);

        if(activeUser?.status !== UserStatus.RINGING){
           stopSound();
        }

        
        if(activeCall.users.length > 1 && (users.RINGING?.length || 0) + (users.IN_CALL?.length || 0) <= 1){
            exitCall();
        }


        const handleCall = (data: CallData) => {
            const uuid = getSmartRotomUser(session).uuid;
            if (data.caller === uuid) {
                setIsExpanded(true);
            } 
            startCall(data);
        };
        
        const handleExitCall = (data: {call: CallData, user: UserData}) => {
            const updatedUsers = activeCall.users.map(user =>
                user.uuid === data.user.uuid ? { ...user, status: UserStatus.IDLE } : user
            );
            if (updatedUsers.length === 0) return clearCall();
            setActiveCall(prevState => ({ ...prevState, users: updatedUsers }));
        };
        
        const handleJoinCall = (data: UserData) => {
            const updatedUsers = activeCall.users.map(user =>
                user.uuid === data.uuid ? { ...user, status: UserStatus.IN_CALL } : user
            );
            setActiveCall(prevState => ({ ...prevState, users: updatedUsers }));
        };
        
        socket.on('chat:call', handleCall);
        socket.on('chat:exitcall', handleExitCall);
        socket.on('chat:joincall', handleJoinCall);
        
        return () => {
            socket.off('chat:call', handleCall);
            socket.off('chat:exitcall', handleExitCall);
            socket.off('chat:joincall', handleJoinCall);
        };
    }, [socket, session, startCall, clearCall, activeCall.users]);
    
    
    function joinCall(data?: CallData){
        const callData = data || activeCall;
        if(!socket) return;
        
        socket.emit('chat:joincall', {call: callData, user: getSmartRotomUser(session)});
        
        mcefQuery('setCall', callData)
        .then((response: unknown) => {
            const smartRotomResponse = response as SmartRotomResponse;
            if(smartRotomResponse.status === 200){
                console.log('Only one user in call, stopping sound');
            } 
            if(smartRotomResponse.status === 201){
                console.log('User joined call, data:', smartRotomResponse.data);
            }
        })
        .catch(error => console.error('Error setting call', error));
        
    }
    
    function exitCall(){
        console.log('Exiting call');
        if(!socket) return clearCall();
        socket.emit('chat:exitcall', {call: activeCall, user: getSmartRotomUser(session)});
        clearCall();
        
        
        mcefQuery('leaveCall', activeCall)
        .then((response: unknown) => {
            const smartRotomResponse = response as SmartRotomResponse;
            console.log('Leave Call:', smartRotomResponse);
        })
        .catch(error => console.error('Error setting call', error));
        
    }
    
    
    if(!activeCall.caller) return null;
    
    
    return (
        <nav className={`flex flex-col items-center justify-center absolute ${isExpanded ? 'right-0 w-full h-full' : 'left-0 w-60 h-12'} bg-zinc-900 text-white font-bold z-20 ${activeCall || isExpanded ? '' : 'hidden'}`}>
        <audio ref={audioRef} src='/smartrotom/audio/chatapp/denden.mp3' preload="auto"></audio>
        <div className="flex justify-evenly">
        {activeCall.caller !== getSmartRotomUser(session).uuid && 
            <CabezaJugador width={30} height={30} uuid={activeCall.caller} nombreNPC={activeCall.caller} autoRotate={false} tag={false} zoom={1} />
        }
        <PhoneIcon className="text-red-500" height={30} width={30} strokeWidth={2} onClick={() => exitCall()}>Colgar</PhoneIcon>
        {activeCall.users.find(
            user => user.uuid === getSmartRotomUser(session).uuid)?.status === UserStatus.RINGING
            && <PhoneIcon className="text-green-500" height={30} width={30} strokeWidth={2} onClick={() => joinCall()}>Llamar</PhoneIcon>
        }
        {isExpanded ? 
            <ArrowsPointingInIcon height={30} width={30} strokeWidth={2} onClick={() => setIsExpanded(false)}></ArrowsPointingInIcon> 
            : 
            <ArrowsPointingOutIcon height={30} width={30} strokeWidth={2} onClick={() => setIsExpanded(true)}></ArrowsPointingOutIcon>
        }
        </div>
        <div className="flex justify-around">
        {
            
            isExpanded && <div>
            <div className="flex items-center">
            {activeCall.users.map(user => 
                <div className="flex w-24" key={user.uuid}>
                <img src={`https://crafatar.com/avatars/${user.uuid}`} 
                    width={100} height={100}
                    className={`border-2 m-2  
                    ${user.status === UserStatus.IN_CALL ? ' border-green-500' 
                    : user.status === UserStatus.RINGING ? ' border-yellow-500' 
                    : ' border-red-500'}`}
                    />
                </div>
            )}
            </div>
            <div>
            {activeCall.users.filter(user => user.status === UserStatus.IN_CALL).length === 1 && "Esperando respuesta..." }
            {activeCall.users.filter(user => user.status === UserStatus.IN_CALL).length > 1 && "En llamada"}
            </div>
            </div>
        }
        </div>
        </nav>
    )
}