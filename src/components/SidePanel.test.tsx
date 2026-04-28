import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { SidePanel } from "./SidePanel";
import { CATEGORIES } from "../types";

// --- Mocks ---

const mockUpsertParticipant = vi.fn();

const mockLiveShare = vi.hoisted(() => ({
  upsertParticipant: vi.fn(),
  participants: {} as Record<string, { displayName: string; categoryName: string; costPerHour: number; active: boolean }>,
  totalCostPerHour: 0,
  meetingStartMs: Date.now() - 60_000,
  isReady: true,
  liveShareError: null as string | null,
}));

vi.mock("../hooks/useMeetingState", () => ({
  useMeetingState: () => mockLiveShare,
}));

vi.mock("../hooks/useMeetingParticipants", () => ({
  useMeetingParticipants: () => [],
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
  meeting: {
    shareAppContentToStage: vi.fn(),
    stopSharingAppContentToStage: vi.fn(),
  },
  authentication: { getAuthToken: vi.fn().mockRejectedValue(new Error("not in Teams")) },
}));

// --- Tests ---

describe("SidePanel", () => {
  beforeEach(() => {
    mockLiveShare.upsertParticipant = mockUpsertParticipant;
    mockUpsertParticipant.mockClear();
    mockLiveShare.participants = {};
    mockLiveShare.isReady = true;
    mockLiveShare.liveShareError = null;
  });

  it("shows 'Esperando participantes' when no participants", () => {
    render(<SidePanel />);
    expect(screen.getByText(/esperando participantes/i)).toBeInTheDocument();
  });

  it("shows participant row when participant exists in SharedMap", () => {
    mockLiveShare.participants = {
      "u1": { displayName: "Alice", categoryName: "Director", costPerHour: 90, active: true },
    };
    render(<SidePanel />);
    expect(screen.getByText("Alice")).toBeInTheDocument();
  });

  it("labels current user with '(tú)'", async () => {
    mockLiveShare.participants = {
      "test-user-id": { displayName: "Test User", categoryName: "Director", costPerHour: 90, active: true },
    };
    await act(async () => { render(<SidePanel />); });
    expect(screen.getByText("(tú)")).toBeInTheDocument();
  });

  it("shows 'desconectado' for inactive participant", () => {
    mockLiveShare.participants = {
      "u1": { displayName: "Alice", categoryName: "Director", costPerHour: 90, active: false },
    };
    render(<SidePanel />);
    expect(screen.getByText(/desconectado/i)).toBeInTheDocument();
  });

  it("share button is disabled when no active participants", () => {
    render(<SidePanel />);
    expect(screen.getByRole("button", { name: /proyectar/i })).toBeDisabled();
  });

  it("share button is enabled when there are active participants", () => {
    mockLiveShare.participants = {
      "u1": { displayName: "Alice", categoryName: "Director", costPerHour: 90, active: true },
    };
    render(<SidePanel />);
    expect(screen.getByRole("button", { name: /proyectar/i })).not.toBeDisabled();
  });

  it("shows accumulated cost label", () => {
    render(<SidePanel />);
    expect(screen.getByText("Coste acumulado")).toBeInTheDocument();
  });

  it("category dropdown calls upsertParticipant with correct category", async () => {
    const targetCat = CATEGORIES.find((c) => c.name !== "Project Manager")!;
    mockLiveShare.participants = {
      "u1": { displayName: "Alice", categoryName: "Project Manager", costPerHour: 65, active: true },
    };
    render(<SidePanel />);
    const select = screen.getByRole("combobox");
    await act(async () => {
      fireEvent.change(select, { target: { value: targetCat.name } });
    });
    expect(mockUpsertParticipant).toHaveBeenCalledWith(
      "u1",
      expect.objectContaining({ categoryName: targetCat.name, costPerHour: targetCat.costPerHour })
    );
  });

  it("auto-registers current user when alone (isReady=true, not in SharedMap)", async () => {
    await act(async () => { render(<SidePanel />); });
    expect(mockUpsertParticipant).toHaveBeenCalledWith(
      "test-user-id",
      expect.objectContaining({
        displayName: "Test User",
        categoryName: "Project Manager",
        active: true,
      })
    );
  });

  it("does not auto-register current user if already in SharedMap", async () => {
    mockLiveShare.participants = {
      "test-user-id": { displayName: "Test User", categoryName: "Director", costPerHour: 90, active: true },
    };
    await act(async () => { render(<SidePanel />); });
    expect(mockUpsertParticipant).not.toHaveBeenCalled();
  });

  it("handleShareToStage builds URL with rate, start, count params", async () => {
    const { meeting } = await import("@microsoft/teams-js");
    const shareMock = vi.mocked(meeting.shareAppContentToStage);
    shareMock.mockClear();

    mockLiveShare.participants = {
      "u1": { displayName: "Alice", categoryName: "Director", costPerHour: 90, active: true },
      "u2": { displayName: "Bob", categoryName: "C-Level", costPerHour: 130, active: true },
    };
    mockLiveShare.totalCostPerHour = 220;
    mockLiveShare.meetingStartMs = 1714300000000;

    render(<SidePanel />);
    fireEvent.click(screen.getByRole("button", { name: /proyectar/i }));

    expect(shareMock).toHaveBeenCalledOnce();
    const url: string = shareMock.mock.calls[0][1] as string;
    expect(url).toContain("rate=220");
    expect(url).toContain("start=1714300000000");
    expect(url).toContain("count=2");
    expect(url).toContain("view=stage");
  });
});
