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
            { name: 'Tesla Coil', build: () => createWeaponModel(3) },
            { name: 'Airstrike', build: () => createWeaponModel(4) }
        ];
    }
    if (type === 'cards') {
        return [
            { name: 'Spade J', category: '+25% Fire Rate', build: () => createPlayingCardModel('J') },
            { name: 'Spade Q', category: '+5 Damage / +15% Fire Rate', build: () => createPlayingCardModel('Q') },
            { name: 'Spade K', category: '+10 Damage / +20% Fire Rate / +5 PTS/s', build: () => createPlayingCardModel('K') }
        ];
    }

    return [
        { name: '普通机器人', category: '步兵', soundModelType: 'robot', build: () => createRobotEnemy(false) },
        { name: '强化机器人', category: '步兵', soundModelType: 'heavyRobot', build: () => createHeavyRobotEnemy() },
        { name: '精英无人机', category: '空军', soundModelType: 'eliteDrone', build: () => createDroneEnemy(true) },
        { name: '无人机', category: '空军', soundModelType: 'drone', build: () => createDroneEnemy(false) },
        { name: '装甲单位', category: '装甲', soundModelType: 'armored', build: () => createArmoredUnitEnemy() },
        { name: '悬浮装甲', category: '空军', soundModelType: 'hoverArmor', build: () => createHoverArmorEnemy() },
        { name: 'Portal A', category: '传送门', soundModelType: 'portalA', build: () => createPortalAEnemy() },
        { name: 'Portal B', category: '传送门', soundModelType: 'portalB', build: () => createPortalBEnemy() },
        { name: 'Mission 1 Boss', category: 'Boss', soundModelType: 'tankBoss', build: () => createTankBossPreview(1) },
        { name: 'Mission 2 Boss', category: 'Boss', soundModelType: 'tankBoss', build: () => createTankBossPreview(2) },
        { name: 'Final Boss Alpha', build: () => {
            const group = new THREE.Group();
            createSteelGorillaBoss(group);
            return group;
        }, category: 'Boss', soundModelType: 'gorillaBoss' },
        { name: 'Chopper', build: () => {
            return createImportedChopperModel(THREE);
        }, category: 'Boss', soundModelType: 'helicopterBoss' },
        { name: 'Wheelbarrow', build: () => {
            return createWheelbarrowModel();
        }, category: '装甲', soundModelType: 'wheelbarrow' }
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

    const category = document.createElement('div');
    category.className = 'model-category';
    category.textContent = item.category || '';

    card.appendChild(view);
    card.appendChild(label);
    if (item.category) {
        card.appendChild(category);
    }

    if (item.soundModelType) {
        const audioBtn = document.createElement('button');
        const soundType = typeof getEnemyMovementSoundTypeByModel === 'function'
            ? getEnemyMovementSoundTypeByModel(item.soundModelType)
            : null;
        const soundLabel = soundType && ENEMY_MOVEMENT_SOUNDS[soundType]
            ? ENEMY_MOVEMENT_SOUNDS[soundType].label
            : '走路声';
        audioBtn.className = 'gallery-audio-btn';
        audioBtn.type = 'button';
        audioBtn.textContent = '播放走路音频';
        audioBtn.title = soundLabel;
        audioBtn.addEventListener('click', () => {
            if (typeof playEnemyWalkSample === 'function') {
                playEnemyWalkSample(item.soundModelType);
            }
        });
        card.appendChild(audioBtn);
    }

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
            if (obj.userData && obj.userData.wheelbarrow && obj.userData.cannonGroup) {
                obj.userData.cannonGroup.rotation.y = Math.sin(Date.now() * 0.002) * 0.3;
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
    grid.className = type === 'cards' ? 'model-grid card-model-grid' : 'model-grid';
    title.textContent = type === 'towers' ? t('towerGallery') : (type === 'cards' ? t('cardGallery') : t('enemyGallery'));
    desc.textContent = type === 'towers' ? (currentLanguage === 'en' ? 'Buildable defense models' : '当前可建造炮台模型') : (type === 'cards' ? (currentLanguage === 'en' ? 'Spade J/Q/K defense cards' : '黑桃 J/Q/K 防御卡牌') : (currentLanguage === 'en' ? 'Enemy units and bosses in the campaign' : '当前战役中出现的敌方单位与 Boss'));
    gallery.style.display = 'flex';

    getGalleryModels(type).forEach(item => addPreviewCard(grid, item));
    galleryAnimationId = requestAnimationFrame(renderGalleryPreviews);
}

function closeModelGallery() {
    document.getElementById('modelGallery').style.display = 'none';
    clearGalleryPreviews();
}

// ==================== 排行榜系统 ====================
const LEADERBOARD_KEY = 'castle_defense_leaderboard';

function getLeaderboard() {
    try {
        const data = localStorage.getItem(LEADERBOARD_KEY);
        return data ? JSON.parse(data) : [];
    } catch (e) {
        console.error('Failed to load leaderboard:', e);
        return [];
    }
}

function saveToLeaderboard(entry) {
    try {
        const leaderboard = getLeaderboard();
        leaderboard.push(entry);
        // Keep enough history so every mission can be represented on the home leaderboard.
        leaderboard.sort((a, b) => {
            if (a.level !== b.level) return a.level - b.level;
            if (b.score !== a.score) return b.score - a.score;
            return new Date(b.timestamp) - new Date(a.timestamp);
        });
        if (leaderboard.length > 200) {
            leaderboard.splice(200);
        }
        localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(leaderboard));
        return true;
    } catch (e) {
        console.error('Failed to save to leaderboard:', e);
        return false;
    }
}

function calculateLevelScore(level, remainingLives, killScore, isVictory) {
    if (level === 4) {
        if (!isVictory) return 0;
        const cfg = (typeof LEVELS !== 'undefined' && LEVELS[4]) ? LEVELS[4] : {};
        const timeLimitMs = cfg.timeLimitMs || 60000;
        const remainingMs = typeof attackTimeRemainingMs !== 'undefined' ? Math.max(0, attackTimeRemainingMs) : 0;
        const unitsUsed = typeof attackUnitsDeployed !== 'undefined' ? Math.max(0, attackUnitsDeployed) : 0;
        const timeRatio = Math.max(0, Math.min(1, remainingMs / timeLimitMs));
        const unitRatio = Math.max(0, Math.min(1, 1 - Math.max(0, unitsUsed - 3) / 17));
        return Math.max(180, Math.min(300, Math.round(180 + timeRatio * 72 + unitRatio * 48)));
    }

    // 基础分 = 剩余 HP × 20
    const bonusScore = Math.max(0, remainingLives * 20);
    // 总分 = 杀敌得分 + 关卡奖励分
    return killScore + bonusScore;
}

// ==================== 排行榜 UI 功能 ====================
function showLeaderboard() {
    const panel = document.getElementById('leaderboardPanel');
    const tbody = document.getElementById('leaderboardBody');
    const leaderboard = getLeaderboard();
    
    tbody.innerHTML = '';
    
    if (leaderboard.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:20px;">${currentLanguage === 'en' ? 'No records yet. Start a run and set the first score.' : '暂无记录，开始游戏创造你的第一个成绩吧！'}</td></tr>`;
    } else {
        [1, 2, 3, 4].forEach(level => {
            const levelEntries = leaderboard
                .filter(entry => entry.level === level)
                .sort((a, b) => {
                    if (b.score !== a.score) return b.score - a.score;
                    return new Date(b.timestamp) - new Date(a.timestamp);
                })
                .slice(0, 10);

            const sectionRow = document.createElement('tr');
            sectionRow.className = 'leaderboard-section-row';
            sectionRow.innerHTML = `<td colspan="6">Mission ${level}</td>`;
            tbody.appendChild(sectionRow);

            if (levelEntries.length === 0) {
                const emptyRow = document.createElement('tr');
                emptyRow.className = 'leaderboard-empty-row';
                emptyRow.innerHTML = `<td colspan="6">${currentLanguage === 'en' ? 'No clears yet' : '暂无通关记录'}</td>`;
                tbody.appendChild(emptyRow);
                return;
            }

            levelEntries.forEach((entry, index) => {
                const row = document.createElement('tr');
                const date = new Date(entry.timestamp);
                const timeStr = `${Math.floor(date.getMonth() + 1)}/${date.getDate()} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
                const detail = entry.level === 4
                    ? `${entry.clearTime || 0}s / ${entry.attackUnitsDeployed || 0}${currentLanguage === 'en' ? ' units' : '兵'}`
                    : `${entry.remainingLives} HP`;
                
                row.innerHTML = `
                    <td>${index + 1}</td>
                    <td>Mission ${entry.level}</td>
                    <td>${entry.playerName}</td>
                    <td><strong>${entry.score}</strong></td>
                    <td>${detail}</td>
                    <td>${timeStr}</td>
                `;
                tbody.appendChild(row);
            });
        });
    }
    
    panel.style.display = 'flex';
}

function closeLeaderboard() {
    document.getElementById('leaderboardPanel').style.display = 'none';
}

function clearLeaderboard() {
    if (confirm(currentLanguage === 'en' ? 'Clear all leaderboard records? This cannot be undone.' : '确定要清空所有排行榜记录吗？此操作不可恢复。')) {
        localStorage.removeItem(LEADERBOARD_KEY);
        showLeaderboard();
    }
}
