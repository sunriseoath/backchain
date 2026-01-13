/**
 * BACKCHAIN - Utility Functions
 */

window.Utils = {
    /**
     * Format seconds as MM:SS.mm
     */
    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = (seconds % 60).toFixed(2);
        return `${mins}:${secs.padStart(5, '0')}`;
    },

    /**
     * Format seconds as just SS.mm
     */
    formatTimeShort(seconds) {
        return seconds.toFixed(2);
    },

    /**
     * Clamp a value between min and max
     */
    clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    },

    /**
     * Linear interpolation
     */
    lerp(a, b, t) {
        return a + (b - a) * t;
    },

    /**
     * Random integer in range [min, max]
     */
    randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },

    /**
     * Seeded random number generator
     */
    seededRandom(seed) {
        const x = Math.sin(seed++) * 10000;
        return x - Math.floor(x);
    },

    /**
     * Shuffle array (Fisher-Yates)
     */
    shuffle(array) {
        const arr = [...array];
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    },

    /**
     * Detect touch device
     */
    isTouchDevice() {
        return ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    },

    /**
     * Hex color to CSS string
     */
    hexToCSS(hex) {
        return '#' + hex.toString(16).padStart(6, '0');
    }
};