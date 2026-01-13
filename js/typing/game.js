/**
 * BACKCHAIN - Typing Game
 * Classic, Adaptive, and Zen modes
 */

window.TypingGame = {
    state: 'inactive',
    mode: 'classic',

    currentRun: 1,
    versesToType: [],
    currentVerseIndex: 0,
    completedVerses: [],

    timeRemaining: 0,
    elapsedTime: 0,
    runStartTime: 0,

    animationFrameId: null,
    lastFrameTime: 0,

    elements: {},

    init: function() {
        this.cacheElements();
        this.setupInputHandler();
        this.setupExitHandler();
        console.log('TypingGame initialized');
    },

    cacheElements: function() {
        this.elements = {
            container: document.getElementById('typing-container'),
            runInfo: document.getElementById('typing-run-info'),
            runNumber: document.getElementById('typing-run-number'),
            timer: document.getElementById('typing-timer'),
            verseInfo: document.getElementById('typing-verse-info'),
            verseQueue: document.getElementById('verse-queue'),
            verseDisplay: document.getElementById('verse-display'),
            contextTop: document.getElementById('verse-context-top'),
            contextBottom: document.getElementById('verse-context-bottom'),
            currentWordDisplay: document.getElementById('current-word-display'),
            input: document.getElementById('typing-input'),
            wpm: document.getElementById('typing-wpm'),
            accuracy: document.getElementById('typing-accuracy'),
            progressBar: document.getElementById('typing-progress-bar'),
            exitButton: document.getElementById('typing-exit-button'),
            exitBar: document.getElementById('typing-exit-bar')
        };
    },

    setupExitHandler: function() {
        var self = this;
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && (self.state === 'playing' || self.state === 'finish_safety')) {
                self.exitToMenu();
            }
        });
        if (this.elements.exitButton) {
            this.elements.exitButton.addEventListener('click', function(e) {
                e.stopPropagation();
                self.exitToMenu();
            });
        }
        if (this.elements.exitBar) {
            this.elements.exitBar.addEventListener('click', function() {
                self.exitToMenu();
            });
        }
    },

    setupInputHandler: function() {
        var self = this;
        if (!this.elements.input) return;

        this.elements.input.addEventListener('input', function(e) {
            if (self.state !== 'playing') return;
            
            if (window.Backchain.state === 'paused') {
                e.preventDefault(); // Prevent typing while paused
                return;        
            }
            var result = TypingEngine.setTypedText(e.target.value);
            self.updateDisplay();
            
            if (TypingEngine.isCurrentInputCorrect()) {
                self.elements.input.classList.remove('error');
            } else {
                self.elements.input.classList.add('error');
            }

            if (result.autoComplete) {
                self.completeCurrentWord();
            }
        });

        this.elements.input.addEventListener('keydown', function(e) {
            // Safety Finish Handling
            if (self.state === 'finish_safety') {
                if (e.key === ' ' || e.key === 'Enter') {
                    e.preventDefault();
                    self.victory();
                }
                return;
            }

            if (self.state !== 'playing') return;
            if (e.key === 'Escape') return;

            if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                
                if (TypingEngine.isWordComplete()) {
                    self.completeCurrentWord();
                } else {
                    if (window.Audio) window.Audio.playKeyPress(false);
                    self.elements.input.classList.add('error');
                    setTimeout(function() {
                        self.elements.input.classList.remove('error');
                    }, 200);
                }
            }
        });

        this.elements.input.addEventListener('paste', function(e) {
            e.preventDefault();
        });
    },

    completeCurrentWord: function() {
        if (window.Audio) window.Audio.playKeyPress(true);
        
        var verseComplete = TypingEngine.advanceWord();
        this.elements.input.value = '';
        this.elements.input.classList.remove('error');
        
        if (verseComplete) {
            this.onVerseComplete();
        } else {
            this.updateDisplay();
        }
    },

    exitToMenu: function() {
        this.stop();
        if (window.Backchain) {
            Backchain.showTypingModes();
        }
    },

    startGame: function(mode) {
        this.mode = mode;
        this.currentRun = 1;
        this.completedVerses = [];
        this.versesToType = [];
        this.startRun();
    },

    calculateAdaptiveTime: function() {
        var verseTimes = Storage.data.typing.verseTimes;
        var total = 0;
        
        for (var i = 0; i < this.versesToType.length; i++) {
            var verse = this.versesToType[i];
            var bestTime = verseTimes[verse.reference];
            
            if (bestTime) {
                total += bestTime * 1.3;
            } else {
                var wordCount = verse.text.split(' ').length;
                total += wordCount * 1.0;
            }
        }
        
        var minTime = this.versesToType.length * 5;
        return Math.max(total, minTime) + (this.currentRun * 3);
    },

    startRun: function() {
        var self = this;
        this.state = 'playing';
        this.currentVerseIndex = 0;
        this.elapsedTime = 0;

        if (this.mode === 'classic') {
            this.versesToType = BibleData.getVersesForRun(this.currentRun);
        } else if (this.mode === 'adaptive') {
            if (this.currentRun === 1) {
                this.versesToType = [BibleData.getRandomVerse()];
            } else {
                var newVerse = BibleData.getRandomVerse();
                var existingRefs = this.versesToType.map(function(v) { return v.reference; });
                var attempts = 0;
                while (existingRefs.indexOf(newVerse.reference) !== -1 && attempts < 20) {
                    newVerse = BibleData.getRandomVerse();
                    attempts++;
                }
                this.versesToType.unshift(newVerse);
            }
        } else if (this.mode === 'zen') {
            this.versesToType = BibleData.getVersesForRun(BibleData.getVerseCount());
        }

        TypingEngine.init(this.versesToType[0]);

        // START MUSIC
        if (window.Music) {
            window.Music.start(this.versesToType[0].text, 'verse');
        }

        if (this.mode === 'zen') {
            this.timeRemaining = Infinity;
        } else if (this.mode === 'adaptive') {
            this.timeRemaining = this.calculateAdaptiveTime();
        } else {
            var totalWords = 0;
            for (var j = 0; j < this.versesToType.length; j++) {
                totalWords += this.versesToType[j].text.split(' ').length;
            }
            this.timeRemaining = totalWords * CONFIG.TYPING_BASE_TIME_PER_WORD +
                                 this.currentRun * CONFIG.TYPING_TIME_BONUS_PER_RUN;
        }

        this.runStartTime = performance.now();

        UI.hideAllScreens();
        if (typeof PlatformerEngine !== 'undefined') {
            PlatformerEngine.setVisible(false);
        }
        this.elements.container.style.display = 'flex';

        if (this.elements.input) {
            this.elements.input.value = '';
            this.elements.input.placeholder = "Type the word and press SPACE";
            this.elements.input.classList.remove('error');
            setTimeout(function() { self.elements.input.focus(); }, 100);
        }

        this.updateRunInfo();
        this.updateDisplay();
        this.updateQueue();
        this.updateStats();

        this.lastFrameTime = performance.now();
        this.gameLoop();
    },

    gameLoop: function() {
        var self = this;
        if (this.state !== 'playing') return;
        // Pause Check
        if (window.Backchain.state === 'paused') {
            this.animationFrameId = requestAnimationFrame(function() { self.gameLoop(); });
            return;
        }
        
        if (this.state !== 'playing') return;
        var currentTime = performance.now();
        var delta = Math.min((currentTime - this.lastFrameTime) / 1000, 0.1); // Safety clamp
        this.lastFrameTime = currentTime;

        this.updateTimer(delta);
        this.updateStats();

        this.animationFrameId = requestAnimationFrame(function() {
            self.gameLoop();
        });
    },

    updateTimer: function(delta) {
        if (!this.elements.timer) return;
        
        this.elapsedTime += delta;

        if (this.mode === 'zen') {
            this.elements.timer.textContent = Utils.formatTime(this.elapsedTime);
            this.elements.timer.className = 'zen';
        } else {
            this.timeRemaining -= delta;
            this.elements.timer.textContent = Utils.formatTimeShort(Math.max(0, this.timeRemaining));

            this.elements.timer.classList.remove('warning', 'danger', 'counting-up', 'zen');
            if (this.timeRemaining < 5) {
                this.elements.timer.classList.add('danger');
            } else if (this.timeRemaining < 10) {
                this.elements.timer.classList.add('warning');
            }

            if (this.timeRemaining <= 0) {
                this.gameOver();
            }
        }
    },

    updateRunInfo: function() {
        if (this.mode === 'zen') {
            if (this.elements.runInfo) {
                this.elements.runInfo.innerHTML = '🧘 ZEN';
            }
        } else {
            if (this.elements.runInfo) {
                this.elements.runInfo.innerHTML = 'RUN<br><span id="typing-run-number">' + this.currentRun + '</span>';
            }
        }
    },

    updateDisplay: function() {
        var data = TypingEngine.getDisplayData();
        
        if (this.elements.verseInfo) {
            this.elements.verseInfo.textContent = data.reference + 
                ' (' + (this.currentVerseIndex + 1) + '/' + this.versesToType.length + ')';
        }

        // Update Context
        if (window.BibleData && BibleData.getContext) {
            var context = BibleData.getContext(this.versesToType[this.currentVerseIndex]);
            if (this.elements.contextTop) {
                this.elements.contextTop.innerHTML = context.prev.map(function(v) {
                    return '<div class="context-line"><span class="context-ref">' + v.reference.split(' ').pop() + '</span> ' + v.text + '</div>';
                }).join('');
            }
            if (this.elements.contextBottom) {
                this.elements.contextBottom.innerHTML = context.next.map(function(v) {
                    return '<div class="context-line"><span class="context-ref">' + v.reference.split(' ').pop() + '</span> ' + v.text + '</div>';
                }).join('');
            }
        }

        // Update Verse
        if (this.elements.verseDisplay) {
            var html = '';
            for (var i = 0; i < data.words.length; i++) {
                var word = data.words[i];
                var className = 'word ';
                
                if (i < data.currentWordIndex) {
                    className += 'word-complete';
                } else if (i === data.currentWordIndex) {
                    className += 'word-current';
                } else {
                    className += 'word-pending';
                }
                
                html += '<span class="' + className + '">' + word + '</span> ';
            }
            this.elements.verseDisplay.innerHTML = html;
        }

        if (this.elements.currentWordDisplay) {
            this.elements.currentWordDisplay.textContent = data.currentWord;
        }

        if (this.elements.progressBar) {
            var verseProgress = data.progress;
            var overallProgress = (this.currentVerseIndex + verseProgress) / this.versesToType.length;
            this.elements.progressBar.style.width = (overallProgress * 100) + '%';
        }
    },

    updateQueue: function() {
        if (!this.elements.verseQueue) return;
        
        var upcoming = this.versesToType.slice(this.currentVerseIndex + 1, this.currentVerseIndex + 3);

        var html = '';
        if (upcoming.length > 0) {
            html = '<div class="queue-label">NEXT</div>';
            for (var i = 0; i < upcoming.length; i++) {
                html += '<div class="queued-verse">' + upcoming[i].reference + '</div>';
            }
        } else if (this.currentVerseIndex < this.versesToType.length) {
            html = '<div class="queue-label" style="color: #ffcc00;">FINAL VERSE</div>';
        }
        
        this.elements.verseQueue.innerHTML = html;
    },

    updateStats: function() {
        var data = TypingEngine.getDisplayData();
        if (this.elements.wpm) {
            this.elements.wpm.textContent = data.wpm + ' WPM';
        }
        if (this.elements.accuracy) {
            this.elements.accuracy.textContent = data.accuracy + '%';
        }
    },

    onVerseComplete: function() {
        if (window.Audio) window.Audio.playVerseComplete();

        var verse = this.versesToType[this.currentVerseIndex];
        var time = TypingEngine.getElapsedTime();

        this.completedVerses.push({
            reference: verse.reference,
            time: time,
            wpm: TypingEngine.getWPM(),
            accuracy: TypingEngine.getAccuracy()
        });

        var verseTimes = Storage.data.typing.verseTimes;
        if (!verseTimes[verse.reference] || time < verseTimes[verse.reference]) {
            verseTimes[verse.reference] = time;
        }
        Storage.save();

        this.currentVerseIndex++;

        // Safety Stop at end of run
        if (this.currentVerseIndex >= this.versesToType.length) {
            if (window.Music) window.Music.stop(); // Stop music on finish
            
            this.state = 'finish_safety';
            this.elements.input.value = '';
            this.elements.input.placeholder = "Run complete! Press SPACE to finish.";
            if (this.elements.currentWordDisplay) {
                this.elements.currentWordDisplay.textContent = "DONE";
                this.elements.currentWordDisplay.style.color = "#00ff88";
            }
        } else {
            TypingEngine.init(this.versesToType[this.currentVerseIndex]);
            
            // Change Music
            if (window.Music) {
                window.Music.start(this.versesToType[this.currentVerseIndex].text, 'verse');
            }
            
            this.elements.input.value = '';
            this.elements.input.classList.remove('error');
            this.updateDisplay();
            this.updateQueue();
        }
    },

    victory: function() {
        this.state = 'inactive';
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }
        if (window.Audio) window.Audio.playVictory();

        this.elements.container.style.display = 'none';

        if (window.Backchain) {
            window.Backchain.setMenuState();
        }

        var totalWPM = 0;
        var totalAccuracy = 0;
        for (var i = 0; i < this.completedVerses.length; i++) {
            totalWPM += this.completedVerses[i].wpm;
            totalAccuracy += this.completedVerses[i].accuracy;
        }
        var avgWPM = Math.round(totalWPM / this.completedVerses.length);
        var avgAccuracy = Math.round(totalAccuracy / this.completedVerses.length);

        var timeDisplay;
        if (this.mode === 'zen') {
            timeDisplay = 'Time: ' + Utils.formatTime(this.elapsedTime);
        } else {
            timeDisplay = 'Time remaining: ' + Utils.formatTimeShort(Math.max(0, this.timeRemaining)) + 's';
        }

        var subtitle = this.mode === 'zen' ? 'Journey complete.' : 'Chain extended!';

        UI.setVictoryContent(
            subtitle,
            'Verses: ' + this.completedVerses.length + '<br>' +
            timeDisplay + '<br>' +
            'WPM: ' + avgWPM + ' | Accuracy: ' + avgAccuracy + '%'
        );
        UI.showScreen('victory-screen');
    },

    gameOver: function() {
        this.state = 'inactive';
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }
        if (window.Audio) window.Audio.playGameOver();
        if (window.Music) window.Music.stop(); // Stop music on fail

        this.elements.container.style.display = 'none';

        if (window.Backchain) {
            window.Backchain.setMenuState();
        }

        UI.setGameOverContent(
            'TIME\'S UP',
            'The chain breaks.',
            'Verses: ' + this.completedVerses.length + ' / ' + this.versesToType.length + '<br>' +
            'Run ' + this.currentRun
        );
        UI.showScreen('gameover-screen');
    },

    continueRun: function() {
        this.currentRun++;
        this.startRun();
    },

    restart: function() {
        this.currentRun = 1;
        this.completedVerses = [];
        this.versesToType = [];
        this.startRun();
    },

    stop: function() {
        this.state = 'inactive';
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }
        if (this.elements.container) {
            this.elements.container.style.display = 'none';
        }
        if (window.Music) window.Music.stop();
    }
};

console.log('TypingGame module loaded');