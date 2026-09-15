import { afterEach, describe, expect, it, vi } from "vitest";
import { ToolApiError } from "../host";
import { retryToolApiRequest } from "../retry";

describe("tool API retry policy", () => {
  afterEach(() => vi.useRealTimers());

  it("recovers a transient GET without exposing an error", async () => {
    vi.useFakeTimers();
    const operation = vi
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce(
        new ToolApiError("server unavailable", { code: "server_down" }),
      )
      .mockResolvedValue("ok");

    const result = retryToolApiRequest("GET", operation);
    await vi.advanceTimersByTimeAsync(250);

    await expect(result).resolves.toBe("ok");
    expect(operation).toHaveBeenCalledTimes(2);
  });

  it("does not retry a client/auth rejection or a mutation", async () => {
    const forbidden = () =>
      Promise.reject(new ToolApiError("forbidden", { status: 403 }));
    const write = () =>
      Promise.reject(new ToolApiError("server unavailable", { code: "server_down" }));

    await expect(retryToolApiRequest("GET", forbidden)).rejects.toMatchObject({
      status: 403,
    });
    await expect(retryToolApiRequest("PUT", write)).rejects.toMatchObject({
      code: "server_down",
    });
  });
});
