// Player weapon models and projectile logic.
function createSeatedRobotPilot(scale = 1) {
    const pilot = new THREE.Group();
    const bodyMat = new THREE.MeshPhongMaterial({ color: 0x95a5a6, flatShading: true });
    const jointMat = new THREE.MeshPhongMaterial({ color: 0x555555, flatShading: true });
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x00ff00 });

    const body = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.34, 0.22), bodyMat);
    body.position.y = 0.34;
    pilot.add(body);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 10), bodyMat);
    head.position.y = 0.62;
    pilot.add(head);

    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 8), eyeMat);
    eye.position.set(0, 0.63, 0.13);
    pilot.add(eye);

    const createArm = (side) => {
        const arm = new THREE.Group();
        const upper = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.032, 0.18, 8), bodyMat);
        upper.position.y = -0.08;
        const forearm = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.026, 0.16, 8), jointMat);
        forearm.position.set(0, -0.19, 0.04);
        forearm.rotation.x = 0.8;
        arm.add(upper, forearm);
        arm.position.set(side * 0.2, 0.42, 0.02);
        arm.rotation.z = side * 0.32;
        return arm;
    };

    const createLeg = (side) => {
        const leg = new THREE.Group();
        const thigh = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.035, 0.2, 8), bodyMat);
        thigh.rotation.x = Math.PI / 2;
        thigh.position.z = 0.09;
        const shin = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.03, 0.18, 8), jointMat);
        shin.rotation.x = 0.25;
        shin.position.set(0, -0.12, 0.2);
        leg.add(thigh, shin);
        leg.position.set(side * 0.09, 0.18, 0.06);
        return leg;
    };

    pilot.add(createArm(-1), createArm(1), createLeg(-1), createLeg(1));
    pilot.scale.setScalar(scale);
    return pilot;
}

function createSlopedPilotSeat(material) {
    const seatGeometry = new THREE.BufferGeometry();
    seatGeometry.setAttribute('position', new THREE.Float32BufferAttribute([
        -0.28, 0.00, -0.22,   0.28, 0.00, -0.22,  -0.28, 0.00, 0.22,   0.28, 0.00, 0.22,
        -0.28, 0.34, -0.22,   0.28, 0.34, -0.22,  -0.28, 0.08, 0.22,   0.28, 0.08, 0.22
    ], 3));
    seatGeometry.setIndex([
        0, 2, 3, 0, 3, 1,
        4, 5, 7, 4, 7, 6,
        0, 1, 5, 0, 5, 4,
        2, 6, 7, 2, 7, 3,
        0, 4, 6, 0, 6, 2,
        1, 3, 7, 1, 7, 5
    ]);
    seatGeometry.computeVertexNormals();
    return new THREE.Mesh(seatGeometry, material);
}

function createWeaponModel(type) {
    const g = new THREE.Group();
    if (type === 1) {
        // 脉冲炮
        const pulseGreenMat = new THREE.MeshPhongMaterial({
            color: 0x26de81,
            emissive: 0x0f5f3f,
            emissiveIntensity: 0.18,
            shininess: 45
        });
        const pulseDarkMat = new THREE.MeshPhongMaterial({
            color: 0x2f3a3f,
            emissive: 0x111719,
            emissiveIntensity: 0.12,
            shininess: 35
        });

        const base = new THREE.Mesh(
            new THREE.CylinderGeometry(0.62, 0.78, 0.46, 8),
            pulseDarkMat
        );
        base.position.y = 0.23;
        g.add(base);

        const topCylinder = new THREE.Mesh(
            new THREE.CylinderGeometry(0.42, 0.48, 0.34, 20),
            pulseGreenMat
        );
        topCylinder.position.y = 0.63;
        g.add(topCylinder);

        const turretBand = new THREE.Mesh(
            new THREE.CylinderGeometry(0.49, 0.51, 0.08, 20),
            pulseDarkMat
        );
        turretBand.position.y = 0.47;
        g.add(turretBand);

        const turretGroup = new THREE.Group();
        g.add(turretGroup);
        g.userData.turretGroup = turretGroup;

        const barrelGroup = new THREE.Group();
        barrelGroup.position.set(0, 0.66, 0);
        turretGroup.add(barrelGroup);
        g.userData.barrelGroup = barrelGroup;
        g.userData.barrelBaseZ = 0;

        const barrel = new THREE.Mesh(
            new THREE.CylinderGeometry(0.13, 0.16, 1.1, 16),
            pulseDarkMat
        );
        barrel.rotation.x = Math.PI / 2;
        barrel.position.z = 0.56;

        const muzzle = new THREE.Mesh(
            new THREE.CylinderGeometry(0.18, 0.14, 0.18, 16),
            pulseGreenMat
        );
        muzzle.rotation.x = Math.PI / 2;
        muzzle.position.z = 1.16;

        const barrelCollar = new THREE.Mesh(
            new THREE.CylinderGeometry(0.2, 0.22, 0.2, 16),
            pulseGreenMat
        );
        barrelCollar.rotation.x = Math.PI / 2;
        barrelCollar.position.z = 0.08;

        barrelGroup.add(barrelCollar, barrel, muzzle);

        const pilot = createSeatedRobotPilot(1.08);
        pilot.position.set(0, 0.76, -0.18);
        const seat = createSlopedPilotSeat(pulseDarkMat);
        seat.position.set(0, 0.72, -0.42);
        turretGroup.add(pilot);
        turretGroup.add(seat);
    } else if (type === 2) {
        // 轨道炮 - 带可活动的炮管组件用于后坐力动画
        const railDarkMat = new THREE.MeshPhongMaterial({
            color: 0x2f3a3f,
            emissive: 0x111719,
            emissiveIntensity: 0.12,
            shininess: 35
        });
        const railBodyMat = new THREE.MeshPhongMaterial({
            color: 0x40505a,
            emissive: 0x14212a,
            emissiveIntensity: 0.14,
            shininess: 45
        });
        const railBlueMat = new THREE.MeshPhongMaterial({
            color: 0x45aaf2,
            emissive: 0x0b4d76,
            emissiveIntensity: 0.22,
            shininess: 60
        });

        const base = new THREE.Mesh(
            new THREE.CylinderGeometry(0.62, 0.78, 0.38, 8),
            railDarkMat
        );
        base.position.y = 0.19;
        g.add(base);

        const turretBody = new THREE.Mesh(
            new THREE.BoxGeometry(1.18, 0.28, 0.78),
            railBodyMat
        );
        turretBody.position.y = 0.52;
        turretBody.position.z = 0.08;
        g.add(turretBody);

        const turretGroup = new THREE.Group();
        g.add(turretGroup);
        g.userData.turretGroup = turretGroup;

        const shellGeometry = new THREE.BufferGeometry();
        shellGeometry.setAttribute('position', new THREE.Float32BufferAttribute([
            -0.43, 0.00, -0.30,   0.43, 0.00, -0.30,  -0.43, 0.42, -0.30,   0.43, 0.42, -0.30,
            -0.43, 0.00,  0.50,   0.43, 0.00,  0.50,  -0.43, 0.10,  0.50,   0.43, 0.10,  0.50
        ], 3));
        shellGeometry.setIndex([
            0, 4, 5, 0, 5, 1,
            2, 3, 7, 2, 7, 6,
            0, 1, 3, 0, 3, 2,
            4, 6, 7, 4, 7, 5,
            0, 2, 6, 0, 6, 4,
            1, 5, 7, 1, 7, 3
        ]);
        shellGeometry.computeVertexNormals();
        const railShell = new THREE.Mesh(shellGeometry, railBlueMat);
        railShell.position.set(0, 0.66, 0.08);
        railShell.rotation.y = -0.04;
        turretGroup.add(railShell);

        const shellBrace = new THREE.Mesh(
            new THREE.BoxGeometry(0.16, 0.42, 0.12),
            railBlueMat
        );
        shellBrace.position.set(-0.35, 0.88, -0.20);
        shellBrace.rotation.z = -0.14;
        shellBrace.rotation.y = -0.04;
        turretGroup.add(shellBrace);
        
        // 炮管组（用于后坐力动画）
        const barrelGroup = new THREE.Group();
        barrelGroup.position.set(0, 0.68, 0.08);
        turretGroup.add(barrelGroup);
        g.userData.barrelGroup = barrelGroup;
        g.userData.barrelBaseZ = 0;
        
        const createRailBarrel = (xOffset) => {
            const railBarrel = new THREE.Mesh(
                new THREE.CylinderGeometry(0.085, 0.105, 1.18, 16),
                railDarkMat
            );
            railBarrel.rotation.x = Math.PI / 2;
            railBarrel.position.set(xOffset, 0, 0.62);

            const railEmitter = new THREE.Mesh(
                new THREE.CylinderGeometry(0.12, 0.09, 0.16, 16),
                railBlueMat
            );
            railEmitter.rotation.x = Math.PI / 2;
            railEmitter.position.set(xOffset, 0, 1.25);

            const railSocket = new THREE.Mesh(
                new THREE.BoxGeometry(0.24, 0.18, 0.18),
                railBodyMat
            );
            railSocket.position.set(xOffset, 0, 0.08);

            barrelGroup.add(railSocket, railBarrel, railEmitter);
        };

        createRailBarrel(0.25);
        createRailBarrel(-0.25);

        const pilot = createSeatedRobotPilot(1.05);
        pilot.position.set(0, 0.8, -0.46);
        const seat = createSlopedPilotSeat(railDarkMat);
        seat.position.set(0, 0.68, -0.68);
        turretGroup.add(pilot);
        turretGroup.add(seat);
    } else if (type === 3) {
        // 特斯拉线圈
        const teslaDarkMat = new THREE.MeshPhongMaterial({
            color: 0x2b2732,
            emissive: 0x100b18,
            emissiveIntensity: 0.12,
            shininess: 30,
            flatShading: true
        });
        const teslaMidMat = new THREE.MeshPhongMaterial({
            color: 0x5f4d73,
            emissive: 0x251633,
            emissiveIntensity: 0.16,
            shininess: 38,
            flatShading: true
        });
        const teslaLightMat = new THREE.MeshPhongMaterial({
            color: 0x9b7bd0,
            emissive: 0x3a1f5a,
            emissiveIntensity: 0.18,
            shininess: 52,
            flatShading: true
        });
        const crystalMat = new THREE.MeshPhongMaterial({
            color: 0xd9d0ff,
            emissive: 0x000000,
            specular: 0xffffff,
            shininess: 90,
            flatShading: true
        });

        const baseGroup = new THREE.Group();
        const baseCore = new THREE.Mesh(
            new THREE.CylinderGeometry(0.74, 0.98, 0.36, 7),
            teslaDarkMat
        );
        baseCore.position.y = 0.18;
        baseCore.rotation.y = 0.22;
        baseGroup.add(baseCore);

        const baseCap = new THREE.Mesh(
            new THREE.CylinderGeometry(0.54, 0.72, 0.16, 5),
            teslaMidMat
        );
        baseCap.position.set(-0.06, 0.44, 0.04);
        baseCap.rotation.y = -0.35;
        baseGroup.add(baseCap);

        const createBaseFang = (angle, width, length, colorMat) => {
            const fang = new THREE.Mesh(
                new THREE.BoxGeometry(width, 0.16, length),
                colorMat
            );
            fang.position.set(Math.sin(angle) * 0.58, 0.22, Math.cos(angle) * 0.58);
            fang.rotation.y = angle + Math.PI / 2;
            fang.rotation.z = (Math.sin(angle * 2.1) * 0.12);
            baseGroup.add(fang);
        };
        createBaseFang(0.2, 0.34, 0.72, teslaMidMat);
        createBaseFang(2.15, 0.26, 0.58, teslaDarkMat);
        createBaseFang(4.35, 0.3, 0.66, teslaLightMat);
        g.add(baseGroup);

        const chargeBar = new THREE.Group();
        const chargeSegments = [];
        const ringRadius = 0.88;
        const teslaMaxCharge = getWeaponConfig(3).teslaMaxCharge;
        for (let i = 0; i < teslaMaxCharge; i++) {
            const angle = (Math.PI * 2 * i) / teslaMaxCharge;
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

        const towerGroup = new THREE.Group();
        towerGroup.position.set(-0.08, 0.56, 0.02);
        towerGroup.rotation.z = -0.24;
        towerGroup.rotation.x = 0.08;

        const t = new THREE.Mesh(
            new THREE.CylinderGeometry(0.24, 0.43, 1.55, 4),
            teslaMidMat
        );
        t.rotation.y = Math.PI / 4;
        t.position.y = 0.78;

        const towerEdge1 = new THREE.Mesh(
            new THREE.BoxGeometry(0.1, 1.45, 0.12),
            teslaDarkMat
        );
        towerEdge1.position.set(0.28, 0.76, 0.18);
        towerEdge1.rotation.z = 0.08;

        const towerEdge2 = new THREE.Mesh(
            new THREE.BoxGeometry(0.09, 1.28, 0.1),
            teslaLightMat
        );
        towerEdge2.position.set(-0.24, 0.86, -0.14);
        towerEdge2.rotation.z = -0.06;

        const c = new THREE.Mesh(
            new THREE.OctahedronGeometry(0.48),
            crystalMat
        );
        c.position.set(0.18, 1.82, -0.08);
        c.rotation.set(0.42, 0.25, -0.38);
        c.scale.set(0.82, 1.18, 0.72);
        c.userData.baseScale = c.scale.clone();

        const crown = new THREE.Mesh(
            new THREE.CylinderGeometry(0.32, 0.42, 0.18, 5),
            teslaDarkMat
        );
        crown.position.set(0.08, 1.56, -0.02);
        crown.rotation.y = 0.42;

        towerGroup.add(t, towerEdge1, towerEdge2, crown, c);
        g.add(towerGroup);
        g.userData.crystal = c;
        g.userData.teslaCharge = 0;
        g.userData.teslaMaxCharge = teslaMaxCharge;
        g.userData.teslaChargeSegments = chargeSegments;
        
        // 击杀数数字标签机制已移除
    } else if (type === 4) {
        const baseMat = new THREE.MeshPhongMaterial({
            color: 0x22313f,
            emissive: 0x06121c,
            emissiveIntensity: 0.22,
            shininess: 55,
            flatShading: true
        });
        const yellowMat = new THREE.MeshPhongMaterial({
            color: 0xf7d94c,
            emissive: 0x5d4300,
            emissiveIntensity: 0.24,
            shininess: 70,
            flatShading: true
        });
        const redMat = new THREE.MeshPhongMaterial({
            color: 0xff5e57,
            emissive: 0x5f120c,
            emissiveIntensity: 0.3,
            shininess: 50,
            flatShading: true
        });
        const whiteMat = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.86,
            side: THREE.DoubleSide
        });

        const target = new THREE.Mesh(
            new THREE.RingGeometry(0.54, 0.64, 6),
            whiteMat
        );
        target.rotation.x = -Math.PI / 2;
        target.position.y = 0.02;
        g.add(target);

        const targetLineA = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.035, 0.08), yellowMat);
        const targetLineB = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.035, 1.45), yellowMat);
        targetLineA.position.y = 0.05;
        targetLineB.position.y = 0.055;
        g.add(targetLineA, targetLineB);

        const bomb = new THREE.Group();
        const body = new THREE.Mesh(
            new THREE.CylinderGeometry(0.17, 0.22, 0.9, 14),
            baseMat
        );
        body.position.y = 0.92;
        const nose = new THREE.Mesh(
            new THREE.ConeGeometry(0.18, 0.34, 14),
            redMat
        );
        nose.position.y = 1.54;
        const tail = new THREE.Mesh(
            new THREE.ConeGeometry(0.2, 0.28, 14),
            yellowMat
        );
        tail.rotation.x = Math.PI;
        tail.position.y = 0.28;
        bomb.add(body, nose, tail);

        for (let i = 0; i < 4; i++) {
            const fin = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.22, 0.28), redMat);
            fin.position.set(Math.sin(i * Math.PI / 2) * 0.2, 0.38, Math.cos(i * Math.PI / 2) * 0.2);
            fin.rotation.y = i * Math.PI / 2;
            bomb.add(fin);
        }

        bomb.rotation.z = -0.2;
        bomb.position.set(0.1, 0.05, 0.05);
        g.add(bomb);

        const blast = new THREE.Mesh(
            new THREE.OctahedronGeometry(0.32),
            new THREE.MeshPhongMaterial({
                color: 0xffaa00,
                emissive: 0xff4d00,
                emissiveIntensity: 0.35,
                shininess: 25,
                flatShading: true
            })
        );
        blast.position.set(-0.42, 0.24, 0.38);
        blast.scale.set(1.15, 0.55, 1.15);
        g.add(blast);
    }
    return g;
}

// ==================== 子弹发射函数 ====================
function updateTeslaChargeBar(model, time = 0) {
    const segments = model.userData.teslaChargeSegments;
    if (!segments) return;

    const charge = model.userData.teslaCharge || 0;
    const maxCharge = model.userData.teslaMaxCharge || getWeaponConfig(3).teslaMaxCharge;
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
    const maxCharge = w.mesh.userData.teslaMaxCharge || getWeaponConfig(3).teslaMaxCharge;
    w.mesh.userData.teslaCharge = Math.min(maxCharge, (w.mesh.userData.teslaCharge || 0) + 1);
    updateTeslaChargeBar(w.mesh);
}

function registerWeaponKill(b) {
    if (b && b.ownerWeapon && b.ownerWeapon.type === 3) {
        chargeTeslaWeapon(b.ownerWeapon);
    }
}

function getWeaponCardDamageBonus(w) {
    return typeof getCardDamageBonus === 'function' ? getCardDamageBonus(w) : 0;
}

function getTeslaBaseDamage(w) {
    const config = getWeaponConfig(3);
    const charge = w.mesh.userData.teslaCharge || 0;
    const maxCharge = w.mesh.userData.teslaMaxCharge || config.teslaMaxCharge;
    const fullChargeBonus = charge >= maxCharge ? config.teslaFullChargeBonus : 0;
    return config.damage + charge * config.teslaChargeDamage + fullChargeBonus + getWeaponCardDamageBonus(w);
}

function getWeaponDamageRoll(w, fallbackDamage) {
    let normalDamage = fallbackDamage;
    let critDamage = fallbackDamage;
    let critRate = 0;
    const config = getWeaponConfig(w.type);

    if (w.type === 1) {
        normalDamage = config.damage;
        critDamage = config.critDamage;
        critRate = config.critRate;
    } else if (w.type === 2) {
        normalDamage = config.damage;
        critDamage = config.critDamage;
        critRate = config.critRate;
    } else if (w.type === 3) {
        normalDamage = getTeslaBaseDamage(w);
        critDamage = normalDamage + config.critDamageBonus;
        critRate = config.critRate;
    }

    if (w.type === 1 || w.type === 2) {
        const cardBonus = getWeaponCardDamageBonus(w);
        normalDamage += cardBonus;
        critDamage += cardBonus;
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
    const aimGroup = w.mesh.userData.turretGroup || w.mesh.userData.barrelGroup;
    if (!aimGroup) return;
    const dx = target.mesh.position.x - w.mesh.position.x;
    const dz = target.mesh.position.z - w.mesh.position.z;
    aimGroup.rotation.y = Math.atan2(dx, dz);
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
    const aimGroup = w.mesh.userData.turretGroup || barrelGroup;
    const shotIndex = w.railShotIndex || 0;
    const side = shotIndex % 2 === 0 ? -1 : 1;
    w.railShotIndex = shotIndex + 1;

    const yaw = aimGroup ? aimGroup.rotation.y : 0;
    const recoilZ = barrelGroup ? barrelGroup.position.z : 0;
    const right = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw));
    const forward = new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw));
    return w.mesh.position.clone()
        .add(new THREE.Vector3(0, 0.68, 0))
        .add(right.multiplyScalar(side * 0.25))
        .add(forward.multiplyScalar(1.33 + recoilZ));
}

function getPulseMuzzlePosition(w) {
    if (w.mesh.userData.muzzleObject && typeof w.mesh.userData.muzzleObject.getWorldPosition === 'function') {
        return w.mesh.userData.muzzleObject.getWorldPosition(new THREE.Vector3());
    }
    if (w.mesh.userData.muzzleOffset) {
        return w.mesh.localToWorld(w.mesh.userData.muzzleOffset.clone());
    }
    const barrelGroup = w.mesh.userData.barrelGroup;
    const aimGroup = w.mesh.userData.turretGroup || barrelGroup;
    const yaw = aimGroup ? aimGroup.rotation.y : 0;
    const recoilZ = barrelGroup ? barrelGroup.position.z : 0;
    const forward = new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw));
    return w.mesh.position.clone()
        .add(new THREE.Vector3(0, 0.66, 0))
        .add(forward.multiplyScalar(1.18 + recoilZ));
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
    const weaponConfig = getWeaponConfig(w.type);
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
            life: weaponConfig.teslaLifeFrames,
            aoeRadius: weaponConfig.teslaAoeRadius,
            teslaFrameDamageRatio: weaponConfig.teslaFrameDamageRatio
        });
        
        playTone(isCrit ? 980 : 800, 'sawtooth', 0.3, isCrit ? 0.07 : 0.05);
    } else {
        // 普通子弹
        let bulletPos = w.mesh.position.clone().add(new THREE.Vector3(0, w.type === 3 ? 2 : 0.5, 0));
        
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
                speed: weaponConfig.projectileSpeed,
                speedDecay: weaponConfig.projectileSpeedDecay,
                minSpeed: weaponConfig.projectileMinSpeed,
                damage: finalDamage,
                isCrit,
                ownerWeapon: w,
                isTesla: false,
                isRailProjectile: true,
                life: weaponConfig.projectileLife
            });
            
            startWeaponRecoil(w, 0.34, 260);
            
            playTone(isCrit ? 760 : 600, 'square', 0.15, isCrit ? 0.06 : 0.04);
        } else {
            // 其他武器使用球形子弹
            if (w.type === 1) {
                if (typeof w.aimAtTarget === 'function') {
                    w.aimAtTarget(target);
                } else {
                    aimWeaponAtTarget(w, target);
                }
                startWeaponRecoil(w, 0.24, 220);
                bulletPos = getPulseMuzzlePosition(w);
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
                speed: weaponConfig.projectileSpeed, 
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

