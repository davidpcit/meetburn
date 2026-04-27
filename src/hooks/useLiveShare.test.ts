import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useLiveShare } from "./useLiveShare";

// --- Mocks ---

const mockSharedMapData: Record<string, unknown> = {};
const valueChangedListeners: Array<() => void> = [];

const mockSharedMap = {
  get: (key: string) => mockSharedMapData[key],
  set: (key: string, value: unknown) => {
    mockSharedMapData[key] = value;
    valueChangedListeners.forEach((fn) => fn());
  },
  has: (key: string) => key in mockSharedMapData,
  forEach: (cb: (value: unknown, key: string) => void) => {
    Object.entries(mockSharedMapData).forEach(([k, v]) => cb(v, k));
  },
  on: (_event: string, listener: () => void) => {
    valueChangedListeners.push(listener);
  },
};

vi.mock("@microsoft/teams-js", () => ({
  app: {
    initialize: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock("@microsoft/live-share", () => ({
  LiveShareClient: vi.fn().mockImplementation(() => ({
    joinContainer: vi.fn().mockResolvedValue({
      container: {
        initialObjects: {
          participantsMap: mockSharedMap,
          metaMap: mockSharedMap,
        },
      },
    }),
  })),
  TestLiveShareHost: vi.fn(),
}));

// --- Tests ---

describe("useLiveShare", () => {
  beforeEach(() => {
    Object.keys(mockSharedMapData).forEach((k) => delete mockSharedMapData[k]);
    valueChangedListeners.length = 0;
  });

  it("starts with empty participants and isReady false", () => {
    const { result } = renderHook(() => useLiveShare());
    expect(result.current.participants).toEqual({});
    expect(result.current.isReady).toBe(false);
  });

  it("becomes ready after connecting", async () => {
    const { result } = renderHook(() => useLiveShare());
    await waitFor(() => expect(result.current.isReady).toBe(true));
  });

  it("upsertParticipant writes to the shared map", async () => {
    const { result } = renderHook(() => useLiveShare());
    await waitFor(() => expect(result.current.isReady).toBe(true));

    act(() => {
      result.current.upsertParticipant("user-1", {
        displayName: "Alice",
        categoryName: "Project Manager",
        costPerHour: 65,
        active: true,
      });
    });

    expect(mockSharedMapData["user-1"]).toEqual({
      displayName: "Alice",
      categoryName: "Project Manager",
      costPerHour: 65,
    });
  });

  it("totalCostPerHour sums all participant rates", async () => {
    const { result } = renderHook(() => useLiveShare());
    await waitFor(() => expect(result.current.isReady).toBe(true));

    act(() => {
      result.current.upsertParticipant("user-1", {
        displayName: "Alice",
        categoryName: "Project Manager",
        costPerHour: 65,
        active: true,
      });
      result.current.upsertParticipant("user-2", {
        displayName: "Bob",
        categoryName: "Director",
        costPerHour: 90,
        active: true,
      });
    });

    await waitFor(() =>
      expect(result.current.totalCostPerHour).toBe(155)
    );
  });

  it("totalCostPerHour is 0 when no participants", async () => {
    const { result } = renderHook(() => useLiveShare());
    await waitFor(() => expect(result.current.isReady).toBe(true));
    expect(result.current.totalCostPerHour).toBe(0);
  });

  it("upsertParticipant overwrites existing entry (same userId)", async () => {
    const { result } = renderHook(() => useLiveShare());
    await waitFor(() => expect(result.current.isReady).toBe(true));

    act(() => {
      result.current.upsertParticipant("user-1", {
        displayName: "Alice",
        categoryName: "Analista Junior",
        costPerHour: 25,
        active: true,
      });
      result.current.upsertParticipant("user-1", {
        displayName: "Alice",
        categoryName: "C-Level",
        costPerHour: 130,
        active: true,
      });
    });

    await waitFor(() =>
      expect(result.current.totalCostPerHour).toBe(130)
    );
  });
});
