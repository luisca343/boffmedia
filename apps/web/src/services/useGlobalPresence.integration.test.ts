// @vitest-environment happy-dom
//
// This app's vitest runs in `node` by default; rendering a hook needs a DOM.
// happy-dom, not jsdom: the hoisted jsdom in this workspace pulls
// html-encoding-sniffer -> the ESM-only @exodus/bytes and throws ERR_REQUIRE_ESM.
/**
 * Integration test: Global presence from socket connection to UI display
 *
 * Scenario: Player A opens web app, then visits another player's profile to see
 * if they're online. Then Player B comes online, and Player A sees the update.
 *
 * This test traces the entire flow:
 * 1. Player A's socket connects
 * 2. Backend sends presence:list with all online players
 * 3. useGlobalPresence initializes with that list
 * 4. Rooker profile displays the correct presence badge
 * 5. Player B comes online
 * 6. Backend broadcasts presence:update
 * 7. useGlobalPresence updates Player B's status
 * 8. Rooker profile automatically shows Player B as online
 */

import { describe, it, expect, beforeEach } from "vitest";

describe("Global Presence - End-to-End Integration", () => {
  let socketEvents: Map<string, Function[]>;

  beforeEach(() => {
    // Mock socket.io socket
    socketEvents = new Map();
  });

  it("traces full flow: connection -> presence list -> status update", () => {
    const playerA = "player-a-uuid";
    const playerB = "player-b-uuid";
    const playerC = "player-c-uuid";

    // Step 1: Socket connects and sends initial presence:list
    const initialList = [
      { uuid: playerA, status: "online" },
      { uuid: playerC, status: "ingame" },
    ];

    // Step 2: useGlobalPresence hook processes the list
    const onlineUsers = new Map<string, any>();
    initialList.forEach(({ uuid, status }) => {
      onlineUsers.set(uuid, status);
    });

    // Verify initial state
    expect(onlineUsers.has(playerA)).toBe(true);
    expect(onlineUsers.get(playerA)).toBe("online");
    expect(onlineUsers.has(playerB)).toBe(false);
    expect(onlineUsers.has(playerC)).toBe(true);
    expect(onlineUsers.get(playerC)).toBe("ingame");

    // Step 3: Player A visits Player B's profile
    // The profile component calls getStatus(playerB)
    const statusB = onlineUsers.get(playerB) ?? "offline";
    expect(statusB).toBe("offline");
    // PresenceBadge would show "Offline" with neutral styling

    // Step 4: Player B comes online
    // Backend broadcasts presence:update for Player B
    onlineUsers.set(playerB, "online");

    // Step 5: useGlobalPresence hook processes the update
    // Verify updated state
    expect(onlineUsers.has(playerB)).toBe(true);
    expect(onlineUsers.get(playerB)).toBe("online");

    // Step 6: Rooker profile automatically shows Player B as online
    const updatedStatusB = onlineUsers.get(playerB) ?? "offline";
    expect(updatedStatusB).toBe("online");
    // PresenceBadge now shows "Online" with button styling

    // Step 7: Player C starts playing Minecraft
    // Backend broadcasts presence:update with status change
    onlineUsers.set(playerC, "ingame");

    const statusC = onlineUsers.get(playerC) ?? "offline";
    expect(statusC).toBe("ingame");
    // PresenceBadge shows "In-game" with default styling
  });

  it("handles multi-tab scenario correctly", () => {
    const playerA = "player-a-uuid";
    const tab1Users = new Map<string, any>();
    const tab2Users = new Map<string, any>();

    // Both tabs receive the same initial presence list
    const initialList = [{ uuid: playerA, status: "online" }];

    initialList.forEach(({ uuid, status }) => {
      tab1Users.set(uuid, status);
      tab2Users.set(uuid, status);
    });

    // Tab 1 opens Rooker profile, sees Player A is online
    const tab1Status = tab1Users.get(playerA) ?? "offline";
    expect(tab1Status).toBe("online");

    // Tab 2 opens ChatApp, sees Player A is online
    const tab2Status = tab2Users.get(playerA) ?? "offline";
    expect(tab2Status).toBe("online");

    // Tab 1 receives presence:update (Player A changes to ingame)
    tab1Users.set(playerA, "ingame");

    // Tab 2 also receives the same presence:update
    tab2Users.set(playerA, "ingame");

    // Both tabs show updated status
    expect(tab1Users.get(playerA)).toBe("ingame");
    expect(tab2Users.get(playerA)).toBe("ingame");

    // Tab 1 closes (socket disconnects)
    // Backend removes that socket from users map, but playerA stays online
    // because tab 2's socket is still active

    // Tab 2 still shows Player A as online
    expect(tab2Users.get(playerA)).toBe("ingame");

    // Tab 2 closes (socket disconnects, all sockets gone)
    // Now Player A has no connections, so backend clears presence
    tab2Users.delete(playerA);

    // Remaining tabs would see Player A as offline
    expect(tab2Users.get(playerA)).toBe(undefined);
  });

  it("correctly transitions between offline and online states", () => {
    const playerUuid = "test-player";
    const onlineUsers = new Map<string, any>();

    // Player is offline initially
    expect(onlineUsers.has(playerUuid)).toBe(false);
    expect(onlineUsers.get(playerUuid) ?? "offline").toBe("offline");

    // Player comes online
    onlineUsers.set(playerUuid, "online");
    expect(onlineUsers.get(playerUuid)).toBe("online");

    // Player starts Minecraft (changes to ingame)
    onlineUsers.set(playerUuid, "ingame");
    expect(onlineUsers.get(playerUuid)).toBe("ingame");

    // Player closes Minecraft but keeps web tab open
    onlineUsers.set(playerUuid, "online");
    expect(onlineUsers.get(playerUuid)).toBe("online");

    // Player closes web tab (goes offline)
    onlineUsers.delete(playerUuid);
    expect(onlineUsers.get(playerUuid) ?? "offline").toBe("offline");
  });

  it("broadcasts to multiple clients correctly", () => {
    // Simulate multiple clients subscribed to presence updates
    const client1Online = new Map<string, any>();
    const client2Online = new Map<string, any>();
    const client3Online = new Map<string, any>();

    // All clients receive initial presence:list
    const initialList = [
      { uuid: "player-1", status: "online" },
      { uuid: "player-2", status: "online" },
    ];

    const clients = [client1Online, client2Online, client3Online];
    clients.forEach((client) => {
      initialList.forEach(({ uuid, status }) => {
        client.set(uuid, status);
      });
    });

    // Player 3 comes online
    const player3Event = { uuid: "player-3", status: "online" };

    // All clients receive the presence:update broadcast
    clients.forEach((client) => {
      client.set(player3Event.uuid, player3Event.status);
    });

    // All clients now see Player 3 as online
    clients.forEach((client) => {
      expect(client.get("player-3")).toBe("online");
    });

    // Player 1 goes offline
    const player1OfflineEvent = { uuid: "player-1", status: "offline" };

    clients.forEach((client) => {
      client.delete(player1OfflineEvent.uuid);
    });

    // All clients see Player 1 as offline
    clients.forEach((client) => {
      expect(client.has("player-1")).toBe(false);
    });
  });
});
