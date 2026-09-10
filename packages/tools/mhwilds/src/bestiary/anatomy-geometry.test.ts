import { describe, expect, it } from "vitest";
import type { MhWildsAnatomySlot } from "../types";
import { ANATOMY_SLOT_ANCHORS, anatomyCalloutTarget } from "./anatomy-geometry";

function slot(
  key: string,
  arrow: MhWildsAnatomySlot["arrow"],
  callout?: MhWildsAnatomySlot["callout"],
): MhWildsAnatomySlot {
  return { key, visible: true, partType: 1, arrow, callout };
}

describe("anatomy callout geometry", () => {
  it("projects a report vector from each fixed slot anchor", () => {
    const result = anatomyCalloutTarget(
      slot("leftTop", { size: 189, rotation: 94, visible: true }),
    );

    expect(result?.anchor).toEqual(ANATOMY_SLOT_ANCHORS.leftTop);
    expect(result?.target.x).toBeCloseTo(36.824, 2);
    expect(result?.target.y).toBeCloseTo(19.575, 2);
  });

  it("accepts normalized endpoints when the asset pass has adjusted them", () => {
    const result = anatomyCalloutTarget(
      slot(
        "rightCenterUp",
        { size: 167, rotation: -124, visible: true },
        {
          anchor: { x: 100, y: 35 },
          target: { x: 77.539, y: 53.32 },
        },
      ),
    );

    expect(result?.target).toEqual({ x: 77.539, y: 53.32 });
  });

  it("never renders a callout for hidden or incomplete arrows", () => {
    expect(
      anatomyCalloutTarget(
        slot("leftTop", { size: 0, rotation: 94, visible: false }),
      ),
    ).toBeNull();
    expect(
      anatomyCalloutTarget(
        slot("leftTop", { size: null, rotation: 94, visible: true }),
      ),
    ).toBeNull();
    expect(
      anatomyCalloutTarget(
        slot("unknownSlot", { size: 100, rotation: 90, visible: true }),
      ),
    ).toBeNull();
  });
});
