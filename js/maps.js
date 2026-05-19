// Mission map layouts and cyber-road rendering.
// Keep paths wide, readable, and compact enough for mobile full-screen play.

const MAP_ROAD_WIDTH = 3.5;
const MAP_ROAD_HEIGHT = 0.16;
const MAP_GROUND_SIZE = 54;

var LEVELS = {
    "1": {
        enemies: 27,
        bossHp: 250,
        title: "Mission 1",
        startingScore: 6,
        availableDefenseWeapons: [
            1
        ],
        cameraExtent: 5.5,
        camera: {
            portrait: {
                fov: 52,
                minDistance: 35,
                factor: 2.66,
                zRatio: 0.66,
                x: 0.8,
                lookAtX: 0.8,
                lookAtZ: 0.1
            },
            landscape: {
                minDistance: 23,
                factor: 1.32,
                lookAtZ: 0.2
            }
        },
        roadWidth: 3,
        points: [
            [-2.2, -7.77],
            [1.09, -10.41],
            [1.12, 4.53],
            [6.28, 8.43],
            [-3.61, 8.53]
        ],
        slots: [
            {
                x: 4.57,
                z: 2.64
            },
            {
                x: -2.26,
                z: 3.34
            },
            {
                x: 8.04,
                z: 6.05
            }
        ],
        enemyWaves: [
            {
                label: "Robot scouts",
                modelType: "heavyRobot",
                count: 12,
                startMs: 800,
                intervalMs: 2100,
                path: "main",
                health: 3,
                scale: 1.55,
                speed: 0.03
            },
            {
                label: "Boss",
                modelType: "tankBoss",
                count: 1,
                startMs: 26000,
                intervalMs: 500,
                path: "main",
                health: 38,
                speed: 0.02,
                scale: 1
            },
            {
                label: "Wave 3",
                modelType: "drone",
                count: 14,
                startMs: 10200,
                intervalMs: 1090,
                path: "main",
                health: 5,
                speed: 0.02,
                scale: 1
            }
        ],
        cardRules: {
            enabled: true,
            cards: {
                J: {
                    enabled: true,
                    price: 15,
                    fireRateBonus: 0.25,
                    damageBonus: 0,
                    incomePerSecond: 0
                },
                Q: {
                    enabled: false,
                    price: 25,
                    fireRateBonus: 0.15,
                    damageBonus: 5,
                    incomePerSecond: 0
                },
                K: {
                    enabled: false,
                    price: 35,
                    fireRateBonus: 0.2,
                    damageBonus: 10,
                    incomePerSecond: 5
                }
            }
        }
    },
    "2": {
        enemies: 35,
        bossHp: 240,
        title: "Mission 2",
        startingScore: 20,
        availableDefenseWeapons: [
            2
        ],
        cameraExtent: 11.2,
        camera: {
            portrait: {
                fov: 52,
                minDistance: 37,
                factor: 2.62,
                zRatio: 0.66,
                x: 0.8,
                lookAtX: 0.8,
                lookAtZ: 0.2
            },
            landscape: {
                minDistance: 24,
                factor: 1.34,
                lookAtZ: 0.3
            }
        },
        roadWidth: 3.2,
        points: [
            [-5.73, -9.78],
            [4.43, -9.74],
            [4.4, -2.32],
            [-5.49, -0.25],
            [-5.49, 7.07],
            [5.82, 7.1]
        ],
        slots: [
            {
                x: -2.15,
                z: 3.41
            },
            {
                x: 4.9,
                z: 1.27
            }
        ],
        enemyWaves: [
            {
                label: "Portal A breach",
                modelType: "portalA",
                count: 3,
                startMs: 3000,
                intervalMs: 1500,
                path: "main",
                health: 120,
                scale: 1
            },
            {
                label: "Elite drone pass",
                modelType: "eliteDrone",
                count: 9,
                startMs: 4600,
                intervalMs: 800,
                path: "main",
                health: 11,
                speedMin: 0.02,
                speedMax: 0.03,
                scale: 0.95
            },
            {
                label: "Armored close",
                modelType: "wheelbarrow",
                count: 16,
                startMs: 1000,
                intervalMs: 720,
                path: "main",
                health: 15,
                speed: 0.03,
                scale: 0.52
            },
            {
                label: "Fin Boss",
                modelType: "tankBoss",
                count: 1,
                startMs: 12600,
                intervalMs: 500,
                path: "main",
                health: 80,
                speed: 0.02,
                scale: 1
            },
            {
                label: "Wave 6",
                modelType: "hoverArmor",
                count: 6,
                startMs: 9300,
                intervalMs: 500,
                path: "main",
                health: 6,
                speed: 0.02,
                scale: 1
            }
        ],
        cardRules: {
            enabled: true,
            cards: {
                J: {
                    enabled: true,
                    price: 15,
                    fireRateBonus: 0.25,
                    damageBonus: 0,
                    incomePerSecond: 0
                },
                Q: {
                    enabled: false,
                    price: 25,
                    fireRateBonus: 0.15,
                    damageBonus: 5,
                    incomePerSecond: 0
                },
                K: {
                    enabled: false,
                    price: 35,
                    fireRateBonus: 0.2,
                    damageBonus: 10,
                    incomePerSecond: 5
                }
            }
        }
    },
    "3": {
        enemies: 71,
        bossHp: 250,
        title: "Mission 3",
        startingScore: 40,
        availableDefenseWeapons: [
            4
        ],
        cameraExtent: 10.5,
        camera: {
            portrait: {
                fov: 52,
                minDistance: 35,
                factor: 2.66,
                zRatio: 0.66,
                x: 0.8,
                lookAtX: 0.8,
                lookAtZ: 0.1
            },
            landscape: {
                minDistance: 23,
                factor: 1.32,
                lookAtZ: 0.2
            }
        },
        roadWidth: 3,
        points: [
            [-4.66, -8.31],
            [3.66, -8.28],
            [-2.83, -0.1],
            [3.06, -0.99],
            [5.37, 2.93],
            [2.77, 7.71],
            [-4.07, 7.71]
        ],
        slots: [],
        enemyWaves: [
            {
                label: "Robot scouts",
                modelType: "heavyRobot",
                count: 28,
                startMs: 1200,
                intervalMs: 640,
                path: "alternate",
                health: 3,
                scale: 1.55,
                speed: 0.03
            },
            {
                label: "Elite drones",
                modelType: "eliteDrone",
                count: 35,
                startMs: 3200,
                intervalMs: 440,
                path: "main",
                health: 5,
                scale: 0.95,
                speed: 0.02
            },
            {
                label: "Boss",
                modelType: "tankBoss",
                count: 2,
                startMs: 12100,
                intervalMs: 6780,
                path: "main",
                health: 350,
                speed: 0.01,
                scale: 1
            },
            {
                label: "Wave 4",
                modelType: "portalA",
                count: 6,
                startMs: 8300,
                intervalMs: 1980,
                path: "main",
                health: 70,
                speed: 0,
                scale: 1
            }
        ],
        cardRules: {
            enabled: true,
            cards: {
                J: {
                    enabled: true,
                    price: 15,
                    fireRateBonus: 0.25,
                    damageBonus: 0,
                    incomePerSecond: 0
                },
                Q: {
                    enabled: true,
                    price: 25,
                    fireRateBonus: 0.15,
                    damageBonus: 5,
                    incomePerSecond: 0
                },
                K: {
                    enabled: true,
                    price: 35,
                    fireRateBonus: 0.2,
                    damageBonus: 10,
                    incomePerSecond: 5
                }
            }
        }
    },
    "4": {
        enemies: 106,
        bossHp: 240,
        title: "Mission 4",
        startingScore: 35,
        availableDefenseWeapons: [
            1,
            3
        ],
        cameraExtent: 11.2,
        camera: {
            portrait: {
                fov: 52,
                minDistance: 37,
                factor: 2.62,
                zRatio: 0.66,
                x: 0.8,
                lookAtX: 0.8,
                lookAtZ: 0.2
            },
            landscape: {
                minDistance: 24,
                factor: 1.34,
                lookAtZ: 0.3
            }
        },
        roadWidth: 3.2,
        points: [
            [-5.52, -11.3],
            [-5.43, -0.41],
            [0.96, 6.81],
            [1.35, -1.82],
            [4.04, -7.87],
            [7.62, -4.62]
        ],
        slots: [
            {
                x: -2.03,
                z: -1.69
            },
            {
                x: 4.57,
                z: -0.83
            }
        ],
        enemyWaves: [
            {
                label: "Wheelbarrow pressure",
                modelType: "wheelbarrow",
                count: 34,
                startMs: 0,
                intervalMs: 420,
                path: "main",
                health: 9,
                speedMin: 0.02,
                speedMax: 0.03,
                scale: 0.85
            },
            {
                label: "Heavy robot squad",
                modelType: "heavyRobot",
                count: 24,
                startMs: 6500,
                intervalMs: 650,
                path: "main",
                health: 12,
                speedMin: 0.02,
                speedMax: 0.03,
                scale: 1.2
            },
            {
                label: "Portal A breach",
                modelType: "portalA",
                count: 1,
                startMs: 15000,
                intervalMs: 1000,
                path: "main",
                health: 120,
                scale: 1
            },
            {
                label: "Elite drone pass",
                modelType: "eliteDrone",
                count: 16,
                startMs: 18500,
                intervalMs: 700,
                path: "main",
                health: 11,
                speedMin: 0.02,
                speedMax: 0.03,
                scale: 0.95
            },
            {
                label: "Chopper boss warning",
                modelType: "chopper",
                count: 3,
                startMs: 22000,
                intervalMs: 7000,
                path: "main",
                health: 180,
                speed: 0.02,
                scale: 0.9,
                hpBarY: 4.4
            },
            {
                label: "Armored close",
                modelType: "armored",
                count: 26,
                startMs: 23900,
                intervalMs: 620,
                path: "main",
                health: 15,
                speed: 0.02,
                scale: 0.52
            },
            {
                label: "Fin Boss",
                modelType: "tankBoss",
                count: 2,
                startMs: 35300,
                intervalMs: 3500,
                path: "main",
                health: 180,
                speed: 0.02,
                scale: 1
            }
        ],
        cardRules: {
            enabled: true,
            cards: {
                J: {
                    enabled: true,
                    price: 15,
                    fireRateBonus: 0.25,
                    damageBonus: 0,
                    incomePerSecond: 0
                },
                Q: {
                    enabled: true,
                    price: 25,
                    fireRateBonus: 0.15,
                    damageBonus: 5,
                    incomePerSecond: 0
                },
                K: {
                    enabled: false,
                    price: 35,
                    fireRateBonus: 0.2,
                    damageBonus: 10,
                    incomePerSecond: 5
                }
            }
        }
    },
    "5": {
        enemies: 110,
        bossHp: 288,
        title: "Mission 5",
        startingScore: 60,
        availableDefenseWeapons: [
            2,
            4
        ],
        cameraExtent: 12.5,
        camera: {
            portrait: {
                fov: 53,
                minDistance: 39,
                factor: 2.58,
                zRatio: 0.67,
                x: 0.9,
                lookAtX: 0.9,
                lookAtZ: 0.85
            },
            landscape: {
                minDistance: 25,
                factor: 1.36,
                lookAtZ: 0.85
            }
        },
        roadWidth: 3,
        points: [
            [3.51, -10.73],
            [-4.66, -10.79],
            [-4.9, -2.23],
            [3.12, -3.18],
            [6.85, 0.38],
            [7.18, 5.64],
            [2.23, 8.6],
            [-4.9, 8.66]
        ],
        slots: [
            {
                x: 3.74,
                z: 3.09
            },
            {
                x: 0.87,
                z: 5.19
            }
        ],
        enemyWaves: [
            {
                label: "Drone screen",
                modelType: "drone",
                count: 28,
                startMs: 0,
                intervalMs: 520,
                path: "main",
                health: 8,
                speed: 0.02,
                scale: 1.05
            },
            {
                label: "Heavy robot line",
                modelType: "heavyRobot",
                count: 22,
                startMs: 7000,
                intervalMs: 680,
                path: "main",
                health: 14,
                speedMin: 0.02,
                speedMax: 0.03,
                scale: 1.25
            },
            {
                label: "Portal A left",
                modelType: "portalB",
                count: 3,
                startMs: 13000,
                intervalMs: 1800,
                path: "main",
                health: 120,
                scale: 1
            },
            {
                label: "Portal A alternate",
                modelType: "portalA",
                count: 3,
                startMs: 24500,
                intervalMs: 2400,
                path: "alternate",
                health: 90,
                scale: 1
            },
            {
                label: "Portal B air breach",
                modelType: "portalB",
                count: 3,
                startMs: 36500,
                intervalMs: 1000,
                path: "main",
                health: 120,
                scale: 1
            },
            {
                label: "Final drone rush",
                modelType: "drone",
                count: 12,
                startMs: 41000,
                intervalMs: 480,
                path: "main",
                health: 8,
                speed: 0.02,
                scale: 1.05
            },
            {
                label: "Wave 7",
                modelType: "hoverArmor",
                count: 20,
                startMs: 18280,
                intervalMs: 800,
                path: "main",
                health: 6,
                speed: 0.01,
                scale: 1
            },
            {
                label: "Wave 8",
                modelType: "eliteDrone",
                count: 15,
                startMs: 24780,
                intervalMs: 1500,
                path: "main",
                health: 6,
                speed: 0.02,
                scale: 1
            },
            {
                label: "Wave 9",
                modelType: "finalBossAlpha",
                count: 2,
                startMs: 38280,
                intervalMs: 4500,
                path: "main",
                health: 500,
                speed: 0.01,
                scale: 1
            },
            {
                label: "Wave 10",
                modelType: "chopper",
                count: 1,
                startMs: 15000,
                intervalMs: 4000,
                path: "main",
                health: 22,
                speed: 0.02,
                scale: 1
            },
            {
                label: "Wave 11",
                modelType: "tankBoss",
                count: 1,
                startMs: 48280,
                intervalMs: 500,
                path: "main",
                health: 800,
                speed: 0.02,
                scale: 1
            }
        ],
        cardRules: {
            enabled: true,
            cards: {
                J: {
                    enabled: true,
                    price: 15,
                    fireRateBonus: 0.25,
                    damageBonus: 0,
                    incomePerSecond: 0
                },
                Q: {
                    enabled: true,
                    price: 25,
                    fireRateBonus: 0.15,
                    damageBonus: 5,
                    incomePerSecond: 0
                },
                K: {
                    enabled: true,
                    price: 35,
                    fireRateBonus: 0.2,
                    damageBonus: 10,
                    incomePerSecond: 5
                }
            }
        },
        altEnemyPoints: [
            [-4.66, -10.79],
            [-4.9, -2.23],
            [3.12, -3.18],
            [6.85, 0.38],
            [7.18, 5.64],
            [2.23, 8.6]
        ]
    },
    "6": {
        enemies: 0,
        bossHp: 0,
        title: "Mission 6 - Assault",
        attackMode: true,
        startingScore: 360,
        opponentBaseHp: 3,
        timeLimitMs: 60000,
        incomeAmount: 30,
        incomeIntervalMs: 5000,
        availableAttackUnits: [
            {
                key: "heavyRobot",
                modelType: "heavyRobot",
                label: "Heavy Robot",
                price: 10,
                health: 28,
                speed: 0.04,
                scale: 1.22,
                maxPurchases: 0,
                category: "infantry"
            },
            {
                key: "finalBossAlpha",
                modelType: "finalBossAlpha",
                label: "Final Boss Alpha",
                price: 160,
                health: 320,
                speed: 0.03,
                scale: 1,
                maxPurchases: 1,
                category: "infantry",
                hpBarY: 4.5
            },
            {
                key: "portalB",
                modelType: "portalB",
                label: "Portal B",
                price: 80,
                health: 320,
                speed: 0,
                scale: 1,
                maxPurchases: 2,
                category: "portal"
            },
            {
                key: "wheelbarrow",
                modelType: "wheelbarrow",
                label: "独轮炮车",
                price: 18,
                health: 34,
                speed: 0.05,
                scale: 0.85,
                maxPurchases: 0,
                category: "armor"
            }
        ],
        cameraExtent: 12,
        camera: {
            portrait: {
                fov: 53,
                minDistance: 39,
                factor: 2.58,
                zRatio: 0.67,
                x: 0.9,
                lookAtX: 0.9,
                lookAtZ: 0.35
            },
            landscape: {
                minDistance: 25,
                factor: 1.36,
                lookAtZ: 0.45
            }
        },
        roadWidth: 3.5,
        points: [
            [-6.2, -8.8],
            [-6.2, 7],
            [6.2, 7],
            [6.2, -4.8],
            [1.2, -4.8]
        ],
        slots: [],
        enemyTowers: [
            {
                type: 1,
                x: -8.7,
                z: -1.2
            },
            {
                type: 2,
                x: -1.8,
                z: 3.6
            },
            {
                type: 1,
                x: 2.8,
                z: 3.8
            },
            {
                type: 1,
                x: -2.06,
                z: -1.21
            },
            {
                type: 3,
                x: 2.92,
                z: -1.5
            }
        ],
        enemyWaves: [],
        availableDefenseWeapons: [],
        cardRules: {
            enabled: true,
            cards: {
                J: {
                    enabled: true,
                    price: 15,
                    fireRateBonus: 0.25,
                    damageBonus: 0,
                    incomePerSecond: 0
                },
                Q: {
                    enabled: true,
                    price: 25,
                    fireRateBonus: 0.15,
                    damageBonus: 5,
                    incomePerSecond: 0
                },
                K: {
                    enabled: true,
                    price: 35,
                    fireRateBonus: 0.2,
                    damageBonus: 10,
                    incomePerSecond: 5
                }
            }
        }
    },
    "7": {
        enemies: 75,
        title: "Mission 7",
        startingScore: 160,
        availableDefenseWeapons: [
            2,
            3,
            4
        ],
        cameraExtent: 12,
        camera: {
            portrait: {
                fov: 53,
                minDistance: 39,
                factor: 2.58,
                zRatio: 0.67,
                x: 0.9,
                lookAtX: 0.9,
                lookAtZ: 0.35
            },
            landscape: {
                minDistance: 25,
                factor: 1.36,
                lookAtZ: 0.45
            }
        },
        roadWidth: 3.5,
        points: [
            [-6.5, -11.65],
            [0.22, -11.4],
            [8.54, -0.51],
            [2.8, 2.77],
            [-3.57, -1.56],
            [-6.76, 1.21],
            [-6.82, 5.6]
        ],
        slots: [
            {
                x: 2.74,
                z: -1.46
            },
            {
                x: -7.65,
                z: -3.15
            },
            {
                x: -0.19,
                z: -4.62
            },
            {
                x: 8.36,
                z: 4.27
            }
        ],
        enemyWaves: [
            {
                label: "Wave 1",
                modelType: "portalA",
                count: 12,
                startMs: 2900,
                intervalMs: 1460,
                path: "main",
                health: 30,
                speedMin: 0.02,
                speedMax: 0.03,
                scale: 1.2
            },
            {
                label: "Wave 2",
                modelType: "portalB",
                count: 2,
                startMs: 6500,
                intervalMs: 800,
                path: "main",
                health: 50,
                speedMin: 0.02,
                speedMax: 0.03,
                scale: 0.95
            },
            {
                label: "Wave 3",
                modelType: "hoverArmor",
                count: 10,
                startMs: 9300,
                intervalMs: 500,
                path: "main",
                health: 6,
                speed: 0.02,
                scale: 1
            },
            {
                label: "Wave 4",
                modelType: "wheelbarrow",
                count: 10,
                startMs: 15800,
                intervalMs: 500,
                path: "main",
                health: 6,
                speed: 0.02,
                scale: 1
            },
            {
                label: "Wave 5",
                modelType: "eliteDrone",
                count: 16,
                startMs: 1100,
                intervalMs: 1500,
                path: "main",
                health: 6,
                speed: 0.02,
                scale: 1
            },
            {
                label: "Wave 6",
                modelType: "heavyRobot",
                count: 18,
                startMs: 13000,
                intervalMs: 500,
                path: "main",
                health: 6,
                speed: 0.03,
                scale: 1
            },
            {
                label: "Wave 7",
                modelType: "finalBossAlpha",
                count: 3,
                startMs: 18400,
                intervalMs: 2500,
                path: "main",
                health: 680,
                speed: 0.02,
                scale: 1
            },
            {
                label: "Wave 8",
                modelType: "tankBoss",
                count: 4,
                startMs: 11800,
                intervalMs: 2500,
                path: "main",
                health: 340,
                speed: 0.02,
                scale: 1
            }
        ],
        cardRules: {
            enabled: true,
            cards: {
                J: {
                    enabled: true,
                    price: 15,
                    fireRateBonus: 0.25,
                    damageBonus: 0,
                    incomePerSecond: 0
                },
                Q: {
                    enabled: true,
                    price: 25,
                    fireRateBonus: 0.15,
                    damageBonus: 5,
                    incomePerSecond: 0
                },
                K: {
                    enabled: true,
                    price: 35,
                    fireRateBonus: 0.2,
                    damageBonus: 10,
                    incomePerSecond: 5
                }
            }
        }
    },
    "8": {
        enemies: 70,
        bossHp: 250,
        title: "Mission 8",
        startingScore: 150,
        availableDefenseWeapons: [
            2,
            3,
            4
        ],
        cameraExtent: 12,
        camera: {
            portrait: {
                fov: 53,
                minDistance: 39,
                factor: 2.58,
                zRatio: 0.67,
                x: 0.9,
                lookAtX: 0.9,
                lookAtZ: 0.35
            },
            landscape: {
                minDistance: 25,
                factor: 1.36,
                lookAtZ: 0.45
            }
        },
        roadWidth: 3.5,
        points: [
            [0.4, -3.57],
            [0.34, -10.83],
            [9.25, -0.32],
            [0.49, 9.84],
            [-6.85, -1.34]
        ],
        slots: [
            {
                x: 1.11,
                z: 3.88
            },
            {
                x: 2.92,
                z: 1.75
            },
            {
                x: 4.69,
                z: 0
            }
        ],
        enemyWaves: [
            {
                label: "Opening robots",
                modelType: "finalBossAlpha",
                count: 8,
                startMs: 2200,
                intervalMs: 4250,
                path: "main",
                health: 280,
                scale: 1.2,
                speed: 0.01
            },
            {
                label: "Air follow-up",
                modelType: "eliteDrone",
                count: 44,
                startMs: 800,
                intervalMs: 530,
                path: "main",
                health: 45,
                scale: 0.95,
                speed: 0.02
            },
            {
                label: "Wave 3",
                modelType: "chopper",
                count: 6,
                startMs: 2000,
                intervalMs: 6080,
                path: "main",
                health: 200,
                speed: 0.01,
                scale: 1
            },
            {
                label: "Wave 4",
                modelType: "portalB",
                count: 12,
                startMs: 7000,
                intervalMs: 2150,
                path: "alternate",
                health: 320,
                speed: 0,
                scale: 1
            }
        ],
        cardRules: {
            enabled: true,
            cards: {
                J: {
                    enabled: true,
                    price: 15,
                    fireRateBonus: 0.25,
                    damageBonus: 0,
                    incomePerSecond: 0
                },
                Q: {
                    enabled: true,
                    price: 25,
                    fireRateBonus: 0.15,
                    damageBonus: 5,
                    incomePerSecond: 0
                },
                K: {
                    enabled: true,
                    price: 35,
                    fireRateBonus: 0.2,
                    damageBonus: 10,
                    incomePerSecond: 5
                }
            }
        },
        altEnemyPoints: [
            [9.25, -0.32],
            [0.5, 9.9],
            [-6.85, -1.34]
        ]
    },
    "9": {
        enemies: 174,
        bossHp: 250,
        title: "Mission 9",
        startingScore: 80,
        availableDefenseWeapons: [
            3,
            4
        ],
        cameraExtent: 12,
        camera: {
            portrait: {
                fov: 53,
                minDistance: 39,
                factor: 2.58,
                zRatio: 0.67,
                x: 0.9,
                lookAtX: 0.9,
                lookAtZ: 0.35
            },
            landscape: {
                minDistance: 25,
                factor: 1.36,
                lookAtZ: 0.45
            }
        },
        roadWidth: 3.5,
        points: [
            [-6.5, -11.65],
            [0.22, -11.4],
            [8.54, -0.51],
            [2.8, 2.77],
            [-3.57, -1.56],
            [-6.76, 1.21],
            [-6.82, 5.6]
        ],
        slots: [
            {
                x: 6.47,
                z: 5.29
            },
            {
                x: -3.18,
                z: 2.55
            },
            {
                x: 10.55,
                z: -4.11
            }
        ],
        enemyWaves: [
            {
                label: "Opening robots",
                modelType: "heavyRobot",
                count: 70,
                startMs: 1000,
                intervalMs: 700,
                path: "main",
                health: 3,
                speedMin: 0.02,
                speedMax: 0.03,
                scale: 1.2
            },
            {
                label: "Air follow-up",
                modelType: "chopper",
                count: 8,
                startMs: 17000,
                intervalMs: 6060,
                path: "main",
                health: 50,
                speedMin: 0.02,
                speedMax: 0.03,
                scale: 0.95
            },
            {
                label: "Wave 3",
                modelType: "hoverArmor",
                count: 30,
                startMs: 9500,
                intervalMs: 1350,
                path: "main",
                health: 6,
                speed: 0.02,
                scale: 1
            },
            {
                label: "Wave 4",
                modelType: "eliteDrone",
                count: 50,
                startMs: 10000,
                intervalMs: 900,
                path: "main",
                health: 6,
                speed: 0.02,
                scale: 1
            },
            {
                label: "Wave 5",
                modelType: "portalB",
                count: 10,
                startMs: 15000,
                intervalMs: 4500,
                path: "alternate",
                health: 340,
                speed: 0.02,
                scale: 1
            },
            {
                label: "Wave 6",
                modelType: "tankBoss",
                count: 6,
                startMs: 21000,
                intervalMs: 6060,
                path: "main",
                health: 110,
                speed: 0.02,
                scale: 1
            }
        ],
        cardRules: {
            enabled: true,
            cards: {
                J: {
                    enabled: true,
                    price: 15,
                    fireRateBonus: 0.25,
                    damageBonus: 0,
                    incomePerSecond: 0
                },
                Q: {
                    enabled: false,
                    price: 25,
                    fireRateBonus: 0.15,
                    damageBonus: 5,
                    incomePerSecond: 0
                },
                K: {
                    enabled: true,
                    price: 35,
                    fireRateBonus: 0.2,
                    damageBonus: 10,
                    incomePerSecond: 5
                }
            }
        },
        altEnemyPoints: [
            [8.54, -0.51],
            [2.8, 2.77],
            [-3.57, -1.56],
            [-6.76, 1.21],
            [-6.82, 5.6]
        ]
    },
    "10": {
        enemies: 0,
        bossHp: 0,
        title: "Mission 10 - Assault",
        attackMode: true,
        startingScore: 300,
        opponentBaseHp: 5,
        timeLimitMs: 90000,
        incomeAmount: 30,
        incomeIntervalMs: 5000,
        availableDefenseWeapons: [],
        availableAttackUnits: [
            {
                key: "tankBoss",
                modelType: "tankBoss",
                label: "Tank Boss",
                price: 120,
                health: 420,
                speed: 0.05,
                scale: 1,
                maxPurchases: 1,
                category: "boss",
                hpBarY: 3.5
            },
            {
                key: "portalB",
                modelType: "portalB",
                label: "Portal B",
                price: 80,
                health: 344,
                speed: 0,
                scale: 1,
                maxPurchases: 2,
                category: "portal"
            },
            {
                key: "portalA",
                modelType: "portalA",
                label: "Portal A",
                price: 65,
                health: 250,
                speed: 0,
                scale: 1,
                maxPurchases: 2,
                category: "portal"
            },
            {
                key: "eliteDrone",
                modelType: "eliteDrone",
                label: "精英无人机",
                price: 16,
                health: 50,
                speed: 0.08,
                scale: 0.95,
                maxPurchases: 0,
                category: "air"
            },
            {
                key: "finalBossAlpha",
                modelType: "finalBossAlpha",
                label: "Final Boss Alpha",
                price: 160,
                health: 350,
                speed: 0.045,
                scale: 1,
                maxPurchases: 1,
                category: "infantry",
                hpBarY: 4.5
            }
        ],
        cameraExtent: 14,
        camera: {
            portrait: {
                fov: 53,
                minDistance: 39,
                factor: 2.58,
                zRatio: 0.67,
                x: 0.9,
                lookAtX: 0.9,
                lookAtZ: 0.35
            },
            landscape: {
                minDistance: 25,
                factor: 1.36,
                lookAtZ: 0.45
            }
        },
        roadWidth: 3.5,
        points: [
            [-8.04, 4.55],
            [-2.74, -1.88],
            [5.46, 5.99],
            [9.99, 0.92],
            [8.3, -8.57]
        ],
        slots: [],
        enemyTowers: [
            {
                type: 3,
                x: 5.7,
                z: 0.61
            },
            {
                type: 2,
                x: 2.62,
                z: -2.52
            },
            {
                type: 3,
                x: -2.62,
                z: 4.43
            },
            {
                type: 2,
                x: 1.38,
                z: 7.16
            },
            {
                type: 3,
                x: -5.49,
                z: -4.01
            },
            {
                type: 3,
                x: -8.13,
                z: -0.51
            }
        ],
        enemyWaves: [],
        cardRules: {
            enabled: true,
            cards: {
                J: {
                    enabled: true,
                    price: 15,
                    fireRateBonus: 0.25,
                    damageBonus: 0,
                    incomePerSecond: 0
                },
                Q: {
                    enabled: true,
                    price: 25,
                    fireRateBonus: 0.15,
                    damageBonus: 5,
                    incomePerSecond: 0
                },
                K: {
                    enabled: true,
                    price: 35,
                    fireRateBonus: 0.2,
                    damageBonus: 10,
                    incomePerSecond: 5
                }
            }
        }
    }
};

let activeMapRoot = null;
let activeSpawnPortals = [];

function toVector3Path(THREE, points) {
    return points.map(p => new THREE.Vector3(p[0], 0, p[1]));
}

function updateSpawnPortals(timeMs) {
    updateSpawnPointAssets(activeSpawnPortals, timeMs);
}

function buildLevelMap({ THREE, scene, castle, currentLevel, slots }) {
    if (activeMapRoot) {
        scene.remove(activeMapRoot);
        activeMapRoot = null;
    }
    activeSpawnPortals.length = 0;

    const cfg = LEVELS[currentLevel];
    const roadWidth = cfg.roadWidth || MAP_ROAD_WIDTH;
    const pathPoints = toVector3Path(THREE, cfg.points);
    const alternateEnemyPathPoints = cfg.altEnemyPoints ? toVector3Path(THREE, cfg.altEnemyPoints) : [];
    const root = new THREE.Group();
    root.name = `mission-${currentLevel}-map`;
    root.userData.isMapRoot = true;

    root.add(createMapGroundAsset(THREE, MAP_GROUND_SIZE));
    root.add(createRoadPathAsset(THREE, pathPoints, roadWidth, MAP_ROAD_HEIGHT));
    if (cfg.altRoadPoints) {
        root.add(createRoadPathAsset(THREE, toVector3Path(THREE, cfg.altRoadPoints), roadWidth, MAP_ROAD_HEIGHT));
    }
    const spawnAsset = createSpawnPointAsset(THREE, pathPoints[0], pathPoints[1]);
    root.add(spawnAsset.group);
    activeSpawnPortals.push(spawnAsset.portal);

    if (!cfg.attackMode) {
        (cfg.slots || []).forEach(pos => {
            const slotAsset = createTowerSlotAsset(THREE, pos.x, pos.z);
            root.add(slotAsset.group);
            slots.push(slotAsset.slot);
        });
    }

    scene.add(root);
    activeMapRoot = root;

    placeBaseAsset(THREE, castle, pathPoints);

    return { pathPoints, alternateEnemyPathPoints };
}
