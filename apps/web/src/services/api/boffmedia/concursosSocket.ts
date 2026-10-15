import type {
  ConcursosRoomDto,
  ConcursosSocketRequestDto,
  ConcursosSocketResponseDto,
} from "@boffmedia/shared";
import { ApiError, getApiUrl } from "@/services/http/core";

const channels = new Map<string, ConcursosSocket>();
const key = (code: string, token: string) => `${code}:${token}`;
const unavailable = () =>
  new ApiError({ success: false, statusCode: 503, code: "CONCURSOS_ACCESS" });

/** One guest capability per socket. Reconnect gets a fresh private snapshot;
 * uncertain commands are rejected, never silently replayed into another round. */
export class ConcursosSocket {
  private socket?: WebSocket;
  private stopped = false;
  private ready = false;
  private delay = 500;
  private retry?: ReturnType<typeof setTimeout>;
  private heartbeat?: ReturnType<typeof setInterval>;
  private watchdog?: ReturnType<typeof setTimeout>;
  private pending = new Map<
    string,
    {
      resolve: (room: ConcursosRoomDto) => void;
      reject: (error: unknown) => void;
      timeout: ReturnType<typeof setTimeout>;
    }
  >();
  constructor(
    private code: string,
    private token: string,
    private onRoom: (room: ConcursosRoomDto) => void,
    private onConnection: (connected: boolean, error?: unknown) => void,
  ) {
    channels.set(key(code, token), this);
    this.connect();
  }
  private armWatchdog() {
    clearTimeout(this.watchdog);
    this.watchdog = setTimeout(() => this.socket?.close(), 15000);
  }
  private connect() {
    if (this.stopped) return;
    const url = new URL(getApiUrl());
    url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
    url.pathname = `${url.pathname.replace(/\/$/, "")}/concursos/socket`;
    url.search = "";
    const socket = new WebSocket(url);
    this.socket = socket;
    this.armWatchdog();
    socket.onopen = () =>
      socket.send(
        JSON.stringify({ type: "auth", code: this.code, token: this.token }),
      );
    socket.onmessage = (event) => {
      if (this.stopped || socket !== this.socket) return;
      const frame: ConcursosSocketResponseDto = JSON.parse(event.data);
      this.armWatchdog();
      if (frame.type === "ready") {
        this.ready = true;
        this.delay = 500;
        this.onConnection(true);
        this.heartbeat = setInterval(() => {
          if (socket.readyState === WebSocket.OPEN)
            socket.send(JSON.stringify({ type: "ping" }));
        }, 1000);
      }
      if (frame.data) {
        this.onRoom(frame.data);
        if (frame.data.status === "closed") this.stopped = true;
      }
      if (frame.type === "reply" || frame.type === "error") {
        const command = frame.id ? this.pending.get(frame.id) : undefined;
        const error = new ApiError({
          success: false,
          statusCode: frame.statusCode ?? 400,
          code: frame.code,
          userMessage: frame.userMessage,
        });
        if (command && frame.id) {
          clearTimeout(command.timeout);
          this.pending.delete(frame.id);
          if (frame.type === "reply" && frame.data) command.resolve(frame.data);
          else command.reject(error);
        } else if (frame.type === "error") this.onConnection(false, error);
      }
      if (this.stopped) socket.close();
    };
    socket.onclose = () => {
      this.ready = false;
      clearInterval(this.heartbeat);
      clearTimeout(this.watchdog);
      for (const command of this.pending.values()) {
        clearTimeout(command.timeout);
        command.reject(unavailable());
      }
      this.pending.clear();
      if (!this.stopped) {
        this.onConnection(false);
        this.retry = setTimeout(() => this.connect(), this.delay);
        this.delay = Math.min(this.delay * 2, 5000);
      }
    };
    socket.onerror = () => socket.close();
  }
  command(
    operation: `${NonNullable<ConcursosSocketRequestDto["operation"]>}`,
    body: object = {},
  ): Promise<ConcursosRoomDto> {
    if (!this.ready || this.socket?.readyState !== WebSocket.OPEN)
      return Promise.reject(unavailable());
    const id = crypto.randomUUID();
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pending.delete(id);
        reject(unavailable());
      }, 10000);
      this.pending.set(id, { resolve, reject, timeout });
      this.socket!.send(
        JSON.stringify({ type: "command", id, operation, body }),
      );
    });
  }
  stop() {
    this.stopped = true;
    clearTimeout(this.retry);
    clearInterval(this.heartbeat);
    clearTimeout(this.watchdog);
    if (channels.get(key(this.code, this.token)) === this)
      channels.delete(key(this.code, this.token));
    this.socket?.close();
  }
}
export function roomCommand(
  code: string,
  token: string,
  operation: `${NonNullable<ConcursosSocketRequestDto["operation"]>}`,
  body: object = {},
) {
  const channel = channels.get(key(code, token));
  return channel
    ? channel.command(operation, body)
    : Promise.reject(unavailable());
}
