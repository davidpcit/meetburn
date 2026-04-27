import { useEffect, useState } from "react";
import { app } from "@microsoft/teams-js";
import { useLiveShare } from "../hooks/useLiveShare";

function formatHMS(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600).toString().padStart(2, "0");
  const m = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, "0");
  const s = (totalSeconds % 60).toString().padStart(2, "0");
  return `${h}:${m}:${s}`;
}

export function MeetingStage() {
  const { participants, totalCostPerHour, meetingStartMs, isReady, liveShareError } = useLiveShare();
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    app.initialize().catch(() => {});
    const id = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const elapsedMs = nowMs - meetingStartMs;
  const elapsedSec = Math.max(0, Math.floor(elapsedMs / 1000));
  const elapsedHours = elapsedMs / 3_600_000;
  const totalCost = totalCostPerHour * elapsedHours;

  const entries = Object.entries(participants);

  return (
    <div className="stage">
      <div className="stage-bg-glow" />

      <header className="stage-header">
        <span className="stage-logo">🔥</span>
        <h1 className="stage-title">MeetBurn</h1>
        <div className="stage-timer">{formatHMS(elapsedSec)}</div>
      </header>

      <main className="stage-main">
        <div className="stage-cost-block">
          <div className="stage-cost-total">{totalCost.toFixed(2)} €</div>
          <div className="stage-cost-label">coste acumulado</div>
        </div>

        <div className="stage-divider" />

        <div className="stage-rate-block">
          <div className="stage-rate">{totalCostPerHour} €/h</div>
          <div className="stage-rate-label">
            {entries.length} participante{entries.length !== 1 ? "s" : ""}
          </div>
        </div>
      </main>

      <section className="stage-table">
        <div className="stage-table-head">
          <span>Participante</span>
          <span>Categoría</span>
          <span>€/h</span>
        </div>
        {entries.map(([id, p]) => (
          <div key={id} className="stage-table-row">
            <span className="row-name">{p.displayName}</span>
            <span className="row-cat">{p.categoryName}</span>
            <span className="row-cost">{p.costPerHour}</span>
          </div>
        ))}
        {entries.length === 0 && (
          <div className="stage-empty">Esperando a que los participantes seleccionen su categoría…</div>
        )}
      </section>

      {!isReady && !liveShareError && (
        <div className="stage-connecting">Conectando a Live Share…</div>
      )}
      {liveShareError && (
        <div className="stage-connecting" style={{ color: "#ff6b6b", fontSize: "0.8rem", padding: "0.5rem 1rem" }}>
          ⚠️ {liveShareError}
        </div>
      )}
    </div>
  );
}
