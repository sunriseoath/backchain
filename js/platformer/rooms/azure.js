RoomManager.register({
    id: 'azure',
    name: "THE AZURE GATE",
    color: 0x0066cc,
    accentColor: 0x00aaff,
    fogColor: 0x001133,
    symbol: "◇",
    build: function(group, colliders, movingPlatforms, floorMat, platformMat, wallMat) {
        // Intro floor
        RoomManager.createFloor(group, colliders, 0, 10, floorMat);
        
        // The Gap
        RoomManager.createVoid(group, 10, 22);
        
        // Outro floor
        RoomManager.createFloor(group, colliders, 22, CONFIG.ROOM_LENGTH, floorMat);
        
        // Stepping stones
        RoomManager.createPlatform(group, colliders, -2.5, 0.25, 13, 2.5, 2.5, platformMat);
        RoomManager.createPlatform(group, colliders, 2, 0.5, 16, 2.5, 2.5, platformMat);
        RoomManager.createPlatform(group, colliders, -1, 0.25, 19, 2.5, 2.5, platformMat);
    }
});