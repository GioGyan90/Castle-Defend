// K card base oil-well support. Uses the same three-segment mechanical arm idea as the asset viewer.
const K_OIL_WELL_SUPPORT = {
    active: false,
    mesh: null,
    lastPumpTone: 0
};

function getKOilRuntime() {
    return window.CASTLE_DEFEND_RUNTIME || {};
}

function getKOilScene() {
    const runtime = getKOilRuntime();
    if (runtime.scene) return runtime.scene;
    try { return scene; } catch (error) { return null; }
}

function getKOilCastle() {
    const runtime = getKOilRuntime();
    if (runtime.castle) return runtime.castle;
    try { return castle; } catch (error) { return null; }
}

function getKOilWellConfig() {
    const configured = typeof getWeaponConfig === 'function' ? (getWeaponConfig('K_OIL_WELL') || {}) : {};
    return Object.assign({
        scale: 0.64,
        offsetX: 0.46,
        offsetY: 0.4,
        offsetZ: -0.34,
        rotationOffset: 0.08,
        pumpSpeed: 0.0032,
        pumpAmplitude: 1,
        crankSpeed: 0.045,
        ringSpinSpeed: 0.012,
        palette: {
            dark: 0x243121,
            steel: 0x879b8b,
            accent: 0xf2b84b,
            joint: 0x8df06f,
            glow: 0xc7ff7a
        }
    }, configured);
}

function createKOilWellMaterialSet(THREERef) {
    const THREE = THREERef || window.THREE;
    const config = getKOilWellConfig();
    const palette = config.palette || {};
    return {
        dark: new THREE.MeshPhongMaterial({ color: palette.dark || 0x243121, emissive: 0x070d07, emissiveIntensity: 0.2, flatShading: true }),
        steel: new THREE.MeshPhongMaterial({ color: palette.steel || 0x879b8b, emissive: 0x1f281d, emissiveIntensity: 0.14, flatShading: true, shininess: 70 }),
        blue: new THREE.MeshPhongMaterial({ color: palette.joint || 0x8df06f, emissive: 0x244d16, emissiveIntensity: 0.48, flatShading: true, shininess: 90 }),
        yellow: new THREE.MeshPhongMaterial({ color: palette.accent || 0xf2b84b, emissive: 0x6b3f00, emissiveIntensity: 0.25, flatShading: true }),
        glow: new THREE.MeshBasicMaterial({ color: palette.glow || 0xc7ff7a, transparent: true, opacity: 0.46 })
    };
}

function createKOilHexJoint(THREERef, radius, depth, material) {
    const THREE = THREERef || window.THREE;
    const joint = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, depth, 6), material);
    joint.rotation.x = Math.PI / 2;
    return joint;
}

function createKOilBeam(THREERef, length, width, material, label) {
    const THREE = THREERef || window.THREE;
    const beam = new THREE.Group();
    beam.name = label || 'oil-well-beam';
    const core = new THREE.Mesh(new THREE.BoxGeometry(length, width, width * 0.72), material);
    core.position.x = length / 2;
    beam.add(core);
    return beam;
}

function createKOilWellModel(THREERef) {
    const THREE = THREERef || window.THREE;
    const mats = createKOilWellMaterialSet(THREE);
    const group = new THREE.Group();
    group.name = 'k-card-oil-well';

    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.9, 0.16, 8), mats.dark);
    base.position.y = 0.08;
    group.add(base);

    const deck = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.12, 0.92), mats.steel);
    deck.position.y = 0.22;
    group.add(deck);

    const tower = new THREE.Group();
    tower.position.set(-0.18, 0.28, 0);
    group.add(tower);
    [-1, 1].forEach(side => {
        const leg = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.18, 0.1), mats.steel);
        leg.position.set(side * 0.28, 0.56, 0);
        leg.rotation.z = side * -0.18;
        tower.add(leg);
    });
    const towerCap = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.12, 0.18), mats.blue);
    towerCap.position.y = 1.12;
    tower.add(towerCap);

    const crank = new THREE.Group();
    crank.name = 'oil-well-crank';
    crank.position.set(0.56, 0.45, 0);
    group.add(crank);
    const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.035, 8, 18), mats.yellow);
    wheel.rotation.y = Math.PI / 2;
    crank.add(wheel);
    const weight = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.28, 0.16), mats.dark);
    weight.position.set(0, -0.25, 0);
    crank.add(weight);

    const armRoot = new THREE.Group();
    armRoot.name = 'oil-well-mechanical-arm-root';
    armRoot.position.set(-0.38, 1.34, 0);
    armRoot.rotation.z = 0.14;
    group.add(armRoot);
    armRoot.add(createKOilHexJoint(THREE, 0.17, 0.18, mats.blue));

    const largeArm = createKOilBeam(THREE, 0.92, 0.15, mats.steel, 'oil-well-large-arm');
    armRoot.add(largeArm);

    const elbow = new THREE.Group();
    elbow.name = 'oil-well-elbow';
    elbow.position.x = 0.92;
    elbow.rotation.z = -0.72;
    armRoot.add(elbow);
    elbow.add(createKOilHexJoint(THREE, 0.13, 0.16, mats.blue));

    const forearm = createKOilBeam(THREE, 0.62, 0.12, mats.dark, 'oil-well-forearm');
    elbow.add(forearm);

    const head = new THREE.Group();
    head.name = 'oil-well-pump-head';
    head.position.x = 0.62;
    head.rotation.z = 0.54;
    elbow.add(head);
    head.add(createKOilHexJoint(THREE, 0.11, 0.14, mats.blue));
    const hammer = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.16, 0.28), mats.yellow);
    hammer.position.set(0.22, -0.06, 0);
    head.add(hammer);

    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.9, 8), mats.glow);
    rod.position.set(1.08, 0.72, 0);
    group.add(rod);

    const glowRing = new THREE.Mesh(
        new THREE.TorusGeometry(0.7, 0.025, 8, 36),
        mats.glow
    );
    glowRing.rotation.x = Math.PI / 2;
    glowRing.position.y = 0.27;
    group.add(glowRing);

    group.userData = {
        kOilWell: true,
        armRoot,
        elbow,
        head,
        crank,
        rod,
        glowRing,
        baseArmAngle: armRoot.rotation.z,
        baseElbowAngle: elbow.rotation.z,
        baseHeadAngle: head.rotation.z,
        baseRodY: rod.position.y
    };
    return group;
}

function animateKOilWellModel(model, time, amplitude = 1) {
    if (!model || !model.userData) return;
    const config = getKOilWellConfig();
    const data = model.userData;
    const activeAmplitude = amplitude * (config.pumpAmplitude || 1);
    const t = time * (config.pumpSpeed || 0.0032);
    const pump = Math.sin(t);
    if (data.armRoot) data.armRoot.rotation.z = data.baseArmAngle + pump * 0.18 * activeAmplitude;
    if (data.elbow) data.elbow.rotation.z = data.baseElbowAngle - pump * 0.22 * activeAmplitude;
    if (data.head) data.head.rotation.z = data.baseHeadAngle + pump * 0.16 * activeAmplitude;
    if (data.crank) data.crank.rotation.z -= (config.crankSpeed || 0.045) * activeAmplitude;
    if (data.rod) data.rod.position.y = data.baseRodY + pump * 0.18 * activeAmplitude;
    if (data.glowRing) {
        data.glowRing.rotation.z += (config.ringSpinSpeed || 0.012) * activeAmplitude;
        data.glowRing.material.opacity = 0.28 + (pump * 0.5 + 0.5) * 0.2;
    }
}

function getKOilWellBasePosition() {
    const base = getKOilCastle();
    const basePos = base ? base.position.clone() : new THREE.Vector3(0, 0, 0);
    const yaw = base ? base.rotation.y : 0;
    const config = getKOilWellConfig();
    const offset = new THREE.Vector3(config.offsetX || 0.46, config.offsetY || 0.4, config.offsetZ || -0.34).applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw);
    return basePos.add(offset);
}

function activateKOilWellSupport() {
    if (K_OIL_WELL_SUPPORT.active) return;
    const gameScene = getKOilScene();
    if (!gameScene || typeof THREE === 'undefined') return;
    const mesh = createKOilWellModel(THREE);
    mesh.position.copy(getKOilWellBasePosition());
    const base = getKOilCastle();
    const config = getKOilWellConfig();
    mesh.rotation.y = base ? base.rotation.y + Math.PI * (config.rotationOffset || 0.08) : 0;
    mesh.scale.setScalar(config.scale || 0.64);
    gameScene.add(mesh);
    K_OIL_WELL_SUPPORT.active = true;
    K_OIL_WELL_SUPPORT.mesh = mesh;
    K_OIL_WELL_SUPPORT.lastPumpTone = performance.now();
    if (typeof announceHighlight === 'function') {
        announceHighlight('k-oil-well', 'K card oil pump online');
    }
}

function resetKOilWellSupport() {
    const gameScene = getKOilScene();
    if (gameScene && K_OIL_WELL_SUPPORT.mesh) {
        gameScene.remove(K_OIL_WELL_SUPPORT.mesh);
    }
    K_OIL_WELL_SUPPORT.active = false;
    K_OIL_WELL_SUPPORT.mesh = null;
    K_OIL_WELL_SUPPORT.lastPumpTone = 0;
}

function updateKOilWellSupport(time) {
    if (!K_OIL_WELL_SUPPORT.active || !K_OIL_WELL_SUPPORT.mesh) return;
    animateKOilWellModel(K_OIL_WELL_SUPPORT.mesh, time, 1);
}

function getKOilWellIncomePosition() {
    if (!K_OIL_WELL_SUPPORT.active || !K_OIL_WELL_SUPPORT.mesh) return null;
    return K_OIL_WELL_SUPPORT.mesh.position.clone().add(new THREE.Vector3(0, 0.45, 0));
}

function showKOilWellIncomeText(amount) {
    const position = getKOilWellIncomePosition();
    if (!position || typeof announceBattleEvent !== 'function') return false;
    announceBattleEvent('k-oil-income-' + Math.floor(performance.now()), `+${amount}`, position, 140);
    return true;
}

window.createKOilWellModel = createKOilWellModel;
window.animateKOilWellModel = animateKOilWellModel;
window.activateKOilWellSupport = activateKOilWellSupport;
window.resetKOilWellSupport = resetKOilWellSupport;
window.updateKOilWellSupport = updateKOilWellSupport;
window.getKOilWellIncomePosition = getKOilWellIncomePosition;
window.showKOilWellIncomeText = showKOilWellIncomeText;
