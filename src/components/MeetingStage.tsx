import { useEffect, useState } from "react";
import { app, meeting } from "@microsoft/teams-js";

function formatHMS(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600).toString().padStart(2, "0");
  const m = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, "0");
  const s = (totalSeconds % 60).toString().padStart(2, "0");
  return `${h}:${m}:${s}`;
}

function readStageParams(): { rate: number; start: number; count: number } {
  const params = new URLSearchParams(window.location.search);
  const rate = parseFloat(params.get("rate") ?? "0") || 0;
  const startRaw = parseInt(params.get("start") ?? "0", 10);
  const start = startRaw > 0 ? startRaw : Date.now();
  const count = parseInt(params.get("count") ?? "0", 10) || 0;
  return { rate, start, count };
}

export function MeetingStage() {
  const { rate, start, count } = readStageParams();
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    app.initialize().catch(() => {});
    const id = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const elapsedMs = nowMs - start;
  const elapsedSec = Math.max(0, Math.floor(elapsedMs / 1000));
  const elapsedHours = Math.max(0, elapsedMs / 3_600_000);
  const totalCost = rate * elapsedHours;

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
          <div className="stage-rate">{rate} €/h</div>
          <div className="stage-rate-label">
            {count} participante{count !== 1 ? "s" : ""}
          </div>
        </div>
      </main>

      <button
        className="stage-stop-btn"
        onClick={handleStopSharing}
      >
        Dejar de compartir
      </button>
    </div>
  );
}
