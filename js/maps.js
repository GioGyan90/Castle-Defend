// Mission map layouts and cyber-road rendering.
// Keep paths wide, readable, and compact enough for mobile full-screen play.

const MAP_ROAD_WIDTH = 4.0;
const MAP_ROAD_HEIGHT = 0.16;
const MAP_GROUND_SIZE = 48;

var LEVELS = {
    1: {
        enemies: 70,
        bossHp: 120,
        title: "Mission 1",
        roadWidth: MAP_ROAD_WIDTH,
        // Broad L-road with long straight sections and a padded corner.
        points: [
            [-10, -7],
            [-10, 5],
            [-2, 5],
            [10, 5]
        ],
        slots: [
            {x:-13, z:-4},
            {x:-7, z:-3},
            {x:-13, z:7},
            {x:-5, z:8},
            {x:3, z:8},
            {x:7, z:2}
        ]
    },
    2: {
        enemies: 100,
        bossHp: 240,
        title: "Mission 2",
        roadWidth: MAP_ROAD_WIDTH,
        // Wide U-road.  The water/tech core stays inside the U, away from the lanes.
        points: [
            [-11, -8],
            [-11, 8],
            [0, 8],
            [11, 8],
            [11, -8]
        ],
        slots: [
            {x:-14, z:-4},
            {x:-8, z:-4},
            {x:-7, z:11},
            {x:0, z:5},
            {x:7, z:11},
            {x:8, z:-4}
        ]
    },
    3: {
        enemies: 120,
        bossHp: 288,
        title: "Mission 3 - Final Boss",
        roadWidth: MAP_ROAD_WIDTH,
        // Final map uses a compact stepped highway instead of tight W-turns so tanks and bosses do not clip corners.
        points: [
            [-12, 6],
            [-12, -6],
            [-5, -6],
            [-5, 6],
            [2, 6],
            [2, -6],
            [12, -6],
            [12, 6]
        ],
        altEnemyChance: 0.25,
        // Alternate route is a complete flank road to the same base, not just a partial merge segment.
        altEnemyPoints: [
            [-2, -12],
            [-2, -6],
            [2, -6],
            [12, -6],
            [12, 6]
        ],
        altRoadPoints: [
            [-2, -12],
            [-2, -6],
            [2, -6],
            [12, -6],
            [12, 6]
        ],
        slots: [
            {x:-15, z:0},
            {x:-9, z:0},
            {x:-7, z:-9},
            {x:-7, z:9},
            {x:0, z:-9},
            {x:4, z:9},
            {x:9, z:-3},
            {x:15, z:0}
        ]
    }
};

let activeMapRoot = null;

function toVector3Path(THREE, points) {
    return points.map(p => new THREE.Vector3(p[0], 0, p[1]));
}

function createMapMaterial(THREE, color, options = {}) {
    return new THREE.MeshPhongMaterial({
        color,
        emissive: options.emissive || 0x000000,
        emissiveIntensity: options.emissiveIntensity || 0,
        transparent: !!options.transparent,
        opacity: options.opacity === undefined ? 1 : options.opacity,
        shininess: options.shininess === undefined ? 45 : options.shininess
    });
}

function addTechPylon(THREE, root, x, z, color = 0x00d2ff) {
    const base = new THREE.Mesh(
        new THREE.CylinderGeometry(0.28, 0.38, 0.8, 6),
        createMapMaterial(THREE, 0x263238, { emissive: 0x061a1d, emissiveIntensity: 0.35 })
    );
    base.position.set(x, 0.35, z);
    const beacon = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.24, 0),
        new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9 })
    );
    beacon.position.set(x, 0.95, z);
    root.add(base, beacon);
}

function addRoadSegment(THREE, root, a, b, roadWidth) {
    const dx = b.x - a.x;
    const dz = b.z - a.z;
    const length = Math.sqrt(dx * dx + dz * dz);
    if (length <= 0.01) return;

    const cx = (a.x + b.x) / 2;
    const cz = (a.z + b.z) / 2;
    const horizontal = Math.abs(dx) >= Math.abs(dz);
    const road = new THREE.Mesh(
        new THREE.BoxGeometry(horizontal ? length : roadWidth, MAP_ROAD_HEIGHT, horizontal ? roadWidth : length),
        createMapMaterial(THREE, 0x66767c, { emissive: 0x17252b, emissiveIntensity: 0.28, shininess: 70 })
    );
    road.position.set(cx, 0.02, cz);
    root.add(road);

    // Subtle darker shoulders make the path read as a proper road and preserve the clear center lane.
    const railThickness = 0.12;
    const offset = roadWidth / 2 - 0.22;
    const railGeometry = horizontal
        ? new THREE.BoxGeometry(length, 0.18, railThickness)
        : new THREE.BoxGeometry(railThickness, 0.18, length);
    const railMaterial = new THREE.MeshBasicMaterial({ color: 0x00d2d3, transparent: true, opacity: 0.72 });
    const railA = new THREE.Mesh(railGeometry, railMaterial);
    const railB = new THREE.Mesh(railGeometry.clone(), railMaterial.clone());
    if (horizontal) {
        railA.position.set(cx, 0.14, cz + offset);
        railB.position.set(cx, 0.14, cz - offset);
    } else {
        railA.position.set(cx + offset, 0.14, cz);
        railB.position.set(cx - offset, 0.14, cz);
    }
    root.add(railA, railB);

    // Broken center markers imply direction without narrowing the usable road width.
    const dashCount = Math.max(3, Math.floor(length / 3));
    for (let i = 0; i < dashCount; i++) {
        const t = (i + 0.5) / dashCount;
        const dash = new THREE.Mesh(
            new THREE.BoxGeometry(horizontal ? 0.72 : 0.14, 0.19, horizontal ? 0.14 : 0.72),
            new THREE.MeshBasicMaterial({ color: 0xf1c40f, transparent: true, opacity: 0.88 })
        );
        dash.position.set(a.x + dx * t, 0.16, a.z + dz * t);
        root.add(dash);
    }
}

function addRoadCornerPads(THREE, root, points, roadWidth) {
    const padMaterial = createMapMaterial(THREE, 0x71858b, { emissive: 0x142d35, emissiveIntensity: 0.32, shininess: 65 });
    const ringMaterial = new THREE.MeshBasicMaterial({ color: 0x29f2ff, transparent: true, opacity: 0.38 });

    points.forEach((pt, index) => {
        if (index === 0 || index === points.length - 1) return;
        const pad = new THREE.Mesh(new THREE.CylinderGeometry(roadWidth * 0.72, roadWidth * 0.72, 0.18, 28), padMaterial);
        pad.position.set(pt.x, 0.08, pt.z);
        root.add(pad);

        const ring = new THREE.Mesh(new THREE.TorusGeometry(roadWidth * 0.52, 0.045, 8, 40), ringMaterial);
        ring.rotation.x = Math.PI / 2;
        ring.position.set(pt.x, 0.22, pt.z);
        root.add(ring);
    });
}

function drawRoadPath(THREE, root, points, roadWidth) {
    for (let i = 0; i < points.length - 1; i++) {
        addRoadSegment(THREE, root, points[i], points[i + 1], roadWidth);
    }
    addRoadCornerPads(THREE, root, points, roadWidth);
}

function buildLevelMap({ THREE, scene, castle, currentLevel, slots }) {
    if (activeMapRoot) {
        scene.remove(activeMapRoot);
        activeMapRoot = null;
    }

    const cfg = LEVELS[currentLevel];
    const roadWidth = cfg.roadWidth || MAP_ROAD_WIDTH;
    const pathPoints = toVector3Path(THREE, cfg.points);
    const alternateEnemyPathPoints = cfg.altEnemyPoints ? toVector3Path(THREE, cfg.altEnemyPoints) : [];
    const root = new THREE.Group();
    root.name = `mission-${currentLevel}-map`;
    root.userData.isMapRoot = true;

    const ground = new THREE.Mesh(
        new THREE.PlaneGeometry(MAP_GROUND_SIZE, MAP_GROUND_SIZE),
        createMapMaterial(THREE, 0x263238, { emissive: 0x070c10, emissiveIntensity: 0.22 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.12;
    root.add(ground);

    // Low-profile grid panels add a sci-fi feel without blocking enemy movement.
    const gridMaterial = new THREE.MeshBasicMaterial({ color: 0x1dd1a1, transparent: true, opacity: 0.14 });
    for (let x = -18; x <= 18; x += 6) {
        const line = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.02, 40), gridMaterial);
        line.position.set(x, -0.03, 0);
        root.add(line);
    }
    for (let z = -18; z <= 18; z += 6) {
        const line = new THREE.Mesh(new THREE.BoxGeometry(40, 0.02, 0.035), gridMaterial.clone());
        line.position.set(0, -0.025, z);
        root.add(line);
    }

    drawRoadPath(THREE, root, pathPoints, roadWidth);
    if (cfg.altRoadPoints) {
        drawRoadPath(THREE, root, toVector3Path(THREE, cfg.altRoadPoints), roadWidth);
    }

    cfg.slots.forEach(pos => {
        const group = new THREE.Group();
        const slot = new THREE.Mesh(
            new THREE.CylinderGeometry(0.6, 0.6, 0.35, 16),
            createMapMaterial(THREE, 0x485e64, { emissive: 0x0b1b20, emissiveIntensity: 0.28 })
        );
        const ring = new THREE.Mesh(
            new THREE.TorusGeometry(0.75, 0.05, 8, 24),
            new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0 })
        );
        ring.rotation.x = Math.PI / 2;
        group.position.set(pos.x, 0.18, pos.z);
        group.add(slot, ring);
        root.add(group);
        slot.userData = { occupied: false, ring: ring, group: group, currentWeapon: null };
        slots.push(slot);
    });

    if (currentLevel === 2) {
        const lake = new THREE.Mesh(
            new THREE.CircleGeometry(2.6, 32),
            new THREE.MeshPhongMaterial({ color: 0x0984e3, emissive: 0x024766, emissiveIntensity: 0.35, transparent: true, opacity: 0.42 })
        );
        lake.rotation.x = -Math.PI / 2;
        lake.position.set(0, 0.03, 0);
        root.add(lake);
        addTechPylon(THREE, root, -3.4, 0, 0x74b9ff);
        addTechPylon(THREE, root, 3.4, 0, 0x74b9ff);
    } else if (currentLevel === 3) {
        addTechPylon(THREE, root, -10, 10, 0xff7675);
        addTechPylon(THREE, root, 0, 10, 0xffeaa7);
        addTechPylon(THREE, root, 10, -10, 0xff7675);
    } else {
        addTechPylon(THREE, root, -7, 12, 0x55efc4);
        addTechPylon(THREE, root, 7, 3, 0x55efc4);
    }

    scene.add(root);
    activeMapRoot = root;

    const castlePos = pathPoints[pathPoints.length - 1].clone();
    const approachPos = pathPoints[pathPoints.length - 2];
    const approachDir = approachPos.clone().sub(castlePos);
    castle.position.copy(castlePos);
    castle.rotation.y = Math.atan2(-approachDir.x, -approachDir.z);

    return { pathPoints, alternateEnemyPathPoints };
}
