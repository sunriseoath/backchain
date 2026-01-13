/**
 * BACKCHAIN - Input System
 * Updated with Full Controller Support (Menus + Game)
 */

window.Input = {
    keys: {},
    mouseMovement: { x: 0, y: 0 },
    isPointerLocked: false,
    isTouchDevice: false,
    
    // Gamepad State
    gamepadIndex: null,
    lastGamepadInput: 0, // For menu debounce
    deadzone: 0.2,       // Ignore stick movement under 20%

    // Touch controls state
    joystick: { active: false, deltaX: 0, deltaY: 0 },
    look: { touchId: null, lastX: 0, lastY: 0 },
    jumpPressed: false,

    // Menu navigation
    menuIndex: 0,
    menuButtons: [],
    
    // Input Blocking (for smooth transitions)
    inputBlockedUntil: 0,

    init: function() {
        var self = this;
        
        this.isTouchDevice = Utils.isTouchDevice();
        if (this.isTouchDevice) document.body.classList.add('touch-enabled');

        // Keyboard & Mouse
        document.addEventListener('keydown', function(e) { self.onKeyDown(e); });
        document.addEventListener('keyup', function(e) { self.onKeyUp(e); });
        document.addEventListener('mousemove', function(e) { self.onMouseMove(e); });
        document.addEventListener('click', function(e) { self.onClick(e); });
        document.addEventListener('pointerlockchange', function() { self.onPointerLockChange(); });

        // Gamepad Events
        window.addEventListener('gamepadconnected', function(e) {
            self.gamepadIndex = e.gamepad.index;
            console.log('🎮 Controller Connected:', e.gamepad.id);
            // Quick vibration to confirm connection
            if (e.gamepad.vibrationActuator) {
                e.gamepad.vibrationActuator.playEffect("dual-rumble", {
                    startDelay: 0, duration: 200, weakMagnitude: 0.5, strongMagnitude: 0.5
                });
            }
        });
        
        window.addEventListener('gamepaddisconnected', function() {
            self.gamepadIndex = null;
            console.log('🎮 Controller Disconnected');
        });

        if (this.isTouchDevice) this.setupTouchControls();
        
        // Start Global Input Loop
        this.update();
        
        console.log('Input system initialized');
    },

    blockInput: function(duration) {
        this.inputBlockedUntil = performance.now() + duration;
    },

    isInputBlocked: function() {
        return performance.now() < this.inputBlockedUntil;
    },

    /**
     * GLOBAL INPUT LOOP
     * Runs constantly to handle menu navigation and state updates
     */
    update: function() {
        this.pollGamepad();
        
        var self = this;
        requestAnimationFrame(function() { self.update(); });
    },

    pollGamepad: function() {
        if (this.gamepadIndex === null) {
            // Try to find a gamepad if we missed the event
            var gps = navigator.getGamepads ? navigator.getGamepads() : [];
            for (var i = 0; i < gps.length; i++) {
                if (gps[i]) {
                    this.gamepadIndex = i;
                    break;
                }
            }
            if (this.gamepadIndex === null) return;
        }

        var gp = navigator.getGamepads()[this.gamepadIndex];
        if (!gp) return;

        var now = performance.now();

        // --- MENU NAVIGATION ---
        if (window.Backchain && window.Backchain.state === 'menu' || window.Backchain.state === 'title') {
            if (this.isInputBlocked()) return;

            // Debounce menu inputs (wait 200ms between moves)
            if (now - this.lastGamepadInput > 200) {
                var axisY = gp.axes[1] || 0;
                var dpadUp = gp.buttons[12] && gp.buttons[12].pressed;
                var dpadDown = gp.buttons[13] && gp.buttons[13].pressed;
                var btnA = gp.buttons[0] && gp.buttons[0].pressed; // Xbox A / PS X

                // Up
                if (axisY < -0.5 || dpadUp) {
                    this.navigateMenu(-1);
                    this.lastGamepadInput = now;
                } 
                // Down
                else if (axisY > 0.5 || dpadDown) {
                    this.navigateMenu(1);
                    this.lastGamepadInput = now;
                }
                // Select
                else if (btnA) {
                    this.selectMenuItem();
                    this.lastGamepadInput = now;
                }
            }
        } 
        // --- IN-GAME STATE ---
        else if (window.Backchain && window.Backchain.state === 'playing') {
            // Map Analog Sticks to Keys for Player.js
            var leftX = gp.axes[0] || 0;
            var leftY = gp.axes[1] || 0;
            var rightX = gp.axes[2] || 0;
            var rightY = gp.axes[3] || 0;

            // Apply Deadzone
            if (Math.abs(leftX) < this.deadzone) leftX = 0;
            if (Math.abs(leftY) < this.deadzone) leftY = 0;
            if (Math.abs(rightX) < this.deadzone) rightX = 0;
            if (Math.abs(rightY) < this.deadzone) rightY = 0;

            this.keys['GamepadForward'] = leftY < -0.1;
            this.keys['GamepadBackward'] = leftY > 0.1;
            this.keys['GamepadLeft'] = leftX < -0.1;
            this.keys['GamepadRight'] = leftX > 0.1;
            
            // Jump (Button 0 = A, Button 1 = B, etc.)
            this.keys['GamepadJump'] = (gp.buttons[0] && gp.buttons[0].pressed);

            // Store raw analog values for camera smoothing
            this.gamepadLook = { x: rightX, y: rightY };
        }
    },

    setMenuButtons: function(buttons) {
        this.menuButtons = buttons;
        this.menuIndex = 0;
        this.updateMenuSelection();
    },

    navigateMenu: function(direction) {
        if (this.menuButtons.length === 0) return;
        this.menuIndex = (this.menuIndex + direction + this.menuButtons.length) % this.menuButtons.length;
        this.updateMenuSelection();
        if (window.Audio) window.Audio.playMenuHover();
        if (window.Backchain && window.Backchain.updateModeDescription) {
            window.Backchain.updateModeDescription();
        }
    },

    updateMenuSelection: function() {
        var buttons = document.querySelectorAll('.menu-button, .book-btn');
        for (var i = 0; i < buttons.length; i++) {
            buttons[i].classList.remove('selected');
        }
        if (this.menuButtons[this.menuIndex]) {
            this.menuButtons[this.menuIndex].classList.add('selected');
            // Auto-scroll to selected element if in a list
            this.menuButtons[this.menuIndex].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
    },

    selectMenuItem: function() {
        if (this.menuButtons[this.menuIndex]) {
            this.menuButtons[this.menuIndex].click();
        }
    },

    onKeyDown: function(e) {
        if (this.isInputBlocked()) return;
        this.keys[e.code] = true;
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();

        // Keyboard Menu Nav
        if (window.Backchain && (window.Backchain.state === 'menu' || window.Backchain.state === 'title')) {
            if (e.code === 'ArrowUp' || e.code === 'KeyW') this.navigateMenu(-1);
            else if (e.code === 'ArrowDown' || e.code === 'KeyS') this.navigateMenu(1);
            else if (e.code === 'Space' || e.code === 'Enter') {
                e.preventDefault();
                this.selectMenuItem();
            }
        }
    },

    onKeyUp: function(e) { this.keys[e.code] = false; },

    onMouseMove: function(e) {
        if (this.isPointerLocked) {
            this.mouseMovement.x = e.movementX;
            this.mouseMovement.y = e.movementY;
        }
    },

    onClick: function(e) {
        if (this.isInputBlocked()) return;
        if (window.Audio) { window.Audio.init(); window.Audio.resume(); }
        if (window.Backchain && window.Backchain.state === 'playing' && 
            window.Backchain.currentGame === 'platformer' && !this.isPointerLocked && !this.isTouchDevice) {
            document.body.requestPointerLock();
        }
    },

    onPointerLockChange: function() {
        this.isPointerLocked = document.pointerLockElement === document.body;
    },

    isPressed: function(action) {
        switch (action) {
            case 'forward': return this.keys['KeyW'] || this.keys['GamepadForward'];
            case 'backward': return this.keys['KeyS'] || this.keys['GamepadBackward'];
            case 'left': return this.keys['KeyA'] || this.keys['GamepadLeft'];
            case 'right': return this.keys['KeyD'] || this.keys['GamepadRight'];
            case 'jump': return this.keys['Space'] || this.keys['GamepadJump'] || this.jumpPressed;
            case 'turnLeft': return this.keys['KeyQ'] || this.keys['ArrowLeft'];
            case 'turnRight': return this.keys['KeyE'] || this.keys['ArrowRight'];
            case 'lookUp': return this.keys['ArrowUp'];
            case 'lookDown': return this.keys['ArrowDown'];
            default: return this.keys[action];
        }
    },

    clearMouseMovement: function() {
        this.mouseMovement.x = 0;
        this.mouseMovement.y = 0;
    },

    setupTouchControls: function() { /* ... (Keep existing touch logic) ... */ },
    
    requestPointerLock: function() { if (!this.isTouchDevice) document.body.requestPointerLock(); },
    exitPointerLock: function() { document.exitPointerLock(); }
};