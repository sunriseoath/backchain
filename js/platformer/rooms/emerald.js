RoomManager.register({
    id: 'emerald',
    name: "EMERALD ZIGZAG",
    color: 0x00aa44,
    accentColor: 0x00ff66,
    fogColor: 0x002211,
    symbol: "○",
    build: function(group, colliders, movingPlatforms, floorMat, platformMat, wallMat) {
        // Start Floor
        RoomManager.createFloor(group, colliders, 0, 5, floorMat);
        
        // Void
        RoomManager.createVoid(group, 5, 27);
        
        // End Floor
        RoomManager.createFloor(group, colliders, 27, CONFIG.ROOM_LENGTH, floorMat);

        // Updated Zigzag Pattern
        // Physics limit is ~6.4 units distance.
        // Left-to-Right span reduced to 5 units (-2.5 to 2.5).
        // Forward spacing set to ~3.5 units.
        // Total diagonal jump is approx 5.8 units (Challenging but reliable).

        // 1. Center Start (Low)
        RoomManager.createPlatform(group, colliders, 0, 0.3, 6, 2.5, 2, platformMat);
        
        // 2. Left Side (Mid)
        RoomManager.createPlatform(group, colliders, -2.5, 0.6, 9.5, 2.5, 2, platformMat);
        
        // 3. Right Side (High)
        RoomManager.createPlatform(group, colliders, 2.5, 0.9, 13, 2.5, 2, platformMat);
        
        // 4. Left Side (High)
        RoomManager.createPlatform(group, colliders, -2.5, 0.9, 16.5, 2.5, 2, platformMat);
        
        // 5. Right Side (Mid)
        RoomManager.createPlatform(group, colliders, 2.5, 0.6, 20, 2.5, 2, platformMat);
        
        // 6. Center Finish (Low)
        RoomManager.createPlatform(group, colliders, 0, 0.3, 24, 2.5, 2, platformMat);
    }
});