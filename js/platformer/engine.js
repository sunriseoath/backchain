/**
 * BACKCHAIN - Platformer Engine
 * Three.js scene setup and rendering
 */

window.PlatformerEngine = {
    scene: null,
    camera: null,
    renderer: null,
    
    // Room management
    rooms: [],
    colliders: [],
    triggers: [],
    movingPlatforms: [],

    /**
     * Initialize Three.js scene
     */
    init() {
        // Scene
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.Fog(0x000000, 10, 80);

        // Camera (first-person)
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.rotation.order = 'YXZ';
        this.camera.position.set(0, CONFIG.PLAYER_HEIGHT, 0);

        // Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        // Insert canvas
        const container = document.getElementById('game-container');
        const uiOverlay = document.getElementById('ui-overlay');
        container.insertBefore(this.renderer.domElement, uiOverlay);

        // Ambient light
        const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
        this.scene.add(ambientLight);

        // Handle resize
        window.addEventListener('resize', () => this.onResize());
    },

    /**
     * Handle window resize
     */
    onResize() {
        if (!this.camera || !this.renderer) return;
        
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    },

    /**
     * Render frame
     */
    render() {
        if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
        }
    },

    /**
     * Clear all rooms from scene
     */
    clearLevel() {
        for (const room of this.rooms) {
            this.scene.remove(room.group);
            // Dispose geometries and materials
            room.group.traverse((child) => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(m => m.dispose());
                    } else {
                        child.material.dispose();
                    }
                }
            });
        }
        this.rooms = [];
        this.colliders = [];
        this.triggers = [];
        this.movingPlatforms = [];
    },

    /**
     * Set fog color
     */
    setFogColor(color) {
        if (this.scene.fog) {
            this.scene.fog.color.setHex(color);
        }
    },

    /**
     * Add room to scene
     */
    addRoom(roomData) {
        this.scene.add(roomData.group);
        this.rooms.push(roomData);
        
        // Register colliders
        if (roomData.colliders) {
            this.colliders.push(...roomData.colliders);
        }
        
        // Register triggers
        if (roomData.triggers) {
            this.triggers.push(...roomData.triggers);
        }
        
        // Register moving platforms
        if (roomData.movingPlatforms) {
            this.movingPlatforms.push(...roomData.movingPlatforms);
        }
    },

    /**
     * Update moving platforms
     */
    updateMovingPlatforms(delta) {
        for (const mp of this.movingPlatforms) {
            mp.time += delta * mp.speed;
            const t = (Math.sin(mp.time) + 1) / 2;
            
            // Store previous position for player carrying
            mp.previousX = mp.mesh.position.x;
            mp.previousY = mp.mesh.position.y !== undefined ? mp.mesh.position.y : mp.mesh.position.y;
            mp.previousZ = mp.mesh.position.z;
            
            // Update position based on movement type
            if (mp.movementType === 'horizontal') {
                mp.mesh.position.x = mp.startX + (mp.endX - mp.startX) * t;
            } else if (mp.movementType === 'vertical') {
                mp.mesh.position.y = mp.startY + (mp.endY - mp.startY) * t;
            } else if (mp.movementType === 'path') {
                // TODO: Path-based movement
            } else {
                // Default: horizontal
                mp.mesh.position.x = mp.startX + (mp.endX - mp.startX) * t;
            }
            
            // Calculate delta movement for player carrying
            mp.deltaX = mp.mesh.position.x - mp.previousX;
            mp.deltaY = (mp.mesh.position.y || 0) - (mp.previousY || 0);
            mp.deltaZ = mp.mesh.position.z - mp.previousZ;
            
            // Update collider
            if (mp.collider && mp.mesh) {
                mp.mesh.updateMatrixWorld(true);
                mp.collider.box.setFromObject(mp.mesh);
            }
        }
    },

    /**
     * Check triggers
     */
    checkTriggers(playerPosition) {
        const triggered = [];
        for (const trigger of this.triggers) {
            if (trigger.box.containsPoint(playerPosition)) {
                triggered.push(trigger);
            }
        }
        return triggered;
    },

    /**
     * Show/hide renderer
     */
    setVisible(visible) {
        if (this.renderer && this.renderer.domElement) {
            this.renderer.domElement.style.display = visible ? 'block' : 'none';
        }
    }
};