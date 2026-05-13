// Boss warning banner and alarm.
// Timing: ease in, hold on screen for 1 second, ease out.

var BOSS_WARNING_DURATION_MS = 1800;
var bossWarningSerial = 0;

function getBossWarningBanner() {
    var banner = document.getElementById('bossWarningBanner');
    if (!banner) {
        banner = document.createElement('div');
        banner.id = 'bossWarningBanner';
        banner.className = 'boss-warning-banner';
        document.body.appendChild(banner);
    }
    return banner;
}

function playBossWarningAlarm() {
    playTone(740, 'sawtooth', 0.22, 0.055);
    playTone(370, 'square', 0.22, 0.035);
    window.setTimeout(function() {
        playTone(740, 'sawtooth', 0.22, 0.055);
        playTone(370, 'square', 0.22, 0.035);
    }, 360);
}

function cancelBossIncomingBanner() {
    bossWarningSerial++;
    var banner = document.getElementById('bossWarningBanner');
    if (banner) {
        banner.classList.remove('boss-warning-run');
    }
}

function finishBossIncomingBanner(serial, onDone) {
    if (serial !== bossWarningSerial || !gameStarted || gameOver) return;
    if (isPaused) {
        window.setTimeout(function() {
            finishBossIncomingBanner(serial, onDone);
        }, 120);
        return;
    }

    var banner = document.getElementById('bossWarningBanner');
    if (banner) {
        banner.classList.remove('boss-warning-run');
    }
    if (typeof onDone === 'function') {
        onDone();
    }
}

function showBossIncomingBanner(text, onDone) {
    var banner = getBossWarningBanner();
    var serial = ++bossWarningSerial;
    banner.textContent = text || 'BOSS INCOMING';
    banner.classList.remove('boss-warning-run');
    void banner.offsetWidth;
    banner.classList.add('boss-warning-run');
    playBossWarningAlarm();
    window.setTimeout(function() {
        finishBossIncomingBanner(serial, onDone);
    }, BOSS_WARNING_DURATION_MS);
}

function queueBossSpawnWarning(text, onDone) {
    var queuedLevel = currentLevel;
    showBossIncomingBanner(text, function() {
        if (!gameStarted || gameOver || currentLevel !== queuedLevel) return;
        onDone();
    });
}
