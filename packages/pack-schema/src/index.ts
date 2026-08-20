// One schema, both ends: the dashboard validates a manifest when it publishes,
// the launcher validates the same bytes when it installs. Schema drift between
// server and client is a classic launcher bug class and this
// package is what eliminates it structurally.

export * from "./mrpack.js"
export * from "./boffmedia.js"
export * from "./randomizer-settings.js"
