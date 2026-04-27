import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { SidePanel } from "./SidePanel";
import { CATEGORIES } from "../types";

// --- Mocks ---

const mockUpsertParticipant = vi.fn();
const mockMeetingStartMs = Date.now() - 60_000;

const mockLiveShare = {
  upsertParticipant: mockUpsertParticipant,
  participants: {} as Record<string, { displayName: string; categoryName: string; costPerHour: number }>,
  totalCostPerHour: 0,
  meetingStartMs: mockMeetingStartMs,
  isReady: true,
  liveShareError: null,
};

vi.mock("../hooks/useLiveShare", () => ({
  useLiveShare: () => mockLiveShare,
}));

vi.mock("../hooks/useJobTitle", () => ({
  useJobTitle: () => ({ suggestedCategory: null }),
}));

vi.mock("@microsoft/teams-js", () => ({
  app: {
    getContext: vi.fn().mockResolvedValue({
      user: { id: "test-user-id", displayName: "Test User" },
    }),
  },
  meeting: { shareAppContentToStage: vi.fn() },
  authentication: { getAuthToken: vi.fn().mockRejectedValue(new Error("not in Teams")) },
}));

// --- Tests ---

describe("SidePanel", () => {
  beforeEach(() => {
    mockUpsertParticipant.mockClear();
    mockLiveShare.participants = {};
  });

  it("renders all category buttons", () => {
    render(<SidePanel />);
    CATEGORIES.forEach((cat) => {
      expect(screen.getByText(cat.name)).toBeInTheDocument();
    });
  });

  it("renders each category's cost", () => {
    render(<SidePanel />);
    CATEGORIES.forEach((cat) => {
      expect(screen.getByText(`${cat.costPerHour} €/h`)).toBeInTheDocument();
    });
  });

  it("clicking a category marks it active", () => {
    render(<SidePanel />);
    const btn = screen.getByText("Project Manager").closest("button")!;
    fireEvent.click(btn);
    expect(btn).toHaveClass("active");
  });

  it("only one category can be active at a time", () => {
    render(<SidePanel />);
    const first = screen.getByText("Analista Junior").closest("button")!;
    const second = screen.getByText("Director").closest("button")!;
    fireEvent.click(first);
    fireEvent.click(second);
    expect(first).not.toHaveClass("active");
    expect(second).toHaveClass("active");
  });

  it("share button is disabled when no participants", () => {
    render(<SidePanel />);
    expect(screen.getByRole("button", { name: /proyectar/i })).toBeDisabled();
  });

  it("shows accumulated cost label", () => {
    render(<SidePanel />);
    expect(screen.getByText("Coste acumulado")).toBeInTheDocument();
  });

  it("accumulated cost shows 0.00 € when no participants", () => {
    render(<SidePanel />);
    expect(screen.getByText("0.00 €")).toBeInTheDocument();
  });

  it("restores selected category from SharedMap on reconnect without writing to SharedMap", async () => {
    mockLiveShare.participants = {
      "test-user-id": { displayName: "Test User", categoryName: "Director", costPerHour: 90 },
    };
    await act(async () => { render(<SidePanel />); });
    const btn = screen.getByText("Director").closest("button")!;
    expect(btn).toHaveClass("active");
    expect(mockUpsertParticipant).not.toHaveBeenCalled();
  });

  it("upsertParticipant is called with real displayName after getContext resolves", async () => {
    await act(async () => { render(<SidePanel />); });
    const btn = screen.getByText("Director").closest("button")!;
    await act(async () => { fireEvent.click(btn); });
    expect(mockUpsertParticipant).toHaveBeenCalledWith(
      "test-user-id",
      expect.objectContaining({ displayName: "Test User" })
    );
  });
});
