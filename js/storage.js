/**
 * BACKCHAIN - Storage System
 * Handles save/load with localStorage
 */

window.Storage = {
    SAVE_KEY: 'backchain_save_v2',

    data: {
        // Platformer
        platformer: {
            roomTimes: {},      // Best time per room ID
            personalBests: {},  // PBs for speedrun modes
            bestRun: 0          // Highest run reached in classic
        },
        // Typing
        typing: {
            verseTimes: {},     // Best time per verse reference
            personalBests: {},
            highestVerse: 0     // Furthest verse reached
        },
        // Settings
        settings: {
            audioEnabled: true,
            masterVolume: 0.7
        }
    },

    /**
     * Load data from localStorage
     */
    load() {
        try {
            const saved = localStorage.getItem(this.SAVE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                // Merge with defaults (in case new fields were added)
                this.data = this.deepMerge(this.data, parsed);
            }
        } catch (e) {
            console.warn('Failed to load save data:', e);
        }
        return this.data;
    },

    /**
     * Save data to localStorage
     */
    save() {
        try {
            localStorage.setItem(this.SAVE_KEY, JSON.stringify(this.data));
        } catch (e) {
            console.warn('Failed to save data:', e);
        }
    },

    /**
     * Deep merge objects
     */
    deepMerge(target, source) {
        const output = { ...target };
        for (const key in source) {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                output[key] = this.deepMerge(target[key] || {}, source[key]);
            } else {
                output[key] = source[key];
            }
        }
        return output;
    },

    /**
     * Clear all data
     */
    clear() {
        localStorage.removeItem(this.SAVE_KEY);
        this.data = {
            platformer: { roomTimes: {}, personalBests: {}, bestRun: 0 },
            typing: { verseTimes: {}, personalBests: {}, highestVerse: 0 },
            settings: { audioEnabled: true, masterVolume: 0.7 }
        };
    }
};