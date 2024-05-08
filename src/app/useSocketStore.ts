import { SmartRotomUser } from '@/types';
import io, { Socket } from 'socket.io-client';
import { create } from 'zustand';

interface SocketStore {
  socket: Socket | null;
  user: SmartRotomUser | null;
  connect: (user: SmartRotomUser) => void;
  disconnect: () => void;
}

const useSocketStore = create<SocketStore>((set, get) => ({
  user: null,
  socket: null,
  connect: async (user) => {
    if (get().socket) return;
    let socket = io(process.env.NEXT_PUBLIC_SOCKET_URL as string);
    socket.on('connect', () => {
      set({ user });
      set({ socket });
      socket.emit('smartrotom:connection', user);
    });
    socket.on('disconnect', () => {
      set({ user: null });
      set({ socket: null });
    });
  },
  disconnect: () => {
    get().socket?.disconnect();
    set({ socket: null });
  },
}));

export default useSocketStore;