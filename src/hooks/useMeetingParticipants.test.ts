import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useMeetingParticipants } from "./useMeetingParticipants";

const mockGetParticipants = vi.fn();

vi.mock("@microsoft/teams-js", () => ({
  meeting: { getParticipants: (...args: unknown[]) => mockGetParticipants(...args) },
  app: { initialize: vi.fn().mockResolvedValue(undefined) },
}));

const makeParticipant = (id: string, displayName: string) => ({ aadObjectId: id, displayName });

describe("useMeetingParticipants", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockGetParticipants.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns participants from getParticipants on mount", async () => {
    mockGetParticipants.mockImplementation((cb: Function) =>
      cb(null, { participants: [makeParticipant("u1", "Alice")] })
    );
    const { result } = renderHook(() => useMeetingParticipants());
    await act(async () => {});
    expect(result.current).toHaveLength(1);
    expect(result.current[0].displayName).toBe("Alice");
  });

  it("polls every 15 seconds", async () => {
    mockGetParticipants.mockImplementation((cb: Function) =>
      cb(null, { participants: [makeParticipant("u1", "Alice")] })
    );
    renderHook(() => useMeetingParticipants());
    await act(async () => {});
    expect(mockGetParticipants).toHaveBeenCalledTimes(1);

    await act(async () => { vi.advanceTimersByTime(15000); });
    expect(mockGetParticipants).toHaveBeenCalledTimes(2);
  });

  it("returns empty array when getParticipants fails", async () => {
    mockGetParticipants.mockImplementation((cb: Function) =>
      cb(new Error("not in meeting"), null)
    );
    const { result } = renderHook(() => useMeetingParticipants());
    await act(async () => {});
    expect(result.current).toHaveLength(0);
  });

  it("updates list when new participant joins on next poll", async () => {
    mockGetParticipants
      .mockImplementationOnce((cb: Function) =>
        cb(null, { participants: [makeParticipant("u1", "Alice")] })
      )
      .mockImplementationOnce((cb: Function) =>
        cb(null, { participants: [makeParticipant("u1", "Alice"), makeParticipant("u2", "Bob")] })
      );
    const { result } = renderHook(() => useMeetingParticipants());
    await act(async () => {});
    expect(result.current).toHaveLength(1);

    await act(async () => { vi.advanceTimersByTime(15000); });
    expect(result.current).toHaveLength(2);
  });
});
