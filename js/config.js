// Game configuration and balancing values.
// Mobile-first design: compact maps centered on screen
// Coordinates scaled to fit mobile viewport, then adapted for PC
var LEVELS = {
    1: { 
        enemies: 70, 
        bossHp: 120, 
        title: "Mission 1", 
        // Simple straight path from left to right (compact, centered)
        // Enemy spawn point: [-14, 0]
        // Base location: [14, 0] (end of path)
        points: [
            [-14, 0],   // Spawn point (left side)
            [-7, 0],    // First waypoint
            [0, 0],     // Center
            [7, 0],     // Second waypoint
            [14, 0]     // Base location (right side - end of path)
        ], 
        slots: [
            {x:-10, z:5},   // Left-top slot
            {x:-10, z:-5},  // Left-bottom slot
            {x:0, z:6},     // Center-top slot
            {x:0, z:-6},    // Center-bottom slot
            {x:10, z:5},    // Right-top slot
            {x:10, z:-5}    // Right-bottom slot
        ] 
    },
    2: { 
        enemies: 100, 
        bossHp: 240, 
        title: "Mission 2", 
        // U-shaped path: spawn at left, go up, across, then down to base at right (compact, centered)
        // Enemy spawn point: [-12, -10]
        // Base location: [12, -10] (end of path)
        points: [
            [-12, -10],  // Spawn point (left)
            [-12, 6],    // Go north
            [-6, 9],     // Corner
            [0, 9],      // Top center
            [6, 9],      // Corner
            [12, 6],     // Go south
            [12, -10]    // Base location (right - end of path)
        ], 
        slots: [
            {x:-10, z:3},   // Left side slots
            {x:-10, z:-7},
            {x:0, z:13},    // Top center slots
            {x:0, z:-13},   // Bottom center slots
            {x:10, z:3},    // Right side slots
            {x:10, z:-7}
        ] 
    },
    3: { 
        enemies: 120, 
        bossHp: 288,
        title: "Mission 3 - Final Boss", 
        // W-shaped path with alternate route (compact, centered)
        // Main path spawn: [-14, 8]
        // Main path base: [14, 8] (end of path)
        // Alternate path spawn: [0, -13]
        points: [
            [-14, 8],    // Main spawn point (left-top)
            [-14, -6],   // Go south
            [-6, -6],    // Small detour
            [-6, 6],     // Go north
            [0, 6],      // Center top
            [0, -6],     // Go south through center
            [6, -6],     // Small detour
            [6, 6],      // Go north
            [14, 6],     // East
            [14, 8]      // Base location (right-top - end of path)
        ], 
        altEnemyChance: 0.25,
        // Alternate path for some enemies (flank route)
        altEnemyPoints: [
            [0, -13],    // Alternate spawn (bottom center)
            [0, -8],     // Merge point
            [0, -6]      // Joins main path
        ],
        altRoadPoints: [
            [0, -13],
            [0, -8],
            [0, -6]
        ],
        slots: [
            {x:-12, z:2},   // Left area slots
            {x:-12, z:-10},
            {x:-5, z:10},
            {x:-5, z:-10},
            {x:0, z:-17},   // Bottom center (near alt spawn)
            {x:5, z:10},
            {x:5, z:-10},
            {x:12, z:2}     // Right area slots
        ] 
    }
};

var PRICES = {
    1: getWeaponConfig(1).price,
    2: getWeaponConfig(2).price,
    3: getWeaponConfig(3).price
};

var RAIL_TARGET_RANGE = getWeaponConfig(2).range;

