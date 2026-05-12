// Enemy and Boss models.

// Global physics world for enemy collision detection
let enemyPhysicsWorld = null;
const enemyBodies = []; // Store all enemy rigid bodies

// Initialize physics world for enemies
function initEnemyPhysics() {
    if (enemyPhysicsWorld) return;
    
    enemyPhysicsWorld = new CANNON.World();
    enemyPhysicsWorld.gravity.set(0, 0, 0); // No gravity - enemies fly/hover
    enemyPhysicsWorld.broadphase = new CANNON.NaiveBroadphase();
    enemyPhysicsWorld.solver.iterations = 10;
    
    // Create contact material for enemy-enemy collisions
    const enemyMaterial = new CANNON.Material('enemyMaterial');
    const enemyContactMaterial = new CANNON.ContactMaterial(enemyMaterial, enemyMaterial, {
        friction: 0.3,
        restitution: 0.1
    });
    enemyPhysicsWorld.addContactMaterial(enemyContactMaterial);
}

// Add rigid body to an enemy group
function addEnemyRigidBody(group, radius, height, mass) {
    // Create a sphere shape for collision detection
    const shape = new CANNON.Sphere(radius);
    const body = new CANNON.Body({
        mass: mass,
        position: new CANNON.Vec3(group.position.x, group.position.y, group.position.z),
        shape: shape,
        linearDamping: 0.5,
        angularDamping: 0.9,
        fixedRotation: true,
        allowSleep: false
    });
    
    // Store the body reference
    group.userData.physicsBody = body;
    enemyBodies.push({ group, body });
    
    // Add body to physics world
    if (enemyPhysicsWorld) {
        enemyPhysicsWorld.addBody(body);
    }
    
    return body;
}

// Update all enemy physics bodies to match their visual positions
function updateEnemyPhysics(time) {
    if (!enemyPhysicsWorld) return;
    
    // Step the physics simulation
    enemyPhysicsWorld.step(1/60);
    
    // Sync visual meshes with physics bodies
    enemyBodies.forEach(({ group, body }) => {
        if (group && group.position) {
            const targetY = group.position.y;
            
            // Update physics body Y position to match visual (for flying/hovering)
            body.position.y = targetY;
            body.velocity.y = 0; // No vertical movement from physics
            
            // Only apply physics collision to X axis (lateral avoidance)
            // Z axis (forward movement) is controlled by game logic
            group.position.x = body.position.x;
            // Keep Z position from game logic - do not overwrite with physics
        }
    });
}

// Remove enemy from physics world
function removeEnemyFromBodyList(group) {
    const idx = enemyBodies.findIndex(item => item.group === group);
    if (idx !== -1) {
        const { body } = enemyBodies[idx];
        enemyPhysicsWorld.removeBody(body);
        enemyBodies.splice(idx, 1);
    }
}

function createRobotEnemy(isHard) {
    const group = new THREE.Group();
    
    // Colors: gray (normal) or orange (elite)
    const bodyColor = isHard ? 0xff793f : 0x95a5a6;
    const bodyMat = new THREE.MeshPhongMaterial({ color: bodyColor, flatShading: true });
    const jointMat = new THREE.MeshPhongMaterial({ color: 0x555555, flatShading: true });
    
    // Body dimensions for physics
    const bodyWidth = 0.5;
    const bodyHeight = 0.6;
    const bodyDepth = 0.35;
    
    // 身体主体（矩形躯干）
    const bodyGeo = new THREE.BoxGeometry(bodyWidth, bodyHeight, bodyDepth);
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.9;
    group.add(body);
    
    // 头部（圆形带单眼）
    const headGeo = new THREE.SphereGeometry(0.25, 12, 12);
    const head = new THREE.Mesh(headGeo, bodyMat);
    head.position.y = 1.4;
    group.add(head);
    
    // 单眼（发光）
    const eyeMat = new THREE.MeshBasicMaterial({ color: isHard ? 0xff3300 : 0x00ff00 });
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), eyeMat);
    eye.position.set(0, 1.42, 0.2);
    group.add(eye);
    
    // 左臂
    const leftArm = new THREE.Group();
    const upperArmL = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.3), bodyMat);
    upperArmL.position.y = -0.15;
    const lowerArmL = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.04, 0.25), jointMat);
    lowerArmL.position.y = -0.28;
    leftArm.add(upperArmL, lowerArmL);
    leftArm.position.set(-0.35, 0.9, 0);
    leftArm.rotation.z = 0.3;
    group.add(leftArm);
    
    // 右臂
    const rightArm = new THREE.Group();
    const upperArmR = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.3), bodyMat);
    upperArmR.position.y = -0.15;
    const lowerArmR = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.04, 0.25), jointMat);
    lowerArmR.position.y = -0.28;
    rightArm.add(upperArmR, lowerArmR);
    rightArm.position.set(0.35, 0.9, 0);
    rightArm.rotation.z = -0.3;
    group.add(rightArm);
    
    // 左腿
    const leftLegGroup = new THREE.Group();
    const upperLegL = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.06, 0.35), bodyMat);
    upperLegL.position.y = -0.175;
    const lowerLegL = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.35), jointMat);
    lowerLegL.position.y = -0.35;
    leftLegGroup.add(upperLegL, lowerLegL);
    leftLegGroup.position.set(-0.15, 0.55, 0);
    group.add(leftLegGroup);
    
    // 右腿
    const rightLegGroup = new THREE.Group();
    const upperLegR = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.06, 0.35), bodyMat);
    upperLegR.position.y = -0.175;
    const lowerLegR = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.35), jointMat);
    lowerLegR.position.y = -0.35;
    rightLegGroup.add(upperLegR, lowerLegR);
    rightLegGroup.position.set(0.15, 0.55, 0);
    group.add(rightLegGroup);
    
    // 存储引用用于动画
    group.userData = {
        walkPhase: Math.random() * Math.PI * 2,
        body,
        head,
        leftArm,
        rightArm,
        leftLegGroup,
        rightLegGroup,
        leftEye: eye,
        rightEye: eye,
        hasPhysics: false
    };
    
    return group;
}

// 无人机敌人；精英版为黑色重型机身，带粉红灯光。
function createDroneEnemy(isElite = true) {
    const group = new THREE.Group();
    const color = isElite ? 0x101018 : 0xff793f;
    const accentColor = isElite ? 0xff4fd8 : 0x00ffff;
    const sensorColor = isElite ? 0xff2fb8 : 0xff0000;
    const bodyMat = new THREE.MeshPhongMaterial({
        color,
        emissive: isElite ? 0x160014 : 0x000000,
        emissiveIntensity: isElite ? 0.45 : 0,
        flatShading: true
    });
    const armorMat = new THREE.MeshPhongMaterial({
        color: isElite ? 0x262634 : color,
        emissive: isElite ? 0x120010 : 0x000000,
        emissiveIntensity: isElite ? 0.25 : 0,
        flatShading: true
    });
    const propellerMat = new THREE.MeshPhongMaterial({ color: isElite ? 0x050507 : 0x333333, flatShading: true });
    
    // 无人机主体（扁平的六边形）
    const bodyGeo = new THREE.CylinderGeometry(
        isElite ? 0.5 : 0.35,
        isElite ? 0.58 : 0.35,
        isElite ? 0.24 : 0.12,
        6
    );
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.rotation.x = Math.PI / 2;
    body.position.y = 1.2;
    group.add(body);

    if (isElite) {
        const topArmor = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.1, 0.48), armorMat);
        topArmor.position.y = 1.32;
        group.add(topArmor);

        const frontArmor = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.12, 0.18), armorMat);
        frontArmor.position.set(0, 1.22, 0.42);
        group.add(frontArmor);
    }
    
    // 中心发光核心
    const coreMat = new THREE.MeshBasicMaterial({ color: accentColor });
    const core = new THREE.Mesh(new THREE.SphereGeometry(isElite ? 0.16 : 0.12, 8, 8), coreMat);
    core.position.y = isElite ? 1.38 : 1.25;
    group.add(core);

    const sideLights = [];
    if (isElite) {
        [-1, 1].forEach(side => {
            const light = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.07, 0.28), coreMat);
            light.position.set(side * 0.42, 1.25, 0.12);
            group.add(light);
            sideLights.push(light);
        });
    }
    
    // 四个旋翼臂
    const armPositions = [
        { x: isElite ? 0.38 : 0.25, z: isElite ? 0.38 : 0.25, rot: Math.PI / 4 },
        { x: isElite ? -0.38 : -0.25, z: isElite ? 0.38 : 0.25, rot: -Math.PI / 4 },
        { x: isElite ? 0.38 : 0.25, z: isElite ? -0.38 : -0.25, rot: -Math.PI / 4 },
        { x: isElite ? -0.38 : -0.25, z: isElite ? -0.38 : -0.25, rot: Math.PI / 4 }
    ];
    
    const arms = [];
    const propellers = [];
    
    armPositions.forEach((pos, i) => {
        // 旋翼臂
        const arm = new THREE.Mesh(
            new THREE.BoxGeometry(isElite ? 0.14 : 0.08, isElite ? 0.08 : 0.04, isElite ? 0.36 : 0.25),
            bodyMat
        );
        arm.position.set(pos.x, 1.2, pos.z);
        arm.rotation.y = pos.rot;
        group.add(arm);
        arms.push(arm);
        
        // 旋翼叶片
        const propellerGroup = new THREE.Group();
        propellerGroup.position.set(pos.x * (isElite ? 1.55 : 1.8), isElite ? 1.42 : 1.35, pos.z * (isElite ? 1.55 : 1.8));
        
        const hub = new THREE.Mesh(
            new THREE.CylinderGeometry(isElite ? 0.1 : 0.06, isElite ? 0.1 : 0.06, 0.04, 10),
            armorMat
        );
        hub.position.y = -0.01;
        const blade1 = new THREE.Mesh(new THREE.BoxGeometry(isElite ? 0.035 : 0.02, 0.01, isElite ? 0.52 : 0.35), propellerMat);
        const blade2 = new THREE.Mesh(new THREE.BoxGeometry(isElite ? 0.52 : 0.35, 0.01, isElite ? 0.035 : 0.02), propellerMat);
        propellerGroup.add(hub, blade1, blade2);
        
        group.add(propellerGroup);
        propellers.push(propellerGroup);
    });
    
    // 底部传感器/摄像头
    const sensorMat = new THREE.MeshBasicMaterial({ color: sensorColor });
    const sensor = new THREE.Mesh(
        new THREE.CylinderGeometry(isElite ? 0.09 : 0.06, isElite ? 0.06 : 0.04, isElite ? 0.12 : 0.08, 8),
        sensorMat
    );
    sensor.position.y = isElite ? 1.04 : 1.1;
    group.add(sensor);
    
    // 存储引用用于动画
    group.userData = {
        propellers,
        core,
        sideLights,
        spinSpeed: 0.3 + Math.random() * 0.1,
        hasPhysics: false
    };
    
    return group;
}

function createHoverArmorEnemy() {
    const group = new THREE.Group();
    const hullMat = new THREE.MeshPhongMaterial({
        color: 0x08080d,
        emissive: 0x120010,
        emissiveIntensity: 0.35,
        flatShading: true
    });
    const armorMat = new THREE.MeshPhongMaterial({
        color: 0x252532,
        emissive: 0x180015,
        emissiveIntensity: 0.25,
        flatShading: true
    });
    const skirtMat = new THREE.MeshPhongMaterial({ color: 0x030304, flatShading: true });
    const glowMat = new THREE.MeshBasicMaterial({ color: 0xff4fd8 });
    const missileMat = new THREE.MeshPhongMaterial({ color: 0x15151d, emissive: 0x21001c, emissiveIntensity: 0.25 });
    const warheadMat = new THREE.MeshBasicMaterial({ color: 0xff4fd8 });

    const skirt = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.22, 2.05), skirtMat);
    skirt.position.y = 0.72;
    group.add(skirt);

    const hull = new THREE.Mesh(new THREE.BoxGeometry(1.28, 0.36, 1.72), hullMat);
    hull.position.y = 1.0;
    group.add(hull);

    const bow = new THREE.Mesh(new THREE.ConeGeometry(0.72, 0.48, 4), hullMat);
    bow.rotation.x = Math.PI / 2;
    bow.rotation.y = Math.PI / 4;
    bow.position.set(0, 1.0, 1.05);
    group.add(bow);

    const deck = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.18, 0.88), armorMat);
    deck.position.y = 1.25;
    deck.position.z = -0.08;
    group.add(deck);

    const cockpit = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.22, 0.28), armorMat);
    cockpit.position.set(0, 1.42, 0.34);
    group.add(cockpit);

    const launcherGroup = new THREE.Group();
    launcherGroup.position.set(0, 1.5, -0.18);
    group.add(launcherGroup);

    [-0.22, 0.22].forEach(x => {
        const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.82, 12), missileMat);
        tube.rotation.x = Math.PI / 2;
        tube.position.set(x, 0, 0);
        launcherGroup.add(tube);

        const cap = new THREE.Mesh(new THREE.ConeGeometry(0.085, 0.18, 12), warheadMat);
        cap.rotation.x = Math.PI / 2;
        cap.position.set(x, 0, 0.48);
        launcherGroup.add(cap);
    });

    const sideLights = [];
    [-1, 1].forEach(side => {
        const light = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.7), glowMat);
        light.position.set(side * 0.67, 1.06, 0.1);
        group.add(light);
        sideLights.push(light);
    });

    const bowLight = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.07, 0.05), glowMat);
    bowLight.position.set(0, 1.12, 1.38);
    group.add(bowLight);
    sideLights.push(bowLight);

    group.userData = {
        hoverArmor: true,
        launcherGroup,
        sideLights,
        hoverPhase: Math.random() * Math.PI * 2,
        hasPhysics: false
    };

    return group;
}

function createArmoredUnitEnemy() {
    const group = new THREE.Group();
    const matMain = new THREE.MeshPhongMaterial({
        color: 0xc7d4df,
        emissive: 0x102033,
        emissiveIntensity: 0.18,
        specular: 0x88caff,
        shininess: 65
    });
    const matBlue = new THREE.MeshPhongMaterial({
        color: 0x1f6fd1,
        emissive: 0x052044,
        emissiveIntensity: 0.28,
        specular: 0x77bbff,
        shininess: 70
    });
    const matDark = new THREE.MeshPhongMaterial({ color: 0x1b2530, flatShading: true });
    const matGun = new THREE.MeshPhongMaterial({
        color: 0x6f879c,
        specular: 0xaad7ff,
        shininess: 80
    });
    const glowMat = new THREE.MeshBasicMaterial({ color: 0x4fc3ff });

    const chassis = new THREE.Group();
    const mainBody = new THREE.Mesh(new THREE.BoxGeometry(2.3, 1.0, 2.8), matMain);
    mainBody.position.y = 0.5;
    chassis.add(mainBody);

    const frontPlate = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.12, 0.16), matBlue);
    frontPlate.position.set(0, 0.95, 1.43);
    chassis.add(frontPlate);

    const leftSkirt = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.6, 2.5), matBlue);
    leftSkirt.position.set(-1.2, 0.3, 0);
    const rightSkirt = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.6, 2.5), matBlue);
    rightSkirt.position.set(1.2, 0.3, 0);
    chassis.add(leftSkirt, rightSkirt);

    const leftTrack = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.2, 2.9), matDark);
    leftTrack.position.set(-1.3, 0.1, 0);
    const rightTrack = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.2, 2.9), matDark);
    rightTrack.position.set(1.3, 0.1, 0);
    chassis.add(leftTrack, rightTrack);

    const tower = new THREE.Group();
    const turretBase = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.6, 1.4), matMain);
    turretBase.position.y = 0.3;
    tower.add(turretBase);

    const turretTop = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.5, 1.1), matBlue);
    turretTop.position.y = 0.85;
    tower.add(turretTop);

    const createDoubleBarrel = (xOffset) => {
        const barrelGroup = new THREE.Group();
        const mainBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.18, 1.4), matGun);
        mainBarrel.rotation.x = Math.PI / 2;
        mainBarrel.position.z = 0.7;
        barrelGroup.add(mainBarrel);

        const muzzleBrake = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.15, 0.3), matGun);
        muzzleBrake.rotation.x = Math.PI / 2;
        muzzleBrake.position.z = 1.45;
        barrelGroup.add(muzzleBrake);

        const barrelShroud = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.8), matBlue);
        barrelShroud.rotation.x = Math.PI / 2;
        barrelShroud.position.z = 0.4;
        barrelGroup.add(barrelShroud);

        barrelGroup.position.set(xOffset, 0.5, 0);
        return barrelGroup;
    };
    tower.add(createDoubleBarrel(0.35));
    tower.add(createDoubleBarrel(-0.35));

    const sensor = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.12, 0.08), glowMat);
    sensor.position.set(0, 1.18, 0.58);
    tower.add(sensor);

    tower.position.y = 1.2;
    group.add(chassis, tower);
    group.userData = { armoredUnit: true, tower, hasPhysics: false };
    group.scale.setScalar(0.55);

    return group;
}

// 敌人动画
function animateEnemy(e, time) {
    const mesh = e.mesh;
    
    // Boss 动画
    if (e.isBoss) {
        if (mesh.userData.mainRotor) {
            mesh.userData.mainRotor.rotation.y += 0.5;
            if (mesh.userData.tailRotor) {
                mesh.userData.tailRotor.rotation.z += 0.8;
            }
            if (mesh.position) {
                const baseY = e.flightBaseY || 2.5;
                mesh.position.y = Math.sin(time * 0.003) * 0.3 + baseY;
            }
        } else if (currentLevel === 3 && mesh.userData.shark) {
            mesh.userData.shark.rotation.z = Math.sin(time * 0.004) * 0.08;
            mesh.userData.shark.rotation.y = Math.sin(time * 0.006) * 0.06;
        } else if (mesh.userData.gorilla) {
            mesh.userData.walkPhase += 0.12;
            const stride = Math.sin(mesh.userData.walkPhase);
            const counterStride = Math.sin(mesh.userData.walkPhase + Math.PI);
            mesh.userData.leftArm.rotation.x = -0.45 + stride * 0.55;
            mesh.userData.rightArm.rotation.x = -0.45 + counterStride * 0.55;
            mesh.userData.leftLegGroup.rotation.x = counterStride * 0.28;
            mesh.userData.rightLegGroup.rotation.x = stride * 0.28;
            mesh.userData.body.position.y = mesh.userData.baseBodyY + Math.abs(stride) * 0.045;
            mesh.userData.rearBody.position.y = mesh.userData.baseRearY + Math.abs(counterStride) * 0.035;
            mesh.userData.head.position.y = mesh.userData.baseHeadY + Math.abs(stride) * 0.035;
        }
        if (mesh.userData.mainRotor || mesh.userData.shark || mesh.userData.gorilla) return;
    }
    
    // 无人机动画
    if (mesh.userData.propellers !== undefined) {
        const spinSpeed = mesh.userData.spinSpeed || 0.3;
        mesh.userData.propellers.forEach((prop, i) => {
            prop.rotation.y += spinSpeed * (i % 2 === 0 ? 1 : -1);
        });
        
        if (mesh.userData.core) {
            const pulse = Math.sin(time * 0.005) * 0.2 + 0.8;
            mesh.userData.core.scale.setScalar(pulse);
        }
    } 
    else if (mesh.userData.hoverArmor) {
        mesh.userData.hoverPhase += 0.08;
        const hover = Math.sin(mesh.userData.hoverPhase) * 0.04;
        mesh.position.y = hover;
        if (mesh.userData.launcherGroup) {
            mesh.userData.launcherGroup.rotation.z = Math.sin(time * 0.004) * 0.04;
        }
        if (mesh.userData.sideLights) {
            const pulse = Math.sin(time * 0.008) * 0.35 + 0.65;
            mesh.userData.sideLights.forEach(light => light.scale.y = pulse);
        }
    }
    // 机器人行走动画
    else if (mesh.userData.walkPhase !== undefined) {
        const walkSpeed = 0.15;
        mesh.userData.walkPhase += walkSpeed;
        const legAngle = Math.sin(mesh.userData.walkPhase) * 0.5;
        
        mesh.userData.leftLegGroup.rotation.x = legAngle;
        mesh.userData.rightLegGroup.rotation.x = -legAngle;
        
        const armAngle = Math.sin(mesh.userData.walkPhase + Math.PI) * 0.3;
        mesh.userData.leftArm.rotation.x = armAngle;
        mesh.userData.rightArm.rotation.x = -armAngle;
        
        const bodyFloat = Math.abs(Math.sin(mesh.userData.walkPhase * 2)) * 0.02;
        mesh.userData.body.position.y = 0.9 + bodyFloat;
        mesh.userData.head.position.y = 1.4 + bodyFloat;
        mesh.userData.leftArm.position.y = 0.9 + bodyFloat;
        mesh.userData.rightArm.position.y = 0.9 + bodyFloat;
        mesh.userData.leftEye.position.y = 1.42 + bodyFloat;
        mesh.userData.rightEye.position.y = 1.42 + bodyFloat;
    }
    // 独轮炮车动画
    else if (mesh.userData.wheelbarrow) {
        // 车轮滚动
        if (mesh.userData.wheel) {
            mesh.userData.wheel.rotation.z -= 0.15;
        }
        // 炮塔轻微摆动
        if (mesh.userData.cannonGroup) {
            mesh.userData.cannonGroup.rotation.y = Math.sin(time * 0.003) * 0.15;
        }
    }
}

// ==================== Boss 生成 ====================
function createTrapezoidMesh(widthTop, widthBottom, height, depthTop, depthBottom, material) {
    const wt = widthTop / 2;
    const wb = widthBottom / 2;
    const dt = depthTop / 2;
    const db = depthBottom / 2;
    const h = height / 2;
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute([
        -wb, -h, -db,   wb, -h, -db,  -wb, -h,  db,   wb, -h,  db,
        -wt,  h, -dt,   wt,  h, -dt,  -wt,  h,  dt,   wt,  h,  dt
    ], 3));
    geo.setIndex([
        0, 1, 3, 0, 3, 2,
        4, 6, 7, 4, 7, 5,
        0, 4, 5, 0, 5, 1,
        2, 3, 7, 2, 7, 6,
        0, 2, 6, 0, 6, 4,
        1, 5, 7, 1, 7, 3
    ]);
    geo.computeVertexNormals();
    return new THREE.Mesh(geo, material);
}

function createSteelGorillaBoss(parentGroup) {
    const gorilla = new THREE.Group();

    const matBrown = new THREE.MeshPhongMaterial({ color: 0x6a3a20, emissive: 0x1d0d05, emissiveIntensity: 0.16, flatShading: true });
    const matDarkBrown = new THREE.MeshPhongMaterial({ color: 0x3b2418, emissive: 0x100805, emissiveIntensity: 0.12, flatShading: true });
    const matOrange = new THREE.MeshPhongMaterial({ color: 0xc94f2d, emissive: 0x3b1208, emissiveIntensity: 0.18, flatShading: true });
    const matFlesh = new THREE.MeshPhongMaterial({ color: 0xd29a75, emissive: 0x2a140a, emissiveIntensity: 0.1, flatShading: true });
    const matMetal = new THREE.MeshPhongMaterial({ color: 0x2f3438, emissive: 0x121619, emissiveIntensity: 0.16, shininess: 45, flatShading: true });

    const rearBody = createTrapezoidMesh(1.8, 2.35, 1.35, 1.25, 1.75, matBrown);
    rearBody.position.set(0, 1.55, -0.35);
    rearBody.rotation.x = -0.08;

    const body = createTrapezoidMesh(1.45, 1.95, 1.55, 1.15, 1.55, matDarkBrown);
    body.position.set(0, 1.8, 0.38);
    body.rotation.x = 0.2;

    const chestPlate = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.76, 0.16), matOrange);
    chestPlate.position.set(0, 1.92, 1.18);
    chestPlate.rotation.x = 0.16;

    const belly = new THREE.Mesh(new THREE.BoxGeometry(1.28, 0.56, 0.22), matFlesh);
    belly.position.set(0, 1.48, 1.22);
    belly.rotation.x = 0.1;

    const shoulderBar = new THREE.Mesh(new THREE.BoxGeometry(2.35, 0.34, 0.58), matMetal);
    shoulderBar.position.set(0, 2.42, 0.45);

    const head = createTrapezoidMesh(0.72, 0.96, 0.62, 0.54, 0.78, matFlesh);
    head.position.set(0, 2.82, 0.98);
    head.rotation.x = -0.12;

    const brow = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.18, 0.18), matMetal);
    brow.position.set(0, 2.98, 1.31);
    const jaw = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.22, 0.22), matOrange);
    jaw.position.set(0, 2.58, 1.28);

    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff4b20 });
    const leftEye = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 0.05), eyeMat);
    leftEye.position.set(-0.23, 2.9, 1.39);
    const rightEye = leftEye.clone();
    rightEye.position.x = 0.23;

    const createArm = (side) => {
        const arm = new THREE.Group();
        const upper = createTrapezoidMesh(0.38, 0.54, 1.02, 0.38, 0.52, matBrown);
        upper.position.y = -0.45;
        upper.rotation.z = side * 0.08;
        const forearm = createTrapezoidMesh(0.56, 0.74, 1.12, 0.48, 0.68, matDarkBrown);
        forearm.position.y = -1.18;
        forearm.position.z = 0.12;
        const fist = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.38, 0.62), matMetal);
        fist.position.set(0, -1.85, 0.22);
        const knuckle = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.16, 0.14), matOrange);
        knuckle.position.set(0, -1.86, 0.58);
        arm.add(upper, forearm, fist, knuckle);
        arm.position.set(side * 1.28, 2.22, 0.34);
        arm.rotation.z = side * 0.18;
        arm.rotation.x = -0.45;
        return arm;
    };

    const leftArm = createArm(-1);
    const rightArm = createArm(1);

    const createLeg = (side) => {
        const leg = new THREE.Group();
        const thigh = createTrapezoidMesh(0.44, 0.58, 0.76, 0.42, 0.55, matBrown);
        thigh.position.y = -0.32;
        const shin = createTrapezoidMesh(0.34, 0.46, 0.64, 0.34, 0.46, matDarkBrown);
        shin.position.y = -0.84;
        shin.position.z = 0.04;
        const foot = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.22, 0.78), matMetal);
        foot.position.set(0, -1.2, 0.24);
        leg.add(thigh, shin, foot);
        leg.position.set(side * 0.48, 1.05, -0.22);
        return leg;
    };

    const leftLegGroup = createLeg(-1);
    const rightLegGroup = createLeg(1);

    const rearArmor = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.3, 0.22), matOrange);
    rearArmor.position.set(0, 1.96, -1.24);
    const backBlock = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.52, 0.62), matMetal);
    backBlock.position.set(0, 2.18, -0.86);

    gorilla.add(
        rearBody,
        body,
        chestPlate,
        belly,
        shoulderBar,
        head,
        brow,
        jaw,
        leftEye,
        rightEye,
        leftArm,
        rightArm,
        leftLegGroup,
        rightLegGroup,
        rearArmor,
        backBlock
    );
    gorilla.scale.setScalar(1.05);

    parentGroup.add(gorilla);
    parentGroup.userData = {
        gorilla,
        walkPhase: Math.random() * Math.PI * 2,
        body,
        rearBody,
        head,
        leftArm,
        rightArm,
        leftLegGroup,
        rightLegGroup,
        baseBodyY: body.position.y,
        baseRearY: rearBody.position.y,
        baseHeadY: head.position.y,
        hasPhysics: false
    };
}

function spawnGorillaBossEntity(maxHp, speed = 0.02, hpBarY = 4.2) {
    const gorillaBoss = new THREE.Group();
    createSteelGorillaBoss(gorillaBoss);
    gorillaBoss.position.copy(pathPoints[0]);
    scene.add(gorillaBoss);

    const hpBarContainer = new THREE.Group();
    gorillaBoss.add(hpBarContainer);
    addHpBarToBoss(hpBarContainer, maxHp, hpBarY);

    const boss = {
        mesh: gorillaBoss,
        pathIdx: 0,
        health: maxHp,
        maxHealth: maxHp,
        isBoss: true,
        speed: speed,
        hpBar: hpBarContainer.userData.hpBar,
        hpBarContainer: hpBarContainer
    };

    enemies.push(boss);
    return boss;
}

function spawnHelicopterBossEntity(maxHp, speed = 0.02, hpBarY = 4.4) {
    const helicopterBoss = new THREE.Group();
    createHelicopterBoss(helicopterBoss);
    helicopterBoss.position.copy(pathPoints[0]);
    helicopterBoss.position.y = 2.5;
    scene.add(helicopterBoss);

    const hpBarContainer = new THREE.Group();
    helicopterBoss.add(hpBarContainer);
    addHpBarToBoss(hpBarContainer, maxHp, hpBarY);

    const boss = {
        mesh: helicopterBoss,
        pathIdx: 0,
        health: maxHp,
        maxHealth: maxHp,
        isBoss: true,
        isFlyingBoss: true,
        flightBaseY: 2.5,
        speed: speed,
        hpBar: hpBarContainer.userData.hpBar,
        hpBarContainer: hpBarContainer
    };

    enemies.push(boss);
    return boss;
}

function spawnFirstBoss() {
    firstBossSpawned = true;
    
    // 第三关：第一个 Boss（钢铁大猩猩）在小兵出一半时出场
    if (currentLevel === 3) {
        const maxHp = LEVELS[currentLevel].bossHp;
        spawnGorillaBossEntity(maxHp / 2, 0.02, 4.2);
        return;
    }
}

function spawnBoss() {
    bossSpawned = true;
    
    // 第三关：第二个 Boss（直升机）在所有小兵出完后出场
    if (currentLevel === 3) {
        const maxHp = LEVELS[currentLevel].bossHp;
        spawnHelicopterBossEntity(maxHp / 2, 0.018, 4.4);
        return;
    }
    
    // 第一、二关：传统坦克 Boss
    const bossGroup = new THREE.Group();
    const matMain = new THREE.MeshPhongMaterial({ 
        color: currentLevel === 1 ? 0x8b3a3a : 0x1e272e, 
        emissive: currentLevel === 1 ? 0x331111 : 0x000000 
    });
    const matGun = new THREE.MeshPhongMaterial({ 
        color: 0x4a4a4a, 
        specular: 0x666666, 
        shininess: 50 
    });
    
    // 底盘：分层设计
    const chassis = new THREE.Group();
    const mainBody = new THREE.Mesh(new THREE.BoxGeometry(2.3, 1.0, 2.8), matMain);
    mainBody.position.y = 0.5;
    chassis.add(mainBody);
    
    // 侧裙板（深黑色）
    const skirtMat = new THREE.MeshPhongMaterial({ color: 0x2d2d2d });
    const leftSkirt = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.6, 2.5), skirtMat);
    leftSkirt.position.set(-1.2, 0.3, 0);
    const rightSkirt = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.6, 2.5), skirtMat);
    rightSkirt.position.set(1.2, 0.3, 0);
    chassis.add(leftSkirt, rightSkirt);
    
    // 履带细节
    const trackMat = new THREE.MeshPhongMaterial({ color: 0x1a1a1a });
    const leftTrack = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.2, 2.9), trackMat);
    leftTrack.position.set(-1.3, 0.1, 0);
    const rightTrack = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.2, 2.9), trackMat);
    rightTrack.position.set(1.3, 0.1, 0);
    chassis.add(leftTrack, rightTrack);
    
    // 炮塔：多层设计
    const tower = new THREE.Group();
    const turretBase = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.6, 1.4), matMain);
    turretBase.position.y = 0.3;
    tower.add(turretBase);
    
    const turretTop = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.5, 1.1), matMain);
    turretTop.position.y = 0.85;
    tower.add(turretTop);
    
    // 炮管设计
    if (currentLevel === 2) { 
        // 第二关：双联装炮管
        const barrelMat = new THREE.MeshPhongMaterial({ color: 0x3d3d3d, specular: 0x555555, shininess: 60 });
        const createDoubleBarrel = (xOffset) => {
            const barrelGroup = new THREE.Group();
            const mainBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.18, 1.4), barrelMat);
            mainBarrel.rotation.x = Math.PI / 2;
            mainBarrel.position.z = 0.7;
            barrelGroup.add(mainBarrel);
            
            const muzzleBrake = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.15, 0.3), barrelMat);
            muzzleBrake.rotation.x = Math.PI / 2;
            muzzleBrake.position.z = 1.45;
            barrelGroup.add(muzzleBrake);
            
            const barrelShroud = new THREE.Mesh(
                new THREE.CylinderGeometry(0.12, 0.12, 0.8), 
                new THREE.MeshPhongMaterial({ color: 0x5a5a5a })
            );
            barrelShroud.rotation.x = Math.PI / 2;
            barrelShroud.position.z = 0.4;
            barrelGroup.add(barrelShroud);
            
            barrelGroup.position.set(xOffset, 0.5, 0);
            return barrelGroup;
        };
        tower.add(createDoubleBarrel(0.35));
        tower.add(createDoubleBarrel(-0.35));
    } else { 
        // 第一关：单装大口径炮管
        const barrelGroup = new THREE.Group();
        
        // 主炮管（锥形）
        const mainBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.25, 1.6), matGun);
        mainBarrel.rotation.x = Math.PI / 2;
        mainBarrel.position.z = 0.8;
        barrelGroup.add(mainBarrel);
        
        // 炮口制退器
        const muzzleBrake = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.18, 0.4), matGun);
        muzzleBrake.rotation.x = Math.PI / 2;
        muzzleBrake.position.z = 1.7;
        barrelGroup.add(muzzleBrake);
        
        // 炮管隔热护套（分段设计）
        const shroudMat = new THREE.MeshPhongMaterial({ color: 0x6b6b6b });
        const shroud1 = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.5), shroudMat);
        shroud1.rotation.x = Math.PI / 2;
        shroud1.position.z = 0.3;
        const shroud2 = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.5), shroudMat);
        shroud2.rotation.x = Math.PI / 2;
        shroud2.position.z = 0.8;
        barrelGroup.add(shroud1, shroud2);
        
        // 炮管吊耳
        const sling = new THREE.Mesh(
            new THREE.BoxGeometry(0.15, 0.3, 0.15), 
            new THREE.MeshPhongMaterial({ color: 0x4a4a4a })
        );
        sling.position.set(0, 0.25, 0.5);
        barrelGroup.add(sling);
        
        barrelGroup.position.y = 0.5;
        tower.add(barrelGroup);
    }
    
    tower.position.y = 1.2;
    bossGroup.add(chassis, tower);
    bossGroup.userData = { tower };
    
    bossGroup.position.copy(pathPoints[0]);
    
    // 血条系统 - 2D UI 血条（始终面向屏幕，水平显示）
    const maxHp = LEVELS[currentLevel].bossHp;
    
    // 第一、二关：单个 Boss
    // 创建一个容器用于血条，使其始终面向摄像机
    const hpBarContainer = new THREE.Group();
    bossGroup.add(hpBarContainer);
    
    // 血条背景（黑色）- 使用 Sprite 确保始终面向摄像机
    const barBgCanvas = document.createElement('canvas');
    barBgCanvas.width = 200;
    barBgCanvas.height = 30;
    const barBgCtx = barBgCanvas.getContext('2d');
    barBgCtx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    barBgCtx.fillRect(0, 0, 200, 30);
    barBgCtx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    barBgCtx.lineWidth = 2;
    barBgCtx.strokeRect(1, 1, 198, 28);
    
    const barBgTexture = new THREE.CanvasTexture(barBgCanvas);
    const barBgMat = new THREE.SpriteMaterial({ map: barBgTexture, transparent: true });
    const barBg = new THREE.Sprite(barBgMat);
    barBg.scale.set(4, 0.6, 1);
    barBg.position.set(0, 3.5, 0);
    hpBarContainer.add(barBg);
    
    // 血条前景（颜色根据血量变化）- 使用 Sprite
    const barCanvas = document.createElement('canvas');
    barCanvas.width = 196;
    barCanvas.height = 26;
    const barCtx = barCanvas.getContext('2d');
    barCtx.fillStyle = '#00ff00';
    barCtx.fillRect(0, 0, 196, 26);
    
    const barTexture = new THREE.CanvasTexture(barCanvas);
    const barMat = new THREE.SpriteMaterial({ map: barTexture, transparent: true });
    const bar = new THREE.Sprite(barMat);
    bar.scale.set(3.8, 0.55, 1);
    bar.position.set(0, 3.5, 0.01);
    bar.userData = { 
        maxHp: maxHp,
        canvas: barCanvas,
        ctx: barCtx,
        texture: barTexture
    };
    hpBarContainer.add(bar);
    
    // 保存血条容器引用以便在 gameLoop 中更新朝向
    bossGroup.userData.hpBarContainer = hpBarContainer;
    
    const e = { 
        mesh: bossGroup, 
        pathIdx: 0, 
        health: maxHp, 
        maxHealth: maxHp, 
        isBoss: true, 
        speed: 0.015, 
        hpBar: bar,
        hpBarContainer: hpBarContainer
    };
    scene.add(bossGroup);
    enemies.push(e);
    spawnHelicopterBossEntity(maxHp, 0.018, 4.4);
    bossSpawned = true;
}

// 辅助函数：为 Boss 添加血条
function addHpBarToBoss(hpBarContainer, maxHp, yPos) {
    // 血条背景
    const barBgCanvas = document.createElement('canvas');
    barBgCanvas.width = 200;
    barBgCanvas.height = 30;
    const barBgCtx = barBgCanvas.getContext('2d');
    barBgCtx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    barBgCtx.fillRect(0, 0, 200, 30);
    barBgCtx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    barBgCtx.lineWidth = 2;
    barBgCtx.strokeRect(1, 1, 198, 28);
    
    const barBgTexture = new THREE.CanvasTexture(barBgCanvas);
    const barBgMat = new THREE.SpriteMaterial({ map: barBgTexture, transparent: true });
    const barBg = new THREE.Sprite(barBgMat);
    barBg.scale.set(4, 0.6, 1);
    barBg.position.set(0, yPos, 0);
    hpBarContainer.add(barBg);
    
    // 血条前景
    const barCanvas = document.createElement('canvas');
    barCanvas.width = 196;
    barCanvas.height = 26;
    const barCtx = barCanvas.getContext('2d');
    barCtx.fillStyle = '#00ff00';
    barCtx.fillRect(0, 0, 196, 26);
    
    const barTexture = new THREE.CanvasTexture(barCanvas);
    const barMat = new THREE.SpriteMaterial({ map: barTexture, transparent: true });
    const bar = new THREE.Sprite(barMat);
    bar.scale.set(3.8, 0.55, 1);
    bar.position.set(0, yPos, 0.01);
    bar.userData = { 
        maxHp: maxHp,
        canvas: barCanvas,
        ctx: barCtx,
        texture: barTexture
    };
    hpBarContainer.add(bar);
    
    // 保存引用
    hpBarContainer.userData.hpBar = bar;
}

// 创建直升机 Boss
function createHelicopterBoss(parentGroup) {
    const heliGroup = new THREE.Group();
    
    const matBody = new THREE.MeshPhongMaterial({
        color: 0x101018,
        emissive: 0x160014,
        emissiveIntensity: 0.42,
        flatShading: true
    });
    const matBodyDark = new THREE.MeshPhongMaterial({
        color: 0x050507,
        emissive: 0x080005,
        emissiveIntensity: 0.18,
        flatShading: true
    });
    const matArmor = new THREE.MeshPhongMaterial({
        color: 0x262634,
        emissive: 0x120010,
        emissiveIntensity: 0.28,
        flatShading: true
    });
    const matGlass = new THREE.MeshPhongMaterial({
        color: 0xff4fd8,
        emissive: 0xff2fb8,
        emissiveIntensity: 0.38,
        transparent: true,
        opacity: 0.72,
        shininess: 70
    });
    const matRotor = new THREE.MeshPhongMaterial({ color: 0x050507 });
    const matGun = new THREE.MeshPhongMaterial({ color: 0x262634, emissive: 0x120010, emissiveIntensity: 0.22, specular: 0x666666, shininess: 55 });
    const matPinkGlow = new THREE.MeshBasicMaterial({ color: 0xff4fd8 });
    
    // 机身主体：拉伸并旋转过的厚六边形
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.58, 0.68, 1.95, 6), matBody);
    body.rotation.set(Math.PI / 2, 0, 0);
    body.scale.set(1.55, 0.86, 1.0);
    body.position.y = 2.48;
    heliGroup.add(body);

    const coreFrame = new THREE.Mesh(new THREE.CylinderGeometry(0.58, 0.66, 0.08, 6), matArmor);
    coreFrame.rotation.x = Math.PI / 2;
    coreFrame.position.set(0, 2.54, 0.1);
    heliGroup.add(coreFrame);

    const embeddedCore = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.54, 0.13, 6), matPinkGlow);
    embeddedCore.rotation.x = Math.PI / 2;
    embeddedCore.position.set(0, 2.56, 0.1);
    heliGroup.add(embeddedCore);

    const tailWedgeGeo = new THREE.BufferGeometry();
    tailWedgeGeo.setAttribute('position', new THREE.Float32BufferAttribute([
        -0.58, 0.00, -0.16,   0.58, 0.00, -0.16,  -0.36, 0.00, 0.34,   0.36, 0.00, 0.34,
        -0.34, 0.38, -0.10,   0.34, 0.38, -0.10,  -0.16, 0.12, 0.28,   0.16, 0.12, 0.28
    ], 3));
    tailWedgeGeo.setIndex([
        0, 2, 3, 0, 3, 1,
        4, 5, 7, 4, 7, 6,
        0, 1, 5, 0, 5, 4,
        2, 6, 7, 2, 7, 3,
        0, 4, 6, 0, 6, 2,
        1, 3, 7, 1, 7, 5
    ]);
    tailWedgeGeo.computeVertexNormals();
    const tailWedge = new THREE.Mesh(tailWedgeGeo, matArmor);
    tailWedge.position.set(0, 2.42, -0.96);
    tailWedge.rotation.x = Math.PI;
    heliGroup.add(tailWedge);

    // 带坡度的机头
    const noseGeo = new THREE.BufferGeometry();
    noseGeo.setAttribute('position', new THREE.Float32BufferAttribute([
        -0.62, 2.15, 0.80,   0.62, 2.15, 0.80,  -0.46, 2.16, 1.48,   0.46, 2.16, 1.48,
        -0.62, 2.78, 0.80,   0.62, 2.78, 0.80,  -0.36, 2.45, 1.48,   0.36, 2.45, 1.48
    ], 3));
    noseGeo.setIndex([
        0, 2, 3, 0, 3, 1,
        4, 5, 7, 4, 7, 6,
        0, 1, 5, 0, 5, 4,
        2, 6, 7, 2, 7, 3,
        0, 4, 6, 0, 6, 2,
        1, 3, 7, 1, 7, 5
    ]);
    noseGeo.computeVertexNormals();
    const nose = new THREE.Mesh(noseGeo, matBody);
    heliGroup.add(nose);
    
    // 驾驶舱玻璃
    const cockpit = new THREE.Mesh(new THREE.BoxGeometry(0.86, 0.28, 0.42), matGlass);
    cockpit.position.set(0, 2.58, 1.23);
    cockpit.rotation.x = -0.22;
    heliGroup.add(cockpit);

    // 侧窗
    [-0.79, 0.79].forEach((x) => {
        const sideWindow = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.3, 0.46), matGlass);
        sideWindow.position.set(x, 2.58, 0.16);
        sideWindow.rotation.z = x > 0 ? -0.04 : 0.04;
        heliGroup.add(sideWindow);

        const rearWindow = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.26, 0.36), matGlass);
        rearWindow.position.set(x, 2.56, -0.48);
        heliGroup.add(rearWindow);

        const tailSideWindow = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.24, 0.34), matGlass);
        tailSideWindow.position.set(x * 0.93, 2.44, -1.08);
        tailSideWindow.rotation.z = x > 0 ? -0.08 : 0.08;
        heliGroup.add(tailSideWindow);
    });

    // 侧挂双炮管
    [-1, 1].forEach((side) => {
        const cannonGroup = new THREE.Group();
        const mount = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.16, 0.28), matArmor);
        mount.position.z = -0.06;
        const cannon = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.07, 0.84, 12), matGun);
        cannon.rotation.x = Math.PI / 2;
        cannon.position.z = 0.36;
        const cannonMuzzle = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.06, 0.16, 12), matPinkGlow);
        cannonMuzzle.rotation.x = Math.PI / 2;
        cannonMuzzle.position.z = 0.86;
        cannonGroup.add(mount, cannon, cannonMuzzle);
        cannonGroup.position.set(side * 0.92, 2.36, 0.82);
        heliGroup.add(cannonGroup);
    });
    
    // 尾梁
    const tailBoom = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.2, 2), matBody);
    tailBoom.rotation.x = Math.PI / 2;
    tailBoom.position.set(0, 2.42, -2.08);
    heliGroup.add(tailBoom);
    
    // 尾翼
    const tailFin = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.62, 0.42), matBodyDark);
    tailFin.position.set(0, 2.8, -3);
    heliGroup.add(tailFin);

    // 竖向尾部小螺旋桨
    const tailRotorGroup = new THREE.Group();
    tailRotorGroup.position.set(0.08, 2.82, -3.24);
    const tailHub = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.08, 10), matGun);
    tailHub.rotation.x = Math.PI / 2;
    tailRotorGroup.add(tailHub);
    const tailBlade1 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.64, 0.03), matRotor);
    const tailBlade2 = new THREE.Mesh(new THREE.BoxGeometry(0.64, 0.08, 0.03), matRotor);
    tailRotorGroup.add(tailBlade1, tailBlade2);
    heliGroup.add(tailRotorGroup);
    
    // 主旋翼
    const mainRotorGroup = new THREE.Group();
    const rotorHub = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.2), matBodyDark);
    rotorHub.position.y = 3.4;
    mainRotorGroup.add(rotorHub);
    
    const rotorBlade1 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.02, 3.5), matRotor);
    rotorBlade1.position.y = 3.5;
    mainRotorGroup.add(rotorBlade1);
    
    const rotorBlade2 = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.02, 0.1), matRotor);
    rotorBlade2.position.y = 3.5;
    mainRotorGroup.add(rotorBlade2);
    
    heliGroup.add(mainRotorGroup);
    heliGroup.userData.mainRotor = mainRotorGroup;
    
    // 落地支架
    const legMat = new THREE.MeshPhongMaterial({ color: 0x555555 });
    const createLeg = (x, z) => {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.62, 8), legMat);
        leg.position.set(x, 1.9, z);
        return leg;
    };
    const skidLeft = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.9, 8), legMat);
    skidLeft.rotation.x = Math.PI / 2;
    skidLeft.position.set(-0.56, 1.57, 0);
    const skidRight = skidLeft.clone();
    skidRight.position.x = 0.56;
    heliGroup.add(
        createLeg(-0.56, 0.72),
        createLeg(0.56, 0.72),
        createLeg(-0.56, -0.72),
        createLeg(0.56, -0.72),
        skidLeft,
        skidRight
    );
    
    parentGroup.add(heliGroup);
    parentGroup.userData.helicopter = heliGroup;
    parentGroup.userData.mainRotor = mainRotorGroup;
    parentGroup.userData.tailRotor = tailRotorGroup;
    parentGroup.userData.hasPhysics = false;
}

// 创建机器人鲨鱼 Boss
function createSharkRobotBoss(parentGroup) {
    const sharkGroup = new THREE.Group();
    
    const matBody = new THREE.MeshPhongMaterial({ color: 0x34495e, emissive: 0x2c3e50, emissiveIntensity: 0.1 });
    const matFin = new THREE.MeshPhongMaterial({ color: 0x2c3e50 });
    const matEye = new THREE.MeshBasicMaterial({ color: 0xe74c3c });
    
    // 鲨鱼身体（流线型）- 使用圆柱体+半球替代胶囊体
    const bodyGroup = new THREE.Group();
    
    // 中间圆柱部分
    const bodyCylinder = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 1.5, 16), matBody);
    bodyCylinder.rotation.x = Math.PI / 2;
    bodyGroup.add(bodyCylinder);
    
    // 前半球
    const frontSphere = new THREE.Mesh(new THREE.SphereGeometry(0.6, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2), matBody);
    frontSphere.position.z = 0.75;
    frontSphere.rotation.x = -Math.PI / 2;
    bodyGroup.add(frontSphere);
    
    // 后半球
    const backSphere = new THREE.Mesh(new THREE.SphereGeometry(0.6, 16, 16, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), matBody);
    backSphere.position.z = -0.75;
    backSphere.rotation.x = Math.PI / 2;
    bodyGroup.add(backSphere);
    
    bodyGroup.position.y = 1.2;
    sharkGroup.add(bodyGroup);
    
    // 头部
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.5, 16, 16), matBody);
    head.position.set(0, 1.2, 1.8);
    sharkGroup.add(head);
    
    // 眼睛（红色发光）
    const eyeLeft = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), matEye);
    eyeLeft.position.set(-0.25, 1.3, 2.1);
    const eyeRight = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), matEye);
    eyeRight.position.set(0.25, 1.3, 2.1);
    sharkGroup.add(eyeLeft, eyeRight);
    
    // 背鳍
    const dorsalFin = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.8, 4), matFin);
    dorsalFin.position.set(0, 2, 0);
    sharkGroup.add(dorsalFin);
    
    // 胸鳍
    const pectoralFinL = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.05, 0.3), matFin);
    pectoralFinL.position.set(-0.7, 1.2, 0.3);
    pectoralFinL.rotation.z = 0.3;
    const pectoralFinR = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.05, 0.3), matFin);
    pectoralFinR.position.set(0.7, 1.2, 0.3);
    pectoralFinR.rotation.z = -0.3;
    sharkGroup.add(pectoralFinL, pectoralFinR);
    
    // 尾鳍
    const tailFin = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.05, 0.4), matFin);
    tailFin.position.set(0, 1.3, -2.2);
    tailFin.rotation.x = Math.PI / 3;
    sharkGroup.add(tailFin);
    
    // 机械细节（关节和装甲板）
    const jointMat = new THREE.MeshPhongMaterial({ color: 0x555555 });
    const joint1 = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.08, 8, 16), jointMat);
    joint1.rotation.x = Math.PI / 2;
    joint1.position.set(0, 1.2, -0.5);
    sharkGroup.add(joint1);
    
    const joint2 = new THREE.Mesh(new THREE.TorusGeometry(0.25, 0.08, 8, 16), jointMat);
    joint2.rotation.x = Math.PI / 2;
    joint2.position.set(0, 1.2, 0.5);
    sharkGroup.add(joint2);
    
    parentGroup.add(sharkGroup);
    parentGroup.userData.shark = sharkGroup;
    parentGroup.userData.hasPhysics = false;
}

// 创建独轮炮车模型 (Wheelbarrow) - 橙蓝配色
function createWheelbarrowModel() {
    const group = new THREE.Group();
    
    // 材质定义 - 橙蓝配色
    const matOrange = new THREE.MeshPhongMaterial({
        color: 0xff793f,
        emissive: 0x331100,
        emissiveIntensity: 0.25,
        flatShading: true
    });
    const matBlue = new THREE.MeshPhongMaterial({
        color: 0x1f6fd1,
        emissive: 0x052044,
        emissiveIntensity: 0.28,
        flatShading: true
    });
    const matDark = new THREE.MeshPhongMaterial({ color: 0x1b2530, flatShading: true });
    const matGun = new THREE.MeshPhongMaterial({
        color: 0x6f879c,
        specular: 0xaad7ff,
        shininess: 80
    });
    const matGlow = new THREE.MeshBasicMaterial({ color: 0xff793f });
    
    // 单轮（大轮子）
    const wheelGeo = new THREE.CylinderGeometry(0.65, 0.65, 0.25, 16);
    const wheel = new THREE.Mesh(wheelGeo, matDark);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(0, 0.65, 0);
    group.add(wheel);
    
    // 轮毂盖 - 橙色
    const hubCap = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.28, 12), matOrange);
    hubCap.rotation.z = Math.PI / 2;
    hubCap.position.set(0, 0.65, 0);
    group.add(hubCap);
    
    // 主车架 - 蓝色
    const frame = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.4, 1.8), matBlue);
    frame.position.set(0, 1.1, 0.3);
    group.add(frame);
    
    // 前部装甲板 - 橙色
    const frontPlate = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.15, 0.2), matOrange);
    frontPlate.position.set(0, 1.4, 1.2);
    group.add(frontPlate);
    
    // 侧裙板 - 蓝色
    const leftSkirt = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.5, 1.4), matBlue);
    leftSkirt.position.set(-0.62, 0.85, 0.3);
    const rightSkirt = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.5, 1.4), matBlue);
    rightSkirt.position.set(0.62, 0.85, 0.3);
    group.add(leftSkirt, rightSkirt);
    
    // 炮塔基座 - 橙色
    const turretBase = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.55, 0.3, 8), matOrange);
    turretBase.position.set(0, 1.55, 0.1);
    group.add(turretBase);
    
    // 炮塔主体 - 蓝色
    const turretBody = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.5, 1.0), matBlue);
    turretBody.position.set(0, 1.9, 0.1);
    group.add(turretBody);
    
    // 炮管组
    const cannonGroup = new THREE.Group();
    const mainBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.15, 1.2), matGun);
    mainBarrel.rotation.x = Math.PI / 2;
    mainBarrel.position.z = 0.6;
    cannonGroup.add(mainBarrel);
    
    const muzzleBrake = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.12, 0.25), matGun);
    muzzleBrake.rotation.x = Math.PI / 2;
    muzzleBrake.position.z = 1.25;
    cannonGroup.add(muzzleBrake);
    
    const barrelShroud = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.6), matOrange);
    barrelShroud.rotation.x = Math.PI / 2;
    barrelShroud.position.z = 0.3;
    cannonGroup.add(barrelShroud);
    
    cannonGroup.position.set(0, 1.9, 0.1);
    group.add(cannonGroup);
    
    // 传感器/发光件 - 橙色发光
    const sensor = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.1, 0.08), matGlow);
    sensor.position.set(0, 2.15, 0.62);
    group.add(sensor);
    
    // 后部配重/装饰 - 蓝色
    const rearWeight = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.4, 0.5), matBlue);
    rearWeight.position.set(0, 1.7, -0.5);
    group.add(rearWeight);
    
    // 支撑腿/稳定器 - 橙色
    const stabilizerMat = new THREE.MeshPhongMaterial({ color: 0xff793f });
    const leftStabilizer = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.5), stabilizerMat);
    leftStabilizer.position.set(-0.5, 0.4, -0.4);
    leftStabilizer.rotation.z = 0.3;
    const rightStabilizer = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.5), stabilizerMat);
    rightStabilizer.position.set(0.5, 0.4, -0.4);
    rightStabilizer.rotation.z = -0.3;
    group.add(leftStabilizer, rightStabilizer);
    
    // 存储引用用于动画
    group.userData = {
        wheelbarrow: true,
        cannonGroup,
        wheel,
        hasPhysics: false
    };
    
    return group;
}

// ==================== UI 更新 ====================
// ==================== 模型展示馆 ====================

