import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useLiveShare } from "./useLiveShare";

// --- Mocks ---

function makeMockSharedMap() {
  const data: Record<string, unknown> = {};
  const listeners: Array<() => void> = [];
  return {
    _data: data,
    _listeners: listeners,
    get: (key: string) => data[key],
    set: (key: string, value: unknown) => {
      data[key] = value;
      listeners.forEach((fn) => fn());
    },
    has: (key: string) => key in data,
    forEach: (cb: (value: unknown, key: string) => void) => {
      Object.entries(data).forEach(([k, v]) => cb(v, k));
    },
    on: (_event: string, listener: () => void) => {
      listeners.push(listener);
    },
    clear: () => {
      Object.keys(data).forEach((k) => delete data[k]);
      listeners.length = 0;
    },
  };
}

const mockParticipantsMap = makeMockSharedMap();
const mockMetaMap = makeMockSharedMap();

vi.mock("@microsoft/teams-js", () => ({
  app: {
    initialize: vi.fn().mockResolvedValue(undefined),
  },
  LiveShareHost: {
    create: vi.fn().mockReturnValue({}),
  },
}));

vi.mock("@microsoft/live-share", () => ({
  LiveShareClient: vi.fn().mockImplementation(() => ({
    joinContainer: vi.fn().mockResolvedValue({
      container: {
        initialObjects: {
          participantsMap: mockParticipantsMap,
          metaMap: mockMetaMap,
        },
      },
    }),
  })),
  TestLiveShareHost: vi.fn(),
}));

// --- Tests ---

describe("useLiveShare", () => {
  beforeEach(() => {
    mockParticipantsMap.clear();
    mockMetaMap.clear();
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

    expect(mockParticipantsMap._data["user-1"]).toEqual(
      expect.objectContaining({ displayName: "Alice", categoryName: "Project Manager", costPerHour: 65 })
    );
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
