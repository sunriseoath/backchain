/**
 * BACKCHAIN - Player Controller
 * Physics v4: Fixed Jumping (Ceiling Check Bug)
 */

window.Player = {
    position: new THREE.Vector3(),
    velocity: new THREE.Vector3(),
    
    onGround: false,
    currentPlatform: null,
    wasOnGround: false,
    
    FEET_WIDTH_RATIO: 0.4,
    STEP_HEIGHT: 0.1,
    
    init: function(x, y, z, facingAngle) {
        this.position.set(x, y + CONFIG.PLAYER_HEIGHT, z);
        this.velocity.set(0, 0, 0);
        this.onGround = false;
        this.wasOnGround = false;
        this.currentPlatform = null;
        if (PlatformerEngine.camera) {
            PlatformerEngine.camera.position.copy(this.position);
            PlatformerEngine.camera.rotation.set(0, facingAngle || Math.PI, 0);
        }
    },

    update: function(delta) {
        this.handleLooking(delta);
        this.handleMovement(delta);
        this.applyPlatformMovement();
        this.applyGravity(delta);
        this.moveWithCollision(delta);
        this.syncCamera();
        this.detectLanding();
    },

    handleLooking: function(delta) {
        var camera = PlatformerEngine.camera;
        
        // Keyboard Turning
        if (Input.isPressed('turnLeft')) camera.rotation.y += CONFIG.KEYBOARD_TURN_SPEED * delta;
        if (Input.isPressed('turnRight')) camera.rotation.y -= CONFIG.KEYBOARD_TURN_SPEED * delta;
        if (Input.isPressed('lookUp')) camera.rotation.x += CONFIG.KEYBOARD_LOOK_SPEED * delta;
        if (Input.isPressed('lookDown')) camera.rotation.x -= CONFIG.KEYBOARD_LOOK_SPEED * delta;
        
        // Mouse / Touch
        if (Input.isPointerLocked || Input.isTouchDevice) {
            camera.rotation.y -= Input.mouseMovement.x * CONFIG.MOUSE_SENSITIVITY;
            camera.rotation.x -= Input.mouseMovement.y * CONFIG.MOUSE_SENSITIVITY;
        }

        // --- NEW: Controller Analog Look ---
        if (Input.gamepadLook) {
            // Speed multiplier for controller (adjust as needed)
            var joySpeed = 2.5; 
            camera.rotation.y -= Input.gamepadLook.x * joySpeed * delta;
            camera.rotation.x -= Input.gamepadLook.y * joySpeed * delta;
        }

        // Clamp Vertical Look
        camera.rotation.x = Utils.clamp(camera.rotation.x, -1.5, 1.5);
        Input.clearMouseMovement();
    },

    handleMovement: function(delta) {
        var camera = PlatformerEngine.camera;
        var forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
        forward.y = 0; forward.normalize();
        var right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
        right.y = 0; right.normalize();

        var moveDir = new THREE.Vector3();
        if (Input.isPressed('forward')) moveDir.add(forward);
        if (Input.isPressed('backward')) moveDir.sub(forward);
        if (Input.isPressed('right')) moveDir.add(right);
        if (Input.isPressed('left')) moveDir.sub(right);
        
        if (Input.joystick.active) {
            moveDir.add(forward.clone().multiplyScalar(-Input.joystick.deltaY));
            moveDir.add(right.clone().multiplyScalar(Input.joystick.deltaX));
        }

        if (moveDir.length() > 0) moveDir.normalize().multiplyScalar(CONFIG.MOVE_SPEED);

        this.velocity.x = moveDir.x;
        this.velocity.z = moveDir.z;

        if (Input.isPressed('jump') && this.onGround) {
            this.velocity.y = CONFIG.JUMP_FORCE;
            this.onGround = false;
            this.currentPlatform = null;
            if (window.Audio) window.Audio.playJump();
        }
    },

    applyPlatformMovement: function() {
        if (this.currentPlatform && this.onGround) {
            this.position.x += this.currentPlatform.deltaX || 0;
            this.position.y += this.currentPlatform.deltaY || 0;
            this.position.z += this.currentPlatform.deltaZ || 0;
        }
    },

    applyGravity: function(delta) {
        this.velocity.y -= CONFIG.GRAVITY * delta;
    },

    moveWithCollision: function(delta) {
        var movement = this.velocity.clone().multiplyScalar(delta);
        
        // Sync moving platforms
        for (var i = 0; i < PlatformerEngine.movingPlatforms.length; i++) {
            var mp = PlatformerEngine.movingPlatforms[i];
            if (mp.collider && mp.mesh) {
                mp.mesh.updateMatrixWorld(true);
                mp.collider.box.setFromObject(mp.mesh);
            }
        }
        
        this.wasOnGround = this.onGround;
        this.onGround = false;
        this.currentPlatform = null;

        // 1. Vertical Movement
        var previousFeetY = this.position.y - CONFIG.PLAYER_HEIGHT;
        var previousHeadY = this.position.y + 0.2;
        
        this.position.y += movement.y;
        
        var currentFeetY = this.position.y - CONFIG.PLAYER_HEIGHT;
        var currentHeadY = this.position.y + 0.2;
        
        // Create a sweep box for vertical movement
        var feetBox = this.getPlayerBox(this.FEET_WIDTH_RATIO);
        feetBox.min.y = Math.min(previousFeetY, currentFeetY);
        feetBox.max.y = Math.max(previousHeadY, currentHeadY);

        for (var i = 0; i < PlatformerEngine.colliders.length; i++) {
            var col = PlatformerEngine.colliders[i];
            
            // Only collide with floor/ceiling objects in this pass
            if (feetBox.intersectsBox(col.box)) {
                
                // LANDING (Moving Down)
                // Condition: previously ABOVE the platform top
                if (movement.y < 0 && previousFeetY >= col.box.max.y - this.STEP_HEIGHT) {
                    if (col.isFloor) {
                        this.position.y = col.box.max.y + CONFIG.PLAYER_HEIGHT;
                        this.velocity.y = 0;
                        this.onGround = true;
                        if (col.movingPlatformRef) this.currentPlatform = col.movingPlatformRef;
                    }
                } 
                // CEILING (Moving Up)
                // Condition: previously BELOW the platform bottom
                else if (movement.y > 0 && previousHeadY <= col.box.min.y + 0.1) {
                    this.position.y = col.box.min.y - 0.2;
                    this.velocity.y = 0;
                }
            }
        }

        // 2. Horizontal Movement
        // We use full body width
        var bodyBox = this.getPlayerBox(1.0);
        
        // X
        this.position.x += movement.x;
        bodyBox = this.getPlayerBox(1.0);
        for (var i = 0; i < PlatformerEngine.colliders.length; i++) {
            var col = PlatformerEngine.colliders[i];
            if (bodyBox.intersectsBox(col.box)) {
                // Ignore floors we are currently standing on top of
                // (prevents feet getting stuck in the floor surface)
                var isStandingOn = (this.position.y - CONFIG.PLAYER_HEIGHT) >= col.box.max.y - 0.1;
                
                if (!col.isFloor || !isStandingOn) {
                    this.position.x -= movement.x;
                    bodyBox = this.getPlayerBox(1.0);
                    break;
                }
            }
        }

        // Z
        this.position.z += movement.z;
        bodyBox = this.getPlayerBox(1.0);
        for (var i = 0; i < PlatformerEngine.colliders.length; i++) {
            var col = PlatformerEngine.colliders[i];
            if (bodyBox.intersectsBox(col.box)) {
                var isStandingOn = (this.position.y - CONFIG.PLAYER_HEIGHT) >= col.box.max.y - 0.1;
                
                if (!col.isFloor || !isStandingOn) {
                    this.position.z -= movement.z;
                    bodyBox = this.getPlayerBox(1.0);
                    break;
                }
            }
        }
    },

    getPlayerBox: function(widthRatio) {
        widthRatio = widthRatio || 1.0;
        var r = CONFIG.PLAYER_RADIUS * widthRatio;
        return new THREE.Box3(
            new THREE.Vector3(
                this.position.x - r,
                this.position.y - CONFIG.PLAYER_HEIGHT,
                this.position.z - r
            ),
            new THREE.Vector3(
                this.position.x + r,
                this.position.y + 0.2,
                this.position.z + r
            )
        );
    },

    syncCamera: function() {
        if (PlatformerEngine.camera) {
            PlatformerEngine.camera.position.copy(this.position);
        }
    },

    detectLanding: function() {
        if (this.onGround && !this.wasOnGround && this.velocity.y <= 0) {
            if (window.Audio) window.Audio.playLand();
        }
    },

    hasFallen: function() {
        return this.position.y < -10;
    },

    getFeetPosition: function() {
        return new THREE.Vector3(
            this.position.x,
            this.position.y - CONFIG.PLAYER_HEIGHT / 2,
            this.position.z
        );
    }
};