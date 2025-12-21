export function speakText(text: string, voiceUri?: string, volume?: number): void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  const utterance = new SpeechSynthesisUtterance(text);
  if (typeof voiceUri === "string" && window.speechSynthesis) {
    const voices = window.speechSynthesis.getVoices();
    const found = voices.find((v) => v.voiceURI === voiceUri);
    if (found) utterance.voice = found;
  }
  if (typeof volume === "number" && Number.isFinite(volume)) {
    const clamped = Math.max(0, Math.min(1, volume));
    utterance.volume = clamped;
  }
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}
