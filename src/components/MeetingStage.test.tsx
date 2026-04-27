import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { MeetingStage } from "./MeetingStage";

// --- Mocks ---

const FIXED_START = vi.hoisted(() => new Date("2024-01-01T10:00:00Z").getTime());
const mockStopSharing = vi.hoisted(() => vi.fn());

vi.mock("@microsoft/teams-js", () => ({
  app: { initialize: vi.fn().mockRejectedValue(new Error("not in Teams")) },
  meeting: { stopSharingAppContentToStage: (...args: unknown[]) => mockStopSharing(...args) },
}));

const mockLiveShareState = vi.hoisted(() => ({
  participants: {} as Record<string, { displayName: string; categoryName: string; costPerHour: number; active: boolean }>,
  totalCostPerHour: 0,
  meetingStartMs: FIXED_START,
  isReady: true,
  upsertParticipant: vi.fn(),
  liveShareError: null as string | null,
}));

vi.mock("../hooks/useMeetingState", () => ({
  useMeetingState: () => mockLiveShareState,
}));

// --- Tests ---

describe("MeetingStage", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(FIXED_START);
    mockStopSharing.mockClear();
    mockLiveShareState.participants = {};
    mockLiveShareState.totalCostPerHour = 0;
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

  it("accumulated cost grows over time with active participants", () => {
    mockLiveShareState.participants = {
      u1: { displayName: "Alice", categoryName: "Director", costPerHour: 90, active: true },
    };
    mockLiveShareState.totalCostPerHour = 90;
    render(<MeetingStage />);
    act(() => { vi.advanceTimersByTime(3_600_000); });
    expect(screen.getByText(/90\.00 €/)).toBeInTheDocument();
  });

  it("renders the stop sharing button", () => {
    render(<MeetingStage />);
    expect(screen.getByRole("button", { name: /dejar de compartir/i })).toBeInTheDocument();
  });

  it("clicking stop sharing calls stopSharingAppContentToStage", () => {
    render(<MeetingStage />);
    fireEvent.click(screen.getByRole("button", { name: /dejar de compartir/i }));
    expect(mockStopSharing).toHaveBeenCalled();
  });
});
