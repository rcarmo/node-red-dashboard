export type TtsStatusCallback = (status: "playing" | "complete" | `error: ${string}`) => void;

export type TtsFallbackCallback = (text: string) => void;

let cachedVoices: globalThis.SpeechSynthesisVoice[] = [];

export function initVoices(): void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  cachedVoices = window.speechSynthesis.getVoices();
  window.speechSynthesis.onvoiceschanged = () => {
    cachedVoices = window.speechSynthesis.getVoices();
  };
}

export function getVoices(): globalThis.SpeechSynthesisVoice[] {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return [];
  if (cachedVoices.length === 0) {
    cachedVoices = window.speechSynthesis.getVoices();
  }
  return cachedVoices;
}

export function isTtsSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window && getVoices().length > 0;
}

export function speakText(
  text: string,
  voiceUri?: string,
  volume?: number,
  onStatus?: TtsStatusCallback,
  onFallback?: TtsFallbackCallback,
): void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    onFallback?.(text);
    return;
  }

  const voices = getVoices();
  if (voices.length === 0) {
    // No voices available, fall back to toast
    onFallback?.(text);
    return;
  }

  const utterance = new SpeechSynthesisUtterance(text);

  if (typeof voiceUri === "string") {
    const found = voices.find((v) => v.voiceURI === voiceUri);
    if (found) utterance.voice = found;
  }

  if (typeof volume === "number" && Number.isFinite(volume)) {
    const clamped = Math.max(0, Math.min(1, volume));
    utterance.volume = clamped;
  }

  utterance.onstart = () => onStatus?.("playing");
  utterance.onend = () => onStatus?.("complete");
  utterance.onerror = (event) => onStatus?.(`error: ${event.error}`);

  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}
