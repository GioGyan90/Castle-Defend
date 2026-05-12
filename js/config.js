// Game configuration and balancing values.
var LEVELS = {
    1: { 
        enemies: 70, 
        bossHp: 120, 
        title: "Mission 1", 
        // Simple straight path from left to right
        // Enemy spawn point: [-40, 0]
        // Base location: [40, 0] (end of path)
        points: [
            [-40, 0],   // Spawn point (left side)
            [-20, 0],   // First waypoint
            [0, 0],     // Center
            [20, 0],    // Third waypoint
            [40, 0]     // Base location (right side - end of path)
        ], 
        slots: [
            {x:-15, z:8},   // Left-top slot
            {x:-15, z:-8},  // Left-bottom slot
            {x:0, z:10},    // Center-top slot
            {x:0, z:-10},   // Center-bottom slot
            {x:15, z:8},    // Right-top slot
            {x:15, z:-8}    // Right-bottom slot
        ] 
    },
    2: { 
        enemies: 100, 
        bossHp: 240, 
        title: "Mission 2", 
        // U-shaped path: spawn at bottom-left, go up, across, then down to base at bottom-right
        // Enemy spawn point: [-35, -25]
        // Base location: [35, -25] (end of path)
        points: [
            [-35, -25],  // Spawn point (bottom-left)
            [-35, 0],    // Go north
            [-35, 25],   // Continue north
            [0, 25],     // Turn east
            [35, 25],    // Continue east
            [35, 0],     // Turn south
            [35, -25]    // Base location (bottom-right - end of path)
        ], 
        slots: [
            {x:-28, z:15},  // Left side slots
            {x:-28, z:-15},
            {x:0, z:35},    // Top center slots
            {x:0, z:-35},   // Bottom center slots
            {x:28, z:15},   // Right side slots
            {x:28, z:-15}
        ] 
    },
    3: { 
        enemies: 120, 
        bossHp: 288,
        title: "Mission 3 - Final Boss", 
        // W-shaped path with alternate route
        // Main path spawn: [-40, 20]
        // Main path base: [40, 20] (end of path)
        // Alternate path spawn: [0, -35]
        points: [
            [-40, 20],   // Main spawn point (top-left)
            [-40, -15],  // Go south
            [-20, -15],  // Small detour
            [-20, 15],   // Go north
            [0, 15],     // Center top
            [0, -15],    // Go south through center
            [20, -15],   // Small detour
            [20, 15],    // Go north
            [40, 15],    // East
            [40, 20]     // Base location (top-right - end of path)
        ], 
        altEnemyChance: 0.25,
        // Alternate path for some enemies (flank route)
        altEnemyPoints: [
            [0, -35],    // Alternate spawn (bottom center)
            [0, -20],    // Merge point
            [0, -15]     // Joins main path
        ],
        altRoadPoints: [
            [0, -35],
            [0, -20],
            [0, -15]
        ],
        slots: [
            {x:-32, z:5},   // Left area slots
            {x:-32, z:-25},
            {x:-15, z:25},
            {x:-15, z:-25},
            {x:0, z:-45},   // Bottom center (near alt spawn)
            {x:15, z:25},
            {x:15, z:-25},
            {x:32, z:5}     // Right area slots
        ] 
    }
};

var PRICES = {
    1: getWeaponConfig(1).price,
    2: getWeaponConfig(2).price,
    3: getWeaponConfig(3).price
};

var RAIL_TARGET_RANGE = getWeaponConfig(2).range;

