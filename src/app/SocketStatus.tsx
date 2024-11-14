"use client"
import React, { useEffect } from 'react';
import useSocketStore from './useSocketStore';
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const SocketStatus = () => {
  const { socket, connect } = useSocketStore();

  useEffect(() => {
    if(!socket) {
      connect();
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
      <div className='cursor-pointer bg-black text-text-primary h-10 text-xl flex items-center'>
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