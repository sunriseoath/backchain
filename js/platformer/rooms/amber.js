RoomManager.register({
    id: 'amber',
    name: "AMBER CROSSING",
    color: 0xcc8800,
    accentColor: 0xffaa00,
    fogColor: 0x221100,
    symbol: "□",
    build: function(group, colliders, movingPlatforms, floorMat, platformMat, wallMat) {
        RoomManager.createFloor(group, colliders, 0, 8, floorMat);
        RoomManager.createVoid(group, 8, 24);
        RoomManager.createFloor(group, colliders, 24, CONFIG.ROOM_LENGTH, floorMat);

        // --- Platform 1 (Moving Left to Right) ---
        var plat1Mesh = new THREE.Mesh(new THREE.BoxGeometry(4, 0.5, 4), platformMat);
        plat1Mesh.position.set(-3, 0.25, 12);
        plat1Mesh.castShadow = true;
        group.add(plat1Mesh);
        
        // We need explicit control over the collider for moving logic
        var collider1 = { 
            box: new THREE.Box3().setFromObject(plat1Mesh), 
            isFloor: true, 
            isDynamic: true 
        };
        
        var mp1 = { 
            mesh: plat1Mesh, 
            collider: collider1, 
            startX: -4, 
            endX: 4, 
            speed: 1.8, 
            time: 0, 
            movementType: 'horizontal', 
            deltaX: 0, deltaY: 0, deltaZ: 0, 
            previousX: -3, previousY: 0.25, previousZ: 12 
        };
        
        collider1.movingPlatformRef = mp1;
        colliders.push(collider1);
        movingPlatforms.push(mp1);

        // --- Platform 2 (Moving Right to Left) ---
        var plat2Mesh = new THREE.Mesh(new THREE.BoxGeometry(4, 0.5, 4), platformMat);
        plat2Mesh.position.set(3, 0.25, 20);
        plat2Mesh.castShadow = true;
        group.add(plat2Mesh);
        
        var collider2 = { 
            box: new THREE.Box3().setFromObject(plat2Mesh), 
            isFloor: true, 
            isDynamic: true 
        };
        
        var mp2 = { 
            mesh: plat2Mesh, 
            collider: collider2, 
            startX: 4, 
            endX: -4, 
            speed: 1.5, 
            time: Math.PI, // Start at opposite phase
            movementType: 'horizontal', 
            deltaX: 0, deltaY: 0, deltaZ: 0, 
            previousX: 3, previousY: 0.25, previousZ: 20 
        };
        
        collider2.movingPlatformRef = mp2;
        colliders.push(collider2);
        movingPlatforms.push(mp2);
    }
});