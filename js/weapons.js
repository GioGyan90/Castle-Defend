// Player weapon models and projectile logic.
function createWeaponModel(type) {
    const g = new THREE.Group();
    if (type === 1) {
        // 脉冲炮
        g.add(new THREE.Mesh(
            new THREE.CylinderGeometry(0.6, 0.7, 0.5, 8), 
            new THREE.MeshPhongMaterial({ color: 0x26de81 })
        ));
        const barrelGroup = new THREE.Group();
        barrelGroup.position.set(0, 0.35, 0);
        g.add(barrelGroup);
        g.userData.barrelGroup = barrelGroup;
        g.userData.barrelBaseZ = 0;

        const b = new THREE.Mesh(
            new THREE.BoxGeometry(0.3, 0.3, 1), 
            new THREE.MeshPhongMaterial({ color: 0x20bf6b })
        );
        b.position.set(0, 0.15, 0.35);
        barrelGroup.add(b);
    } else if (type === 2) {
        // 轨道炮 - 带可活动的炮管组件用于后坐力动画
        const base = new THREE.Mesh(
            new THREE.BoxGeometry(1, 0.7, 1), 
            new THREE.MeshPhongMaterial({ color: 0x45aaf2 })
        );
        g.add(base);
        
        // 炮管组（用于后坐力动画）
        const barrelGroup = new THREE.Group();
        barrelGroup.position.set(0, 0.35, 0);
        g.add(barrelGroup);
        g.userData.barrelGroup = barrelGroup;
        g.userData.barrelBaseZ = 0;
        
        const b1 = new THREE.Mesh(
            new THREE.BoxGeometry(0.25, 0.25, 1.2), 
            new THREE.MeshPhongMaterial({ color: 0x2d98da })
        );
        const b2 = b1.clone();
        b1.position.set(0.25, 0.25, 0.3);
        b2.position.set(-0.25, 0.25, 0.3);
        barrelGroup.add(b1, b2);
    } else {
        // 特斯拉线圈
        const base = new THREE.Mesh(
            new THREE.CylinderGeometry(0.7, 0.9, 0.4, 6), 
            new THREE.MeshPhongMaterial({ color: 0xa55eea })
        );
        g.add(base);
        const chargeBar = new THREE.Group();
        const chargeSegments = [];
        const ringRadius = 0.88;
        for (let i = 0; i < 20; i++) {
            const angle = (Math.PI * 2 * i) / 20;
            const segment = new THREE.Mesh(
                new THREE.BoxGeometry(0.18, 0.055, 0.055),
                new THREE.MeshPhongMaterial({ color: 0x241b35, emissive: 0x000000 })
            );
            segment.position.set(Math.sin(angle) * ringRadius, 0.25, Math.cos(angle) * ringRadius);
            segment.rotation.y = angle;
            chargeBar.add(segment);
            chargeSegments.push(segment);
        }
        g.add(chargeBar);
        const t = new THREE.Mesh(
            new THREE.BoxGeometry(0.5, 2, 0.5), 
            new THREE.MeshPhongMaterial({ color: 0x8854d0 })
        );
        const c = new THREE.Mesh(
            new THREE.OctahedronGeometry(0.4), 
            new THREE.MeshPhongMaterial({ color: 0xffffff, emissive: 0x000000 })
        );
        t.position.y = 1;
        c.position.y = 2.4;
        g.add(t, c);
        g.userData.crystal = c;
        g.userData.teslaCharge = 0;
        g.userData.teslaMaxCharge = 20;
        g.userData.teslaChargeSegments = chargeSegments;
        
        // 击杀数数字标签机制已移除
    }
    return g;
}

// ==================== 子弹发射函数 ====================
function updateTeslaChargeBar(model, time = 0) {
    const segments = model.userData.teslaChargeSegments;
    if (!segments) return;

    const charge = model.userData.teslaCharge || 0;
    const maxCharge = model.userData.teslaMaxCharge || 20;
    const isFull = charge >= maxCharge;
    const flash = isFull ? 0.45 + Math.sin(time * 0.012) * 0.35 : 0;

    segments.forEach((segment, i) => {
        const filled = i < charge;
        if (isFull) {
            segment.material.color.setRGB(1, 1, 1);
            segment.material.emissive.setRGB(flash, flash, flash);
        } else if (filled) {
            segment.material.color.setHex(0xd4a5ff);
            segment.material.emissive.setHex(0x5e2c91);
        } else {
            segment.material.color.setHex(0x241b35);
            segment.material.emissive.setHex(0x000000);
        }
    });
}

function chargeTeslaWeapon(w) {
    if (!w || w.type !== 3 || !w.mesh || !w.mesh.userData.teslaChargeSegments) return;
    const maxCharge = w.mesh.userData.teslaMaxCharge || 20;
    w.mesh.userData.teslaCharge = Math.min(maxCharge, (w.mesh.userData.teslaCharge || 0) + 1);
    updateTeslaChargeBar(w.mesh);
}

function registerWeaponKill(b) {
    if (b && b.ownerWeapon && b.ownerWeapon.type === 3) {
        chargeTeslaWeapon(b.ownerWeapon);
    }
}

function getTeslaBaseDamage(w) {
    const charge = w.mesh.userData.teslaCharge || 0;
    const maxCharge = w.mesh.userData.teslaMaxCharge || 20;
    const fullChargeBonus = charge >= maxCharge ? 25 : 0;
    return 15 + charge * 2 + fullChargeBonus;
}

function getWeaponDamageRoll(w, fallbackDamage) {
    let normalDamage = fallbackDamage;
    let critDamage = fallbackDamage;
    let critRate = 0;

    if (w.type === 1) {
        normalDamage = 3;
        critDamage = 5;
        critRate = 0.3;
    } else if (w.type === 2) {
        normalDamage = 8;
        critDamage = 12;
        critRate = 0.25;
    } else if (w.type === 3) {
        normalDamage = getTeslaBaseDamage(w);
        critDamage = normalDamage + 5;
        critRate = 0.15;
    }

    const isCrit = Math.random() < critRate;
    if (isCrit) {
        startWeaponCritShake(w);
    }

    return {
        damage: isCrit ? critDamage : normalDamage,
        isCrit
    };
}

function aimWeaponAtTarget(w, target) {
    if (!w.mesh.userData.barrelGroup) return;
    const dx = target.mesh.position.x - w.mesh.position.x;
    const dz = target.mesh.position.z - w.mesh.position.z;
    w.mesh.userData.barrelGroup.rotation.y = Math.atan2(dx, dz);
}

function startWeaponRecoil(w, distance = 0.28, duration = 240) {
    if (!w.mesh.userData.barrelGroup) return;
    w.recoilDuration = duration;
    w.recoilTotalDuration = duration;
    w.recoilDistance = distance;
}

function startWeaponCritShake(w, duration = 180) {
    w.critShakeDuration = duration;
    w.critShakeTotalDuration = duration;
    w.critShakeIntensity = 0.08;
}

function getRailMuzzlePosition(w) {
    const barrelGroup = w.mesh.userData.barrelGroup;
    const shotIndex = w.railShotIndex || 0;
    const side = shotIndex % 2 === 0 ? -1 : 1;
    w.railShotIndex = shotIndex + 1;

    const yaw = barrelGroup ? barrelGroup.rotation.y : 0;
    const right = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw));
    const forward = new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw));
    return w.mesh.position.clone()
        .add(new THREE.Vector3(0, 0.62, 0))
        .add(right.multiplyScalar(side * 0.25))
        .add(forward.multiplyScalar(0.95));
}

function createRailShotMesh(startPos, direction) {
    const group = new THREE.Group();
    const segmentLength = 1.1;
    const core = new THREE.Mesh(
        new THREE.CylinderGeometry(0.055, 0.055, segmentLength, 8),
        new THREE.MeshBasicMaterial({ color: 0x45aaf2, transparent: true, opacity: 0.95 })
    );
    const glow = new THREE.Mesh(
        new THREE.CylinderGeometry(0.12, 0.12, segmentLength * 1.05, 8),
        new THREE.MeshBasicMaterial({ color: 0x7dcfff, transparent: true, opacity: 0.32 })
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

function fireBullet(w, target, damage) {
    const damageRoll = getWeaponDamageRoll(w, damage);
    const finalDamage = damageRoll.damage;
    const isCrit = damageRoll.isCrit;
    
    if (w.type === 3) {
        // Tesla 激光：创建光柱效果
        const targetPos = target.mesh.position.clone().add(new THREE.Vector3(0, 0.5, 0));
        const startPos = w.mesh.position.clone().add(new THREE.Vector3(0, 2, 0));
        const direction = new THREE.Vector3().subVectors(targetPos, startPos).normalize();
        const distance = startPos.distanceTo(targetPos);
        
        // 创建激光光柱（圆柱体）
        const laserGeo = new THREE.CylinderGeometry(0.15, 0.15, distance, 8);
        const laserMat = new THREE.MeshBasicMaterial({ 
            color: isCrit ? 0xffffff : 0xa55eea,
            transparent: true,
            opacity: isCrit ? 0.92 : 0.8
        });
        const laser = new THREE.Mesh(laserGeo, laserMat);
        
        // 设置激光位置和旋转
        const midPoint = new THREE.Vector3().addVectors(startPos, targetPos).multiplyScalar(0.5);
        laser.position.copy(midPoint);
        laser.lookAt(targetPos);
        laser.rotateX(Math.PI / 2);
        
        scene.add(laser);
        
        // 添加激光发光效果
        const glowGeo = new THREE.CylinderGeometry(0.25, 0.25, distance * 0.9, 8);
        const glowMat = new THREE.MeshBasicMaterial({
            color: isCrit ? 0xfff7b3 : 0xd4a5ff,
            transparent: true,
            opacity: isCrit ? 0.58 : 0.4
        });
        const glow = new THREE.Mesh(glowGeo, glowMat);
        glow.position.copy(midPoint);
        glow.lookAt(targetPos);
        glow.rotateX(Math.PI / 2);
        scene.add(glow);
        
        bullets.push({ 
            mesh: laser,
            glowMesh: glow,
            direction, 
            speed: 0, 
            damage: finalDamage,
            isCrit,
            ownerWeapon: w,
            isTesla: true,
            life: 10, // 激光持续时间（帧数）
            aoeRadius: 3 // AOE 范围
        });
        
        playTone(isCrit ? 980 : 800, 'sawtooth', 0.3, isCrit ? 0.07 : 0.05);
    } else {
        // 普通子弹
        const bulletPos = w.mesh.position.clone().add(new THREE.Vector3(0, w.type === 3 ? 2 : 0.5, 0));
        
        if (w.type === 2) {
            // Rail: 从双炮管交替发射短线段，线段飞行时逐渐减速
            aimWeaponAtTarget(w, target);
            const targetPos = target.mesh.position.clone().add(new THREE.Vector3(0, 0.5, 0));
            const startPos = getRailMuzzlePosition(w);
            const direction = new THREE.Vector3().subVectors(targetPos, startPos).normalize();
            const laser = createRailShotMesh(startPos, direction);
            if (isCrit) {
                laser.children.forEach(child => {
                    if (child.material && child.material.color) child.material.color.setHex(0xffffff);
                    if (child.material) child.material.opacity = Math.min(1, (child.material.opacity || 0.8) + 0.18);
                });
            }
            scene.add(laser);
            
            bullets.push({ 
                mesh: laser,
                direction, 
                speed: 1.45,
                speedDecay: 0.94,
                minSpeed: 0.28,
                damage: finalDamage,
                isCrit,
                ownerWeapon: w,
                isTesla: false,
                isRailProjectile: true,
                life: 34
            });
            
            startWeaponRecoil(w, 0.34, 260);
            
            playTone(isCrit ? 760 : 600, 'square', 0.15, isCrit ? 0.06 : 0.04);
        } else {
            // 其他武器使用球形子弹
            if (w.type === 1) {
                aimWeaponAtTarget(w, target);
                startWeaponRecoil(w, 0.24, 220);
            }
            const bulletGeo = new THREE.SphereGeometry(0.2);
            const bulletMat = new THREE.MeshBasicMaterial({ 
                color: isCrit ? 0xffffff : (w.type === 1 ? 0x26de81 : 0xa55eea)
            });
            const bullet = new THREE.Mesh(bulletGeo, bulletMat);
            bullet.position.copy(bulletPos);
            scene.add(bullet);
            
            const targetPosForBullet = target.mesh.position.clone().add(new THREE.Vector3(0, 0.5, 0));
            const direction = new THREE.Vector3().subVectors(targetPosForBullet, bullet.position).normalize();
            
            bullets.push({ 
                mesh: bullet, 
                direction, 
                speed: 0.8, 
                damage: finalDamage,
                isCrit,
                ownerWeapon: w,
                isTesla: false
            });
            
            playTone(isCrit ? 560 : (w.type === 1 ? 400 : 800), 'square', 0.1, isCrit ? 0.05 : 0.03);
        }
    }
}

// ==================== 敌人创建 ====================
/**
 * 创建机器人敌人（灰色小兵）
 * @param {boolean} isHard - 是否为精英单位（橙色）
 */

