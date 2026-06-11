import { io, Socket } from 'socket.io-client';
import { env } from '@/config/env.public';

export type SocketNamespace = '/battle' | '/showdown';
export type SocketChannel = 'battle' | 'pvp' | 'showdown';

const CHANNEL_CONFIG: Record<SocketChannel, { ns: SocketNamespace; windowKey: string; regKey: string }> = {
  battle: { ns: '/battle', windowKey: '__battlesim_socket', regKey: '__battlesim_listeners_registered' },
  pvp: { ns: '/battle', windowKey: '__pvp_socket', regKey: '__pvp_listeners_registered' },
  showdown: { ns: '/showdown', windowKey: '__showdown_socket', regKey: '__showdown_listeners_registered' },
};

function getGlobal(key: string): any {
  if (typeof window === 'undefined') return undefined;
  return (window as any)[key];
}

function setGlobal(key: string, value: any): void {
  if (typeof window === 'undefined') return;
  (window as any)[key] = value;
}

export function getSocket(channel: SocketChannel): Socket | null {
  return getGlobal(CHANNEL_CONFIG[channel].windowKey) ?? null;
}

export function getOrCreateSocket(channel: SocketChannel): Socket {
  const existing = getSocket(channel);
  if (existing) return existing;

  const config = CHANNEL_CONFIG[channel];
  const API_BASE_URL = env.NEXT_PUBLIC_API;
  const socket = io(`${API_BASE_URL}${config.ns}`);
  setGlobal(config.windowKey, socket);
  return socket;
}

export function waitForConnect(
  socket: Socket,
  timeoutMs: number = 5000,
): Promise<void> {
  if (socket.connected) return Promise.resolve();

  return new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error('Socket connect timeout'));
    }, timeoutMs);

    function cleanup() {
      clearTimeout(timer);
      socket.off('connect', onConnect);
    }

    function onConnect() {
      cleanup();
      resolve();
    }

    socket.on('connect', onConnect);
    socket.connect();
  });
}

export function registerListenersOnce(
  channel: SocketChannel,
  listeners: Array<[event: string, handler: (...args: any[]) => void]>,
): void {
  const config = CHANNEL_CONFIG[channel];
  if (getGlobal(config.regKey)) return;

  setGlobal(config.regKey, true);
  const socket = getSocket(channel);
  if (!socket) return;

  for (const [event, handler] of listeners) {
    socket.on(event, handler);
  }
}

export function resetListenerRegistration(channel: SocketChannel): void {
  const config = CHANNEL_CONFIG[channel];
  setGlobal(config.regKey, false);
}
