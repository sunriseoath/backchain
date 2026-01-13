/**
 * BACKCHAIN - UI System
 * Updated to fix overlay visibility
 */

window.UI = {
    currentScreen: null,
    hudElements: {},

    init: function() {
        this.hudElements = {
            timer: document.getElementById('timer-display'),
            runInfo: document.getElementById('run-info'),
            runNumber: document.querySelector('#run-info .run-number'),
            modeIndicator: document.getElementById('mode-indicator'),
            roomName: document.getElementById('room-name'),
            roomProgress: document.getElementById('room-progress'),
            parInfo: document.getElementById('par-info'),
            roomFlash: document.getElementById('room-flash'),
            bestRun: document.getElementById('best-run'),
            splitsDisplay: document.getElementById('splits-display'),
            crosshair: document.getElementById('crosshair'),
            controlsHelp: document.getElementById('controls-help')
        };
        
        // Ensure HUD starts hidden
        this.showHUD(false);
    },

    showScreen: function(screenId) {
        this.hideAllScreens();
        
        // FIX: Always hide HUD when showing a menu screen
        this.showHUD(false);
        
        var screen = document.getElementById(screenId);
        if (screen) {
            screen.style.display = 'flex';
            this.currentScreen = screenId;
            if (window.Input && window.Input.setMenuButtons) {
                var buttons = Array.from(screen.querySelectorAll('.menu-button'));
                window.Input.setMenuButtons(buttons);
            }
            if (window.Input && window.Input.blockInput) {
                window.Input.blockInput(300);
            }
        }
    },

    hideAllScreens: function() {
        if (document.activeElement && document.activeElement !== document.body) {
            document.activeElement.blur();
        }
        document.querySelectorAll('.screen-overlay').forEach(function(s) {
            s.style.display = 'none';
        });
        this.currentScreen = null;
    },

    showHUD: function(visible) {
        var overlay = document.getElementById('ui-overlay');
        if (overlay) {
            overlay.style.display = visible ? 'block' : 'none';
            // Force reset opacity in case it was modified
            overlay.style.opacity = visible ? '1' : '0';
        }
    },

    showMobileControls: function(visible) {
        var controls = document.getElementById('mobile-controls');
        if (controls && Utils.isTouchDevice()) {
            controls.style.display = visible ? 'block' : 'none';
        }
    },

    // ... rest of the file (updateTimer, updateRunInfo, etc.) remains the same ...
    updateTimer: function(time, mode) {
        if (!this.hudElements.timer) return;

        if (mode === 'speedrun') {
            this.hudElements.timer.textContent = Utils.formatTime(time);
            this.hudElements.timer.className = 'speedrun';
        } else {
            this.hudElements.timer.textContent = Utils.formatTimeShort(Math.max(0, time));
            this.hudElements.timer.classList.remove('speedrun', 'warning', 'danger');
            if (time < 5) this.hudElements.timer.classList.add('danger');
            else if (time < 10) this.hudElements.timer.classList.add('warning');
        }
    },

    updateRunInfo: function(runNumber, modeName) {
        if (modeName === 'speedrun') {
            if (this.hudElements.runInfo) this.hudElements.runInfo.innerHTML = 'SPEED<br>RUN';
        } else {
            if (this.hudElements.runInfo) this.hudElements.runInfo.innerHTML = 'RUN<br><span class="run-number">' + runNumber + '</span>';
        }
        if (this.hudElements.modeIndicator) this.hudElements.modeIndicator.textContent = modeName.toUpperCase();
    },

    updateRoomInfo: function(roomName, roomIndex, totalRooms, accentColor, parTime) {
        if (this.hudElements.roomName) {
            this.hudElements.roomName.textContent = roomName;
            this.hudElements.roomName.style.color = Utils.hexToCSS(accentColor);
        }
        if (this.hudElements.roomProgress) {
            this.hudElements.roomProgress.textContent = 'Room ' + (roomIndex + 1) + ' / ' + totalRooms;
        }
        if (this.hudElements.parInfo) {
            this.hudElements.parInfo.textContent = parTime ? 'Par: ' + parTime.toFixed(2) + 's' : '';
        }
    },

    showRoomFlash: function(name, symbol, accentColor) {
        if (!this.hudElements.roomFlash) return;
        var flash = this.hudElements.roomFlash;
        flash.textContent = symbol + ' ' + name;
        flash.style.color = Utils.hexToCSS(accentColor);
        flash.style.textShadow = '0 0 30px ' + Utils.hexToCSS(accentColor);
        flash.style.opacity = '1';
        setTimeout(function() { flash.style.opacity = '0'; }, 1500);
    },

    updateBestRun: function(text) {
        if (this.hudElements.bestRun) this.hudElements.bestRun.textContent = text;
    },

    updateSplits: function(splits, roomTimes) {
        if (!this.hudElements.splitsDisplay) return;
        var html = splits.slice(-5).map(function(split) {
            var pb = roomTimes[split.roomId] ? roomTimes[split.roomId].best : null;
            var className = '';
            if (pb && split.time <= pb) className = 'ahead';
            else if (pb) className = 'behind';
            return '<div class="split-time ' + className + '">' + split.symbol + ' ' + split.time.toFixed(2) + 's</div>';
        }).join('');
        this.hudElements.splitsDisplay.innerHTML = html;
    },

    clearSplits: function() {
        if (this.hudElements.splitsDisplay) this.hudElements.splitsDisplay.innerHTML = '';
    },

    setGameOverContent: function(title, subtitle, stats) {
        var titleEl = document.getElementById('gameover-title');
        var subtitleEl = document.getElementById('gameover-subtitle');
        var statsEl = document.getElementById('gameover-stats');
        if (titleEl) titleEl.textContent = title;
        if (subtitleEl) subtitleEl.textContent = subtitle;
        if (statsEl) statsEl.innerHTML = stats;
    },

    setVictoryContent: function(subtitle, stats) {
        var subtitleEl = document.getElementById('victory-subtitle');
        var statsEl = document.getElementById('victory-stats');
        if (subtitleEl) subtitleEl.textContent = subtitle;
        if (statsEl) statsEl.innerHTML = stats;
    },

    populateBibleMenu: function() {
        var container = document.getElementById('bible-categories');
        if (!container) return;
        container.innerHTML = '';
        
        var allBtn = document.createElement('button');
        allBtn.className = 'book-btn master-book-btn';
        allBtn.textContent = 'The Entire Bible';
        allBtn.onclick = function() {
            BibleData.setBook('the entire Bible');
            Backchain.showTypingModes();
        };
        container.appendChild(allBtn);

        for (var category in BibleData.library) {
            var header = document.createElement('div');
            header.className = 'category-header';
            header.textContent = category;
            container.appendChild(header);
            
            var books = BibleData.library[category];
            books.forEach(function(book) {
                var btn = document.createElement('button');
                btn.className = 'book-btn';
                btn.textContent = book;
                btn.onclick = function() {
                    BibleData.setBook(book);
                    Backchain.showTypingModes();
                };
                container.appendChild(btn);
            });
        }
    }
};