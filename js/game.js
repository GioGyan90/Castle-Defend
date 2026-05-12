/**
 * 游戏主逻辑文件
 * Emoji Castle Defense - Compact Mobile
 */

// ==================== 音频系统 ====================
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
let isMuted = false;

function playTone(freq, type, duration, vol = 0.05) {
    if (isMuted) return;
    try {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
        gain.gain.setValueAtTime(vol, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + duration);
    } catch (e) {}
}

// ==================== 游戏配置 ====================
// Game configuration lives in js/config.js.

let currentLevel = 1;
let score, lives, spawnedCount, gameOver, gameStarted = false, bossSpawned = false, firstBossSpawned = false;
let selectedWeaponType = null, isSellMode = false;
let isDebugMode = false;
let isPaused = false;
const enemies = [], bullets = [], weapons = [], particles = [], damageTexts = [], slots = [];
let pathPoints = [];
let alternateEnemyPathPoints = [];
const weaponDamageStats = [];
let weaponSerial = 0;
let levelStartTime = 0; // 关卡开始时间用于计算通关时间

const WEAPON_DISPLAY_NAMES = {
    1: getWeaponConfig(1).name,
    2: getWeaponConfig(2).name,
    3: getWeaponConfig(3).name
};

// ==================== Three.js 场景设置 ====================
const scene = new THREE.Scene(); 
scene.background = new THREE.Color(0x130f40);

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 2000);

// 存储摄像机基础位置用于震动效果
let baseCameraY = 35;
let baseCameraZ = 28;

function adjustCamera() {
    const aspect = window.innerWidth / window.innerHeight;
    const camDist = aspect < 1 ? 45 : 35; 
    baseCameraY = camDist;
    baseCameraZ = camDist * 0.8;
    camera.position.set(0, baseCameraY, baseCameraZ);
    camera.lookAt(0, -5, 0);
}
adjustCamera();

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
renderer.domElement.id = 'gameCanvas';

// 灯光
const light = new THREE.DirectionalLight(0xffffff, 1.2);
light.position.set(10, 30, 10);
scene.add(light);
scene.add(new THREE.AmbientLight(0xffffff, 0.7));

// Base model is defined separately; the map only controls endpoint placement.
const castle = createSpaceBaseModel(THREE);
let castleShakeTime = 0; // 城堡震动计时器

function shakeCastle(duration) {
    castleShakeTime = duration;
}

function flashBaseAlert(duration = 420) {
    if (!castle.userData || !castle.userData.hitAlertMaterial) return;
    castle.userData.hitAlertDuration = duration;
    castle.userData.hitAlertTime = duration;
}

function updateBaseAlert(deltaMs) {
    if (!castle.userData || !castle.userData.hitAlertMaterial) return;
    const duration = castle.userData.hitAlertDuration || 420;
    castle.userData.hitAlertTime = Math.max(0, (castle.userData.hitAlertTime || 0) - deltaMs);

    if (castle.userData.hitAlertTime <= 0) {
        castle.userData.hitAlertMaterial.opacity = 0;
        return;
    }

    const progress = 1 - castle.userData.hitAlertTime / duration;
    castle.userData.hitAlertMaterial.opacity = Math.sin(progress * Math.PI) * 0.95;
}

function setGameDimmed(isDimmed) {
    document.body.classList.toggle('game-dimmed', isDimmed);
}

scene.add(castle);

// ==================== 地图构建 ====================
function buildMap() {
    // 清理场景（保留 scene、light 和 castle）
    while (scene.children.length > 0) {
        const obj = scene.children[scene.children.length - 1];
        if (obj !== light && obj !== castle) {
            scene.remove(obj);
        } else {
            break;
        }
    }
    
    slots.length = 0;
    const cfg = LEVELS[currentLevel];
    pathPoints = cfg.points.map(p => new THREE.Vector3(p[0], 0, p[1]));
    alternateEnemyPathPoints = cfg.altEnemyPoints ? cfg.altEnemyPoints.map(p => new THREE.Vector3(p[0], 0, p[1])) : [];
    
    // 地面
    const ground = new THREE.Mesh(
        new THREE.PlaneGeometry(250 * 1.5, 250 * 1.5), 
        new THREE.MeshPhongMaterial({ color: 0x2d3436 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.1;
    scene.add(ground);
    
    const drawRoadPath = (points) => {
        points.forEach((pt, i) => {
            if (i >= points.length - 1) return;
            const nextRoadPt = points[i + 1];
            const dx = Math.abs(nextRoadPt.x - pt.x);
            const dz = Math.abs(nextRoadPt.z - pt.z);
            
            // 路面主体（亮灰色）
            const roadBase = new THREE.Mesh(
                new THREE.BoxGeometry(dx || 2, 0.15, dz || 2), 
                new THREE.MeshPhongMaterial({ color: 0x636e72, emissive: 0x2d3436, emissiveIntensity: 0.2 })
            );
            roadBase.position.set((pt.x + nextRoadPt.x) / 2, 0.01, (pt.z + nextRoadPt.z) / 2);
            scene.add(roadBase);
            
            // 内嵌黄色点缀灯光（分段式小方块，像 LED 灯珠）
            const dotSize = 0.25;
            const segments = 8; // 更多段，更短的灯点
            
            for (let s = 0; s < segments; s++) {
                const t = (s + 0.5) / segments;
                const stripX = pt.x + (nextRoadPt.x - pt.x) * t;
                const stripZ = pt.z + (nextRoadPt.z - pt.z) * t;
                
                const lightDot = new THREE.Mesh(
                    new THREE.BoxGeometry(dx > 0 ? dotSize : 0.15, 0.16, 
                                         dz > 0 ? dotSize : 0.15),
                    new THREE.MeshBasicMaterial({ color: 0xf1c40f, transparent: true, opacity: 0.95 })
                );
                lightDot.position.set(stripX, 0.02, stripZ);
                scene.add(lightDot);
            }
            
            // 道路边缘蓝色霓虹灯带
            const edgeLight1 = new THREE.Mesh(
                new THREE.BoxGeometry(dx || 0.1, 0.12, dz || 0.1),
                new THREE.MeshBasicMaterial({ color: 0x00d2d3, transparent: true, opacity: 0.6 })
            );
            edgeLight1.position.set((pt.x + nextRoadPt.x) / 2, 0.02, (pt.z + nextRoadPt.z) / 2 + (dz > 0 ? 0.8 : 0));
            scene.add(edgeLight1);
            
            const edgeLight2 = new THREE.Mesh(
                new THREE.BoxGeometry(dx || 0.1, 0.12, dz || 0.1),
                new THREE.MeshBasicMaterial({ color: 0x00d2d3, transparent: true, opacity: 0.6 })
            );
            edgeLight2.position.set((pt.x + nextRoadPt.x) / 2, 0.02, (pt.z + nextRoadPt.z) / 2 - (dz > 0 ? 0.8 : 0));
            scene.add(edgeLight2);
        });
    };

    // 路径 - 赛博公路风格（亮灰路面 + 内嵌黄色点缀灯光）
    drawRoadPath(pathPoints);
    if (cfg.altRoadPoints) {
        drawRoadPath(cfg.altRoadPoints.map(p => new THREE.Vector3(p[0], 0, p[1])));
    }
    
    // 武器槽位
    cfg.slots.forEach(pos => {
        const group = new THREE.Group();
        const slot = new THREE.Mesh(
            new THREE.CylinderGeometry(1, 1, 0.4, 16), 
            new THREE.MeshPhongMaterial({ color: 0x485e64 })
        );
        const ring = new THREE.Mesh(
            new THREE.TorusGeometry(1.2, 0.08, 8, 24), 
            new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0 })
        );
        ring.rotation.x = Math.PI / 2;
        group.position.set(pos.x, 0.2, pos.z);
        group.add(slot, ring);
        scene.add(group);
        slot.userData = { occupied: false, ring: ring, group: group, currentWeapon: null };
        slots.push(slot);
    });
    
    // 第二关特殊装饰：湖泊
    if (currentLevel === 2) {
        const lake = new THREE.Mesh(
            new THREE.CircleGeometry(5, 24), 
            new THREE.MeshPhongMaterial({ color: 0x0984e3, transparent: true, opacity: 0.4 })
        );
        lake.rotation.x = -Math.PI / 2;
        lake.position.set(0, 0.02, 0);
        scene.add(lake);
    }
    
    // Endpoint base position and gate direction.
    const castlePos = pathPoints[pathPoints.length - 1].clone();
    const approachPos = pathPoints[pathPoints.length - 2];
    const approachDir = approachPos.clone().sub(castlePos);
    castle.position.copy(castlePos);
    castle.rotation.y = Math.atan2(-approachDir.x, -approachDir.z);
    castleShakeTime = 0; // 重置震动状态
}

// ==================== 游戏流程控制 ====================
function startGame(debug = false) {
    if (!isMuted) audioCtx.resume();
    setGameDimmed(false);
    isDebugMode = debug;
    isPaused = false;
    document.getElementById('overlay').style.display = 'none';
    document.getElementById('pauseOverlay').style.display = 'none';
    document.getElementById('status-bar').style.display = 'flex';
    document.getElementById('bottom-nav').style.display = 'flex';
    buildMap();
    score = isDebugMode ? 1000 : (currentLevel === 1 ? 3 : (currentLevel === 2 ? 15 : 30));
    lives = 5;
    spawnedCount = 0;
    gameOver = false;
    bossSpawned = false;
    firstBossSpawned = false;
    levelStartTime = Date.now(); // 记录关卡开始时间
    updateUI();
    gameStarted = true;
    lastTime = 0;
    spawnTimer = 0;
}

function clearRunObjects() {
    setGameDimmed(false);
    enemies.forEach(e => scene.remove(e.mesh));
    enemies.length = 0;
    bullets.forEach(b => {
        scene.remove(b.mesh);
        if (b.glowMesh) scene.remove(b.glowMesh);
    });
    bullets.length = 0;
    weapons.forEach(w => scene.remove(w.mesh));
    weapons.length = 0;
    particles.forEach(p => scene.remove(p.mesh || p));
    particles.length = 0;
    damageTexts.forEach(d => scene.remove(d.sprite));
    damageTexts.length = 0;
    slots.length = 0;
    weaponDamageStats.length = 0;
    weaponSerial = 0;
    selectedWeaponType = null;
    isSellMode = false;
}

function showPauseMenu() {
    if (!gameStarted || gameOver) return;
    isPaused = true;
    document.getElementById('pauseOverlay').style.display = 'flex';
    updateSoundButton();
}

function resumeGame() {
    isPaused = false;
    lastTime = 0;
    document.getElementById('pauseOverlay').style.display = 'none';
}

function returnToHome() {
    clearRunObjects();
    isPaused = false;
    gameStarted = false;
    gameOver = false;
    isDebugMode = false;
    currentLevel = 1;
    buildMap();
    document.getElementById('pauseOverlay').style.display = 'none';
    document.getElementById('endScreen').style.display = 'none';
    document.getElementById('status-bar').style.display = 'none';
    document.getElementById('bottom-nav').style.display = 'none';
    document.getElementById('overlay').style.display = 'flex';
    hideLevelSelect();
}

function restartCurrentLevel() {
    const restartDebugMode = isDebugMode;
    clearRunObjects();
    document.getElementById('pauseOverlay').style.display = 'none';
    document.getElementById('endScreen').style.display = 'none';
    startGame(restartDebugMode);
}

function updateSoundButton() {
    const btn = document.getElementById('soundToggleBtn');
    if (btn) btn.innerText = isMuted ? '开启声音' : '关闭声音';
}

function toggleSound() {
    isMuted = !isMuted;
    if (isMuted && audioCtx.state === 'running') {
        audioCtx.suspend();
    } else if (!isMuted) {
        audioCtx.resume();
        playTone(520, 'sine', 0.12, 0.04);
    }
    updateSoundButton();
}

// 显示关卡选择下拉列表
function showLevelSelect() {
    document.getElementById('levelSelect').style.display = 'block';
}

// 隐藏关卡选择下拉列表
function hideLevelSelect() {
    document.getElementById('levelSelect').style.display = 'none';
}

// 根据选择的关卡开始 Debug 模式
function startDebugWithLevel() {
    const levelDropdown = document.getElementById('levelDropdown');
    currentLevel = parseInt(levelDropdown.value);
    hideLevelSelect();
    startGame(true);
}

function handleEndClick() {
    const btnText = document.getElementById('endBtn').innerText;
    if (btnText === "REPLAY") {
        currentLevel = 1;
    } else if (btnText === "NEXT MISSION") {
        currentLevel = 2;
    } else if (btnText === "MISSION 3") {
        currentLevel = 3;
    }
    resetUIForLevel();
}

function resetUIForLevel() {
    clearRunObjects();
    isPaused = false;
    document.getElementById('endScreen').style.display = 'none';
    document.getElementById('pauseOverlay').style.display = 'none';
    document.getElementById('overlay').style.display = 'flex';
    gameStarted = false;
    isDebugMode = false;
}

// ==================== 武器系统 ====================
function buyWeapon(type) {
    if (currentLevel === 1 && type === 3) return;
    if (gameOver || isPaused || score < PRICES[type]) return;
    isSellMode = false;
    document.getElementById('btnSell').classList.remove('active');
    selectedWeaponType = type;
    document.querySelectorAll('.weapon-btn').forEach(b => b.style.border = "none");
    document.getElementById('btn' + type).style.border = "2px solid white";
    slots.forEach(s => {
        if (!s.userData.occupied) {
            s.userData.ring.material.color.set(0xffffff);
            s.userData.ring.material.opacity = 0.8;
        }
    });
}

function toggleSellMode() {
    if (gameOver || isPaused) return;
    isSellMode = !isSellMode;
    selectedWeaponType = null;
    document.querySelectorAll('.weapon-btn').forEach(b => b.style.border = "none");
    document.getElementById('btnSell').classList.toggle('active', isSellMode);
    slots.forEach(s => {
        if (isSellMode && s.userData.occupied) {
            s.userData.ring.material.color.set(0xff0000);
            s.userData.ring.material.opacity = 0.8;
        } else {
            s.userData.ring.material.opacity = 0;
        }
    });
}

function handleInput(clientX, clientY) {
    if (gameOver || isPaused || !gameStarted) return;
    const rect = renderer.domElement.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((clientY - rect.top) / rect.height) * 2 + 1;
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(x, y), camera);
    const intersects = raycaster.intersectObjects(slots);
    
    if (intersects.length > 0) {
        const slot = intersects[0].object;
        if (selectedWeaponType && !slot.userData.occupied) {
            score -= PRICES[selectedWeaponType];
            const model = createWeaponModel(selectedWeaponType);
            model.position.copy(slot.userData.group.position);
            scene.add(model);
            const weaponId = ++weaponSerial;
            const weaponConfig = getWeaponConfig(selectedWeaponType);
            const damageStat = {
                id: weaponId,
                type: selectedWeaponType,
                label: `${WEAPON_DISPLAY_NAMES[selectedWeaponType]} #${weaponId}`,
                totalDamage: 0
            };
            weaponDamageStats.push(damageStat);
            const wObj = {
                mesh: model,
                type: selectedWeaponType,
                damageStat: damageStat,
                basePosition: model.position.clone(),
                lastFire: 0,
                fireInterval: weaponConfig.fireIntervalMs,
                burstCount: 0,
                burstTotal: weaponConfig.burstTotal || 1
            };
            weapons.push(wObj);
            slot.userData.occupied = true;
            slot.userData.currentWeapon = wObj;
            selectedWeaponType = null;
            updateUI();
            slots.forEach(s => s.userData.ring.material.opacity = 0);
            document.querySelectorAll('.weapon-btn').forEach(b => b.style.border = "none");
        } else if (isSellMode && slot.userData.occupied) {
            const wObj = slot.userData.currentWeapon;
            score += Math.floor(PRICES[wObj.type] / 2);
            scene.remove(wObj.mesh);
            weapons.splice(weapons.indexOf(wObj), 1);
            slot.userData.occupied = false;
            slot.userData.currentWeapon = null;
            playTone(300, 'sine', 0.2, 0.1);
            updateUI();
            toggleSellMode();
        }
    }
}

// 事件监听
window.addEventListener('mousedown', (e) => {
    if (e.target.closest('#bottom-nav') || e.target.closest('#status-bar') || e.target.closest('#endScreen') || e.target.closest('#overlay') || e.target.closest('#modelGallery')) return;
    handleInput(e.clientX, e.clientY);
});

window.addEventListener('touchstart', (e) => {
    if (e.target.closest('#bottom-nav') || e.target.closest('#status-bar') || e.target.closest('#endScreen') || e.target.closest('#overlay') || e.target.closest('#modelGallery')) return;
    handleInput(e.touches[0].clientX, e.touches[0].clientY);
}, { passive: false });

// ==================== 武器模型创建 ====================
// Player weapon models and projectile logic live in js/weapons.js.

// Enemy and Boss models live in js/enemies.js.

// Model gallery UI lives in js/gallery.js.

function updateUI() {
    document.getElementById('scoreVal').innerText = score;
    document.getElementById('livesVal').innerText = lives;
    document.getElementById('levelVal').innerText = currentLevel;
    [1, 2, 3].forEach(i => {
        const priceEl = document.getElementById('price' + i);
        if (priceEl) {
            priceEl.innerText = `${PRICES[i]} Pts`;
        }
    });
    const teslaBtn = document.getElementById('btn3');
    teslaBtn.style.display = currentLevel === 1 ? 'none' : '';
    if (currentLevel === 1 && selectedWeaponType === 3) {
        selectedWeaponType = null;
    }
    [1, 2, 3].forEach(i => {
        document.getElementById('btn' + i).disabled = score < PRICES[i];
    });
}

function updateBossHP(enemy) {
    if (!enemy.hpBar || !enemy.hpBar.userData.ctx) return;
    const pct = Math.max(0, enemy.health / enemy.maxHealth);
    
    // 更新血条宽度（通过重新绘制 canvas）
    const bar = enemy.hpBar;
    const ctx = bar.userData.ctx;
    const canvas = bar.userData.canvas;
    const maxHp = bar.userData.maxHp;
    
    // 清空并重新绘制血条
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 根据血量设置颜色
    let color = '#00ff00'; // 绿色
    if (pct <= 0.6 && pct > 0.3) {
        color = '#ffff00'; // 黄色
    } else if (pct <= 0.3) {
        color = '#ff0000'; // 红色
    }
    
    // 绘制血条前景
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, Math.floor(canvas.width * pct), canvas.height);
    
    // 更新纹理
    bar.userData.texture.needsUpdate = true;
}

function createExplosionEffect(position, radius = 3) {
    for (let p = 0; p < 18; p++) {
        const particle = new THREE.Mesh(
            new THREE.BoxGeometry(0.2, 0.2, 0.2),
            new THREE.MeshBasicMaterial({ color: p % 2 === 0 ? 0xff4d4d : 0xffaa00 })
        );
        particle.position.copy(position);
        particle.userData = {
            velocity: new THREE.Vector3(
                (Math.random() - 0.5) * 0.55,
                Math.random() * 0.35,
                (Math.random() - 0.5) * 0.55
            ),
            life: 26
        };
        scene.add(particle);
        particles.push(particle);
    }

    [radius / 3, radius * 2 / 3, radius].forEach((ringRadius, index) => {
        const ring = new THREE.Mesh(
            new THREE.RingGeometry(ringRadius - 0.035, ringRadius + 0.035, 80),
            new THREE.MeshBasicMaterial({
                color: index === 2 ? 0xff4d4d : (index === 1 ? 0xffaa00 : 0xffffff),
                transparent: true,
                opacity: 0.78 - index * 0.12,
                side: THREE.DoubleSide,
                depthWrite: false
            })
        );
        ring.position.set(position.x, 0.035 + index * 0.006, position.z);
        ring.rotation.x = -Math.PI / 2;
        ring.userData = {
            velocity: new THREE.Vector3(0, 0, 0),
            life: 28,
            isExplosionRing: true,
            maxLife: 28
        };
        scene.add(ring);
        particles.push(ring);
    });

    playTone(90, 'sawtooth', 0.25, 0.08);
}

function checkVictoryAfterKill(killedIsBoss) {
    if (killedIsBoss && bossSpawned && enemies.length === 0) {
        endGame(true);
    }
}

function explodeEnemy(position, sourceEnemy) {
    const explosionRadius = 3;
    createExplosionEffect(position, explosionRadius);
    enemies.slice().forEach(enemy => {
        if (enemy === sourceEnemy || enemy.isDead) return;
        const dx = enemy.mesh.position.x - position.x;
        const dz = enemy.mesh.position.z - position.z;
        if (Math.sqrt(dx * dx + dz * dz) <= explosionRadius) {
            damageEnemy(enemy, 5, null, true);
        }
    });
}

function killEnemy(enemy, sourceBullet = null, skipExplosion = false) {
    if (!enemy || enemy.isDead) return;
    enemy.isDead = true;
    enemy.isStalledAtZero = false;
    if (enemy.zeroHealthTimer) {
        clearTimeout(enemy.zeroHealthTimer);
        enemy.zeroHealthTimer = null;
    }

    const killedIsBoss = enemy.isBoss;
    const deathPosition = enemy.mesh.position.clone();
    
    // Remove from physics world first
    if (typeof removeEnemyFromBodyList === 'function') {
        removeEnemyFromBodyList(enemy.mesh);
    }
    
    scene.remove(enemy.mesh);
    const idx = enemies.indexOf(enemy);
    if (idx !== -1) {
        enemies.splice(idx, 1);
    }

    if (sourceBullet) {
        registerWeaponKill(sourceBullet);
    }
    score += killedIsBoss ? 50 : 1;
    updateUI();

    if (!skipExplosion) {
        explodeEnemy(deathPosition, enemy);
    }

    checkVictoryAfterKill(killedIsBoss);
}

function scheduleZeroHealthDecay(enemy) {
    if (enemy.zeroHealthTimer || enemy.isDead) return;
    enemy.isStalledAtZero = true;
    enemy.zeroHealthTimer = setTimeout(() => {
        enemy.zeroHealthTimer = null;
        if (!enemy.isDead && enemies.includes(enemy) && Math.abs(enemy.health) < 0.0001) {
            damageEnemy(enemy, 1);
        }
    }, 500);
}

function formatDamageNumber(amount) {
    return Math.abs(amount - Math.round(amount)) < 0.01 ? String(Math.round(amount)) : amount.toFixed(1);
}

function showDamageText(enemy, amount, isCrit = false) {
    if (!enemy || !enemy.mesh) return;
    const canvas = document.createElement('canvas');
    canvas.width = 320;
    canvas.height = 160;
    const ctx = canvas.getContext('2d');
    const text = formatDamageNumber(amount);
    ctx.font = isCrit ? '900 85px Arial' : '800 75px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = 15;
    ctx.strokeStyle = 'rgba(10, 10, 16, 0.75)';
    ctx.fillStyle = isCrit ? '#ffb13b' : '#c8c8c8';
    ctx.strokeText(text, canvas.width / 2, canvas.height / 2);
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        opacity: 1,
        depthWrite: false
    });
    const sprite = new THREE.Sprite(material);
    const offsetX = (Math.random() - 0.5) * 0.45;
    const offsetZ = (Math.random() - 0.5) * 0.35;
    const height = enemy.isBoss ? 3.2 : 1.5;
    sprite.position.copy(enemy.mesh.position).add(new THREE.Vector3(offsetX, height, offsetZ));
    sprite.scale.set(isCrit ? 3.38 : 2.75, isCrit ? 1.7 : 1.38, 1);
    scene.add(sprite);
    damageTexts.push({
        sprite,
        material,
        texture,
        age: 0,
        life: 1000,
        riseDuration: 500,
        riseDistance: 1.0,
        startY: sprite.position.y
    });
}

function damageEnemy(enemy, amount, sourceBullet = null, fromExplosion = false) {
    if (!enemy || enemy.isDead) return;
    showDamageText(enemy, amount, !!(sourceBullet && sourceBullet.isCrit));
    const effectiveDamage = Math.min(amount, Math.max(enemy.health, 0));
    const sourceWeapon = sourceBullet && sourceBullet.ownerWeapon;
    if (effectiveDamage > 0 && sourceWeapon && sourceWeapon.damageStat) {
        sourceWeapon.damageStat.totalDamage += effectiveDamage;
    }
    enemy.health -= amount;
    if (Math.abs(enemy.health) < 0.0001) {
        enemy.health = 0;
    }

    if (enemy.isBoss) {
        updateBossHP(enemy);
    }

    if (enemy.health < 0) {
        killEnemy(enemy, sourceBullet, false);
    } else if (enemy.health === 0) {
        scheduleZeroHealthDecay(enemy);
    }
}

function formatDamageValue(value) {
    return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function renderDamageSummary() {
    const summaryEl = document.getElementById('damageSummary');
    if (!summaryEl) return;

    const stats = weaponDamageStats
        .filter(stat => stat.totalDamage > 0)
        .slice()
        .sort((a, b) => b.totalDamage - a.totalDamage || a.id - b.id);

    if (stats.length === 0) {
        summaryEl.innerHTML = `
            <div class="damage-summary-title">防御塔总伤害</div>
            <div class="damage-empty">本局没有防御塔造成伤害。</div>
        `;
        return;
    }

    const rows = stats.map(stat => `
        <div class="damage-row">
            <span>${stat.label}</span>
            <span class="damage-value">${formatDamageValue(stat.totalDamage)}</span>
        </div>
    `).join('');

    summaryEl.innerHTML = `
        <div class="damage-summary-title">防御塔总伤害</div>
        ${rows}
    `;
}

function getTargetForWeapon(w) {
    const config = getWeaponConfig(w.type);
    const range = config ? config.range : null;
    if (range === null || range === undefined) {
        return enemies.find(e => !e.isDead);
    }

    const maxRange = range;
    let bestTarget = null;
    let bestDistance = Infinity;
    enemies.forEach(e => {
        if (e.isDead) return;
        const distance = w.mesh.position.distanceTo(e.mesh.position);
        if (distance <= maxRange && distance < bestDistance) {
            bestTarget = e;
            bestDistance = distance;
        }
    });
    return bestTarget;
}

function createEnemyFromConfig(enemyConfig) {
    let enemyMesh;
    if (enemyConfig.modelType === 'robot') {
        enemyMesh = createRobotEnemy(false);
    } else if (enemyConfig.modelType === 'eliteDrone') {
        enemyMesh = createDroneEnemy(true);
    } else if (enemyConfig.modelType === 'drone') {
        enemyMesh = createDroneEnemy(false);
    } else if (enemyConfig.modelType === 'armored') {
        enemyMesh = createArmoredUnitEnemy();
    } else if (enemyConfig.modelType === 'hoverArmor') {
        enemyMesh = createHoverArmorEnemy();
    } else if (enemyConfig.modelType === 'wheelbarrow') {
        enemyMesh = createWheelbarrowModel();
    } else {
        enemyMesh = createRobotEnemy(false);
    }

    if (enemyConfig.scale) {
        enemyMesh.scale.setScalar(enemyConfig.scale);
    }

    return enemyMesh;
}

// ==================== 游戏主循环 ====================
let lastTime = 0;
let spawnTimer = 0;

function gameLoop(time) {
    requestAnimationFrame(gameLoop);
    
    // 城堡震动效果更新（屏幕震动）
    if (castleShakeTime > 0) {
        castleShakeTime -= 16; // 约 60fps
        const shakeIntensity = 0.15 * (castleShakeTime / 300);
        // 震动摄像机来模拟屏幕震动效果
        camera.position.x = Math.sin(time * 0.05) * shakeIntensity;
        camera.position.y = baseCameraY + Math.cos(time * 0.07) * shakeIntensity * 0.5;
    } else {
        // 恢复摄像机正常位置
        adjustCamera();
    }
    updateBaseAlert(16);
    
    // Boss 血条始终面向摄像机
    enemies.forEach(e => {
        if (e.isBoss && e.hpBarContainer) {
            e.hpBarContainer.lookAt(camera.position);
        }
    });
    
    // Tesla 炮台击杀数数字标签更新 - 机制已移除，不再显示击杀数
    
    if (!gameStarted || gameOver || isPaused) {
        if (isPaused) {
            lastTime = time;
        }
        renderer.render(scene, camera);
        return;
    }
    
    const delta = time - lastTime;
    lastTime = time;
    
    // 敌人生成
    spawnTimer += delta;
    if (spawnTimer > 400 && spawnedCount < LEVELS[currentLevel].enemies) {
        spawnTimer = 0;
        spawnedCount++;
        
        const spawnConfig = chooseEnemyConfig(currentLevel);
        const enemyMesh = createEnemyFromConfig(spawnConfig);
        const health = spawnConfig.health;
        const speed = getEnemySpeed(spawnConfig);
        const isDrone = !!spawnConfig.isDrone;

        const enemyPath = (currentLevel === 3 && alternateEnemyPathPoints.length > 0 && Math.random() < (LEVELS[3].altEnemyChance || 0))
            ? alternateEnemyPathPoints
            : pathPoints;

        const e = { 
            mesh: enemyMesh, 
            pathIdx: 0, 
            pathPoints: enemyPath,
            health: health, 
            speed: speed,
            isDrone: isDrone,
            modelType: spawnConfig.modelType
        };
        enemyMesh.position.copy(enemyPath[0]);
        
        // Initialize physics for this enemy if physics world exists
        if (typeof initEnemyPhysics === 'function') {
            initEnemyPhysics();
        }
        if (typeof addEnemyRigidBody === 'function' && !enemyMesh.userData.hasPhysics) {
            // Add a sphere rigid body for collision detection
            const radius = 0.35; // Slightly smaller than visual model to prevent excessive pushing
            const height = 1.2;
            const mass = 2; // Lighter mass for easier movement
            addEnemyRigidBody(enemyMesh, radius, height, mass);
            enemyMesh.userData.hasPhysics = true;
        }
        
        scene.add(enemyMesh);
        enemies.push(e);
    } else if (spawnedCount >= LEVELS[currentLevel].enemies && enemies.length === 0 && !bossSpawned) {
        spawnBoss();
    }
    
    // 第三关特殊逻辑：第一个 Boss 在小兵出一半时出场
    if (currentLevel === 3 && !firstBossSpawned && spawnedCount >= Math.floor(LEVELS[3].enemies / 2)) {
        spawnFirstBoss();
    }
    
    // 敌人移动与动画
    for (let i = enemies.length - 1; i >= 0; i--) {
        const e = enemies[i];
        if (e.isStalledAtZero) {
            continue;
        }

        const enemyPath = e.pathPoints || pathPoints;
        const target = enemyPath[e.pathIdx + 1];
        if (!target) continue;
        
        const currentPos = e.mesh.position.clone();
        if (e.isFlyingBoss) {
            currentPos.y = 0;
        }
        const dir = new THREE.Vector3().subVectors(target, currentPos);
        const dist = dir.length();
        
        if (dist < 0.5) {
            e.pathIdx++;
            if (e.pathIdx >= enemyPath.length - 1) {
                // Remove from physics world first
                if (typeof removeEnemyFromBodyList === 'function') {
                    removeEnemyFromBodyList(e.mesh);
                }
                scene.remove(e.mesh);
                enemies.splice(i, 1);
                lives -= e.isBoss ? 5 : 1;
                // 城堡被攻击：震动 + 音效
                shakeCastle(300);
                flashBaseAlert();
                playTone(150, 'sawtooth', 0.3, 0.08);
                updateUI();
                if (lives <= 0) {
                    endGame(false);
                }
                continue;
            }
        } else {
            dir.normalize();
            // Apply movement to both visual mesh and physics body
            const moveDistance = e.speed;
            
            // Update visual position
            e.mesh.position.add(dir.multiplyScalar(moveDistance));
            e.mesh.lookAt(target);
            
            // Also update physics body velocity to match movement direction
            if (e.mesh.userData.physicsBody) {
                const body = e.mesh.userData.physicsBody;
                // Only set Z velocity for forward movement, X velocity handled by collision
                body.velocity.z = dir.z * moveDistance * 60; // Scale for physics timestep
                // Do not override X velocity - let physics handle lateral collisions
            }
        }
        
        // 播放动画
        animateEnemy(e, time);
    }
    
    // Update enemy physics simulation (collision avoidance between enemies)
    if (typeof updateEnemyPhysics === 'function') {
        updateEnemyPhysics(time);
    }
    
    // 武器射击
    weapons.forEach(w => {
        if (w.type === 3) {
            updateTeslaChargeBar(w.mesh, time);
        }

        if (w.critShakeDuration !== undefined && w.critShakeDuration > 0) {
            w.critShakeDuration -= 16;
            const basePos = w.basePosition || w.mesh.position.clone();
            const totalDuration = w.critShakeTotalDuration || 180;
            const fade = Math.max(0, w.critShakeDuration / totalDuration);
            const intensity = (w.critShakeIntensity || 0.08) * fade;
            w.mesh.position.copy(basePos).add(new THREE.Vector3(
                Math.sin(time * 0.45) * intensity,
                0,
                Math.cos(time * 0.52) * intensity
            ));
            if (w.critShakeDuration <= 0) {
                w.mesh.position.copy(basePos);
            }
        }

        // 后坐力动画更新：炮台开火后炮管后移再归位
        if (w.recoilDuration !== undefined && w.recoilDuration > 0) {
            w.recoilDuration -= 16; // 约 60fps
            const totalDuration = w.recoilTotalDuration || 240;
            const recoilProgress = 1 - Math.max(0, w.recoilDuration / totalDuration);
            const recoilAmount = -w.recoilDistance * Math.sin(recoilProgress * Math.PI);
            
            // 只移动炮管组，而不是整个炮台
            if (w.mesh.userData.barrelGroup) {
                const baseZ = w.mesh.userData.barrelBaseZ || 0;
                w.mesh.userData.barrelGroup.position.z = baseZ + recoilAmount;
                if (w.recoilDuration <= 0) {
                    w.mesh.userData.barrelGroup.position.z = baseZ;
                }
            }
        }
        
        if (w.type === 2) {
            // Rail: 连发 6 发之后有 1 秒间隔
            if (w.burstCount < w.burstTotal) {
                // 连发期间每发间隔约 217ms (1300ms / 6)
                const burstInterval = w.fireInterval / w.burstTotal;
                if (time - w.lastFire > burstInterval) {
                    const target = getTargetForWeapon(w);
                    if (target) {
                        w.lastFire = time;
                        w.burstCount++;
                        fireBullet(w, target, 8);
                    }
                }
            } else {
                // 等待 1.3 秒后重置连发计数
                if (time - w.lastFire > w.fireInterval) {
                    w.burstCount = 0;
                }
            }
        } else if (w.type === 3) {
            // Tesla: 激光攻击，充能效果
            if (time - w.lastFire > w.fireInterval) {
                const target = getTargetForWeapon(w);
                if (target) {
                    w.lastFire = time;
                    
                    // 充能动画：从下往上的灯塔充能效果
                    const crystal = w.mesh.userData.crystal;
                    if (crystal) {
                        // 充能阶段：逐渐变亮并向上扩展
                        let chargePhase = 0;
                        const chargeDuration = getWeaponConfig(3).chargeTimeMs;
                        const chargeStartTime = Date.now();
                        
                        const chargeInterval = setInterval(() => {
                            const elapsed = Date.now() - chargeStartTime;
                            const progress = Math.min(elapsed / chargeDuration, 1);
                            
                            // 颜色从暗紫到亮白
                            const brightness = Math.floor(progress * 255);
                            crystal.material.emissive.setRGB(progress, progress * 0.5, progress);
                            const baseScale = crystal.userData.baseScale || new THREE.Vector3(1, 1, 1);
                            crystal.scale.copy(baseScale).multiplyScalar(1 + progress * 0.5);
                            
                            // 创建向上扩展的光环
                            if (progress < 1 && chargePhase % 3 === 0) {
                                const ringGeo = new THREE.RingGeometry(0.5, 0.6, 16);
                                const ringMat = new THREE.MeshBasicMaterial({
                                    color: 0xd4a5ff,
                                    transparent: true,
                                    opacity: 1 - progress
                                });
                                const ring = new THREE.Mesh(ringGeo, ringMat);
                                ring.position.copy(w.mesh.position).add(new THREE.Vector3(0, 1 + progress * 2, 0));
                                ring.rotation.x = Math.PI / 2;
                                scene.add(ring);
                                
                                // 光环向上移动并消失
                                const animateRing = () => {
                                    ring.position.y += 0.1;
                                    ring.material.opacity -= 0.05;
                                    ring.scale.multiplyScalar(1.05);
                                    if (ring.material.opacity > 0) {
                                        requestAnimationFrame(animateRing);
                                    } else {
                                        scene.remove(ring);
                                    }
                                };
                                animateRing();
                            }
                            chargePhase++;
                            
                            if (progress >= 1) {
                                clearInterval(chargeInterval);
                                // 发射激光
                                fireBullet(w, target, 15);
                                // 重置水晶状态
                                setTimeout(() => {
                                    if (crystal) {
                                        crystal.material.emissive.setHex(0x000000);
                                        const baseScale = crystal.userData.baseScale || new THREE.Vector3(1, 1, 1);
                                        crystal.scale.copy(baseScale);
                                    }
                                }, 300);
                            }
                        }, 50);
                    } else {
                        fireBullet(w, target, 15);
                    }
                }
            }
        } else {
            // Pulse (type 1): 普通攻击逻辑
            if (time - w.lastFire > w.fireInterval) {
                const target = getTargetForWeapon(w);
                if (target) {
                    w.lastFire = time;
                    fireBullet(w, target, 3);
                }
            }
        }
    });
    
    // 子弹移动与碰撞
    for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        
        if (b.isTesla) {
            // Tesla 激光：不移动，使用持续时间控制
            b.life--;
            
            // 对范围内所有敌人造成伤害
            enemies.slice().forEach(e => {
                // 计算敌人到激光线的距离（简化为到激光起点的距离）
                const laserStart = b.mesh.position.clone();
                if (e.mesh.position.distanceTo(laserStart) < b.aoeRadius) {
                    damageEnemy(e, b.damage * (b.teslaFrameDamageRatio || getWeaponConfig(3).teslaFrameDamageRatio), b);
                }
            });
            
            // 激光生命结束或目标已死亡则移除
            if (b.life <= 0) {
                scene.remove(b.mesh);
                if (b.glowMesh) scene.remove(b.glowMesh);
                bullets.splice(i, 1);
            }
        } else {
            // 普通子弹移动
            b.mesh.position.add(b.direction.clone().multiplyScalar(b.speed));
            if (b.isRailProjectile) {
                b.life--;
                b.speed = Math.max(b.minSpeed, b.speed * b.speedDecay);
            }
            
            let hit = false;
            for (let j = enemies.length - 1; j >= 0; j--) {
                const e = enemies[j];
                if (b.mesh.position.distanceTo(e.mesh.position) < (e.isBoss ? 2.5 : 0.8)) {
                    damageEnemy(e, b.damage, b);
                    hit = true;
                    
                    // 粒子效果
                    for (let p = 0; p < 5; p++) {
                        const particle = new THREE.Mesh(
                            new THREE.BoxGeometry(0.15, 0.15, 0.15),
                            new THREE.MeshBasicMaterial({ color: 0xffaa00 })
                        );
                        particle.position.copy(b.mesh.position);
                        particle.userData = {
                            velocity: new THREE.Vector3(
                                (Math.random() - 0.5) * 0.3,
                                (Math.random() - 0.5) * 0.3,
                                (Math.random() - 0.5) * 0.3
                            ),
                            life: 20
                        };
                        scene.add(particle);
                        particles.push(particle);
                    }
                    
                    // 非穿透子弹命中后跳出循环
                    break;
                }
            }
            
            if (hit || b.mesh.position.length() > 50 || (b.isRailProjectile && b.life <= 0)) {
                scene.remove(b.mesh);
                bullets.splice(i, 1);
            }
        }
    }
    
    // 粒子动画
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.position.add(p.userData.velocity);
        p.userData.life--;
        if (p.userData.isExplosionRing) {
            const fade = Math.max(0, p.userData.life / p.userData.maxLife);
            p.material.opacity = fade * 0.78;
            p.scale.multiplyScalar(1.012);
        } else {
            p.scale.multiplyScalar(0.9);
        }
        if (p.userData.life <= 0) {
            scene.remove(p);
            particles.splice(i, 1);
        }
    }

    for (let i = damageTexts.length - 1; i >= 0; i--) {
        const d = damageTexts[i];
        d.age += 16;
        const riseProgress = Math.min(d.age / d.riseDuration, 1);
        d.sprite.position.y = d.startY + d.riseDistance * riseProgress;
        d.sprite.lookAt(camera.position);
        if (d.age > d.riseDuration) {
            d.material.opacity = Math.max(0, 1 - ((d.age - d.riseDuration) / (d.life - d.riseDuration)));
        }
        if (d.age >= d.life) {
            scene.remove(d.sprite);
            d.material.dispose();
            d.texture.dispose();
            damageTexts.splice(i, 1);
        }
    }
    
    renderer.render(scene, camera);
}

// ==================== 游戏结束处理 ====================
function endGame(victory) {
    gameOver = true;
    setGameDimmed(true);
    const msgEl = document.getElementById('msg');
    const endBtn = document.getElementById('endBtn');
    const endScreen = document.getElementById('endScreen');
    
    // 计算关卡得分并保存到排行榜
    const clearTime = Math.floor((Date.now() - levelStartTime) / 1000);
    const killScore = score - (isDebugMode ? 1000 : (currentLevel === 1 ? 3 : (currentLevel === 2 ? 15 : 30)));
    const levelScore = calculateLevelScore(currentLevel, lives, killScore, victory);
    
    const leaderboardEntry = {
        playerName: 'Player',
        level: currentLevel,
        score: levelScore,
        remainingLives: lives,
        killScore: killScore,
        bonusScore: lives * 20,
        isVictory: victory,
        clearTime: clearTime,
        timestamp: new Date().toISOString()
    };
    
    if (victory) {
        saveToLeaderboard(leaderboardEntry);
    }
    
    if (victory) {
        if (currentLevel === 1) {
            msgEl.innerText = "🎉 MISSION 1 COMPLETE!";
            endBtn.innerText = "NEXT MISSION";
        } else if (currentLevel === 2) {
            msgEl.innerText = "🎉 MISSION 2 COMPLETE!";
            endBtn.innerText = "MISSION 3";
        } else {
            msgEl.innerText = "🏆 CAMPAIGN CLEARED!";
            endBtn.innerText = "REPLAY";
        }
        playTone(800, 'sine', 0.2, 0.1);
        setTimeout(() => playTone(1000, 'sine', 0.3, 0.1), 200);
        
        // 显示本关得分
        setTimeout(() => {
            alert(`Mission ${currentLevel} Complete!\n\n杀敌得分：${killScore}\n剩余 HP 奖励：${lives * 20}\n本关总分：${levelScore}\n通关时间：${clearTime}秒`);
        }, 500);
    } else {
        msgEl.innerText = "💀 GAME OVER";
        endBtn.innerText = "RETRY";
        playTone(150, 'sawtooth', 0.5, 0.1);
    }
    
    renderDamageSummary();
    endScreen.style.display = 'block';
}

// ==================== 窗口大小调整 ====================
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    adjustCamera();
});

// ==================== 启动游戏循环 ====================
requestAnimationFrame(gameLoop);

