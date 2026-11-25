"use client";

import { useEffect } from "react";
import { recordFunnelEvent, type BrowserFunnelEvent } from "../../lib/analytics/demo-funnel";

export function FunnelMark({ kind }: { kind: BrowserFunnelEvent }) {
  useEffect(() => { recordFunnelEvent(kind); }, [kind]);
  return null;
}
