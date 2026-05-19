// Background art assets are intentionally separate from functional map assets.
// Keep decorative ground props here so roads, bases, spawns, and slots stay clean.

function createBackgroundTechPylonAsset(THREE, x, z, color = 0x00d2ff) {
    const group = new THREE.Group();
    const base = new THREE.Mesh(
        new THREE.CylinderGeometry(0.28, 0.38, 0.8, 6),
        createMapMaterial(THREE, 0x263238, { emissive: 0x061a1d, emissiveIntensity: 0.35 })
    );
    base.position.set(x, 0.35, z);
    const beacon = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.24, 0),
        new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9 })
    );
    beacon.position.set(x, 0.95, z);
    group.add(base, beacon);
    return group;
}

const BACKGROUND_ART_PRESETS = {
    1: [
        { kind: 'techPylon', x: -7, z: 12, color: 0x55efc4 },
        { kind: 'techPylon', x: 7, z: 3, color: 0x55efc4 }
    ],
    2: [
        { kind: 'techPylon', x: -3.4, z: 0, color: 0x74b9ff },
        { kind: 'techPylon', x: 3.4, z: 0, color: 0x74b9ff }
    ],
    3: [
        { kind: 'techPylon', x: -12, z: 12, color: 0xff7675 },
        { kind: 'techPylon', x: 0, z: 12, color: 0xffeaa7 },
        { kind: 'techPylon', x: 12, z: -12, color: 0xff7675 }
    ],
    4: [
        { kind: 'techPylon', x: -14, z: -10, color: 0x29f2ff },
        { kind: 'techPylon', x: -8, z: 10, color: 0xff4fd8 },
        { kind: 'techPylon', x: 5, z: -8, color: 0xff4fd8 },
        { kind: 'techPylon', x: 13, z: 10, color: 0xff7675 }
    ]
};

function createBackgroundArtAsset(THREE, presetItems = []) {
    const group = new THREE.Group();
    group.name = 'background-art';
    presetItems.forEach(item => {
        if (item.kind === 'techPylon') {
            group.add(createBackgroundTechPylonAsset(THREE, item.x, item.z, item.color));
        }
    });
    return group;
}
