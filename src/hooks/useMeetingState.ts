import { useState, useEffect, useRef, useCallback } from "react";
import { app } from "@microsoft/teams-js";
import type { ParticipantData } from "../types";

interface MeetingSnapshot {
  participants: Record<string, ParticipantData>;
  meetingStartMs: number;
}

interface SyncRequest {
  type: "requestSync";
}

interface MeetingState {
  participants: Record<string, ParticipantData>;
  totalCostPerHour: number;
  meetingStartMs: number;
  isReady: boolean;
  liveShareError: null;
  upsertParticipant: (userId: string, data: ParticipantData) => void;
}

export function useMeetingState(): MeetingState {
  const [isReady, setIsReady] = useState(false);
  const [participants, setParticipants] = useState<Record<string, ParticipantData>>({});
  // Initialize to Date.now() so timer never shows epoch-based garbage before context resolves
  const [meetingStartMs, setMeetingStartMs] = useState(() => Date.now());

  const channelRef = useRef<BroadcastChannel | null>(null);
  const channelKeyRef = useRef<string>("meetburn-default");
  const participantsRef = useRef<Record<string, ParticipantData>>({});
  const meetingStartMsRef = useRef(Date.now());

  useEffect(() => {
    app.getContext().then((ctx) => {
      const meetingId = ctx.meeting?.id ?? "default";
      const key = `meetburn-${meetingId}`;
      channelKeyRef.current = key;

      const now = Date.now();
      const saved = localStorage.getItem(key);
      if (saved) {
        try {
          const snapshot: MeetingSnapshot = JSON.parse(saved);
          participantsRef.current = snapshot.participants ?? {};
          const startMs = snapshot.meetingStartMs > 0 ? snapshot.meetingStartMs : now;
          meetingStartMsRef.current = startMs;
          setParticipants(snapshot.participants ?? {});
          setMeetingStartMs(startMs);
        } catch {
          // ignore corrupt data
        }
      } else {
        meetingStartMsRef.current = now;
        setMeetingStartMs(now);
      }

      const bc = new BroadcastChannel(key);
      bc.onmessage = (e: { data: unknown }) => {
        const msg = e.data as MeetingSnapshot | SyncRequest;

        // Another instance loaded and is requesting current state
        if ((msg as SyncRequest)?.type === "requestSync") {
          if (Object.keys(participantsRef.current).length > 0) {
            bc.postMessage({
              participants: participantsRef.current,
              meetingStartMs: meetingStartMsRef.current,
            } satisfies MeetingSnapshot);
          }
          return;
        }

        const snapshot = msg as MeetingSnapshot;
        if (snapshot?.participants) {
          participantsRef.current = snapshot.participants;
          setParticipants(snapshot.participants);
        }
        if (snapshot?.meetingStartMs && snapshot.meetingStartMs > 0) {
          meetingStartMsRef.current = snapshot.meetingStartMs;
          setMeetingStartMs(snapshot.meetingStartMs);
        }
      };
      channelRef.current = bc;

      // Ask any already-running instance (side panel) to broadcast its state
      bc.postMessage({ type: "requestSync" } satisfies SyncRequest);

      setIsReady(true);
    });

    return () => {
      channelRef.current?.close();
    };
  }, []);

  const upsertParticipant = useCallback((userId: string, data: ParticipantData) => {
    const next = { ...participantsRef.current, [userId]: data };
    participantsRef.current = next;
    setParticipants(next);

    const snapshot: MeetingSnapshot = {
      participants: next,
      meetingStartMs: meetingStartMsRef.current,
    };
    localStorage.setItem(channelKeyRef.current, JSON.stringify(snapshot));
    channelRef.current?.postMessage(snapshot);
  }, []);

  const totalCostPerHour = Object.values(participants)
    .filter((p) => p.active)
    .reduce((sum, p) => sum + p.costPerHour, 0);

  return {
    participants,
    totalCostPerHour,
    meetingStartMs,
    isReady,
    liveShareError: null,
    upsertParticipant,
  };
}
