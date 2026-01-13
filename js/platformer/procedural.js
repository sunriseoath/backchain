/**
 * BACKCHAIN - Procedural Generation System
 * Foundation for generating rooms, corridors, and challenges
 */

window.ProceduralGen = {
    seed: 12345,

    // ===== RANDOM UTILITIES =====
    
    setSeed: function(seed) {
        this.seed = seed;
    },

    random: function() {
        var x = Math.sin(this.seed++) * 10000;
        return x - Math.floor(x);
    },

    randomInt: function(min, max) {
        return Math.floor(this.random() * (max - min + 1)) + min;
    },

    randomFloat: function(min, max) {
        return min + this.random() * (max - min);
    },

    randomPick: function(array) {
        return array[Math.floor(this.random() * array.length)];
    },

    shuffle: function(array) {
        var arr = array.slice();
        for (var i = arr.length - 1; i > 0; i--) {
            var j = Math.floor(this.random() * (i + 1));
            var temp = arr[i];
            arr[i] = arr[j];
            arr[j] = temp;
        }
        return arr;
    },

    // ===== OBSTACLE PRIMITIVES =====
    
    primitives: {
        /**
         * Simple gap with platforms
         */
        gapJump: function(difficulty) {
            return {
                type: 'gapJump',
                gapLength: 6 + difficulty * 6,
                platformCount: 1 + Math.floor(difficulty * 2),
                platformSize: 3.5 - difficulty * 0.8,
                platformSpacing: 3 + difficulty
            };
        },

        /**
         * Ascending staircase
         */
        staircase: function(difficulty) {
            return {
                type: 'staircase',
                stepCount: 3 + Math.floor(difficulty * 4),
                stepHeight: 0.7 + difficulty * 0.4,
                stepWidth: 3.5 - difficulty * 0.5,
                alternating: difficulty > 0.3
            };
        },

        /**
         * Moving platform crossing
         */
        movingCrossing: function(difficulty) {
            return {
                type: 'movingCrossing',
                platformCount: 1 + Math.floor(difficulty * 2),
                speed: 1.2 + difficulty * 0.8,
                platformSize: 5 - difficulty * 1.5,
                gapLength: 8 + difficulty * 6
            };
        },

        /**
         * Narrow bridge
         */
        narrowBridge: function(difficulty) {
            return {
                type: 'narrowBridge',
                width: 3 - difficulty * 1.8,
                length: 10 + difficulty * 8
            };
        },

        /**
         * Pillar hopping
         */
        pillarHop: function(difficulty) {
            return {
                type: 'pillarHop',
                pillarCount: 4 + Math.floor(difficulty * 3),
                pillarRadius: 1.5 - difficulty * 0.4,
                heightVariation: difficulty * 2,
                spacing: 3.5 - difficulty * 0.5
            };
        },

        /**
         * Maze section
         */
        maze: function(difficulty) {
            return {
                type: 'maze',
                complexity: 2 + Math.floor(difficulty * 3),
                deadEnds: 1 + Math.floor(difficulty * 2),
                wallHeight: 3 + difficulty
            };
        },

        /**
         * Spiral climb
         */
        spiral: function(difficulty) {
            return {
                type: 'spiral',
                rotations: 0.5 + difficulty,
                heightGain: 3 + difficulty * 3,
                platformCount: 4 + Math.floor(difficulty * 3),
                radius: 4 - difficulty * 0.5
            };
        }
    },

    // ===== CORRIDOR TYPES =====
    
    corridorTypes: {
        straight: {
            length: 8,
            turnAngle: 0,
            heightChange: 0
        },
        leftTurn: {
            length: 10,
            turnAngle: -90,
            heightChange: 0
        },
        rightTurn: {
            length: 10,
            turnAngle: 90,
            heightChange: 0
        },
        rampUp: {
            length: 12,
            turnAngle: 0,
            heightChange: 3
        },
        rampDown: {
            length: 12,
            turnAngle: 0,
            heightChange: -3
        },
        sCurve: {
            length: 15,
            turnAngle: 0,
            heightChange: 0,
            curves: [45, -45]
        }
    },

    // ===== ROOM GENERATION =====

    /**
     * Generate a procedural room layout
     */
    generateRoomLayout: function(difficulty, seed) {
        this.setSeed(seed);

        // Pick 2-4 obstacle patterns based on difficulty
        var patternCount = difficulty < 0.3 ? 2 : (difficulty < 0.7 ? 3 : 4);
        var patterns = [];

        var primitiveNames = Object.keys(this.primitives);
        var usedTypes = [];

        for (var i = 0; i < patternCount; i++) {
            var type;
            var attempts = 0;
            
            // Try to avoid repeating types
            do {
                type = this.randomPick(primitiveNames);
                attempts++;
            } while (usedTypes.indexOf(type) !== -1 && attempts < 5);
            
            usedTypes.push(type);
            patterns.push(this.primitives[type](difficulty));
        }

        return {
            patterns: patterns,
            difficulty: difficulty,
            seed: seed
        };
    },

    /**
     * Generate a corridor between rooms
     */
    generateCorridor: function(seed) {
        this.setSeed(seed);

        var types = Object.keys(this.corridorTypes);
        var selectedType = this.randomPick(types);
        var config = this.corridorTypes[selectedType];

        return {
            type: selectedType,
            length: config.length + this.randomInt(-2, 2),
            turnAngle: config.turnAngle,
            heightChange: config.heightChange,
            curves: config.curves || null
        };
    },

    // ===== PATHFINDING / TIME CALCULATION =====

    /**
     * Calculate optimal path time through a room
     */
    calculateParTime: function(room) {
        // Base traversal time
        var time = CONFIG.ROOM_LENGTH / CONFIG.MOVE_SPEED;

        // Add time for each obstacle pattern
        if (room.patterns) {
            for (var i = 0; i < room.patterns.length; i++) {
                var pattern = room.patterns[i];
                time += this.getPatternTime(pattern);
            }
        }

        // Apply skill buffer
        return time * CONFIG.ADAPTIVE_BUFFER;
    },

    /**
     * Get estimated time for a pattern
     */
    getPatternTime: function(pattern) {
        switch (pattern.type) {
            case 'gapJump':
                return pattern.platformCount * 0.6;
            case 'staircase':
                return pattern.stepCount * 0.5;
            case 'movingCrossing':
                return pattern.platformCount * 2.5; // Waiting for platforms
            case 'narrowBridge':
                return pattern.length / (CONFIG.MOVE_SPEED * 0.7); // Slower on narrow
            case 'pillarHop':
                return pattern.pillarCount * 0.7;
            case 'maze':
                return pattern.complexity * 3;
            case 'spiral':
                return pattern.platformCount * 0.6 + pattern.heightGain * 0.3;
            default:
                return 2;
        }
    },

    /**
     * Validate that a room can be completed
     */
    validateRoom: function(roomLayout) {
        // Check each pattern is achievable
        for (var i = 0; i < roomLayout.patterns.length; i++) {
            var pattern = roomLayout.patterns[i];
            if (!this.validatePattern(pattern)) {
                return { valid: false, reason: 'impossible_pattern', pattern: pattern };
            }
        }

        // Check total time is reasonable
        var parTime = this.calculateParTime(roomLayout);
        if (parTime > 120) {
            return { valid: false, reason: 'too_long', parTime: parTime };
        }

        return { valid: true, parTime: parTime };
    },

    /**
     * Validate a single pattern
     */
    validatePattern: function(pattern) {
        switch (pattern.type) {
            case 'gapJump':
                // Max jump distance is about 4 units
                var gapPerPlatform = pattern.gapLength / (pattern.platformCount + 1);
                return gapPerPlatform <= 4.5;
            
            case 'staircase':
                // Max step height is about 1.5 units
                return pattern.stepHeight <= 1.8;
            
            case 'narrowBridge':
                // Min width for player is about 0.8
                return pattern.width >= 1.0;
            
            default:
                return true;
        }
    },

    // ===== 3D MAZE GENERATION (Future) =====

    /**
     * Generate a 3D grid-based maze
     */
    generate3DMaze: function(width, height, depth, seed) {
        this.setSeed(seed);

        // Initialize grid
        var grid = [];
        for (var x = 0; x < width; x++) {
            grid[x] = [];
            for (var y = 0; y < height; y++) {
                grid[x][y] = [];
                for (var z = 0; z < depth; z++) {
                    grid[x][y][z] = {
                        visited: false,
                        walls: { north: true, south: true, east: true, west: true, up: true, down: true }
                    };
                }
            }
        }

        // Recursive backtracker algorithm
        var stack = [];
        var current = { x: 0, y: 0, z: 0 };
        grid[0][0][0].visited = true;

        var self = this;

        function getUnvisitedNeighbors(cell) {
            var neighbors = [];
            var directions = [
                { dx: 1, dy: 0, dz: 0, wall: 'east', opposite: 'west' },
                { dx: -1, dy: 0, dz: 0, wall: 'west', opposite: 'east' },
                { dx: 0, dy: 1, dz: 0, wall: 'up', opposite: 'down' },
                { dx: 0, dy: -1, dz: 0, wall: 'down', opposite: 'up' },
                { dx: 0, dy: 0, dz: 1, wall: 'north', opposite: 'south' },
                { dx: 0, dy: 0, dz: -1, wall: 'south', opposite: 'north' }
            ];

            for (var i = 0; i < directions.length; i++) {
                var d = directions[i];
                var nx = cell.x + d.dx;
                var ny = cell.y + d.dy;
                var nz = cell.z + d.dz;

                if (nx >= 0 && nx < width && ny >= 0 && ny < height && nz >= 0 && nz < depth) {
                    if (!grid[nx][ny][nz].visited) {
                        neighbors.push({ x: nx, y: ny, z: nz, wall: d.wall, opposite: d.opposite });
                    }
                }
            }

            return neighbors;
        }

        // Generate maze
        while (true) {
            var neighbors = getUnvisitedNeighbors(current);

            if (neighbors.length > 0) {
                var next = this.randomPick(neighbors);
                stack.push(current);

                // Remove wall between current and next
                grid[current.x][current.y][current.z].walls[next.wall] = false;
                grid[next.x][next.y][next.z].walls[next.opposite] = false;

                current = { x: next.x, y: next.y, z: next.z };
                grid[current.x][current.y][current.z].visited = true;
            } else if (stack.length > 0) {
                current = stack.pop();
            } else {
                break;
            }
        }

        return grid;
    }
};

console.log('ProceduralGen module loaded');