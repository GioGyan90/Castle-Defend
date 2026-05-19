// J card rocket squad support. Spawns three friendly rocket robots near the base.
const J_ROCKET_SQUAD = {
    active: false,
    units: [],
    damageStat: null
};

const J_ROCKET_SQUAD_CONFIG = {
    sightRange: 6,
    range: 4.7,
    moveRadius: 6,
    moveSpeed: 0.03,
    fireIntervalMs: 1200,
    damage: 3,
    count: 3,
    formation: [
        { pathOffset: 0, lateralOffset: 0 },
        { pathOffset: 0.72, lateralOffset: -0.58 },
        { pathOffset: 0.72, lateralOffset: 0.58 }
    ]
};

function getJRocketRuntime() {
    return window.CASTLE_DEFEND_RUNTIME || {};
}

function getJRocketScene() {
    const runtime = getJRocketRuntime();
    if (runtime.scene) return runtime.scene;
    try { return scene; } catch (error) { return null; }
}

function getJRocketCastle() {
    const runtime = getJRocketRuntime();
    if (runtime.castle) return runtime.castle;
    try { return castle; } catch (error) { return null; }
}

function getJRocketEnemies() {
    const runtime = getJRocketRuntime();
    if (runtime.enemies) return runtime.enemies;
    try { return enemies; } catch (error) { return []; }
}

function getJRocketDamageStats() {
    const runtime = getJRocketRuntime();
    if (runtime.weaponDamageStats) return runtime.weaponDamageStats;
    try { return weaponDamageStats; } catch (error) { return null; }
}

function getJRocketWeaponConfig() {
    const configured = typeof getWeaponConfig === 'function' ? getWeaponConfig('J_ROCKET_SQUAD') : null;
    return Object.assign({}, J_ROCKET_SQUAD_CONFIG, configured || {});
}

function getJRocketPrimaryPath() {
    const runtime = getJRocketRuntime();
    if (runtime.pathPoints && runtime.pathPoints.length > 1) return runtime.pathPoints;
    try { return pathPoints; } catch (error) { return []; }
}

function getJRocketEliteDroneSpeed() {
    const configured = getJRocketWeaponConfig();
    if (Number.isFinite(configured.moveSpeed)) return configured.moveSpeed;
    const cfg = typeof getEnemyConfigByModelType === 'function'
        ? getEnemyConfigByModelType(typeof currentLevel !== 'undefined' ? currentLevel : 1, 'eliteDrone')
        : null;
    if (cfg) {
        if (Number.isFinite(cfg.speed)) return cfg.speed;
        if (Number.isFinite(cfg.speedMax)) return cfg.speedMax;
        if (Number.isFinite(cfg.speedMin)) return cfg.speedMin;
    }
    return 0.03;
}

function createJRocketDamageStat() {
    const stats = getJRocketDamageStats();
    if (!stats) return null;
    let stat = stats.find(item => item && item.id === 'j-rocket-squad');
    if (!stat) {
        stat = {
            id: 'j-rocket-squad',
            type: 1,
            label: 'J Rocket Squad',
            totalDamage: 0
        };
        stats.push(stat);
    }
    return stat;
}

function getJRocketBasePosition() {
    const base = getJRocketCastle();
    const basePos = base ? base.position : new THREE.Vector3(0, 0, 0);
    return basePos.clone();
}

function getJRocketPathTotalDistance(points) {
    let total = 0;
    for (let i = 0; i < points.length - 1; i++) {
        total += points[i].distanceTo(points[i + 1]);
    }
    return total;
}

function getJRocketPointAtDistance(points, distance, y = 0.16) {
    if (!points || !points.length) return getJRocketBasePosition().setY(y);
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

function getJRocketPathFrameAtDistance(points, distance, y = 0.16, lateralOffset = 0) {
    if (!points || !points.length) {
        return { position: getJRocketBasePosition().setY(y), direction: new THREE.Vector3(0, 0, 1) };
    }
    if (points.length === 1) {
        return { position: points[0].clone().setY(y), direction: new THREE.Vector3(0, 0, 1) };
    }
    let remaining = Math.max(0, distance);
    for (let i = 0; i < points.length - 1; i++) {
        const a = points[i];
        const b = points[i + 1];
        const segment = b.clone().sub(a).setY(0);
        const segmentLength = segment.length();
        const direction = segmentLength > 0 ? segment.multiplyScalar(1 / segmentLength) : new THREE.Vector3(0, 0, 1);
        if (remaining <= segmentLength) {
            const t = segmentLength > 0 ? remaining / segmentLength : 0;
            const position = new THREE.Vector3().lerpVectors(a, b, t).setY(y);
            const lateral = new THREE.Vector3(-direction.z, 0, direction.x).multiplyScalar(lateralOffset);
            return { position: position.add(lateral), direction };
        }
        remaining -= segmentLength;
    }
    const last = points.length - 1;
    const direction = points[last].clone().sub(points[last - 1]).setY(0).normalize();
    const lateral = new THREE.Vector3(-direction.z, 0, direction.x).multiplyScalar(lateralOffset);
    return { position: points[last].clone().setY(y).add(lateral), direction };
}

function getJRocketDistanceOnPath(points, point) {
    if (!points || points.length < 2 || !point) return 0;
    let bestDistance = 0;
    let bestDistanceSq = Infinity;
    let walked = 0;
    const point2 = point.clone();
    point2.y = 0;
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

function getJRocketFormationDistance(index, points = getJRocketPrimaryPath()) {
    const formation = getJRocketFormationSlot(index);
    const total = getJRocketPathTotalDistance(points);
    return Math.max(0, total - (0.45 + (formation.pathOffset || 0)));
}

function getJRocketFormationPosition(index, points = getJRocketPrimaryPath()) {
    const formation = getJRocketFormationSlot(index);
    return getJRocketPathFrameAtDistance(points, getJRocketFormationDistance(index, points), 0.16, formation.lateralOffset || 0).position;
}

function getJRocketSpawnPosition(index) {
    const points = getJRocketPrimaryPath();
    const formation = getJRocketFormationSlot(index);
    return getJRocketPathFrameAtDistance(points, getJRocketPathTotalDistance(points) - 0.15, 0.16, (formation.lateralOffset || 0) * 0.35).position;
}

function getJRocketFormationSlot(index) {
    const formation = getJRocketWeaponConfig().formation || J_ROCKET_SQUAD_CONFIG.formation;
    return formation[index] || formation[0] || { pathOffset: 0, lateralOffset: 0 };
}

function easeInOutJRocket(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function getJRocketTargetFromPosition(origin, range) {
    let bestTarget = null;
    let bestDistance = Infinity;
    getJRocketEnemies().forEach(enemy => {
        if (!enemy || enemy.isDead) return;
        const distance = origin.distanceTo(enemy.mesh.position);
        if (distance <= range && distance < bestDistance) {
            bestTarget = enemy;
            bestDistance = distance;
        }
    });
    return bestTarget;
}

function getJRocketTarget(unit, range) {
    return getJRocketTargetFromPosition(unit.mesh.position, range);
}

function getJRocketHorizontalDistance(a, b) {
    if (!a || !b) return Infinity;
    const dx = a.x - b.x;
    const dz = a.z - b.z;
    return Math.sqrt(dx * dx + dz * dz);
}

function getJRocketCollisionEnemy(unit) {
    if (!unit || !unit.mesh) return null;
    let bestEnemy = null;
    let bestDistance = Infinity;
    getJRocketEnemies().forEach(enemy => {
        if (!enemy || enemy.isDead || enemy.isPortal || !enemy.mesh) return;
        const distance = getJRocketHorizontalDistance(unit.mesh.position, enemy.mesh.position);
        const enemyScale = enemy.mesh && enemy.mesh.scale ? Math.max(enemy.mesh.scale.x || 1, enemy.mesh.scale.z || 1, 1) : 1;
        const enemyRadius = enemy.isBoss ? 1.95 * enemyScale : 0.52 * enemyScale;
        const collisionRadius = 0.54 + enemyRadius;
        if (distance <= collisionRadius && distance < bestDistance) {
            bestDistance = distance;
            bestEnemy = enemy;
        }
    });
    return bestEnemy;
}

function triggerJRocketSquadDestroyed(unit) {
    if (!unit || !unit.mesh) return;
    const position = unit.mesh.position.clone().add(new THREE.Vector3(0, 0.45, 0));
    if (typeof createFriendlyUnitExplosionEffect === 'function') {
        createFriendlyUnitExplosionEffect(position, 2.1);
    } else if (typeof createExplosionEffect === 'function') {
        createExplosionEffect(position, 1.15);
    }
    if (typeof announceBattleEvent === 'function') {
        announceBattleEvent('j-rocket-down', 'J squad down', position, 850);
    }
    if (typeof playTone === 'function') {
        playTone(110, 'sawtooth', 0.16, 0.055);
    }
    resetJRocketSquadSupport();
    if (typeof releaseCardPurchase === 'function') {
        releaseCardPurchase('J');
    }
}

function checkJRocketSquadCollision() {
    if (!J_ROCKET_SQUAD.active) return false;
    for (let i = 0; i < J_ROCKET_SQUAD.units.length; i++) {
        const unit = J_ROCKET_SQUAD.units[i];
        if (unit && unit.mesh && getJRocketCollisionEnemy(unit)) {
            triggerJRocketSquadDestroyed(unit);
            return true;
        }
    }
    return false;
}

function getJRocketSquadTarget(range) {
    let bestTarget = null;
    let bestDistance = Infinity;
    J_ROCKET_SQUAD.units.forEach(unit => {
        if (!unit || !unit.mesh) return;
        getJRocketEnemies().forEach(enemy => {
            if (!enemy || enemy.isDead) return;
            const distance = unit.mesh.position.distanceTo(enemy.mesh.position);
            if (distance <= range && distance < bestDistance) {
                bestTarget = enemy;
                bestDistance = distance;
            }
        });
    });
    return bestTarget;
}

function getJRocketCombatPosition(unit, target, index) {
    if (!target || !target.mesh) return unit.homePosition.clone();
    const config = getJRocketWeaponConfig();
    const formation = getJRocketFormationSlot(index);
    const targetPath = target.pathPoints && target.pathPoints.length > 1 ? target.pathPoints : getJRocketPrimaryPath();
    const pathChanged = unit.pathPoints !== targetPath;
    unit.pathPoints = targetPath;
    unit.pathTotalDistance = getJRocketPathTotalDistance(targetPath);
    unit.homeDistance = getJRocketFormationDistance(index, targetPath);
    unit.homePosition = getJRocketPointAtDistance(targetPath, unit.homeDistance, 0.16);
    if (!Number.isFinite(unit.routeDistance) || pathChanged) {
        unit.routeDistance = getJRocketDistanceOnPath(targetPath, unit.mesh.position);
    }
    const targetDistance = getJRocketDistanceOnPath(targetPath, target.mesh.position);
    const outboundLimit = Math.max(0, unit.pathTotalDistance - config.moveRadius);
    const desiredDistance = THREE.MathUtils.clamp(
        targetDistance + config.range * 0.55,
        outboundLimit,
        unit.homeDistance
    );
    const formationDistance = THREE.MathUtils.clamp(
        desiredDistance + (formation.pathOffset || 0),
        outboundLimit,
        unit.pathTotalDistance
    );
    return getJRocketPathFrameAtDistance(targetPath, formationDistance, 0.16, formation.lateralOffset || 0).position;
}

function moveJRocketUnitToward(unit, destination, time) {
    if (!unit || !unit.mesh || !destination) return false;
    const route = unit.pathPoints && unit.pathPoints.length > 1 ? unit.pathPoints : getJRocketPrimaryPath();
    if (route && route.length > 1) {
        if (!Number.isFinite(unit.routeDistance)) {
            unit.routeDistance = getJRocketDistanceOnPath(route, unit.mesh.position);
        }
        const dt = Math.min(48, Math.max(12, time - (unit.lastMoveTime || time - 16)));
        unit.lastMoveTime = time;
        const desiredDistance = getJRocketDistanceOnPath(route, destination);
        const diff = desiredDistance - unit.routeDistance;
        if (Math.abs(diff) <= 0.035) {
            unit.routeDistance = desiredDistance;
            const lateralOffset = unit.formation ? unit.formation.lateralOffset || 0 : 0;
            unit.mesh.position.copy(getJRocketPathFrameAtDistance(route, unit.routeDistance, destination.y, lateralOffset).position);
            unit.mesh.userData.baseY = destination.y;
            unit.mesh.userData.walkAmount = 0;
            unit.basePosition.copy(unit.mesh.position);
            return true;
        }
        const step = Math.min(Math.abs(diff), unit.moveSpeed * (dt / 16.67));
        const previous = unit.mesh.position.clone();
        unit.routeDistance += Math.sign(diff) * step;
        const lateralOffset = unit.formation ? unit.formation.lateralOffset || 0 : 0;
        unit.mesh.position.copy(getJRocketPathFrameAtDistance(route, unit.routeDistance, destination.y, lateralOffset).position);
        unit.mesh.userData.baseY = destination.y;
        const delta = unit.mesh.position.clone().sub(previous).setY(0);
        if (delta.lengthSq() > 0.0001) unit.mesh.rotation.y = Math.atan2(delta.x, delta.z);
        unit.mesh.userData.walkAmount = Math.min(1, Math.abs(diff) / 1.2);
        unit.basePosition.copy(unit.mesh.position);
        return false;
    }

    const dt = Math.min(48, Math.max(12, time - (unit.lastMoveTime || time - 16)));
    unit.lastMoveTime = time;
    const delta = destination.clone().sub(unit.mesh.position);
    delta.y = 0;
    const distance = delta.length();
    if (distance <= 0.035) {
        unit.mesh.position.x = destination.x;
        unit.mesh.position.z = destination.z;
        unit.mesh.userData.baseY = destination.y;
        unit.mesh.userData.walkAmount = 0;
        return true;
    }
    const step = Math.min(distance, unit.moveSpeed * (dt / 16.67));
    delta.normalize();
    unit.mesh.position.add(delta.multiplyScalar(step));
    unit.mesh.position.y = destination.y;
    unit.mesh.userData.baseY = destination.y;
    unit.mesh.rotation.y = Math.atan2(delta.x, delta.z);
    unit.mesh.userData.walkAmount = Math.min(1, distance / 1.2);
    unit.basePosition.copy(unit.mesh.position);
    return false;
}

function aimJRocketUnitAtTarget(unit, target) {
    if (!unit || !unit.mesh || !target || !target.mesh) return;
    const dx = target.mesh.position.x - unit.mesh.position.x;
    const dz = target.mesh.position.z - unit.mesh.position.z;
    const worldYaw = Math.atan2(dx, dz);
    const localYaw = worldYaw - unit.mesh.rotation.y;
    if (typeof setRocketRobotAimYaw === 'function' && setRocketRobotAimYaw(unit.mesh, localYaw, performance.now())) {
        return;
    }
    const aimGroup = unit.mesh.userData.turretGroup || unit.mesh.userData.barrelGroup;
    if (!aimGroup) return;
    aimGroup.rotation.y = localYaw;
}

function createJRocketUnit(index, now) {
    const config = getJRocketWeaponConfig();
    const formation = getJRocketFormationSlot(index);
    const route = getJRocketPrimaryPath();
    const homeDistance = getJRocketFormationDistance(index, route);
    const homePosition = getJRocketFormationPosition(index, route);
    const spawnPosition = getJRocketSpawnPosition(index);
    const mesh = typeof createRocketRobotModel === 'function'
        ? createRocketRobotModel(THREE)
        : createRobotEnemy(false);
    mesh.position.copy(spawnPosition);
    mesh.userData.baseY = mesh.position.y;
    mesh.rotation.y = Math.PI;
    const weaponConfig = getWeaponConfig(1);
    const unit = {
        mesh,
        type: 1,
        damageStat: J_ROCKET_SQUAD.damageStat,
        pathPoints: route,
        pathTotalDistance: getJRocketPathTotalDistance(route),
        formation,
        homeDistance,
        routeDistance: getJRocketDistanceOnPath(route, spawnPosition),
        basePosition: homePosition.clone(),
        homePosition,
        from: mesh.position.clone(),
        to: homePosition.clone(),
        enterStartTime: now,
        lastMoveTime: now,
        lastTargetSeen: 0,
        lastFire: now - index * 240,
        fireInterval: config.fireIntervalMs || weaponConfig.fireIntervalMs,
        moveSpeed: Number.isFinite(config.moveSpeed) ? config.moveSpeed : getJRocketEliteDroneSpeed(),
        burstCount: 0,
        burstTotal: 1,
        state: 'entering',
        aimAtTarget: null
    };
    unit.aimAtTarget = target => aimJRocketUnitAtTarget(unit, target);
    return unit;
}

function activateJRocketSquadSupport() {
    if (typeof isAttackMode === 'function' && isAttackMode()) return;
    if (J_ROCKET_SQUAD.active) return;
    const gameScene = getJRocketScene();
    if (!gameScene || typeof THREE === 'undefined') return;

    const now = performance.now();
    J_ROCKET_SQUAD.active = true;
    J_ROCKET_SQUAD.damageStat = createJRocketDamageStat();
    J_ROCKET_SQUAD.units = [];

    const config = getJRocketWeaponConfig();
    for (let i = 0; i < config.count; i++) {
        const unit = createJRocketUnit(i, now);
        gameScene.add(unit.mesh);
        J_ROCKET_SQUAD.units.push(unit);
    }

    if (typeof announceHighlight === 'function') {
        announceHighlight('j-rocket-squad', 'J Rocket Squad deployed');
    }
    if (typeof playTone === 'function') {
        playTone(470, 'triangle', 0.16, 0.045);
        setTimeout(() => playTone(560, 'triangle', 0.14, 0.04), 100);
    }
}

function resetJRocketSquadSupport() {
    const gameScene = getJRocketScene();
    if (gameScene) {
        J_ROCKET_SQUAD.units.forEach(unit => {
            if (unit && unit.mesh) gameScene.remove(unit.mesh);
        });
    }
    J_ROCKET_SQUAD.active = false;
    J_ROCKET_SQUAD.units = [];
    J_ROCKET_SQUAD.damageStat = null;
}

function updateJRocketUnitEnter(unit, time) {
    const t = Math.min(1, (time - unit.enterStartTime) / 700);
    const eased = easeInOutJRocket(t);
    unit.mesh.position.lerpVectors(unit.from, unit.to, eased);
    unit.routeDistance = getJRocketDistanceOnPath(unit.pathPoints, unit.mesh.position);
    unit.mesh.userData.baseY = unit.mesh.position.y;
    unit.basePosition.copy(unit.to);
    if (t >= 1) {
        unit.state = 'guarding';
        unit.mesh.userData.walkAmount = 0;
    }
}

function updateJRocketSquadSupport(time) {
    if (!J_ROCKET_SQUAD.active) return;
    if (typeof isAttackMode === 'function' && isAttackMode()) {
        resetJRocketSquadSupport();
        return;
    }

    const config = getJRocketWeaponConfig();
    const squadTarget = getJRocketSquadTarget(config.sightRange);

    J_ROCKET_SQUAD.units.forEach((unit, index) => {
        if (!J_ROCKET_SQUAD.active) return;
        if (!unit || !unit.mesh) return;
        if (unit.state === 'entering') {
            updateJRocketUnitEnter(unit, time);
        }

        if (typeof animateRocketRobotModel === 'function') {
            animateRocketRobotModel(unit.mesh, time + index * 140, 0.7);
        }

        const sightTarget = squadTarget || getJRocketTarget(unit, config.sightRange);
        if (sightTarget) {
            aimJRocketUnitAtTarget(unit, sightTarget);
            unit.lastTargetSeen = time;
        }

        if (getJRocketCollisionEnemy(unit)) {
            triggerJRocketSquadDestroyed(unit);
            return;
        }

        if (unit.state === 'guarding' && sightTarget) {
            unit.state = 'engaging';
        }

        if (unit.state === 'engaging') {
            if (sightTarget) {
                moveJRocketUnitToward(unit, getJRocketCombatPosition(unit, sightTarget, index), time);
            } else if (time - unit.lastTargetSeen > 900) {
                unit.state = 'returning';
            }
        } else if (unit.state === 'returning') {
            if (moveJRocketUnitToward(unit, unit.homePosition, time)) {
                unit.state = 'guarding';
                unit.mesh.rotation.y = Math.PI;
            }
        } else if (unit.state === 'guarding') {
            unit.mesh.userData.walkAmount = 0;
        }

        if (unit.state === 'entering') return;
        const attackTarget = getJRocketTarget(unit, config.range);
        const fireInterval = typeof getAdjustedWeaponFireInterval === 'function'
            ? getAdjustedWeaponFireInterval(unit)
            : unit.fireInterval;
        if (attackTarget && time - unit.lastFire > fireInterval && typeof fireBullet === 'function') {
            unit.lastFire = time;
            fireBullet(unit, attackTarget, config.damage);
        }
    });
}

window.activateJRocketSquadSupport = activateJRocketSquadSupport;
window.resetJRocketSquadSupport = resetJRocketSquadSupport;
window.updateJRocketSquadSupport = updateJRocketSquadSupport;
window.checkJRocketSquadCollision = checkJRocketSquadCollision;
