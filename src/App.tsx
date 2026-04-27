import { useEffect, useState } from "react";
import { app } from "@microsoft/teams-js";
import { Config } from "./components/Config";
import { SidePanel } from "./components/SidePanel";
import { MeetingStage } from "./components/MeetingStage";
import "./App.css";

type View = "loading" | "config" | "sidePanel" | "stage";

function getViewFromQuery(): View | null {
  const v = new URLSearchParams(window.location.search).get("view");
  if (v === "config" || v === "sidePanel" || v === "stage") return v;
  return null;
}

export function App() {
  const [view, setView] = useState<View>("loading");

  useEffect(() => {
    const fromQuery = getViewFromQuery();
    if (fromQuery) {
      setView(fromQuery);
      return;
    }

    app
      .initialize()
      .then(() => app.getContext())
      .then((ctx) => {
        const frame = ctx.page?.frameContext;
        if (frame === "meetingStage") setView("stage");
        else setView("sidePanel");
      })
      .catch(() => {
        // Outside Teams — default to sidePanel for dev
        setView("sidePanel");
      });
  }, []);

  if (view === "loading") return <div className="loading">Cargando…</div>;
  if (view === "config") return <Config />;
  if (view === "stage") return <MeetingStage />;
  return <SidePanel />;
}
