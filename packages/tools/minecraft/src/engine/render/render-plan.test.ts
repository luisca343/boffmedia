import { describe, expect, it } from "vitest";
import { isolatedKind, sourcePlan } from "./render-plan";

describe("isolatedKind", () => {
  it("leaves the plan's kind alone while isolate is off", () => {
    expect(isolatedKind("normal", false, false)).toBe("normal");
    expect(isolatedKind("changed", false, false)).toBe("changed");
    expect(isolatedKind("problem", false, false)).toBe("problem");
  });

  it("ghosts every non-selection mesh while isolate is on", () => {
    expect(isolatedKind("normal", true, false)).toBe("ghost");
    expect(isolatedKind("changed", true, false)).toBe("ghost");
    expect(isolatedKind("problem", true, false)).toBe("ghost");
  });

  it("keeps the selection's own kind so its diff colour survives isolation", () => {
    expect(isolatedKind("changed", true, true)).toBe("changed");
    expect(isolatedKind("problem", true, true)).toBe("problem");
    expect(isolatedKind("normal", true, true)).toBe("normal");
  });

  it("applies to a source-plan block the same way", () => {
    const plan = sourcePlan("minecraft:stone");
    expect(isolatedKind(plan.kind, true, false)).toBe("ghost");
  });
});
