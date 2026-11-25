export const browserFunnelEvents = ["visit", "search", "search_empty", "product", "add", "remove", "signin", "slot", "submit"] as const;
export type BrowserFunnelEvent = typeof browserFunnelEvents[number];

const tab = "mi-comercio:visita-demo";
export function demoVisitId() {
  try {
    const saved = sessionStorage.getItem(tab);
    if (saved) return saved;
    const id = crypto.randomUUID();
    sessionStorage.setItem(tab, id);
    return id;
  } catch { return undefined; }
}

export function recordFunnelEvent(kind: BrowserFunnelEvent) {
  const visit = demoVisitId();
  if (!visit) return;
  void fetch("/api/analitica/demo", {
    method: "POST", headers: { "Content-Type": "application/json" }, keepalive: true, body: JSON.stringify({ visit, kind }),
  }).catch(() => {});
}
