"use client";

import { useEffect, useState, useCallback } from "react";
import { useSocket } from "./useSocket";
import type { PresenceStatus } from "@/types/presence";

export interface OnlineUser {
  uuid: string;
  status: PresenceStatus;
}

/**
 * Global presence hook: Maintains a list of who's online across the entire app.
 * Syncs on connection and updates on presence changes.
 *
 * Multi-tab safety: Each tab has its own socket connection with its own UUID in users.
 * When a tab closes, only that connection's socket is removed. The user stays online
 * unless ALL their tabs disconnect.
 */
export function useGlobalPresence() {
  const { socket } = useSocket();
  const [onlineUsers, setOnlineUsers] = useState<Map<string, PresenceStatus>>(
    new Map()
  );

  // Handle initial list from server
  const handlePresenceList = useCallback(
    (list: OnlineUser[]) => {
      const map = new Map<string, PresenceStatus>();
      list.forEach(({ uuid, status }) => {
        map.set(uuid, status);
      });
      setOnlineUsers(map);
    },
    []
  );

  // Handle individual presence updates
  const handlePresenceUpdate = useCallback(
    (data: { uuid: string; status: PresenceStatus }) => {
      setOnlineUsers((prev) => {
        const next = new Map(prev);
        if (data.status === "offline") {
          next.delete(data.uuid);
        } else {
          next.set(data.uuid, data.status);
        }
        return next;
      });
    },
    []
  );

  useEffect(() => {
    if (!socket) return;

    socket.on("presence:list", handlePresenceList);
    socket.on("presence:update", handlePresenceUpdate);

    // A reconnect has a hole behind it: whatever was emitted while the tab was
    // offline is gone. The server sends a fresh presence:list after the client's
    // smartrotom:connection (which is emitted on every connect by useSocketStore),
    // so the list will auto-refresh. This listener documents that assumption.
    const handleReconnect = () => {
      // Fresh list will arrive after smartrotom:connection
    };
    socket.on("connect", handleReconnect);

    return () => {
      socket.off("presence:list", handlePresenceList);
      socket.off("presence:update", handlePresenceUpdate);
      socket.off("connect", handleReconnect);
    };
  }, [socket, handlePresenceList, handlePresenceUpdate]);

  return {
    onlineUsers,
    isOnline: (uuid: string) => onlineUsers.has(uuid),
    getStatus: (uuid: string) => onlineUsers.get(uuid) ?? "offline",
  };
}
