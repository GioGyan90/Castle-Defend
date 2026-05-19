(function(global) {
    'use strict';

    function safeBuild(builder) {
        try {
            return builder();
        } catch (error) {
            console.warn('Animation showcase asset failed to build:', error);
            return createFallbackModel();
        }
    }

    function createFallbackModel() {
        var group = new THREE.Group();
        var mesh = new THREE.Mesh(
            new THREE.BoxGeometry(1, 1, 1),
            new THREE.MeshPhongMaterial({ color: 0xff5e57, emissive: 0x42100e, flatShading: true })
        );
        mesh.position.y = 0.5;
        group.add(mesh);
        return group;
    }

    function disposeMaterial(material) {
        if (!material) return;
        if (Array.isArray(material)) {
            material.forEach(disposeMaterial);
            return;
        }
        if (material.map) material.map.dispose();
        material.dispose();
    }

    function disposeObject(root) {
        if (!root) return;
        root.traverse(function(child) {
            if (child.geometry) child.geometry.dispose();
            if (child.material) disposeMaterial(child.material);
        });
    }

    function fitModel(model, targetSize) {
        targetSize = targetSize || 5.2;
        model.updateMatrixWorld(true);
        var box = new THREE.Box3().setFromObject(model);
        var size = new THREE.Vector3();
        var center = new THREE.Vector3();
        box.getSize(size);
        box.getCenter(center);
        var maxDim = Math.max(size.x, size.y, size.z, 0.001);
        model.position.x -= center.x;
        model.position.z -= center.z;
        model.position.y -= box.min.y;
        model.scale.multiplyScalar(targetSize / maxDim);
    }

    function spinNestedRotors(root, speedScale) {
        speedScale = speedScale || 1;
        root.traverse(function(child) {
            if (child.userData && child.userData.mainRotor) {
                child.userData.mainRotor.rotation.y += 0.48 * speedScale;
            }
            if (child.userData && child.userData.tailRotor) {
                child.userData.tailRotor.rotation.z += 0.72 * speedScale;
            }
        });
    }

    function makeEnemyProxy(model, config) {
        config = config || {};
        return {
            mesh: model,
            isBoss: !!config.isBoss,
            flightBaseY: config.flightBaseY || 2.5
        };
    }

    function animateEnemyModel(model, time, amplitude, config) {
        if (typeof global.currentLevel === 'undefined') {
            global.currentLevel = config && config.currentLevel ? config.currentLevel : 3;
        }
        if (typeof animateEnemy === 'function') {
            animateEnemy(makeEnemyProxy(model, config), time);
        }
        spinNestedRotors(model, amplitude);
    }

    function animateWeaponModel(model, time, amplitude, type) {
        var pulse = Math.sin(time * 0.006) * amplitude;
        if (model.userData && model.userData.turretGroup) {
            model.userData.turretGroup.rotation.y = pulse * 0.42;
        }
        if (model.userData && model.userData.barrelGroup) {
            var baseZ = model.userData.barrelBaseZ || 0;
            model.userData.barrelGroup.position.z = baseZ - Math.max(0, Math.sin(time * 0.018)) * 0.16 * amplitude;
        }
        if (type === 3 && model.userData && model.userData.crystal) {
            var crystal = model.userData.crystal;
            var baseScale = crystal.userData.baseScale || crystal.scale;
            crystal.rotation.y += 0.025 * amplitude;
            crystal.scale.copy(baseScale).multiplyScalar(1 + Math.max(0, pulse) * 0.16);
            model.userData.teslaCharge = Math.floor((Math.sin(time * 0.004) * 0.5 + 0.5) * (model.userData.teslaMaxCharge || 5));
            if (typeof updateTeslaChargeBar === 'function') {
                updateTeslaChargeBar(model, time);
            }
        }
        if (type === 4) {
            model.rotation.y += 0.012 * amplitude;
            model.position.y = Math.sin(time * 0.006) * 0.16 * amplitude;
        }
    }

    function animateBaseModel(model, time, amplitude) {
        model.rotation.y = Math.sin(time * 0.0016) * 0.18 * amplitude;
        model.position.y = Math.sin(time * 0.004) * 0.08 * amplitude;
        model.traverse(function(child) {
            if (child.material && child.material.emissiveIntensity !== undefined) {
                child.material.emissiveIntensity = 0.12 + Math.max(0, Math.sin(time * 0.006)) * 0.18 * amplitude;
            }
        });
    }

    function getControlValue(config, id, fallback) {
        var value = config && Number(config[id]);
        return Number.isFinite(value) ? value : fallback;
    }

    function getControlChoice(config, id, fallback, allowedValues) {
        var value = config && config[id] !== undefined ? String(config[id]) : fallback;
        return allowedValues.indexOf(value) >= 0 ? value : fallback;
    }

    function animateWheelbarrowModel(model, time, amplitude, config) {
        var wheelAxis = getControlChoice(config, 'wheelRotationAxis', 'x', ['x', 'y', 'z']);
        var spinSpeed = getControlValue(config, 'wheelSpinSpeed', 0.15) * amplitude;
        var turretSwingAmplitude = getControlValue(config, 'turretSwingAmplitude', 0.15) * amplitude;
        var turretSwingSpeed = getControlValue(config, 'turretSwingSpeed', 0.003);
        var assembly = model.userData && model.userData.wheelAssembly;

        if (assembly) {
            model.userData.showcaseWheelSpin = (model.userData.showcaseWheelSpin || 0) + spinSpeed;
            assembly.rotation.x = 0;
            assembly.rotation.y = 0;
            assembly.rotation.z = 0;
            assembly.rotation[wheelAxis] = model.userData.showcaseWheelSpin;
        }
        if (model.userData && model.userData.cannonGroup) {
            model.userData.cannonGroup.rotation.y = Math.sin(time * turretSwingSpeed) * turretSwingAmplitude;
        }
    }

    function createZMechanicalArmModel() {
        var group = new THREE.Group();
        var armMat = new THREE.MeshPhongMaterial({
            color: 0xd8e5ee,
            emissive: 0x12313c,
            emissiveIntensity: 0.18,
            flatShading: true,
            shininess: 70
        });
        var darkMat = new THREE.MeshPhongMaterial({
            color: 0x24323d,
            emissive: 0x07131a,
            emissiveIntensity: 0.18,
            flatShading: true
        });
        var jointMat = new THREE.MeshPhongMaterial({
            color: 0x20d7e8,
            emissive: 0x0a6070,
            emissiveIntensity: 0.46,
            flatShading: true
        });
        var palmMat = new THREE.MeshPhongMaterial({
            color: 0x9ad9ff,
            emissive: 0x104869,
            emissiveIntensity: 0.26,
            flatShading: true
        });

        function createArmSegment(length, width, material, label) {
            var segment = new THREE.Group();
            segment.name = label;

            var beam = new THREE.Mesh(new THREE.BoxGeometry(length, width, width * 0.72), material);
            beam.position.x = length / 2;
            segment.add(beam);

            var topRail = new THREE.Mesh(new THREE.BoxGeometry(length * 0.86, width * 0.18, width * 0.18), darkMat);
            topRail.position.set(length / 2, width * 0.42, width * 0.42);
            var bottomRail = topRail.clone();
            bottomRail.position.y = -width * 0.42;
            bottomRail.position.z = -width * 0.42;
            segment.add(topRail, bottomRail);

            var glow = new THREE.Mesh(new THREE.BoxGeometry(length * 0.62, width * 0.08, width * 0.78), jointMat);
            glow.position.set(length / 2, 0, width * 0.43);
            segment.add(glow);

            return segment;
        }

        function createHexJoint(radius, depth, label) {
            var joint = new THREE.Group();
            joint.name = label;
            var core = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, depth, 6), jointMat);
            core.rotation.x = Math.PI / 2;
            joint.add(core);

            var hub = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.62, radius * 0.62, depth * 1.18, 6), darkMat);
            hub.rotation.x = Math.PI / 2;
            joint.add(hub);

            return joint;
        }

        var basePivot = new THREE.Group();
        basePivot.position.set(-1.95, 0.95, 0);
        basePivot.rotation.z = 0.62;
        group.add(basePivot);

        var baseJoint = createHexJoint(0.34, 0.34, 'base-hex-link');
        group.add(baseJoint);
        baseJoint.position.copy(basePivot.position);

        var upperLength = 2.65;
        var forearmLength = 1.85;
        var palmLength = 1.05;

        var upperArm = createArmSegment(upperLength, 0.34, armMat, 'large-arm');
        basePivot.add(upperArm);

        var elbowPivot = new THREE.Group();
        elbowPivot.position.x = upperLength;
        elbowPivot.rotation.z = -1.28;
        basePivot.add(elbowPivot);
        elbowPivot.add(createHexJoint(0.3, 0.34, 'elbow-hex-link'));

        var forearm = createArmSegment(forearmLength, 0.28, armMat, 'small-arm');
        elbowPivot.add(forearm);

        var wristPivot = new THREE.Group();
        wristPivot.position.x = forearmLength;
        wristPivot.rotation.z = 0.72;
        elbowPivot.add(wristPivot);
        wristPivot.add(createHexJoint(0.24, 0.3, 'wrist-hex-link'));

        var palm = createArmSegment(palmLength, 0.24, palmMat, 'palm');
        wristPivot.add(palm);

        var clamp = new THREE.Group();
        clamp.position.x = palmLength;
        var fingerA = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.58, 0.13), palmMat);
        fingerA.position.set(0.06, 0.24, 0);
        fingerA.rotation.z = -0.28;
        var fingerB = fingerA.clone();
        fingerB.position.y = -0.24;
        fingerB.rotation.z = 0.28;
        clamp.add(fingerA, fingerB);
        wristPivot.add(clamp);

        group.userData = {
            zMechanicalArm: true,
            basePivot: basePivot,
            elbowPivot: elbowPivot,
            wristPivot: wristPivot,
            clamp: clamp,
            baseAngle: basePivot.rotation.z,
            elbowAngle: elbowPivot.rotation.z,
            wristAngle: wristPivot.rotation.z
        };

        return group;
    }

    function animateZMechanicalArmModel(model, time, amplitude, config) {
        var data = model.userData || {};
        var speed = getControlValue(config, 'mechanicalArmSpeed', 0.0028);
        var baseSwing = getControlValue(config, 'mechanicalArmBaseSwing', 0.18) * amplitude;
        var elbowSwing = getControlValue(config, 'mechanicalArmElbowSwing', 0.28) * amplitude;
        var wristSwing = getControlValue(config, 'mechanicalArmWristSwing', 0.34) * amplitude;
        if (data.basePivot) data.basePivot.rotation.z = data.baseAngle + Math.sin(time * speed) * baseSwing;
        if (data.elbowPivot) data.elbowPivot.rotation.z = data.elbowAngle + Math.sin(time * speed + 1.7) * elbowSwing;
        if (data.wristPivot) data.wristPivot.rotation.z = data.wristAngle + Math.sin(time * speed + 3.1) * wristSwing;
        if (data.clamp) data.clamp.rotation.x = Math.sin(time * speed * 1.8) * 0.18 * amplitude;
    }

    function createLimbMaterials() {
        return {
            frame: new THREE.MeshPhongMaterial({
                color: 0xdce9f2,
                emissive: 0x12313c,
                emissiveIntensity: 0.16,
                flatShading: true,
                shininess: 72
            }),
            dark: new THREE.MeshPhongMaterial({
                color: 0x202d38,
                emissive: 0x071018,
                emissiveIntensity: 0.2,
                flatShading: true
            }),
            joint: new THREE.MeshPhongMaterial({
                color: 0x28e1f0,
                emissive: 0x096a78,
                emissiveIntensity: 0.5,
                flatShading: true
            }),
            accent: new THREE.MeshPhongMaterial({
                color: 0x9fdcff,
                emissive: 0x144f75,
                emissiveIntensity: 0.28,
                flatShading: true
            })
        };
    }

    function createLimbRod(length, width, material, darkMaterial, jointMaterial, label) {
        var segment = new THREE.Group();
        segment.name = label;

        var beam = new THREE.Mesh(new THREE.BoxGeometry(width, length, width * 0.7), material);
        beam.position.y = -length / 2;
        segment.add(beam);

        [-1, 1].forEach(function(side) {
            var rail = new THREE.Mesh(new THREE.BoxGeometry(width * 0.16, length * 0.84, width * 0.16), darkMaterial);
            rail.position.set(side * width * 0.42, -length / 2, width * 0.38);
            segment.add(rail);
        });

        var glowStrip = new THREE.Mesh(new THREE.BoxGeometry(width * 0.72, length * 0.55, width * 0.08), jointMaterial);
        glowStrip.position.set(0, -length / 2, width * 0.42);
        segment.add(glowStrip);

        return segment;
    }

    function createLimbHexJoint(radius, depth, materials, label) {
        var joint = new THREE.Group();
        joint.name = label;

        var core = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, depth, 6), materials.joint);
        core.rotation.x = Math.PI / 2;
        joint.add(core);

        var cap = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.58, radius * 0.58, depth * 1.12, 6), materials.dark);
        cap.rotation.x = Math.PI / 2;
        joint.add(cap);

        return joint;
    }

    function createUprightRobotUpperLimbModel() {
        var materials = createLimbMaterials();
        var group = new THREE.Group();

        var shoulderPivot = new THREE.Group();
        shoulderPivot.position.set(0, 2.65, 0);
        shoulderPivot.rotation.z = -0.28;
        group.add(shoulderPivot);

        var shoulderJoint = createLimbHexJoint(0.32, 0.34, materials, 'shoulder-hex-link');
        group.add(shoulderJoint);
        shoulderJoint.position.copy(shoulderPivot.position);

        var upperLength = 1.65;
        var forearmLength = 1.22;
        var palmLength = 0.62;

        var upperArm = createLimbRod(upperLength, 0.32, materials.frame, materials.dark, materials.joint, 'upper-arm');
        shoulderPivot.add(upperArm);

        var elbowPivot = new THREE.Group();
        elbowPivot.position.y = -upperLength;
        elbowPivot.rotation.z = 0.68;
        shoulderPivot.add(elbowPivot);
        elbowPivot.add(createLimbHexJoint(0.27, 0.32, materials, 'elbow-hex-link'));

        var forearm = createLimbRod(forearmLength, 0.27, materials.frame, materials.dark, materials.joint, 'forearm');
        elbowPivot.add(forearm);

        var wristPivot = new THREE.Group();
        wristPivot.position.y = -forearmLength;
        wristPivot.rotation.z = -0.36;
        elbowPivot.add(wristPivot);
        wristPivot.add(createLimbHexJoint(0.21, 0.26, materials, 'wrist-hex-link'));

        var palm = createLimbRod(palmLength, 0.22, materials.accent, materials.dark, materials.joint, 'palm');
        wristPivot.add(palm);

        var hand = new THREE.Group();
        hand.position.y = -palmLength;
        [-0.14, 0, 0.14].forEach(function(x, index) {
            var finger = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.36 - index * 0.04, 0.08), materials.accent);
            finger.position.set(x, -0.18 + index * 0.02, 0.02);
            finger.rotation.z = x * -0.9;
            hand.add(finger);
        });
        wristPivot.add(hand);

        group.userData = {
            uprightUpperLimb: true,
            shoulderPivot: shoulderPivot,
            elbowPivot: elbowPivot,
            wristPivot: wristPivot,
            hand: hand,
            shoulderAngle: shoulderPivot.rotation.z,
            elbowAngle: elbowPivot.rotation.z,
            wristAngle: wristPivot.rotation.z
        };

        return group;
    }

    function createUprightRobotLowerLimbModel() {
        var materials = createLimbMaterials();
        var group = new THREE.Group();

        var hipPivot = new THREE.Group();
        hipPivot.position.set(0, 2.75, 0);
        hipPivot.rotation.z = 0.22;
        group.add(hipPivot);

        var hipJoint = createLimbHexJoint(0.34, 0.38, materials, 'hip-hex-link');
        group.add(hipJoint);
        hipJoint.position.copy(hipPivot.position);

        var thighLength = 1.72;
        var shinLength = 1.46;
        var footLength = 0.86;

        var thigh = createLimbRod(thighLength, 0.36, materials.frame, materials.dark, materials.joint, 'thigh');
        hipPivot.add(thigh);

        var kneePivot = new THREE.Group();
        kneePivot.position.y = -thighLength;
        kneePivot.rotation.z = -0.58;
        hipPivot.add(kneePivot);
        kneePivot.add(createLimbHexJoint(0.3, 0.34, materials, 'knee-hex-link'));

        var shin = createLimbRod(shinLength, 0.3, materials.frame, materials.dark, materials.joint, 'shin');
        kneePivot.add(shin);

        var anklePivot = new THREE.Group();
        anklePivot.position.y = -shinLength;
        anklePivot.rotation.z = 0.36;
        kneePivot.add(anklePivot);
        anklePivot.add(createLimbHexJoint(0.24, 0.3, materials, 'ankle-hex-link'));

        var foot = new THREE.Group();
        foot.name = 'foot';
        var sole = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.2, footLength), materials.accent);
        sole.position.set(0.06, -0.08, footLength * 0.28);
        foot.add(sole);

        [-0.18, 0, 0.18].forEach(function(x) {
            var toe = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.12, 0.42), materials.accent);
            toe.position.set(x + 0.08, -0.05, footLength * 0.78);
            toe.rotation.y = -x * 0.7;
            foot.add(toe);
        });

        anklePivot.add(foot);

        group.userData = {
            uprightLowerLimb: true,
            hipPivot: hipPivot,
            kneePivot: kneePivot,
            anklePivot: anklePivot,
            foot: foot,
            hipAngle: hipPivot.rotation.z,
            kneeAngle: kneePivot.rotation.z,
            ankleAngle: anklePivot.rotation.z
        };

        return group;
    }

    function animateUprightUpperLimbModel(model, time, amplitude, config) {
        var data = model.userData || {};
        var speed = getControlValue(config, 'upperLimbSpeed', 0.0032);
        var shoulderSwing = getControlValue(config, 'upperShoulderSwing', 0.32) * amplitude;
        var elbowSwing = getControlValue(config, 'upperElbowSwing', 0.44) * amplitude;
        var wristSwing = getControlValue(config, 'upperWristSwing', 0.28) * amplitude;
        if (data.shoulderPivot) data.shoulderPivot.rotation.z = data.shoulderAngle + Math.sin(time * speed) * shoulderSwing;
        if (data.elbowPivot) data.elbowPivot.rotation.z = data.elbowAngle + Math.sin(time * speed + 1.2) * elbowSwing;
        if (data.wristPivot) data.wristPivot.rotation.z = data.wristAngle + Math.sin(time * speed + 2.4) * wristSwing;
        if (data.hand) data.hand.rotation.x = Math.sin(time * speed * 1.8) * 0.18 * amplitude;
    }

    function animateUprightLowerLimbModel(model, time, amplitude, config) {
        var data = model.userData || {};
        var speed = getControlValue(config, 'lowerLimbSpeed', 0.003);
        var hipSwing = getControlValue(config, 'lowerHipSwing', 0.36) * amplitude;
        var kneeSwing = getControlValue(config, 'lowerKneeSwing', 0.5) * amplitude;
        var ankleSwing = getControlValue(config, 'lowerAnkleSwing', 0.24) * amplitude;
        var step = Math.sin(time * speed);
        if (data.hipPivot) data.hipPivot.rotation.z = data.hipAngle + step * hipSwing;
        if (data.kneePivot) data.kneePivot.rotation.z = data.kneeAngle - Math.max(0, step) * kneeSwing + Math.max(0, -step) * kneeSwing * 0.35;
        if (data.anklePivot) data.anklePivot.rotation.z = data.ankleAngle + Math.sin(time * speed + 1.8) * ankleSwing;
        if (data.foot) data.foot.rotation.x = Math.max(0, -step) * 0.24 * amplitude;
    }

    function createRobotHelmetAssetModel() {
        var group = new THREE.Group();
        var shellMat = new THREE.MeshPhongMaterial({
            color: 0xf5fbff,
            emissive: 0x9fdcff,
            emissiveIntensity: 0.08,
            flatShading: true,
            shininess: 82
        });
        var sideMat = new THREE.MeshPhongMaterial({
            color: 0xd7e4ee,
            emissive: 0x315b6c,
            emissiveIntensity: 0.1,
            flatShading: true,
            shininess: 64
        });
        var darkMat = new THREE.MeshPhongMaterial({
            color: 0x152330,
            emissive: 0x06121b,
            emissiveIntensity: 0.18,
            flatShading: true
        });
        var visorMat = new THREE.MeshPhongMaterial({
            color: 0x39bfff,
            emissive: 0x118dff,
            emissiveIntensity: 0.5,
            transparent: true,
            opacity: 0.72,
            shininess: 96
        });
        var glowMat = new THREE.MeshBasicMaterial({
            color: 0x73e7ff,
            transparent: true,
            opacity: 0.62
        });

        function makeWedge(widthBack, widthFront, heightBack, heightFront, depth, material) {
            var halfBack = widthBack / 2;
            var halfFront = widthFront / 2;
            var zBack = -depth / 2;
            var zFront = depth / 2;
            var geo = new THREE.BufferGeometry();
            geo.setAttribute('position', new THREE.Float32BufferAttribute([
                -halfBack, 0, zBack, halfBack, 0, zBack, -halfFront, 0, zFront, halfFront, 0, zFront,
                -halfBack * 0.82, heightBack, zBack, halfBack * 0.82, heightBack, zBack, -halfFront * 0.66, heightFront, zFront, halfFront * 0.66, heightFront, zFront
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

        var crown = makeWedge(1.58, 1.2, 0.82, 0.62, 1.28, shellMat);
        crown.position.y = 0.82;
        crown.rotation.x = -0.06;
        group.add(crown);

        var jaw = makeWedge(1.28, 0.92, 0.52, 0.34, 0.88, sideMat);
        jaw.position.set(0, 0.34, 0.08);
        jaw.rotation.x = 0.05;
        group.add(jaw);

        var rearPlate = new THREE.Mesh(new THREE.BoxGeometry(1.42, 0.78, 0.24), shellMat);
        rearPlate.position.set(0, 0.72, -0.72);
        rearPlate.rotation.x = -0.16;
        group.add(rearPlate);

        var visor = makeWedge(1.05, 0.78, 0.34, 0.24, 0.12, visorMat);
        visor.position.set(0, 0.78, 0.73);
        visor.rotation.x = -0.18;
        group.add(visor);

        var visorGlow = makeWedge(0.86, 0.62, 0.22, 0.16, 0.08, glowMat);
        visorGlow.position.set(0, 0.83, 0.8);
        visorGlow.rotation.x = -0.18;
        group.add(visorGlow);

        [-1, 1].forEach(function(side) {
            var cheek = makeWedge(0.34, 0.22, 0.5, 0.32, 0.84, sideMat);
            cheek.position.set(side * 0.72, 0.42, 0.08);
            cheek.rotation.z = side * -0.18;
            cheek.rotation.y = side * 0.08;
            group.add(cheek);

            var intake = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.32, 0.52), darkMat);
            intake.position.set(side * 0.79, 0.34, 0.18);
            intake.rotation.z = side * -0.16;
            group.add(intake);

            var fin = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.18, 0.76), shellMat);
            fin.position.set(side * 0.52, 1.32, -0.08);
            fin.rotation.y = side * 0.18;
            fin.rotation.z = side * -0.08;
            group.add(fin);
        });

        var crest = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.18, 1.18), shellMat);
        crest.position.set(0, 1.46, -0.05);
        crest.rotation.x = -0.08;
        group.add(crest);

        var chinVent = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.12, 0.08), darkMat);
        chinVent.position.set(0, 0.42, 0.64);
        group.add(chinVent);

        group.userData = {
            robotHelmetAsset: true,
            visor: visor,
            visorGlow: visorGlow,
            baseVisorOpacity: visorMat.opacity,
            baseGlowOpacity: glowMat.opacity
        };

        return group;
    }

    function animateRobotHelmetAssetModel(model, time, amplitude, config) {
        var data = model.userData || {};
        var pulse = Math.sin(time * 0.004) * 0.5 + 0.5;
        if (data.visor && data.visor.material) {
            data.visor.material.emissiveIntensity = 0.42 + pulse * 0.22 * amplitude;
            data.visor.material.opacity = Math.min(0.88, data.baseVisorOpacity + pulse * 0.08 * amplitude);
        }
        if (data.visorGlow && data.visorGlow.material) {
            data.visorGlow.material.opacity = Math.min(0.82, data.baseGlowOpacity + pulse * 0.16 * amplitude);
        }
        model.rotation.y = Math.sin(time * 0.0012) * 0.08 * amplitude;
    }

    function createRobotTorsoArmorAssetModel() {
        var group = new THREE.Group();
        var shellMat = new THREE.MeshPhongMaterial({
            color: 0xf5fbff,
            emissive: 0x9fdcff,
            emissiveIntensity: 0.08,
            flatShading: true,
            shininess: 82
        });
        var sideMat = new THREE.MeshPhongMaterial({
            color: 0xd7e4ee,
            emissive: 0x315b6c,
            emissiveIntensity: 0.1,
            flatShading: true,
            shininess: 64
        });
        var darkMat = new THREE.MeshPhongMaterial({
            color: 0x152330,
            emissive: 0x06121b,
            emissiveIntensity: 0.18,
            flatShading: true
        });
        var vestMat = new THREE.MeshPhongMaterial({
            color: 0x1e3344,
            emissive: 0x07141f,
            emissiveIntensity: 0.22,
            flatShading: true
        });
        var blueMat = new THREE.MeshPhongMaterial({
            color: 0x39bfff,
            emissive: 0x118dff,
            emissiveIntensity: 0.48,
            transparent: true,
            opacity: 0.78,
            shininess: 92
        });
        var glowMat = new THREE.MeshBasicMaterial({
            color: 0x73e7ff,
            transparent: true,
            opacity: 0.64
        });

        function makeWedge(widthBack, widthFront, heightBack, heightFront, depth, material) {
            var halfBack = widthBack / 2;
            var halfFront = widthFront / 2;
            var zBack = -depth / 2;
            var zFront = depth / 2;
            var geo = new THREE.BufferGeometry();
            geo.setAttribute('position', new THREE.Float32BufferAttribute([
                -halfBack, 0, zBack, halfBack, 0, zBack, -halfFront, 0, zFront, halfFront, 0, zFront,
                -halfBack * 0.84, heightBack, zBack, halfBack * 0.84, heightBack, zBack, -halfFront * 0.72, heightFront, zFront, halfFront * 0.72, heightFront, zFront
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

        var vestBack = makeWedge(1.55, 1.35, 1.72, 1.52, 0.34, vestMat);
        vestBack.position.set(0, 0.52, -0.45);
        vestBack.rotation.x = -0.05;
        group.add(vestBack);

        var chest = makeWedge(1.58, 1.26, 1.5, 1.24, 0.78, shellMat);
        chest.position.set(0, 0.72, 0.08);
        chest.rotation.x = -0.08;
        group.add(chest);

        var sternum = makeWedge(0.54, 0.42, 1.12, 0.86, 0.12, blueMat);
        sternum.position.set(0, 0.92, 0.53);
        sternum.rotation.x = -0.1;
        group.add(sternum);

        var sternumGlow = makeWedge(0.34, 0.24, 0.72, 0.54, 0.08, glowMat);
        sternumGlow.position.set(0, 1.08, 0.61);
        sternumGlow.rotation.x = -0.1;
        group.add(sternumGlow);

        var abdomen = makeWedge(1.05, 0.86, 0.72, 0.58, 0.56, sideMat);
        abdomen.position.set(0, 0.05, 0.08);
        abdomen.rotation.x = 0.05;
        group.add(abdomen);

        var pelvis = makeWedge(1.28, 1.02, 0.52, 0.38, 0.72, shellMat);
        pelvis.position.set(0, -0.54, 0.04);
        pelvis.rotation.x = 0.08;
        group.add(pelvis);

        var waistConnector = new THREE.Group();
        waistConnector.position.set(0, -0.08, 0.44);
        [-0.34, 0, 0.34].forEach(function(x, index) {
            var plate = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.48 - index * 0.05, 0.12), darkMat);
            plate.position.set(x, -0.12, 0);
            plate.rotation.z = x * -0.18;
            waistConnector.add(plate);
        });
        group.add(waistConnector);

        [-1, 1].forEach(function(side) {
            var shoulderRoot = new THREE.Group();
            shoulderRoot.position.set(side * 1.02, 1.86, 0.02);
            shoulderRoot.rotation.z = side * -0.16;
            group.add(shoulderRoot);

            var shoulder = makeWedge(0.72, 0.54, 0.34, 0.24, 0.9, shellMat);
            shoulder.rotation.y = side * 0.18;
            shoulder.rotation.z = side * 0.08;
            shoulderRoot.add(shoulder);

            var shoulderEdge = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.08, 0.76), blueMat);
            shoulderEdge.position.set(0, 0.24, 0.08);
            shoulderEdge.rotation.z = side * -0.08;
            shoulderRoot.add(shoulderEdge);

            var armpitSocket = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.18, 6), darkMat);
            armpitSocket.rotation.z = Math.PI / 2;
            armpitSocket.position.set(side * -0.12, -0.12, 0.02);
            shoulderRoot.add(armpitSocket);
        });

        var backpack = makeWedge(1.14, 0.96, 1.42, 1.25, 0.42, vestMat);
        backpack.position.set(0, 0.54, -0.86);
        backpack.rotation.x = -0.08;
        group.add(backpack);

        var packTop = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.22, 0.18), darkMat);
        packTop.position.set(0, 1.86, -1.02);
        packTop.rotation.x = -0.12;
        group.add(packTop);

        [-0.34, 0.34].forEach(function(x) {
            var tank = new THREE.Group();
            tank.position.set(x, 0.6, -1.18);
            var cylinder = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 1.28, 12), sideMat);
            cylinder.position.y = 0.08;
            tank.add(cylinder);

            var topCap = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.16, 0.16, 12), shellMat);
            topCap.position.y = 0.8;
            tank.add(topCap);

            var bottomCap = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.13, 0.16, 12), shellMat);
            bottomCap.position.y = -0.64;
            tank.add(bottomCap);

            var valve = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.08, 0.12), blueMat);
            valve.position.set(0, 0.94, 0);
            tank.add(valve);
            group.add(tank);
        });

        var hoseLeft = new THREE.Mesh(new THREE.TorusGeometry(0.38, 0.025, 8, 24, Math.PI * 1.25), darkMat);
        hoseLeft.position.set(-0.48, 1.24, -0.93);
        hoseLeft.rotation.set(Math.PI / 2, 0, -0.35);
        group.add(hoseLeft);

        var hoseRight = hoseLeft.clone();
        hoseRight.position.x = 0.48;
        hoseRight.rotation.z = 0.35;
        group.add(hoseRight);

        group.userData = {
            robotTorsoArmorAsset: true,
            sternum: sternum,
            sternumGlow: sternumGlow,
            shoulderRoots: group.children.filter(function(child) {
                return child.type === 'Group' && Math.abs(child.position.x) > 0.9 && child.position.y > 1.6;
            }),
            baseGlowOpacity: glowMat.opacity
        };

        return group;
    }

    function animateRobotTorsoArmorAssetModel(model, time, amplitude, config) {
        var data = model.userData || {};
        var pulse = Math.sin(time * 0.0038) * 0.5 + 0.5;
        if (data.sternum && data.sternum.material) {
            data.sternum.material.emissiveIntensity = 0.38 + pulse * 0.24 * amplitude;
        }
        if (data.sternumGlow && data.sternumGlow.material) {
            data.sternumGlow.material.opacity = Math.min(0.84, data.baseGlowOpacity + pulse * 0.16 * amplitude);
        }
        if (data.shoulderRoots) {
            data.shoulderRoots.forEach(function(shoulder, index) {
                var side = index === 0 ? -1 : 1;
                shoulder.rotation.z = side * -0.16 + Math.sin(time * 0.0024 + index * 1.4) * 0.035 * amplitude;
            });
        }
        model.rotation.y = Math.sin(time * 0.001) * 0.06 * amplitude;
    }

    function UnitShowcaseAnimation(scene, position, asset, options) {
        options = options || {};
        this.asset = asset;
        this.directionAngle = Number.isFinite(options.directionAngle) ? options.directionAngle : (asset.defaults && asset.defaults.directionAngle) || 35;
        this.amplitude = Math.max(0.25, options.amplitude || (asset.defaults && asset.defaults.amplitude) || 1);
        this.animationConfig = Object.assign({}, asset.defaults || {}, options.animationConfig || {});
        this.isComplete = false;
        this.root = new THREE.Group();
        this.root.name = 'unit-showcase-animation';
        this.root.position.copy(position || new THREE.Vector3());
        this.model = safeBuild(asset.build);
        fitModel(this.model, options.radius || asset.previewSize || 5.2);
        this.root.add(this.model);
        scene.add(this.root);
    }

    UnitShowcaseAnimation.prototype.update = function(time) {
        if (!this.root) return;
        var angle = this.directionAngle * Math.PI / 180;
        this.root.rotation.y = angle;
        if (typeof this.asset.animate === 'function') {
            this.asset.animate(this.model, time || performance.now(), this.amplitude, this.animationConfig);
        } else {
            this.model.rotation.y += 0.01 * this.amplitude;
        }
    };

    UnitShowcaseAnimation.prototype.setAnimationConfig = function(config) {
        this.animationConfig = Object.assign({}, this.animationConfig || {}, config || {});
    };

    UnitShowcaseAnimation.prototype.dispose = function() {
        if (!this.root) return;
        disposeObject(this.root);
        if (this.root.parent) this.root.parent.remove(this.root);
        this.root = null;
        this.model = null;
    };

    function makeUnitAsset(config) {
        return Object.assign({
            kind: 'unit',
            defaults: { radius: 5.2, amplitude: 1, directionAngle: 35 },
            create: function(scene, position, options) {
                return new UnitShowcaseAnimation(scene, position, this, options || {});
            }
        }, config);
    }

    function normalizeShowcaseAssetLabels(assets) {
        var labels = {
            'boss-explosion': ['Voxel Boss Explosion', 'Animation Effects'],
            'compact-explosion': ['Compact Blast', 'Animation Effects'],
            'enemy-robot': ['Enemy Robot', 'Enemy Units'],
            'enemy-robot-hard': ['Elite Robot', 'Enemy Units'],
            'enemy-heavy-robot': ['Heavy Robot', 'Enemy Units'],
            'enemy-drone': ['Drone', 'Enemy Units'],
            'enemy-elite-drone': ['Elite Drone', 'Enemy Units'],
            'enemy-armored': ['Armored Unit', 'Enemy Units'],
            'enemy-hover-armor': ['Hover Armor', 'Enemy Units'],
            'enemy-wheelbarrow': ['Wheelbarrow Cannon', 'Enemy Units'],
            'enemy-portal-a': ['Portal A', 'Enemy Units'],
            'enemy-portal-b': ['Portal B', 'Enemy Units'],
            'boss-chopper': ['Chopper Boss', 'Enemy Bosses'],
            'boss-tank': ['Tank Boss', 'Enemy Bosses'],
            'boss-alpha': ['Final Boss Alpha', 'Enemy Bosses'],
            'asset-z-mechanical-arm': ['Z Mechanical Arm', 'Mechanical Assets'],
            'asset-upright-upper-limb': ['Upright Robot Upper Limb', 'Mechanical Assets'],
            'asset-upright-lower-limb': ['Upright Robot Lower Limb', 'Mechanical Assets'],
            'asset-robot-streamline-helmet': ['Streamline Robot Helmet', 'Mechanical Assets'],
            'asset-robot-torso-armor': ['Robot Torso Armor', 'Mechanical Assets'],
            'asset-rocket-launcher': ['Rocket Launcher', 'Mechanical Assets'],
            'asset-friendly-rocket-robot': ['Friendly Rocket Robot', 'Friendly Units'],
            'tower-pulse': ['Pulse Cannon', 'Friendly Units'],
            'tower-rail': ['Rail Laser', 'Friendly Units'],
            'tower-tesla': ['Tesla Coil', 'Friendly Units'],
            'skill-airstrike': ['Airstrike', 'Friendly Units'],
            'friendly-base': ['Friendly Base', 'Friendly Units']
        };
        var controlLabels = {
            wheelRotationAxis: ['Wheel', 'Spin Axis'],
            wheelSpinSpeed: ['Wheel', 'Spin Speed'],
            turretSwingAmplitude: ['Turret', 'Swing Amplitude'],
            turretSwingSpeed: ['Turret', 'Swing Speed'],
            mechanicalArmSpeed: ['Arm', 'Motion Speed'],
            mechanicalArmBaseSwing: ['Large Arm', 'Swing Amplitude'],
            mechanicalArmElbowSwing: ['Forearm', 'Swing Amplitude'],
            mechanicalArmWristSwing: ['Palm', 'Swing Amplitude'],
            upperLimbSpeed: ['Upper Limb', 'Motion Speed'],
            upperShoulderSwing: ['Shoulder', 'Swing Amplitude'],
            upperElbowSwing: ['Elbow', 'Swing Amplitude'],
            upperWristSwing: ['Palm', 'Swing Amplitude'],
            lowerLimbSpeed: ['Lower Limb', 'Motion Speed'],
            lowerHipSwing: ['Hip', 'Swing Amplitude'],
            lowerKneeSwing: ['Knee', 'Swing Amplitude'],
            lowerAnkleSwing: ['Foot', 'Swing Amplitude']
        };
        return assets.map(function(asset) {
            if (labels[asset.id]) {
                asset.name = labels[asset.id][0];
                asset.group = labels[asset.id][1];
            } else if (!asset.group || /[^\x00-\x7F]/.test(asset.group)) {
                asset.group = asset.kind === 'effect' ? 'Animation Effects' : 'Animation Assets';
            }
            if (asset.animationControls) {
                asset.animationControls = asset.animationControls.map(function(control) {
                    var mapped = controlLabels[control.id];
                    if (mapped) {
                        control.part = mapped[0];
                        control.label = mapped[1];
                    }
                    if (control.options) {
                        control.options = control.options.map(function(option) {
                            if (option.value === 'x') return Object.assign({}, option, { label: 'X Axis' });
                            if (option.value === 'y') return Object.assign({}, option, { label: 'Y Axis' });
                            if (option.value === 'z') return Object.assign({}, option, { label: 'Z Axis' });
                            return option;
                        });
                    }
                    return control;
                });
            }
            return asset;
        });
    }

    function getShowcaseAssets() {
        var effectAssets = (global.ANIMATION_ASSET_REGISTRY || []).map(function(asset) {
            return Object.assign({}, asset, {
                group: '动画特效',
                kind: 'effect'
            });
        });

        var unitAssets = [
            makeUnitAsset({
                id: 'enemy-robot',
                name: '普通机器人',
                group: '敌军单位',
                previewSize: 4.2,
                build: function() { return createRobotEnemy(false); },
                animate: function(model, time, amplitude) { animateEnemyModel(model, time, amplitude); }
            }),
            makeUnitAsset({
                id: 'enemy-robot-hard',
                name: '精英机器人',
                group: '敌军单位',
                previewSize: 4.2,
                build: function() { return createRobotEnemy(true); },
                animate: function(model, time, amplitude) { animateEnemyModel(model, time, amplitude); }
            }),
            makeUnitAsset({
                id: 'enemy-heavy-robot',
                name: '强化机器人',
                group: '敌军单位',
                previewSize: 4.4,
                build: function() { return createHeavyRobotEnemy(); },
                animate: function(model, time, amplitude) { animateEnemyModel(model, time, amplitude); }
            }),
            makeUnitAsset({
                id: 'enemy-drone',
                name: '无人机',
                group: '敌军单位',
                previewSize: 4.4,
                build: function() { return createDroneEnemy(false); },
                animate: function(model, time, amplitude) { animateEnemyModel(model, time, amplitude); }
            }),
            makeUnitAsset({
                id: 'enemy-elite-drone',
                name: '精英无人机',
                group: '敌军单位',
                previewSize: 4.6,
                build: function() { return createDroneEnemy(true); },
                animate: function(model, time, amplitude) { animateEnemyModel(model, time, amplitude); }
            }),
            makeUnitAsset({
                id: 'enemy-armored',
                name: '装甲单位',
                group: '敌军单位',
                previewSize: 5.2,
                build: function() { return createArmoredUnitEnemy(); },
                animate: function(model, time, amplitude) { animateEnemyModel(model, time, amplitude); }
            }),
            makeUnitAsset({
                id: 'enemy-hover-armor',
                name: '悬浮装甲',
                group: '敌军单位',
                previewSize: 5.1,
                build: function() { return createHoverArmorEnemy(); },
                animate: function(model, time, amplitude) { animateEnemyModel(model, time, amplitude); }
            }),
            makeUnitAsset({
                id: 'enemy-wheelbarrow',
                name: '独轮炮车',
                group: '敌军单位',
                previewSize: 5,
                defaults: {
                    radius: 5,
                    amplitude: 1,
                    directionAngle: 35,
                    wheelRotationAxis: 'x',
                    wheelSpinSpeed: 0.15,
                    turretSwingAmplitude: 0.15,
                    turretSwingSpeed: 0.003
                },
                animationControls: [
                    { id: 'wheelRotationAxis', part: '轮子', label: '旋转轴', type: 'select', value: 'x', options: [
                        { value: 'x', label: 'X 轴' },
                        { value: 'y', label: 'Y 轴' },
                        { value: 'z', label: 'Z 轴' }
                    ] },
                    { id: 'wheelSpinSpeed', part: '轮子', label: '旋转速度', min: -0.35, max: 0.35, step: 0.01, value: 0.15 },
                    { id: 'turretSwingAmplitude', part: '炮台', label: '摆动幅度', min: 0, max: 0.45, step: 0.01, value: 0.15 },
                    { id: 'turretSwingSpeed', part: '炮台', label: '摆动速度', min: 0.001, max: 0.012, step: 0.001, value: 0.003 }
                ],
                build: function() { return createWheelbarrowModel(); },
                animate: function(model, time, amplitude, config) { animateWheelbarrowModel(model, time, amplitude, config); }
            }),
            makeUnitAsset({
                id: 'enemy-portal-a',
                name: 'Portal A',
                group: '敌军单位',
                previewSize: 5.2,
                build: function() { return createPortalAEnemy(); },
                animate: function(model, time, amplitude) { animateEnemyModel(model, time, amplitude); }
            }),
            makeUnitAsset({
                id: 'enemy-portal-b',
                name: 'Portal B',
                group: '敌军单位',
                previewSize: 5.2,
                build: function() { return createPortalBEnemy(); },
                animate: function(model, time, amplitude) { animateEnemyModel(model, time, amplitude); }
            }),
            makeUnitAsset({
                id: 'boss-chopper',
                name: 'Chopper Boss',
                group: '敌军 Boss',
                previewSize: 6,
                build: function() { return createImportedChopperModel(THREE); },
                animate: function(model, time, amplitude) { spinNestedRotors(model, amplitude); model.position.y = Math.sin(time * 0.003) * 0.12 * amplitude; }
            }),
            makeUnitAsset({
                id: 'boss-tank',
                name: 'Tank Boss',
                group: '敌军 Boss',
                previewSize: 6,
                build: function() { return typeof createTankBossPreview === 'function' ? createTankBossPreview(2) : createArmoredUnitEnemy(); },
                animate: function(model, time, amplitude) {
                    if (model.userData && model.userData.tower) model.userData.tower.rotation.y = Math.sin(time * 0.003) * 0.28 * amplitude;
                    model.position.y = Math.sin(time * 0.006) * 0.05 * amplitude;
                }
            }),
            makeUnitAsset({
                id: 'boss-alpha',
                name: 'Final Boss Alpha',
                group: '敌军 Boss',
                previewSize: 6.4,
                build: function() {
                    var group = new THREE.Group();
                    createSteelGorillaBoss(group);
                    return group;
                },
                animate: function(model, time, amplitude) { animateEnemyModel(model, time, amplitude, { isBoss: true }); }
            }),
            makeUnitAsset({
                id: 'asset-z-mechanical-arm',
                name: 'Z字机械臂',
                group: '机械资产',
                previewSize: 5.8,
                defaults: {
                    radius: 5.8,
                    amplitude: 1,
                    directionAngle: 22,
                    mechanicalArmSpeed: 0.0028,
                    mechanicalArmBaseSwing: 0.18,
                    mechanicalArmElbowSwing: 0.28,
                    mechanicalArmWristSwing: 0.34
                },
                animationControls: [
                    { id: 'mechanicalArmSpeed', part: '机械臂', label: '动作速度', min: 0.0008, max: 0.008, step: 0.0002, value: 0.0028 },
                    { id: 'mechanicalArmBaseSwing', part: '大臂', label: '摆动幅度', min: 0, max: 0.6, step: 0.01, value: 0.18 },
                    { id: 'mechanicalArmElbowSwing', part: '小臂', label: '摆动幅度', min: 0, max: 0.8, step: 0.01, value: 0.28 },
                    { id: 'mechanicalArmWristSwing', part: '手掌', label: '摆动幅度', min: 0, max: 0.8, step: 0.01, value: 0.34 }
                ],
                build: function() { return createZMechanicalArmModel(); },
                animate: function(model, time, amplitude, config) { animateZMechanicalArmModel(model, time, amplitude, config); }
            }),
            makeUnitAsset({
                id: 'asset-upright-upper-limb',
                name: '直立机器人上肢',
                group: '机械资产',
                previewSize: 5.4,
                defaults: {
                    radius: 5.4,
                    amplitude: 1,
                    directionAngle: 18,
                    upperLimbSpeed: 0.0032,
                    upperShoulderSwing: 0.32,
                    upperElbowSwing: 0.44,
                    upperWristSwing: 0.28
                },
                animationControls: [
                    { id: 'upperLimbSpeed', part: '上肢', label: '动作速度', min: 0.0008, max: 0.008, step: 0.0002, value: 0.0032 },
                    { id: 'upperShoulderSwing', part: '肩部', label: '摆动幅度', min: 0, max: 0.8, step: 0.01, value: 0.32 },
                    { id: 'upperElbowSwing', part: '肘部', label: '摆动幅度', min: 0, max: 0.9, step: 0.01, value: 0.44 },
                    { id: 'upperWristSwing', part: '手掌', label: '摆动幅度', min: 0, max: 0.7, step: 0.01, value: 0.28 }
                ],
                build: function() { return createUprightRobotUpperLimbModel(); },
                animate: function(model, time, amplitude, config) { animateUprightUpperLimbModel(model, time, amplitude, config); }
            }),
            makeUnitAsset({
                id: 'asset-upright-lower-limb',
                name: '直立机器人下肢',
                group: '机械资产',
                previewSize: 5.7,
                defaults: {
                    radius: 5.7,
                    amplitude: 1,
                    directionAngle: -12,
                    lowerLimbSpeed: 0.003,
                    lowerHipSwing: 0.36,
                    lowerKneeSwing: 0.5,
                    lowerAnkleSwing: 0.24
                },
                animationControls: [
                    { id: 'lowerLimbSpeed', part: '下肢', label: '动作速度', min: 0.0008, max: 0.008, step: 0.0002, value: 0.003 },
                    { id: 'lowerHipSwing', part: '髋部', label: '摆动幅度', min: 0, max: 0.8, step: 0.01, value: 0.36 },
                    { id: 'lowerKneeSwing', part: '膝部', label: '摆动幅度', min: 0, max: 1, step: 0.01, value: 0.5 },
                    { id: 'lowerAnkleSwing', part: '脚掌', label: '摆动幅度', min: 0, max: 0.7, step: 0.01, value: 0.24 }
                ],
                build: function() { return createUprightRobotLowerLimbModel(); },
                animate: function(model, time, amplitude, config) { animateUprightLowerLimbModel(model, time, amplitude, config); }
            }),
            makeUnitAsset({
                id: 'asset-robot-streamline-helmet',
                name: '流线机器人头盔',
                group: '机械资产',
                previewSize: 4.8,
                defaults: {
                    radius: 4.8,
                    amplitude: 1,
                    directionAngle: 18
                },
                build: function() { return createRobotHelmetAssetModel(); },
                animate: function(model, time, amplitude, config) { animateRobotHelmetAssetModel(model, time, amplitude, config); }
            }),
            makeUnitAsset({
                id: 'asset-robot-torso-armor',
                name: '机器人胸肩装甲',
                group: '机械资产',
                previewSize: 5.4,
                defaults: {
                    radius: 5.4,
                    amplitude: 1,
                    directionAngle: 18
                },
                build: function() { return createRobotTorsoArmorAssetModel(); },
                animate: function(model, time, amplitude, config) { animateRobotTorsoArmorAssetModel(model, time, amplitude, config); }
            }),
            makeUnitAsset({
                id: 'asset-rocket-launcher',
                name: 'Rocket Launcher',
                group: 'Mechanical Assets',
                previewSize: 4.2,
                defaults: {
                    radius: 4.2,
                    amplitude: 1,
                    directionAngle: 20
                },
                build: function() { return createRocketLauncherModel(THREE); },
                animate: function(model, time, amplitude) {
                    model.rotation.z = Math.sin(time * 0.003) * 0.08 * amplitude;
                }
            }),
            makeUnitAsset({
                id: 'asset-friendly-rocket-robot',
                name: 'Friendly Rocket Robot',
                group: 'Friendly Units',
                previewSize: 5,
                defaults: {
                    radius: 5,
                    amplitude: 1,
                    directionAngle: 20
                },
                build: function() { return createRocketRobotModel(THREE); },
                animate: function(model, time, amplitude) {
                    if (typeof animateRocketRobotModel === 'function') animateRocketRobotModel(model, time, amplitude);
                }
            }),
            makeUnitAsset({
                id: 'tower-pulse',
                name: 'Pulse Cannon',
                group: '我方单位',
                previewSize: 4.8,
                build: function() { return createWeaponModel(1); },
                animate: function(model, time, amplitude) { animateWeaponModel(model, time, amplitude, 1); }
            }),
            makeUnitAsset({
                id: 'tower-rail',
                name: 'Rail Laser',
                group: '我方单位',
                previewSize: 4.8,
                build: function() { return createWeaponModel(2); },
                animate: function(model, time, amplitude) { animateWeaponModel(model, time, amplitude, 2); }
            }),
            makeUnitAsset({
                id: 'tower-tesla',
                name: 'Tesla Coil',
                group: '我方单位',
                previewSize: 5,
                build: function() { return createWeaponModel(3); },
                animate: function(model, time, amplitude) { animateWeaponModel(model, time, amplitude, 3); }
            }),
            makeUnitAsset({
                id: 'skill-airstrike',
                name: '空袭',
                group: '我方单位',
                previewSize: 4.8,
                build: function() { return createWeaponModel(4); },
                animate: function(model, time, amplitude) { animateWeaponModel(model, time, amplitude, 4); }
            }),
            makeUnitAsset({
                id: 'friendly-base',
                name: '我方基地',
                group: '我方单位',
                previewSize: 6,
                build: function() { return createSpaceBaseModel(THREE); },
                animate: function(model, time, amplitude) { animateBaseModel(model, time, amplitude); }
            })
        ];

        return normalizeShowcaseAssetLabels(effectAssets.concat(unitAssets));
    }

    global.UnitShowcaseAnimation = UnitShowcaseAnimation;
    global.getAnimationShowcaseAssets = getShowcaseAssets;
})(window);
