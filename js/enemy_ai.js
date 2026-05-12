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
        const dist = currentPos.distanceTo(waypoint);
        
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
    
    const mesh = enemy.mesh;
    const pathPoints = enemy.pathPoints;
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
    const directionToTarget = new THREE.Vector3().subVectors(targetWaypoint, currentPos);
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

// Check if enemy has reached a waypoint and should advance
function updateEnemyWaypoint(enemy) {
    if (!enemy.mesh || enemy.isDead) return false;
    
    const pathPoints = enemy.pathPoints;
    if (!pathPoints || enemy.pathIdx >= pathPoints.length - 1) {
        return false;
    }
    
    const currentPos = enemy.mesh.position.clone();
    const nextWaypoint = pathPoints[enemy.pathIdx + 1];
    const distance = currentPos.distanceTo(nextWaypoint);
    
    if (distance < ENEMY_AI_CONFIG.waypointReachDistance) {
        enemy.pathIdx++;
        return true;
    }
    
    return false;
}


// Flying units still follow the same road waypoints as ground units, but waypoint
// checks intentionally ignore height so drones and helicopter bosses can advance.
function applyFlyingPathAI(enemy) {
    const mesh = enemy.mesh;
    const pathPoints = enemy.pathPoints;
    if (!mesh || !pathPoints || enemy.pathIdx >= pathPoints.length - 1) {
        return;
    }

    const targetWaypoint = pathPoints[enemy.pathIdx + 1];
    const flatTarget = targetWaypoint.clone();
    flatTarget.y = 0;

    const flatPosition = mesh.position.clone();
    flatPosition.y = 0;

    const toTarget = new THREE.Vector3().subVectors(flatTarget, flatPosition);
    const flatDistance = toTarget.length();

    if (flatDistance < ENEMY_AI_CONFIG.waypointReachDistance) {
        enemy.pathIdx++;
        return;
    }

    if (flatDistance <= 0.01) {
        return;
    }

    toTarget.normalize();
    const lookTarget = flatTarget.clone();
    lookTarget.y = mesh.position.y;
    mesh.lookAt(lookTarget);

    const targetHeight = enemy.isFlyingBoss ? (enemy.flightBaseY || 2.5) : (enemy.isDrone ? 1.2 : 0.7);
    mesh.position.y += (targetHeight - mesh.position.y) * 0.08;

    if (mesh.userData.physicsBody) {
        const body = mesh.userData.physicsBody;
        const flySpeed = enemy.speed * 50;
        body.velocity.x = toTarget.x * flySpeed;
        body.velocity.z = toTarget.z * flySpeed;
        body.velocity.y = 0;
    } else {
        mesh.position.add(toTarget.multiplyScalar(enemy.speed * 1.2));
    }
}

// Main AI update function called each frame
function updateEnemyAI(enemiesArray, deltaTime) {
    // Update each enemy's AI
    for (let enemy of enemiesArray) {
        if (!enemy.isDead && !enemy.isStalledAtZero) {
            const isFlyingUnit = enemy.isDrone || enemy.isFlyingBoss || enemy.mesh.userData.hoverArmor;

            if (isFlyingUnit) {
                applyFlyingPathAI(enemy);
                continue;
            }

            applyWalkingAI(enemy, enemiesArray, deltaTime);
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
        calculateSeekSteering,
        calculateAvoidanceSteering,
        calculatePathFollowingSteering,
        applyFlyingPathAI,
        calculateFacingAngle
    };
}
