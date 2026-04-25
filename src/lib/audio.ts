"use client";

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (ctx) return ctx;
  try {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    ctx = new Ctx();
    return ctx;
  } catch {
    return null;
  }
}

export function playTock(volume = 0.18) {
  const c = getCtx();
  if (!c) return;
  if (c.state === "suspended") c.resume().catch(() => {});

  const now = c.currentTime;
  const osc = c.createOscillator();
  const gain = c.createGain();
  const filter = c.createBiquadFilter();

  osc.type = "triangle";
  osc.frequency.setValueAtTime(620, now);
  osc.frequency.exponentialRampToValueAtTime(220, now + 0.08);

  filter.type = "lowpass";
  filter.frequency.setValueAtTime(2400, now);

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(volume, now + 0.005);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(c.destination);

  osc.start(now);
  osc.stop(now + 0.16);
}

export function playSolved(volume = 0.2) {
  const c = getCtx();
  if (!c) return;
  if (c.state === "suspended") c.resume().catch(() => {});

  const now = c.currentTime;
  const notes = [523.25, 659.25, 783.99]; // C5, E5, G5

  notes.forEach((freq, i) => {
    const osc = c.createOscillator();
    const gain = c.createGain();
    const start = now + i * 0.08;
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.4);
    osc.connect(gain);
    gain.connect(c.destination);
    osc.start(start);
    osc.stop(start + 0.42);
  });
}
