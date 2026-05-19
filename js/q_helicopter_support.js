// Q card support helicopter. Uses Rail Laser targeting, damage, burst timing, and card bonuses.
const Q_HELICOPTER_SUPPORT = {
    active: false,
    state: 'idle',
    mesh: null,
    pad: null,
    weapon: null,
    target: null,
    enterStartTime: 0,
    moveStartTime: 0,
    from: null,
    to: null,
    pathPoints: null,
    routeDistance: 0,
    lastPathMoveTime: 0,
    lastTargetSeen: 0,
    lastEngageAnnounce: 0
};

const Q_HELICOPTER_DEFAULTS = {
    moveRadius: 9,
    moveSpeed: 0.014,
    facingYawOffset: -Math.PI / 2,
    takeoffDurationMs: 820,
    returnDurationMs: 980,
    enterDurationMs: 1450,
    lostTargetReturnDelayMs: 1100,
    rotorSpeed: 0.5,
    tailRotorSpeedRatio: 1.6,
    bodyBankAmplitude: 0.025,
    padSpinSpeed: 0.006,
    combatAltitude: 1.18
};

function getQRuntime() {
    return window.CASTLE_DEFEND_RUNTIME || {};
}

function getQScene() {
    const runtime = getQRuntime();
    if (runtime.scene) return runtime.scene;
    try {
        return scene;
    } catch (error) {
        return null;
    }
}

function getQCastle() {
    const runtime = getQRuntime();
    if (runtime.castle) return runtime.castle;
    try {
        return castle;
    } catch (error) {
        return null;
    }
}

function getQEnemies() {
    const runtime = getQRuntime();
    if (runtime.enemies) return runtime.enemies;
    try {
        return enemies;
    } catch (error) {
        return [];
    }
}

function getQPrimaryPath() {
    const runtime = getQRuntime();
    if (runtime.pathPoints && runtime.pathPoints.length > 1) return runtime.pathPoints;
    try { return pathPoints; } catch (error) { return []; }
}

function getQWeaponDamageStats() {
    const runtime = getQRuntime();
    if (runtime.weaponDamageStats) return runtime.weaponDamageStats;
    try {
        return weaponDamageStats;
    } catch (error) {
        return null;
    }
}

function getQPathTotalDistance(points) {
    let total = 0;
    for (let i = 0; i < points.length - 1; i++) {
        total += points[i].distanceTo(points[i + 1]);
    }
    return total;
}

function getQPointAtDistance(points, distance, y) {
    if (!points || !points.length) return getQHelicopterHoverPosition().clone().setY(y);
    if (points.length === 1) return points[0].clone().setY(y);
    let remaining = Math.max(0, distance);
    for (let i = 0; i < points.length - 1; i++) {
        const a = points[i];
        const b = points[i + 1];
        const segmentLength = a.distanceTo(b);
        if (remaining <= segmentLength) {
            const t = segmentLength > 0 ? remaining / segmentLength : 0;
            return new THREE.Vector3().lerpVectors(a, b, t).setY(y);
        }
        remaining -= segmentLength;
    }
    return points[points.length - 1].clone().setY(y);
}

function getQDistanceOnPath(points, point) {
    if (!points || points.length < 2 || !point) return 0;
    let bestDistance = 0;
    let bestDistanceSq = Infinity;
    let walked = 0;
    const point2 = point.clone().setY(0);
    for (let i = 0; i < points.length - 1; i++) {
        const a = points[i].clone().setY(0);
        const b = points[i + 1].clone().setY(0);
        const ab = b.clone().sub(a);
        const lengthSq = ab.lengthSq();
        const t = lengthSq > 0 ? THREE.MathUtils.clamp(point2.clone().sub(a).dot(ab) / lengthSq, 0, 1) : 0;
        const projected = a.clone().add(ab.multiplyScalar(t));
        const distanceSq = projected.distanceToSquared(point2);
        if (distanceSq < bestDistanceSq) {
            bestDistanceSq = distanceSq;
            bestDistance = walked + Math.sqrt(lengthSq) * t;
        }
        walked += Math.sqrt(lengthSq);
    }
    return bestDistance;
}

function getQBullets() {
    const runtime = getQRuntime();
    if (runtime.bullets) return runtime.bullets;
    try {
        return bullets;
    } catch (error) {
        return null;
    }
}

function getQHelicopterWeaponConfig() {
    const railConfig = typeof getWeaponConfig === 'function' ? (getWeaponConfig(2) || {}) : {};
    const supportConfig = typeof getWeaponConfig === 'function' ? (getWeaponConfig('Q_HELICOPTER') || {}) : {};
    return Object.assign({}, Q_HELICOPTER_DEFAULTS, supportConfig, {
        fireIntervalMs: railConfig.fireIntervalMs ?? supportConfig.fireIntervalMs,
        burstTotal: railConfig.burstTotal ?? supportConfig.burstTotal,
        damage: railConfig.damage ?? supportConfig.damage,
        projectileSpeed: supportConfig.projectileSpeed ?? railConfig.projectileSpeed,
        projectileSpeedDecay: supportConfig.projectileSpeedDecay ?? railConfig.projectileSpeedDecay,
        projectileMinSpeed: supportConfig.projectileMinSpeed ?? railConfig.projectileMinSpeed,
        projectileLife: supportConfig.projectileLife ?? railConfig.projectileLife
    });
}

function getQHorizontalDistance(a, b) {
    if (!a || !b) return Infinity;
    const dx = a.x - b.x;
    const dz = a.z - b.z;
    return Math.sqrt(dx * dx + dz * dz);
}

function easeInOutCubicQHeli(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function getQHelicopterPadPosition() {
    const base = getQCastle();
    const basePos = base ? base.position : new THREE.Vector3(0, 0, 0);
    return basePos.clone().add(new THREE.Vector3(-0.42, 0.42, 0.18));
}

function getQHelicopterHoverPosition() {
    return getQHelicopterPadPosition().add(new THREE.Vector3(0, 0.1, 0));
}

function createQHelicopterPad() {
    const group = new THREE.Group();
    const padMat = new THREE.MeshPhongMaterial({
        color: 0xdaf9ff,
        emissive: 0x0d8eb8,
        emissiveIntensity: 0.24,
        transparent: true,
        opacity: 0.8
    });
    const ringMat = new THREE.MeshBasicMaterial({
        color: 0x43d8ff,
        transparent: true,
        opacity: 0.72,
        side: THREE.DoubleSide
    });
    const markMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

    const disk = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 0.07, 32), padMat);
    disk.position.y = 0.04;
    group.add(disk);

    const ring = new THREE.Mesh(new THREE.RingGeometry(0.64, 0.75, 40), ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.09;
    group.add(ring);

    const hBar = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.02, 0.64), markMat);
    const hBar2 = hBar.clone();
    hBar.position.set(-0.2, 0.105, 0);
    hBar2.position.set(0.2, 0.105, 0);
    const hMiddle = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.02, 0.1), markMat);
    hMiddle.position.set(0, 0.108, 0);
    group.add(hBar, hBar2, hMiddle);
    return group;
}

function recolorQSupportHelicopter(model) {
    let meshIndex = 0;
    const white = 0xf7fcff;
    const blue = 0x1e7fe8;
    const navy = 0x0c2f58;
    const cyan = 0x96eaff;
    model.traverse(obj => {
        if (!obj.isMesh || !obj.material) return;
        const materials = Array.isArray(obj.material) ? obj.material : [obj.material];
        const recolored = materials.map(original => {
            const mat = original.clone ? original.clone() : new THREE.MeshPhongMaterial();
            const oldHex = original.color ? original.color.getHex() : navy;
            const isGlow = mat.isMeshBasicMaterial || oldHex === 0xff4fd8 || oldHex === 0x96eaff;
            const isTransparent = !!original.transparent;
            if (isTransparent) {
                mat.color.setHex(cyan);
                mat.opacity = 0.78;
                mat.transparent = true;
                if (mat.emissive) {
                    mat.emissive.setHex(0x2ec8ff);
                    mat.emissiveIntensity = 0.42;
                }
            } else if (isGlow || oldHex === 0xff4fd8) {
                mat.color.setHex(cyan);
                if (mat.emissive) {
                    mat.emissive.setHex(0x179dff);
                    mat.emissiveIntensity = 0.52;
                }
            } else if (oldHex < 0x101010) {
                mat.color.setHex(navy);
                if (mat.emissive) {
                    mat.emissive.setHex(0x03142b);
                    mat.emissiveIntensity = 0.16;
                }
            } else {
                mat.color.setHex(meshIndex % 3 === 0 ? blue : white);
                if (mat.emissive) {
                    mat.emissive.setHex(meshIndex % 3 === 0 ? 0x083e8a : 0x6bcfff);
                    mat.emissiveIntensity = meshIndex % 3 === 0 ? 0.24 : 0.12;
                }
            }
            return mat;
        });
        obj.material = Array.isArray(obj.material) ? recolored : recolored[0];
        meshIndex++;
    });
}

function createQSupportHelicopter() {
    const model = typeof createHelicopterModel === 'function'
        ? createHelicopterModel(THREE)
        : createAttackUnitModel('chopper');
    recolorQSupportHelicopter(model);
    model.scale.setScalar(0.5);
    model.rotation.y = Math.PI / 2;
    model.userData.qSupport = true;

    const turretGroup = new THREE.Group();
    turretGroup.position.set(0, 2.3, 0.8);
    const barrelGroup = new THREE.Group();
    turretGroup.add(barrelGroup);
    model.add(turretGroup);
    model.userData.turretGroup = turretGroup;
    model.userData.barrelGroup = barrelGroup;
    model.userData.barrelBaseZ = 0;
    return model;
}

function createQHelicopterDamageStat() {
    const stats = getQWeaponDamageStats();
    if (!stats) return null;
    let stat = stats.find(item => item && item.id === 'q-helicopter-support');
    if (!stat) {
        stat = {
            id: 'q-helicopter-support',
            type: 2,
            label: 'Q Support Helicopter',
            totalDamage: 0
        };
        stats.push(stat);
    }
    return stat;
}

function activateQHelicopterSupport() {
    if (typeof isAttackMode === 'function' && isAttackMode()) return;
    if (Q_HELICOPTER_SUPPORT.active) return;
    const gameScene = getQScene();
    if (!gameScene || typeof THREE === 'undefined') return;

    const railConfig = getQHelicopterWeaponConfig();
    const hoverPosition = getQHelicopterHoverPosition();
    const now = performance.now();

    const mesh = createQSupportHelicopter();
    mesh.position.copy(hoverPosition);
    gameScene.add(mesh);

    Q_HELICOPTER_SUPPORT.active = true;
    Q_HELICOPTER_SUPPORT.state = 'docked';
    Q_HELICOPTER_SUPPORT.mesh = mesh;
    Q_HELICOPTER_SUPPORT.pad = null;
    Q_HELICOPTER_SUPPORT.enterStartTime = now;
    Q_HELICOPTER_SUPPORT.from = null;
    Q_HELICOPTER_SUPPORT.to = null;
    Q_HELICOPTER_SUPPORT.pathPoints = null;
    Q_HELICOPTER_SUPPORT.routeDistance = 0;
    Q_HELICOPTER_SUPPORT.lastPathMoveTime = now;
    Q_HELICOPTER_SUPPORT.target = null;
    Q_HELICOPTER_SUPPORT.lastTargetSeen = 0;
    Q_HELICOPTER_SUPPORT.lastEngageAnnounce = 0;
    Q_HELICOPTER_SUPPORT.weapon = {
        mesh,
        type: 2,
        damageStat: createQHelicopterDamageStat(),
        basePosition: mesh.position.clone(),
        lastFire: 0,
        fireInterval: railConfig.fireIntervalMs,
        burstCount: 0,
        burstTotal: railConfig.burstTotal || 1,
        railShotIndex: 0
    };

    if (typeof announceHighlight === 'function') {
        announceHighlight('q-heli-support', 'Q card support helicopter inbound');
    }
    if (typeof playTone === 'function') {
        playTone(720, 'triangle', 0.22, 0.045);
        setTimeout(() => playTone(920, 'sine', 0.18, 0.04), 120);
    }
}

function resetQHelicopterSupport() {
    const gameScene = getQScene();
    if (gameScene) {
        if (Q_HELICOPTER_SUPPORT.mesh) gameScene.remove(Q_HELICOPTER_SUPPORT.mesh);
        if (Q_HELICOPTER_SUPPORT.pad) gameScene.remove(Q_HELICOPTER_SUPPORT.pad);
    }
    Q_HELICOPTER_SUPPORT.active = false;
    Q_HELICOPTER_SUPPORT.state = 'idle';
    Q_HELICOPTER_SUPPORT.mesh = null;
    Q_HELICOPTER_SUPPORT.pad = null;
    Q_HELICOPTER_SUPPORT.weapon = null;
    Q_HELICOPTER_SUPPORT.target = null;
    Q_HELICOPTER_SUPPORT.from = null;
    Q_HELICOPTER_SUPPORT.to = null;
    Q_HELICOPTER_SUPPORT.pathPoints = null;
    Q_HELICOPTER_SUPPORT.routeDistance = 0;
    Q_HELICOPTER_SUPPORT.lastPathMoveTime = 0;
    Q_HELICOPTER_SUPPORT.lastTargetSeen = 0;
    Q_HELICOPTER_SUPPORT.lastEngageAnnounce = 0;
}

function getQHelicopterTarget(rangeType = 'sight', origin = getQHelicopterPadPosition()) {
    const config = getQHelicopterWeaponConfig();
    const maxRange = rangeType === 'attack'
        ? config.range
        : (config.sightRange !== undefined ? config.sightRange : config.range);
    let bestTarget = null;
    let bestDistance = Infinity;
    getQEnemies().forEach(enemy => {
        if (!enemy || enemy.isDead) return;
        const distance = getQHorizontalDistance(origin, enemy.mesh.position);
        if (distance <= maxRange && distance < bestDistance) {
            bestTarget = enemy;
            bestDistance = distance;
        }
    });
    return bestTarget;
}

function getQHelicopterCollisionEnemy() {
    const mesh = Q_HELICOPTER_SUPPORT.mesh;
    if (!mesh) return null;
    let bestEnemy = null;
    let bestDistance = Infinity;
    getQEnemies().forEach(enemy => {
        if (!enemy || enemy.isDead || enemy.isPortal || !enemy.mesh) return;
        const horizontal = getQHorizontalDistance(mesh.position, enemy.mesh.position);
        const vertical = Math.abs((mesh.position.y || 0) - (enemy.mesh.position.y || 0));
        const enemyScale = enemy.mesh && enemy.mesh.scale ? Math.max(enemy.mesh.scale.x || 1, enemy.mesh.scale.z || 1, 1) : 1;
        const enemyRadius = enemy.isBoss ? 2.1 * enemyScale : 0.58 * enemyScale;
        const collisionRadius = 0.68 + enemyRadius;
        if (horizontal <= collisionRadius && vertical <= (enemy.isBoss ? 3.2 : 2.05) && horizontal < bestDistance) {
            bestDistance = horizontal;
            bestEnemy = enemy;
        }
    });
    return bestEnemy;
}

function triggerQHelicopterDestroyed() {
    const mesh = Q_HELICOPTER_SUPPORT.mesh;
    if (!mesh) return;
    const position = mesh.position.clone();
    if (typeof createFriendlyUnitExplosionEffect === 'function') {
        createFriendlyUnitExplosionEffect(position, 2.6);
    } else if (typeof createExplosionEffect === 'function') {
        createExplosionEffect(position, 1.35);
    }
    if (typeof announceBattleEvent === 'function') {
        announceBattleEvent('q-heli-down', 'Q helicopter down', position, 900);
    }
    if (typeof playTone === 'function') {
        playTone(130, 'sawtooth', 0.18, 0.06);
    }
    resetQHelicopterSupport();
    if (typeof releaseCardPurchase === 'function') {
        releaseCardPurchase('Q');
    }
}

function checkQHelicopterCollision() {
    if (!Q_HELICOPTER_SUPPORT.active || !Q_HELICOPTER_SUPPORT.mesh) return false;
    if (getQHelicopterCollisionEnemy()) {
        triggerQHelicopterDestroyed();
        return true;
    }
    return false;
}

function faceQHelicopterTarget(target) {
    const mesh = Q_HELICOPTER_SUPPORT.mesh;
    if (!mesh || !target || !target.mesh) return;
    const dx = target.mesh.position.x - mesh.position.x;
    const dz = target.mesh.position.z - mesh.position.z;
    const config = getQHelicopterWeaponConfig();
    const targetYaw = Math.atan2(dx, dz);
    mesh.userData.aimYaw = targetYaw;
    mesh.rotation.y = targetYaw + (Number.isFinite(config.facingYawOffset) ? config.facingYawOffset : 0);
}

function updateQHelicopterFlight(time) {
    const mesh = Q_HELICOPTER_SUPPORT.mesh;
    if (!mesh) return;
    const config = getQHelicopterWeaponConfig();
    const mainRotor = mesh.userData.mainRotor;
    const tailRotor = mesh.userData.tailRotor;
    const rotorSpeed = Q_HELICOPTER_SUPPORT.state === 'docked' ? 0 : (config.rotorSpeed || 0.5);
    if (mainRotor) mainRotor.rotation.y += rotorSpeed;
    if (tailRotor) tailRotor.rotation.z += rotorSpeed * (config.tailRotorSpeedRatio || 1.6);

    if (Q_HELICOPTER_SUPPORT.pad) {
        Q_HELICOPTER_SUPPORT.pad.rotation.y += config.padSpinSpeed || 0.006;
    }

    mesh.rotation.z = Q_HELICOPTER_SUPPORT.state === 'docked' ? 0 : Math.sin(time * 0.004) * (config.bodyBankAmplitude || 0.025);
}

function getQHelicopterCombatPosition(target) {
    const pad = getQHelicopterHoverPosition();
    if (!target || !target.mesh) return pad.clone().add(new THREE.Vector3(0, 1.15, -1.3));
    const targetPath = target.pathPoints && target.pathPoints.length > 1 ? target.pathPoints : getQPrimaryPath();
    const totalDistance = getQPathTotalDistance(targetPath);
    const config = getQHelicopterWeaponConfig();
    const targetDistance = getQDistanceOnPath(targetPath, target.mesh.position);
    const moveRadius = Number.isFinite(config.moveRadius) ? config.moveRadius : Q_HELICOPTER_DEFAULTS.moveRadius;
    const outboundLimit = Math.max(0, totalDistance - moveRadius);
    const desiredDistance = Math.min(
        totalDistance,
        THREE.MathUtils.clamp(
            targetDistance + (config.range || 6) * 0.55,
            outboundLimit,
            totalDistance
        )
    );
    return getQPointAtDistance(targetPath, desiredDistance, pad.y + (config.combatAltitude || Q_HELICOPTER_DEFAULTS.combatAltitude));
}

function moveQHelicopterAlongPathTo(destination, targetPath, time) {
    const mesh = Q_HELICOPTER_SUPPORT.mesh;
    if (!mesh || !destination || !targetPath || targetPath.length < 2) return false;
    if (Q_HELICOPTER_SUPPORT.pathPoints !== targetPath || !Number.isFinite(Q_HELICOPTER_SUPPORT.routeDistance)) {
        Q_HELICOPTER_SUPPORT.pathPoints = targetPath;
        Q_HELICOPTER_SUPPORT.routeDistance = getQDistanceOnPath(targetPath, mesh.position);
    }
    const dt = Math.min(48, Math.max(12, time - (Q_HELICOPTER_SUPPORT.lastPathMoveTime || time - 16)));
    Q_HELICOPTER_SUPPORT.lastPathMoveTime = time;
    const desiredDistance = getQDistanceOnPath(targetPath, destination);
    const diff = desiredDistance - Q_HELICOPTER_SUPPORT.routeDistance;
    if (Math.abs(diff) <= 0.04) {
        Q_HELICOPTER_SUPPORT.routeDistance = desiredDistance;
        mesh.position.copy(getQPointAtDistance(targetPath, desiredDistance, destination.y));
        return true;
    }
    const previous = mesh.position.clone();
    const config = getQHelicopterWeaponConfig();
    const moveSpeed = Number.isFinite(config.moveSpeed) ? config.moveSpeed : Q_HELICOPTER_DEFAULTS.moveSpeed;
    const step = Math.min(Math.abs(diff), moveSpeed * (dt / 16.67));
    Q_HELICOPTER_SUPPORT.routeDistance += Math.sign(diff) * step;
    mesh.position.copy(getQPointAtDistance(targetPath, Q_HELICOPTER_SUPPORT.routeDistance, destination.y));
    const delta = mesh.position.clone().sub(previous).setY(0);
    if (delta.lengthSq() > 0.0001 && !Q_HELICOPTER_SUPPORT.target) {
        const config = getQHelicopterWeaponConfig();
        mesh.rotation.y = Math.atan2(delta.x, delta.z) + (Number.isFinite(config.facingYawOffset) ? config.facingYawOffset : 0);
    }
    return false;
}

function moveQHelicopterTo(state, destination, time) {
    Q_HELICOPTER_SUPPORT.state = state;
    Q_HELICOPTER_SUPPORT.moveStartTime = time;
    Q_HELICOPTER_SUPPORT.from = Q_HELICOPTER_SUPPORT.mesh.position.clone();
    Q_HELICOPTER_SUPPORT.to = destination.clone();
}

function updateQHelicopterMotion(time, durationMs) {
    const mesh = Q_HELICOPTER_SUPPORT.mesh;
    const from = Q_HELICOPTER_SUPPORT.from;
    const to = Q_HELICOPTER_SUPPORT.to;
    if (!mesh || !from || !to) return true;
    const t = Math.min(1, (time - Q_HELICOPTER_SUPPORT.moveStartTime) / durationMs);
    mesh.position.lerpVectors(from, to, easeInOutCubicQHeli(t));
    return t >= 1;
}

function createQHelicopterShotMesh(startPos, direction, config) {
    const group = new THREE.Group();
    const segmentLength = config.projectileLength || 1.35;
    const core = new THREE.Mesh(
        new THREE.CylinderGeometry(config.projectileCoreRadius || 0.08, config.projectileCoreRadius || 0.08, segmentLength, 10),
        new THREE.MeshBasicMaterial({ color: 0xc9fbff, transparent: true, opacity: 0.98 })
    );
    const glow = new THREE.Mesh(
        new THREE.CylinderGeometry(config.projectileGlowRadius || 0.2, config.projectileGlowRadius || 0.2, segmentLength * 1.08, 10),
        new THREE.MeshBasicMaterial({ color: 0x78e7ff, transparent: true, opacity: 0.44 })
    );
    core.rotation.x = Math.PI / 2;
    glow.rotation.x = Math.PI / 2;
    core.position.z = segmentLength / 2;
    glow.position.z = segmentLength / 2;
    group.add(glow, core);
    group.position.copy(startPos);
    group.lookAt(startPos.clone().add(direction));
    return group;
}

function fireQHelicopterBullet(w, target, config) {
    const gameScene = getQScene();
    const bulletList = getQBullets();
    if (!gameScene || !bulletList || !target || !target.mesh) return;

    const yaw = Number.isFinite(w.mesh.userData.aimYaw) ? w.mesh.userData.aimYaw : w.mesh.rotation.y;
    const shotIndex = w.railShotIndex || 0;
    const side = shotIndex % 2 === 0 ? -1 : 1;
    w.railShotIndex = shotIndex + 1;
    const right = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw));
    const forward = new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw));
    const startPos = w.mesh.position.clone()
        .add(new THREE.Vector3(0, 0.95, 0))
        .add(right.multiplyScalar(side * 0.22))
        .add(forward.multiplyScalar(1.25));
    const targetPos = target.mesh.position.clone().add(new THREE.Vector3(0, 0.55, 0));
    const direction = new THREE.Vector3().subVectors(targetPos, startPos).normalize();
    const damageRoll = typeof getWeaponDamageRoll === 'function'
        ? getWeaponDamageRoll(w, config.damage)
        : { damage: config.damage, isCrit: false };
    const shot = createQHelicopterShotMesh(startPos, direction, config);
    if (damageRoll.isCrit) {
        shot.children.forEach(child => {
            if (child.material && child.material.color) child.material.color.setHex(0xffffff);
            if (child.material) child.material.opacity = Math.min(1, (child.material.opacity || 0.8) + 0.18);
        });
    }
    gameScene.add(shot);
    bulletList.push({
        mesh: shot,
        direction,
        speed: config.projectileSpeed,
        speedDecay: config.projectileSpeedDecay,
        minSpeed: config.projectileMinSpeed,
        damage: damageRoll.damage,
        isCrit: damageRoll.isCrit,
        ownerWeapon: w,
        isTesla: false,
        isRailProjectile: true,
        life: config.projectileLife
    });
    if (typeof playTone === 'function') {
        playTone(damageRoll.isCrit ? 820 : 660, 'square', 0.12, damageRoll.isCrit ? 0.055 : 0.04);
    }
}

function fireQHelicopterRailBurst(time, target) {
    const w = Q_HELICOPTER_SUPPORT.weapon;
    if (!w || !target) return;
    const config = getQHelicopterWeaponConfig();
    w.basePosition = w.mesh.position.clone();
    const activeFireInterval = typeof getAdjustedWeaponFireInterval === 'function'
        ? getAdjustedWeaponFireInterval(w)
        : w.fireInterval;

    if (w.burstCount < w.burstTotal) {
        const burstInterval = activeFireInterval / w.burstTotal;
        if (time - w.lastFire > burstInterval) {
            w.lastFire = time;
            w.burstCount++;
            faceQHelicopterTarget(target);
            fireQHelicopterBullet(w, target, config);
        }
    } else if (time - w.lastFire > activeFireInterval) {
        w.burstCount = 0;
    }
}

function updateQHelicopterSupport(time) {
    if (!Q_HELICOPTER_SUPPORT.active || !Q_HELICOPTER_SUPPORT.mesh) return;
    if (typeof isAttackMode === 'function' && isAttackMode()) {
        resetQHelicopterSupport();
        return;
    }

    updateQHelicopterFlight(time);

    if (getQHelicopterCollisionEnemy()) {
        triggerQHelicopterDestroyed();
        return;
    }

    if (Q_HELICOPTER_SUPPORT.state === 'entering') {
        const config = getQHelicopterWeaponConfig();
        Q_HELICOPTER_SUPPORT.moveStartTime = Q_HELICOPTER_SUPPORT.enterStartTime;
        if (updateQHelicopterMotion(time, config.enterDurationMs || Q_HELICOPTER_DEFAULTS.enterDurationMs)) {
            Q_HELICOPTER_SUPPORT.state = 'docked';
            Q_HELICOPTER_SUPPORT.mesh.position.copy(getQHelicopterHoverPosition());
        }
        return;
    }

    const sightTarget = getQHelicopterTarget('sight', getQHelicopterPadPosition());
    const attackTarget = getQHelicopterTarget('attack', Q_HELICOPTER_SUPPORT.mesh.position);
    if (sightTarget) {
        Q_HELICOPTER_SUPPORT.target = sightTarget;
        Q_HELICOPTER_SUPPORT.lastTargetSeen = time;
    }

    if (Q_HELICOPTER_SUPPORT.state === 'docked') {
        if (sightTarget) {
            faceQHelicopterTarget(sightTarget);
            moveQHelicopterTo('takingOff', getQHelicopterCombatPosition(sightTarget), time);
            if (typeof announceBattleEvent === 'function' && time - Q_HELICOPTER_SUPPORT.lastEngageAnnounce > 2500) {
                Q_HELICOPTER_SUPPORT.lastEngageAnnounce = time;
                announceBattleEvent('q-heli-launch', 'Q helicopter engaging', Q_HELICOPTER_SUPPORT.mesh.position, 600);
            }
        }
        return;
    }

    if (Q_HELICOPTER_SUPPORT.state === 'takingOff') {
        const config = getQHelicopterWeaponConfig();
        if (updateQHelicopterMotion(time, config.takeoffDurationMs || Q_HELICOPTER_DEFAULTS.takeoffDurationMs)) {
            Q_HELICOPTER_SUPPORT.state = 'attacking';
        }
    }

    if (Q_HELICOPTER_SUPPORT.state === 'attacking') {
        if (sightTarget) {
            const desired = getQHelicopterCombatPosition(sightTarget);
            const targetPath = sightTarget.pathPoints && sightTarget.pathPoints.length > 1 ? sightTarget.pathPoints : getQPrimaryPath();
            moveQHelicopterAlongPathTo(desired, targetPath, time);
            faceQHelicopterTarget(sightTarget);
            const distanceToTarget = getQHorizontalDistance(Q_HELICOPTER_SUPPORT.mesh.position, sightTarget.mesh.position);
            const config = getQHelicopterWeaponConfig();
            if (attackTarget || distanceToTarget <= config.range) {
                fireQHelicopterRailBurst(time, attackTarget || sightTarget);
            }
        } else {
            const config = getQHelicopterWeaponConfig();
            if (time - Q_HELICOPTER_SUPPORT.lastTargetSeen > (config.lostTargetReturnDelayMs || Q_HELICOPTER_DEFAULTS.lostTargetReturnDelayMs)) {
                moveQHelicopterTo('returning', getQHelicopterHoverPosition(), time);
            }
        }
        return;
    }

    if (Q_HELICOPTER_SUPPORT.state === 'returning' && updateQHelicopterMotion(time, (getQHelicopterWeaponConfig().returnDurationMs || Q_HELICOPTER_DEFAULTS.returnDurationMs))) {
        Q_HELICOPTER_SUPPORT.state = 'docked';
        Q_HELICOPTER_SUPPORT.weapon.burstCount = 0;
    }
}

window.activateQHelicopterSupport = activateQHelicopterSupport;
window.resetQHelicopterSupport = resetQHelicopterSupport;
window.updateQHelicopterSupport = updateQHelicopterSupport;
window.checkQHelicopterCollision = checkQHelicopterCollision;
