/**
 * BACKCHAIN - Room Templates
 * Challenging hand-designed rooms
 */

window.RoomTemplates = {
    templates: [
        { id: 'azure', name: "THE AZURE GATE", color: 0x0066cc, accentColor: 0x00aaff, fogColor: 0x001133, symbol: "◇", build: 'buildAzureGate' },
        { id: 'crimson', name: "CRIMSON ASCENT", color: 0xcc2200, accentColor: 0xff4422, fogColor: 0x330500, symbol: "△", build: 'buildCrimsonAscent' },
        { id: 'emerald', name: "EMERALD ZIGZAG", color: 0x00aa44, accentColor: 0x00ff66, fogColor: 0x002211, symbol: "○", build: 'buildEmeraldZigzag' },
        { id: 'amber', name: "AMBER CROSSING", color: 0xcc8800, accentColor: 0xffaa00, fogColor: 0x221100, symbol: "□", build: 'buildAmberCrossing' },
        { id: 'violet', name: "VIOLET HELIX", color: 0x8800cc, accentColor: 0xaa44ff, fogColor: 0x110022, symbol: "✦", build: 'buildVioletHelix' },
        { id: 'silver', name: "SILVER EDGE", color: 0x667788, accentColor: 0xaabbcc, fogColor: 0x112233, symbol: "◈", build: 'buildSilverEdge' },
        { id: 'coral', name: "CORAL LABYRINTH", color: 0xff6677, accentColor: 0xff99aa, fogColor: 0x331122, symbol: "❖", build: 'buildCoralLabyrinth' },
        { id: 'cyan', name: "CYAN PILLARS", color: 0x00aaaa, accentColor: 0x00ffff, fogColor: 0x002222, symbol: "⬡", build: 'buildCyanPillars' }
    ],

    getTemplate: function(id) {
        for (var i = 0; i < this.templates.length; i++) {
            if (this.templates[i].id === id) return this.templates[i];
        }
        return null;
    },

    getTemplateAt: function(index) {
        return this.templates[index % this.templates.length];
    },

    getAllTemplates: function() {
        return this.templates.slice();
    },

    createRoom: function(template, zOffset, roomIndex, isFirstRoom, isLastRoom) {
        var group = new THREE.Group();
        group.position.z = zOffset;

        var colliders = [];
        var triggers = [];
        var movingPlatforms = [];

        var floorMat = new THREE.MeshStandardMaterial({ color: template.color, roughness: 0.8, metalness: 0.2 });
        var wallMat = new THREE.MeshStandardMaterial({ color: template.color, roughness: 0.5, metalness: 0.3, emissive: template.accentColor, emissiveIntensity: 0.1 });
        var platformMat = new THREE.MeshStandardMaterial({ color: template.accentColor, emissive: template.accentColor, emissiveIntensity: 0.3, roughness: 0.4, metalness: 0.6 });

        this.addWalls(group, colliders, wallMat, isFirstRoom);
        this.addLights(group, template.accentColor);

        var buildMethod = this[template.build];
        if (buildMethod) {
            buildMethod.call(this, group, colliders, movingPlatforms, floorMat, platformMat, wallMat);
        }

        this.addPortal(group, triggers, template, zOffset, roomIndex, isLastRoom);
        group.updateMatrixWorld(true);

        return {
            group: group,
            template: template,
            colliders: colliders,
            triggers: triggers,
            movingPlatforms: movingPlatforms,
            startPosition: new THREE.Vector3(0, 0.5, zOffset + 3),
            endPosition: new THREE.Vector3(0, 0.5, zOffset + CONFIG.ROOM_LENGTH - 2)
        };
    },

    addWalls: function(group, colliders, material, isFirstRoom) {
        var leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.5, CONFIG.ROOM_HEIGHT, CONFIG.ROOM_LENGTH), material);
        leftWall.position.set(-CONFIG.ROOM_WIDTH / 2, CONFIG.ROOM_HEIGHT / 2, CONFIG.ROOM_LENGTH / 2);
        group.add(leftWall);
        group.updateMatrixWorld(true);
        colliders.push({ box: new THREE.Box3().setFromObject(leftWall), isFloor: false });

        var rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.5, CONFIG.ROOM_HEIGHT, CONFIG.ROOM_LENGTH), material);
        rightWall.position.set(CONFIG.ROOM_WIDTH / 2, CONFIG.ROOM_HEIGHT / 2, CONFIG.ROOM_LENGTH / 2);
        group.add(rightWall);
        group.updateMatrixWorld(true);
        colliders.push({ box: new THREE.Box3().setFromObject(rightWall), isFloor: false });

        var ceiling = new THREE.Mesh(new THREE.BoxGeometry(CONFIG.ROOM_WIDTH, 0.3, CONFIG.ROOM_LENGTH), material);
        ceiling.position.set(0, CONFIG.ROOM_HEIGHT, CONFIG.ROOM_LENGTH / 2);
        group.add(ceiling);

        if (isFirstRoom) {
            var backWall = new THREE.Mesh(new THREE.BoxGeometry(CONFIG.ROOM_WIDTH, CONFIG.ROOM_HEIGHT, 0.5), material);
            backWall.position.set(0, CONFIG.ROOM_HEIGHT / 2, 0.25);
            group.add(backWall);
            group.updateMatrixWorld(true);
            colliders.push({ box: new THREE.Box3().setFromObject(backWall), isFloor: false });
        }
    },

    addLights: function(group, accentColor) {
        var roomLight = new THREE.PointLight(accentColor, 1.2, 50);
        roomLight.position.set(0, CONFIG.ROOM_HEIGHT - 1, CONFIG.ROOM_LENGTH / 2);
        group.add(roomLight);

        var entranceLight = new THREE.PointLight(accentColor, 0.6, 30);
        entranceLight.position.set(0, CONFIG.ROOM_HEIGHT - 1, 5);
        group.add(entranceLight);
    },

    addPortal: function(group, triggers, template, zOffset, roomIndex, isLastRoom) {
        var portalMat, portal;
        
        if (!isLastRoom) {
            portalMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: template.accentColor, emissiveIntensity: 0.8, transparent: true, opacity: 0.5 });
            portal = new THREE.Mesh(new THREE.BoxGeometry(8, 6, 1), portalMat);
            portal.position.set(0, 3, CONFIG.ROOM_LENGTH - 0.5);
            group.add(portal);

            var frameMat = new THREE.MeshStandardMaterial({ color: template.accentColor, emissive: template.accentColor, emissiveIntensity: 0.8 });
            var frameTop = new THREE.Mesh(new THREE.BoxGeometry(9, 0.4, 0.4), frameMat);
            frameTop.position.set(0, 6.2, CONFIG.ROOM_LENGTH - 0.5);
            group.add(frameTop);
            var frameLeft = new THREE.Mesh(new THREE.BoxGeometry(0.4, 6, 0.4), frameMat);
            frameLeft.position.set(-4.2, 3, CONFIG.ROOM_LENGTH - 0.5);
            group.add(frameLeft);
            var frameRight = new THREE.Mesh(new THREE.BoxGeometry(0.4, 6, 0.4), frameMat);
            frameRight.position.set(4.2, 3, CONFIG.ROOM_LENGTH - 0.5);
            group.add(frameRight);
        } else {
            portalMat = new THREE.MeshStandardMaterial({ color: 0xffff00, emissive: 0xffff00, emissiveIntensity: 1, transparent: true, opacity: 0.6 });
            portal = new THREE.Mesh(new THREE.BoxGeometry(10, 8, 1), portalMat);
            portal.position.set(0, 4, CONFIG.ROOM_LENGTH - 0.5);
            group.add(portal);
        }

        triggers.push({
            box: new THREE.Box3(
                new THREE.Vector3(-5, 0, CONFIG.ROOM_LENGTH - 2 + zOffset),
                new THREE.Vector3(5, 8, CONFIG.ROOM_LENGTH + zOffset)
            ),
            type: 'room_end',
            roomIndex: roomIndex
        });
    },

    // Helper methods
    addFloorSegment: function(group, colliders, zStart, zEnd, material) {
        var length = zEnd - zStart;
        var floor = new THREE.Mesh(new THREE.BoxGeometry(CONFIG.ROOM_WIDTH - 1, 0.5, length), material);
        floor.position.set(0, -0.25, zStart + length / 2);
        floor.receiveShadow = true;
        group.add(floor);
        group.updateMatrixWorld(true);
        colliders.push({ box: new THREE.Box3().setFromObject(floor), isFloor: true });
        return floor;
    },

    addPlatform: function(group, colliders, x, y, z, width, depth, material, movingPlatformRef) {
        var plat = new THREE.Mesh(new THREE.BoxGeometry(width, 0.5, depth), material);
        plat.position.set(x, y, z);
        plat.castShadow = true;
        plat.receiveShadow = true;
        group.add(plat);
        group.updateMatrixWorld(true);
        var collider = { box: new THREE.Box3().setFromObject(plat), isFloor: true, movingPlatformRef: movingPlatformRef };
        colliders.push(collider);
        return { mesh: plat, collider: collider };
    },

    addWallObstacle: function(group, colliders, x, y, z, width, height, depth, material) {
        var wall = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material);
        wall.position.set(x, y, z);
        wall.castShadow = true;
        group.add(wall);
        group.updateMatrixWorld(true);
        colliders.push({ box: new THREE.Box3().setFromObject(wall), isFloor: false });
        return wall;
    },

    addVoid: function(group, zStart, zEnd) {
        var length = zEnd - zStart;
        var voidMat = new THREE.MeshBasicMaterial({ color: 0x000011 });
        var voidMesh = new THREE.Mesh(new THREE.BoxGeometry(CONFIG.ROOM_WIDTH - 1, 0.1, length), voidMat);
        voidMesh.position.set(0, -2, zStart + length / 2);
        group.add(voidMesh);
    },

    // ==========================================
    // ROOM BUILDERS
    // ==========================================

    // AZURE GATE - Simple introduction
    buildAzureGate: function(group, colliders, movingPlatforms, floorMat, platformMat) {
        this.addFloorSegment(group, colliders, 0, 10, floorMat);
        this.addVoid(group, 10, 22);
        this.addFloorSegment(group, colliders, 22, CONFIG.ROOM_LENGTH, floorMat);
        
        this.addPlatform(group, colliders, -2.5, 0.25, 13, 2.5, 2.5, platformMat);
        this.addPlatform(group, colliders, 2, 0.5, 16, 2.5, 2.5, platformMat);
        this.addPlatform(group, colliders, -1, 0.25, 19, 2.5, 2.5, platformMat);
    },

    // CRIMSON ASCENT - Vertical climbing emphasis
    buildCrimsonAscent: function(group, colliders, movingPlatforms, floorMat, platformMat) {
        this.addFloorSegment(group, colliders, 0, 6, floorMat);
        this.addVoid(group, 6, 27);
        
        // Create a tall climbing tower
        // Player must jump UP, not just forward
        this.addPlatform(group, colliders, 0, 1.0, 8, 2.5, 2.5, platformMat);
        this.addPlatform(group, colliders, 0, 2.5, 10, 2.5, 2.5, platformMat);
        this.addPlatform(group, colliders, -2, 4.0, 12, 2.5, 2.5, platformMat);
        this.addPlatform(group, colliders, 2, 5.5, 14, 2.5, 2.5, platformMat);
        this.addPlatform(group, colliders, 0, 7.0, 16, 2.5, 2.5, platformMat);
        
        // Descent back down
        this.addPlatform(group, colliders, -3, 5.5, 18, 2.5, 2.5, platformMat);
        this.addPlatform(group, colliders, 3, 4.0, 20, 2.5, 2.5, platformMat);
        this.addPlatform(group, colliders, 0, 2.5, 22, 2.5, 2.5, platformMat);
        this.addPlatform(group, colliders, -2, 1.0, 24, 2.5, 2.5, platformMat);
        
        this.addFloorSegment(group, colliders, 27, CONFIG.ROOM_LENGTH, floorMat);
    },

    // EMERALD ZIGZAG - Wide left-right jumping
    buildEmeraldZigzag: function(group, colliders, movingPlatforms, floorMat, platformMat) {
        this.addFloorSegment(group, colliders, 0, 5, floorMat);
        this.addVoid(group, 5, 27);
        this.addFloorSegment(group, colliders, 27, CONFIG.ROOM_LENGTH, floorMat);

        // True zigzag: must go to extremes of left and right
        // Pattern: center -> far left -> far right -> far left -> far right -> center
        this.addPlatform(group, colliders, 0, 0.3, 6, 2.5, 2, platformMat);
        this.addPlatform(group, colliders, -6, 0.4, 9, 2.5, 2, platformMat);
        this.addPlatform(group, colliders, 6, 0.5, 12, 2.5, 2, platformMat);
        this.addPlatform(group, colliders, -6, 0.4, 15, 2.5, 2, platformMat);
        this.addPlatform(group, colliders, 6, 0.5, 18, 2.5, 2, platformMat);
        this.addPlatform(group, colliders, -6, 0.4, 21, 2.5, 2, platformMat);
        this.addPlatform(group, colliders, 0, 0.3, 25, 2.5, 2, platformMat);
    },

    // AMBER CROSSING - Moving platforms
    buildAmberCrossing: function(group, colliders, movingPlatforms, floorMat, platformMat) {
        this.addFloorSegment(group, colliders, 0, 8, floorMat);
        this.addVoid(group, 8, 24);
        this.addFloorSegment(group, colliders, 24, CONFIG.ROOM_LENGTH, floorMat);

        // Platform 1
        var plat1Mesh = new THREE.Mesh(new THREE.BoxGeometry(4, 0.5, 4), platformMat);
        plat1Mesh.position.set(-3, 0.25, 12);
        plat1Mesh.castShadow = true;
        group.add(plat1Mesh);
        group.updateMatrixWorld(true);
        var collider1 = { box: new THREE.Box3().setFromObject(plat1Mesh), isFloor: true, isDynamic: true };
        var mp1 = { mesh: plat1Mesh, collider: collider1, startX: -4, endX: 4, speed: 1.8, time: 0, movementType: 'horizontal', deltaX: 0, deltaY: 0, deltaZ: 0, previousX: -3 };
        collider1.movingPlatformRef = mp1;
        colliders.push(collider1);
        movingPlatforms.push(mp1);

        // Platform 2
        var plat2Mesh = new THREE.Mesh(new THREE.BoxGeometry(4, 0.5, 4), platformMat);
        plat2Mesh.position.set(3, 0.25, 20);
        plat2Mesh.castShadow = true;
        group.add(plat2Mesh);
        group.updateMatrixWorld(true);
        var collider2 = { box: new THREE.Box3().setFromObject(plat2Mesh), isFloor: true, isDynamic: true };
        var mp2 = { mesh: plat2Mesh, collider: collider2, startX: 4, endX: -4, speed: 1.5, time: Math.PI, movementType: 'horizontal', deltaX: 0, deltaY: 0, deltaZ: 0, previousX: 3 };
        collider2.movingPlatformRef = mp2;
        colliders.push(collider2);
        movingPlatforms.push(mp2);
    },

    // VIOLET HELIX - Full 360+ degree spiral climb
    buildVioletHelix: function(group, colliders, movingPlatforms, floorMat, platformMat) {
        this.addFloorSegment(group, colliders, 0, 5, floorMat);
        this.addVoid(group, 5, 27);
        this.addFloorSegment(group, colliders, 27, CONFIG.ROOM_LENGTH, floorMat);

        // Full 360-degree spiral (actually ~450 degrees)
        // Player must turn completely around while climbing
        var steps = 10;
        var totalRotation = Math.PI * 2.5; // 450 degrees
        var radius = 4;
        var heightPerStep = 0.7;
        var zPerStep = 2;
        
        for (var i = 0; i < steps; i++) {
            var angle = (i / steps) * totalRotation;
            var x = Math.sin(angle) * radius;
            var y = 0.5 + i * heightPerStep;
            var z = 6 + i * zPerStep;
            
            this.addPlatform(group, colliders, x, y, z, 2.2, 2.2, platformMat);
        }
        
        // Final platform back to center
        this.addPlatform(group, colliders, 0, 0.5, 26, 2.5, 2.5, platformMat);
    },

    // SILVER EDGE - Extremely narrow tightrope (0.4 width!)
    buildSilverEdge: function(group, colliders, movingPlatforms, floorMat, platformMat) {
        this.addFloorSegment(group, colliders, 0, 6, floorMat);
        this.addVoid(group, 6, 26);
        this.addFloorSegment(group, colliders, 26, CONFIG.ROOM_LENGTH, floorMat);

        // Tightrope bridge - EXTREMELY narrow (0.4 width, player is 0.6 diameter)
        // This requires precise movement!
        var bridge = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.3, 20), platformMat);
        bridge.position.set(0, 0.15, 16);
        bridge.castShadow = true;
        group.add(bridge);
        group.updateMatrixWorld(true);
        colliders.push({ box: new THREE.Box3().setFromObject(bridge), isFloor: true });

        // Glowing edges to make it visible
        var edgeMat = new THREE.MeshStandardMaterial({ 
            color: 0xaabbcc, 
            emissive: 0xaabbcc, 
            emissiveIntensity: 1.0 
        });
        var leftEdge = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.1, 20), edgeMat);
        leftEdge.position.set(-0.225, 0.35, 16);
        group.add(leftEdge);
        var rightEdge = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.1, 20), edgeMat);
        rightEdge.position.set(0.225, 0.35, 16);
        group.add(rightEdge);

        // Decorative pillars
        var pillarMat = new THREE.MeshStandardMaterial({ color: 0x667788, roughness: 0.5, metalness: 0.5 });
        for (var i = 0; i < 5; i++) {
            var pillarL = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.3, 8, 8), pillarMat);
            pillarL.position.set(-4, 4, 7 + i * 4);
            group.add(pillarL);
            var pillarR = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.3, 8, 8), pillarMat);
            pillarR.position.set(4, 4, 7 + i * 4);
            group.add(pillarR);
        }
    },

    // CORAL LABYRINTH - Complex maze with dead ends, forced backtracking
    buildCoralLabyrinth: function(group, colliders, movingPlatforms, floorMat, platformMat, wallMat) {
        this.addFloorSegment(group, colliders, 0, CONFIG.ROOM_LENGTH, floorMat);

        var mazeMat = new THREE.MeshStandardMaterial({ 
            color: 0xff99aa, 
            emissive: 0xff6677, 
            emissiveIntensity: 0.2, 
            roughness: 0.5, 
            metalness: 0.3 
        });
        
        var H = 3.5; // Wall height
        var Y = H / 2; // Wall Y position

        // OUTER CONTAINMENT - Cannot walk around the maze
        // Left barrier
        this.addWallObstacle(group, colliders, -6.5, Y, 15, 0.5, H, 22, mazeMat);
        // Right barrier  
        this.addWallObstacle(group, colliders, 6.5, Y, 15, 0.5, H, 22, mazeMat);
        
        // ENTRANCE WALL (with gap in center)
        this.addWallObstacle(group, colliders, -4, Y, 5, 5, H, 0.5, mazeMat);
        this.addWallObstacle(group, colliders, 4, Y, 5, 5, H, 0.5, mazeMat);

        // === MAZE INTERIOR ===
        
        // First corridor forces right turn
        this.addWallObstacle(group, colliders, 0, Y, 8, 0.5, H, 6, mazeMat);
        
        // Dead end on left (trap!)
        this.addWallObstacle(group, colliders, -4.5, Y, 9, 0.5, H, 5, mazeMat);
        this.addWallObstacle(group, colliders, -5.5, Y, 11.5, 2.5, H, 0.5, mazeMat);
        
        // Main path goes right then must turn LEFT (180 degree turn)
        this.addWallObstacle(group, colliders, 4.5, Y, 10, 0.5, H, 6, mazeMat);
        this.addWallObstacle(group, colliders, 2, Y, 13, 5.5, H, 0.5, mazeMat);
        
        // After the 180 turn, go left side
        this.addWallObstacle(group, colliders, -1, Y, 16, 0.5, H, 6, mazeMat);
        
        // Another dead end on right (trap!)
        this.addWallObstacle(group, colliders, 3.5, Y, 16, 0.5, H, 5, mazeMat);
        this.addWallObstacle(group, colliders, 5, Y, 18.5, 3.5, H, 0.5, mazeMat);
        
        // Force BACKUP section - narrow passage that dead-ends
        // Player enters from left, hits wall, must back out
        this.addWallObstacle(group, colliders, -5, Y, 18, 0.5, H, 4, mazeMat);
        this.addWallObstacle(group, colliders, -4, Y, 20, 2.5, H, 0.5, mazeMat);
        this.addWallObstacle(group, colliders, -3, Y, 18, 0.5, H, 3.5, mazeMat);
        
        // Correct path continues forward
        this.addWallObstacle(group, colliders, 0, Y, 21, 6, H, 0.5, mazeMat);
        
        // Final approach
        this.addWallObstacle(group, colliders, 2, Y, 24, 0.5, H, 5, mazeMat);
        
        // EXIT WALL (with gap)
        this.addWallObstacle(group, colliders, -4, Y, 26, 5, H, 0.5, mazeMat);
        this.addWallObstacle(group, colliders, 5, Y, 26, 3, H, 0.5, mazeMat);
    },

    // CYAN PILLARS - Pillar hopping
    buildCyanPillars: function(group, colliders, movingPlatforms, floorMat, platformMat) {
        this.addFloorSegment(group, colliders, 0, 6, floorMat);
        this.addVoid(group, 6, 26);
        this.addFloorSegment(group, colliders, 26, CONFIG.ROOM_LENGTH, floorMat);

        var pillarPositions = [
            { x: 0, z: 8, h: 1.5 },
            { x: -4, z: 11, h: 2.5 },
            { x: 3, z: 14, h: 1.8 },
            { x: -2, z: 17, h: 3.0 },
            { x: 4, z: 20, h: 2.2 },
            { x: -1, z: 23, h: 1.0 },
            { x: 2, z: 25, h: 0.5 }
        ];

        for (var i = 0; i < pillarPositions.length; i++) {
            var pos = pillarPositions[i];
            var pillar = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.4, pos.h, 8), platformMat);
            pillar.position.set(pos.x, pos.h / 2, pos.z);
            pillar.castShadow = true;
            group.add(pillar);
            this.addPlatform(group, colliders, pos.x, pos.h, pos.z, 2.5, 2.5, platformMat);
        }
    }
};

console.log('RoomTemplates module loaded');