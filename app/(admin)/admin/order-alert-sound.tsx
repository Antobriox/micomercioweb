"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "../../../components/ui/primitives";

export function OrderAlertSound({ ids }: { ids: string[] }) {
  const audio = useRef<AudioContext | null>(null);
  const seen = useRef(new Set(ids));
  const [enabled, setEnabled] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => () => { if (audio.current) void audio.current.close(); }, []);

  useEffect(() => {
    const fresh = ids.some((id) => !seen.current.has(id));
    ids.forEach((id) => seen.current.add(id));
    const context = audio.current;
    if (!fresh || !enabled || context?.state !== "running") return;
    const tone = context.createOscillator();
    const volume = context.createGain();
    const end = context.currentTime + 0.25;
    tone.frequency.value = 660;
    volume.gain.setValueAtTime(0.12, context.currentTime);
    volume.gain.exponentialRampToValueAtTime(0.001, end);
    tone.connect(volume);
    volume.connect(context.destination);
    tone.start();
    tone.stop(end);
    tone.onended = () => { tone.disconnect(); volume.disconnect(); };
  }, [enabled, ids]);

  async function toggle() {
    if (enabled) { setEnabled(false); setMessage(""); return; }
    try {
      if (audio.current?.state === "closed") audio.current = null;
      audio.current ??= new AudioContext();
      await audio.current.resume();
      setEnabled(audio.current.state === "running");
      setMessage(audio.current.state === "running" ? "" : "El navegador no habilitó el sonido.");
    } catch {
      setMessage("El navegador no habilitó el sonido.");
    }
  }

  return <div className="space-y-2">
    <Button tone="secondary" type="button" aria-pressed={enabled} onClick={toggle}>Sonido de pedidos nuevos</Button>
    <p className="text-sm text-muted">Las alertas se actualizan con el panel abierto.</p>
    <p className="text-sm" role="status">{message}</p>
  </div>;
}
