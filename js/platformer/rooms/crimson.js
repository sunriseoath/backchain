RoomManager.register({
    id: 'crimson',
    name: "CRIMSON ASCENT",
    color: 0xcc2200,
    accentColor: 0xff4422,
    fogColor: 0x330500,
    symbol: "△",
    build: function(group, colliders, movingPlatforms, floorMat, platformMat, wallMat) {
        RoomManager.createFloor(group, colliders, 0, 6, floorMat);
        RoomManager.createVoid(group, 6, 27);
        
        // Tall climbing tower
        RoomManager.createPlatform(group, colliders, 0, 1.0, 8, 2.5, 2.5, platformMat);
        RoomManager.createPlatform(group, colliders, 0, 2.5, 10, 2.5, 2.5, platformMat);
        RoomManager.createPlatform(group, colliders, -2, 4.0, 12, 2.5, 2.5, platformMat);
        RoomManager.createPlatform(group, colliders, 2, 5.5, 14, 2.5, 2.5, platformMat);
        RoomManager.createPlatform(group, colliders, 0, 7.0, 16, 2.5, 2.5, platformMat);
        
        // Descent
        RoomManager.createPlatform(group, colliders, -3, 5.5, 18, 2.5, 2.5, platformMat);
        RoomManager.createPlatform(group, colliders, 3, 4.0, 20, 2.5, 2.5, platformMat);
        RoomManager.createPlatform(group, colliders, 0, 2.5, 22, 2.5, 2.5, platformMat);
        RoomManager.createPlatform(group, colliders, -2, 1.0, 24, 2.5, 2.5, platformMat);
        
        RoomManager.createFloor(group, colliders, 27, CONFIG.ROOM_LENGTH, floorMat);
    }
});