// Reusable functional map assets: spawn point, tower slots, portals, and base placement helpers.

function createMapMaterial(THREE, color, options = {}) {
    return new THREE.MeshPhongMaterial({
        color,
        emissive: options.emissive || 0x000000,
        emissiveIntensity: options.emissiveIntensity || 0,
        transparent: !!options.transparent,
        opacity: options.opacity === undefined ? 1 : options.opacity,
        shininess: options.shininess === undefined ? 45 : options.shininess
    });
}

function createMapGroundAsset(THREE, size) {
    const group = new THREE.Group();
    const ground = new THREE.Mesh(
        new THREE.PlaneGeometry(size, size),
        createMapMaterial(THREE, 0x263238, { emissive: 0x070c10, emissiveIntensity: 0.22 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.12;
    group.add(ground);

    const gridMaterial = new THREE.MeshBasicMaterial({ color: 0x1dd1a1, transparent: true, opacity: 0.14 });
    for (let x = -20; x <= 20; x += 8) {
        const line = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.02, 44), gridMaterial);
        line.position.set(x, -0.03, 0);
        group.add(line);
    }
    for (let z = -20; z <= 20; z += 8) {
        const line = new THREE.Mesh(new THREE.BoxGeometry(44, 0.02, 0.035), gridMaterial.clone());
        line.position.set(0, -0.025, z);
        group.add(line);
    }
    return group;
}

function createTowerSlotAsset(THREE, x, z) {
    const group = new THREE.Group();
    const pad = new THREE.Mesh(
        new THREE.CylinderGeometry(0.92, 1.05, 0.12, 32),
        createMapMaterial(THREE, 0x132f38, {
            emissive: 0x00d2d3,
            emissiveIntensity: 0.45,
            transparent: true,
            opacity: 0.88,
            shininess: 80
        })
    );
    const padRing = new THREE.Mesh(
        new THREE.TorusGeometry(1.03, 0.06, 8, 36),
        new THREE.MeshBasicMaterial({ color: 0x29f2ff, transparent: true, opacity: 0.82 })
    );
    const slot = new THREE.Mesh(
        new THREE.CylinderGeometry(0.68, 0.78, 0.42, 20),
        createMapMaterial(THREE, 0x5f747a, { emissive: 0x12333a, emissiveIntensity: 0.42, shininess: 70 })
    );
    const beaconMat = new THREE.MeshBasicMaterial({ color: 0xf1c40f, transparent: true, opacity: 0.92 });
    const beaconA = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.5, 0.12), beaconMat);
    const beaconB = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.5, 0.12), beaconMat.clone());
    const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.92, 0.06, 8, 28),
        new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0 })
    );

    pad.position.y = -0.17;
    padRing.rotation.x = Math.PI / 2;
    padRing.position.y = 0.08;
    slot.position.y = 0.07;
    beaconA.position.set(-0.82, 0.27, 0.82);
    beaconB.position.set(0.82, 0.27, -0.82);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.12;
    group.position.set(x, 0.18, z);
    group.add(pad, padRing, slot, beaconA, beaconB, ring);
    slot.userData = { occupied: false, ring: ring, group: group, currentWeapon: null };
    return { group, slot };
}

function portalNoise1D(x) {
    return (
        Math.sin(x * 1.7) * 0.5 +
        Math.sin(x * 2.9 + 1.7) * 0.28 +
        Math.sin(x * 5.1 + 4.2) * 0.16 +
        Math.sin(x * 9.3 + 2.4) * 0.08
    );
}

function portalRingPoint(cx, cy, rx, ry, angle, t, strength = 1) {
    const wobble = (
        portalNoise1D(angle * 2.1 + t * 0.8) * 8 +
        portalNoise1D(angle * 4.2 - t * 0.5) * 5 +
        Math.sin(angle * 3 - t * 1.2) * 3
    ) * strength;
    return {
        x: cx + Math.cos(angle) * (rx + wobble),
        y: cy + Math.sin(angle) * (ry + wobble * 0.7)
    };
}

function drawPortalOrganicRing(ctx, cx, cy, rx, ry, t, options) {
    const segments = options.segments || 180;
    const twoPi = Math.PI * 2;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = options.alpha;
    ctx.lineWidth = options.lineWidth;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.shadowBlur = options.blur;
    ctx.shadowColor = options.color1;

    const gradient = ctx.createLinearGradient(cx - rx, cy - ry, cx + rx, cy + ry);
    gradient.addColorStop(0, options.color2);
    gradient.addColorStop(0.38, options.color1);
    gradient.addColorStop(0.68, "#1d63ff");
    gradient.addColorStop(1, "#8d46ff");
    ctx.strokeStyle = gradient;

    ctx.beginPath();
    for (let i = 0; i <= segments; i++) {
        const angle = (i / segments) * twoPi + (options.offset || 0);
        const point = portalRingPoint(cx, cy, rx, ry, angle, t, options.strength || 1);
        if (i === 0) ctx.moveTo(point.x, point.y);
        else ctx.lineTo(point.x, point.y);
    }
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
}

function drawPortalArc(ctx, cx, cy, rx, ry, t, start, length, color, size, blur, alpha) {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.lineWidth = size;
    ctx.lineCap = "round";
    ctx.shadowBlur = blur;
    ctx.shadowColor = color;
    ctx.strokeStyle = color;
    ctx.beginPath();
    for (let i = 0; i <= 60; i++) {
        const p = i / 60;
        const point = portalRingPoint(cx, cy, rx, ry, start + p * length, t, 1.2);
        ctx.globalAlpha = alpha * Math.sin(p * Math.PI);
        if (i === 0) ctx.moveTo(point.x, point.y);
        else ctx.lineTo(point.x, point.y);
    }
    ctx.stroke();
    ctx.restore();
}

function drawPortalParticle(ctx, cx, cy, rx, ry, angle, t, size, color, alpha) {
    const point = portalRingPoint(cx, cy, rx, ry, angle, t, 1.35);
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = alpha;
    ctx.shadowBlur = 18;
    ctx.shadowColor = color;
    const gradient = ctx.createRadialGradient(point.x, point.y, 0, point.x, point.y, size * 5);
    gradient.addColorStop(0, "rgba(255,255,255,1)");
    gradient.addColorStop(0.24, color);
    gradient.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(point.x, point.y, size * 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
}

function drawSpawnPortalTexture(portal, t) {
    const ctx = portal.ctx;
    const size = portal.canvas.width;
    const cx = size / 2;
    const cy = size / 2;
    const base = size;
    const rx = base * (0.28 + Math.sin(t * 0.55) * 0.012);
    const ry = base * (0.28 + Math.cos(t * 0.48) * 0.01);

    ctx.clearRect(0, 0, size, size);
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    const mist = ctx.createRadialGradient(cx, cy, rx * 0.12, cx, cy, rx * 1.15);
    mist.addColorStop(0, "rgba(255,255,255,0.02)");
    mist.addColorStop(0.42, "rgba(0,78,255,0.12)");
    mist.addColorStop(0.75, "rgba(103,63,255,0.14)");
    mist.addColorStop(1, "rgba(0,0,0,0)");
    ctx.globalAlpha = 0.84;
    ctx.fillStyle = mist;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx * 1.08, ry * 1.08, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    drawPortalOrganicRing(ctx, cx, cy, rx * 1.02, ry * 1.02, t, {
        lineWidth: base * 0.04,
        blur: 42,
        alpha: 0.24,
        color1: "#1e67ff",
        color2: "#653dff",
        strength: 1.5,
        offset: t * 0.08
    });
    drawPortalOrganicRing(ctx, cx, cy, rx, ry, t, {
        lineWidth: base * 0.019,
        blur: 26,
        alpha: 0.76,
        color1: "#38a2ff",
        color2: "#4938ff",
        strength: 1.1,
        offset: -t * 0.04
    });
    drawPortalOrganicRing(ctx, cx, cy, rx * 0.98, ry * 0.98, t, {
        lineWidth: base * 0.007,
        blur: 12,
        alpha: 0.95,
        color1: "#b9efff",
        color2: "#3767ff",
        strength: 0.7,
        offset: t * 0.12
    });

    drawPortalArc(ctx, cx, cy, rx, ry, t, t * 0.55, Math.PI * 0.62, "#91eaff", base * 0.01, 24, 0.92);
    drawPortalArc(ctx, cx, cy, rx * 1.01, ry * 1.01, t, t * 0.37 + Math.PI * 0.85, Math.PI * 0.28, "#ffffff", base * 0.007, 34, 0.75);
    drawPortalArc(ctx, cx, cy, rx, ry, t, -t * 0.42 + Math.PI * 1.45, Math.PI * 0.34, "#7b48ff", base * 0.012, 36, 0.5);

    for (let i = 0; i < 8; i++) {
        const pulse = 0.45 + Math.sin(t * 1.6 + i * 1.9) * 0.35;
        drawPortalParticle(
            ctx,
            cx,
            cy,
            rx,
            ry,
            t * (0.35 + i * 0.035) + i * 0.72 + Math.sin(t * 0.4 + i) * 0.15,
            t,
            base * (0.0028 + pulse * 0.002),
            i % 3 === 0 ? "#ffffff" : i % 3 === 1 ? "#79ddff" : "#8b5cff",
            0.28 + pulse * 0.34
        );
    }
    portal.texture.needsUpdate = true;
}

function createSpawnPointAsset(THREE, spawnPoint, nextPoint) {
    const group = new THREE.Group();
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext("2d");
    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;

    const material = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        opacity: 0.94
    });
    const sprite = new THREE.Sprite(material);
    sprite.position.set(spawnPoint.x, 1.55, spawnPoint.z);
    sprite.scale.set(4.0, 4.0, 1);
    group.add(sprite);

    const groundGlow = new THREE.Mesh(
        new THREE.CircleGeometry(2.15, 48),
        new THREE.MeshBasicMaterial({
            color: 0x416dff,
            transparent: true,
            opacity: 0.22,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            side: THREE.DoubleSide
        })
    );
    groundGlow.rotation.x = -Math.PI / 2;
    groundGlow.position.set(spawnPoint.x, 0.06, spawnPoint.z);
    group.add(groundGlow);

    const dir = nextPoint.clone().sub(spawnPoint).normalize();
    const marker = new THREE.Mesh(
        new THREE.ConeGeometry(0.24, 0.7, 6),
        new THREE.MeshBasicMaterial({ color: 0x91eaff, transparent: true, opacity: 0.76 })
    );
    marker.position.set(spawnPoint.x - dir.x * 0.65, 0.4, spawnPoint.z - dir.z * 0.65);
    marker.rotation.x = Math.PI / 2;
    marker.rotation.z = Math.atan2(dir.z, dir.x);
    group.add(marker);

    const portal = {
        canvas,
        ctx,
        texture,
        sprite,
        groundGlow,
        marker,
        phase: Math.random() * Math.PI * 2
    };
    drawSpawnPortalTexture(portal, portal.phase);
    return { group, portal };
}

function updateSpawnPointAssets(portals, timeMs) {
    const t = timeMs * 0.001;
    portals.forEach((portal, index) => {
        const time = t + portal.phase;
        drawSpawnPortalTexture(portal, time);
        const pulse = 0.5 + Math.sin(time * 1.35) * 0.5;
        portal.sprite.scale.setScalar(3.85 + pulse * 0.22);
        portal.groundGlow.material.opacity = 0.16 + pulse * 0.1;
        portal.marker.rotation.y += 0.02 + index * 0.002;
    });
}

function placeBaseAsset(THREE, baseModel, pathPoints) {
    const basePosition = pathPoints[pathPoints.length - 1].clone();
    const approachPosition = pathPoints[pathPoints.length - 2];
    const approachDir = approachPosition.clone().sub(basePosition);
    baseModel.position.copy(basePosition);
    baseModel.rotation.y = Math.atan2(-approachDir.x, -approachDir.z);
    return baseModel;
}
