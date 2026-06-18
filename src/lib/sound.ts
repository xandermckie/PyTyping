/**
 * Optional, quiet error feedback. Generated with the Web Audio API so the app
 * ships no audio files and stays fully offline. Default is muted (Settings);
 * the tone is a short, soft sine blip — never harsh, per the design brief.
 */

let ctx: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!ctx) ctx = new Ctor();
  return ctx;
}

/** Play a brief, low-volume error tone. No-op if Web Audio is unavailable. */
export function playErrorBlip(): void {
  try {
    const audio = getContext();
    if (!audio) return;
    // Browsers suspend the context until a user gesture; typing is a gesture.
    if (audio.state === 'suspended') void audio.resume().catch(() => {});

    const now = audio.currentTime;
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, now); // low A — unobtrusive
    // Quick attack, fast decay → a soft tick rather than a beep.
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.06, now + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
    osc.connect(gain).connect(audio.destination);
    osc.start(now);
    osc.stop(now + 0.13);
  } catch {
    /* audio unavailable */
  }
}

/** Soft chime when a Pomodoro phase completes. */
export function playPhaseChime(): void {
  try {
    const audio = getContext();
    if (!audio) return;
    if (audio.state === 'suspended') void audio.resume().catch(() => {});

    const now = audio.currentTime;
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.05, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
    osc.connect(gain).connect(audio.destination);
    osc.start(now);
    osc.stop(now + 0.36);
  } catch {
    /* audio unavailable */
  }
}
