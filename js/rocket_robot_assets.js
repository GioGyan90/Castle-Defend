(function(root) {
    'use strict';

    function getThree(THREERef) {
        const THREE = THREERef || root.THREE;
        if (!THREE) throw new Error('THREE is required to create rocket robot assets.');
        return THREE;
    }

    function createRocketLauncherModel(THREERef) {
        const THREE = getThree(THREERef);
        const group = new THREE.Group();
        const tubeMat = new THREE.MeshPhongMaterial({
            color: 0x1d3345,
            emissive: 0x07141f,
            emissiveIntensity: 0.2,
            flatShading: true,
            shininess: 76
        });
        const shellMat = new THREE.MeshPhongMaterial({
            color: 0xf3fbff,
            emissive: 0x8fdfff,
            emissiveIntensity: 0.08,
            flatShading: true,
            shininess: 72
        });
        const glowMat = new THREE.MeshBasicMaterial({ color: 0x5ce9ff });

        const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, 1.65, 12), tubeMat);
        tube.rotation.x = Math.PI / 2;
        tube.position.z = 0.42;
        group.add(tube);

        const frontRing = new THREE.Mesh(new THREE.CylinderGeometry(0.23, 0.19, 0.18, 12), shellMat);
        frontRing.rotation.x = Math.PI / 2;
        frontRing.position.z = 1.3;
        group.add(frontRing);

        const rearNozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.16, 12), tubeMat);
        rearNozzle.rotation.x = Math.PI / 2;
        rearNozzle.position.z = -0.42;
        group.add(rearNozzle);

        const topSight = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.12, 0.38), shellMat);
        topSight.position.set(0, 0.2, 0.42);
        group.add(topSight);

        const blueLine = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.035, 1.1), glowMat);
        blueLine.position.set(0, 0.03, 0.45);
        group.add(blueLine);

        group.userData.rocketLauncher = true;
        return group;
    }

    function createRocketRobotMaterials(THREERef) {
        const THREE = getThree(THREERef);
        return {
            shell: new THREE.MeshPhongMaterial({
                color: 0xf5fbff,
                emissive: 0x9fdcff,
                emissiveIntensity: 0.08,
                flatShading: true,
                shininess: 82
            }),
            side: new THREE.MeshPhongMaterial({
                color: 0xd7e4ee,
                emissive: 0x315b6c,
                emissiveIntensity: 0.1,
                flatShading: true,
                shininess: 64
            }),
            dark: new THREE.MeshPhongMaterial({
                color: 0x152330,
                emissive: 0x06121b,
                emissiveIntensity: 0.18,
                flatShading: true
            }),
            vest: new THREE.MeshPhongMaterial({
                color: 0x1e3344,
                emissive: 0x07141f,
                emissiveIntensity: 0.22,
                flatShading: true
            }),
            blue: new THREE.MeshPhongMaterial({
                color: 0x39bfff,
                emissive: 0x118dff,
                emissiveIntensity: 0.48,
                transparent: true,
                opacity: 0.78,
                shininess: 92
            }),
            glow: new THREE.MeshBasicMaterial({
                color: 0x73e7ff,
                transparent: true,
                opacity: 0.64
            })
        };
    }

    function createRobotWedge(THREERef, widthBack, widthFront, heightBack, heightFront, depth, material) {
        const THREE = getThree(THREERef);
        const halfBack = widthBack / 2;
        const halfFront = widthFront / 2;
        const zBack = -depth / 2;
        const zFront = depth / 2;
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.Float32BufferAttribute([
            -halfBack, 0, zBack, halfBack, 0, zBack, -halfFront, 0, zFront, halfFront, 0, zFront,
            -halfBack * 0.84, heightBack, zBack, halfBack * 0.84, heightBack, zBack, -halfFront * 0.7, heightFront, zFront, halfFront * 0.7, heightFront, zFront
        ], 3));
        geo.setIndex([
            0, 2, 3, 0, 3, 1,
            4, 5, 7, 4, 7, 6,
            0, 1, 5, 0, 5, 4,
            2, 6, 7, 2, 7, 3,
            0, 4, 6, 0, 6, 2,
            1, 3, 7, 1, 7, 5
        ]);
        geo.computeVertexNormals();
        return new THREE.Mesh(geo, material);
    }

    function createRocketRobotHelmetComponent(THREERef, materials) {
        const THREE = getThree(THREERef);
        const group = new THREE.Group();

        const crown = createRobotWedge(THREE, 1.58, 1.2, 0.82, 0.62, 1.28, materials.shell);
        crown.position.y = 0.82;
        crown.rotation.x = -0.06;
        group.add(crown);

        const jaw = createRobotWedge(THREE, 1.28, 0.92, 0.52, 0.34, 0.88, materials.side);
        jaw.position.set(0, 0.34, 0.08);
        jaw.rotation.x = 0.05;
        group.add(jaw);

        const rearPlate = new THREE.Mesh(new THREE.BoxGeometry(1.42, 0.78, 0.24), materials.shell);
        rearPlate.position.set(0, 0.72, -0.72);
        rearPlate.rotation.x = -0.16;
        group.add(rearPlate);

        const visor = createRobotWedge(THREE, 1.05, 0.78, 0.34, 0.24, 0.12, materials.blue);
        visor.position.set(0, 0.78, 0.73);
        visor.rotation.x = -0.18;
        group.add(visor);

        const visorGlow = createRobotWedge(THREE, 0.86, 0.62, 0.22, 0.16, 0.08, materials.glow);
        visorGlow.position.set(0, 0.83, 0.8);
        visorGlow.rotation.x = -0.18;
        group.add(visorGlow);

        [-1, 1].forEach(side => {
            const cheek = createRobotWedge(THREE, 0.34, 0.22, 0.5, 0.32, 0.84, materials.side);
            cheek.position.set(side * 0.72, 0.42, 0.08);
            cheek.rotation.z = side * -0.18;
            cheek.rotation.y = side * 0.08;
            group.add(cheek);

            const intake = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.32, 0.52), materials.dark);
            intake.position.set(side * 0.79, 0.34, 0.18);
            intake.rotation.z = side * -0.16;
            group.add(intake);

            const fin = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.18, 0.76), materials.shell);
            fin.position.set(side * 0.52, 1.32, -0.08);
            fin.rotation.y = side * 0.18;
            fin.rotation.z = side * -0.08;
            group.add(fin);
        });

        const crest = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.18, 1.18), materials.shell);
        crest.position.set(0, 1.46, -0.05);
        crest.rotation.x = -0.08;
        group.add(crest);

        group.userData.visor = visor;
        group.userData.visorGlow = visorGlow;
        return group;
    }

    function createRocketRobotTorsoComponent(THREERef, materials) {
        const THREE = getThree(THREERef);
        const group = new THREE.Group();

        const vestBack = createRobotWedge(THREE, 1.55, 1.35, 1.72, 1.52, 0.34, materials.vest);
        vestBack.position.set(0, 0.52, -0.45);
        vestBack.rotation.x = -0.05;
        group.add(vestBack);

        const chest = createRobotWedge(THREE, 1.58, 1.26, 1.5, 1.24, 0.78, materials.shell);
        chest.position.set(0, 0.72, 0.08);
        chest.rotation.x = -0.08;
        group.add(chest);

        const sternum = createRobotWedge(THREE, 0.54, 0.42, 1.12, 0.86, 0.12, materials.blue);
        sternum.position.set(0, 0.92, 0.53);
        sternum.rotation.x = -0.1;
        group.add(sternum);

        const sternumGlow = createRobotWedge(THREE, 0.34, 0.24, 0.72, 0.54, 0.08, materials.glow);
        sternumGlow.position.set(0, 1.08, 0.61);
        sternumGlow.rotation.x = -0.1;
        group.add(sternumGlow);

        const abdomen = createRobotWedge(THREE, 1.05, 0.86, 0.72, 0.58, 0.56, materials.side);
        abdomen.position.set(0, 0.05, 0.08);
        abdomen.rotation.x = 0.05;
        group.add(abdomen);

        const pelvis = createRobotWedge(THREE, 1.28, 1.02, 0.52, 0.38, 0.72, materials.shell);
        pelvis.position.set(0, -0.54, 0.04);
        pelvis.rotation.x = 0.08;
        group.add(pelvis);

        [-1, 1].forEach(side => {
            const shoulderRoot = new THREE.Group();
            shoulderRoot.position.set(side * 1.02, 1.86, 0.02);
            shoulderRoot.rotation.z = side * -0.16;
            group.add(shoulderRoot);

            const shoulder = createRobotWedge(THREE, 0.72, 0.54, 0.34, 0.24, 0.9, materials.shell);
            shoulder.rotation.y = side * 0.18;
            shoulder.rotation.z = side * 0.08;
            shoulderRoot.add(shoulder);

            const shoulderEdge = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.08, 0.76), materials.blue);
            shoulderEdge.position.set(0, 0.24, 0.08);
            shoulderEdge.rotation.z = side * -0.08;
            shoulderRoot.add(shoulderEdge);
        });

        [-0.34, 0.34].forEach(x => {
            const tank = new THREE.Group();
            tank.position.set(x, 0.6, -1.18);
            const cylinder = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 1.28, 12), materials.side);
            cylinder.position.y = 0.08;
            tank.add(cylinder);
            const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 0.16, 12), materials.shell);
            cap.position.y = 0.8;
            tank.add(cap);
            group.add(tank);
        });

        group.userData.sternum = sternum;
        group.userData.sternumGlow = sternumGlow;
        return group;
    }

    function createRocketRobotLimbRod(THREERef, length, width, materials, label) {
        const THREE = getThree(THREERef);
        const segment = new THREE.Group();
        segment.name = label;
        const beam = new THREE.Mesh(new THREE.BoxGeometry(width, length, width * 0.7), materials.frame || materials.side);
        beam.position.y = -length / 2;
        segment.add(beam);
        [-1, 1].forEach(side => {
            const rail = new THREE.Mesh(new THREE.BoxGeometry(width * 0.16, length * 0.84, width * 0.16), materials.dark);
            rail.position.set(side * width * 0.42, -length / 2, width * 0.38);
            segment.add(rail);
        });
        const glowStrip = new THREE.Mesh(new THREE.BoxGeometry(width * 0.72, length * 0.55, width * 0.08), materials.blue);
        glowStrip.position.set(0, -length / 2, width * 0.42);
        segment.add(glowStrip);
        return segment;
    }

    function createRocketRobotHexJoint(THREERef, radius, depth, materials) {
        const THREE = getThree(THREERef);
        const joint = new THREE.Group();
        const core = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, depth, 6), materials.blue);
        core.rotation.x = Math.PI / 2;
        joint.add(core);
        const cap = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.58, radius * 0.58, depth * 1.12, 6), materials.dark);
        cap.rotation.x = Math.PI / 2;
        joint.add(cap);
        return joint;
    }

    function createRocketRobotArmComponent(THREERef, materials, side) {
        const THREE = getThree(THREERef);
        const group = new THREE.Group();
        const shoulderPivot = new THREE.Group();
        shoulderPivot.rotation.z = side * -0.2;
        shoulderPivot.rotation.x = side > 0 ? -1.02 : -0.74;
        group.add(shoulderPivot);
        shoulderPivot.add(createRocketRobotHexJoint(THREE, 0.22, 0.24, materials));

        const upperArm = createRocketRobotLimbRod(THREE, 0.78, 0.2, materials, 'upper-arm');
        shoulderPivot.add(upperArm);
        const elbowPivot = new THREE.Group();
        elbowPivot.position.y = -0.78;
        elbowPivot.rotation.z = side > 0 ? 0.36 : 0.52;
        elbowPivot.rotation.x = side > 0 ? -0.34 : -0.58;
        shoulderPivot.add(elbowPivot);
        elbowPivot.add(createRocketRobotHexJoint(THREE, 0.18, 0.22, materials));

        const forearm = createRocketRobotLimbRod(THREE, 0.62, 0.17, materials, 'forearm');
        elbowPivot.add(forearm);
        const hand = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.16, 0.22), materials.side);
        hand.position.set(0, -0.7, 0.12);
        elbowPivot.add(hand);

        group.userData = {
            shoulderPivot,
            elbowPivot,
            hand,
            shoulderAngleX: shoulderPivot.rotation.x,
            shoulderAngleZ: shoulderPivot.rotation.z,
            elbowAngleX: elbowPivot.rotation.x,
            elbowAngleZ: elbowPivot.rotation.z
        };
        return group;
    }

    function createRocketRobotLegComponent(THREERef, materials, side) {
        const THREE = getThree(THREERef);
        const group = new THREE.Group();
        const hipPivot = new THREE.Group();
        hipPivot.rotation.z = side * 0.08;
        group.add(hipPivot);
        hipPivot.add(createRocketRobotHexJoint(THREE, 0.2, 0.24, materials));

        const thigh = createRocketRobotLimbRod(THREE, 0.82, 0.22, materials, 'thigh');
        hipPivot.add(thigh);

        const kneePivot = new THREE.Group();
        kneePivot.position.y = -0.82;
        kneePivot.rotation.z = side * -0.14;
        hipPivot.add(kneePivot);
        kneePivot.add(createRocketRobotHexJoint(THREE, 0.18, 0.22, materials));

        const shin = createRocketRobotLimbRod(THREE, 0.72, 0.19, materials, 'shin');
        kneePivot.add(shin);

        const anklePivot = new THREE.Group();
        anklePivot.position.y = -0.72;
        anklePivot.rotation.z = side * 0.08;
        kneePivot.add(anklePivot);
        anklePivot.add(createRocketRobotHexJoint(THREE, 0.15, 0.2, materials));

        const foot = new THREE.Group();
        foot.position.set(0.03 * side, -0.08, 0.26);
        const sole = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.12, 0.52), materials.side);
        sole.position.z = 0.1;
        foot.add(sole);
        [-0.12, 0, 0.12].forEach(x => {
            const toe = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.28), materials.side);
            toe.position.set(x, -0.02, 0.42);
            toe.rotation.y = -x * 0.8;
            foot.add(toe);
        });
        anklePivot.add(foot);

        group.userData = {
            hipPivot,
            kneePivot,
            anklePivot,
            foot,
            hipAngle: hipPivot.rotation.z,
            kneeAngle: kneePivot.rotation.z,
            ankleAngle: anklePivot.rotation.z
        };
        return group;
    }

    function createRocketRobotModel(THREERef) {
        const THREE = getThree(THREERef);
        const group = new THREE.Group();
        const bodyRoot = new THREE.Group();
        bodyRoot.name = 'rocket-robot-grounded-root';
        group.add(bodyRoot);
        const materials = createRocketRobotMaterials(THREE);
        const upperBody = new THREE.Group();
        upperBody.name = 'rocket-robot-upper-body';
        bodyRoot.add(upperBody);

        const torso = createRocketRobotTorsoComponent(THREE, materials);
        torso.position.set(0, 0.78, 0);
        torso.scale.setScalar(0.52);
        upperBody.add(torso);

        const helmet = createRocketRobotHelmetComponent(THREE, materials);
        helmet.position.set(0, 1.72, 0.05);
        helmet.scale.setScalar(0.42);
        upperBody.add(helmet);

        const leftArm = createRocketRobotArmComponent(THREE, materials, -1);
        leftArm.position.set(-0.58, 1.52, 0.18);
        upperBody.add(leftArm);

        const rightArm = createRocketRobotArmComponent(THREE, materials, 1);
        rightArm.position.set(0.58, 1.54, 0.1);
        upperBody.add(rightArm);

        const leftLeg = createRocketRobotLegComponent(THREE, materials, -1);
        leftLeg.position.set(-0.23, 0.58, 0);
        bodyRoot.add(leftLeg);

        const rightLeg = createRocketRobotLegComponent(THREE, materials, 1);
        rightLeg.position.set(0.23, 0.58, 0);
        bodyRoot.add(rightLeg);

        const launcherPivot = new THREE.Group();
        launcherPivot.position.set(0, 1.6, 0.12);
        const launcher = createRocketLauncherModel(THREE);
        launcher.position.set(0.46, 0.16, 0.54);
        launcher.rotation.z = -0.08;
        launcher.scale.setScalar(0.82);
        launcherPivot.add(launcher);
        upperBody.add(launcherPivot);

        const muzzleMarker = new THREE.Object3D();
        muzzleMarker.position.set(0.44, 1.78, 1.05);
        upperBody.add(muzzleMarker);

        const frontGrip = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.34, 0.12), materials.dark);
        frontGrip.position.set(0.35, 1.28, 0.82);
        frontGrip.rotation.x = -0.75;
        upperBody.add(frontGrip);

        const rearGrip = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.3, 0.12), materials.dark);
        rearGrip.position.set(0.56, 1.36, 0.32);
        rearGrip.rotation.x = -0.55;
        upperBody.add(rearGrip);

        const leftGripHand = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.16, 0.24), materials.side);
        leftGripHand.position.set(0.32, 1.2, 0.82);
        leftGripHand.rotation.x = -0.58;
        upperBody.add(leftGripHand);

        const rightGripHand = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.16, 0.24), materials.side);
        rightGripHand.position.set(0.54, 1.27, 0.34);
        rightGripHand.rotation.x = -0.48;
        upperBody.add(rightGripHand);

        bodyRoot.updateMatrixWorld(true);
        const footBox = new THREE.Box3().setFromObject(bodyRoot);
        bodyRoot.position.y += Math.max(0, -footBox.min.y + 0.04);

        group.userData = {
            rocketRobot: true,
            bodyRoot,
            upperBody,
            turretGroup: launcherPivot,
            barrelGroup: launcher,
            barrelBaseZ: 0,
            muzzleOffset: new THREE.Vector3(0.44, 1.78, 1.05),
            muzzleObject: muzzleMarker,
            chestGlow: torso.userData.sternum,
            chestGlow2: torso.userData.sternumGlow,
            visor: helmet.userData.visor,
            visorGlow: helmet.userData.visorGlow,
            leftArm,
            rightArm,
            leftLeg,
            rightLeg,
            frontGrip,
            rearGrip,
            leftGripHand,
            rightGripHand,
            forceGripPose: true,
            lastAimTime: 0,
            hasPhysics: false
        };
        group.scale.setScalar(0.48);
        return group;
    }

    function setRocketRobotAimYaw(model, yaw, time) {
        if (!model || !model.userData || !model.userData.upperBody) return false;
        model.userData.upperBody.rotation.y = yaw;
        model.userData.lastAimTime = Number.isFinite(time) ? time : performance.now();
        model.userData.isAiming = true;
        return true;
    }

    function animateRocketRobotModel(model, time, amplitude) {
        if (!Number.isFinite(model.userData.baseY)) {
            model.userData.baseY = model.position.y;
        }
        const pulse = Math.sin(time * 0.004) * 0.5 + 0.5;
        if (model.userData.chestGlow && model.userData.chestGlow.material) {
            model.userData.chestGlow.material.emissiveIntensity = 0.36 + pulse * 0.18 * amplitude;
        }
        if (model.userData.visor && model.userData.visor.material) {
            model.userData.visor.material.emissiveIntensity = 0.38 + pulse * 0.22 * amplitude;
        }
        if (model.userData.visorGlow && model.userData.visorGlow.material) {
            model.userData.visorGlow.material.opacity = 0.54 + pulse * 0.18 * amplitude;
        }
        if (model.userData.chestGlow2 && model.userData.chestGlow2.material) {
            model.userData.chestGlow2.material.opacity = 0.54 + pulse * 0.16 * amplitude;
        }

        const walkAmount = model.userData.walkAmount || 0;
        const step = Math.sin(time * 0.007);
        [model.userData.leftLeg, model.userData.rightLeg].forEach((leg, index) => {
            if (!leg || !leg.userData) return;
            const sideStep = index === 0 ? step : -step;
            if (leg.userData.hipPivot) leg.userData.hipPivot.rotation.x = sideStep * 0.35 * walkAmount;
            if (leg.userData.kneePivot) leg.userData.kneePivot.rotation.x = Math.max(0, -sideStep) * 0.46 * walkAmount;
            if (leg.userData.anklePivot) leg.userData.anklePivot.rotation.x = Math.max(0, sideStep) * -0.24 * walkAmount;
        });
        const aimFresh = time - (model.userData.lastAimTime || 0) < 420;
        const holdingLauncher = model.userData.forceGripPose || aimFresh;
        if (model.userData.upperBody && !aimFresh) {
            model.userData.upperBody.rotation.y += (0 - model.userData.upperBody.rotation.y) * 0.08;
        }
        [model.userData.leftArm, model.userData.rightArm].forEach((arm, index) => {
            if (!arm || !arm.userData) return;
            const sideStep = index === 0 ? -step : step;
            if (arm.userData.shoulderPivot) {
                arm.userData.shoulderPivot.rotation.x = arm.userData.shoulderAngleX + (holdingLauncher ? 0 : sideStep * 0.12 * walkAmount);
            }
            if (arm.userData.elbowPivot) {
                arm.userData.elbowPivot.rotation.x = arm.userData.elbowAngleX + (holdingLauncher ? 0 : Math.abs(step) * 0.08 * walkAmount);
            }
        });
        model.position.y = model.userData.baseY + Math.sin(time * 0.003) * 0.025 * amplitude + Math.abs(step) * 0.025 * walkAmount;
    }

    root.createRocketLauncherModel = createRocketLauncherModel;
    root.createRocketRobotModel = createRocketRobotModel;
    root.setRocketRobotAimYaw = setRocketRobotAimYaw;
    root.animateRocketRobotModel = animateRocketRobotModel;
})(typeof window !== 'undefined' ? window : globalThis);
