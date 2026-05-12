// Game configuration and balancing values.
var LEVELS = {
    1: { 
        enemies: 70, 
        bossHp: 120, 
        title: "Mission 1", 
        points: [
            [-10, 8], [-10, -8], [0, -8], [0, 8], [10, 8]
        ], 
        slots: [{x:-7,z:0}, {x:0,z:-5}, {x:7,z:0}] 
    },
    2: { 
        enemies: 100, 
        bossHp: 240, 
        title: "Mission 2", 
        points: [
            [-14, 0], [-7, 0], [-7, -10], [0, -10], [0, 10], [7, 10], [7, 0], [14, 0]
        ], 
        slots: [{x:-10,z:5}, {x:-10,z:-5}, {x:0,z:-6}, {x:0,z:6}, {x:10,z:5}, {x:10,z:-5}] 
    },
    3: { 
        enemies: 120, 
        bossHp: 288,  // V109: 在原 240 基础上提升 20%
        title: "Mission 3 - Final Boss", 
        points: [
            [-16, 12], [-16, -12], [-8, -12], [-8, 12], [0, 12], [0, -12], [8, -12], [8, 12], [16, 12]
        ], 
        altEnemyChance: 0.25,
        altEnemyPoints: [[0, -14], [0, -12]],
        altRoadPoints: [[0, -14], [0, -12]],
        slots: [{x:-12,z:0}, {x:-8,z:-8}, {x:-8,z:8}, {x:0,z:-8}, {x:0,z:8}, {x:8,z:-8}, {x:8,z:8}, {x:12,z:0}] 
    }
};

var PRICES = {
    1: getWeaponConfig(1).price,
    2: getWeaponConfig(2).price,
    3: getWeaponConfig(3).price
};

var RAIL_TARGET_RANGE = getWeaponConfig(2).range;

