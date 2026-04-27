import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { MeetingStage } from "./MeetingStage";

// --- Mocks ---

const FIXED_START = new Date("2024-01-01T10:00:00Z").getTime();

vi.mock("@microsoft/teams-js", () => ({
  app: { initialize: vi.fn().mockRejectedValue(new Error("not in Teams")) },
}));

const buildUseLiveShareMock = (overrides = {}) => ({
  participants: {},
  totalCostPerHour: 0,
  meetingStartMs: FIXED_START,
  isReady: true,
  upsertParticipant: vi.fn(),
  ...overrides,
});

vi.mock("../hooks/useLiveShare", () => ({
  useLiveShare: () => buildUseLiveShareMock(),
}));

// --- Tests ---

describe("MeetingStage", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(FIXED_START);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders the app title", () => {
    render(<MeetingStage />);
    expect(screen.getByText(/meetburn/i)).toBeInTheDocument();
  });

  it("shows 00:00:00 at meeting start", () => {
    render(<MeetingStage />);
    expect(screen.getByText("00:00:00")).toBeInTheDocument();
  });

  it("timer advances each second", () => {
    render(<MeetingStage />);

    act(() => { vi.advanceTimersByTime(1000); });
    expect(screen.getByText("00:00:01")).toBeInTheDocument();

    act(() => { vi.advanceTimersByTime(59000); });
    expect(screen.getByText("00:01:00")).toBeInTheDocument();
  });

  it("shows 0.00 € accumulated cost when no time has passed", () => {
    render(<MeetingStage />);
    expect(screen.getByText(/0\.00 €/)).toBeInTheDocument();
  });

  it("shows empty state when no participants", () => {
    render(<MeetingStage />);
    expect(screen.getByText(/esperando/i)).toBeInTheDocument();
  });

  it("accumulated cost grows over time with participants", async () => {
    vi.doMock("../hooks/useLiveShare", () => ({
      useLiveShare: () =>
        buildUseLiveShareMock({
          participants: {
            u1: { displayName: "Alice", categoryName: "Director", costPerHour: 90 },
          },
          totalCostPerHour: 90,
        }),
    }));

    // Re-import to pick up new mock
    const { MeetingStage: Stage } = await import("./MeetingStage");
    render(<Stage />);

    // After 1 hour: 90 €/h × 1 h = 90.00 €
    act(() => { vi.advanceTimersByTime(3_600_000); });
    expect(screen.getByText(/90\.00 €/)).toBeInTheDocument();
  });
});
