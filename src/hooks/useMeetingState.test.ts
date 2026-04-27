import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useMeetingState } from "./useMeetingState";

// --- Mocks ---

vi.mock("@microsoft/teams-js", () => ({
  app: {
    getContext: vi.fn().mockResolvedValue({
      meeting: { id: "test-meeting-id" },
      user: { id: "user-1" },
    }),
  },
}));

const mockBCPostMessage = vi.hoisted(() => vi.fn());
const mockBCClose = vi.hoisted(() => vi.fn());
let capturedOnMessage: ((e: { data: unknown }) => void) | null = null;

vi.stubGlobal("BroadcastChannel", class {
  postMessage = mockBCPostMessage;
  close = mockBCClose;
  set onmessage(fn: ((e: { data: unknown }) => void) | null) { capturedOnMessage = fn; }
});

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();
vi.stubGlobal("localStorage", localStorageMock);

// --- Tests ---

describe("useMeetingState", () => {
  beforeEach(() => {
    localStorageMock.clear();
    mockBCPostMessage.mockClear();
    mockBCClose.mockClear();
    capturedOnMessage = null;
  });

  it("starts with isReady false, becomes true after getContext resolves", async () => {
    const { result } = renderHook(() => useMeetingState());
    expect(result.current.isReady).toBe(false);
    await waitFor(() => expect(result.current.isReady).toBe(true));
  });

  it("starts with empty participants", async () => {
    const { result } = renderHook(() => useMeetingState());
    await waitFor(() => expect(result.current.isReady).toBe(true));
    expect(result.current.participants).toEqual({});
  });

  it("upsertParticipant adds entry to participants", async () => {
    const { result } = renderHook(() => useMeetingState());
    await waitFor(() => expect(result.current.isReady).toBe(true));

    act(() => {
      result.current.upsertParticipant("u1", {
        displayName: "Alice", categoryName: "Director", costPerHour: 90, active: true,
      });
    });

    expect(result.current.participants["u1"]).toEqual({
      displayName: "Alice", categoryName: "Director", costPerHour: 90, active: true,
    });
  });

  it("totalCostPerHour sums only active participants", async () => {
    const { result } = renderHook(() => useMeetingState());
    await waitFor(() => expect(result.current.isReady).toBe(true));

    act(() => {
      result.current.upsertParticipant("u1", { displayName: "Alice", categoryName: "Director", costPerHour: 90, active: true });
      result.current.upsertParticipant("u2", { displayName: "Bob", categoryName: "C-Level", costPerHour: 130, active: false });
    });

    expect(result.current.totalCostPerHour).toBe(90);
  });

  it("totalCostPerHour is 0 when no participants", async () => {
    const { result } = renderHook(() => useMeetingState());
    await waitFor(() => expect(result.current.isReady).toBe(true));
    expect(result.current.totalCostPerHour).toBe(0);
  });

  it("upsertParticipant writes snapshot to localStorage", async () => {
    const { result } = renderHook(() => useMeetingState());
    await waitFor(() => expect(result.current.isReady).toBe(true));

    act(() => {
      result.current.upsertParticipant("u1", { displayName: "Alice", categoryName: "Director", costPerHour: 90, active: true });
    });

    const saved = JSON.parse(localStorageMock.getItem("meetburn-test-meeting-id")!);
    expect(saved.participants["u1"].displayName).toBe("Alice");
  });

  it("restores participants and meetingStartMs from localStorage on init", async () => {
    localStorageMock.setItem("meetburn-test-meeting-id", JSON.stringify({
      participants: { u1: { displayName: "Alice", categoryName: "Director", costPerHour: 90, active: true } },
      meetingStartMs: 12345,
    }));

    const { result } = renderHook(() => useMeetingState());
    await waitFor(() => expect(result.current.isReady).toBe(true));

    expect(result.current.participants["u1"].displayName).toBe("Alice");
    expect(result.current.meetingStartMs).toBe(12345);
  });

  it("upsertParticipant posts snapshot to BroadcastChannel", async () => {
    const { result } = renderHook(() => useMeetingState());
    await waitFor(() => expect(result.current.isReady).toBe(true));

    act(() => {
      result.current.upsertParticipant("u1", { displayName: "Alice", categoryName: "Director", costPerHour: 90, active: true });
    });

    expect(mockBCPostMessage).toHaveBeenCalledWith(
      expect.objectContaining({ participants: expect.objectContaining({ u1: expect.any(Object) }) })
    );
  });

  it("updates participants when BroadcastChannel receives a message", async () => {
    const { result } = renderHook(() => useMeetingState());
    await waitFor(() => expect(result.current.isReady).toBe(true));

    act(() => {
      capturedOnMessage?.({
        data: {
          participants: { u1: { displayName: "Alice", categoryName: "Director", costPerHour: 90, active: true } },
          meetingStartMs: 99999,
        },
      });
    });

    expect(result.current.participants["u1"]).toBeDefined();
    expect(result.current.meetingStartMs).toBe(99999);
  });

  it("liveShareError is always null", async () => {
    const { result } = renderHook(() => useMeetingState());
    await waitFor(() => expect(result.current.isReady).toBe(true));
    expect(result.current.liveShareError).toBeNull();
  });
});
