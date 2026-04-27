import type { VercelRequest, VercelResponse } from "@vercel/node";

const GRAPH_ME_URL = "https://graph.microsoft.com/v1.0/me?$select=jobTitle";

async function exchangeForGraphToken(ssoToken: string): Promise<string> {
  const { AZURE_TENANT_ID, AZURE_CLIENT_ID, AZURE_CLIENT_SECRET } = process.env;
  if (!AZURE_TENANT_ID || !AZURE_CLIENT_ID || !AZURE_CLIENT_SECRET) {
    throw new Error("Missing Azure AD environment variables");
  }

  const body = new URLSearchParams({
    grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
    client_id: AZURE_CLIENT_ID,
    client_secret: AZURE_CLIENT_SECRET,
    assertion: ssoToken,
    scope: "https://graph.microsoft.com/User.Read offline_access",
    requested_token_use: "on_behalf_of",
  });

  const res = await fetch(
    `https://login.microsoftonline.com/${AZURE_TENANT_ID}/oauth2/v2.0/token`,
    { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body }
  );

  const data = await res.json() as Record<string, unknown>;
  if (!res.ok) throw new Error(String(data.error_description ?? data.error));
  return data.access_token as string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") return res.status(405).end();

  const auth = req.headers.authorization ?? "";
  const ssoToken = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!ssoToken) return res.status(401).json({ error: "Missing token" });

  try {
    const graphToken = await exchangeForGraphToken(ssoToken);
    const graphRes = await fetch(GRAPH_ME_URL, {
      headers: { Authorization: `Bearer ${graphToken}` },
    });
    const me = await graphRes.json() as Record<string, unknown>;
    res.json({ jobTitle: me.jobTitle ?? null });
  } catch {
    res.status(500).json({ jobTitle: null });
  }
}
