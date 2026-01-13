/**
 * BACKCHAIN - Configuration
 * Shared constants for all game modes
 */

window.CONFIG = {
    // Player Physics
    PLAYER_HEIGHT: 1.7,
    PLAYER_RADIUS: 0.3,
    MOVE_SPEED: 8,
    JUMP_FORCE: 10,
    GRAVITY: 25,
    
    // Input Sensitivity
    MOUSE_SENSITIVITY: 0.002,
    TOUCH_SENSITIVITY: 0.004,
    KEYBOARD_TURN_SPEED: 2.5,
    KEYBOARD_LOOK_SPEED: 1.5,
    
    // Platformer Timing
    BASE_TIME_PER_ROOM: 12,
    TIME_BONUS_PER_RUN: 3,
    ADAPTIVE_BASE_TIME: 15,
    ADAPTIVE_MIN_TIME: 6,
    ADAPTIVE_BUFFER: 1.3,
    
    // Room Dimensions
    ROOM_LENGTH: 30,
    ROOM_WIDTH: 15,
    ROOM_HEIGHT: 12,
    
    // Typing Game
    TYPING_BASE_TIME_PER_WORD: 1.5,
    TYPING_TIME_BONUS_PER_RUN: 5,
    
    // Audio
    AUDIO_ENABLED: true,
    MASTER_VOLUME: 0.7,
    
    // Performance
    MAX_LOADED_ROOMS: 5,
    TARGET_FPS: 60
};