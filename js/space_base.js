// Space base model construction. The local front gate faces negative Z.
function createSpaceBaseModel(THREE) {
    const base = new THREE.Group();

    const whiteMat = new THREE.MeshPhongMaterial({ color: 0xeaf5fb, emissive: 0x21323b, emissiveIntensity: 0.08, shininess: 45 });
    const paleMat = new THREE.MeshPhongMaterial({ color: 0xcbd9e3, emissive: 0x15232a, emissiveIntensity: 0.08, shininess: 35 });
    const blueMat = new THREE.MeshPhongMaterial({ color: 0x87cff5, emissive: 0x2a8fd2, emissiveIntensity: 0.3, shininess: 70 });
    const glassMat = new THREE.MeshPhongMaterial({ color: 0x7fd7ff, emissive: 0x2a9cda, emissiveIntensity: 0.55, transparent: true, opacity: 0.78, shininess: 90 });
    const darkMat = new THREE.MeshPhongMaterial({ color: 0x5d6f7b, emissive: 0x101820, emissiveIntensity: 0.08, shininess: 30 });
    const lineMat = new THREE.MeshBasicMaterial({ color: 0x51c7ff });
    const padMat = new THREE.MeshPhongMaterial({ color: 0x9eacb7, emissive: 0x17242b, emissiveIntensity: 0.1, shininess: 28 });
    const alertMat = new THREE.MeshBasicMaterial({ color: 0xff4fd8, transparent: true, opacity: 0 });
    const alertLights = [];

    const addBox = (group, size, pos, mat, rotY = 0) => {
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(size.x, size.y, size.z), mat);
        mesh.position.set(pos.x, pos.y, pos.z);
        mesh.rotation.y = rotY;
        group.add(mesh);
        return mesh;
    };
    const addAlertLight = (group, size, pos, rotY = 0) => {
        const mesh = addBox(group, size, pos, alertMat, rotY);
        alertLights.push(mesh);
        return mesh;
    };

    const platform = new THREE.Mesh(
        new THREE.CylinderGeometry(6.6, 7.2, 0.55, 8),
        paleMat
    );
    platform.position.y = 0.18;
    platform.rotation.y = Math.PI / 8;
    base.add(platform);

    const deck = new THREE.Mesh(
        new THREE.CylinderGeometry(5.65, 5.95, 0.26, 8),
        whiteMat
    );
    deck.position.y = 0.58;
    deck.rotation.y = Math.PI / 8;
    base.add(deck);

    const innerGlow = new THREE.Mesh(
        new THREE.TorusGeometry(5.1, 0.08, 8, 48),
        lineMat
    );
    innerGlow.rotation.x = Math.PI / 2;
    innerGlow.position.y = 0.76;
    base.add(innerGlow);

    const wall = new THREE.Group();
    addBox(wall, { x: 4.2, y: 1.1, z: 0.42 }, { x: -3.65, y: 1.15, z: -4.55 }, paleMat);
    addBox(wall, { x: 4.2, y: 1.1, z: 0.42 }, { x: 3.65, y: 1.15, z: -4.55 }, paleMat);
    addBox(wall, { x: 10.5, y: 1.1, z: 0.42 }, { x: 0, y: 1.15, z: 4.55 }, paleMat);
    addBox(wall, { x: 0.42, y: 1.1, z: 8.5 }, { x: -5.45, y: 1.15, z: 0 }, paleMat);
    addBox(wall, { x: 0.42, y: 1.1, z: 8.5 }, { x: 5.45, y: 1.15, z: 0 }, paleMat);

    addBox(wall, { x: 3.9, y: 0.12, z: 0.48 }, { x: -3.65, y: 1.78, z: -4.55 }, blueMat);
    addBox(wall, { x: 3.9, y: 0.12, z: 0.48 }, { x: 3.65, y: 1.78, z: -4.55 }, blueMat);
    addBox(wall, { x: 10.3, y: 0.12, z: 0.48 }, { x: 0, y: 1.78, z: 4.55 }, blueMat);
    addBox(wall, { x: 0.48, y: 0.12, z: 8.3 }, { x: -5.45, y: 1.78, z: 0 }, blueMat);
    addBox(wall, { x: 0.48, y: 0.12, z: 8.3 }, { x: 5.45, y: 1.78, z: 0 }, blueMat);
    addAlertLight(wall, { x: 1.0, y: 0.18, z: 0.54 }, { x: -5.0, y: 2.02, z: -4.57 });
    addAlertLight(wall, { x: 1.0, y: 0.18, z: 0.54 }, { x: -2.2, y: 2.02, z: -4.57 });
    addAlertLight(wall, { x: 1.0, y: 0.18, z: 0.54 }, { x: 2.2, y: 2.02, z: -4.57 });
    addAlertLight(wall, { x: 1.0, y: 0.18, z: 0.54 }, { x: 5.0, y: 2.02, z: -4.57 });
    addAlertLight(wall, { x: 1.1, y: 0.18, z: 0.54 }, { x: -3.2, y: 2.02, z: 4.57 });
    addAlertLight(wall, { x: 1.1, y: 0.18, z: 0.54 }, { x: 0, y: 2.02, z: 4.57 });
    addAlertLight(wall, { x: 1.1, y: 0.18, z: 0.54 }, { x: 3.2, y: 2.02, z: 4.57 });
    addAlertLight(wall, { x: 0.54, y: 0.18, z: 1.0 }, { x: -5.47, y: 2.02, z: -2.7 });
    addAlertLight(wall, { x: 0.54, y: 0.18, z: 1.0 }, { x: -5.47, y: 2.02, z: 0.4 });
    addAlertLight(wall, { x: 0.54, y: 0.18, z: 1.0 }, { x: -5.47, y: 2.02, z: 3.2 });
    addAlertLight(wall, { x: 0.54, y: 0.18, z: 1.0 }, { x: 5.47, y: 2.02, z: -2.7 });
    addAlertLight(wall, { x: 0.54, y: 0.18, z: 1.0 }, { x: 5.47, y: 2.02, z: 0.4 });
    addAlertLight(wall, { x: 0.54, y: 0.18, z: 1.0 }, { x: 5.47, y: 2.02, z: 3.2 });
    base.add(wall);

    const gate = new THREE.Group();
    addBox(gate, { x: 0.55, y: 2.0, z: 0.65 }, { x: -1.4, y: 1.55, z: -4.75 }, darkMat);
    addBox(gate, { x: 0.55, y: 2.0, z: 0.65 }, { x: 1.4, y: 1.55, z: -4.75 }, darkMat);
    addBox(gate, { x: 3.25, y: 0.38, z: 0.75 }, { x: 0, y: 2.55, z: -4.75 }, whiteMat);
    addBox(gate, { x: 2.45, y: 0.18, z: 0.18 }, { x: 0, y: 2.86, z: -4.95 }, blueMat);
    addBox(gate, { x: 2.1, y: 0.08, z: 2.2 }, { x: 0, y: 0.72, z: -5.75 }, glassMat);
    base.add(gate);

    const command = new THREE.Group();
    const commandCore = new THREE.Mesh(
        new THREE.CylinderGeometry(1.35, 1.75, 2.2, 8),
        whiteMat
    );
    commandCore.position.y = 1.85;
    commandCore.rotation.y = Math.PI / 8;
    command.add(commandCore);

    const commandGlass = new THREE.Mesh(
        new THREE.CylinderGeometry(1.5, 1.35, 0.55, 8),
        glassMat
    );
    commandGlass.position.y = 2.85;
    commandGlass.rotation.y = Math.PI / 8;
    command.add(commandGlass);

    const dome = new THREE.Mesh(
        new THREE.SphereGeometry(1.35, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2),
        blueMat
    );
    dome.position.y = 3.15;
    dome.scale.y = 0.55;
    command.add(dome);
    command.position.set(0.2, 0, 0.8);
    base.add(command);

    const pad = new THREE.Group();
    const padDisc = new THREE.Mesh(
        new THREE.CylinderGeometry(1.75, 1.75, 0.14, 40),
        padMat
    );
    padDisc.position.y = 0.88;
    pad.add(padDisc);
    const padRing = new THREE.Mesh(new THREE.TorusGeometry(1.75, 0.06, 8, 48), lineMat);
    padRing.rotation.x = Math.PI / 2;
    padRing.position.y = 0.98;
    pad.add(padRing);
    addBox(pad, { x: 0.28, y: 0.08, z: 1.35 }, { x: -0.42, y: 1.02, z: 0 }, blueMat);
    addBox(pad, { x: 0.28, y: 0.08, z: 1.35 }, { x: 0.42, y: 1.02, z: 0 }, blueMat);
    addBox(pad, { x: 0.95, y: 0.08, z: 0.25 }, { x: 0, y: 1.03, z: 0 }, blueMat);
    pad.position.set(-3.05, 0, 1.45);
    base.add(pad);

    const radar = new THREE.Group();
    const radarMast = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, 2.4, 12), darkMat);
    radarMast.position.y = 2.0;
    radar.add(radarMast);
    const radarHead = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.42, 0.25, 16), blueMat);
    radarHead.position.y = 3.25;
    radar.add(radarHead);
    const dish = new THREE.Mesh(
        new THREE.SphereGeometry(0.95, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2),
        glassMat
    );
    dish.scale.set(1.1, 0.22, 0.85);
    dish.position.set(0.62, 3.55, 0);
    dish.rotation.z = -0.45;
    radar.add(dish);
    for (let i = 0; i < 3; i++) {
        const wave = new THREE.Mesh(
            new THREE.TorusGeometry(0.75 + i * 0.38, 0.025, 6, 36),
            new THREE.MeshBasicMaterial({ color: 0x8fe3ff, transparent: true, opacity: 0.42 - i * 0.1 })
        );
        wave.position.set(0.95 + i * 0.22, 3.55, 0);
        wave.scale.x = 0.35;
        wave.rotation.y = Math.PI / 2;
        radar.add(wave);
    }
    radar.position.set(3.2, 0, 2.6);
    base.add(radar);

    const tower = new THREE.Group();
    const towerBase = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.72, 0.55, 6), darkMat);
    towerBase.position.y = 1.05;
    tower.add(towerBase);
    const towerStem = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.14, 3.6, 10), paleMat);
    towerStem.position.y = 2.95;
    tower.add(towerStem);
    for (let i = 0; i < 4; i++) {
        const brace = addBox(tower, { x: 0.08, y: 2.7, z: 0.08 }, { x: i < 2 ? -0.42 : 0.42, y: 2.65, z: i % 2 === 0 ? -0.42 : 0.42 }, darkMat);
        brace.rotation.z = i < 2 ? 0.16 : -0.16;
        brace.rotation.x = i % 2 === 0 ? -0.16 : 0.16;
    }
    const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.3, 16, 10), glassMat);
    beacon.position.y = 4.85;
    tower.add(beacon);
    const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.04, 1.1, 8), blueMat);
    antenna.position.y = 5.45;
    tower.add(antenna);
    tower.position.set(3.25, 0, -2.15);
    base.add(tower);

    const sidePods = [
        { x: -3.4, z: -2.15 },
        { x: 3.6, z: 0.6 }
    ];
    sidePods.forEach((pos, index) => {
        const pod = new THREE.Mesh(
            new THREE.CylinderGeometry(0.8, 1.0, 0.95, 8),
            index === 0 ? whiteMat : paleMat
        );
        pod.position.set(pos.x, 1.15, pos.z);
        pod.rotation.y = Math.PI / 8;
        base.add(pod);
        const podCap = new THREE.Mesh(new THREE.CylinderGeometry(0.78, 0.72, 0.18, 8), blueMat);
        podCap.position.set(pos.x, 1.7, pos.z);
        podCap.rotation.y = Math.PI / 8;
        base.add(podCap);
    });

    base.userData.hitAlertMaterial = alertMat;
    base.userData.hitAlertLights = alertLights;
    base.userData.hitAlertTime = 0;
    base.userData.hitAlertDuration = 420;
    base.scale.setScalar(0.55);

    return base;
}
