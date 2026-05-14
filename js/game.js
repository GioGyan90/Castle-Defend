/**
 * 游戏主逻辑文件
 * Emoji Castle Defense - Compact Mobile
 */

// ==================== 音频系统 ====================
// Audio helpers live in js/game_audio.js.

// ==================== 游戏配置 ====================
// Game configuration lives in js/config.js.

let currentLevel = 1;
let score, lives, spawnedCount, gameOver, gameStarted = false, bossSpawned = false, firstBossSpawned = false;
let selectedWeaponType = null, isSellMode = false;
let selectedTacticalType = null;
let isDebugMode = false;
let isPaused = false;
let levelPortalSpawnCount = 0;
const enemies = [], bullets = [], weapons = [], particles = [], damageTexts = [], slots = [];
const airstrikeBombs = [], airstrikeMarkers = [];
let pathPoints = [];
let alternateEnemyPathPoints = [];
const weaponDamageStats = [];
let weaponSerial = 0;
let airstrikeSerial = 0;
let airstrikeCooldownUntil = 0;
let lastAttackIncomeTime = 0;
let lastCardIncomeTime = 0;
let attackTimeRemainingMs = 0;
let attackUnitsDeployed = 0;
let attackGoldSpent = 0;
let attackBossPurchased = {};
let attackBaseHpGroup = null;
let attackBaseHpPips = [];
const ATTACK_BASE_HP_BAR_ASSETS = {
    savedFivePipHp: 5,
    canvasWidth: 360,
    canvasHeight: 76
};
let levelStartTime = 0; // 关卡开始时间用于计算通关时间

const WEAPON_DISPLAY_NAMES = {
    1: getWeaponConfig(1).name,
    2: getWeaponConfig(2).name,
    3: getWeaponConfig(3).name,
    4: getWeaponConfig(4).name
};

const LEVEL_PORTAL_EVENTS = {
    2: [
        { modelType: 'portalA', threshold: 0.38, path: 'main' }
    ],
    3: [
        { modelType: 'portalA', threshold: 0.30, path: 'main' },
        { modelType: 'portalA', threshold: 0.55, path: 'alternate' },
        { modelType: 'portalB', threshold: 0.72, path: 'main' }
    ]
};

const ATTACK_MODE_LEVEL = 4;
const ATTACK_UNIT_CONFIGS = {
    heavyRobot: {
        label: 'Heavy Robot',
        price: 10,
        spawn: {
            modelType: 'heavyRobot',
            health: 28,
            speedMin: 0.018,
            speedMax: 0.026,
            scale: 1.22,
            isDrone: false,
            category: 'infantry'
        }
    },
    chopper: {
        label: 'Chopper',
        price: 40,
        limitOnce: true,
        spawn: {
            modelType: 'chopper',
            health: 160,
            speed: 0.022,
            scale: 0.9,
            isDrone: true,
            isBoss: true,
            isFlyingBoss: true,
            flightBaseY: 2.5,
            category: 'boss',
            hpBarY: 4.4
        }
    },
    finalBossAlpha: {
        label: 'Final Boss Alpha',
        price: 160,
        limitOnce: true,
        spawn: {
            modelType: 'finalBossAlpha',
            health: 320,
            speed: 0.016,
            scale: 1,
            isDrone: false,
            isBoss: true,
            category: 'boss',
            hpBarY: 4.5
        }
    },
    portalB: {
        label: 'Portal B',
        price: 80,
        maxPurchases: 2,
        spawn: {
            modelType: 'portalB',
            health: 144,
            speed: 0,
            scale: 1,
            isDrone: false,
            category: 'portal',
            hpBarY: 2.4,
            portalDurationMs: 15000,
            portalMaxSpawns: 20,
            portalSpawnGroup: 'air',
            portalSpawnIntervalMs: 740
        }
    }
};

// ==================== Three.js 场景设置 ====================
const scene = new THREE.Scene(); 
scene.background = new THREE.Color(0x130f40);

function getViewportSize() {
    const viewport = window.visualViewport;
    return {
        width: Math.round(viewport ? viewport.width : window.innerWidth),
        height: Math.round(viewport ? viewport.height : window.innerHeight)
    };
}

const initialViewport = getViewportSize();
const camera = new THREE.PerspectiveCamera(50, initialViewport.width / initialViewport.height, 0.1, 2000);

// 存储摄像机基础位置用于震动效果
let baseCameraY = 24;
let baseCameraZ = 18;
let baseCameraX = 0;
let baseCameraLookAtX = 0;
let baseCameraLookAtZ = 0;

function getCurrentMapExtent() {
    const cfg = typeof LEVELS !== 'undefined' ? LEVELS[currentLevel] : null;
    if (!cfg) return 18;

    const allPoints = [
        ...(cfg.points || []),
        ...(cfg.altEnemyPoints || []),
        ...(cfg.slots || []).map(slot => [slot.x, slot.z])
    ];

    return allPoints.reduce((extent, point) => {
        return Math.max(extent, Math.abs(point[0]), Math.abs(point[1]));
    }, cfg.cameraExtent || 18);
}

function adjustCamera() {
    const viewport = getViewportSize();
    const aspect = viewport.width / viewport.height;
    const cfg = typeof LEVELS !== 'undefined' ? LEVELS[currentLevel] : null;
    const cameraTuning = cfg && cfg.camera ? cfg.camera : {};
    const mapExtent = getCurrentMapExtent();
    const isPortrait = aspect < 1;
    const orientationTuning = isPortrait ? (cameraTuning.portrait || {}) : (cameraTuning.landscape || {});
    const targetFov = orientationTuning.fov || (isPortrait ? 54 : 50);
    if (camera.fov !== targetFov) {
        camera.fov = targetFov;
        camera.updateProjectionMatrix();
    }
    const minDistance = orientationTuning.minDistance || (isPortrait ? 48 : 28);
    const distanceFactor = orientationTuning.factor || (isPortrait ? 2.78 : 1.45);
    const camDist = Math.max(minDistance, mapExtent * distanceFactor);
    baseCameraX = orientationTuning.x !== undefined ? orientationTuning.x : (isPortrait ? 1.25 : 0);
    baseCameraLookAtX = orientationTuning.lookAtX !== undefined ? orientationTuning.lookAtX : baseCameraX;
    baseCameraY = camDist;
    baseCameraZ = camDist * (orientationTuning.zRatio || (isPortrait ? 0.78 : 0.75));
    baseCameraLookAtZ = orientationTuning.lookAtZ !== undefined ? orientationTuning.lookAtZ : (isPortrait ? 12.7 : 4.4);
    camera.position.set(baseCameraX, baseCameraY, baseCameraZ);
    camera.lookAt(baseCameraLookAtX, 0, baseCameraLookAtZ);
}
adjustCamera();

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(initialViewport.width, initialViewport.height, false);
document.body.appendChild(renderer.domElement);
renderer.domElement.id = 'gameCanvas';

// 灯光
const light = new THREE.DirectionalLight(0xffffff, 1.2);
light.position.set(10, 30, 10);
scene.add(light);
scene.add(new THREE.AmbientLight(0xffffff, 0.7));

// Base model is defined separately; the map only controls endpoint placement.
const castle = createSpaceBaseModel(THREE);
let castleShakeTime = 0; // 城堡震动计时器

function shakeCastle(duration) {
    castleShakeTime = duration;
}

function flashBaseAlert(duration = 420) {
    if (!castle.userData || !castle.userData.hitAlertMaterial) return;
    castle.userData.hitAlertDuration = duration;
    castle.userData.hitAlertTime = duration;
}

function updateBaseAlert(deltaMs) {
    if (!castle.userData || !castle.userData.hitAlertMaterial) return;
    const duration = castle.userData.hitAlertDuration || 420;
    castle.userData.hitAlertTime = Math.max(0, (castle.userData.hitAlertTime || 0) - deltaMs);

    if (castle.userData.hitAlertTime <= 0) {
        castle.userData.hitAlertMaterial.opacity = 0;
        return;
    }

    const progress = 1 - castle.userData.hitAlertTime / duration;
    castle.userData.hitAlertMaterial.opacity = Math.sin(progress * Math.PI) * 0.95;
}

function setGameDimmed(isDimmed) {
    document.body.classList.toggle('game-dimmed', isDimmed);
}

scene.add(castle);

// ==================== 地图构建 ====================
function buildMap() {
    slots.length = 0;
    const mapState = buildLevelMap({
        THREE,
        scene,
        castle,
        currentLevel,
        slots
    });
    pathPoints = mapState.pathPoints;
    alternateEnemyPathPoints = mapState.alternateEnemyPathPoints;
    castleShakeTime = 0; // 重置震动状态
}

function isAttackMode() {
    return currentLevel === ATTACK_MODE_LEVEL;
}

// ==================== 游戏流程控制 ====================
function startGame(debug = false) {
    ensureAudioReady();
    resetEnemyMovementSounds();
    cancelBossIncomingBanner();
    setGameDimmed(false);
    isDebugMode = debug;
    isPaused = false;
    document.getElementById('overlay').style.display = 'none';
    document.getElementById('pauseOverlay').style.display = 'none';
    document.getElementById('status-bar').style.display = 'flex';
    document.getElementById('bottom-nav').style.display = 'flex';
    buildMap();
    adjustCamera();
    const levelConfig = LEVELS[currentLevel] || LEVELS[1];
    score = levelConfig.startingScore !== undefined ? levelConfig.startingScore : (isDebugMode ? 1000 : (currentLevel === 1 ? 3 : (currentLevel === 2 ? 15 : 30)));
    lives = levelConfig.opponentBaseHp || 5;
    spawnedCount = 0;
    gameOver = false;
    bossSpawned = false;
    firstBossSpawned = false;
    levelPortalSpawnCount = 0;
    selectedTacticalType = null;
    airstrikeCooldownUntil = 0;
    lastAttackIncomeTime = 0;
    attackTimeRemainingMs = levelConfig.timeLimitMs || 0;
    attackUnitsDeployed = 0;
    attackGoldSpent = 0;
    attackBossPurchased = {};
    lastCardIncomeTime = 0;
    if (typeof resetCardSystem === 'function') resetCardSystem();
    if (isAttackMode()) {
        setupAttackModeLevel();
    }
    levelStartTime = Date.now(); // 记录关卡开始时间
    updateUI();
    gameStarted = true;
    updateUI();
    if (typeof announceLevelStart === 'function') {
        window.setTimeout(function() {
            if (gameStarted && !gameOver && !isPaused) announceLevelStart(currentLevel);
        }, 260);
    }
    lastTime = 0;
    spawnTimer = 0;
}

function clearRunObjects() {
    setGameDimmed(false);
    resetEnemyMovementSounds();
    cancelBossIncomingBanner();
    enemies.forEach(e => scene.remove(e.mesh));
    enemies.length = 0;
    bullets.forEach(b => {
        scene.remove(b.mesh);
        if (b.glowMesh) scene.remove(b.glowMesh);
    });
    bullets.length = 0;
    weapons.forEach(w => {
        scene.remove(w.mesh);
        if (w.padMesh) {
            if (w.padMesh.parent) w.padMesh.parent.remove(w.padMesh);
            else scene.remove(w.padMesh);
        }
    });
    weapons.length = 0;
    particles.forEach(p => scene.remove(p.mesh || p));
    particles.length = 0;
    damageTexts.forEach(d => scene.remove(d.sprite));
    damageTexts.length = 0;
    airstrikeBombs.forEach(b => scene.remove(b.mesh));
    airstrikeBombs.length = 0;
    airstrikeMarkers.forEach(m => scene.remove(m.mesh));
    airstrikeMarkers.length = 0;
    if (attackBaseHpGroup) {
        scene.remove(attackBaseHpGroup);
        attackBaseHpGroup = null;
    }
    attackBaseHpPips = [];
    document.querySelectorAll('.attack-income-pop').forEach(el => el.remove());
    slots.length = 0;
    weaponDamageStats.length = 0;
    weaponSerial = 0;
    airstrikeSerial = 0;
    airstrikeCooldownUntil = 0;
    lastAttackIncomeTime = 0;
    lastCardIncomeTime = 0;
    attackTimeRemainingMs = 0;
    attackUnitsDeployed = 0;
    attackGoldSpent = 0;
    attackBossPurchased = {};
    levelPortalSpawnCount = 0;
    selectedWeaponType = null;
    selectedTacticalType = null;
    if (typeof resetCardSystem === 'function') resetCardSystem();
    updateTacticalCursor();
    isSellMode = false;
    clearWeaponSelectionUi();
    document.getElementById('btnSell').classList.remove('active');
}

function showPauseMenu() {
    if (!gameStarted || gameOver) return;
    isPaused = true;
    document.getElementById('pauseOverlay').style.display = 'flex';
    updateSoundButton();
}

function resumeGame() {
    isPaused = false;
    lastTime = 0;
    document.getElementById('pauseOverlay').style.display = 'none';
}

function updateSoundButton() {
    const btn = document.getElementById('soundToggleBtn');
    if (btn) {
        btn.innerText = isMuted ? t('soundOn') : t('soundOff');
        return;
    }
    if (btn) btn.innerText = isMuted ? '开启声音' : '关闭声音';
}

function toggleSound() {
    isMuted = !isMuted;
    if (isMuted && audioCtx.state === 'running') {
        audioCtx.suspend();
    } else if (!isMuted) {
        ensureAudioReady();
        playTone(520, 'sine', 0.12, 0.04);
    }
    updateSoundButton();
}

// 显示关卡选择下拉列表
// 隐藏关卡选择下拉列表
// 根据选择的关卡开始 Debug 模式
// ==================== 武器系统 ====================
function clearWeaponSelectionUi() {
    document.querySelectorAll('#bottom-nav .weapon-btn').forEach(b => b.classList.remove('selected'));
}

function updateTacticalCursor() {
    document.body.classList.toggle(
        'airstrike-aiming',
        selectedTacticalType === 'airstrike' && gameStarted && !gameOver && !isPaused
    );
}

function getAttackUnitIdSuffix(unitKey) {
    if (unitKey === 'heavyRobot') return 'Heavy';
    if (unitKey === 'chopper') return 'Chopper';
    if (unitKey === 'finalBossAlpha') return 'FinalBossAlpha';
    if (unitKey === 'portalB') return 'PortalB';
    return unitKey;
}

function createAttackUnitModel(unitKey) {
    if (unitKey === 'heavyRobot') return createHeavyRobotEnemy();
    if (unitKey === 'finalBossAlpha') {
        const model = new THREE.Group();
        createSteelGorillaBoss(model);
        return model;
    }
    if (unitKey === 'chopper') {
        const model = createImportedChopperModel(THREE);
        const rotorRefs = { mainRotor: null, tailRotor: null };
        model.traverse(obj => {
            if (!obj.userData) return;
            if (obj.userData.mainRotor && !rotorRefs.mainRotor) rotorRefs.mainRotor = obj.userData.mainRotor;
            if (obj.userData.tailRotor && !rotorRefs.tailRotor) rotorRefs.tailRotor = obj.userData.tailRotor;
        });
        model.userData.mainRotor = rotorRefs.mainRotor;
        model.userData.tailRotor = rotorRefs.tailRotor;
        return model;
    }
    if (unitKey === 'portalB') return createPortalBEnemy();
    return createHeavyRobotEnemy();
}

function renderButtonPreview(holderId, model, previewScale = 2.1, yOffset = 0.42) {
    const holder = document.getElementById(holderId);
    if (!holder || holder.querySelector('canvas')) return;

    const previewScene = new THREE.Scene();
    const previewCamera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
    previewCamera.position.set(2.0, 1.85, 2.85);
    previewCamera.lookAt(0, 0.45, 0);
    previewScene.add(new THREE.AmbientLight(0xffffff, 0.88));

    const previewLight = new THREE.DirectionalLight(0xffffff, 1.35);
    previewLight.position.set(2, 4, 3);
    previewScene.add(previewLight);

    const box = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    model.position.sub(center);
    model.scale.multiplyScalar(previewScale / maxDim);
    model.position.y += yOffset;
    model.rotation.y = -0.45;
    model.rotation.x = -0.08;
    previewScene.add(model);

    const previewRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    previewRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    previewRenderer.setSize(56, 56, false);
    holder.appendChild(previewRenderer.domElement);
    previewRenderer.render(previewScene, previewCamera);
}

function initWeaponButtonPreviews() {
    [1, 2, 3, 4].forEach(type => {
        const model = createWeaponModel(type);
        const previewScale = type === 3 ? 2.35 : (type === 4 ? 2.45 : 2.12);
        renderButtonPreview('preview' + type, model, previewScale, type === 3 ? 0.55 : (type === 4 ? 0.48 : 0.42));
    });
    renderButtonPreview('previewAttackHeavy', createAttackUnitModel('heavyRobot'), 2.2, 0.5);
    renderButtonPreview('previewAttackChopper', createAttackUnitModel('chopper'), 2.55, 0.3);
    renderButtonPreview('previewAttackFinalBossAlpha', createAttackUnitModel('finalBossAlpha'), 2.25, 0.45);
    renderButtonPreview('previewAttackPortalB', createAttackUnitModel('portalB'), 2.35, 0.46);
}

function buyWeapon(type) {
    if (type === 4) {
        buyAirstrike();
        return;
    }
    if (currentLevel === 1 && type === 3) return;
    if (gameOver || isPaused || score < PRICES[type]) return;
    isSellMode = false;
    selectedTacticalType = null;
    updateTacticalCursor();
    document.getElementById('btnSell').classList.remove('active');
    selectedWeaponType = type;
    clearWeaponSelectionUi();
    document.getElementById('btn' + type).classList.add('selected');
    slots.forEach(s => {
        if (!s.userData.occupied) {
            s.userData.ring.material.color.set(0xffffff);
            s.userData.ring.material.opacity = 0.8;
        }
    });
}

function getAirstrikeCooldownRemaining(time = performance.now()) {
    return Math.max(0, airstrikeCooldownUntil - time);
}

function buyAirstrike() {
    const config = getWeaponConfig(4);
    if (currentLevel < 3 || gameOver || isPaused || score < config.price || getAirstrikeCooldownRemaining() > 0) return;

    isSellMode = false;
    selectedWeaponType = null;
    selectedTacticalType = 'airstrike';
    updateTacticalCursor();
    document.getElementById('btnSell').classList.remove('active');
    clearWeaponSelectionUi();
    const btn = document.getElementById('btn4');
    if (btn) btn.classList.add('selected');
    slots.forEach(s => s.userData.ring.material.opacity = 0);
}

function buyAttackUnit(unitKey) {
    if (!isAttackMode() || gameOver || isPaused) return;
    const unit = ATTACK_UNIT_CONFIGS[unitKey];
    if (!unit || score < unit.price || !pathPoints.length) return;
    if (unit.limitOnce && attackBossPurchased[unitKey]) return;
    if (unit.maxPurchases && (attackBossPurchased[unitKey] || 0) >= unit.maxPurchases) return;

    score -= unit.price;
    attackUnitsDeployed++;
    attackGoldSpent += unit.price;
    if (unit.limitOnce) {
        attackBossPurchased[unitKey] = true;
    } else if (unit.maxPurchases) {
        attackBossPurchased[unitKey] = (attackBossPurchased[unitKey] || 0) + 1;
    }
    const spawnConfig = Object.assign({}, unit.spawn);
    let spawnPosition;
    let pathIdx = 0;
    if (unitKey === 'portalB') {
        const portalLocation = getRandomPointOnEnemyPath(pathPoints);
        spawnPosition = portalLocation.position;
        pathIdx = portalLocation.pathIdx;
    } else {
        const start = pathPoints[0].clone();
        const next = pathPoints[1] || start;
        const forward = new THREE.Vector3().subVectors(next, start).normalize();
        const lateral = new THREE.Vector3(-forward.z, 0, forward.x);
        spawnPosition = start
            .add(forward.multiplyScalar(0.5))
            .add(lateral.multiplyScalar((Math.random() - 0.5) * 1.25));
        spawnPosition.y = 0.1;
    }
    createEnemyEntityFromConfig(spawnConfig, pathPoints, spawnPosition, pathIdx, { currentTime: performance.now(), attackUnit: true });
    if (typeof announceBattleEvent === 'function') {
        announceBattleEvent('attack-unit-' + unitKey, t('attackUnitDeployed', { name: unit.label }), spawnPosition, 900);
    }
    playTone(unitKey === 'portalB' ? 520 : 420, 'triangle', 0.16, 0.045);
    updateUI();
}

function toggleSellMode() {
    if (gameOver || isPaused) return;
    isSellMode = !isSellMode;
    selectedWeaponType = null;
    selectedTacticalType = null;
    updateTacticalCursor();
    clearWeaponSelectionUi();
    document.getElementById('btnSell').classList.toggle('active', isSellMode);
    slots.forEach(s => {
        if (isSellMode && s.userData.occupied) {
            s.userData.ring.material.color.set(0xff0000);
            s.userData.ring.material.opacity = 0.8;
        } else {
            s.userData.ring.material.opacity = 0;
        }
    });
}

function getRoadWidth() {
    const cfg = typeof LEVELS !== 'undefined' ? LEVELS[currentLevel] : null;
    return (cfg && cfg.roadWidth) || (typeof MAP_ROAD_WIDTH !== 'undefined' ? MAP_ROAD_WIDTH : 3.5);
}

function getPlayableRoadPaths() {
    const paths = [];
    if (pathPoints && pathPoints.length > 1) paths.push(pathPoints);
    if (alternateEnemyPathPoints && alternateEnemyPathPoints.length > 1) paths.push(alternateEnemyPathPoints);
    return paths;
}

function getClosestPointOnRoad(point) {
    let best = null;
    getPlayableRoadPaths().forEach(points => {
        for (let i = 0; i < points.length - 1; i++) {
            const a = points[i];
            const b = points[i + 1];
            const segment = new THREE.Vector3().subVectors(b, a);
            const segmentLengthSq = segment.lengthSq();
            if (segmentLengthSq <= 0.0001) continue;
            const t = THREE.MathUtils.clamp(new THREE.Vector3().subVectors(point, a).dot(segment) / segmentLengthSq, 0, 1);
            const closest = a.clone().add(segment.multiplyScalar(t));
            closest.y = 0.08;
            const distance = closest.distanceTo(point);
            if (!best || distance < best.distance) {
                best = {
                    position: closest,
                    direction: new THREE.Vector3().subVectors(b, a).normalize(),
                    distance
                };
            }
        }
    });
    return best;
}

function getAirstrikeTargetFromScreen(clientX, clientY) {
    const rect = renderer.domElement.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((clientY - rect.top) / rect.height) * 2 + 1;
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(x, y), camera);
    const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const point = new THREE.Vector3();
    if (!raycaster.ray.intersectPlane(groundPlane, point)) return null;
    const target = getClosestPointOnRoad(point);
    if (!target || target.distance > getRoadWidth() * 0.68) return null;
    return target;
}

function createAirstrikeMarker(center, direction, config, startTime) {
    const marker = new THREE.Mesh(
        new THREE.BoxGeometry(config.width, 0.035, config.length),
        new THREE.MeshBasicMaterial({
            color: 0xffef7a,
            transparent: true,
            opacity: 0.34,
            depthWrite: false
        })
    );
    marker.position.copy(center);
    marker.position.y = 0.07;
    marker.rotation.y = Math.atan2(direction.x, direction.z);
    scene.add(marker);
    airstrikeMarkers.push({
        mesh: marker,
        startTime,
        endTime: startTime + config.rows * 135 + 1100
    });
}

function createAirstrikeBombMesh() {
    const group = new THREE.Group();
    const bodyMat = new THREE.MeshPhongMaterial({
        color: 0x1f2d3a,
        emissive: 0x07111a,
        emissiveIntensity: 0.18,
        flatShading: true
    });
    const tipMat = new THREE.MeshPhongMaterial({
        color: 0xff5e57,
        emissive: 0x5a0b08,
        emissiveIntensity: 0.25,
        flatShading: true
    });
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, 0.82, 12), bodyMat);
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.17, 0.3, 12), tipMat);
    const tail = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.24, 12), tipMat);
    body.position.y = 0.45;
    tip.position.y = 1.0;
    tail.rotation.x = Math.PI;
    tail.position.y = -0.06;
    group.add(body, tip, tail);
    return group;
}

function deployAirstrike(target) {
    const config = getWeaponConfig(4);
    const now = performance.now();
    if (currentLevel < 3 || score < config.price || getAirstrikeCooldownRemaining(now) > 0) return;
    if (typeof announceBattleEvent === 'function') {
        announceBattleEvent('airstrike-deploy', t('airstrike'), target.position, 1300);
    }

    score -= config.price;
    airstrikeCooldownUntil = now + config.cooldownMs;
    selectedTacticalType = null;
    updateTacticalCursor();
    clearWeaponSelectionUi();

    const attackId = ++airstrikeSerial;
    const damageStat = {
        id: `air-${attackId}`,
        type: 4,
        label: `${WEAPON_DISPLAY_NAMES[4]} #${attackId}`,
        totalDamage: 0
    };
    weaponDamageStats.push(damageStat);

    const direction = target.direction.clone().normalize();
    const lateral = new THREE.Vector3(-direction.z, 0, direction.x).normalize();
    const airstrike = {
        id: attackId,
        center: target.position.clone(),
        direction,
        lateral,
        length: config.length,
        width: config.width,
        damage: getAdjustedAirstrikeDamage(config.damage),
        rows: config.rows,
        damagedEnemies: new Set(),
        damageStat
    };

    createAirstrikeMarker(airstrike.center, direction, config, now);
    for (let row = 0; row < config.rows; row++) {
        const rowRatio = config.rows <= 1 ? 0.5 : row / (config.rows - 1);
        const along = -config.length / 2 + rowRatio * config.length;
        [-0.34, 0.34].forEach((lane, laneIndex) => {
            const targetPos = airstrike.center.clone()
                .add(direction.clone().multiplyScalar(along))
                .add(lateral.clone().multiplyScalar(lane * config.width));
            targetPos.y = 0.1;
            const mesh = createAirstrikeBombMesh();
            mesh.position.copy(targetPos).add(new THREE.Vector3(0, 7.5, 0)).add(direction.clone().multiplyScalar(1.8));
            airstrikeBombs.push({
                mesh,
                airstrike,
                targetPosition: targetPos,
                rowAlong: along,
                startPosition: mesh.position.clone(),
                launchTime: now + row * 135 + laneIndex * 46,
                impactTime: now + row * 135 + laneIndex * 46 + 620,
                added: false,
                soundPlayed: false
            });
        });
    }

    if (typeof playAirstrikeDropSound === 'function') playAirstrikeDropSound();
    updateUI();
}

function applyAirstrikeDamage(bomb) {
    const airstrike = bomb.airstrike;
    const sliceHalfLength = Math.max(0.7, airstrike.length / airstrike.rows * 0.62);
    enemies.slice().forEach(enemy => {
        if (!enemy || enemy.isDead || airstrike.damagedEnemies.has(enemy)) return;
        const relative = enemy.mesh.position.clone().sub(airstrike.center);
        const along = relative.dot(airstrike.direction);
        const side = relative.dot(airstrike.lateral);
        if (Math.abs(side) <= airstrike.width / 2 && Math.abs(along - bomb.rowAlong) <= sliceHalfLength) {
            airstrike.damagedEnemies.add(enemy);
            damageEnemy(enemy, airstrike.damage, {
                ownerWeapon: { type: 4, damageStat: airstrike.damageStat },
                isCrit: false
            }, true);
        }
    });
}

function updateAirstrikeBombs(time) {
    for (let i = airstrikeMarkers.length - 1; i >= 0; i--) {
        const marker = airstrikeMarkers[i];
        const life = Math.max(0, marker.endTime - time);
        const total = Math.max(1, marker.endTime - marker.startTime);
        marker.mesh.material.opacity = 0.34 * THREE.MathUtils.clamp(life / total, 0, 1);
        if (time >= marker.endTime) {
            scene.remove(marker.mesh);
            airstrikeMarkers.splice(i, 1);
        }
    }

    for (let i = airstrikeBombs.length - 1; i >= 0; i--) {
        const bomb = airstrikeBombs[i];
        if (time < bomb.launchTime) continue;
        if (!bomb.added) {
            scene.add(bomb.mesh);
            bomb.added = true;
        }
        const progress = THREE.MathUtils.clamp((time - bomb.launchTime) / (bomb.impactTime - bomb.launchTime), 0, 1);
        const eased = 1 - Math.pow(1 - progress, 2.4);
        bomb.mesh.position.lerpVectors(bomb.startPosition, bomb.targetPosition, eased);
        bomb.mesh.rotation.x += 0.22;
        bomb.mesh.rotation.z += 0.08;
        if (progress >= 1) {
            scene.remove(bomb.mesh);
            createExplosionEffect(bomb.targetPosition, 1.05);
            if (!bomb.soundPlayed && typeof playAirstrikeImpactSound === 'function') {
                playAirstrikeImpactSound();
                bomb.soundPlayed = true;
            }
            applyAirstrikeDamage(bomb);
            airstrikeBombs.splice(i, 1);
        }
    }
}

function handleInput(clientX, clientY) {
    if (gameOver || isPaused || !gameStarted) return;
    if (selectedTacticalType === 'airstrike') {
        const target = getAirstrikeTargetFromScreen(clientX, clientY);
        if (target) {
            deployAirstrike(target);
        } else {
            playTone(160, 'sawtooth', 0.08, 0.035);
        }
        return;
    }
    const rect = renderer.domElement.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((clientY - rect.top) / rect.height) * 2 + 1;
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(x, y), camera);
    const intersects = raycaster.intersectObjects(slots);
    
    if (intersects.length > 0) {
        const slot = intersects[0].object;
        if (selectedWeaponType && !slot.userData.occupied) {
            score -= PRICES[selectedWeaponType];
            const model = createWeaponModel(selectedWeaponType);
            model.position.copy(slot.userData.group.position);
            scene.add(model);
            const weaponId = ++weaponSerial;
            const weaponConfig = getWeaponConfig(selectedWeaponType);
            const damageStat = {
                id: weaponId,
                type: selectedWeaponType,
                label: `${WEAPON_DISPLAY_NAMES[selectedWeaponType]} #${weaponId}`,
                totalDamage: 0
            };
            weaponDamageStats.push(damageStat);
            const wObj = {
                mesh: model,
                type: selectedWeaponType,
                damageStat: damageStat,
                basePosition: model.position.clone(),
                lastFire: 0,
                fireInterval: weaponConfig.fireIntervalMs,
                burstCount: 0,
                burstTotal: weaponConfig.burstTotal || 1
            };
            weapons.push(wObj);
            slot.userData.occupied = true;
            slot.userData.currentWeapon = wObj;
            if (typeof announceBattleEvent === 'function') {
                announceBattleEvent('weapon-deploy-' + weaponId, t('weaponDeployed', { name: WEAPON_DISPLAY_NAMES[wObj.type] }), model.position, 0);
            }
            selectedWeaponType = null;
            updateUI();
            slots.forEach(s => s.userData.ring.material.opacity = 0);
            clearWeaponSelectionUi();
        } else if (isSellMode && slot.userData.occupied) {
            const wObj = slot.userData.currentWeapon;
            score += Math.floor(PRICES[wObj.type] / 2);
            scene.remove(wObj.mesh);
            weapons.splice(weapons.indexOf(wObj), 1);
            slot.userData.occupied = false;
            slot.userData.currentWeapon = null;
            playTone(300, 'sine', 0.2, 0.1);
            updateUI();
            toggleSellMode();
        }
    }
}

// 事件监听
window.addEventListener('mousedown', (e) => {
    if (e.target.closest('#bottom-nav') || e.target.closest('#cardPanel') || e.target.closest('#status-bar') || e.target.closest('#endScreen') || e.target.closest('#overlay') || e.target.closest('#modelGallery')) return;
    handleInput(e.clientX, e.clientY);
});

window.addEventListener('touchstart', (e) => {
    if (e.target.closest('#bottom-nav') || e.target.closest('#cardPanel') || e.target.closest('#status-bar') || e.target.closest('#endScreen') || e.target.closest('#overlay') || e.target.closest('#modelGallery')) return;
    handleInput(e.touches[0].clientX, e.touches[0].clientY);
}, { passive: false });

// ==================== 武器模型创建 ====================
// Player weapon models and projectile logic live in js/weapons.js.

// Enemy and Boss models live in js/enemies.js.

// Model gallery UI lives in js/gallery.js.

function updateUI() {
    document.getElementById('scoreVal').innerText = score;
    document.getElementById('livesVal').innerText = lives;
    document.getElementById('levelVal').innerText = currentLevel;
    if (typeof updateCardPanelUI === 'function') updateCardPanelUI();
    const hpItem = document.getElementById('hpItem');
    if (hpItem) hpItem.style.display = isAttackMode() ? 'none' : '';
    [1, 2, 3, 4].forEach(i => {
        const priceEl = document.getElementById('price' + i);
        if (priceEl) {
            priceEl.innerText = `${PRICES[i]}`;
        }
    });
    Object.keys(ATTACK_UNIT_CONFIGS).forEach(unitKey => {
        const cfg = ATTACK_UNIT_CONFIGS[unitKey];
        const idSuffix = getAttackUnitIdSuffix(unitKey);
        const priceEl = document.getElementById('priceAttack' + idSuffix);
        const btn = document.getElementById('btnAttack' + idSuffix);
        if (priceEl) priceEl.innerText = `${cfg.price}`;
        if (btn) {
            btn.style.display = isAttackMode() ? '' : 'none';
            const reachedMax = cfg.limitOnce
                ? !!attackBossPurchased[unitKey]
                : (cfg.maxPurchases ? (attackBossPurchased[unitKey] || 0) >= cfg.maxPurchases : false);
            btn.disabled = !isAttackMode() || gameOver || isPaused || score < cfg.price || reachedMax;
        }
    });
    [1, 2, 3, 4].forEach(i => {
        const btn = document.getElementById('btn' + i);
        if (btn) btn.style.display = isAttackMode() ? 'none' : '';
    });
    const sellBtn = document.getElementById('btnSell');
    if (sellBtn) sellBtn.style.display = isAttackMode() ? 'none' : '';
    updateAttackCountdownUI();
    if (isAttackMode()) {
        selectedWeaponType = null;
        selectedTacticalType = null;
        isSellMode = false;
        updateTacticalCursor();
        clearWeaponSelectionUi();
        if (sellBtn) sellBtn.classList.remove('active');
        updateAttackBaseHpDisplay();
        return;
    }
    const timerItem = document.getElementById('timerItem');
    if (timerItem) timerItem.style.display = 'none';
    const teslaBtn = document.getElementById('btn3');
    teslaBtn.style.display = currentLevel === 1 ? 'none' : '';
    if (currentLevel === 1 && selectedWeaponType === 3) {
        selectedWeaponType = null;
        clearWeaponSelectionUi();
    }
    [1, 2, 3].forEach(i => {
        document.getElementById('btn' + i).disabled = score < PRICES[i];
    });
    updateAirstrikeButton();
}

function updateAirstrikeButton(time = performance.now()) {
    const btn = document.getElementById('btn4');
    if (!btn) return;
    const config = getWeaponConfig(4);
    const remaining = getAirstrikeCooldownRemaining(time);
    const cooldownEl = document.getElementById('cooldown4');
    btn.style.display = currentLevel >= 3 && !isAttackMode() ? '' : 'none';
    if ((currentLevel < 3 || isAttackMode()) && selectedTacticalType === 'airstrike') {
        selectedTacticalType = null;
        clearWeaponSelectionUi();
    }
    updateTacticalCursor();
    btn.disabled = currentLevel < 3 || isAttackMode() || gameOver || isPaused || score < config.price || remaining > 0;
    btn.classList.toggle('cooling', remaining > 0);
    if (cooldownEl) {
        cooldownEl.textContent = remaining > 0 ? Math.ceil(remaining / 1000) : '';
    }
}

initWeaponButtonPreviews();

function updateBossHP(enemy) {
    if (!enemy.hpBar || !enemy.hpBar.userData.ctx) return;
    const pct = Math.max(0, enemy.health / enemy.maxHealth);
    
    // 更新血条宽度（通过重新绘制 canvas）
    const bar = enemy.hpBar;
    const ctx = bar.userData.ctx;
    const canvas = bar.userData.canvas;
    const maxHp = bar.userData.maxHp;
    
    // 清空并重新绘制血条
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 根据血量设置颜色
    let color = '#00ff00'; // 绿色
    if (pct <= 0.6 && pct > 0.3) {
        color = '#ffff00'; // 黄色
    } else if (pct <= 0.3) {
        color = '#ff0000'; // 红色
    }
    
    // 绘制血条前景
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, Math.floor(canvas.width * pct), canvas.height);
    
    // 更新纹理
    bar.userData.texture.needsUpdate = true;
}

function createExplosionEffect(position, radius = 3) {
    for (let p = 0; p < 18; p++) {
        const particle = new THREE.Mesh(
            new THREE.BoxGeometry(0.2, 0.2, 0.2),
            new THREE.MeshBasicMaterial({ color: p % 2 === 0 ? 0xff4d4d : 0xffaa00 })
        );
        particle.position.copy(position);
        particle.userData = {
            velocity: new THREE.Vector3(
                (Math.random() - 0.5) * 0.55,
                Math.random() * 0.35,
                (Math.random() - 0.5) * 0.55
            ),
            life: 26
        };
        scene.add(particle);
        particles.push(particle);
    }

    [radius / 3, radius * 2 / 3, radius].forEach((ringRadius, index) => {
        const ring = new THREE.Mesh(
            new THREE.RingGeometry(ringRadius - 0.035, ringRadius + 0.035, 80),
            new THREE.MeshBasicMaterial({
                color: index === 2 ? 0xff4d4d : (index === 1 ? 0xffaa00 : 0xffffff),
                transparent: true,
                opacity: 0.78 - index * 0.12,
                side: THREE.DoubleSide,
                depthWrite: false
            })
        );
        ring.position.set(position.x, 0.035 + index * 0.006, position.z);
        ring.rotation.x = -Math.PI / 2;
        ring.userData = {
            velocity: new THREE.Vector3(0, 0, 0),
            life: 28,
            isExplosionRing: true,
            maxLife: 28
        };
        scene.add(ring);
        particles.push(ring);
    });

    playTone(90, 'sawtooth', 0.25, 0.08);
}

function checkVictoryAfterKill(killedIsBoss) {
    if (killedIsBoss && bossSpawned && enemies.length === 0) {
        endGame(true);
    }
}

function explodeEnemy(position, sourceEnemy) {
    const explosionRadius = 1.5;
    const explosionDamage = 2.5;
    createExplosionEffect(position, explosionRadius);
    if (typeof announceBattleEvent === 'function') {
        announceBattleEvent('explosion-event', t('explosion'), position, 1800);
    }
    enemies.slice().forEach(enemy => {
        if (enemy === sourceEnemy || enemy.isDead) return;
        const dx = enemy.mesh.position.x - position.x;
        const dz = enemy.mesh.position.z - position.z;
        if (Math.sqrt(dx * dx + dz * dz) <= explosionRadius) {
            damageEnemy(enemy, explosionDamage, null, true);
        }
    });
}

function killEnemy(enemy, sourceBullet = null, skipExplosion = false) {
    if (!enemy || enemy.isDead) return;
    enemy.isDead = true;
    enemy.isStalledAtZero = false;
    if (enemy.zeroHealthTimer) {
        clearTimeout(enemy.zeroHealthTimer);
        enemy.zeroHealthTimer = null;
    }

    const killedIsBoss = enemy.isBoss;
    const deathPosition = enemy.mesh.position.clone();
    if (killedIsBoss && typeof announceBattleEvent === 'function') {
        announceBattleEvent('boss-down', t('bossDown'), deathPosition, 1200);
    }
    
    // Remove from physics world first
    if (typeof removeEnemyFromBodyList === 'function') {
        removeEnemyFromBodyList(enemy.mesh);
    }
    
    scene.remove(enemy.mesh);
    const idx = enemies.indexOf(enemy);
    if (idx !== -1) {
        enemies.splice(idx, 1);
    }

    if (sourceBullet) {
        registerWeaponKill(sourceBullet);
    }
    if (!isAttackMode()) {
        score += killedIsBoss ? 50 : 1;
    }
    updateUI();

    if (!skipExplosion) {
        explodeEnemy(deathPosition, enemy);
    }

    checkVictoryAfterKill(killedIsBoss);
}

function scheduleZeroHealthDecay(enemy) {
    if (enemy.zeroHealthTimer || enemy.isDead) return;
    enemy.isStalledAtZero = true;
    enemy.zeroHealthTimer = setTimeout(() => {
        enemy.zeroHealthTimer = null;
        if (!enemy.isDead && enemies.includes(enemy) && Math.abs(enemy.health) < 0.0001) {
            damageEnemy(enemy, 1);
        }
    }, 500);
}

function formatDamageNumber(amount) {
    return Math.abs(amount - Math.round(amount)) < 0.01 ? String(Math.round(amount)) : amount.toFixed(1);
}

function showDamageText(enemy, amount, isCrit = false) {
    if (!enemy || !enemy.mesh) return;
    const canvas = document.createElement('canvas');
    canvas.width = 320;
    canvas.height = 160;
    const ctx = canvas.getContext('2d');
    const text = formatDamageNumber(amount);
    ctx.font = isCrit ? '900 85px Arial' : '800 75px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = 15;
    ctx.strokeStyle = 'rgba(10, 10, 16, 0.75)';
    ctx.fillStyle = isCrit ? '#ffb13b' : '#c8c8c8';
    ctx.strokeText(text, canvas.width / 2, canvas.height / 2);
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        opacity: 1,
        depthWrite: false
    });
    const sprite = new THREE.Sprite(material);
    const offsetX = (Math.random() - 0.5) * 0.45;
    const offsetZ = (Math.random() - 0.5) * 0.35;
    const height = enemy.isBoss ? 3.2 : 1.5;
    sprite.position.copy(enemy.mesh.position).add(new THREE.Vector3(offsetX, height, offsetZ));
    sprite.scale.set(isCrit ? 3.38 : 2.75, isCrit ? 1.7 : 1.38, 1);
    scene.add(sprite);
    damageTexts.push({
        sprite,
        material,
        texture,
        age: 0,
        life: 1000,
        riseDuration: 500,
        riseDistance: 1.0,
        startY: sprite.position.y
    });
}

function damageEnemy(enemy, amount, sourceBullet = null, fromExplosion = false) {
    if (!enemy || enemy.isDead) return;
    showDamageText(enemy, amount, !!(sourceBullet && sourceBullet.isCrit));
    const effectiveDamage = Math.min(amount, Math.max(enemy.health, 0));
    const sourceWeapon = sourceBullet && sourceBullet.ownerWeapon;
    if (effectiveDamage > 0 && sourceWeapon && sourceWeapon.damageStat) {
        sourceWeapon.damageStat.totalDamage += effectiveDamage;
    }
    enemy.health -= amount;
    if (Math.abs(enemy.health) < 0.0001) {
        enemy.health = 0;
    }

    if (enemy.hpBar) {
        updateBossHP(enemy);
    }

    if (enemy.health < 0) {
        killEnemy(enemy, sourceBullet, false);
    } else if (enemy.health === 0) {
        scheduleZeroHealthDecay(enemy);
    }
}

function formatDamageValue(value) {
    return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function renderDamageSummary() {
    const summaryEl = document.getElementById('damageSummary');
    if (!summaryEl) return;

    if (isAttackMode()) {
        const cfg = LEVELS[currentLevel] || {};
        const timeLimit = cfg.timeLimitMs || 60000;
        const elapsed = Math.ceil(Math.max(0, timeLimit - attackTimeRemainingMs) / 1000);
        summaryEl.innerHTML = `
            <div class="damage-summary-title">本关用时</div>
            <div class="damage-row">
                <span>Mission 4 Assault</span>
                <span class="damage-value">${elapsed}s</span>
            </div>
        `;
        return;
    }

    const stats = weaponDamageStats
        .filter(stat => stat.totalDamage > 0)
        .slice()
        .sort((a, b) => b.totalDamage - a.totalDamage || a.id - b.id);

    if (stats.length === 0) {
        summaryEl.innerHTML = `
            <div class="damage-summary-title">防御塔总伤害</div>
            <div class="damage-empty">本局没有防御塔造成伤害。</div>
        `;
        return;
    }

    const rows = stats.map(stat => `
        <div class="damage-row">
            <span>${stat.label}</span>
            <span class="damage-value">${formatDamageValue(stat.totalDamage)}</span>
        </div>
    `).join('');

    summaryEl.innerHTML = `
        <div class="damage-summary-title">防御塔总伤害</div>
        ${rows}
    `;
}

function getTargetForWeapon(w) {
    const config = getWeaponConfig(w.type);
    const range = config ? config.range : null;
    if (range === null || range === undefined) {
        return enemies.find(e => !e.isDead);
    }

    const maxRange = range;
    let bestTarget = null;
    let bestDistance = Infinity;
    enemies.forEach(e => {
        if (e.isDead) return;
        const distance = w.mesh.position.distanceTo(e.mesh.position);
        if (distance <= maxRange && distance < bestDistance) {
            bestTarget = e;
            bestDistance = distance;
        }
    });
    return bestTarget;
}

function createEnemyFromConfig(enemyConfig) {
    let enemyMesh;
    if (enemyConfig.modelType === 'robot') {
        enemyMesh = createRobotEnemy(false);
    } else if (enemyConfig.modelType === 'heavyRobot') {
        enemyMesh = createHeavyRobotEnemy();
    } else if (enemyConfig.modelType === 'eliteDrone') {
        enemyMesh = createDroneEnemy(true);
    } else if (enemyConfig.modelType === 'drone') {
        enemyMesh = createDroneEnemy(false);
    } else if (enemyConfig.modelType === 'armored') {
        enemyMesh = createArmoredUnitEnemy();
    } else if (enemyConfig.modelType === 'hoverArmor') {
        enemyMesh = createHoverArmorEnemy();
    } else if (enemyConfig.modelType === 'wheelbarrow') {
        enemyMesh = createWheelbarrowModel();
    } else if (enemyConfig.modelType === 'chopper') {
        enemyMesh = createAttackUnitModel('chopper');
    } else if (enemyConfig.modelType === 'finalBossAlpha') {
        enemyMesh = createAttackUnitModel('finalBossAlpha');
    } else if (enemyConfig.modelType === 'portalA') {
        enemyMesh = createPortalAEnemy();
    } else if (enemyConfig.modelType === 'portalB') {
        enemyMesh = createPortalBEnemy();
    } else {
        enemyMesh = createRobotEnemy(false);
    }

    if (enemyConfig.scale) {
        enemyMesh.scale.setScalar(enemyConfig.scale);
    }

    return enemyMesh;
}

// ==================== 游戏主循环 ====================
function getEnemyCategoryFromConfig(enemyConfig) {
    if (enemyConfig.category) return enemyConfig.category;
    if (typeof getEnemyCategory === 'function') {
        return getEnemyCategory(enemyConfig.modelType);
    }
    if (enemyConfig.modelType === 'portalA' || enemyConfig.modelType === 'portalB') return 'portal';
    if (enemyConfig.isDrone) return 'air';
    if (enemyConfig.modelType === 'armored' || enemyConfig.modelType === 'wheelbarrow') return 'armor';
    return 'infantry';
}

function getRandomPointOnEnemyPath(enemyPath) {
    if (!enemyPath || enemyPath.length < 2) {
        return { position: new THREE.Vector3(0, 0.08, 0), pathIdx: 0 };
    }

    const firstSegment = enemyPath.length > 3 ? 1 : 0;
    const lastSegment = Math.max(firstSegment, enemyPath.length - 4);
    const segmentIndex = firstSegment + Math.floor(Math.random() * (lastSegment - firstSegment + 1));
    const start = enemyPath[segmentIndex];
    const end = enemyPath[segmentIndex + 1];
    const position = new THREE.Vector3().lerpVectors(start, end, 0.18 + Math.random() * 0.64);
    position.y = 0.08;
    return { position, pathIdx: segmentIndex };
}

function getLevelPortalEvents(level) {
    return LEVEL_PORTAL_EVENTS[level] || [];
}

function getPortalConfigForLevel(level, modelType) {
    const basePortalHp = LEVELS[1].bossHp;
    const isPurplePortal = modelType === 'portalB';
    return {
        modelType: modelType,
        health: Math.round(basePortalHp * (isPurplePortal ? 1.2 : 1)),
        speed: 0,
        scale: 1,
        isDrone: false,
        category: 'portal',
        hpBarY: 2.4,
        portalDurationMs: 15000,
        portalMaxSpawns: isPurplePortal ? 20 : 15,
        portalSpawnGroup: isPurplePortal ? 'air' : 'infantry',
        portalSpawnIntervalMs: isPurplePortal ? 740 : 1000
    };
}

function createAttackBaseHpDisplay() {
    if (attackBaseHpGroup) {
        scene.remove(attackBaseHpGroup);
    }
    attackBaseHpGroup = new THREE.Group();
    attackBaseHpPips = [];
    const canvas = document.createElement('canvas');
    canvas.width = ATTACK_BASE_HP_BAR_ASSETS.canvasWidth;
    canvas.height = ATTACK_BASE_HP_BAR_ASSETS.canvasHeight;
    const texture = new THREE.CanvasTexture(canvas);
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        depthWrite: false
    }));
    sprite.scale.set(7.2, 1.42, 1);
    sprite.userData.canvas = canvas;
    sprite.userData.ctx = canvas.getContext('2d');
    sprite.userData.texture = texture;
    attackBaseHpGroup.add(sprite);
    attackBaseHpPips.push(sprite);
    attackBaseHpGroup.position.copy(castle.position).add(new THREE.Vector3(0, 3.95, 0));
    scene.add(attackBaseHpGroup);
    updateAttackBaseHpDisplay();
}

function updateAttackBaseHpDisplay() {
    if (!attackBaseHpGroup) return;
    attackBaseHpGroup.position.copy(castle.position).add(new THREE.Vector3(0, 3.95, 0));
    attackBaseHpGroup.lookAt(camera.position);
    const sprite = attackBaseHpPips[0];
    if (!sprite || !sprite.userData.ctx) return;
    const totalHp = (LEVELS[currentLevel] && LEVELS[currentLevel].opponentBaseHp) || 5;
    const ctx = sprite.userData.ctx;
    const canvas = sprite.userData.canvas;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'rgba(6, 8, 16, 0.72)';
    ctx.fillRect(10, 14, 340, 48);
    ctx.strokeStyle = 'rgba(255,255,255,0.72)';
    ctx.lineWidth = 4;
    ctx.strokeRect(10, 14, 340, 48);
    const gap = 16;
    const cellW = (320 - gap * (totalHp - 1)) / totalHp;
    for (let i = 0; i < totalHp; i++) {
        const x = 20 + i * (cellW + gap);
        const filled = i < lives;
        ctx.fillStyle = filled ? '#ff4fd8' : '#26313c';
        ctx.fillRect(x, 24, cellW, 28);
        ctx.fillStyle = filled ? 'rgba(255,255,255,0.38)' : 'rgba(255,255,255,0.08)';
        ctx.fillRect(x, 24, cellW, 8);
    }
    sprite.userData.texture.needsUpdate = true;
}

function setupAttackModeDefense() {
    const cfg = LEVELS[currentLevel];
    if (!cfg || !cfg.enemyTowers) return;
    cfg.enemyTowers.forEach((towerConfig, index) => {
        const padGroup = createAttackTowerSlotPad(towerConfig.x, towerConfig.z);
        if (typeof activeMapRoot !== 'undefined' && activeMapRoot) {
            activeMapRoot.add(padGroup);
        } else {
            scene.add(padGroup);
        }
        const model = createWeaponModel(towerConfig.type);
        model.position.set(towerConfig.x, 0.32, towerConfig.z);
        model.scale.setScalar(0.94);
        scene.add(model);
        const weaponConfig = getWeaponConfig(towerConfig.type);
        weapons.push({
            mesh: model,
            padMesh: padGroup,
            type: towerConfig.type,
            damageStat: null,
            basePosition: model.position.clone(),
            lastFire: index * 350,
            fireInterval: weaponConfig.fireIntervalMs,
            burstCount: 0,
            burstTotal: weaponConfig.burstTotal || 1,
            isEnemyTower: true
        });
    });
}

function createAttackTowerSlotPad(x, z) {
    const group = new THREE.Group();
    group.name = 'attack-tower-pad';
    group.userData.attackTowerPad = true;
    group.position.set(x, 0.16, z);
    const pad = new THREE.Mesh(
        new THREE.CylinderGeometry(0.92, 1.05, 0.12, 32),
        new THREE.MeshPhongMaterial({
            color: 0x132f38,
            emissive: 0x00d2d3,
            emissiveIntensity: 0.45,
            transparent: true,
            opacity: 0.88,
            shininess: 80
        })
    );
    const padRing = new THREE.Mesh(
        new THREE.TorusGeometry(1.03, 0.06, 8, 36),
        new THREE.MeshBasicMaterial({ color: 0x29f2ff, transparent: true, opacity: 0.82 })
    );
    const core = new THREE.Mesh(
        new THREE.CylinderGeometry(0.68, 0.78, 0.32, 20),
        new THREE.MeshPhongMaterial({
            color: 0x5f747a,
            emissive: 0x12333a,
            emissiveIntensity: 0.42,
            shininess: 70
        })
    );
    pad.position.y = -0.17;
    padRing.rotation.x = Math.PI / 2;
    padRing.position.y = 0.08;
    core.position.y = 0.05;
    group.add(pad, padRing, core);
    return group;
}

function setupAttackModeLevel() {
    setupAttackModeDefense();
    createAttackBaseHpDisplay();
}

function showAttackIncomeText(amount) {
    const pop = document.createElement('div');
    pop.className = 'attack-income-pop';
    pop.textContent = `+${amount}`;
    document.body.appendChild(pop);
    window.setTimeout(() => pop.remove(), 1100);
}

function updateAttackCountdownUI() {
    const timerItem = document.getElementById('timerItem');
    const timerVal = document.getElementById('timerVal');
    if (!timerItem || !timerVal) return;
    timerItem.style.display = isAttackMode() ? '' : 'none';
    timerVal.textContent = Math.max(0, Math.ceil(attackTimeRemainingMs / 1000));
    timerVal.style.color = attackTimeRemainingMs <= 10000 ? '#e74c3c' : '';
}

function updateAttackModeIncome(time) {
    const cfg = LEVELS[currentLevel] || {};
    const interval = cfg.incomeIntervalMs || 5000;
    const amount = cfg.incomeAmount || 30;
    if (!lastAttackIncomeTime) {
        lastAttackIncomeTime = time;
        return;
    }
    if (time - lastAttackIncomeTime >= interval) {
        const ticks = Math.min(3, Math.floor((time - lastAttackIncomeTime) / interval));
        score += amount * ticks;
        lastAttackIncomeTime += interval * ticks;
        showAttackIncomeText(amount * ticks);
        updateUI();
    }
}

function updateCardIncome(time) {
    if (isAttackMode() || typeof getCardIncomePerSecond !== 'function') return;
    const amount = getCardIncomePerSecond();
    if (amount <= 0) {
        lastCardIncomeTime = time;
        return;
    }
    if (!lastCardIncomeTime) {
        lastCardIncomeTime = time;
        return;
    }
    if (time - lastCardIncomeTime >= 1000) {
        const ticks = Math.min(5, Math.floor((time - lastCardIncomeTime) / 1000));
        score += amount * ticks;
        lastCardIncomeTime += 1000 * ticks;
        if (typeof showCardIncomeText === 'function') showCardIncomeText(amount * ticks);
        updateUI();
    }
}

function getAdjustedWeaponFireInterval(w) {
    const multiplier = typeof getCardFireIntervalMultiplier === 'function'
        ? getCardFireIntervalMultiplier(w)
        : 1;
    return Math.max(90, w.fireInterval * multiplier);
}

function getAdjustedAirstrikeDamage(baseDamage) {
    const bonus = typeof getCardDamageBonus === 'function'
        ? getCardDamageBonus({ type: 4 })
        : 0;
    return baseDamage + bonus;
}

function handleUnitReachedBase(enemy, index) {
    const hitDamage = enemy && enemy.isBoss ? 5 : 1;
    const baseEventPosition = isAttackMode()
        ? castle.position.clone().add(new THREE.Vector3(0, 0.2, 0))
        : enemy.mesh.position.clone();
    if (typeof removeEnemyFromBodyList === 'function') {
        removeEnemyFromBodyList(enemy.mesh);
    }
    scene.remove(enemy.mesh);
    enemies.splice(index, 1);
    lives = Math.max(0, lives - hitDamage);
    shakeCastle(300);
    flashBaseAlert();
    playTone(isAttackMode() ? 680 : 150, isAttackMode() ? 'triangle' : 'sawtooth', isAttackMode() ? 0.18 : 0.3, isAttackMode() ? 0.06 : 0.08);
    if (isAttackMode()) {
        if (typeof announceBattleEvent === 'function') {
            announceBattleEvent('enemy-base-hit', t('enemyBaseHit', { hp: lives }), baseEventPosition, 500);
        }
        updateAttackBaseHpDisplay();
        updateUI();
        if (lives <= 0) endGame(true);
        return;
    }
    if (typeof announceBattleEvent === 'function') {
        announceBattleEvent('player-base-hit', t('baseHit', { hp: lives }), baseEventPosition, 700);
    }
    updateUI();
    if (lives <= 0) endGame(false);
}

function getScheduledPortalPath(portalEvent) {
    if (portalEvent && portalEvent.path === 'alternate' && alternateEnemyPathPoints.length > 1) {
        return alternateEnemyPathPoints;
    }
    return pathPoints;
}

function updateScheduledLevelPortals(time) {
    const portalEvents = getLevelPortalEvents(currentLevel);
    if (portalEvents.length <= 0 || levelPortalSpawnCount >= portalEvents.length) return;

    while (levelPortalSpawnCount < portalEvents.length) {
        const portalEvent = portalEvents[levelPortalSpawnCount];
        const triggerCount = Math.floor(LEVELS[currentLevel].enemies * portalEvent.threshold);
        if (spawnedCount < triggerCount) break;

        const portalPath = getScheduledPortalPath(portalEvent);
        const portalLocation = getRandomPointOnEnemyPath(portalPath);
        createEnemyEntityFromConfig(
            getPortalConfigForLevel(currentLevel, portalEvent.modelType),
            portalPath,
            portalLocation.position,
            portalLocation.pathIdx,
            { currentTime: time }
        );
        if (typeof announceBattleEvent === 'function') {
            announceBattleEvent('portal-open-' + portalEvent.modelType, portalEvent.modelType === 'portalB' ? t('airPortalOpen') : t('portalOpen'), portalLocation.position, 1400);
        }
        levelPortalSpawnCount++;
    }
}

function addEnemyPhysicsIfNeeded(enemyMesh) {
    if (typeof initEnemyPhysics === 'function') {
        initEnemyPhysics();
    }
    if (typeof addEnemyRigidBody === 'function' && !enemyMesh.userData.hasPhysics) {
        const radius = Math.max(0.35, Math.min(0.85, enemyMesh.scale.x * 0.45));
        const height = Math.max(1.2, enemyMesh.scale.y * 1.2);
        addEnemyRigidBody(enemyMesh, radius, height, 2);
        enemyMesh.userData.hasPhysics = true;
    }
}

function createEnemyEntityFromConfig(spawnConfig, enemyPath, spawnPosition, pathIdx = 0, options = {}) {
    const enemyMesh = createEnemyFromConfig(spawnConfig);
    const category = getEnemyCategoryFromConfig(spawnConfig);
    const e = {
        mesh: enemyMesh,
        pathIdx: pathIdx,
        pathPoints: enemyPath,
        health: spawnConfig.health,
        speed: getEnemySpeed(spawnConfig),
        isDrone: !!spawnConfig.isDrone,
        isBoss: !!spawnConfig.isBoss,
        isFlyingBoss: !!spawnConfig.isFlyingBoss,
        flightBaseY: spawnConfig.flightBaseY,
        modelType: spawnConfig.modelType,
        enemyCategory: category,
        isPortal: category === 'portal'
    };

    enemyMesh.position.copy(spawnPosition);
    if (e.isPortal) {
        e.speed = 0;
        e.portalBornTime = options.currentTime || performance.now();
        e.maxHealth = e.health;
        e.portalEndTime = e.portalBornTime + (spawnConfig.portalDurationMs || 15000);
        e.portalNextSpawnTime = e.portalBornTime + 650;
        e.portalSpawnedCount = 0;
        e.portalMaxSpawns = spawnConfig.portalMaxSpawns || 15;
        e.portalSpawnGroup = spawnConfig.portalSpawnGroup || 'infantry';
        e.portalSpawnIntervalMs = spawnConfig.portalSpawnIntervalMs || 1000;

        const hpBarContainer = new THREE.Group();
        enemyMesh.add(hpBarContainer);
        addHpBarToBoss(hpBarContainer, e.maxHealth, spawnConfig.hpBarY || 2.4);
        e.hpBar = hpBarContainer.userData.hpBar;
        e.hpBarContainer = hpBarContainer;
    } else if (e.isBoss) {
        e.maxHealth = e.health;
        if (e.isFlyingBoss && e.flightBaseY !== undefined) {
            enemyMesh.position.y = e.flightBaseY;
        }
        const hpBarContainer = new THREE.Group();
        enemyMesh.add(hpBarContainer);
        addHpBarToBoss(hpBarContainer, e.maxHealth, spawnConfig.hpBarY || (e.isFlyingBoss ? 4.4 : 4.2));
        e.hpBar = hpBarContainer.userData.hpBar;
        e.hpBarContainer = hpBarContainer;
    } else {
        addEnemyPhysicsIfNeeded(enemyMesh);
    }

    scene.add(enemyMesh);
    enemies.push(e);
    return e;
}

function removeExpiredPortalEnemy(enemy) {
    if (!enemy || enemy.isDead) return;
    if (typeof removeEnemyFromBodyList === 'function') {
        removeEnemyFromBodyList(enemy.mesh);
    }
    scene.remove(enemy.mesh);
    const idx = enemies.indexOf(enemy);
    if (idx !== -1) {
        enemies.splice(idx, 1);
    }
}

function updatePortalEnemies(time) {
    for (let i = enemies.length - 1; i >= 0; i--) {
        const portal = enemies[i];
        if (!portal || !portal.isPortal || portal.isDead || portal.isStalledAtZero) continue;

        if (time >= portal.portalEndTime) {
            removeExpiredPortalEnemy(portal);
            continue;
        }

        if (
            time >= portal.portalNextSpawnTime &&
            portal.portalSpawnedCount < portal.portalMaxSpawns &&
            enemies.length < 90 &&
            (typeof choosePortalInfantryConfig === 'function' || typeof choosePortalAirConfig === 'function')
        ) {
            const spawnConfig = portal.portalSpawnGroup === 'air'
                ? choosePortalAirConfig(currentLevel)
                : choosePortalInfantryConfig(currentLevel);
            const offsetAngle = Math.random() * Math.PI * 2;
            const offsetRadius = 0.35 + Math.random() * 0.45;
            const spawnPosition = portal.mesh.position.clone().add(new THREE.Vector3(
                Math.sin(offsetAngle) * offsetRadius,
                0.05,
                Math.cos(offsetAngle) * offsetRadius
            ));
            createEnemyEntityFromConfig(
                spawnConfig,
                portal.pathPoints || pathPoints,
                spawnPosition,
                portal.pathIdx,
                { fromPortal: true, currentTime: time }
            );
            portal.portalSpawnedCount++;
            portal.portalNextSpawnTime = time + (portal.portalSpawnIntervalMs || 1000);
            playTone(620, 'triangle', 0.14, 0.028);
        }
    }
}

let lastTime = 0;
let spawnTimer = 0;

function gameLoop(time) {
    requestAnimationFrame(gameLoop);
    
    // 城堡震动效果更新（屏幕震动）
    if (castleShakeTime > 0) {
        castleShakeTime -= 16; // 约 60fps
        const shakeIntensity = 0.15 * (castleShakeTime / 300);
        // 震动摄像机来模拟屏幕震动效果
        camera.position.x = baseCameraX + Math.sin(time * 0.05) * shakeIntensity;
        camera.position.y = baseCameraY + Math.cos(time * 0.07) * shakeIntensity * 0.5;
    } else {
        // 恢复摄像机正常位置
        adjustCamera();
    }
    updateBaseAlert(16);
    if (typeof updateSpawnPortals === 'function') {
        updateSpawnPortals(time);
    }
    
    // Boss 血条始终面向摄像机
    enemies.forEach(e => {
        if (e.hpBarContainer) {
            e.hpBarContainer.lookAt(camera.position);
        }
    });
    updateAirstrikeButton(time);
    
    // Tesla 炮台击杀数数字标签更新 - 机制已移除，不再显示击杀数
    
    if (!gameStarted || gameOver || isPaused) {
        if (isPaused) {
            lastTime = time;
        }
        renderer.render(scene, camera);
        return;
    }
    
    const delta = lastTime ? time - lastTime : 0;
    lastTime = time;
    
    if (isAttackMode()) {
        attackTimeRemainingMs = Math.max(0, attackTimeRemainingMs - delta);
        updateAttackCountdownUI();
        if (attackTimeRemainingMs <= 0) {
            updateUI();
            endGame(false);
            renderer.render(scene, camera);
            return;
        }
        updateAttackModeIncome(time);
        updateAttackBaseHpDisplay();
    } else {
        // 敌人生成
        updateCardIncome(time);
        spawnTimer += delta;
        if (spawnTimer > 400 && spawnedCount < LEVELS[currentLevel].enemies) {
            spawnTimer = 0;
            spawnedCount++;
            
            const spawnConfig = chooseEnemyConfig(currentLevel);
            const enemyPath = (currentLevel === 3 && alternateEnemyPathPoints.length > 0 && Math.random() < (LEVELS[3].altEnemyChance || 0))
                ? alternateEnemyPathPoints
                : pathPoints;
            createEnemyEntityFromConfig(
                spawnConfig,
                enemyPath,
                enemyPath[0],
                0,
                { currentTime: time }
            );
        } else if (spawnedCount >= LEVELS[currentLevel].enemies && enemies.length === 0 && !bossSpawned) {
            bossSpawned = true;
            const warningText = currentLevel === 3 ? t('bossAlpha') : t('bossIncoming');
            queueBossSpawnWarning(warningText, () => spawnBoss());
        }
        
        // 第三关特殊逻辑：第一个 Boss 在小兵出一半时出场
        if ((currentLevel === 2 || currentLevel === 3) && !firstBossSpawned && spawnedCount >= Math.floor(LEVELS[currentLevel].enemies / 2)) {
            firstBossSpawned = true;
            const midBossText = currentLevel === 2 ? t('chopperBoss') : t('bossAlpha');
            queueBossSpawnWarning(midBossText, () => spawnFirstBoss());
        }
    }
    
    // 敌人移动与动画 - 使用新的 AI 系统
    if (!isAttackMode()) {
        updateScheduledLevelPortals(time);
    }
    updatePortalEnemies(time);

    if (typeof updateEnemyAI === 'function') {
        // 使用新的 AI 系统处理行走、转向和位置微调
        updateEnemyAI(enemies, delta);
        
        // 检查是否有敌人到达终点（需要在这里处理，因为 AI 模块不直接访问游戏状态）
        for (let i = enemies.length - 1; i >= 0; i--) {
            const e = enemies[i];
            if (e.isDead || e.isStalledAtZero || e.isPortal) continue;
            
            const enemyPath = e.pathPoints || pathPoints;
            // 如果已到达最后一个路点，说明到达基地
            if (e.pathIdx >= enemyPath.length - 1) {
                handleUnitReachedBase(e, i);
            }
        }
    } else {
        // 后备：旧式直接移动逻辑
        for (let i = enemies.length - 1; i >= 0; i--) {
            const e = enemies[i];
            if (e.isStalledAtZero || e.isPortal) continue;
            
            const enemyPath = e.pathPoints || pathPoints;
            const target = enemyPath[e.pathIdx + 1];
            if (!target) continue;
            
            const currentPos = e.mesh.position.clone();
            if (e.isFlyingBoss) currentPos.y = 0;
            
            const dir = new THREE.Vector3().subVectors(target, currentPos);
            const dist = dir.length();
            
            if (dist < 0.5) {
                e.pathIdx++;
                if (e.pathIdx >= enemyPath.length - 1) {
                    handleUnitReachedBase(e, i);
                    continue;
                }
            } else {
                dir.normalize();
                e.mesh.lookAt(target);
                
                if (e.mesh.userData.physicsBody) {
                    const body = e.mesh.userData.physicsBody;
                    const forwardSpeed = e.speed * 60;
                    body.velocity.z = dir.z * forwardSpeed;
                } else {
                    e.mesh.position.add(dir.multiplyScalar(e.speed));
                }
            }
        }
    }
    
    // 播放动画
    for (let i = enemies.length - 1; i >= 0; i--) {
        const e = enemies[i];
        if (!e.isDead && !e.isStalledAtZero) {
            animateEnemy(e, time);
        }
    }
    updateEnemyMovementSounds(time);
    
    // Update enemy physics simulation (collision avoidance between enemies)
    if (typeof updateEnemyPhysics === 'function') {
        updateEnemyPhysics(time);
    }
    
    // 武器射击
    weapons.forEach(w => {
        if (w.type === 3) {
            updateTeslaChargeBar(w.mesh, time);
        }

        if (w.critShakeDuration !== undefined && w.critShakeDuration > 0) {
            w.critShakeDuration -= 16;
            const basePos = w.basePosition || w.mesh.position.clone();
            const totalDuration = w.critShakeTotalDuration || 180;
            const fade = Math.max(0, w.critShakeDuration / totalDuration);
            const intensity = (w.critShakeIntensity || 0.08) * fade;
            w.mesh.position.copy(basePos).add(new THREE.Vector3(
                Math.sin(time * 0.45) * intensity,
                0,
                Math.cos(time * 0.52) * intensity
            ));
            if (w.critShakeDuration <= 0) {
                w.mesh.position.copy(basePos);
            }
        }

        // 后坐力动画更新：炮台开火后炮管后移再归位
        if (w.recoilDuration !== undefined && w.recoilDuration > 0) {
            w.recoilDuration -= 16; // 约 60fps
            const totalDuration = w.recoilTotalDuration || 240;
            const recoilProgress = 1 - Math.max(0, w.recoilDuration / totalDuration);
            const recoilAmount = -w.recoilDistance * Math.sin(recoilProgress * Math.PI);
            
            // 只移动炮管组，而不是整个炮台
            if (w.mesh.userData.barrelGroup) {
                const baseZ = w.mesh.userData.barrelBaseZ || 0;
                w.mesh.userData.barrelGroup.position.z = baseZ + recoilAmount;
                if (w.recoilDuration <= 0) {
                    w.mesh.userData.barrelGroup.position.z = baseZ;
                }
            }
        }
        
        const activeFireInterval = getAdjustedWeaponFireInterval(w);
        if (w.type === 2) {
            // Rail: 连发 6 发之后有 1 秒间隔
            if (w.burstCount < w.burstTotal) {
                // 连发期间每发间隔约 217ms (1300ms / 6)
                const burstInterval = activeFireInterval / w.burstTotal;
                if (time - w.lastFire > burstInterval) {
                    const target = getTargetForWeapon(w);
                    if (target) {
                        w.lastFire = time;
                        w.burstCount++;
                        fireBullet(w, target, 8);
                    }
                }
            } else {
                // 等待 1.3 秒后重置连发计数
                if (time - w.lastFire > activeFireInterval) {
                    w.burstCount = 0;
                }
            }
        } else if (w.type === 3) {
            // Tesla: 激光攻击，充能效果
            if (time - w.lastFire > activeFireInterval) {
                const target = getTargetForWeapon(w);
                if (target) {
                    w.lastFire = time;
                    
                    // 充能动画：从下往上的灯塔充能效果
                    const crystal = w.mesh.userData.crystal;
                    if (crystal) {
                        // 充能阶段：逐渐变亮并向上扩展
                        let chargePhase = 0;
                        const chargeDuration = getWeaponConfig(3).chargeTimeMs;
                        const chargeStartTime = Date.now();
                        
                        const chargeInterval = setInterval(() => {
                            const elapsed = Date.now() - chargeStartTime;
                            const progress = Math.min(elapsed / chargeDuration, 1);
                            
                            // 颜色从暗紫到亮白
                            const brightness = Math.floor(progress * 255);
                            crystal.material.emissive.setRGB(progress, progress * 0.5, progress);
                            const baseScale = crystal.userData.baseScale || new THREE.Vector3(1, 1, 1);
                            crystal.scale.copy(baseScale).multiplyScalar(1 + progress * 0.5);
                            
                            // 创建向上扩展的光环
                            if (progress < 1 && chargePhase % 3 === 0) {
                                const ringGeo = new THREE.RingGeometry(0.5, 0.6, 16);
                                const ringMat = new THREE.MeshBasicMaterial({
                                    color: 0xd4a5ff,
                                    transparent: true,
                                    opacity: 1 - progress
                                });
                                const ring = new THREE.Mesh(ringGeo, ringMat);
                                ring.position.copy(w.mesh.position).add(new THREE.Vector3(0, 1 + progress * 2, 0));
                                ring.rotation.x = Math.PI / 2;
                                scene.add(ring);
                                
                                // 光环向上移动并消失
                                const animateRing = () => {
                                    ring.position.y += 0.1;
                                    ring.material.opacity -= 0.05;
                                    ring.scale.multiplyScalar(1.05);
                                    if (ring.material.opacity > 0) {
                                        requestAnimationFrame(animateRing);
                                    } else {
                                        scene.remove(ring);
                                    }
                                };
                                animateRing();
                            }
                            chargePhase++;
                            
                            if (progress >= 1) {
                                clearInterval(chargeInterval);
                                // 发射激光
                                fireBullet(w, target, 15);
                                // 重置水晶状态
                                setTimeout(() => {
                                    if (crystal) {
                                        crystal.material.emissive.setHex(0x000000);
                                        const baseScale = crystal.userData.baseScale || new THREE.Vector3(1, 1, 1);
                                        crystal.scale.copy(baseScale);
                                    }
                                }, 300);
                            }
                        }, 50);
                    } else {
                        fireBullet(w, target, 15);
                    }
                }
            }
        } else {
            // Pulse (type 1): 普通攻击逻辑
            if (time - w.lastFire > activeFireInterval) {
                const target = getTargetForWeapon(w);
                if (target) {
                    w.lastFire = time;
                    fireBullet(w, target, 3);
                }
            }
        }
    });
    
    // 子弹移动与碰撞
    for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        
        if (b.isTesla) {
            // Tesla 激光：不移动，使用持续时间控制
            b.life--;
            
            // 对范围内所有敌人造成伤害
            enemies.slice().forEach(e => {
                // 计算敌人到激光线的距离（简化为到激光起点的距离）
                const laserStart = b.mesh.position.clone();
                if (e.mesh.position.distanceTo(laserStart) < b.aoeRadius) {
                    damageEnemy(e, b.damage * (b.teslaFrameDamageRatio || getWeaponConfig(3).teslaFrameDamageRatio), b);
                }
            });
            
            // 激光生命结束或目标已死亡则移除
            if (b.life <= 0) {
                scene.remove(b.mesh);
                if (b.glowMesh) scene.remove(b.glowMesh);
                bullets.splice(i, 1);
            }
        } else {
            // 普通子弹移动
            b.mesh.position.add(b.direction.clone().multiplyScalar(b.speed));
            if (b.isRailProjectile) {
                b.life--;
                b.speed = Math.max(b.minSpeed, b.speed * b.speedDecay);
            }
            
            let hit = false;
            for (let j = enemies.length - 1; j >= 0; j--) {
                const e = enemies[j];
                if (b.mesh.position.distanceTo(e.mesh.position) < (e.isBoss ? 2.5 : 0.8)) {
                    damageEnemy(e, b.damage, b);
                    hit = true;
                    
                    // 粒子效果
                    for (let p = 0; p < 5; p++) {
                        const particle = new THREE.Mesh(
                            new THREE.BoxGeometry(0.15, 0.15, 0.15),
                            new THREE.MeshBasicMaterial({ color: 0xffaa00 })
                        );
                        particle.position.copy(b.mesh.position);
                        particle.userData = {
                            velocity: new THREE.Vector3(
                                (Math.random() - 0.5) * 0.3,
                                (Math.random() - 0.5) * 0.3,
                                (Math.random() - 0.5) * 0.3
                            ),
                            life: 20
                        };
                        scene.add(particle);
                        particles.push(particle);
                    }
                    
                    // 非穿透子弹命中后跳出循环
                    break;
                }
            }
            
            if (hit || b.mesh.position.length() > 50 || (b.isRailProjectile && b.life <= 0)) {
                scene.remove(b.mesh);
                bullets.splice(i, 1);
            }
        }
    }
    
    updateAirstrikeBombs(time);

    // 粒子动画
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.position.add(p.userData.velocity);
        p.userData.life--;
        if (p.userData.isExplosionRing) {
            const fade = Math.max(0, p.userData.life / p.userData.maxLife);
            p.material.opacity = fade * 0.78;
            p.scale.multiplyScalar(1.012);
        } else {
            p.scale.multiplyScalar(0.9);
        }
        if (p.userData.life <= 0) {
            scene.remove(p);
            particles.splice(i, 1);
        }
    }

    for (let i = damageTexts.length - 1; i >= 0; i--) {
        const d = damageTexts[i];
        d.age += 16;
        const riseProgress = Math.min(d.age / d.riseDuration, 1);
        d.sprite.position.y = d.startY + d.riseDistance * riseProgress;
        d.sprite.lookAt(camera.position);
        if (d.age > d.riseDuration) {
            d.material.opacity = Math.max(0, 1 - ((d.age - d.riseDuration) / (d.life - d.riseDuration)));
        }
        if (d.age >= d.life) {
            scene.remove(d.sprite);
            d.material.dispose();
            d.texture.dispose();
            damageTexts.splice(i, 1);
        }
    }
    
    renderer.render(scene, camera);
}

// ==================== 游戏结束处理 ====================
function endGame(victory) {
    gameOver = true;
    setGameDimmed(true);
    if (typeof updateCardPanelUI === 'function') updateCardPanelUI();
    const msgEl = document.getElementById('msg');
    const endBtn = document.getElementById('endBtn');
    const endScreen = document.getElementById('endScreen');
    
    // 计算关卡得分并保存到排行榜
    const levelConfig = LEVELS[currentLevel] || {};
    const timeLimitMs = levelConfig.timeLimitMs || 0;
    const clearTime = isAttackMode() && timeLimitMs
        ? Math.ceil(Math.max(0, timeLimitMs - attackTimeRemainingMs) / 1000)
        : Math.floor((Date.now() - levelStartTime) / 1000);
    const startingScore = levelConfig.startingScore !== undefined ? levelConfig.startingScore : (isDebugMode ? 1000 : (currentLevel === 1 ? 3 : (currentLevel === 2 ? 15 : 30)));
    const killScore = score - startingScore;
    const levelScore = calculateLevelScore(currentLevel, lives, killScore, victory);
    
    const leaderboardEntry = {
        playerName: 'Player',
        level: currentLevel,
        score: levelScore,
        remainingLives: lives,
        killScore: killScore,
        bonusScore: lives * 20,
        isVictory: victory,
        clearTime: clearTime,
        attackUnitsDeployed: isAttackMode() ? attackUnitsDeployed : undefined,
        attackGoldSpent: isAttackMode() ? attackGoldSpent : undefined,
        timestamp: new Date().toISOString()
    };
    
    if (victory) {
        saveToLeaderboard(leaderboardEntry);
    }
    
    if (victory) {
        if (currentLevel === 1) {
            msgEl.innerText = "🎉 MISSION 1 COMPLETE!";
            endBtn.innerText = "NEXT MISSION";
        } else if (currentLevel === 2) {
            msgEl.innerText = "🎉 MISSION 2 COMPLETE!";
            endBtn.innerText = "MISSION 3";
        } else if (currentLevel === 3) {
            msgEl.innerText = "🎀 MISSION 3 COMPLETE!";
            endBtn.innerText = "MISSION 4";
        } else {
            msgEl.innerText = "🏆 CAMPAIGN CLEARED!";
            endBtn.innerText = "REPLAY";
        }
        playTone(800, 'sine', 0.2, 0.1);
        setTimeout(() => playTone(1000, 'sine', 0.3, 0.1), 200);
    } else {
        msgEl.innerText = isAttackMode() ? "⏱ TIME UP" : "💀 GAME OVER";
        endBtn.innerText = "RETRY";
        playTone(150, 'sawtooth', 0.5, 0.1);
    }
    
    renderDamageSummary();
    endScreen.style.display = 'block';
    if (typeof showEndLevelUI === 'function') {
        showEndLevelUI(victory, currentLevel, isAttackMode());
    }
}

// ==================== 窗口大小调整 ====================
function resizeGameViewport() {
    const viewport = getViewportSize();
    camera.aspect = viewport.width / viewport.height;
    camera.updateProjectionMatrix();
    renderer.setSize(viewport.width, viewport.height, false);
    adjustCamera();
}

window.addEventListener('resize', resizeGameViewport);
if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', resizeGameViewport);
}
window.addEventListener('orientationchange', () => setTimeout(resizeGameViewport, 150));

// ==================== 启动游戏循环 ====================
requestAnimationFrame(gameLoop);
