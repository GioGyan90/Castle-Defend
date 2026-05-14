// Scene announcements for mission starts, boss warnings, and highlight moments.

var SCENE_ANNOUNCER_DURATION_MS = 1800;
var sceneAnnouncerSerial = 0;
var sceneAnnouncerCooldowns = {};
var sceneAnnouncerActiveType = null;

var LEVEL_START_ANNOUNCEMENT_KEYS = {
    1: 'levelStart1',
    2: 'levelStart2',
    3: 'levelStart3',
    4: 'levelStart4'
};

function getSceneAnnouncerBanner() {
    var banner = document.getElementById('sceneAnnouncerBanner');
    if (!banner) {
        banner = document.createElement('div');
        banner.id = 'sceneAnnouncerBanner';
        banner.className = 'scene-announcer-banner';
        document.body.appendChild(banner);
    }
    return banner;
}

function playSceneAnnouncerSound(type) {
    if (type === 'mission') {
        playTone(520, 'triangle', 0.18, 0.04);
        window.setTimeout(function() { playTone(720, 'triangle', 0.16, 0.04); }, 160);
        return;
    }
    if (type === 'highlight' || type === 'info') {
        playTone(type === 'info' ? 560 : 660, 'sine', 0.12, 0.035);
        window.setTimeout(function() { playTone(type === 'info' ? 700 : 880, 'sine', 0.12, 0.035); }, 140);
        return;
    }
    playTone(740, 'sawtooth', 0.22, 0.055);
    playTone(370, 'square', 0.22, 0.035);
    window.setTimeout(function() {
        playTone(740, 'sawtooth', 0.22, 0.055);
        playTone(370, 'square', 0.22, 0.035);
    }, 360);
}

function cancelSceneAnnouncement() {
    sceneAnnouncerSerial++;
    var banner = document.getElementById('sceneAnnouncerBanner');
    if (banner) {
        banner.classList.remove('scene-announcer-run');
    }
    sceneAnnouncerActiveType = null;
}

function cancelBossIncomingBanner() {
    cancelSceneAnnouncement();
}

function finishSceneAnnouncement(serial, onDone) {
    if (serial !== sceneAnnouncerSerial || !gameStarted || gameOver) return;
    if (isPaused) {
        window.setTimeout(function() {
            finishSceneAnnouncement(serial, onDone);
        }, 120);
        return;
    }

    var banner = document.getElementById('sceneAnnouncerBanner');
    if (banner) {
        banner.classList.remove('scene-announcer-run');
    }
    sceneAnnouncerActiveType = null;
    if (typeof onDone === 'function') {
        onDone();
    }
}

function announceScene(type, text, options) {
    options = options || {};
    if (!text || !gameStarted || gameOver) return;
    if (sceneAnnouncerActiveType === 'warning' && type !== 'warning') return;

    var now = performance.now();
    var cooldownKey = options.cooldownKey;
    var cooldownMs = options.cooldownMs || 0;
    if (cooldownKey && sceneAnnouncerCooldowns[cooldownKey] && now - sceneAnnouncerCooldowns[cooldownKey] < cooldownMs) {
        return;
    }
    if (cooldownKey) {
        sceneAnnouncerCooldowns[cooldownKey] = now;
    }

    var banner = getSceneAnnouncerBanner();
    var serial = ++sceneAnnouncerSerial;
    sceneAnnouncerActiveType = type || 'warning';
    banner.textContent = text;
    banner.className = 'scene-announcer-banner scene-announcer-' + (type || 'warning');
    void banner.offsetWidth;
    banner.classList.add('scene-announcer-run');
    playSceneAnnouncerSound(type || 'warning');
    window.setTimeout(function() {
        finishSceneAnnouncement(serial, options.onDone);
    }, options.durationMs || SCENE_ANNOUNCER_DURATION_MS);
}

function announceLevelStart(level) {
    announceScene('mission', t(LEVEL_START_ANNOUNCEMENT_KEYS[level] || 'levelStart1'), {
        cooldownKey: 'level-start-' + level + '-' + levelStartTime,
        cooldownMs: 1000
    });
}

function announceBossIncoming(text, onDone) {
    var queuedLevel = currentLevel;
    announceScene('warning', text || t('bossIncoming'), {
        onDone: function() {
            if (!gameStarted || gameOver || currentLevel !== queuedLevel) return;
            if (typeof onDone === 'function') onDone();
        }
    });
}

function queueBossSpawnWarning(text, onDone) {
    announceBossIncoming(text, onDone);
}

function announceHighlight(eventKey, text) {
    announceScene('highlight', text, {
        cooldownKey: eventKey,
        cooldownMs: 2500,
        durationMs: 1450
    });
}

function announceInfo(eventKey, text, cooldownMs) {
    announceScene('info', text, {
        cooldownKey: eventKey,
        cooldownMs: cooldownMs === undefined ? 1800 : cooldownMs,
        durationMs: 1250
    });
}

function announceBattleEvent(eventKey, text, worldPosition, cooldownMs) {
    if (!text || !worldPosition || !gameStarted || gameOver) return;

    var now = performance.now();
    var cooldownKey = 'battle-' + eventKey;
    var duration = cooldownMs === undefined ? 1200 : cooldownMs;
    if (sceneAnnouncerCooldowns[cooldownKey] && now - sceneAnnouncerCooldowns[cooldownKey] < duration) {
        return;
    }
    sceneAnnouncerCooldowns[cooldownKey] = now;

    if (typeof THREE === 'undefined' || typeof scene === 'undefined' || typeof damageTexts === 'undefined') return;

    var canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 160;
    var ctx = canvas.getContext('2d');
    ctx.font = '900 64px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = 14;
    ctx.strokeStyle = 'rgba(6, 10, 16, 0.78)';
    ctx.fillStyle = '#f8ffff';
    ctx.shadowColor = 'rgba(41, 242, 255, 0.82)';
    ctx.shadowBlur = 22;
    ctx.strokeText(text, canvas.width / 2, canvas.height / 2);
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);

    var texture = new THREE.CanvasTexture(canvas);
    var material = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        opacity: 1,
        depthWrite: false
    });
    var sprite = new THREE.Sprite(material);
    sprite.position.copy(worldPosition).add(new THREE.Vector3(0, 1.7, 0));
    sprite.scale.set(5.2, 1.3, 1);
    scene.add(sprite);
    damageTexts.push({
        sprite: sprite,
        material: material,
        texture: texture,
        age: 0,
        life: 1200,
        riseDuration: 680,
        riseDistance: 0.74,
        startY: sprite.position.y
    });
}
