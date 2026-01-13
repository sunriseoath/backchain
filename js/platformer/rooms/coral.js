RoomManager.register({
    id: 'coral',
    name: "CORAL LABYRINTH",
    color: 0xff6677,
    accentColor: 0xff99aa,
    fogColor: 0x331122,
    symbol: "❖",
    build: function(group, colliders, movingPlatforms, floorMat, platformMat, wallMat) {
        RoomManager.createFloor(group, colliders, 0, CONFIG.ROOM_LENGTH, floorMat);
        var mazeMat = new THREE.MeshStandardMaterial({ color: 0xff99aa, emissive: 0xff6677, emissiveIntensity: 0.2, roughness: 0.5, metalness: 0.3 });
        var H = 3.5;
        var Y = H / 2;

        // Outer walls
        RoomManager.createWall(group, colliders, -6.5, Y, 15, 0.5, H, 22, mazeMat);
        RoomManager.createWall(group, colliders, 6.5, Y, 15, 0.5, H, 22, mazeMat);
        
        // Entrance
        RoomManager.createWall(group, colliders, -4, Y, 5, 5, H, 0.5, mazeMat);
        RoomManager.createWall(group, colliders, 4, Y, 5, 5, H, 0.5, mazeMat);

        // 1. Enter and hit wall, force RIGHT
        RoomManager.createWall(group, colliders, 0, Y, 8, 4, H, 0.5, mazeMat); // Center block
        
        // 2. Right path leads to dead end unless you turn LEFT immediately
        RoomManager.createWall(group, colliders, 4.5, Y, 10, 0.5, H, 6, mazeMat); // Right wall
        
        // 3. Go LEFT across center
        // But wait! There's a wall blocking direct access to exit
        RoomManager.createWall(group, colliders, 0, Y, 12, 0.5, H, 6, mazeMat); // Vertical divider
        
        // 4. Must go ALL THE WAY LEFT to find gap
        RoomManager.createWall(group, colliders, -3, Y, 14, 4, H, 0.5, mazeMat); // Horizontal block
        
        // 5. The "Hook" - go up left side, hit wall, turn right
        RoomManager.createWall(group, colliders, -4.5, Y, 18, 0.5, H, 6, mazeMat);
        
        // 6. Dead end trap in top right corner
        RoomManager.createWall(group, colliders, 4.5, Y, 20, 0.5, H, 6, mazeMat);
        RoomManager.createWall(group, colliders, 2, Y, 22, 4, H, 0.5, mazeMat);
        
        // Exit
        RoomManager.createWall(group, colliders, -4, Y, 26, 5, H, 0.5, mazeMat);
        RoomManager.createWall(group, colliders, 5, Y, 26, 3, H, 0.5, mazeMat);
    }
});