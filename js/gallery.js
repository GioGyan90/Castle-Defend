// Model gallery UI.
const galleryPreviewItems = [];
let galleryAnimationId = null;

function createTankBossPreview(level) {
    const bossGroup = new THREE.Group();
    const matMain = new THREE.MeshPhongMaterial({
        color: level === 1 ? 0x8b3a3a : 0x1e272e,
        emissive: level === 1 ? 0x331111 : 0x000000
    });
    const matGun = new THREE.MeshPhongMaterial({
        color: 0x4a4a4a,
        specular: 0x666666,
        shininess: 50
    });

    const chassis = new THREE.Group();
    const mainBody = new THREE.Mesh(new THREE.BoxGeometry(2.3, 1.0, 2.8), matMain);
    mainBody.position.y = 0.5;
    chassis.add(mainBody);

    const skirtMat = new THREE.MeshPhongMaterial({ color: 0x2d2d2d });
    const leftSkirt = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.6, 2.5), skirtMat);
    leftSkirt.position.set(-1.2, 0.3, 0);
    const rightSkirt = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.6, 2.5), skirtMat);
    rightSkirt.position.set(1.2, 0.3, 0);
    chassis.add(leftSkirt, rightSkirt);

    const trackMat = new THREE.MeshPhongMaterial({ color: 0x1a1a1a });
    const leftTrack = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.2, 2.9), trackMat);
    leftTrack.position.set(-1.3, 0.1, 0);
    const rightTrack = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.2, 2.9), trackMat);
    rightTrack.position.set(1.3, 0.1, 0);
    chassis.add(leftTrack, rightTrack);

    const tower = new THREE.Group();
    const turretBase = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.6, 1.4), matMain);
    turretBase.position.y = 0.3;
    const turretTop = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.5, 1.1), matMain);
    turretTop.position.y = 0.85;
    tower.add(turretBase, turretTop);

    if (level === 2) {
        const barrelMat = new THREE.MeshPhongMaterial({ color: 0x3d3d3d, specular: 0x555555, shininess: 60 });
        const createDoubleBarrel = (xOffset) => {
            const barrelGroup = new THREE.Group();
            const mainBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.18, 1.4), barrelMat);
            mainBarrel.rotation.x = Math.PI / 2;
            mainBarrel.position.z = 0.7;
            const muzzleBrake = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.15, 0.3), barrelMat);
            muzzleBrake.rotation.x = Math.PI / 2;
            muzzleBrake.position.z = 1.45;
            const barrelShroud = new THREE.Mesh(
                new THREE.CylinderGeometry(0.12, 0.12, 0.8),
                new THREE.MeshPhongMaterial({ color: 0x5a5a5a })
            );
            barrelShroud.rotation.x = Math.PI / 2;
            barrelShroud.position.z = 0.4;
            barrelGroup.add(mainBarrel, muzzleBrake, barrelShroud);
            barrelGroup.position.set(xOffset, 0.5, 0);
            return barrelGroup;
        };
        tower.add(createDoubleBarrel(0.35), createDoubleBarrel(-0.35));
    } else {
        const barrelGroup = new THREE.Group();
        const mainBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.25, 1.6), matGun);
        mainBarrel.rotation.x = Math.PI / 2;
        mainBarrel.position.z = 0.8;
        const muzzleBrake = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.18, 0.4), matGun);
        muzzleBrake.rotation.x = Math.PI / 2;
        muzzleBrake.position.z = 1.7;
        const shroudMat = new THREE.MeshPhongMaterial({ color: 0x6b6b6b });
        const shroud1 = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.5), shroudMat);
        shroud1.rotation.x = Math.PI / 2;
        shroud1.position.z = 0.3;
        const shroud2 = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.5), shroudMat);
        shroud2.rotation.x = Math.PI / 2;
        shroud2.position.z = 0.8;
        const sling = new THREE.Mesh(
            new THREE.BoxGeometry(0.15, 0.3, 0.15),
            new THREE.MeshPhongMaterial({ color: 0x4a4a4a })
        );
        sling.position.set(0, 0.25, 0.5);
        barrelGroup.position.y = 0.5;
        barrelGroup.add(mainBarrel, muzzleBrake, shroud1, shroud2, sling);
        tower.add(barrelGroup);
    }

    tower.position.y = 1.2;
    bossGroup.add(chassis, tower);
    return bossGroup;
}

function createFinalBossPreview(color, emissive) {
    const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(2, 2, 3),
        new THREE.MeshPhongMaterial({ color, emissive })
    );
    mesh.position.y = 1;
    return mesh;
}

function getGalleryModels(type) {
    if (type === 'towers') {
        return [
            { name: 'Pulse Cannon', build: () => createWeaponModel(1) },
            { name: 'Rail Laser', build: () => createWeaponModel(2) },
            { name: 'Tesla Coil', build: () => createWeaponModel(3) }
        ];
    }

    return [
        { name: '普通机器人', build: () => createRobotEnemy(false) },
        { name: '精英无人机', build: () => createDroneEnemy(true) },
        { name: '无人机', build: () => createDroneEnemy(false) },
        { name: '装甲单位', build: () => createArmoredUnitEnemy() },
        { name: '悬浮装甲', build: () => createHoverArmorEnemy() },
        { name: 'Mission 1 Boss', build: () => createTankBossPreview(1) },
        { name: 'Mission 2 Boss', build: () => createTankBossPreview(2) },
        { name: 'Final Boss Alpha', build: () => {
            const group = new THREE.Group();
            createSteelGorillaBoss(group);
            return group;
        } },
        { name: 'Final Boss Beta Helicopter', build: () => {
            const group = new THREE.Group();
            createHelicopterBoss(group);
            return group;
        } },
        { name: 'Final Boss Beta Helicopter Edited', build: () => {
            return createImportedChopperModel(THREE);
        } }
    ];
}

function normalizePreviewModel(model) {
    const wrapper = new THREE.Group();
    wrapper.add(model);

    const box = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z) || 1;

    model.position.sub(center);
    wrapper.scale.setScalar(2.4 / maxDim);
    wrapper.rotation.x = -0.12;
    wrapper.rotation.y = 0.55;

    return wrapper;
}

function addPreviewCard(grid, item) {
    const card = document.createElement('div');
    card.className = 'model-card';

    const view = document.createElement('div');
    view.className = 'model-view';

    const label = document.createElement('div');
    label.className = 'model-name';
    label.textContent = item.name;

    card.appendChild(view);
    card.appendChild(label);
    grid.appendChild(card);

    const width = Math.max(1, view.clientWidth);
    const height = Math.max(1, view.clientHeight);
    const previewScene = new THREE.Scene();
    previewScene.background = null;

    const previewCamera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    previewCamera.position.set(0, 1.2, 5.2);
    previewCamera.lookAt(0, 0, 0);

    previewScene.add(new THREE.AmbientLight(0xffffff, 0.9));
    const previewLight = new THREE.DirectionalLight(0xffffff, 1.4);
    previewLight.position.set(4, 6, 5);
    previewScene.add(previewLight);

    const rendererPreview = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    rendererPreview.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    rendererPreview.setSize(width, height);
    view.appendChild(rendererPreview.domElement);

    const model = normalizePreviewModel(item.build());
    previewScene.add(model);
    galleryPreviewItems.push({ renderer: rendererPreview, scene: previewScene, camera: previewCamera, model });
}

function renderGalleryPreviews() {
    galleryPreviewItems.forEach(item => {
        item.model.rotation.y += 0.01;
        item.model.traverse(obj => {
            if (obj.userData && obj.userData.propellers) {
                obj.userData.propellers.forEach((prop, i) => {
                    prop.rotation.y += 0.35 * (i % 2 === 0 ? 1 : -1);
                });
            }
            if (obj.userData && obj.userData.mainRotor) {
                obj.userData.mainRotor.rotation.y += 0.45;
            }
        });
        item.renderer.render(item.scene, item.camera);
    });
    galleryAnimationId = requestAnimationFrame(renderGalleryPreviews);
}

function clearGalleryPreviews() {
    if (galleryAnimationId !== null) {
        cancelAnimationFrame(galleryAnimationId);
        galleryAnimationId = null;
    }

    galleryPreviewItems.forEach(item => {
        item.scene.traverse(obj => {
            if (obj.geometry) obj.geometry.dispose();
            if (obj.material) {
                if (Array.isArray(obj.material)) {
                    obj.material.forEach(mat => mat.dispose());
                } else {
                    obj.material.dispose();
                }
            }
        });
        item.renderer.dispose();
        if (item.renderer.domElement.parentNode) {
            item.renderer.domElement.parentNode.removeChild(item.renderer.domElement);
        }
    });
    galleryPreviewItems.length = 0;
}

function showModelGallery(type) {
    const gallery = document.getElementById('modelGallery');
    const title = document.getElementById('galleryTitle');
    const desc = document.getElementById('galleryDesc');
    const grid = document.getElementById('galleryGrid');

    clearGalleryPreviews();
    grid.innerHTML = '';
    title.textContent = type === 'towers' ? '防御塔展示馆' : '敌方单位展示馆';
    desc.textContent = type === 'towers' ? '当前可建造炮台模型' : '当前战役中出现的敌方单位与 Boss';
    gallery.style.display = 'flex';

    getGalleryModels(type).forEach(item => addPreviewCard(grid, item));
    galleryAnimationId = requestAnimationFrame(renderGalleryPreviews);
}

function closeModelGallery() {
    document.getElementById('modelGallery').style.display = 'none';
    clearGalleryPreviews();
}

