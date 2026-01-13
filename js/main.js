/**
 * BACKCHAIN - Main Entry Point
 * Updated with Pause Logic
 */

window.Backchain = {
    state: 'title', // title, menu, playing, paused
    currentGame: null,

    init: function() {
        console.log('🎮 Backchain initializing...');
        
        if (!window.Storage || !window.UI) {
            console.error('Core modules missing!');
            return;
        }

        Storage.load();
        Input.init();
        UI.init();
        
        if (window.PlatformerGame) PlatformerGame.init();
        if (window.TypingGame) TypingGame.init();
        if (window.BibleData) BibleData.init();

        // Direct binding for start button
        var startBtn = document.querySelector('[data-action="select-game"]');
        if (startBtn) {
            startBtn.addEventListener('click', function() {
                window.Backchain.handleAction('select-game');
            });
        }

        this.setupButtonHandlers();
        this.showTitleScreen();
        console.log('✅ Backchain ready!');
    },

    setupButtonHandlers: function() {
        var self = this;
        document.addEventListener('click', function(e) {
            var target = e.target.closest('#mute-button, .menu-button, .book-btn, #typing-exit-button, #typing-exit-bar');
            
            if (!target) return;
            
            if (window.Audio && window.Audio.init) {
                window.Audio.init();
                window.Audio.resume();
            }

            if (target.id === 'mute-button') {
                if (window.Audio) window.Audio.toggleMute();
                return;
            }

            // Don't play click sound for exit buttons (let the action handle it or silent)
            if (!target.id.includes('exit')) {
                if (window.Audio) window.Audio.playMenuClick();
            }
            
            var action = target.getAttribute('data-action');
            if (action) {
                self.handleAction(action);
            }
        });
    },

    handleAction: function(action) {
        switch (action) {
            case 'toggle-mute':
                if (window.Audio) window.Audio.toggleMute();
                break;

            case 'select-game': this.showGameSelect(); break;
            case 'platformer': this.showPlatformerModes(); break;
            case 'typing': this.showTypingModes(); break;
            case 'back-to-title': this.showTitleScreen(); break;
            
            case 'mode-classic': this.startPlatformer('classic'); break;
            case 'mode-adaptive': this.startPlatformer('adaptive'); break;
            case 'mode-speedrun': this.startPlatformer('speedrun'); break;
            case 'back-to-games': this.showGameSelect(); break;
            
            case 'typing-classic': this.startTyping('classic'); break;
            case 'typing-adaptive': this.startTyping('adaptive'); break;
            case 'typing-zen': this.startTyping('zen'); break;
            case 'select-book': this.showBibleSelect(); break;
            case 'back-to-typing-modes': this.showTypingModes(); break;

            // PAUSE / GAMEPLAY ACTIONS
            case 'resume':
                this.resumeGame();
                break;
            case 'restart':
                this.retry();
                break;
            case 'quit':
                this.quitGame();
                break;
            case 'retry':
                this.retry();
                break;
            case 'continue':
                this.continueRun();
                break;
            case 'back-to-modes':
                this.backToModes();
                break;
        }
    },

    // ... showTitleScreen, showGameSelect, etc (keep existing) ...
    showTitleScreen: function() {
        this.state = 'title';
        this.currentGame = null;
        if (window.PlatformerGame) PlatformerGame.stop();
        if (window.TypingGame) TypingGame.stop();
        if (window.PlatformerEngine) PlatformerEngine.setVisible(false);
        var tc = document.getElementById('typing-container');
        if (tc) tc.style.display = 'none';
        UI.showScreen('title-screen');
        this.updateModeDescription();
        if (window.Music) window.Music.stop();
    },

    showGameSelect: function() {
        this.state = 'menu';
        UI.showScreen('game-select-screen');
        this.updateModeDescription();
    },

    showPlatformerModes: function() {
        this.state = 'menu';
        this.currentGame = 'platformer';
        UI.showScreen('platformer-mode-screen');
        this.updateModeDescription();
    },

    showTypingModes: function() {
        this.state = 'menu';
        this.currentGame = 'typing';
        UI.showScreen('typing-mode-screen');
        this.updateModeDescription();
    },

    showBibleSelect: function() {
        this.state = 'menu';
        UI.populateBibleMenu();
        UI.showScreen('bible-select-screen');
    },

    startPlatformer: function(mode) {
        this.state = 'playing';
        this.currentGame = 'platformer';
        var tc = document.getElementById('typing-container');
        if (tc) tc.style.display = 'none';
        PlatformerEngine.setVisible(true);
        PlatformerGame.startGame(mode);
    },

    startTyping: function(mode) {
        this.state = 'playing';
        this.currentGame = 'typing';
        PlatformerEngine.setVisible(false);
        PlatformerGame.stop();
        TypingGame.startGame(mode);
    },

    // --- PAUSE LOGIC ---

    togglePause: function() {
        if (this.state === 'playing') {
            this.state = 'paused';
            UI.showScreen('pause-screen');
            Input.exitPointerLock(); // Free mouse
            
            if (this.currentGame === 'platformer') {
                // Platformer might need explicit pause notification
            }
        } else if (this.state === 'paused') {
            this.resumeGame();
        }
    },

    resumeGame: function() {
        this.state = 'playing';
        UI.hideAllScreens();
        
        if (this.currentGame === 'platformer') {
            UI.showHUD(true);
            UI.showMobileControls(true);
            Input.requestPointerLock();
        } else if (this.currentGame === 'typing') {
            // Re-focus input
            var input = document.getElementById('typing-input');
            if (input) input.focus();
        }
    },

    quitGame: function() {
        this.backToModes();
    },

    retry: function() {
        this.state = 'playing';
        UI.hideAllScreens(); // Ensure pause screen is gone
        if (this.currentGame === 'platformer') PlatformerGame.restart();
        else if (this.currentGame === 'typing') TypingGame.restart();
    },

    continueRun: function() {
        this.state = 'playing';
        if (this.currentGame === 'platformer') PlatformerGame.continueRun();
        else if (this.currentGame === 'typing') TypingGame.continueRun();
    },

    backToModes: function() {
        this.state = 'menu';
        if (this.currentGame === 'platformer') {
            PlatformerGame.stop();
            this.showPlatformerModes();
        } else if (this.currentGame === 'typing') {
            TypingGame.stop();
            var tc = document.getElementById('typing-container');
            if (tc) tc.style.display = 'none';
            this.showTypingModes();
        }
    },

    setMenuState: function() {
        this.state = 'menu';
    },

    updateModeDescription: function() {
        var currentBook = (window.BibleData && BibleData.currentBook) ? BibleData.currentBook : 'the entire Bible';
        var bookIndicator = document.getElementById('current-book-indicator');
        if (bookIndicator) bookIndicator.textContent = currentBook.toUpperCase();

        var descriptions = {
            'platformer': 'First-person speedrun platformer. Navigate rooms, master the chain!',
            'typing': 'Type verses from the Bible, building backward from the end.',
            'mode-classic': 'The original experience. Each run adds a new room to the beginning.',
            'mode-adaptive': 'Backchaining with variety! Times adapt to your skill level.',
            'mode-speedrun': 'No time limit. Race through all 8 rooms as fast as possible.',
            'typing-classic': 'Type verses sequentially from the end of ' + currentBook + '.',
            'typing-adaptive': 'Random verses from ' + currentBook + ' with adaptive timing.',
            'typing-zen': 'No timer. Relax and type through ' + currentBook + ' at your own pace.',
            'select-book': 'Choose a different book of the Bible to type.',
            'back-to-games': 'Return to game selection.'
        };
        
        var selectedButton = document.querySelector('.menu-button.selected');
        if (!selectedButton) return;
        var action = selectedButton.getAttribute('data-action');
        var description = descriptions[action];
        var descElements = [document.getElementById('game-description'), document.getElementById('platformer-mode-description'), document.getElementById('typing-mode-description')];
        for (var i = 0; i < descElements.length; i++) {
            if (descElements[i] && descElements[i].offsetParent !== null) descElements[i].textContent = description || '';
        }
    }
};

// Start
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() { window.Backchain.init(); });
} else {
    window.Backchain.init();
}

document.addEventListener('keydown', function(e) {
    // Mute
    if ((e.altKey || e.ctrlKey) && e.code === 'KeyM') {
        e.preventDefault();
        if (window.Audio) window.Audio.toggleMute();
    }
    
    // Global Pause (Escape)
    if (e.code === 'Escape') {
        if (window.Backchain.state === 'playing' || window.Backchain.state === 'paused') {
            e.preventDefault();
            window.Backchain.togglePause();
        }
    }

    setTimeout(function() {
        if (window.Backchain && window.Backchain.updateModeDescription) {
            window.Backchain.updateModeDescription();
        }
    }, 10);
});