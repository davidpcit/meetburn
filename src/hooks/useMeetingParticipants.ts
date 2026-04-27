import { useEffect, useState } from "react";
import { meeting } from "@microsoft/teams-js";

export interface TeamsParticipant {
  aadObjectId: string;
  displayName: string;
}

const POLL_INTERVAL_MS = 15_000;

function fetchParticipants(): Promise<TeamsParticipant[]> {
  return new Promise((resolve) => {
    // getParticipants exists at runtime in Teams but is not typed in SDK v2 types
    (meeting as unknown as { getParticipants: (cb: (err: unknown, info: unknown) => void) => void })
      .getParticipants((err, info) => {
        const typed = info as { participants?: TeamsParticipant[] } | null;
        if (err || !typed?.participants) { resolve([]); return; }
        resolve(typed.participants.filter((p) => p.aadObjectId));
      });
  });
}

export function useMeetingParticipants() {
  const [participants, setParticipants] = useState<TeamsParticipant[]>([]);

  useEffect(() => {
    let alive = true;

    const poll = async () => {
      const list = await fetchParticipants();
      if (alive) setParticipants(list);
    };

    poll();
    const id = setInterval(poll, POLL_INTERVAL_MS);
    return () => { alive = false; clearInterval(id); };
  }, []);

  return participants;
}
