import { useState } from "react";
import type { ParticipantData } from "../types";

interface Props {
  participants: Record<string, ParticipantData>;
  meetingStartMs: number;
  nowMs: number;
  totalCost: number;
}

export function DebugPanel({ participants, meetingStartMs, nowMs, totalCost }: Props) {
  const [open, setOpen] = useState(true);
  const elapsedHours = Math.max(0, (nowMs - meetingStartMs) / 3_600_000);
  const time = new Date(nowMs).toLocaleTimeString();

  return (
    <div style={{ background: "#0d0d1a", border: "1px solid #444", borderRadius: 6, padding: "8px 10px", fontSize: "0.7rem", fontFamily: "monospace", color: "#ccc", marginTop: 8 }}>
      <button onClick={() => setOpen(o => !o)} style={{ background: "none", border: "none", color: "#888", cursor: "pointer", fontSize: "0.7rem", padding: 0, marginBottom: open ? 6 : 0 }}>
        [{open ? "−" : "+"}] DEBUG — coste acumulado
      </button>
      {open && (
        <>
          {Object.entries(participants).map(([id, p]) => {
            const subtotal = p.active ? p.costPerHour * elapsedHours : 0;
            return (
              <div key={id} style={{ color: p.active ? "#a0f0a0" : "#666", marginBottom: 2 }}>
                [{time}] {p.displayName} — {p.categoryName} ({p.costPerHour}€/h) × {elapsedHours.toFixed(4)}h = {subtotal.toFixed(4)}€ {p.active ? "✓" : "· desconectado"}
              </div>
            );
          })}
          <div style={{ borderTop: "1px solid #333", marginTop: 4, paddingTop: 4, color: "#ff6b35" }}>
            Total acumulado: {totalCost.toFixed(4)} €
          </div>
        </>
      )}
    </div>
  );
}
