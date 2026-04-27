import { useEffect, useRef, useState, useCallback } from "react";
import { LiveShareClient, TestLiveShareHost } from "@microsoft/live-share";
import { SharedMap } from "fluid-framework";
import { app, LiveShareHost } from "@microsoft/teams-js";
import type { ParticipantData } from "../types";

const SCHEMA = {
  initialObjects: {
    participantsMap: SharedMap,
    metaMap: SharedMap,
  },
};

const MEETING_START_KEY = "meetingStart";

export function useLiveShare() {
  const [participants, setParticipants] = useState<Record<string, ParticipantData>>({});
  const [meetingStartMs, setMeetingStartMs] = useState<number>(() => Date.now());
  const [isReady, setIsReady] = useState(false);
  const [liveShareError, setLiveShareError] = useState<string | null>(null);
  const participantsMapRef = useRef<SharedMap | null>(null);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        let client: LiveShareClient;
        let usingTeams = false;
        try {
          await app.initialize();
          client = new LiveShareClient(LiveShareHost.create());
          usingTeams = true;
        } catch {
          // Not running inside Teams — use in-memory host for local dev
          client = new LiveShareClient(TestLiveShareHost.create());
        }

        const joinPromise = client.joinContainer(SCHEMA as Parameters<typeof client.joinContainer>[0]);
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error(`joinContainer timed out after 15s (Teams host: ${usingTeams})`)), 15000)
        );

        const { container } = await Promise.race([joinPromise, timeoutPromise]);
        if (!alive) return;

        const participantsMap = container.initialObjects.participantsMap as SharedMap;
        const metaMap = container.initialObjects.metaMap as SharedMap;
        participantsMapRef.current = participantsMap;

        // First participant to connect sets the meeting start time
        if (!metaMap.has(MEETING_START_KEY)) {
          metaMap.set(MEETING_START_KEY, Date.now());
        }
        setMeetingStartMs(metaMap.get(MEETING_START_KEY) as number);

        const syncParticipants = () => {
          if (!alive) return;
          const snap: Record<string, ParticipantData> = {};
          participantsMap.forEach((val, key) => {
            snap[key] = val as ParticipantData;
          });
          setParticipants({ ...snap });
        };

        participantsMap.on("valueChanged", syncParticipants);
        metaMap.on("valueChanged", () => {
          const t = metaMap.get(MEETING_START_KEY) as number | undefined;
          if (t && alive) setMeetingStartMs(t);
        });

        syncParticipants();
        setIsReady(true);
      } catch (err) {
        let msg: string;
        try {
          msg = JSON.stringify(err, Object.getOwnPropertyNames(err));
        } catch {
          msg = String(err);
        }
        console.error("[MeetBurn] Live Share init failed:", err);
        if (alive) setLiveShareError(msg);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  const upsertParticipant = useCallback((userId: string, data: ParticipantData) => {
    participantsMapRef.current?.set(userId, data);
  }, []);

  const totalCostPerHour = Object.values(participants).reduce(
    (sum, p) => sum + p.costPerHour,
    0
  );

  return { participants, totalCostPerHour, meetingStartMs, isReady, liveShareError, upsertParticipant };
}
