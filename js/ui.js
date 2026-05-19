// Menu, gallery shell, and end-of-level UI helpers.

function setOverlayVisible(visible) {
    const overlay = document.getElementById('overlay');
    if (overlay) overlay.style.display = visible ? 'flex' : 'none';
}

function showLevelSelect() {
    refreshLevelDropdown();
    const panel = document.getElementById('levelSelect');
    if (panel) panel.style.display = 'block';
}

function hideLevelSelect() {
    const panel = document.getElementById('levelSelect');
    if (panel) panel.style.display = 'none';
}

function startDebugWithLevel() {
    const levelDropdown = document.getElementById('levelDropdown');
    currentLevel = parseInt(levelDropdown.value, 10);
    hideLevelSelect();
    startGame(true);
}

function getSortedLevelKeys() {
    if (typeof LEVELS === 'undefined') return [1, 2, 3, 4];
    return Object.keys(LEVELS)
        .map(Number)
        .filter(Number.isFinite)
        .sort((a, b) => a - b);
}

function getLastLevelNumber() {
    const levels = getSortedLevelKeys();
    return levels[levels.length - 1] || 1;
}

function refreshLevelDropdown() {
    const levelDropdown = document.getElementById('levelDropdown');
    if (!levelDropdown || typeof LEVELS === 'undefined') return;
    const selected = String(levelDropdown.value || currentLevel || 1);
    levelDropdown.innerHTML = '';
    getSortedLevelKeys().forEach(levelKey => {
        const option = document.createElement('option');
        option.value = String(levelKey);
        const cfg = LEVELS[levelKey] || {};
        option.textContent = cfg.title || `Mission ${levelKey}`;
        levelDropdown.appendChild(option);
    });
    levelDropdown.value = LEVELS[selected] ? selected : String(currentLevel || 1);
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
    if (typeof updateCardPanelUI === 'function') updateCardPanelUI();
    setOverlayVisible(true);
    hideLevelSelect();
}

function restartCurrentLevel() {
    const restartDebugMode = isDebugMode;
    clearRunObjects();
    document.getElementById('pauseOverlay').style.display = 'none';
    document.getElementById('endScreen').style.display = 'none';
    startGame(restartDebugMode);
}

function resetUIForLevel() {
    clearRunObjects();
    isPaused = false;
    document.getElementById('endScreen').style.display = 'none';
    document.getElementById('pauseOverlay').style.display = 'none';
    setOverlayVisible(true);
    gameStarted = false;
    isDebugMode = false;
    if (typeof updateCardPanelUI === 'function') updateCardPanelUI();
}

function getNextLevelAfterClear(level) {
    const levels = getSortedLevelKeys();
    const index = levels.indexOf(Number(level));
    if (index >= 0 && index < levels.length - 1) return levels[index + 1];
    return levels[0] || 1;
}

function continueToNextLevel() {
    currentLevel = getNextLevelAfterClear(currentLevel);
    const keepDebugMode = isDebugMode;
    clearRunObjects();
    isPaused = false;
    document.getElementById('endScreen').style.display = 'none';
    document.getElementById('pauseOverlay').style.display = 'none';
    setOverlayVisible(false);
    startGame(keepDebugMode);
}

function configureEndScreenActions(victory, level) {
    const actions = document.getElementById('endActions');
    const nextBtn = document.getElementById('endNextBtn');
    const replayBtn = document.getElementById('endReplayBtn');
    const homeBtn = document.getElementById('endHomeBtn');
    if (!actions || !nextBtn || !replayBtn || !homeBtn) return;

    actions.style.display = 'grid';
    nextBtn.style.display = victory ? '' : 'none';
    nextBtn.textContent = level >= getLastLevelNumber() ? t('restartCampaign') : t('nextLevel');
    replayBtn.textContent = t('replayLevel');
    homeBtn.textContent = t('home');
}

function showEndLevelUI(victory, level, attackMode) {
    const msgEl = document.getElementById('msg');
    const endScreen = document.getElementById('endScreen');
    if (!msgEl || !endScreen) return;
    const bottomNav = document.getElementById('bottom-nav');
    const cardPanel = document.getElementById('cardPanel');
    if (bottomNav) bottomNav.style.display = 'none';
    if (cardPanel) cardPanel.style.display = 'none';

    if (victory) {
        if (level === 1) {
            msgEl.textContent = t('mission1Complete');
        } else if (level === 2) {
            msgEl.textContent = t('mission2Complete');
        } else if (level === 3) {
            msgEl.textContent = t('mission3Complete');
        } else if (level >= getLastLevelNumber()) {
            msgEl.textContent = t('campaignCleared');
        } else {
            msgEl.textContent = `Mission ${level} complete`;
        }
    } else {
        msgEl.textContent = attackMode ? t('timeUp') : t('gameOver');
    }

    configureEndScreenActions(victory, level);
    endScreen.style.display = 'block';
}

window.addEventListener('DOMContentLoaded', refreshLevelDropdown);
