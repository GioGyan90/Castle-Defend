// Enemy AI - Path following and steering behavior
// Handles automatic position adjustment, turning, and navigation to player base

// AI Configuration
const ENEMY_AI_CONFIG = {
    // Steering behaviors
    maxSteeringForce: 0.15,      // Maximum force for direction changes
    maxSpeed: 1.0,               // Base maximum speed multiplier
    arrivalRadius: 1.5,          // Distance to start slowing down at waypoints
    waypointReachDistance: 0.8,  // Distance to consider waypoint reached
    
    // Obstacle avoidance
    avoidanceRadius: 0.6,        // Personal space radius
    avoidanceStrength: 0.08,     // How strongly to avoid other enemies
    
    // Path correction
    pathCorrectionStrength: 0.04, // How strongly to return to path center
    lateralCorrectionMax: 0.3,    // Maximum lateral correction per frame
    
    // Walking animation sync
    walkSyncFactor: 0.12         // How much movement affects walk animation
};

function isFlyingPathUnit(enemy) {
    return !!(enemy && (enemy.isDrone || enemy.isFlyingBoss || (enemy.mesh && enemy.mesh.userData.hoverArmor)));
}

function usesDirectPathMovement(enemy) {
    if (enemy && enemy.isPortal) return false;
    return !!(enemy && (enemy.isBoss || isFlyingPathUnit(enemy)));
}

function getEnemyPath(enemy) {
    if (enemy && enemy.pathPoints && enemy.pathPoints.length > 1) {
        return enemy.pathPoints;
    }
    if (typeof pathPoints !== 'undefined' && pathPoints && pathPoints.length > 1) {
        return pathPoints;
    }
    return null;
}

function getHorizontalDistance(a, b) {
    const dx = a.x - b.x;
    const dz = a.z - b.z;
    return Math.sqrt(dx * dx + dz * dz);
}

function getHorizontalDirection(from, to) {
    const direction = new THREE.Vector3(to.x - from.x, 0, to.z - from.z);
    const distance = direction.length();
    if (distance > 0.001) {
        direction.divideScalar(distance);
    }
    return { direction, distance };
}

// Calculate steering force to reach a target position
function calculateSeekSteering(currentPos, currentVelocity, targetPos, maxSpeed) {
    const desired = new THREE.Vector3().subVectors(targetPos, currentPos);
    const distance = desired.length();
    
    if (distance < 0.01) {
        return new THREE.Vector3(0, 0, 0);
    }
    
    desired.normalize();
    
    // Slow down when approaching target
    if (distance < ENEMY_AI_CONFIG.arrivalRadius) {
        const speedRatio = distance / ENEMY_AI_CONFIG.arrivalRadius;
        desired.multiplyScalar(maxSpeed * speedRatio);
    } else {
        desired.multiplyScalar(maxSpeed);
    }
    
    const steering = new THREE.Vector3().subVectors(desired, currentVelocity);
    steering.limitLength(ENEMY_AI_CONFIG.maxSteeringForce);
    
    return steering;
}

// Calculate steering force to avoid other enemies
function calculateAvoidanceSteering(enemy, allEnemies, ownRadius) {
    const avoidance = new THREE.Vector3(0, 0, 0);
    const avoidanceRange = ownRadius * 3;
    
    for (let other of allEnemies) {
        if (other === enemy || other.isDead) continue;
        
        const diff = new THREE.Vector3().subVectors(enemy.mesh.position, other.mesh.position);
        const distance = diff.length();
        
        if (distance > 0 && distance < avoidanceRange) {
            diff.normalize();
            const strength = (avoidanceRange - distance) / avoidanceRange;
            avoidance.add(diff.multiplyScalar(strength * ENEMY_AI_CONFIG.avoidanceStrength));
        }
    }
    
    return avoidance;
}

// Calculate steering force to stay on path
function calculatePathFollowingSteering(enemy, pathPoints, lookaheadDistance) {
    if (!pathPoints || pathPoints.length < 2) {
        return new THREE.Vector3(0, 0, 0);
    }
    
    const currentPos = enemy.mesh.position;
    const currentWaypointIdx = enemy.pathIdx;
    
    // Find the closest point on the path segment ahead
    let targetPoint = null;
    let minDistance = Infinity;
    
    // Look ahead to find the furthest reachable waypoint
    for (let i = currentWaypointIdx + 1; i < Math.min(currentWaypointIdx + 5, pathPoints.length); i++) {
        const waypoint = pathPoints[i];
        const dist = getHorizontalDistance(currentPos, waypoint);
        
        if (dist < lookaheadDistance && dist < minDistance) {
            minDistance = dist;
            targetPoint = waypoint;
        }
    }
    
    // If no waypoint found, use the next immediate one
    if (!targetPoint && currentWaypointIdx + 1 < pathPoints.length) {
        targetPoint = pathPoints[currentWaypointIdx + 1];
    }
    
    if (!targetPoint) {
        return new THREE.Vector3(0, 0, 0);
    }
    
    // Calculate steering towards the target point
    return calculateSeekSteering(currentPos, new THREE.Vector3(0, 0, 0), targetPoint, ENEMY_AI_CONFIG.maxSpeed);
}

// Apply walking AI adjustments to enemy position
function applyWalkingAI(enemy, allEnemies, deltaTime) {
    if (!enemy.mesh || enemy.isDead || enemy.isStalledAtZero) {
        return;
    }

    if (isFlyingPathUnit(enemy)) {
        return;
    }
    
    const mesh = enemy.mesh;
    const pathPoints = getEnemyPath(enemy);
    const currentWaypointIdx = enemy.pathIdx;
    
    // Skip if at final waypoint
    if (!pathPoints || currentWaypointIdx >= pathPoints.length - 1) {
        return;
    }
    
    const currentPos = mesh.position.clone();
    const currentY = currentPos.y;
    
    // Ensure proper ground height for walking enemies (road surface is at y=0.01)
    const targetGroundHeight = 0.15; // Slightly above road surface for feet placement
    
    // For non-flying enemies, maintain proper height
    if (!enemy.isDrone && !enemy.isFlyingBoss && !mesh.userData.hoverArmor) {
        // Smoothly adjust Y position to correct height
        const heightDiff = targetGroundHeight - currentPos.y;
        if (Math.abs(heightDiff) > 0.01) {
            mesh.position.y += heightDiff * 0.1;
        }
    }
    
    // Get the next waypoint target
    const targetWaypoint = pathPoints[currentWaypointIdx + 1];
    
    // Calculate direction to target
    const targetOnPlane = targetWaypoint.clone();
    targetOnPlane.y = currentPos.y;
    const directionToTarget = new THREE.Vector3().subVectors(targetOnPlane, currentPos);
    const distanceToTarget = directionToTarget.length();
    
    // Face the movement direction
    if (distanceToTarget > 0.1) {
        directionToTarget.normalize();
        const targetAngle = Math.atan2(directionToTarget.x, directionToTarget.z);
        
        // Smooth rotation towards target direction
        let currentRotationY = mesh.rotation.y;
        let angleDiff = targetAngle - currentRotationY;
        
        // Normalize angle to [-PI, PI]
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        
        // Smooth turn
        const turnSpeed = 0.15;
        mesh.rotation.y += angleDiff * turnSpeed;
    }
    
    // Move forward along the facing direction
    const moveSpeed = enemy.speed * 0.8; // Base movement speed
    const forwardDir = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), mesh.rotation.y);
    
    // Apply movement to physics body or directly to position
    if (mesh.userData.physicsBody) {
        const body = mesh.userData.physicsBody;
        
        // Set forward velocity based on facing direction
        body.velocity.x = forwardDir.x * moveSpeed * 40;
        body.velocity.z = forwardDir.z * moveSpeed * 40;
        
        // Keep Y velocity zero for ground units
        if (!enemy.isDrone && !enemy.isFlyingBoss && !mesh.userData.hoverArmor) {
            body.velocity.y = 0;
        }
    } else {
        // Direct position adjustment for non-physics enemies
        const movement = forwardDir.multiplyScalar(moveSpeed);
        mesh.position.add(movement);
    }
    
    // Apply lateral avoidance force to prevent stacking
    const avoidanceForce = calculateAvoidanceSteering(enemy, allEnemies, ENEMY_AI_CONFIG.avoidanceRadius);
    if (avoidanceForce.length() > 0.01 && mesh.userData.physicsBody) {
        const body = mesh.userData.physicsBody;
        body.velocity.x += avoidanceForce.x * 20;
        body.velocity.z += avoidanceForce.z * 20;
    }
    
    // Update walk animation phase based on movement
    if (mesh.userData.walkPhase !== undefined) {
        const horizontalSpeed = new THREE.Vector3(
            mesh.userData.physicsBody ? mesh.userData.physicsBody.velocity.x : moveSpeed,
            0,
            mesh.userData.physicsBody ? mesh.userData.physicsBody.velocity.z : moveSpeed
        ).length();
        
        // Sync walk phase with actual movement
        mesh.userData.walkPhase += horizontalSpeed * ENEMY_AI_CONFIG.walkSyncFactor;
    }
}

function applyFlyingAI(enemy) {
    const mesh = enemy.mesh;
    const pathPoints = getEnemyPath(enemy);
    if (!mesh || !pathPoints || enemy.pathIdx >= pathPoints.length - 1) {
        return;
    }

    const targetWaypoint = pathPoints[enemy.pathIdx + 1];
    const { direction, distance } = getHorizontalDirection(mesh.position, targetWaypoint);
    if (distance <= 0.001) {
        return;
    }

    const targetHeight = enemy.isFlyingBoss
        ? (enemy.flightBaseY || 2.5)
        : (mesh.userData.hoverArmor ? 0.7 : 1.2);
    mesh.position.y += (targetHeight - mesh.position.y) * 0.08;

    const lookTarget = new THREE.Vector3(targetWaypoint.x, mesh.position.y, targetWaypoint.z);
    mesh.lookAt(lookTarget);

    if (mesh.userData.physicsBody) {
        const body = mesh.userData.physicsBody;
        const flySpeed = enemy.speed * 50;
        body.velocity.x = direction.x * flySpeed;
        body.velocity.z = direction.z * flySpeed;
        body.velocity.y = 0;
    } else {
        mesh.position.add(direction.multiplyScalar(enemy.speed));
    }
}

function applyDirectPathAI(enemy) {
    const mesh = enemy.mesh;
    const pathPoints = getEnemyPath(enemy);
    if (!mesh || !pathPoints || enemy.pathIdx >= pathPoints.length - 1) {
        return;
    }

    const targetWaypoint = pathPoints[enemy.pathIdx + 1];
    const { direction, distance } = getHorizontalDirection(mesh.position, targetWaypoint);
    if (distance <= 0.001) {
        return;
    }

    if (isFlyingPathUnit(enemy)) {
        applyFlyingAI(enemy);
        return;
    }

    const targetHeight = 0.15;
    mesh.position.y += (targetHeight - mesh.position.y) * 0.1;
    const lookTarget = new THREE.Vector3(targetWaypoint.x, mesh.position.y, targetWaypoint.z);
    mesh.lookAt(lookTarget);
    mesh.position.add(direction.multiplyScalar(enemy.speed));
}

// Check if enemy has reached a waypoint and should advance
function updateEnemyWaypoint(enemy) {
    if (!enemy.mesh || enemy.isDead) return false;
    
    const pathPoints = getEnemyPath(enemy);
    if (!pathPoints || enemy.pathIdx >= pathPoints.length - 1) {
        return false;
    }
    
    const currentPos = enemy.mesh.position.clone();
    const nextWaypoint = pathPoints[enemy.pathIdx + 1];
    const distance = getHorizontalDistance(currentPos, nextWaypoint);
    
    if (distance < ENEMY_AI_CONFIG.waypointReachDistance) {
        enemy.pathIdx++;
        return true;
    }
    
    return false;
}

// Main AI update function called each frame
function updateEnemyAI(enemiesArray, deltaTime) {
    // Update each enemy's AI
    for (let enemy of enemiesArray) {
        if (!enemy.isDead && !enemy.isStalledAtZero && !enemy.isPortal) {
            if (usesDirectPathMovement(enemy)) {
                applyDirectPathAI(enemy);
            } else {
                applyWalkingAI(enemy, enemiesArray, deltaTime);
            }

            updateEnemyWaypoint(enemy);
        }
    }
}

// Helper: Calculate angle to face movement direction
function calculateFacingAngle(currentPos, targetPos) {
    const dx = targetPos.x - currentPos.x;
    const dz = targetPos.z - currentPos.z;
    return Math.atan2(dx, dz);
}

// Export functions for use in game.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        ENEMY_AI_CONFIG,
        applyWalkingAI,
        updateEnemyWaypoint,
        updateEnemyAI,
        applyFlyingAI,
        applyDirectPathAI,
        calculateSeekSteering,
        calculateAvoidanceSteering,
        calculatePathFollowingSteering,
        calculateFacingAngle
    };
}
