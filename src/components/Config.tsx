import { useEffect } from "react";
import { app, pages } from "@microsoft/teams-js";

export function Config() {
  useEffect(() => {
    app.initialize().then(() => {
      pages.config.registerOnSaveHandler((saveEvent) => {
        pages.config.setConfig({
          suggestedDisplayName: "MeetBurn",
          entityId: "meetburn-tab",
          contentUrl: `${window.location.origin}${import.meta.env.BASE_URL}index.html`,
          websiteUrl: `${window.location.origin}${import.meta.env.BASE_URL}`,
        });
        saveEvent.notifySuccess();
      });
      pages.config.setValidityState(true);
    });
  }, []);

  return (
    <div className="config-page">
      <div className="config-logo">🔥</div>
      <h1>MeetBurn</h1>
      <p>Visualiza en tiempo real cuánto está costando esta reunión.</p>
      <p className="config-hint">Pulsa <strong>Guardar</strong> para añadir MeetBurn a la reunión.</p>
    </div>
  );
}
