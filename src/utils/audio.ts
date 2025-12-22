// Singleton AudioContext
let audioCtx: AudioContext | null = null;

export const playNotificationSound = async () => {
    try {
        if (!audioCtx) {
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            if (!AudioContext) return;
            audioCtx = new AudioContext();
        }

        if (audioCtx.state === 'suspended') {
            await audioCtx.resume();
        }

        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        osc.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        // "Tig" sound: Snappier attack
        const t = audioCtx.currentTime;

        osc.type = "sine";
        osc.frequency.setValueAtTime(1000, t); // Higher pitch start
        osc.frequency.exponentialRampToValueAtTime(500, t + 0.08); // Faster drop for "tig"

        // Envelope for "hit" sound
        gainNode.gain.setValueAtTime(0, t);
        gainNode.gain.linearRampToValueAtTime(0.3, t + 0.01); // Quick attack
        gainNode.gain.exponentialRampToValueAtTime(0.01, t + 0.2); // Quick decay

        osc.start(t);
        osc.stop(t + 0.2);
    } catch (error) {
        console.error("Failed to play notification sound:", error);
    }
};
