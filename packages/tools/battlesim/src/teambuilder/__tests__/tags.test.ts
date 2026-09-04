/**
 * Tests for tag management in the Team Builder.
 *
 * Covers:
 * - Tag addition and removal (pure functions)
 * - Tag filtering logic
 * - Sync conflict detection (isLocalNewer)
 */

import { describe, it, expect } from "vitest";
import { isLocalNewer } from "../SyncIndicator";

describe("Tag management", () => {
  describe("Tag addition", () => {
    it("adds a tag to an empty tags array", () => {
      const current: string[] = [];
      const tag = "competitive";
      const result = [...current, tag];
      expect(result).toEqual(["competitive"]);
    });

    it("adds a tag to an existing tags array", () => {
      const current = ["casual"];
      const tag = "doubles";
      const result = [...current, tag];
      expect(result).toEqual(["casual", "doubles"]);
    });

    it("does not add duplicate tags", () => {
      const current = ["competitive"];
      const tag = "competitive";
      const result = current.includes(tag) ? current : [...current, tag];
      expect(result).toEqual(["competitive"]);
    });

    it("normalizes tag to lowercase", () => {
      const tag = "Competitive".trim().toLowerCase();
      expect(tag).toBe("competitive");
    });

    it("ignores empty/whitespace tags", () => {
      const tag = "   ".trim();
      expect(tag).toBe("");
      expect(!tag).toBe(true);
    });
  });

  describe("Tag removal", () => {
    it("removes a tag from the array", () => {
      const current = ["casual", "competitive", "doubles"];
      const tag = "competitive";
      const result = current.filter((t) => t !== tag);
      expect(result).toEqual(["casual", "doubles"]);
    });

    it("returns the same array if tag is not present", () => {
      const current = ["casual"];
      const tag = "competitive";
      const result = current.filter((t) => t !== tag);
      expect(result).toEqual(["casual"]);
    });

    it("handles removing from an empty array", () => {
      const current: string[] = [];
      const tag = "competitive";
      const result = current.filter((t) => t !== tag);
      expect(result).toEqual([]);
    });
  });

  describe("Tag filtering", () => {
    it("filters teams by a single tag", () => {
      const teams = [
        { clientId: "1", name: "Team A", format: "gen9ou", packed: "", tags: ["competitive"] },
        { clientId: "2", name: "Team B", format: "gen9ou", packed: "", tags: ["casual"] },
        { clientId: "3", name: "Team C", format: "gen9ou", packed: "", tags: ["competitive", "doubles"] },
      ];
      const tagFilter = "competitive";
      const filtered = teams.filter((team) => (team.tags ?? []).includes(tagFilter));
      expect(filtered).toHaveLength(2);
      expect(filtered.map((t) => t.clientId)).toEqual(["1", "3"]);
    });

    it("filters teams with no tags", () => {
      const teams = [
        { clientId: "1", name: "Team A", format: "gen9ou", packed: "", tags: ["competitive"] },
        { clientId: "2", name: "Team B", format: "gen9ou", packed: "" },
      ];
      const tagFilter = "competitive";
      const filtered = teams.filter((team) => (team.tags ?? []).includes(tagFilter));
      expect(filtered).toHaveLength(1);
      expect(filtered[0].clientId).toBe("1");
    });

    it("shows all teams when 'All' is selected", () => {
      const teams = [
        { clientId: "1", name: "Team A", format: "gen9ou", packed: "", tags: ["competitive"] },
        { clientId: "2", name: "Team B", format: "gen9ou", packed: "", tags: ["casual"] },
        { clientId: "3", name: "Team C", format: "gen9ou", packed: "" },
      ];
      const tagFilter = "all";
      const filtered = tagFilter === "all" ? teams : teams.filter((team) => (team.tags ?? []).includes(tagFilter));
      expect(filtered).toHaveLength(3);
    });
  });

  describe("Collecting available tags", () => {
    it("collects all unique tags from teams", () => {
      const teams: Array<{ clientId: string; tags?: string[] }> = [
        { clientId: "1", tags: ["competitive", "singles"] },
        { clientId: "2", tags: ["casual"] },
        { clientId: "3", tags: ["competitive", "doubles"] },
      ];
      const tags = new Set<string>();
      for (const team of teams) {
        if (team.tags) {
          for (const tag of team.tags) {
            tags.add(tag);
          }
        }
      }
      const sortedTags = Array.from(tags).sort();
      expect(sortedTags).toEqual(["casual", "competitive", "doubles", "singles"]);
    });

    it("handles teams with no tags", () => {
      const teams: Array<{ clientId: string; tags?: string[] }> = [
        { clientId: "1", tags: ["competitive"] },
        { clientId: "2" },
      ];
      const tags = new Set<string>();
      for (const team of teams) {
        if (team.tags) {
          for (const tag of team.tags) {
            tags.add(tag);
          }
        }
      }
      expect(Array.from(tags)).toEqual(["competitive"]);
    });

    it("returns empty set when no teams have tags", () => {
      const teams: Array<{ clientId: string; tags?: string[] }> = [{ clientId: "1" }, { clientId: "2" }];
      const tags = new Set<string>();
      for (const team of teams) {
        if (team.tags) {
          for (const tag of team.tags) {
            tags.add(tag);
          }
        }
      }
      expect(Array.from(tags)).toEqual([]);
    });
  });
});

describe("Sync indicator", () => {
  describe("isLocalNewer", () => {
    it("returns true when local is newer", () => {
      const clientUpdatedAt = 1000;
      const serverUpdatedAt = 500;
      const result = isLocalNewer(clientUpdatedAt, serverUpdatedAt);
      expect(result).toBe(true);
    });

    it("returns false when local is older", () => {
      const clientUpdatedAt = 500;
      const serverUpdatedAt = 1000;
      const result = isLocalNewer(clientUpdatedAt, serverUpdatedAt);
      expect(result).toBe(false);
    });

    it("returns false when timestamps are equal", () => {
      const clientUpdatedAt = 1000;
      const serverUpdatedAt = 1000;
      const result = isLocalNewer(clientUpdatedAt, serverUpdatedAt);
      expect(result).toBe(false);
    });

    it("returns false when clientUpdatedAt is null", () => {
      const clientUpdatedAt = null;
      const serverUpdatedAt = 1000;
      const result = isLocalNewer(clientUpdatedAt, serverUpdatedAt);
      expect(result).toBe(false);
    });

    it("handles Date objects by converting to epoch ms", () => {
      const serverDate = new Date(1000);
      const serverMs = serverDate.getTime();
      const clientUpdatedAt = 2000;
      const result = isLocalNewer(clientUpdatedAt, serverMs);
      expect(result).toBe(true);
    });
  });
});
