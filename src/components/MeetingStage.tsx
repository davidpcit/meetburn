import { useEffect, useState } from "react";
import { app, meeting } from "@microsoft/teams-js";
import { useMeetingState } from "../hooks/useMeetingState";

function formatHMS(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600).toString().padStart(2, "0");
  const m = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, "0");
  const s = (totalSeconds % 60).toString().padStart(2, "0");
  return `${h}:${m}:${s}`;
}

export function MeetingStage() {
  const { participants, meetingStartMs, isReady } = useMeetingState();
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    app.initialize().catch(() => {});
    const id = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const elapsedMs = nowMs - meetingStartMs;
  const elapsedSec = Math.max(0, Math.floor(elapsedMs / 1000));
  const elapsedHours = Math.max(0, elapsedMs / 3_600_000);

  const activeEntries = Object.entries(participants).filter(([, p]) => p.active);
  const activeCostPerHour = activeEntries.reduce((sum, [, p]) => sum + p.costPerHour, 0);
  const totalCost = activeCostPerHour * elapsedHours;
  const allEntries = Object.entries(participants);

  const handleStopSharing = () => {
    (meeting as unknown as { stopSharingAppContentToStage: (cb: (err: unknown) => void) => void })
      .stopSharingAppContentToStage((err) => { if (err) console.error("[MeetBurn] stopSharing:", err); });
  };

  return (
    <div className="stage">
      <div className="stage-bg-glow" />

      <header className="stage-header">
        <span className="stage-logo">🔥</span>
        <h1 className="stage-title">MeetBurn <span style={{ fontSize: "0.5em", opacity: 0.4, fontWeight: "normal" }}>v{__APP_VERSION__}</span></h1>
        <div className="stage-timer">{formatHMS(elapsedSec)}</div>
      </header>

      <main className="stage-main">
        <div className="stage-cost-block">
          <div className="stage-cost-total">{totalCost.toFixed(2)} €</div>
          <div className="stage-cost-label">coste acumulado</div>
        </div>

        <div className="stage-divider" />

        <div className="stage-rate-block">
          <div className="stage-rate">{activeCostPerHour} €/h</div>
          <div className="stage-rate-label">
            {activeEntries.length} participante{activeEntries.length !== 1 ? "s" : ""}
          </div>
        </div>
      </main>

      <section className="stage-table">
        <div className="stage-table-head">
          <span>Participante</span>
          <span>Categoría</span>
          <span>€/h</span>
        </div>
        {allEntries.map(([id, p]) => (
          <div key={id} className={`stage-table-row${p.active ? "" : " row-inactive"}`}>
            <span className="row-name">{p.displayName}{!p.active && <span style={{ opacity: 0.5 }}> · desconectado</span>}</span>
            <span className="row-cat">{p.categoryName}</span>
            <span className="row-cost">{p.active ? p.costPerHour : "—"}</span>
          </div>
        ))}
        {allEntries.length === 0 && (
          <div className="stage-empty">Esperando participantes…</div>
        )}
      </section>

      <button
        className="stage-stop-btn"
        onClick={handleStopSharing}
      >
        Dejar de compartir
      </button>

      {!isReady && (
        <div className="stage-connecting">Cargando…</div>
      )}
    </div>
  );
}
