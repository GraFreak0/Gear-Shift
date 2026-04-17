/**
 * SoundManager — synthesizes all game sounds using Web Audio API.
 * No audio files needed — everything is generated procedurally.
 */
export default class SoundManager {
    constructor() {
        this.enabled = localStorage.getItem('gearworks_sfx') !== 'off';
        this._ctx = null;
        this._masterGain = null;
    }

    _getCtx() {
        if (!this._ctx) {
            try {
                this._ctx = new (window.AudioContext || window.webkitAudioContext)();
                this._masterGain = this._ctx.createGain();
                this._masterGain.gain.value = 0.6;
                this._masterGain.connect(this._ctx.destination);
            } catch (e) {
                return null;
            }
        }
        if (this._ctx.state === 'suspended') this._ctx.resume();
        return this._ctx;
    }

    _beep(frequency, duration, type = 'square', volume = 0.5, attack = 0.01, decay = 0.1) {
        if (!this.enabled) return;
        const ctx = this._getCtx();
        if (!ctx) return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(this._masterGain);
        osc.type = type;
        osc.frequency.setValueAtTime(frequency, ctx.currentTime);
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + attack);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + attack + decay + duration);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + attack + decay + duration + 0.05);
    }

    _noise(duration, volume = 0.3) {
        if (!this.enabled) return;
        const ctx = this._getCtx();
        if (!ctx) return;
        const bufferSize = ctx.sampleRate * duration;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        const gain = ctx.createGain();
        source.connect(gain);
        gain.connect(this._masterGain);
        gain.gain.setValueAtTime(volume, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
        source.start(ctx.currentTime);
    }

    // ─── Game Events ──────────────────────────────────────────────────────────

    playPartPlace() {
        // Mechanical click
        this._beep(400, 0.05, 'square', 0.4, 0.005, 0.08);
        this._noise(0.06, 0.15);
    }

    playPartCorrect() {
        // Rising ding
        this._beep(600, 0.05, 'sine', 0.4, 0.01, 0.1);
        this._beep(900, 0.08, 'sine', 0.35, 0.02, 0.15);
    }

    playMachineFixed() {
        // Victory jingle
        [523, 659, 784, 1047].forEach((f, i) => {
            setTimeout(() => this._beep(f, 0.1, 'sine', 0.5, 0.01, 0.15), i * 80);
        });
    }

    playWrongPart() {
        // Buzzer
        this._beep(120, 0.15, 'sawtooth', 0.5, 0.005, 0.2);
        this._noise(0.1, 0.2);
    }

    playMachineLost() {
        // Descending alarm
        const ctx = this._getCtx();
        if (!ctx || !this.enabled) return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(this._masterGain);
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(110, ctx.currentTime + 0.4);
        gain.gain.setValueAtTime(0.5, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.55);
    }

    playCombo(comboLevel) {
        // Higher pitch for bigger combo — adds harmonic layers at high combos
        const freq = 440 + comboLevel * 60;
        this._beep(freq, 0.08, 'sine', 0.6, 0.01, 0.2);
        if (comboLevel >= 5) {
            setTimeout(() => this._beep(freq * 1.5, 0.1, 'sine', 0.5, 0.01, 0.25), 100);
        }
        if (comboLevel >= 8) {
            // Extra bass layer for mega combo
            setTimeout(() => this._beep(freq * 0.5, 0.15, 'triangle', 0.4, 0.01, 0.3), 50);
            setTimeout(() => this._beep(freq * 2, 0.1, 'sine', 0.3, 0.01, 0.2), 200);
        }
    }

    playMachineHum(machineId) {
        // Unique idle hum per machine type
        const freqs = {
            motor: [80, 160],
            clock: [220, 330],
            circuit: [440, 880],
            steam: [60, 120],
            robot: [200, 400, 600],
            boss_mega: [40, 80, 160],
        };
        const f = freqs[machineId] || [100, 200];
        f.forEach((freq, i) => {
            setTimeout(() => this._beep(freq, 0.06, 'sine', 0.08, 0.02, 0.1), i * 40);
        });
    }

    playChainReaction(chainCount) {
        // Escalating tones for chain reactions
        const notes = [523, 659, 784, 988, 1175];
        for (let i = 0; i < Math.min(chainCount, 5); i++) {
            setTimeout(() => this._beep(notes[i], 0.08, 'sine', 0.5, 0.01, 0.12), i * 60);
        }
    }

    playAchievementUnlocked() {
        [523, 659, 784, 1047, 1319].forEach((f, i) => {
            setTimeout(() => this._beep(f, 0.1, 'sine', 0.55, 0.01, 0.2), i * 70);
        });
    }

    playBossSpawn() {
        // Ominous low drone
        const ctx = this._getCtx();
        if (!ctx || !this.enabled) return;
        [40, 60, 80].forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain); gain.connect(this._masterGain);
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.1);
            gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.1);
            gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + i * 0.1 + 0.1);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.1 + 0.8);
            osc.start(ctx.currentTime + i * 0.1);
            osc.stop(ctx.currentTime + i * 0.1 + 0.9);
        });
    }

    playLevelUp() {
        [262, 330, 392, 523, 659, 784].forEach((f, i) => {
            setTimeout(() => this._beep(f, 0.12, 'square', 0.4, 0.01, 0.18), i * 60);
        });
    }

    playSkillActivate(skillId) {
        if (skillId === 'freeze') {
            // Icy whoosh
            this._beep(1200, 0.05, 'sine', 0.5, 0.01, 0.3);
            this._beep(600, 0.1, 'sine', 0.4, 0.02, 0.4);
        } else if (skillId === 'slowmo') {
            // Warp-down
            const ctx = this._getCtx();
            if (!ctx || !this.enabled) return;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain); gain.connect(this._masterGain);
            osc.type = 'sine';
            osc.frequency.setValueAtTime(800, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.4);
            gain.gain.setValueAtTime(0.5, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
            osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.55);
        } else if (skillId === 'wrench') {
            // Mechanical clunk
            this._noise(0.08, 0.4);
            this._beep(300, 0.06, 'square', 0.5, 0.005, 0.1);
        }
    }

    playEventAlert() {
        // Warning siren
        this._beep(880, 0.15, 'sawtooth', 0.4, 0.01, 0.2);
        setTimeout(() => this._beep(660, 0.15, 'sawtooth', 0.4, 0.01, 0.2), 200);
    }

    playCountdown() {
        this._beep(440, 0.08, 'square', 0.5, 0.01, 0.1);
    }

    playCountdownGo() {
        this._beep(880, 0.1, 'square', 0.6, 0.01, 0.3);
        setTimeout(() => this._beep(1100, 0.12, 'square', 0.5, 0.01, 0.4), 120);
    }

    playGameOver() {
        [440, 370, 330, 220].forEach((f, i) => {
            setTimeout(() => this._beep(f, 0.2, 'sawtooth', 0.4, 0.01, 0.3), i * 200);
        });
    }

    toggle() {
        this.enabled = !this.enabled;
        localStorage.setItem('gearworks_sfx', this.enabled ? 'on' : 'off');
        return this.enabled;
    }
}