/**
 * IntegrityManager — lightweight client-side anti-cheat.
 *
 * Strategy:
 *  • Keeps a rolling XOR checksum of every score delta alongside the score.
 *  • If the score in ScoreManager ever diverges from the running checksum reconstruction,
 *    the game is flagged as tampered.
 *  • Detects localStorage injection by re-validating stored high-scores on read
 *    against a stored HMAC-like fingerprint (using a session salt).
 *  • On detection: locks the game loop and voids the session score.
 */

const SALT_KEY = 'gw_session_salt';
const HS_KEY = 'gearworks_highscore';
const HS_SIG_KEY = 'gearworks_hs_sig';

function simpleHash(str) {
    let h = 0x811c9dc5;
    for (let i = 0; i < str.length; i++) {
        h ^= str.charCodeAt(i);
        h = (h * 0x01000193) >>> 0;
    }
    return h.toString(16);
}

function getOrCreateSalt() {
    let salt = sessionStorage.getItem(SALT_KEY);
    if (!salt) {
        salt = Math.random().toString(36).slice(2) + Date.now().toString(36);
        sessionStorage.setItem(SALT_KEY, salt);
    }
    return salt;
}

export function signHighScore(score) {
    const salt = getOrCreateSalt();
    return simpleHash(`${salt}:${score}:gearworks`);
}

export function verifyHighScore(score) {
    const stored = localStorage.getItem(HS_SIG_KEY);
    if (!stored) return true; // first run — no signature yet
    return stored === signHighScore(score);
}

export function saveHighScore(score) {
    localStorage.setItem(HS_KEY, score);
    localStorage.setItem(HS_SIG_KEY, signHighScore(score));
}

export function loadHighScore() {
    const raw = localStorage.getItem(HS_KEY);
    if (!raw) return 0;
    const score = Number(raw);
    if (!verifyHighScore(score)) {
        // Signature mismatch — high score was manually edited; reset it
        localStorage.removeItem(HS_KEY);
        localStorage.removeItem(HS_SIG_KEY);
        return 0;
    }
    return score;
}

export default class IntegrityManager {
    constructor() {
        this._checksum = 0;
        this._expectedScore = 0;
        this.tampered = false;
        this._salt = getOrCreateSalt();
    }

    /**
     * Call this every time score increases.
     * delta must equal the exact points awarded.
     */
    recordDelta(delta) {
        if (this.tampered) return;
        // Rolling checksum: XOR with a hashed delta+salt to make it non-obvious
        this._checksum ^= parseInt(simpleHash(`${this._salt}:${delta}:${this._expectedScore}`), 16);
        this._expectedScore += delta;
    }

    /**
     * Validate the current score against our internal ledger.
     * Returns true if OK, false if tampered.
     */
    validate(actualScore) {
        if (this.tampered) return false;
        if (actualScore !== this._expectedScore) {
            this.tampered = true;
            console.warn('[GEARWORKS] Score integrity violation detected.');
            return false;
        }
        return true;
    }

    /**
     * Call at game-over to get a "safe" final score.
     * Returns 0 if tampered.
     */
    getFinalScore(reportedScore) {
        if (!this.validate(reportedScore)) return 0;
        return reportedScore;
    }
}