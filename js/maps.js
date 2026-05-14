// Mission map layouts and cyber-road rendering.
// Keep paths wide, readable, and compact enough for mobile full-screen play.

const MAP_ROAD_WIDTH = 3.5;
const MAP_ROAD_HEIGHT = 0.16;
const MAP_GROUND_SIZE = 54;

var LEVELS = {
    "1": {
        enemies: 70,
        bossHp: 120,
        title: "Mission 1",
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
        roadWidth: 3.5,
        points: [
            [-5.1, -8.1],
            [-5.1, 6.1],
            [5.1, 6.1],
            [5.1, -3.8],
            [0.9, -3.8]
        ],
        slots: [
            {
                x: -7.8,
                z: -0.7
            },
            {
                x: -0.6,
                z: 3.3
            },
            {
                x: 2.6,
                z: -1.2
            }
        ]
    },
    "2": {
        enemies: 100,
        bossHp: 240,
        title: "Mission 2",
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
        roadWidth: 3.5,
        points: [
            [-9.4, -3.2],
            [0, 4.5],
            [0, -8.9],
            [7.7, -3.2]
        ],
        slots: [
            {
                x: -8.5,
                z: 1.9
            },
            {
                x: -3.9,
                z: 6.1
            },
            {
                x: 3.8,
                z: -1.6
            },
            {
                x: -3.5,
                z: -4.5
            }
        ]
    },
    "3": {
        enemies: 120,
        bossHp: 288,
        title: "Mission 3 - Final Boss",
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
        roadWidth: 3.5,
        points: [
            [-8.4, -8.8],
            [-8.4, 6.2],
            [-2.4, 6.2],
            [-2.4, -1.4],
            [0.9, -1.4],
            [0.9, -5],
            [6.9, -5],
            [6.9, 2.2]
        ],
        altEnemyPoints: [
            [-6.2, -8.8],
            [-6.2, 6.2],
            [-0.9, 6.2],
            [-0.9, 1.4],
            [2.7, 1.4],
            [2.7, -5],
            [5.9, -5],
            [5.9, 4.8]
        ],
        slots: [
            {
                x: -5.2,
                z: -2.2
            },
            {
                x: -5.2,
                z: 2.7
            },
            {
                x: 1.2,
                z: 2.8
            },
            {
                x: 3.7,
                z: -1.4
            }
        ]
    },
    "4": {
        enemies: 0,
        bossHp: 0,
        title: "Mission 4 - Assault",
        attackMode: true,
        startingScore: 360,
        opponentBaseHp: 3,
        timeLimitMs: 60000,
        incomeAmount: 30,
        incomeIntervalMs: 5000,
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
                x: 3.5,
                z: -2.1
            },
            {
                type: 3,
                x: 4.5,
                z: -6.8
            }
        ]
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

    cfg.slots.forEach(pos => {
        const slotAsset = createTowerSlotAsset(THREE, pos.x, pos.z);
        root.add(slotAsset.group);
        slots.push(slotAsset.slot);
    });

    if (currentLevel === 2) {
        const lake = new THREE.Mesh(
            new THREE.CircleGeometry(2.6, 32),
            new THREE.MeshPhongMaterial({ color: 0x0984e3, emissive: 0x024766, emissiveIntensity: 0.35, transparent: true, opacity: 0.42 })
        );
        lake.rotation.x = -Math.PI / 2;
        lake.position.set(0, 0.03, 0);
        root.add(lake);
        root.add(createTechPylonAsset(THREE, -3.4, 0, 0x74b9ff));
        root.add(createTechPylonAsset(THREE, 3.4, 0, 0x74b9ff));
    } else if (currentLevel === 3) {
        root.add(createTechPylonAsset(THREE, -12, 12, 0xff7675));
        root.add(createTechPylonAsset(THREE, 0, 12, 0xffeaa7));
        root.add(createTechPylonAsset(THREE, 12, -12, 0xff7675));
    } else if (currentLevel === 4) {
        root.add(createTechPylonAsset(THREE, -14, -10, 0x29f2ff));
        root.add(createTechPylonAsset(THREE, -8, 10, 0xff4fd8));
        root.add(createTechPylonAsset(THREE, 5, -8, 0xff4fd8));
        root.add(createTechPylonAsset(THREE, 13, 10, 0xff7675));
    } else {
        root.add(createTechPylonAsset(THREE, -7, 12, 0x55efc4));
        root.add(createTechPylonAsset(THREE, 7, 3, 0x55efc4));
    }

    scene.add(root);
    activeMapRoot = root;

    placeBaseAsset(THREE, castle, pathPoints);

    return { pathPoints, alternateEnemyPathPoints };
}
