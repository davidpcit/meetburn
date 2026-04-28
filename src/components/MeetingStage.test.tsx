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

function setSearchParams(params: Record<string, string | number>) {
  const search = "?" + Object.entries(params).map(([k, v]) => `${k}=${v}`).join("&");
  Object.defineProperty(window, "location", {
    value: { ...window.location, search },
    writable: true,
    configurable: true,
  });
}

// --- Tests ---

describe("MeetingStage — URL param driven", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(FIXED_START);
    mockStopSharing.mockClear();
    // Default: no URL params
    setSearchParams({});
  });

  afterEach(() => {
    vi.useRealTimers();
    setSearchParams({});
  });

  it("renders the app title", () => {
    render(<MeetingStage />);
    expect(screen.getByText(/meetburn/i)).toBeInTheDocument();
  });

  it("shows 00:00:00 when start equals current time", () => {
    setSearchParams({ rate: 90, start: FIXED_START, count: 2 });
    render(<MeetingStage />);
    expect(screen.getByText("00:00:00")).toBeInTheDocument();
  });

  it("timer advances each second", () => {
    setSearchParams({ rate: 90, start: FIXED_START, count: 1 });
    render(<MeetingStage />);
    act(() => { vi.advanceTimersByTime(1000); });
    expect(screen.getByText("00:00:01")).toBeInTheDocument();
    act(() => { vi.advanceTimersByTime(59000); });
    expect(screen.getByText("00:01:00")).toBeInTheDocument();
  });

  it("shows 0.00 € accumulated cost when no time has passed", () => {
    setSearchParams({ rate: 90, start: FIXED_START, count: 1 });
    render(<MeetingStage />);
    expect(screen.getByText(/0\.00 €/)).toBeInTheDocument();
  });

  it("accumulated cost grows over time based on rate param", () => {
    setSearchParams({ rate: 90, start: FIXED_START, count: 1 });
    render(<MeetingStage />);
    act(() => { vi.advanceTimersByTime(3_600_000); });
    expect(screen.getByText(/90\.00 €/)).toBeInTheDocument();
  });

  it("displays rate param as €/h", () => {
    setSearchParams({ rate: 155, start: FIXED_START, count: 2 });
    render(<MeetingStage />);
    expect(screen.getByText(/155/)).toBeInTheDocument();
  });

  it("displays participant count from count param", () => {
    setSearchParams({ rate: 90, start: FIXED_START, count: 3 });
    render(<MeetingStage />);
    expect(screen.getByText(/3 participantes/i)).toBeInTheDocument();
  });

  it("defaults to rate=0 when rate param is missing", () => {
    setSearchParams({ start: FIXED_START, count: 1 });
    render(<MeetingStage />);
    act(() => { vi.advanceTimersByTime(3_600_000); });
    expect(screen.getByText(/0\.00 €/)).toBeInTheDocument();
  });

  it("defaults start to Date.now() when start param is missing (timer shows ~0s)", () => {
    setSearchParams({ rate: 90, count: 1 });
    render(<MeetingStage />);
    expect(screen.getByText("00:00:00")).toBeInTheDocument();
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

  it("does not render participant table rows", () => {
    setSearchParams({ rate: 90, start: FIXED_START, count: 2 });
    render(<MeetingStage />);
    expect(screen.queryByText(/esperando participantes/i)).not.toBeInTheDocument();
  });
});
