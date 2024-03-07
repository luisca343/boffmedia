import io, { Socket } from 'socket.io-client';
import { create } from 'zustand';

interface SocketStore {
  socket: Socket | null;
  connect: () => void;
  disconnect: () => void;
}

const useSocketStore = create<SocketStore>((set, get) => ({
  socket: null,
  connect: async () => {
    if (get().socket) return;
    let socket = io(process.env.NEXT_PUBLIC_SOCKET_URL as string);
    socket.on('connect', () => set({ socket }));
    socket.on('disconnect', () => set({ socket: null }));
  },
  disconnect: () => {
    get().socket?.disconnect();
    set({ socket: null });
  },
}));

export default useSocketStore;