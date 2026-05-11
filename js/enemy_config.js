// Enemy wave configuration.
// Edit this file locally, save it, then refresh the game page for changes to take effect.
// probability values in each level should add up to 1.
// speed can be a fixed number, or speedMin/speedMax can be used for a random range.
var ENEMY_CONFIG = {
    modelTypes: {
        robot: '普通机器人',
        eliteDrone: '精英无人机',
        drone: '无人机',
        armored: '装甲单位',
        hoverArmor: '悬浮装甲',
        wheelbarrow: '独轮炮车'
    },
    levels: {
        1: [
            {
                modelType: 'robot',
                probability: 0.85,
                health: 5,
                speedMin: 0.018,
                speedMax: 0.03,
                isDrone: false
            },
            {
                modelType: 'eliteDrone',
                probability: 0.15,
                health: 8,
                speedMin: 0.018,
                speedMax: 0.03,
                isDrone: true
            }
        ],
        2: [
            {
                modelType: 'wheelbarrow',
                probability: 0.65,
                health: 9,
                speedMin: 0.016,
                speedMax: 0.028,
                isDrone: false
            },
            {
                modelType: 'eliteDrone',
                probability: 0.15,
                health: 11,
                speedMin: 0.018,
                speedMax: 0.03,
                isDrone: true
            },
            {
                modelType: 'armored',
                probability: 0.2,
                health: 15,
                speed: 0.015,
                isDrone: false
            }
        ],
        3: [
            {
                modelType: 'drone',
                probability: 0.4,
                health: 8,
                speed: 0.025,
                isDrone: true
            },
            {
                modelType: 'armored',
                probability: 0.4,
                health: 15,
                speed: 0.015,
                isDrone: false
            },
            {
                modelType: 'hoverArmor',
                probability: 0.2,
                health: 18,
                speed: 0.03,
                scale: 0.6,
                isDrone: true
            }
        ]
    }
};

function chooseEnemyConfig(level) {
    const entries = ENEMY_CONFIG.levels[level] || ENEMY_CONFIG.levels[1];
    const roll = Math.random();
    let cumulative = 0;
    for (let i = 0; i < entries.length; i++) {
        cumulative += entries[i].probability;
        if (roll < cumulative) {
            return entries[i];
        }
    }
    return entries[entries.length - 1];
}

function getEnemySpeed(enemyConfig) {
    if (enemyConfig.speed !== undefined) {
        return enemyConfig.speed;
    }
    const min = enemyConfig.speedMin || 0;
    const max = enemyConfig.speedMax !== undefined ? enemyConfig.speedMax : min;
    return min + Math.random() * Math.max(0, max - min);
}
