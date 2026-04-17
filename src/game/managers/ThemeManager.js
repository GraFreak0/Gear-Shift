/**
 * ThemeManager — defines visual themes for the game.
 * A theme controls: background colors, belt colors, HUD accent, grid color, particle color.
 * Theme is stored in localStorage so it persists between sessions.
 */

export const THEMES = {
    factory: {
        id: 'factory',
        name: 'Night Factory',
        icon: '🏭',
        bgTop: 0x0a0a1a,
        bgBot: 0x0d1020,
        gridColor: 0x111133,
        beltColor: 0x1a1a2e,
        beltRail: 0x445577,
        hudBg: 0x080810,
        hudBorder: 0x334466,
        accentColor: '#ffcc44',
        dangerColor: 0x440000,
        dangerBorder: 0xff3300,
        particleColor: 0x44ff88,
        skyObjects: [], // rendered by EnvironmentRenderer
    },
    cyber: {
        id: 'cyber',
        name: 'Neon Cyber',
        icon: '🌆',
        bgTop: 0x050515,
        bgBot: 0x0a0525,
        gridColor: 0x1a0033,
        beltColor: 0x100020,
        beltRail: 0x660088,
        hudBg: 0x080010,
        hudBorder: 0x8800ff,
        accentColor: '#cc44ff',
        dangerColor: 0x330044,
        dangerBorder: 0xff00ff,
        particleColor: 0xff44ff,
        skyObjects: ['neon_signs'],
    },
    lava: {
        id: 'lava',
        name: 'Lava Forge',
        icon: '🌋',
        bgTop: 0x1a0500,
        bgBot: 0x0d0800,
        gridColor: 0x331100,
        beltColor: 0x200800,
        beltRail: 0x884422,
        hudBg: 0x100500,
        hudBorder: 0xff6600,
        accentColor: '#ff6600',
        dangerColor: 0x550000,
        dangerBorder: 0xff2200,
        particleColor: 0xff6622,
        skyObjects: ['lava_drips'],
    },
};

export const THEME_LIST = Object.values(THEMES);

export default class ThemeManager {
    constructor() {
        const saved = localStorage.getItem('gearworks_theme') || 'factory';
        this.current = THEMES[saved] || THEMES.factory;
    }

    setTheme(id) {
        this.current = THEMES[id] || THEMES.factory;
        localStorage.setItem('gearworks_theme', this.current.id);
    }

    get() {
        return this.current;
    }

    next() {
        const keys = Object.keys(THEMES);
        const idx = keys.indexOf(this.current.id);
        const nextId = keys[(idx + 1) % keys.length];
        this.setTheme(nextId);
        return this.current;
    }
}