RoomManager.register({
    id: 'cyan',
    name: "CYAN PILLARS",
    color: 0x00aaaa,
    accentColor: 0x00ffff,
    fogColor: 0x002222,
    symbol: "⬡",
    build: function(group, colliders, movingPlatforms, floorMat, platformMat, wallMat) {
        RoomManager.createFloor(group, colliders, 0, 6, floorMat);
        RoomManager.createVoid(group, 6, 26);
        RoomManager.createFloor(group, colliders, 26, CONFIG.ROOM_LENGTH, floorMat);

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
            
            // Visual Pillar (Cylinder)
            var pillar = new THREE.Mesh(
                new THREE.CylinderGeometry(1.2, 1.4, pos.h, 16), 
                platformMat
            );
            pillar.position.set(pos.x, pos.h / 2, pos.z);
            pillar.castShadow = true;
            group.add(pillar);

            // Functional Platform (Box on top for easier landing)
            RoomManager.createPlatform(group, colliders, pos.x, pos.h, pos.z, 2.5, 2.5, platformMat);
        }
    }
});