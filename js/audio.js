/**
 * BACKCHAIN - Audio System
 * Synthesized sound effects using Web Audio API
 */

window.Audio = {
    ctx: null,
    masterGain: null,
    enabled: true,
    isMuted: false,

    init: function() {
        if (this.ctx) return;
        
        try {
            var AudioContext = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContext();
            this.masterGain = this.ctx.createGain();
            this.masterGain.connect(this.ctx.destination);
            
            // Apply initial volume immediately
            this.updateVolume(); 
        } catch (e) {
            console.warn('Web Audio not supported');
            this.enabled = false;
        }
    },

    resume: function() {
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    },

    toggleMute: function() {
        // Ensure init so we have something to mute
        if (!this.ctx) this.init();

        this.isMuted = !this.isMuted;
        this.updateVolume();
        
        // Visual Update
        var btn = document.getElementById('mute-button');
        if (btn) btn.textContent = this.isMuted ? '🔇' : '🔊';
        
        return this.isMuted;
    },

    updateVolume: function() {
        var vol = this.isMuted ? 0 : (CONFIG.MASTER_VOLUME || 0.5);
        
        // Update SFX Volume
        if (this.masterGain && this.ctx) {
            this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime);
            this.masterGain.gain.setValueAtTime(vol, this.ctx.currentTime);
        }
        
        // Update Music Volume
        if (window.Music) {
            window.Music.setVolume(this.isMuted ? 0 : 0.3);
        }
    },

    playTone: function(freq, type, duration, vol) {
        if (!this.enabled || !this.ctx || this.isMuted) return; // Check mute here too
        this.resume();

        var osc = this.ctx.createOscillator();
        var gain = this.ctx.createGain();
        
        osc.connect(gain);
        gain.connect(this.masterGain);
        
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        
        gain.gain.setValueAtTime(0, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(vol, this.ctx.currentTime + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
        
        osc.start(this.ctx.currentTime);
        osc.stop(this.ctx.currentTime + duration + 0.1);
    },

    // --- MENU SOUNDS ---
    playMenuClick: function() { this.playTone(600, 'sine', 0.1, 0.2); },
    playMenuHover: function() { this.playTone(300, 'triangle', 0.05, 0.05); },

    // --- GAME SOUNDS ---
    playJump: function() {
        if (!this.enabled || !this.ctx || this.isMuted) return;
        this.resume();
        var osc = this.ctx.createOscillator();
        var gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(200, this.ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(400, this.ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);
        osc.start(this.ctx.currentTime);
        osc.stop(this.ctx.currentTime + 0.15);
    },

    playLand: function() { this.playTone(100, 'triangle', 0.1, 0.2); },

    playRoomEnter: function(accentColor) {
        if (!this.enabled || !this.ctx || this.isMuted) return;
        this.resume();
        var hue = (accentColor >> 16) & 0xFF;
        var baseFreq = 300 + (hue / 255) * 200;
        var osc = this.ctx.createOscillator();
        var gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(baseFreq, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, this.ctx.currentTime + 0.1);
        osc.frequency.exponentialRampToValueAtTime(baseFreq, this.ctx.currentTime + 0.3);
        gain.gain.setValueAtTime(0, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.2, this.ctx.currentTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.5);
        osc.start(this.ctx.currentTime);
        osc.stop(this.ctx.currentTime + 0.5);
    },

    playWarning: function() { this.playTone(440, 'square', 0.1, 0.1); },

    playVictory: function() {
        if (!this.enabled || !this.ctx || this.isMuted) return;
        this.resume();
        var notes = [523.25, 659.25, 783.99, 1046.50];
        var now = this.ctx.currentTime;
        var self = this;
        notes.forEach(function(freq, i) {
            var osc = self.ctx.createOscillator();
            var gain = self.ctx.createGain();
            osc.connect(gain);
            gain.connect(self.masterGain);
            osc.type = 'sine';
            osc.frequency.value = freq;
            var t = now + i * 0.1;
            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(0.15, t + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
            osc.start(t);
            osc.stop(t + 0.4);
        });
    },

    playGameOver: function() {
        if (!this.enabled || !this.ctx || this.isMuted) return;
        this.resume();
        var osc = this.ctx.createOscillator();
        var gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(50, this.ctx.currentTime + 0.5);
        gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.5);
        osc.start(this.ctx.currentTime);
        osc.stop(this.ctx.currentTime + 0.5);
    },

    playKeyPress: function(correct) {
        if (correct) {
            var freq = 600 + Math.random() * 50; 
            this.playTone(freq, 'sine', 0.08, 0.1);
        } else {
            this.playTone(150, 'sawtooth', 0.1, 0.1);
        }
    },

    playVerseComplete: function() {
        if (!this.enabled || !this.ctx || this.isMuted) return;
        this.resume();
        var self = this;
        var notes = [440, 554.37, 659.25];
        var now = this.ctx.currentTime;
        notes.forEach(function(freq, i) {
            var osc = self.ctx.createOscillator();
            var gain = self.ctx.createGain();
            osc.connect(gain);
            gain.connect(self.masterGain);
            osc.type = 'sine';
            osc.frequency.value = freq;
            var t = now + i * 0.08;
            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(0.1, t + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
            osc.start(t);
            osc.stop(t + 0.3);
        });
    }
};