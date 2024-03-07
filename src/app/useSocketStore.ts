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
    let socket = io('http://localhost:34304');
    socket.on('connect', () => set({ socket }));
    socket.on('disconnect', () => set({ socket: null }));
  },
  disconnect: () => {
    get().socket?.disconnect();
    set({ socket: null });
  },
}));

export default useSocketStore;