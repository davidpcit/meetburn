import { useEffect, useId, useRef, useState } from "react";
import { app, meeting } from "@microsoft/teams-js";
import { CATEGORIES } from "../types";
import { useLiveShare } from "../hooks/useLiveShare";
import { useJobTitle } from "../hooks/useJobTitle";

export function SidePanel() {
  const instanceId = useId();
  const [userId, setUserId] = useState<string>("");
  const [displayName, setDisplayName] = useState<string>("");
  const [selected, setSelected] = useState<string>("");
  const { upsertParticipant, participants, totalCostPerHour, meetingStartMs, isReady, liveShareError } = useLiveShare();
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const accumulatedCost = totalCostPerHour * Math.max(0, (nowMs - meetingStartMs) / 3_600_000);
  const { suggestedCategory } = useJobTitle();

  useEffect(() => {
    app
      .getContext()
      .then((ctx) => {
        setUserId(ctx.user?.id ?? `anon-${instanceId}`);
        setDisplayName(ctx.user?.displayName || ctx.user?.userPrincipalName || "");
      })
      .catch(() => {
        setUserId(`anon-${instanceId}`);
        setDisplayName("Participante Local");
      });
  }, [instanceId]);

  const restoredRef = useRef(false);

  // Restore selected category from SharedMap on reconnect (read-only)
  useEffect(() => {
    if (!isReady || !userId || selected) return;
    const existing = participants[userId];
    if (existing?.categoryName) {
      restoredRef.current = true;
      setSelected(existing.categoryName);
    }
  }, [isReady, userId, participants, selected]);

  // Re-sync displayName to SharedMap when it resolves after selection (skip if restored)
  useEffect(() => {
    if (!displayName || !selected || !userId || !isReady) return;
    if (restoredRef.current) { restoredRef.current = false; return; }
    const cat = CATEGORIES.find((c) => c.name === selected);
    if (cat) upsertParticipant(userId, { displayName, categoryName: cat.name, costPerHour: cat.costPerHour });
  }, [displayName, selected, userId, isReady, upsertParticipant]);

  // Auto-select when suggestion arrives and nothing is selected yet
  useEffect(() => {
    if (suggestedCategory && !selected && userId && isReady) {
      const cat = CATEGORIES.find((c) => c.name === suggestedCategory);
      if (cat) {
        setSelected(cat.name);
        upsertParticipant(userId, {
          displayName: displayName || "Participante",
          categoryName: cat.name,
          costPerHour: cat.costPerHour,
        });
      }
    }
  }, [suggestedCategory, selected, userId, isReady, displayName, upsertParticipant]);

  const handleSelect = (name: string, cost: number) => {
    setSelected(name);
    if (userId && isReady) {
      upsertParticipant(userId, {
        displayName: displayName || "Participante",
        categoryName: name,
        costPerHour: cost,
      });
    }
  };

  const handleShareToStage = () => {
    meeting.shareAppContentToStage(
      (err) => { if (err) console.error("[MeetBurn] shareToStage:", err); },
      `${window.location.origin}/index.html?view=stage`
    );
  };

  const participantCount = Object.keys(participants).length;

  return (
    <div className="side-panel">
      <header className="sp-header">
        <span className="sp-logo">🔥</span>
        <div>
          <h1 className="sp-title">MeetBurn <span style={{ fontSize: "0.6rem", opacity: 0.5, fontWeight: "normal" }}>v{__APP_VERSION__}</span></h1>
          {displayName && <p className="sp-user">Hola, <strong>{displayName}</strong></p>}
        </div>
      </header>

      <section className="sp-section">
        <p className="sp-label">Selecciona tu categoría:</p>
        <div className="sp-categories">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.name}
              className={`cat-btn${selected === cat.name ? " active" : ""}`}
              onClick={() => handleSelect(cat.name, cat.costPerHour)}
            >
              <span className="cat-name">
                {cat.name}
                {suggestedCategory === cat.name && selected !== cat.name && (
                  <span style={{ fontSize: "0.6rem", marginLeft: "0.4rem", opacity: 0.7 }}>← tu cargo</span>
                )}
              </span>
              <span className="cat-cost">{cat.costPerHour} €/h</span>
            </button>
          ))}
        </div>
      </section>

      <section className="sp-summary">
        <div className="sp-stat">
          <span className="sp-stat-label">Participantes</span>
          <span className="sp-stat-value">{participantCount}</span>
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

      <button
        className="share-btn"
        onClick={handleShareToStage}
        disabled={participantCount === 0}
      >
        Proyectar en pantalla compartida →
      </button>

      {!isReady && !liveShareError && (
        <p className="sp-status">
          <span className="sp-dot" /> Conectando a Live Share…
        </p>
      )}
      {liveShareError && (
        <p className="sp-status sp-error" style={{ color: "#ff6b6b", fontSize: "0.75rem", wordBreak: "break-word" }}>
          ⚠️ {liveShareError}
        </p>
      )}
    </div>
  );
}
