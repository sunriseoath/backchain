RoomManager.register({
    id: 'violet',
    name: "VIOLET HELIX",
    color: 0x8800cc,
    accentColor: 0xaa44ff,
    fogColor: 0x110022,
    symbol: "✦",
    build: function(group, colliders, movingPlatforms, floorMat, platformMat, wallMat) {
        // 1. Start Floor
        RoomManager.createFloor(group, colliders, 0, 4, floorMat);
        RoomManager.createVoid(group, 4, 28);
        RoomManager.createFloor(group, colliders, 28, CONFIG.ROOM_LENGTH, floorMat);

        // 2. Central Pillar (Visual Anchor)
        var pillarMat = new THREE.MeshStandardMaterial({ color: 0x330044, roughness: 0.5, metalness: 0.2 });
        var centerPillar = new THREE.Mesh(new THREE.CylinderGeometry(2.0, 2.0, 15, 32), pillarMat);
        centerPillar.position.set(0, 0, 16); // Centered at Z=16
        group.add(centerPillar);
        RoomManager.addStaticCollider(group, colliders, centerPillar);

        // 3. The "S" Entry Path (Winding Approach)
        // Center -> Left -> Curve into Spiral
        RoomManager.createPlatform(group, colliders, 0, 0.5, 6, 2.5, 2, platformMat);
        RoomManager.createPlatform(group, colliders, -2.5, 1.2, 9, 2.5, 2, platformMat);
        
        // 4. The Helix (3/4 Turn around the pillar)
        // Starts Front-Left, goes Front -> Right -> Back -> Left
        var spiralSteps = 6;
        var radius = 3.5;
        var heightPerStep = 0.8;
        var centerZ = 16;
        
        // Manual placement for perfect playability
        var helixPositions = [
            { x: -1.5, z: 12.5, y: 2.0 }, // Front-Left (Entry)
            { x: 2.0,  z: 13.0, y: 2.8 }, // Front-Right
            { x: 3.5,  z: 16.0, y: 3.6 }, // Right
            { x: 2.0,  z: 19.0, y: 4.4 }, // Back-Right
            { x: -1.5, z: 19.5, y: 5.2 }, // Back-Left
            { x: -3.5, z: 17.0, y: 6.0 }  // Left (Top)
        ];

        for (var i = 0; i < helixPositions.length; i++) {
            var pos = helixPositions[i];
            // Rotate platform to face the path tangent roughly
            var plat = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.2, 2.0), platformMat);
            plat.position.set(pos.x, pos.y, pos.z);
            
            // Calculate angle to look at center pillar
            plat.lookAt(0, pos.y, centerZ); 
            
            plat.castShadow = true;
            group.add(plat);
            RoomManager.addStaticCollider(group, colliders, plat);
        }

        // 5. The "S" Exit Path (Winding Descent)
        // From Top Left -> Center -> Right -> Exit
        
        // Bridge out from top of spiral
        RoomManager.createPlatform(group, colliders, -1.0, 5.0, 21.5, 2.5, 2, platformMat);
        
        // Curve Right
        RoomManager.createPlatform(group, colliders, 2.0, 3.5, 24.0, 2.5, 2, platformMat);
        
        // Landing at Center (Step down to floor)
        RoomManager.createPlatform(group, colliders, 0, 2.0, 26.5, 2.5, 2, platformMat);
    }
});