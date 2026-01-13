RoomManager.register({
    id: 'silver',
    name: "SILVER EDGE",
    color: 0x667788,
    accentColor: 0xaabbcc,
    fogColor: 0x112233,
    symbol: "◈",
    build: function(group, colliders, movingPlatforms, floorMat, platformMat, wallMat) {
        RoomManager.createFloor(group, colliders, 0, 6, floorMat);
        RoomManager.createVoid(group, 6, 26);
        RoomManager.createFloor(group, colliders, 26, CONFIG.ROOM_LENGTH, floorMat);

        // EXTREMELY narrow tightrope (0.4 width)
        var bridge = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.3, 20), platformMat);
        bridge.position.set(0, 0.15, 16);
        bridge.castShadow = true;
        group.add(bridge);
        
        // We use explicit collider adding here because we want precise bounds
        group.updateMatrixWorld(true);
        colliders.push({ box: new THREE.Box3().setFromObject(bridge), isFloor: true });

        // Glowing edges to make it visible
        var edgeMat = new THREE.MeshStandardMaterial({ color: 0xaabbcc, emissive: 0xaabbcc, emissiveIntensity: 1.0 });
        var leftEdge = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.1, 20), edgeMat);
        leftEdge.position.set(-0.225, 0.35, 16);
        group.add(leftEdge);
        var rightEdge = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.1, 20), edgeMat);
        rightEdge.position.set(0.225, 0.35, 16);
        group.add(rightEdge);

        // Pillars
        var pillarMat = new THREE.MeshStandardMaterial({ color: 0x667788, roughness: 0.5, metalness: 0.5 });
        for (var i = 0; i < 5; i++) {
            var pillarL = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.3, 8, 8), pillarMat);
            pillarL.position.set(-4, 4, 7 + i * 4);
            group.add(pillarL);
            var pillarR = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.3, 8, 8), pillarMat);
            pillarR.position.set(4, 4, 7 + i * 4);
            group.add(pillarR);
        }
    }
});