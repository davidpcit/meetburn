import { useState, useEffect, useRef, useCallback } from "react";
import { app } from "@microsoft/teams-js";
import type { ParticipantData } from "../types";

interface MeetingSnapshot {
  participants: Record<string, ParticipantData>;
  meetingStartMs: number;
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
  const [meetingStartMs, setMeetingStartMs] = useState(0);

  const channelRef = useRef<BroadcastChannel | null>(null);
  const channelKeyRef = useRef<string>("meetburn-default");
  const participantsRef = useRef<Record<string, ParticipantData>>({});
  const meetingStartMsRef = useRef(0);

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
        const snapshot = e.data as MeetingSnapshot;
        if (snapshot?.participants) {
          participantsRef.current = snapshot.participants;
          setParticipants(snapshot.participants);
        }
        if (snapshot?.meetingStartMs !== undefined) {
          meetingStartMsRef.current = snapshot.meetingStartMs;
          setMeetingStartMs(snapshot.meetingStartMs);
        }
      };
      channelRef.current = bc;

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
