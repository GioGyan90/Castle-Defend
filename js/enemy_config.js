// Enemy wave configuration.
// Edit this file locally, save it, then refresh the game page for changes to take effect.
// probability values in each level should add up to 1.
// speed can be a fixed number, or speedMin/speedMax can be used for a random range.
var ENEMY_CONFIG = {
    modelTypes: {
        robot: '普通机器人',
        heavyRobot: '强化机器人',
        eliteDrone: '精英无人机',
        drone: '无人机',
        armored: '装甲单位',
        hoverArmor: '悬浮装甲',
        wheelbarrow: '独轮炮车',
        portalA: 'Portal A',
        portalB: 'Portal B',
        tankBoss: 'Tank Boss',
        chopper: 'Chopper Boss',
        finalBossAlpha: 'Final Boss Alpha'
    },
    levels: {
        1: [
            {
                modelType: 'robot',
                probability: 0.85,
                health: 3,
                speedMin: 0.018,
                speedMax: 0.03,
                scale: 1.55,
                isDrone: false
            },
            {
                modelType: 'eliteDrone',
                probability: 0.15,
                health: 5,
                speedMin: 0.018,
                speedMax: 0.03,
                scale: 0.95,
                isDrone: true
            }
        ],
        2: [
            {
                modelType: 'wheelbarrow',
                probability: 0.39,
                health: 9,
                speedMin: 0.016,
                speedMax: 0.028,
                scale: 0.85,
                isDrone: false
            },
            {
                modelType: 'heavyRobot',
                probability: 0.25,
                health: 12,
                speedMin: 0.016,
                speedMax: 0.025,
                scale: 1.2,
                isDrone: false
            },
            {
                modelType: 'eliteDrone',
                probability: 0.15,
                health: 11,
                speedMin: 0.018,
                speedMax: 0.03,
                scale: 0.95,
                isDrone: true
            },
            {
                modelType: 'armored',
                probability: 0.21,
                health: 15,
                speed: 0.015,
                scale: 0.52,
                isDrone: false
            }
        ],
        3: [
            {
                modelType: 'drone',
                probability: 0.3,
                health: 8,
                speed: 0.025,
                scale: 1.05,
                isDrone: true
            },
            {
                modelType: 'heavyRobot',
                probability: 0.16,
                health: 14,
                speedMin: 0.017,
                speedMax: 0.026,
                scale: 1.25,
                isDrone: false
            },
            {
                modelType: 'armored',
                probability: 0.35,
                health: 15,
                speed: 0.015,
                scale: 0.55,
                isDrone: false
            },
            {
                modelType: 'hoverArmor',
                probability: 0.19,
                health: 18,
                speed: 0.03,
                scale: 0.85,
                isDrone: true
            }
        ]
    }
};

var ENEMY_CATEGORIES = {
    infantry: ['robot', 'heavyRobot'],
    armor: ['armored', 'wheelbarrow'],
    air: ['drone', 'eliteDrone', 'hoverArmor'],
    boss: ['tankBoss', 'gorillaBoss', 'helicopterBoss', 'chopper'],
    portal: ['portalA', 'portalB']
};

function getEnemyCategory(modelType) {
    for (const category in ENEMY_CATEGORIES) {
        if (ENEMY_CATEGORIES[category].includes(modelType)) {
            return category;
        }
    }
    return 'infantry';
}

function choosePortalInfantryConfig(level) {
    const candidates = [];
    for (let mission = 1; mission <= level; mission++) {
        const entries = ENEMY_CONFIG.levels[mission] || [];
        entries.forEach(entry => {
            if (getEnemyCategory(entry.modelType) === 'infantry') {
                candidates.push(entry);
            }
        });
    }
    if (candidates.length === 0) {
        return {
            modelType: 'robot',
            health: 3,
            speedMin: 0.018,
            speedMax: 0.03,
            scale: 1.55,
            isDrone: false
        };
    }
    return Object.assign({}, candidates[Math.floor(Math.random() * candidates.length)]);
}

function choosePortalAirConfig(level) {
    const candidates = [];
    for (let mission = 1; mission <= level; mission++) {
        const entries = ENEMY_CONFIG.levels[mission] || [];
        entries.forEach(entry => {
            if (getEnemyCategory(entry.modelType) === 'air') {
                candidates.push(entry);
            }
        });
    }
    if (candidates.length === 0) {
        return {
            modelType: 'eliteDrone',
            health: 5,
            speedMin: 0.018,
            speedMax: 0.03,
            scale: 0.95,
            isDrone: true
        };
    }
    return Object.assign({}, candidates[Math.floor(Math.random() * candidates.length)]);
}

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

function getEnemyConfigByModelType(level, modelType) {
    const candidates = [];
    const levelEntries = ENEMY_CONFIG.levels[level] || [];
    levelEntries.forEach(entry => {
        if (entry.modelType === modelType) candidates.push(entry);
    });
    Object.keys(ENEMY_CONFIG.levels).forEach(key => {
        (ENEMY_CONFIG.levels[key] || []).forEach(entry => {
            if (entry.modelType === modelType) candidates.push(entry);
        });
    });
    if (candidates.length > 0) return Object.assign({}, candidates[0]);
    return {
        modelType,
        health: 6,
        speedMin: 0.018,
        speedMax: 0.03,
        scale: 1,
        isDrone: getEnemyCategory(modelType) === 'air',
        category: getEnemyCategory(modelType)
    };
}

function getEnemySpeed(enemyConfig) {
    if (enemyConfig.speed !== undefined) {
        return enemyConfig.speed;
    }
    const min = enemyConfig.speedMin || 0;
    const max = enemyConfig.speedMax !== undefined ? enemyConfig.speedMax : min;
    return min + Math.random() * Math.max(0, max - min);
}
