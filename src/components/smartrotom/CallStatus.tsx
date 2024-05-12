import useSocketStore from "@/app/useSocketStore";
import { getSmartRotomUser } from "@/lib/utils";
import { PhoneIcon, ArrowsPointingOutIcon, ArrowsPointingInIcon } from '@heroicons/react/24/outline'
import { useSession } from "next-auth/react";
import { useEffect, useRef, useState } from "react"
import { toast } from "react-toastify";
import { CabezaJugador } from "./CabezaMC";
import { mcefQuery } from "@/services/mcefHelper";
import { SmartRotomResponse } from "@/types";

interface CallData {
    users: {uuid: string, active: boolean}[];
    caller: string;
    callId: string;
}

export function CallStatus(){
    const { socket } = useSocketStore();
    const {data: session} = useSession();
    const [activeCall, setActiveCall] = useState({users: [], caller: '', callId: ''} as CallData);
    const [isExpanded, setIsExpanded] = useState(false);

    const audioRef = useRef<HTMLAudioElement | null>(null);
    
    const activeCallRef = useRef(activeCall);
    useEffect(() => {
        const prevActiveUsers = activeCallRef.current.users.filter(user => user.active);

        const newActiveUsers = activeCall.users.filter(user => user.active);


        /*
        console.log('Active call >', activeCallRef.current, activeCall);
        console.log('Active users >', prevActiveUsers, newActiveUsers);*/

        if(newActiveUsers.length > prevActiveUsers.length){
            stopSound();
        }
        

        activeCallRef.current = activeCall;

        mcefQuery('setCall', activeCall)
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
            

    }, [activeCall]);

    async function startCall(data: CallData) {
        if(!socket) return;
        console.log('Starting call', data);
        setActiveCall(data);
        playSound();
    }

    async function playSound() {
        await new Promise(resolve => setTimeout(resolve, 100));
        if (audioRef.current) {
            console.log('Audio', audioRef.current);
            if (!audioRef.current.paused) {
                audioRef.current.pause()
                audioRef.current.currentTime = 0
            } else {
                audioRef.current.loop = true;
                audioRef.current.play().catch(error => {
                    console.error('Error playing sound:', error);
                });
            }
        }
    }

    function stopSound() {
        if (audioRef.current) {
            audioRef.current.pause()
            audioRef.current.currentTime = 0
        }
    }

    useEffect(() => {
        if(!socket) return;
        socket.on('chat:call', (data) => { 
            const uuid = getSmartRotomUser(session).uuid;
            if(data.caller === uuid ) {
                setIsExpanded(true);
                startCall(data);
            } else {
                toast.info('Llamada entrante de ' + data.caller);
    
                startCall(data);
            }
        });

        socket.on('chat:exitcall', (data) => {
            console.log('Exit call signal received', data);
            const updatedUsers = activeCallRef.current.users.map(user => 
                {
                    return user.uuid === data.user.uuid ? { ...user, active: false } : user
                }
            );

            setActiveCall(prevState => ({ ...prevState, users: updatedUsers }));
        });

        socket.on('chat:joincall', (data) => {
            const updatedUsers = activeCallRef.current.users.map(user => 
                {
                    return user.uuid === data.uuid ? { ...user, active: true } : user
                }
            );

            setActiveCall(prevState => ({ ...prevState, users: updatedUsers }));
        });
    
    }, [socket, session])

    function joinCall(){
        if(!socket) return;
        socket.emit('chat:joincall', {call: activeCall, user: getSmartRotomUser(session)});
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

    function clearCall(){
        console.log('Clearing call');
        setActiveCall({users: [], caller: '', callId: ''});
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
                {!activeCall.users.find(
                    user => user.uuid === getSmartRotomUser(session).uuid)?.active 
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
                                    className={`border-2 m-2  ${user.active ? ' border-green-500' : ' border-red-500'}`}
                                    />
                            </div>
                            )}
                        </div>
                        <div>
                            {activeCall.users.filter(user => user.active === true).length === 1 && "Esperando respuesta..." }
                            {activeCall.users.filter(user => user.active === true).length > 1 && "En llamada"}
                        </div>
                    </div>
                }
            </div>
        </nav>
    )

    return(
        <nav className={`flex items-center justify-center absolute right-0 bg-zinc-900 text-white font-bold 
            ${activeCall ? '' : 'hidden'}
            ${isExpanded ? 'w-full h-full' : 'w-60 h-12'}`}
            >
            <PhoneIcon height={30} width={30} strokeWidth={2} onClick={() => toast.info('Colgando')}>Colgar</PhoneIcon>
            {isExpanded 
                ? <ArrowsPointingInIcon height={30} width={30} strokeWidth={2} onClick={() => setIsExpanded(false)}>Compartir</ArrowsPointingInIcon>
                : <ArrowsPointingOutIcon height={30} width={30} strokeWidth={2} onClick={() => setIsExpanded(true)}>Compartir</ArrowsPointingOutIcon>
            }
            
        </nav>
    )
}