/**
 * E2E test fixtures for battlesim.
 *
 * The suite tests the LOCAL AI BATTLE path — no socket.io, no relay, no network.
 * The local battle engine runs in a Web Worker inside the package. This is what
 * audits B7 and B11 are about: bundling, worker isolation, and the canvas
 * renderer that the UI layer does not see directly.
 *
 * Socket.io mocking was tried (see mimir observation 471) but never used here;
 * the invented frames in socket-mock.ts could pass tests that proved nothing
 * about the real product path.
 */

import { test as base } from "@playwright/test"

export const test = base

export { expect } from "@playwright/test"
