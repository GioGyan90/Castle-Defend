// Game audio system.
// Enemy movement audio map:
// - robot, heavyRobot, steel gorilla boss: biped leg bearing/servo rotation.
// - drone, eliteDrone, helicopter/chopper boss: flying rotor buzz.
// - armored, wheelbarrow, tank bosses: tread chain movement.
// - hoverArmor: floating hover hum.
// - portalA: wind tunnel ambience.

var audioCtx = new (window.AudioContext || window.webkitAudioContext)();
var isMuted = false;

var ENEMY_MOVEMENT_SOUNDS = {
    flying: {
        label: '飞行器行进声',
        interval: 220,
        baseFreq: 210,
        type: 'sawtooth',
        duration: 0.16,
        volume: 0.020,
        filter: 1050
    },
    biped: {
        label: '双足单位腿部轴承声',
        interval: 230,
        baseFreq: 310,
        type: 'triangle',
        duration: 0.18,
        volume: 0.026,
        filter: 920
    },
    tread: {
        label: '履带部队链节运动声',
        interval: 125,
        baseFreq: 72,
        type: 'sawtooth',
        duration: 0.16,
        volume: 0.036,
        filter: 260
    },
    hover: {
        label: '漂浮部队悬浮声',
        interval: 480,
        baseFreq: 136,
        type: 'triangle',
        duration: 0.26,
        volume: 0.024,
        filter: 560
    },
    portal: {
        label: '传送门风声',
        interval: 760,
        baseFreq: 180,
        type: 'triangle',
        duration: 0.62,
        volume: 0.018,
        filter: 680
    }
};

var ENEMY_AUDIO_ASSIGNMENTS = {
    robot: 'biped',          // Normal robot -> leg bearing/servo rotation.
    heavyRobot: 'biped',     // Enhanced robot -> heavier leg bearing/servo rotation.
    gorillaBoss: 'biped',    // Steel gorilla boss -> heavy joint rotation.
    drone: 'flying',         // Normal drone -> flying rotor buzz.
    eliteDrone: 'flying',    // Elite drone -> flying rotor buzz.
    helicopterBoss: 'flying',// Helicopter/chopper boss -> flying rotor buzz.
    chopper: 'flying',       // Gallery chopper model -> flying rotor buzz.
    armored: 'tread',        // Armored unit -> tread chain movement.
    wheelbarrow: 'tread',    // Wheelbarrow cannon -> mechanical rolling/tread movement.
    tankBoss: 'tread',       // Mission 1/2 tank boss -> heavy tread chain movement.
    hoverArmor: 'hover',     // Hover armor -> floating hover hum.
    portalA: 'portal',       // Portal A -> wind tunnel ambience.
    portalB: 'portal'        // Portal B -> wind tunnel ambience.
};

var enemyMovementSoundState = {};
Object.keys(ENEMY_MOVEMENT_SOUNDS).forEach(function(kind, index) {
    enemyMovementSoundState[kind] = {
        nextTime: index * 95,
        phase: 0
    };
});

function ensureAudioReady() {
    if (isMuted) return;
    if (audioCtx.state !== 'running') {
        audioCtx.resume().catch(function() {});
    }
}

function playTone(freq, type, duration, vol) {
    if (vol === undefined) vol = 0.05;
    if (isMuted) return;
    ensureAudioReady();

    try {
        var now = audioCtx.currentTime;
        var osc = audioCtx.createOscillator();
        var gain = audioCtx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(Math.max(0.0001, vol), now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + duration);
    } catch (e) {}
}

function playAirstrikeDropSound() {
    if (isMuted) return;
    ensureAudioReady();

    try {
        var now = audioCtx.currentTime;
        var osc = audioCtx.createOscillator();
        var gain = audioCtx.createGain();
        var filter = audioCtx.createBiquadFilter();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(920, now);
        osc.frequency.exponentialRampToValueAtTime(120, now + 0.62);
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1800, now);
        filter.frequency.exponentialRampToValueAtTime(360, now + 0.62);
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(0.052, now + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.68);
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.7);
    } catch (e) {}
}

function playAirstrikeImpactSound() {
    if (isMuted) return;
    playTone(72, 'sawtooth', 0.18, 0.055);
    window.setTimeout(function() {
        playTone(46, 'square', 0.14, 0.032);
    }, 35);
}

function resetEnemyMovementSounds(timeMs) {
    if (timeMs === undefined) timeMs = 0;
    Object.keys(enemyMovementSoundState).forEach(function(kind, index) {
        enemyMovementSoundState[kind].nextTime = timeMs + index * 95;
        enemyMovementSoundState[kind].phase = 0;
    });
}

function getEnemyMovementSoundType(enemy) {
    if (!enemy || !enemy.mesh) return null;
    if (enemy.isPortal || enemy.modelType === 'portalA') return ENEMY_AUDIO_ASSIGNMENTS.portalA;

    var meshData = enemy.mesh.userData || {};
    if (enemy.isFlyingBoss || (enemy.isDrone && enemy.modelType !== 'hoverArmor' && !meshData.hoverArmor)) {
        return ENEMY_AUDIO_ASSIGNMENTS.drone;
    }
    if (enemy.modelType === 'hoverArmor' || meshData.hoverArmor) {
        return ENEMY_AUDIO_ASSIGNMENTS.hoverArmor;
    }
    if (enemy.modelType === 'armored' || enemy.modelType === 'wheelbarrow' || meshData.armoredUnit || meshData.wheelbarrow) {
        return ENEMY_AUDIO_ASSIGNMENTS.armored;
    }
    if (enemy.modelType === 'robot' || enemy.modelType === 'heavyRobot' || meshData.walkPhase !== undefined || meshData.gorilla) {
        return ENEMY_AUDIO_ASSIGNMENTS.robot;
    }
    if (enemy.isBoss) {
        return ENEMY_AUDIO_ASSIGNMENTS.tankBoss;
    }
    return null;
}

function getEnemyMovementSoundTypeByModel(modelType) {
    return ENEMY_AUDIO_ASSIGNMENTS[modelType] || null;
}

function playPortalWindSound(count) {
    if (isMuted) return;
    ensureAudioReady();

    try {
        var now = audioCtx.currentTime;
        var duration = ENEMY_MOVEMENT_SOUNDS.portal.duration;
        var volume = ENEMY_MOVEMENT_SOUNDS.portal.volume * Math.min(2, 0.9 + count * 0.18);

        if (typeof audioCtx.createBuffer !== 'function') {
            playTone(220, 'triangle', duration, volume);
            return;
        }

        var bufferSize = Math.max(1, Math.floor(audioCtx.sampleRate * duration));
        var buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        var data = buffer.getChannelData(0);
        var rolling = 0;
        for (var i = 0; i < bufferSize; i++) {
            rolling = rolling * 0.88 + (Math.random() * 2 - 1) * 0.12;
            data[i] = rolling;
        }

        var source = audioCtx.createBufferSource();
        var filter = audioCtx.createBiquadFilter();
        var gain = audioCtx.createGain();
        source.buffer = buffer;
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(520, now);
        filter.frequency.linearRampToValueAtTime(860, now + duration);
        filter.Q.setValueAtTime(0.7, now);
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(volume, now + 0.08);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
        source.connect(filter);
        filter.connect(gain);
        gain.connect(audioCtx.destination);
        source.start(now);
        source.stop(now + duration);

        var lowWind = audioCtx.createOscillator();
        var lowGain = audioCtx.createGain();
        lowWind.type = 'triangle';
        lowWind.frequency.setValueAtTime(96, now);
        lowWind.frequency.linearRampToValueAtTime(132, now + duration);
        lowGain.gain.setValueAtTime(0.0001, now);
        lowGain.gain.exponentialRampToValueAtTime(volume * 0.45, now + 0.1);
        lowGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
        lowWind.connect(lowGain);
        lowGain.connect(audioCtx.destination);
        lowWind.start(now);
        lowWind.stop(now + duration);
    } catch (e) {}
}

function playEnemyMovementSound(kind, count) {
    var cfg = ENEMY_MOVEMENT_SOUNDS[kind];
    if (!cfg || isMuted) return;
    ensureAudioReady();
    if (kind === 'portal') {
        playPortalWindSound(count);
        return;
    }

    try {
        var state = enemyMovementSoundState[kind];
        var now = audioCtx.currentTime;
        var volumeScale = Math.min(2.2, 0.95 + count * 0.22);
        var phaseBend = state.phase % 2 === 0 ? 0.92 : 1.08;
        state.phase++;

        var gain = audioCtx.createGain();
        var filter = audioCtx.createBiquadFilter();
        var osc = audioCtx.createOscillator();
        var duration = cfg.duration;
        var volume = cfg.volume * volumeScale;

        filter.type = (kind === 'flying' || kind === 'biped') ? 'bandpass' : 'lowpass';
        filter.frequency.setValueAtTime(cfg.filter, now);
        filter.Q.setValueAtTime(kind === 'biped' ? 1.35 : (kind === 'flying' ? 0.9 : 0.6), now);

        osc.type = cfg.type;
        osc.frequency.setValueAtTime(cfg.baseFreq * phaseBend, now);
        if (kind === 'biped') {
            osc.frequency.linearRampToValueAtTime(410 * phaseBend, now + duration * 0.42);
            osc.frequency.linearRampToValueAtTime(285 * phaseBend, now + duration);
        } else if (kind === 'tread') {
            osc.frequency.exponentialRampToValueAtTime(48 * phaseBend, now + duration);
        } else if (kind === 'flying') {
            osc.detune.setValueAtTime(-35, now);
            osc.detune.linearRampToValueAtTime(42, now + duration);
        } else if (kind === 'hover') {
            osc.detune.setValueAtTime(-12, now);
            osc.detune.linearRampToValueAtTime(18, now + duration);
        }

        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(volume, now + 0.014);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + duration + 0.02);

        if (kind === 'flying' || kind === 'hover' || kind === 'biped') {
            var harmonic = audioCtx.createOscillator();
            var harmonicGain = audioCtx.createGain();
            harmonic.type = kind === 'biped' ? 'square' : (kind === 'flying' ? 'triangle' : 'sine');
            harmonic.frequency.setValueAtTime(cfg.baseFreq * (kind === 'biped' ? 1.85 : (kind === 'flying' ? 2.55 : 1.5)) * phaseBend, now);
            harmonicGain.gain.setValueAtTime(0.0001, now);
            harmonicGain.gain.exponentialRampToValueAtTime(volume * (kind === 'biped' ? 0.28 : 0.55), now + 0.018);
            harmonicGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
            harmonic.connect(harmonicGain);
            harmonicGain.connect(audioCtx.destination);
            harmonic.start(now);
            harmonic.stop(now + duration + 0.02);
        }

        if (kind === 'tread') {
            var chain = audioCtx.createOscillator();
            var chainGain = audioCtx.createGain();
            var chainFilter = audioCtx.createBiquadFilter();
            chain.type = 'square';
            chain.frequency.setValueAtTime(118 * phaseBend, now);
            chain.frequency.linearRampToValueAtTime(92 * phaseBend, now + duration);
            chainFilter.type = 'bandpass';
            chainFilter.frequency.setValueAtTime(360, now);
            chainFilter.Q.setValueAtTime(0.85, now);
            chainGain.gain.setValueAtTime(0.0001, now);
            chainGain.gain.exponentialRampToValueAtTime(volume * 0.34, now + 0.01);
            chainGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
            chain.connect(chainFilter);
            chainFilter.connect(chainGain);
            chainGain.connect(audioCtx.destination);
            chain.start(now);
            chain.stop(now + duration + 0.02);
        }
    } catch (e) {}
}

function updateEnemyMovementSounds(timeMs) {
    if (!gameStarted || gameOver || isPaused || isMuted) return;
    ensureAudioReady();

    var activeCounts = { flying: 0, biped: 0, tread: 0, hover: 0, portal: 0 };
    enemies.forEach(function(enemy) {
        if (!enemy || enemy.isDead || enemy.isStalledAtZero) return;
        var kind = getEnemyMovementSoundType(enemy);
        if (kind && activeCounts[kind] !== undefined) {
            activeCounts[kind]++;
        }
    });

    Object.keys(activeCounts).forEach(function(kind) {
        if (activeCounts[kind] <= 0) return;
        var cfg = ENEMY_MOVEMENT_SOUNDS[kind];
        var state = enemyMovementSoundState[kind];
        if (timeMs >= state.nextTime) {
            playEnemyMovementSound(kind, activeCounts[kind]);
            state.nextTime = timeMs + cfg.interval;
        }
    });
}

function playEnemyWalkSample(modelType) {
    var kind = getEnemyMovementSoundTypeByModel(modelType);
    if (!kind) return;
    ensureAudioReady();

    var cfg = ENEMY_MOVEMENT_SOUNDS[kind];
    var pulses = kind === 'hover' || kind === 'portal' ? 5 : 7;
    var gap = Math.max(120, Math.min(cfg.interval, 360));
    for (var i = 0; i < pulses; i++) {
        window.setTimeout(function(soundKind) {
            playEnemyMovementSound(soundKind, 2);
        }, i * gap, kind);
    }
}
