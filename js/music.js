/**
 * BACKCHAIN - Procedural Music Engine
 * - Global Sync (60 BPM)
 * - Verse-to-Music Generation
 * - Room Theme Tracks
 */

window.Music = {
    ctx: null,
    masterGain: null,
    isPlaying: false,
    
    // State
    currentMode: 'room', // 'room' or 'verse'
    currentId: null,     // Room ID or Verse Text
    
    // Scheduler
    nextNoteTime: 0,
    current16thNote: 0,
    tempo: 60.0,
    lookahead: 25.0, // ms
    scheduleAheadTime: 0.1, // s

    // Verse Generation Cache
    verseCache: {},

    init: function() {
        if (window.Audio && window.Audio.ctx) {
            this.ctx = window.Audio.ctx;
            this.masterGain = this.ctx.createGain();
            this.masterGain.connect(this.ctx.destination);
            
            // Check global mute state on init
            var vol = (window.Audio && window.Audio.isMuted) ? 0 : 0.3;
            this.masterGain.gain.value = vol;
        }
    },

    setVolume: function(val) {
        if (!this.ctx) this.init(); // Ensure init if called before start
        
        if (this.masterGain) {
            // Cancel current scheduled ramps to apply mute instantly
            this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime);
            this.masterGain.gain.setValueAtTime(val, this.ctx.currentTime);
        }
    },

    setVolume: function(val) {
        if (this.masterGain) {
            this.masterGain.gain.setTargetAtTime(val, this.ctx.currentTime, 0.1);
        }
    },

    // --- PLAYBACK CONTROL ---

    start: function(id, mode) {
        if (!this.ctx) this.init();
        if (!this.ctx) return;

        this.currentMode = mode || 'room';
        this.currentId = id;

        if (!this.isPlaying) {
            this.isPlaying = true;
            this.nextNoteTime = this.ctx.currentTime + 0.1;
            this.scheduler();
        }
    },

    stop: function() {
        this.isPlaying = false;
        this.currentId = null;
    },

    scheduler: function() {
        if (!this.isPlaying) return;

        // Schedule notes until we catch up to window
        while (this.nextNoteTime < this.ctx.currentTime + this.scheduleAheadTime) {
            this.scheduleNote(this.current16thNote, this.nextNoteTime);
            this.nextStep();
        }

        var self = this;
        window.setTimeout(function() { self.scheduler(); }, this.lookahead);
    },

    nextStep: function() {
        var secondsPerBeat = 60.0 / this.tempo;
        this.nextNoteTime += 0.25 * secondsPerBeat; // 16th notes
        this.current16thNote++;
        if (this.current16thNote === 16) {
            this.current16thNote = 0;
        }
    },

    scheduleNote: function(beatNumber, time) {
        if (!this.currentId) return;

        if (this.currentMode === 'room') {
            this.playRoomTrack(this.currentId, beatNumber, time);
        } else if (this.currentMode === 'verse') {
            this.playVerseTrack(this.currentId, beatNumber, time);
        }
    },

    // --- VERSE GENERATION ALGORITHM ---

    getVersePattern: function(text) {
        if (this.verseCache[text]) return this.verseCache[text];

        // 1. Hash the text to a seed number
        var hash = 0;
        for (var i = 0; i < text.length; i++) {
            hash = ((hash << 5) - hash) + text.charCodeAt(i);
            hash |= 0;
        }
        var seed = Math.abs(hash);

        // 2. Derive Musical Properties
        var scales = [
            [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88], // C Major
            [261.63, 293.66, 311.13, 349.23, 392.00, 415.30, 466.16], // C Minor
            [261.63, 293.66, 311.13, 349.23, 392.00, 440.00, 466.16], // C Dorian
            [261.63, 277.18, 329.63, 349.23, 392.00, 415.30, 493.88]  // C Phrygian Dominant
        ];
        
        var selectedScale = scales[seed % scales.length];
        var baseOctave = (seed % 3) + 2; // Octave 2, 3, or 4
        
        // 3. Generate Melody Pattern (16 steps)
        var pattern = [];
        for (var i = 0; i < 16; i++) {
            // Use bitwise ops on seed to determine note events
            var noteActive = (seed >> i) & 1;
            if (noteActive) {
                var noteIndex = (seed >> (i % 7)) % 7;
                var freq = selectedScale[noteIndex] * Math.pow(2, baseOctave - 4);
                pattern.push(freq);
            } else {
                pattern.push(null);
            }
        }

        // 4. Instrument choice
        var types = ['sine', 'triangle', 'square', 'sawtooth'];
        var instType = types[(seed >> 4) % 4];

        var trackData = {
            scale: selectedScale,
            pattern: pattern,
            type: instType,
            tempo: 60 + (seed % 40) // Unique tempo per verse? Or keep 60? Let's keep 60 for consistency
        };

        this.verseCache[text] = trackData;
        return trackData;
    },

    playVerseTrack: function(text, step, time) {
        var data = this.getVersePattern(text);
        
        // Play Melody
        var note = data.pattern[step];
        if (note) {
            this.synth.tone(this.ctx, this.masterGain, note, time, 0.2, data.type, 0.1, 0.05, 0.3);
        }

        // Ambient Drone (Root Note)
        if (step === 0) {
            var root = data.scale[0] * 0.5; // Octave down
            this.synth.tone(this.ctx, this.masterGain, root, time, 4.0, 'sine', 0.05, 1.0, 1.0);
        }
    },

    // --- ROOM TRACKS ---

    playRoomTrack: function(roomId, step, time) {
        var S = this.S; // Shorthand for scale

        // AZURE: Ambient Arpeggios
        if (roomId === 'azure') {
            if (step === 0) this.synth.tone(this.ctx, this.masterGain, S.C3, time, 3.5, 'sine', 0.2, 0.5, 2.0);
            var arp = [S.C4, S.E4, S.G4, S.B4, S.C5, S.B4, S.G4, S.E4];
            if (step % 2 === 0) {
                var note = arp[(step/2) % 8];
                this.synth.tone(this.ctx, this.masterGain, note, time, 0.1, 'sine', 0.1, 0.05, 0.5);
            }
        }

        // CRIMSON: Baroque Counterpoint (Fixed Loop)
        if (roomId === 'crimson') {
            // Bass: Walking 8 notes loop
            // Since `step` resets 0-15, this loops perfectly every measure
            if (step % 2 === 0) { // 8th notes
                var idx = (step / 2); // 0-7
                var bass = [S.A2, S.C3, S.E3, S.A3, S.G2, S.B2, S.D3, S.G3];
                this.synth.tone(this.ctx, this.masterGain, bass[idx], time, 0.2, 'sawtooth', 0.1, 0.01, 0.1);
            }
            // Melody on off-beats
            if (step % 4 === 2) {
                var mel = [S.E5, S.D5, S.C5, S.B4];
                var mIdx = Math.floor(step / 4);
                this.synth.tone(this.ctx, this.masterGain, mel[mIdx], time, 0.1, 'square', 0.05, 0.01, 0.1);
            }
        }

        // EMERALD: Minimal Techno
        if (roomId === 'emerald') {
            if (step === 0 || step === 8) this.synth.kick(this.ctx, this.masterGain, time);
            if (step % 2 === 0) this.synth.noise(this.ctx, this.masterGain, time, 0.05, 0.05);
            var seq = [S.E3, 0, S.G3, 0, S.A3, S.E3, 0, S.B3, S.E3, 0, S.G3, 0, S.D3, 0, S.A3, 0];
            if (seq[step]) this.synth.tone(this.ctx, this.masterGain, seq[step], time, 0.1, 'triangle', 0.1, 0.01, 0.1);
        }

        // AMBER: Jazz Swing
        if (roomId === 'amber') {
            // Ride Cymbal Pattern: Ding, da-da Ding
            // Steps: 0, 6, 8, 14
            if (step === 0 || step === 6 || step === 8 || step === 14) {
                this.synth.noise(this.ctx, this.masterGain, time, 0.1, 0.03);
            }
            // Walking Bass
            if (step % 4 === 0) {
                var bass = [S.D2, S.F2, S.G2, S.A2];
                this.synth.tone(this.ctx, this.masterGain, bass[step/4], time, 0.3, 'triangle', 0.2, 0.05, 0.2);
            }
            // Chords on 1
            if (step === 0) {
                [S.F3, S.A3, S.C4, S.E4].forEach(n => 
                    this.synth.tone(this.ctx, this.masterGain, n, time, 0.5, 'sine', 0.05, 0.01, 0.2)
                );
            }
        }

        // VIOLET: Waltz / Triplets
        if (roomId === 'violet') {
            // To feel like 3/4 in a 4/4 grid, we use a polymetric pattern
            // Or simple 3-note arpeggios repeated
            var arp = [S.C3, S.E3, S.G3];
            if (step % 2 === 0) { // 8th notes
                // 0, 2, 4, 6, 8, 10, 12, 14
                var note = arp[(step/2) % 3];
                this.synth.tone(this.ctx, this.masterGain, note, time, 0.4, 'sine', 0.15, 0.1, 0.4);
            }
        }

        // SILVER: Ethereal
        if (roomId === 'silver') {
            if (step === 0) {
                this.synth.tone(this.ctx, this.masterGain, S.E5, time, 3.5, 'sine', 0.05, 1.0, 1.0);
                this.synth.tone(this.ctx, this.masterGain, S.B4, time, 3.5, 'sine', 0.05, 1.0, 1.0);
            }
            // Sparkles
            if (step % 2 === 0 && Math.random() > 0.7) {
                var notes = [S.E6, S.G6, S.B5, S.D6];
                var n = notes[Math.floor(Math.random()*notes.length)];
                this.synth.tone(this.ctx, this.masterGain, n, time, 0.1, 'triangle', 0.03, 0.01, 0.3);
            }
        }

        // CORAL: Mystery
        if (roomId === 'coral') {
            if (step === 0) this.synth.tone(this.ctx, this.masterGain, 55, time, 2, 'sawtooth', 0.1, 0.1, 0.5);
            if (step === 8) this.synth.tone(this.ctx, this.masterGain, 77.78, time, 1, 'triangle', 0.08, 0.5, 0.5);
        }

        // CYAN: Rock
        if (roomId === 'cyan') {
            if (step % 2 === 0) this.synth.tone(this.ctx, this.masterGain, S.D2, time, 0.1, 'sawtooth', 0.15, 0.01, 0.05);
            if (step === 4 || step === 12) this.synth.noise(this.ctx, this.masterGain, time, 0.1, 0.1);
            if (step === 0) {
                this.synth.tone(this.ctx, this.masterGain, S.D3, time, 0.2, 'square', 0.1, 0.01, 0.1);
                this.synth.tone(this.ctx, this.masterGain, S.A3, time, 0.2, 'square', 0.1, 0.01, 0.1);
            }
        }
    },

    // --- SYNTHESIZER ---
    synth: {
        tone: function(ctx, dest, freq, time, dur, type, vol, attack, release) {
            var osc = ctx.createOscillator();
            var gain = ctx.createGain();
            osc.type = type || 'sine';
            osc.frequency.value = freq;
            osc.connect(gain);
            gain.connect(dest);
            gain.gain.setValueAtTime(0, time);
            gain.gain.linearRampToValueAtTime(vol, time + attack);
            gain.gain.exponentialRampToValueAtTime(0.001, time + dur + release);
            osc.start(time);
            osc.stop(time + dur + release + 0.1);
        },
        noise: function(ctx, dest, time, dur, vol) {
            var buf = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
            var d = buf.getChannelData(0);
            for(var i=0;i<d.length;i++) d[i]=Math.random()*2-1;
            var src = ctx.createBufferSource();
            src.buffer = buf;
            var gain = ctx.createGain();
            gain.gain.setValueAtTime(vol, time);
            gain.gain.exponentialRampToValueAtTime(0.001, time + dur);
            src.connect(gain);
            gain.connect(dest);
            src.start(time);
        },
        kick: function(ctx, dest, time) {
            var osc = ctx.createOscillator();
            var gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(dest);
            osc.frequency.setValueAtTime(150, time);
            osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.5);
            gain.gain.setValueAtTime(0.5, time);
            gain.gain.exponentialRampToValueAtTime(0.001, time + 0.5);
            osc.start(time);
            osc.stop(time + 0.5);
        }
    },

    // Note Frequencies
    S: { C2:65.41, D2:73.42, E2:82.41, F2:87.31, G2:98.00, A2:110.00, B2:123.47,
         C3:130.81, D3:146.83, E3:164.81, F3:174.61, G3:196.00, A3:220.00, B3:246.94,
         C4:261.63, D4:293.66, E4:329.63, F4:349.23, G4:392.00, A4:440.00, B4:493.88,
         C5:523.25, D5:587.33, E5:659.25, G5:783.99, A5:880.00, B5:987.77,
         E6:1318.51, G6:1567.98 }
};