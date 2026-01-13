/**
 * BACKCHAIN - Room Manager
 * Updated to fix Ghost Colliders (Matrix World Update)
 */

window.RoomManager = {
    templates: [],

    register: function(template) {
        this.templates.push(template);
    },

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
        
        // CRITICAL FIX: Update the group's matrix immediately so children inherit the Z offset
        group.updateMatrixWorld(true);

        var colliders = [];
        var triggers = [];
        var movingPlatforms = [];

        var floorMat = new THREE.MeshStandardMaterial({ color: template.color, roughness: 0.8, metalness: 0.2 });
        var wallMat = new THREE.MeshStandardMaterial({ color: template.color, roughness: 0.5, metalness: 0.3, emissive: template.accentColor, emissiveIntensity: 0.1 });
        var platformMat = new THREE.MeshStandardMaterial({ color: template.accentColor, emissive: template.accentColor, emissiveIntensity: 0.3, roughness: 0.4, metalness: 0.6 });

        this.addWalls(group, colliders, wallMat, isFirstRoom);
        this.addLights(group, template.accentColor);

        if (template.build) {
            template.build(group, colliders, movingPlatforms, floorMat, platformMat, wallMat);
        }

        this.addPortal(group, triggers, template, zOffset, roomIndex, isLastRoom);

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

    // --- Helpers ---

    addWalls: function(group, colliders, material, isFirstRoom) {
        var leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.5, CONFIG.ROOM_HEIGHT, CONFIG.ROOM_LENGTH), material);
        leftWall.position.set(-CONFIG.ROOM_WIDTH / 2, CONFIG.ROOM_HEIGHT / 2, CONFIG.ROOM_LENGTH / 2);
        group.add(leftWall);
        this.addStaticCollider(group, colliders, leftWall);

        var rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.5, CONFIG.ROOM_HEIGHT, CONFIG.ROOM_LENGTH), material);
        rightWall.position.set(CONFIG.ROOM_WIDTH / 2, CONFIG.ROOM_HEIGHT / 2, CONFIG.ROOM_LENGTH / 2);
        group.add(rightWall);
        this.addStaticCollider(group, colliders, rightWall);

        var ceiling = new THREE.Mesh(new THREE.BoxGeometry(CONFIG.ROOM_WIDTH, 0.3, CONFIG.ROOM_LENGTH), material);
        ceiling.position.set(0, CONFIG.ROOM_HEIGHT, CONFIG.ROOM_LENGTH / 2);
        group.add(ceiling);

        if (isFirstRoom) {
            var backWall = new THREE.Mesh(new THREE.BoxGeometry(CONFIG.ROOM_WIDTH, CONFIG.ROOM_HEIGHT, 0.5), material);
            backWall.position.set(0, CONFIG.ROOM_HEIGHT / 2, 0.25);
            group.add(backWall);
            this.addStaticCollider(group, colliders, backWall);
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
        if (!isLastRoom) {
            var portalMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: template.accentColor, emissiveIntensity: 0.8, transparent: true, opacity: 0.5 });
            var portal = new THREE.Mesh(new THREE.BoxGeometry(8, 6, 1), portalMat);
            portal.position.set(0, 3, CONFIG.ROOM_LENGTH - 0.5);
            group.add(portal);
        } else {
            var finishMat = new THREE.MeshStandardMaterial({ color: 0xffff00, emissive: 0xffff00, emissiveIntensity: 1, transparent: true, opacity: 0.6 });
            var finish = new THREE.Mesh(new THREE.BoxGeometry(10, 8, 1), finishMat);
            finish.position.set(0, 4, CONFIG.ROOM_LENGTH - 0.5);
            group.add(finish);
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

    // --- Public Helpers ---

    createFloor: function(group, colliders, zStart, zEnd, material) {
        var length = zEnd - zStart;
        var floor = new THREE.Mesh(new THREE.BoxGeometry(CONFIG.ROOM_WIDTH - 1, 0.5, length), material);
        floor.position.set(0, -0.25, zStart + length / 2);
        floor.receiveShadow = true;
        group.add(floor);
        // FIX: Force update matrix before creating box
        floor.updateMatrixWorld(true);
        colliders.push({ box: new THREE.Box3().setFromObject(floor), isFloor: true });
    },

    createPlatform: function(group, colliders, x, y, z, width, depth, material) {
        var plat = new THREE.Mesh(new THREE.BoxGeometry(width, 0.5, depth), material);
        plat.position.set(x, y, z);
        plat.castShadow = true;
        plat.receiveShadow = true;
        group.add(plat);
        // FIX: Force update
        plat.updateMatrixWorld(true);
        colliders.push({ box: new THREE.Box3().setFromObject(plat), isFloor: true });
    },

    createWall: function(group, colliders, x, y, z, width, height, depth, material) {
        var wall = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material);
        wall.position.set(x, y, z);
        wall.castShadow = true;
        group.add(wall);
        // FIX: Force update
        wall.updateMatrixWorld(true);
        colliders.push({ box: new THREE.Box3().setFromObject(wall), isFloor: false });
    },

    createVoid: function(group, zStart, zEnd) {
        var length = zEnd - zStart;
        var voidMat = new THREE.MeshBasicMaterial({ color: 0x000011 });
        var voidMesh = new THREE.Mesh(new THREE.BoxGeometry(CONFIG.ROOM_WIDTH - 1, 0.1, length), voidMat);
        voidMesh.position.set(0, -2, zStart + length / 2);
        group.add(voidMesh);
    },

    addStaticCollider: function(group, colliders, mesh) {
        // FIX: Force update
        mesh.updateMatrixWorld(true);
        colliders.push({ box: new THREE.Box3().setFromObject(mesh), isFloor: false });
    }
};