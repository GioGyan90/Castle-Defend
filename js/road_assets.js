// Road assets are isolated so path shape, road skin, and future background detail can evolve independently.

function createRoadSegmentAsset(THREE, a, b, roadWidth, roadHeight) {
    const group = new THREE.Group();
    const dx = b.x - a.x;
    const dz = b.z - a.z;
    const length = Math.sqrt(dx * dx + dz * dz);
    if (length <= 0.01) return group;

    group.position.set((a.x + b.x) / 2, 0, (a.z + b.z) / 2);
    group.rotation.y = Math.atan2(-dz, dx);
    group.userData = { isRoadSegment: true, length, roadWidth };

    const road = new THREE.Mesh(
        new THREE.BoxGeometry(length, roadHeight, roadWidth),
        createMapMaterial(THREE, 0x66767c, { emissive: 0x17252b, emissiveIntensity: 0.28, shininess: 70 })
    );
    road.position.y = 0.02;
    group.add(road);

    const shoulderMaterial = new THREE.MeshBasicMaterial({ color: 0xbffaff, transparent: true, opacity: 0.16 });
    const shoulderWidth = 0.18;
    const shoulderOffset = roadWidth / 2 - shoulderWidth / 2;
    [-shoulderOffset, shoulderOffset].forEach(z => {
        const shoulder = new THREE.Mesh(new THREE.BoxGeometry(length, 0.035, shoulderWidth), shoulderMaterial.clone());
        shoulder.position.set(0, 0.135, z);
        group.add(shoulder);
    });

    const railMaterial = new THREE.MeshBasicMaterial({ color: 0x29f2ff, transparent: true, opacity: 0.72 });
    const railWidth = 0.09;
    const railOffset = roadWidth / 2 - 0.34;
    [-railOffset, railOffset].forEach(z => {
        const rail = new THREE.Mesh(new THREE.BoxGeometry(length, 0.12, railWidth), railMaterial.clone());
        rail.position.set(0, 0.17, z);
        group.add(rail);
    });

    const innerGlowMaterial = new THREE.MeshBasicMaterial({ color: 0x9ffcff, transparent: true, opacity: 0.16 });
    [-roadWidth * 0.26, roadWidth * 0.26].forEach(z => {
        const strip = new THREE.Mesh(new THREE.BoxGeometry(length, 0.026, 0.035), innerGlowMaterial.clone());
        strip.position.set(0, 0.185, z);
        group.add(strip);
    });

    const dashMaterial = new THREE.MeshBasicMaterial({ color: 0xf1c40f, transparent: true, opacity: 0.88 });
    const dashCount = Math.max(3, Math.floor(length / 2.7));
    for (let i = 0; i < dashCount; i++) {
        const x = -length / 2 + (i + 0.5) * (length / dashCount);
        const dash = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.16, 0.14), dashMaterial.clone());
        dash.position.set(x, 0.205, 0);
        group.add(dash);
    }

    const panelMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.07 });
    const panelCount = Math.max(2, Math.floor(length / 5));
    for (let i = 1; i < panelCount; i++) {
        const x = -length / 2 + i * (length / panelCount);
        const panelLine = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.045, roadWidth * 0.78), panelMaterial.clone());
        panelLine.position.set(x, 0.19, 0);
        group.add(panelLine);
    }

    return group;
}

function createRoadCornerPadAsset(THREE, point, roadWidth) {
    const group = new THREE.Group();
    const pad = new THREE.Mesh(
        new THREE.CylinderGeometry(roadWidth * 0.72, roadWidth * 0.72, 0.18, 28),
        createMapMaterial(THREE, 0x71858b, { emissive: 0x142d35, emissiveIntensity: 0.32, shininess: 65 })
    );
    pad.position.set(point.x, 0.08, point.z);
    const glow = new THREE.Mesh(
        new THREE.CircleGeometry(roadWidth * 0.84, 40),
        new THREE.MeshBasicMaterial({ color: 0x82fdff, transparent: true, opacity: 0.18, depthWrite: false })
    );
    glow.rotation.x = -Math.PI / 2;
    glow.position.set(point.x, 0.18, point.z);
    const ring = new THREE.Mesh(
        new THREE.TorusGeometry(roadWidth * 0.52, 0.045, 8, 40),
        new THREE.MeshBasicMaterial({ color: 0x29f2ff, transparent: true, opacity: 0.46 })
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.set(point.x, 0.24, point.z);
    group.add(pad, glow, ring);
    return group;
}

function createRoadPathAsset(THREE, points, roadWidth, roadHeight) {
    const group = new THREE.Group();
    group.name = "road-path";
    for (let i = 0; i < points.length - 1; i++) {
        group.add(createRoadSegmentAsset(THREE, points[i], points[i + 1], roadWidth, roadHeight));
    }
    points.forEach((point, index) => {
        if (index === 0 || index === points.length - 1) return;
        group.add(createRoadCornerPadAsset(THREE, point, roadWidth));
    });
    return group;
}
