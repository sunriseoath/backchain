/**
 * BACKCHAIN - Platformer Game Logic
 * Updated with UI Visibility Fix
 */

window.PlatformerGame = {
    state: 'inactive',
    mode: 'classic',
    currentRun: 1,
    totalRooms: 1,
    currentRoomIndex: 0,
    timeRemaining: 0,
    speedrunTime: 0,
    currentRoomStartTime: 0,
    currentRunSplits: [],
    lastWarningTime: 10,
    adaptiveRoomSequence: [],
    animationFrameId: null,
    lastFrameTime: 0,

    init: function() {
        if (window.PlatformerEngine) {
            PlatformerEngine.init();
            console.log('PlatformerGame initialized');
        } else {
            console.error('PlatformerEngine not found!');
        }
    },

    startGame: function(mode) {
        this.mode = mode;
        this.currentRun = 1;
        this.adaptiveRoomSequence = [];
        if (mode === 'speedrun') {
            this.totalRooms = RoomManager.getAllTemplates().length;
        } else {
            this.totalRooms = 1;
        }
        this.startRun();
    },

    startRun: function() {
        this.state = 'playing';
        this.currentRoomIndex = 0;
        this.currentRunSplits = [];
        this.speedrunTime = 0;
        this.lastWarningTime = 10;

        PlatformerEngine.clearLevel();
        this.generateRooms();

        if (PlatformerEngine.rooms.length > 0) {
            var startPos = PlatformerEngine.rooms[0].startPosition;
            Player.init(startPos.x, startPos.y, startPos.z, Math.PI);
        }

        if (this.mode === 'classic') {
            this.timeRemaining = (this.totalRooms * CONFIG.BASE_TIME_PER_ROOM) +
                                 (this.currentRun * CONFIG.TIME_BONUS_PER_RUN);
        } else if (this.mode === 'adaptive') {
            this.timeRemaining = this.calculateAdaptiveTime();
        } else {
            this.timeRemaining = Infinity;
        }

        this.currentRoomStartTime = performance.now();

        // --- UI VISIBILITY FIX ---
        UI.hideAllScreens();
        
        // Force the overlay to be visible manually
        var overlay = document.getElementById('ui-overlay');
        if (overlay) {
            overlay.style.display = 'block';
            overlay.style.opacity = '1';
            overlay.style.visibility = 'visible';
        }
        
        // Also call standard helpers
        UI.showHUD(true);
        UI.showMobileControls(true);
        UI.updateRunInfo(this.currentRun, this.mode);
        this.updateRoomUI();
        this.updateBestDisplay();
        // -------------------------

        Input.requestPointerLock();

        if (PlatformerEngine.rooms.length > 0) {
            var firstRoom = PlatformerEngine.rooms[0];
            PlatformerEngine.setFogColor(firstRoom.template.fogColor);
            UI.showRoomFlash(
                firstRoom.template.name,
                firstRoom.template.symbol,
                firstRoom.template.accentColor
            );
            if (window.Audio) window.Audio.playRoomEnter(firstRoom.template.accentColor);
            if (window.Music) window.Music.start(firstRoom.template.id);
        }

        this.lastFrameTime = performance.now();
        this.gameLoop();
    },

    generateRooms: function() {
        var templateOrder = [];
        var allTemplates = RoomManager.getAllTemplates();

        if (this.mode === 'classic') {
            for (var i = 0; i < this.totalRooms; i++) {
                templateOrder.push(RoomManager.getTemplateAt(i));
            }
            templateOrder.reverse();
        } else if (this.mode === 'adaptive') {
            if (this.adaptiveRoomSequence.length < this.totalRooms) {
                var usedIds = this.adaptiveRoomSequence.map(function(t) { return t.id; });
                var available = allTemplates.filter(function(t) { return usedIds.indexOf(t.id) === -1; });
                var pool = available.length > 0 ? available : allTemplates;
                var newRoom = pool[Math.floor(Math.random() * pool.length)];
                this.adaptiveRoomSequence.unshift(newRoom);
            }
            templateOrder = this.adaptiveRoomSequence.slice();
        } else if (this.mode === 'speedrun') {
            templateOrder = allTemplates.slice();
        }

        for (var j = 0; j < this.totalRooms; j++) {
            var template = templateOrder[j];
            if (!template) template = allTemplates[0];
            var zOffset = j * CONFIG.ROOM_LENGTH;
            var isFirst = (j === 0);
            var isLast = (j === this.totalRooms - 1);
            var room = RoomManager.createRoom(template, zOffset, j, isFirst, isLast);
            PlatformerEngine.addRoom(room);
        }
    },

    calculateAdaptiveTime: function() {
        var roomTimes = Storage.data.platformer.roomTimes;
        var total = 0;
        for (var i = 0; i < PlatformerEngine.rooms.length; i++) {
            var room = PlatformerEngine.rooms[i];
            var roomId = room.template.id;
            if (roomTimes[roomId] && roomTimes[roomId].best) {
                total += roomTimes[roomId].best * CONFIG.ADAPTIVE_BUFFER;
            } else {
                total += CONFIG.ADAPTIVE_BASE_TIME;
            }
        }
        return Math.max(total, this.totalRooms * CONFIG.ADAPTIVE_MIN_TIME);
    },

    gameLoop: function() {
        var self = this;
        this.animationFrameId = requestAnimationFrame(function() { self.gameLoop(); });

        if (window.Backchain.state === 'paused') return;
        if (this.state !== 'playing') return;

        var currentTime = performance.now();
        var delta = Math.min((currentTime - this.lastFrameTime) / 1000, 0.1);
        this.lastFrameTime = currentTime;

        Input.pollGamepad();
        this.update(delta);
        PlatformerEngine.render();
    },

    update: function(delta) {
        Player.update(delta);
        PlatformerEngine.updateMovingPlatforms(delta);
        this.updateTimer(delta);
        this.checkTriggers();
        if (Player.hasFallen()) this.gameOver();
    },

    updateTimer: function(delta) {
        if (this.mode === 'speedrun') {
            this.speedrunTime += delta;
            UI.updateTimer(this.speedrunTime, 'speedrun');
        } else {
            this.timeRemaining -= delta;
            UI.updateTimer(this.timeRemaining, 'countdown');
            if (this.timeRemaining < 5 && this.lastWarningTime >= 5) {
                if (window.Audio) window.Audio.playWarning();
            }
            if (this.timeRemaining < 3 && this.lastWarningTime >= 3) {
                if (window.Audio) window.Audio.playWarning();
            }
            this.lastWarningTime = this.timeRemaining;
            if (this.timeRemaining <= 0) this.gameOver();
        }
    },

    checkTriggers: function() {
        var playerPos = Player.getFeetPosition();
        var triggered = PlatformerEngine.checkTriggers(playerPos);
        for (var i = 0; i < triggered.length; i++) {
            var trigger = triggered[i];
            if (trigger.type === 'room_end' && trigger.roomIndex === this.currentRoomIndex) {
                this.onRoomComplete();
            }
        }
    },

    onRoomComplete: function() {
        var splitTime = (performance.now() - this.currentRoomStartTime) / 1000;
        var roomTemplate = PlatformerEngine.rooms[this.currentRoomIndex].template;
        this.currentRunSplits.push({
            roomId: roomTemplate.id,
            symbol: roomTemplate.symbol,
            time: splitTime
        });

        var roomTimes = Storage.data.platformer.roomTimes;
        if (!roomTimes[roomTemplate.id]) {
            roomTimes[roomTemplate.id] = { best: splitTime, attempts: 1 };
        } else {
            roomTimes[roomTemplate.id].attempts++;
            if (splitTime < roomTimes[roomTemplate.id].best) {
                roomTimes[roomTemplate.id].best = splitTime;
            }
        }
        Storage.save();

        if (this.mode === 'speedrun') UI.updateSplits(this.currentRunSplits, roomTimes);

        this.currentRoomIndex++;
        this.currentRoomStartTime = performance.now();

        if (this.currentRoomIndex >= this.totalRooms) {
            if (window.Music) window.Music.stop();
            if (this.mode === 'speedrun') this.speedrunComplete();
            else this.victory();
        } else {
            var nextRoom = PlatformerEngine.rooms[this.currentRoomIndex];
            UI.showRoomFlash(nextRoom.template.name, nextRoom.template.symbol, nextRoom.template.accentColor);
            if (window.Audio) window.Audio.playRoomEnter(nextRoom.template.accentColor);
            if (window.Music) window.Music.start(nextRoom.template.id);
            PlatformerEngine.setFogColor(nextRoom.template.fogColor);
            this.updateRoomUI();
        }
    },

    updateRoomUI: function() {
        var room = PlatformerEngine.rooms[this.currentRoomIndex];
        var roomTimes = Storage.data.platformer.roomTimes;
        var parTime = roomTimes[room.template.id] ? roomTimes[room.template.id].best : null;
        UI.updateRoomInfo(room.template.name, this.currentRoomIndex, this.totalRooms, room.template.accentColor, this.mode === 'adaptive' ? parTime : null);
    },

    updateBestDisplay: function() {
        if (this.mode === 'speedrun') {
            var key = 'speedrun_' + this.totalRooms;
            var pb = Storage.data.platformer.personalBests[key];
            UI.updateBestRun(pb ? 'PB: ' + Utils.formatTime(pb) : 'PB: --');
        } else {
            var best = Storage.data.platformer.bestRun;
            UI.updateBestRun(best > 0 ? 'BEST: Run ' + best : 'BEST: --');
        }
    },

    victory: function() {
        this.state = 'inactive';
        Input.exitPointerLock();
        if (window.Audio) window.Audio.playVictory();
        UI.showMobileControls(false);
        if (window.Backchain) window.Backchain.setMenuState();

        var subtitle, stats;
        if (this.mode === 'classic') {
            subtitle = 'Chain extended.';
            stats = 'Time remaining: ' + this.timeRemaining.toFixed(2) + 's<br>Rooms cleared: ' + this.totalRooms;
        } else if (this.mode === 'adaptive') {
            var parTime = this.calculateAdaptiveTime();
            var usedTime = parTime - this.timeRemaining;
            var efficiency = Math.max(0, 100 - (usedTime / parTime * 100)).toFixed(0);
            subtitle = this.timeRemaining > 0 ? 'Under par!' : 'Run complete!';
            stats = 'Time: ' + usedTime.toFixed(2) + 's / ' + parTime.toFixed(2) + 's<br>Efficiency: ' + efficiency + '%';
        }
        UI.setVictoryContent(subtitle, stats);
        UI.showScreen('victory-screen');
    },

    speedrunComplete: function() {
        this.state = 'inactive';
        Input.exitPointerLock();
        if (window.Audio) window.Audio.playVictory();
        UI.showMobileControls(false);
        if (window.Backchain) window.Backchain.setMenuState();

        var key = 'speedrun_' + this.totalRooms;
        var pb = Storage.data.platformer.personalBests[key];
        var isNewPB = !pb || this.speedrunTime < pb;
        if (isNewPB) {
            Storage.data.platformer.personalBests[key] = this.speedrunTime;
            Storage.save();
        }

        var finalTimeEl = document.getElementById('final-time');
        var pbMessageEl = document.getElementById('pb-message');
        if (finalTimeEl) finalTimeEl.textContent = Utils.formatTime(this.speedrunTime);
        if (pbMessageEl) {
            pbMessageEl.textContent = isNewPB ? '🎉 NEW PERSONAL BEST!' : 'Personal Best: ' + Utils.formatTime(pb);
            pbMessageEl.style.color = isNewPB ? '#ffcc00' : '#888';
        }
        UI.showScreen('speedrun-complete-screen');
    },

    gameOver: function() {
        this.state = 'inactive';
        Input.exitPointerLock();
        if (window.Audio) window.Audio.playGameOver();
        if (window.Music) window.Music.stop();
        UI.showMobileControls(false);
        if (window.Backchain) window.Backchain.setMenuState();

        if (this.mode === 'classic' && this.currentRun > Storage.data.platformer.bestRun) {
            Storage.data.platformer.bestRun = this.currentRun;
            Storage.save();
        }

        var stats;
        if (this.mode === 'speedrun') {
            stats = 'Failed at Room ' + (this.currentRoomIndex + 1) + '<br>' + 'Time: ' + Utils.formatTime(this.speedrunTime);
        } else {
            stats = 'You reached ' + this.totalRooms + ' rooms<br>' + 'Run ' + this.currentRun;
            if (this.mode === 'adaptive') stats += '<br><span style="font-size:14px; color:#888;">(Difficulty adjusted)</span>';
        }
        UI.setGameOverContent('TIME\'S UP', 'The chain breaks.', stats);
        UI.showScreen('gameover-screen');
    },

    continueRun: function() {
        this.currentRun++;
        if (this.mode !== 'speedrun') this.totalRooms++;
        this.startRun();
    },

    restart: function() {
        if (this.mode === 'speedrun') this.totalRooms = RoomManager.getAllTemplates().length;
        else {
            this.currentRun = 1;
            this.totalRooms = 1;
            this.adaptiveRoomSequence = [];
        }
        this.startRun();
    },

    stop: function() {
        this.state = 'inactive';
        if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
        Input.exitPointerLock();
        PlatformerEngine.setVisible(false);
        UI.showHUD(false);
        UI.showMobileControls(false);
        UI.clearSplits();
        if (window.Music) window.Music.stop();
    }
};

console.log('PlatformerGame module loaded');