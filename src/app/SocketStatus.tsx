"use client"
import React, { useEffect } from 'react';
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import useSocketStore from '@/stores/useSocketStore';
import { useBoffSession } from '@/services/useBoffSession';
import { SmartRotomUser } from '@/types';

const SocketStatus = () => {
  const { session } = useBoffSession();
  const { socket, connect } = useSocketStore();

  useEffect(() => {
    if(!socket) {
      connect(session?.user.smartRotomUser as SmartRotomUser);
      return
    }
    socket.on('patata', () => console.log('Patata'));
    socket.on('connection', () => console.log('Connected'));
    socket.emit('patata', null);
  }, [socket, connect]);

  return (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger>
      <div className='cursor-pointer bg-black text-surface-50 h-10 text-xl flex items-center'>
          <span className="lg:inline hidden">{socket && socket.connected ? 'Conectado' : 'Desconectado'}</span>
          <span className="lg:hidden">{socket && socket.connected ? '🟢' : '🔴'}</span>
      </div>
    </TooltipTrigger>
    <TooltipContent>
      {socket && socket.connected ? `Conectado con id ${socket.id}` : 'No conectado'}
    </TooltipContent>
    </Tooltip>
  </TooltipProvider>
  );
};

export default SocketStatus;