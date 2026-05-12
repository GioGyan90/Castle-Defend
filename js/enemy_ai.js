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
    
    // Get current velocity from physics body or estimate from movement
    let currentVelocity = new THREE.Vector3(0, 0, 0);
    if (mesh.userData.physicsBody) {
        currentVelocity.copy(mesh.userData.physicsBody.velocity);
    }
    
    // Calculate steering forces
    const seekForce = calculateSeekSteering(
        currentPos,
        currentVelocity,
        pathPoints[currentWaypointIdx + 1],
        enemy.speed * ENEMY_AI_CONFIG.maxSpeed
    );
    
    const avoidanceForce = calculateAvoidanceSteering(enemy, allEnemies, ENEMY_AI_CONFIG.avoidanceRadius);
    
    const followForce = calculatePathFollowingSteering(enemy, pathPoints, 3.0);
    
    // Combine steering forces
    const totalSteering = new THREE.Vector3();
    totalSteering.add(seekForce.multiplyScalar(1.0));
    totalSteering.add(avoidanceForce.multiplyScalar(0.8));
    totalSteering.add(followForce.multiplyScalar(0.5));
    
    // Limit total steering force
    totalSteering.limitLength(ENEMY_AI_CONFIG.maxSteeringForce);
    
    // Apply steering to physics body or directly to position
    if (mesh.userData.physicsBody) {
        const body = mesh.userData.physicsBody;
        
        // Apply steering as acceleration (only on X-Z plane)
        body.velocity.x += totalSteering.x * 0.5;
        body.velocity.z += totalSteering.z * 0.5;
        
        // Apply damping to prevent excessive speed
        const horizontalVel = new THREE.Vector3(body.velocity.x, 0, body.velocity.z);
        const speed = horizontalVel.length();
        const maxHorizSpeed = enemy.speed * ENEMY_AI_CONFIG.maxSpeed * 40;
        
        if (speed > maxHorizSpeed) {
            horizontalVel.normalize().multiplyScalar(maxHorizSpeed);
            body.velocity.x = horizontalVel.x;
            body.velocity.z = horizontalVel.z;
        }
        
        // Keep Y velocity zero for ground units
        if (!enemy.isDrone && !enemy.isFlyingBoss && !mesh.userData.hoverArmor) {
            body.velocity.y = 0;
        }
    } else {
        // Direct position adjustment for non-physics enemies
        const adjustment = totalSteering.multiplyScalar(deltaTime * 0.06);
        mesh.position.add(adjustment);
    }
    
    // Update walk animation phase based on movement
    if (mesh.userData.walkPhase !== undefined) {
        const horizontalSpeed = new THREE.Vector3(
            mesh.userData.physicsBody ? mesh.userData.physicsBody.velocity.x : 0,
            0,
            mesh.userData.physicsBody ? mesh.userData.physicsBody.velocity.z : 0
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

// Main AI update function called each frame
function updateEnemyAI(enemiesArray, deltaTime) {
    // Update each enemy's AI
    for (let enemy of enemiesArray) {
        if (!enemy.isDead && !enemy.isStalledAtZero) {
            applyWalkingAI(enemy, enemiesArray, deltaTime);
            
            // Check waypoint reach and handle base arrival
            const pathPoints = enemy.pathPoints;
            if (pathPoints && enemy.pathIdx < pathPoints.length - 1) {
                const currentPos = enemy.mesh.position.clone();
                const nextWaypoint = pathPoints[enemy.pathIdx + 1];
                const distance = currentPos.distanceTo(nextWaypoint);
                
                if (distance < ENEMY_AI_CONFIG.waypointReachDistance) {
                    enemy.pathIdx++;
                    
                    // Check if reached final destination (player base)
                    if (enemy.pathIdx >= pathPoints.length - 1) {
                        // Enemy reached the base - will be handled in game.js
                        // Just mark it for removal on next game loop iteration
                    }
                }
            }
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
        calculateFacingAngle
    };
}
