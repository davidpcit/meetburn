import { useEffect, useState } from "react";
import { authentication } from "@microsoft/teams-js";
import { mapJobTitleToCategory } from "../utils/mapJobTitleToCategory";

export function useJobTitle() {
  const [suggestedCategory, setSuggestedCategory] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const ssoToken = await authentication.getAuthToken();
        const res = await fetch("/api/me", {
          headers: { Authorization: `Bearer ${ssoToken}` },
        });
        if (!res.ok) return;
        const { jobTitle } = await res.json() as { jobTitle: string | null };
        if (jobTitle) setSuggestedCategory(mapJobTitleToCategory(jobTitle));
      } catch {
        // Silent fallback — user selects manually
      }
    })();
  }, []);

  return { suggestedCategory };
}
