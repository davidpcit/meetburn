import { useEffect, useId, useState } from "react";
import { app, authentication, meeting } from "@microsoft/teams-js";
import { CATEGORIES } from "../types";
import { useMeetingState } from "../hooks/useMeetingState";
import { useMeetingParticipants } from "../hooks/useMeetingParticipants";

const DEFAULT_CATEGORY = CATEGORIES.find((c) => c.name === "Project Manager")!;

export function SidePanel() {
  const instanceId = useId();
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [currentUserDisplayName, setCurrentUserDisplayName] = useState<string>("");
  const { upsertParticipant, participants, totalCostPerHour, meetingStartMs, isReady } = useMeetingState();
  const teamsParticipants = useMeetingParticipants();
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    app.getContext()
      .then(async (ctx) => {
        const u = ctx.user as { id?: string; displayName?: string; loginHint?: string; userPrincipalName?: string } | undefined;
        const id = u?.id ?? `anon-${instanceId}`;
        setCurrentUserId(id);
        const nameFromCtx = u?.displayName || u?.loginHint || u?.userPrincipalName || "";
        if (nameFromCtx) { setCurrentUserDisplayName(nameFromCtx); return; }

        try {
          const token = await authentication.getAuthToken();
          const payload = JSON.parse(atob(token.split(".")[1]));
          const nameFromToken = payload.name || payload.preferred_username || "";
          if (nameFromToken) setCurrentUserDisplayName(nameFromToken);
        } catch {
          // no name source available
        }
      })
      .catch(() => setCurrentUserId(`anon-${instanceId}`));
  }, [instanceId]);

  // Self-registration: ensures current user appears in the list even when alone.
  // Also updates the displayName when it resolves after the initial registration (race condition fix).
  useEffect(() => {
    if (!isReady || !currentUserId) return;
    const existing = participants[currentUserId];
    if (!existing) {
      upsertParticipant(currentUserId, {
        displayName: currentUserDisplayName || currentUserId,
        categoryName: DEFAULT_CATEGORY.name,
        costPerHour: DEFAULT_CATEGORY.costPerHour,
        active: true,
      });
    } else if (currentUserDisplayName && existing.displayName === currentUserId) {
      // Name arrived after initial registration replaced the GUID fallback
      upsertParticipant(currentUserId, { ...existing, displayName: currentUserDisplayName });
    }
  }, [isReady, currentUserId, currentUserDisplayName, participants]);  // eslint-disable-line react-hooks/exhaustive-deps

  // Sync Teams participant list → SharedMap
  useEffect(() => {
    if (!isReady || teamsParticipants.length === 0) return;
    const currentIds = new Set(teamsParticipants.map((p) => p.aadObjectId));

    // Add new participants with default category (don't overwrite existing)
    teamsParticipants.forEach((tp) => {
      if (!participants[tp.aadObjectId]) {
        upsertParticipant(tp.aadObjectId, {
          displayName: tp.displayName,
          categoryName: DEFAULT_CATEGORY.name,
          costPerHour: DEFAULT_CATEGORY.costPerHour,
          active: true,
        });
      } else if (!participants[tp.aadObjectId].active) {
        // Reconnected — restore active
        upsertParticipant(tp.aadObjectId, { ...participants[tp.aadObjectId], displayName: tp.displayName, active: true });
      } else if (tp.displayName && participants[tp.aadObjectId].displayName === tp.aadObjectId) {
        // Real name became available to replace GUID fallback
        upsertParticipant(tp.aadObjectId, { ...participants[tp.aadObjectId], displayName: tp.displayName });
      }
    });

    // Mark departed participants inactive
    Object.entries(participants).forEach(([id, p]) => {
      if (p.active && !currentIds.has(id)) {
        upsertParticipant(id, { ...p, active: false });
      }
    });
  }, [teamsParticipants, isReady]);  // eslint-disable-line react-hooks/exhaustive-deps

  const handleCategoryChange = (userId: string, categoryName: string) => {
    const cat = CATEGORIES.find((c) => c.name === categoryName);
    if (!cat || !participants[userId]) return;
    upsertParticipant(userId, { ...participants[userId], categoryName: cat.name, costPerHour: cat.costPerHour });
  };

  const handleShareToStage = () => {
    meeting.shareAppContentToStage(
      (err) => { if (err) console.error("[MeetBurn] shareToStage:", err); },
      `${window.location.origin}/index.html?view=stage`
    );
  };

  const activeCount = Object.values(participants).filter((p) => p.active).length;
  const accumulatedCost = totalCostPerHour * Math.max(0, (nowMs - meetingStartMs) / 3_600_000);

  return (
    <div className="side-panel">
      <header className="sp-header">
        <span className="sp-logo">🔥</span>
        <h1 className="sp-title">MeetBurn <span style={{ fontSize: "0.6rem", opacity: 0.5, fontWeight: "normal" }}>v{__APP_VERSION__}</span></h1>
      </header>

      <section className="sp-participant-list">
        <p className="sp-label">Selecciona tu categoría:</p>
        {Object.entries(participants).length === 0 && (
          <p className="sp-empty">Esperando participantes…</p>
        )}
        {Object.entries(participants).map(([id, p]) => (
          <div key={id} className={`sp-participant-row${p.active ? "" : " inactive"}`}>
            <span className="sp-participant-name">
              {p.displayName}
              {id === currentUserId && <span className="sp-you"> (tú)</span>}
              {!p.active && <span className="sp-disconnected"> · desconectado</span>}
            </span>
            <select
              className="sp-category-select"
              value={p.categoryName}
              disabled={!p.active}
              onChange={(e) => handleCategoryChange(id, e.target.value)}
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.name} value={cat.name}>{cat.name} — {cat.costPerHour}€/h</option>
              ))}
            </select>
          </div>
        ))}
      </section>

      <section className="sp-summary">
        <div className="sp-stat">
          <span className="sp-stat-label">Participantes</span>
          <span className="sp-stat-value">{activeCount}</span>
        </div>
        <div className="sp-stat sp-stat-main">
          <span className="sp-stat-label">Coste total</span>
          <span className="sp-stat-value">{totalCostPerHour} €/h</span>
        </div>
      </section>

      <section className="sp-accumulated">
        <span className="sp-stat-label">Coste acumulado</span>
        <span className="sp-accumulated-value">{accumulatedCost.toFixed(2)} €</span>
      </section>

      <button className="share-btn" onClick={handleShareToStage} disabled={activeCount === 0}>
        Proyectar en pantalla compartida →
      </button>

      {!isReady && (
        <p className="sp-status"><span className="sp-dot" /> Cargando…</p>
      )}
    </div>
  );
}
