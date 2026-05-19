const MAPS_PATH = 'js/maps.js';
const DEFAULT_ROAD_WIDTH = 3.5;
const CARD_EDITOR_DEFAULTS = {
    J: { enabled: true, price: 15, fireRateBonus: 0.25, damageBonus: 0, incomePerSecond: 0 },
    Q: { enabled: true, price: 25, fireRateBonus: 0.15, damageBonus: 5, incomePerSecond: 0 },
    K: { enabled: true, price: 35, fireRateBonus: 0.2, damageBonus: 10, incomePerSecond: 5 }
};
const ATTACK_UNIT_EDITOR_OPTIONS = [
    { key: 'heavyRobot', label: '强化机器人', price: 10 },
    { key: 'chopper', label: 'Chopper', price: 40 },
    { key: 'finalBossAlpha', label: 'Final Boss Alpha', price: 160 },
    { key: 'portalB', label: 'Portal B', price: 80 }
];

let mapsText = '';
const ATTACK_UNIT_DEFAULTS = {
    robot: { price: 6, health: 8, speed: 0.024, scale: 1.35, maxPurchases: 0 },
    heavyRobot: { price: 10, health: 28, speed: 0.022, scale: 1.22, maxPurchases: 0 },
    eliteDrone: { price: 16, health: 14, speed: 0.028, scale: 0.95, maxPurchases: 0 },
    drone: { price: 14, health: 12, speed: 0.03, scale: 1.05, maxPurchases: 0 },
    armored: { price: 22, health: 34, speed: 0.016, scale: 0.55, maxPurchases: 0 },
    hoverArmor: { price: 28, health: 38, speed: 0.026, scale: 0.85, maxPurchases: 0 },
    wheelbarrow: { price: 18, health: 24, speed: 0.02, scale: 0.85, maxPurchases: 0 },
    portalA: { price: 65, health: 120, speed: 0, scale: 1, maxPurchases: 2 },
    portalB: { price: 80, health: 144, speed: 0, scale: 1, maxPurchases: 2 },
    tankBoss: { price: 120, health: 220, speed: 0.015, scale: 1, maxPurchases: 1, hpBarY: 3.5 },
    chopper: { price: 40, health: 160, speed: 0.022, scale: 0.9, maxPurchases: 1, hpBarY: 4.4 },
    finalBossAlpha: { price: 160, health: 320, speed: 0.016, scale: 1, maxPurchases: 1, hpBarY: 4.5 }
};

let levels = {};
let currentLevel = '1';
let fileHandle = null;
let canvasView = null;
let draggedNode = null;

const els = {
    status: document.getElementById('statusLine'),
    levelSelect: document.getElementById('levelSelect'),
    title: document.getElementById('titleInput'),
    levelType: document.getElementById('levelTypeInput'),
    enemies: document.getElementById('enemiesInput'),
    bossHp: document.getElementById('bossHpInput'),
    cameraExtent: document.getElementById('cameraExtentInput'),
    roadWidth: document.getElementById('roadWidthInput'),
    startingScore: document.getElementById('startingScoreInput'),
    opponentBaseHp: document.getElementById('opponentBaseHpInput'),
    timeLimit: document.getElementById('timeLimitInput'),
    incomeAmount: document.getElementById('incomeAmountInput'),
    incomeInterval: document.getElementById('incomeIntervalInput'),
    spawn: document.getElementById('spawnInput'),
    base: document.getElementById('baseInput'),
    canvas: document.getElementById('mapCanvas'),
    pointsList: document.getElementById('pointsList'),
    slotsList: document.getElementById('slotsList'),
    enemyTowersList: document.getElementById('enemyTowersList'),
    slotsCard: document.getElementById('slotsCard'),
    rulesCard: document.getElementById('rulesCard'),
    attackRulesCard: document.getElementById('attackRulesCard'),
    enemyTowersCard: document.getElementById('enemyTowersCard'),
    cardRulesCard: document.getElementById('cardRulesCard'),
    cardsEnabled: document.getElementById('cardsEnabledInput'),
    cardRulesList: document.getElementById('cardRulesList'),
    waveCard: document.getElementById('waveCard'),
    advanced: document.getElementById('advancedJson'),
    openFile: document.getElementById('openFileBtn'),
    saveFile: document.getElementById('saveFileBtn'),
    download: document.getElementById('downloadBtn'),
    downloadLevel: document.getElementById('downloadLevelBtn'),
    importLevel: document.getElementById('importLevelBtn'),
    fallbackFile: document.getElementById('fallbackFileInput'),
    levelImportFile: document.getElementById('levelImportFileInput'),
    addPoint: document.getElementById('addPointBtn'),
    addSlot: document.getElementById('addSlotBtn'),
    addEnemyTower: document.getElementById('addEnemyTowerBtn'),
    attackUnitPicker: document.getElementById('attackUnitPicker'),
    addAttackUnit: document.getElementById('addAttackUnitBtn'),
    addWave: document.getElementById('addWaveBtn'),
    addLevel: document.getElementById('addLevelBtn'),
    weaponOptions: document.getElementById('weaponOptions'),
    attackUnitOptions: document.getElementById('attackUnitOptions'),
    attackUnitsList: document.getElementById('attackUnitsList'),
    wavesList: document.getElementById('wavesList'),
    waveTimeline: document.getElementById('waveTimeline'),
    applyAdvanced: document.getElementById('applyAdvancedBtn')
};

function setStatus(text, isError = false) {
    els.status.textContent = text;
    els.status.style.color = isError ? '#ffb4b4' : '#b9f8ff';
}

function extractLevelsSource(text) {
    const startToken = 'var LEVELS =';
    const start = text.indexOf(startToken);
    if (start < 0) throw new Error('没有找到 var LEVELS =');
    const bodyStart = start + startToken.length;
    const end = text.indexOf('\n};', bodyStart);
    if (end < 0) throw new Error('没有找到 LEVELS 结束位置');
    return {
        source: text.slice(bodyStart, end + 3).trim().replace(/;$/, ''),
        start,
        bodyStart,
        end: end + 3
    };
}

function parseMapsText(text) {
    const extracted = extractLevelsSource(text);
    const parsed = Function('MAP_ROAD_WIDTH', `return (${extracted.source});`)(DEFAULT_ROAD_WIDTH);
    return JSON.parse(JSON.stringify(parsed));
}

function roundValue(value) {
    return Math.round(Number(value) * 100) / 100;
}

function ensureLevelShape(level) {
    if (!Array.isArray(level.points)) level.points = [[0, 0], [4, 0]];
    if (!Array.isArray(level.slots)) level.slots = [];
    if (level.points.length < 2) level.points.push([level.points[0][0] + 4, level.points[0][1]]);
    if (level.attackMode) {
        ensureAttackRules(level);
        if (!Array.isArray(level.enemyWaves)) level.enemyWaves = [];
        if (!Array.isArray(level.availableDefenseWeapons)) level.availableDefenseWeapons = [];
    } else {
        if (!Array.isArray(level.enemyWaves)) level.enemyWaves = createDefaultEnemyWaves(level);
        if (!Array.isArray(level.availableDefenseWeapons)) level.availableDefenseWeapons = createDefaultDefenseWeapons(currentLevel, level);
    }
    if (level.startingScore === undefined) level.startingScore = createDefaultStartingScore(currentLevel, level);
    if (!level.cardRules) level.cardRules = createDefaultCardRules();
    normalizeEnemyWaves(level);
    normalizeDefenseRules(level);
    normalizeCardRules(level);
}

function ensureAttackRules(level) {
    if (!Array.isArray(level.enemyTowers)) level.enemyTowers = createDefaultEnemyTowers(level);
    if (!Array.isArray(level.availableAttackUnits)) level.availableAttackUnits = createDefaultAttackUnits();
    if (level.opponentBaseHp === undefined) level.opponentBaseHp = 3;
    if (level.timeLimitMs === undefined) level.timeLimitMs = 60000;
    if (level.incomeAmount === undefined) level.incomeAmount = 30;
    if (level.incomeIntervalMs === undefined) level.incomeIntervalMs = 5000;
    normalizeAttackRules(level);
}

function getEnemyModelOptions() {
    if (typeof ENEMY_CONFIG !== 'undefined' && ENEMY_CONFIG.modelTypes) {
        return Object.keys(ENEMY_CONFIG.modelTypes);
    }
    return ['robot', 'heavyRobot', 'eliteDrone', 'drone', 'armored', 'hoverArmor', 'wheelbarrow', 'portalA', 'portalB', 'chopper', 'finalBossAlpha'];
}

function getEnemyModelLabel(modelType) {
    if (typeof ENEMY_CONFIG !== 'undefined' && ENEMY_CONFIG.modelTypes && ENEMY_CONFIG.modelTypes[modelType]) {
        return ENEMY_CONFIG.modelTypes[modelType];
    }
    return modelType;
}

function getAttackUnitEditorOptions() {
    return getEnemyModelOptions().map(modelType => {
        const defaults = ATTACK_UNIT_DEFAULTS[modelType] || {};
        return {
            key: modelType,
            label: getEnemyModelLabel(modelType),
            price: defaults.price ?? 20
        };
    });
}

function getWeaponEditorOptions() {
    if (typeof WEAPON_CONFIG !== 'undefined') {
        return Object.keys(WEAPON_CONFIG).map(Number).filter(Number.isFinite).sort((a, b) => a - b);
    }
    return [1, 2, 3, 4];
}

function getEnemyTowerOptions() {
    return getWeaponEditorOptions().filter(type => type !== 4);
}

function getEnemyTowerStyle(type) {
    const towerType = Number(type) || 1;
    if (towerType === 2) return { color: '#ff4fd8', label: 'Rail' };
    if (towerType === 3) return { color: '#9b5cf6', label: 'Tesla' };
    return { color: '#f97316', label: 'Pulse' };
}

function getWeaponEditorName(type) {
    return typeof getWeaponConfig === 'function' && getWeaponConfig(type)
        ? getWeaponConfig(type).name
        : `Weapon ${type}`;
}

function getWeaponEditorPrice(type) {
    return typeof getWeaponConfig === 'function' && getWeaponConfig(type)
        ? getWeaponConfig(type).price
        : '';
}

function createDefaultStartingScore(levelKey, level) {
    if (level && level.attackMode) return level.startingScore ?? 360;
    const levelNumber = Number(levelKey);
    if (levelNumber === 1) return 3;
    if (levelNumber === 2) return 15;
    return 30;
}

function createDefaultDefenseWeapons(levelKey, level) {
    if (level && level.attackMode) return [];
    const levelNumber = Number(levelKey);
    if (levelNumber === 1) return [1, 2];
    if (levelNumber === 2) return [1, 2, 3];
    return [1, 2, 3, 4];
}

function createDefaultCardRules() {
    return {
        enabled: true,
        cards: JSON.parse(JSON.stringify(CARD_EDITOR_DEFAULTS))
    };
}

function normalizeCardRules(level) {
    if (!level.cardRules || typeof level.cardRules !== 'object') level.cardRules = createDefaultCardRules();
    level.cardRules.enabled = level.cardRules.enabled !== false;
    if (!level.cardRules.cards || typeof level.cardRules.cards !== 'object') level.cardRules.cards = {};
    Object.keys(CARD_EDITOR_DEFAULTS).forEach(rank => {
        const defaults = CARD_EDITOR_DEFAULTS[rank];
        const current = level.cardRules.cards[rank] || {};
        level.cardRules.cards[rank] = {
            enabled: current.enabled !== false,
            price: Math.max(0, Math.round(Number(current.price ?? defaults.price) || 0)),
            fireRateBonus: Math.max(0, roundValue(current.fireRateBonus ?? defaults.fireRateBonus)),
            damageBonus: Math.max(0, roundValue(current.damageBonus ?? defaults.damageBonus)),
            incomePerSecond: Math.max(0, roundValue(current.incomePerSecond ?? defaults.incomePerSecond))
        };
    });
}

function hasAnyEnabledCard(level) {
    normalizeCardRules(level);
    return Object.values(level.cardRules.cards).some(card => card && card.enabled !== false);
}

function syncCardsEnabledFromRows(level) {
    if (!level || !level.cardRules) return;
    level.cardRules.enabled = hasAnyEnabledCard(level);
    if (els.cardsEnabled) els.cardsEnabled.checked = level.cardRules.enabled;
}

function createDefaultAttackUnits() {
    return ['heavyRobot', 'chopper', 'finalBossAlpha', 'portalB'].map(createDefaultAttackUnit);
}

function createDefaultAttackUnit(modelType) {
    const defaults = ATTACK_UNIT_DEFAULTS[modelType] || {};
    const category = typeof getEnemyCategory === 'function' ? getEnemyCategory(modelType) : 'infantry';
    return {
        key: modelType,
        modelType,
        label: getEnemyModelLabel(modelType),
        price: defaults.price ?? 20,
        health: defaults.health ?? 20,
        speed: defaults.speed ?? 0.022,
        scale: defaults.scale ?? 1,
        maxPurchases: defaults.maxPurchases ?? 0,
        category,
        hpBarY: defaults.hpBarY
    };
}

function normalizeAttackUnitEntry(entry) {
    const source = typeof entry === 'string' ? { modelType: entry } : (entry || {});
    const modelType = source.modelType || source.key || 'heavyRobot';
    const base = createDefaultAttackUnit(modelType);
    const unit = Object.assign({}, base, source, {
        key: modelType,
        modelType,
        label: source.label || base.label,
        price: Math.max(0, Math.round(Number(source.price ?? base.price) || 0)),
        health: Math.max(1, roundValue(source.health ?? base.health)),
        speed: Math.max(0, roundValue(source.speed ?? base.speed)),
        scale: Math.max(0.1, roundValue(source.scale ?? base.scale)),
        maxPurchases: Math.max(0, Math.round(Number(source.maxPurchases ?? base.maxPurchases) || 0))
    });
    if (unit.hpBarY === undefined || unit.hpBarY === '') delete unit.hpBarY;
    return unit;
}

function createDefaultEnemyTowers(level) {
    const points = Array.isArray(level.points) ? level.points : [[0, 0], [6, 0]];
    const second = points[1] || points[0] || [0, 0];
    const beforeBase = points[Math.max(0, points.length - 2)] || second;
    return [
        { type: 1, x: roundValue(second[0] + 1.6), z: roundValue(second[1]) },
        { type: 2, x: roundValue(beforeBase[0] - 1.6), z: roundValue(beforeBase[1]) }
    ];
}

function normalizeDefenseRules(level) {
    level.startingScore = Math.max(0, Math.round(Number(level.startingScore) || 0));
    if (level.attackMode) {
        level.availableDefenseWeapons = [];
        return;
    }
    level.availableDefenseWeapons = (level.availableDefenseWeapons || [])
        .map(Number)
        .filter((value, index, arr) => Number.isFinite(value) && arr.indexOf(value) === index)
        .sort((a, b) => a - b);
}

function normalizeAttackRules(level) {
    if (!Array.isArray(level.enemyTowers)) level.enemyTowers = [];
    if (!Array.isArray(level.availableAttackUnits)) level.availableAttackUnits = createDefaultAttackUnits();
    level.opponentBaseHp = Math.max(1, Math.round(Number(level.opponentBaseHp) || 3));
    level.timeLimitMs = Math.max(5000, Math.round(Number(level.timeLimitMs) || 60000));
    level.incomeAmount = Math.max(0, Math.round(Number(level.incomeAmount) || 0));
    level.incomeIntervalMs = Math.max(500, Math.round(Number(level.incomeIntervalMs) || 5000));
    level.enemyTowers = level.enemyTowers
        .filter(Boolean)
        .map(tower => ({
            type: getEnemyTowerOptions().includes(Number(tower.type)) ? Number(tower.type) : 1,
            x: roundValue(tower.x ?? 0),
            z: roundValue(tower.z ?? 0)
        }));
    const allowedModels = getEnemyModelOptions();
    const seenModels = new Set();
    level.availableAttackUnits = level.availableAttackUnits
        .map(normalizeAttackUnitEntry)
        .filter(unit => {
            if (!allowedModels.includes(unit.modelType) || seenModels.has(unit.modelType)) return false;
            seenModels.add(unit.modelType);
            return true;
        });
    if (!level.availableAttackUnits.length) level.availableAttackUnits = createDefaultAttackUnits();
}

function createDefaultEnemyWaves(level) {
    const total = Number(level.enemies) || 20;
    return [
        { label: 'Opening robots', modelType: 'robot', count: Math.max(1, Math.round(total * 0.7)), startMs: 0, intervalMs: 500, path: 'main', health: 3, speedMin: 0.018, speedMax: 0.03, scale: 1.2 },
        { label: 'Air follow-up', modelType: 'eliteDrone', count: Math.max(1, total - Math.max(1, Math.round(total * 0.7))), startMs: 6500, intervalMs: 800, path: 'main', health: 5, speedMin: 0.018, speedMax: 0.03, scale: 0.95 }
    ];
}

function normalizeEnemyWaves(level) {
    level.enemyWaves.forEach((wave, index) => {
        if (!wave.label) wave.label = `Wave ${index + 1}`;
        if (!wave.modelType) wave.modelType = 'robot';
        wave.count = Math.max(0, Math.round(Number(wave.count) || 0));
        wave.startMs = Math.max(0, Math.round(Number(wave.startMs) || 0));
        wave.intervalMs = Math.max(80, Math.round(Number(wave.intervalMs) || 400));
        wave.path = wave.path === 'alternate' ? 'alternate' : 'main';
        ['health', 'speed', 'speedMin', 'speedMax', 'scale', 'hpBarY'].forEach(key => {
            if (wave[key] === '' || wave[key] === null || Number.isNaN(Number(wave[key]))) delete wave[key];
            else if (wave[key] !== undefined) wave[key] = roundValue(wave[key]);
        });
    });
    level.enemies = level.enemyWaves.reduce((total, wave) => total + (Number(wave.count) || 0), 0);
}

function getLevel() {
    const level = levels[currentLevel];
    ensureLevelShape(level);
    return level;
}

function updateLevelSelect() {
    els.levelSelect.innerHTML = '';
    Object.keys(levels).sort((a, b) => Number(a) - Number(b)).forEach(key => {
        const option = document.createElement('option');
        option.value = key;
        option.textContent = `Mission ${key}`;
        els.levelSelect.appendChild(option);
    });
    if (!levels[currentLevel]) currentLevel = Object.keys(levels)[0] || '1';
    els.levelSelect.value = currentLevel;
}

function syncLevelFields() {
    const level = getLevel();
    normalizeEnemyWaves(level);
    if (level.attackMode) ensureAttackRules(level);
    els.title.value = level.title || '';
    if (els.levelType) els.levelType.value = level.attackMode ? 'attack' : 'defense';
    els.enemies.value = level.enemies ?? 0;
    if (els.bossHp) els.bossHp.value = level.bossHp ?? 0;
    els.cameraExtent.value = level.cameraExtent ?? '';
    els.roadWidth.value = level.roadWidth ?? DEFAULT_ROAD_WIDTH;
    els.startingScore.value = level.startingScore ?? createDefaultStartingScore(currentLevel, level);
    if (els.opponentBaseHp) els.opponentBaseHp.value = level.opponentBaseHp ?? 3;
    if (els.timeLimit) els.timeLimit.value = Math.round((level.timeLimitMs ?? 60000) / 1000);
    if (els.incomeAmount) els.incomeAmount.value = level.incomeAmount ?? 30;
    if (els.incomeInterval) els.incomeInterval.value = roundValue((level.incomeIntervalMs ?? 5000) / 1000);
    const spawn = level.points[0];
    const base = level.points[level.points.length - 1];
    els.spawn.value = `${spawn[0]}, ${spawn[1]}`;
    els.base.value = `${base[0]}, ${base[1]}`;
    if (els.advanced) els.advanced.value = JSON.stringify(level, null, 2);
}

function syncFieldsToLevel() {
    const level = getLevel();
    level.title = els.title.value;
    level.attackMode = els.levelType && els.levelType.value === 'attack';
    if (els.bossHp) level.bossHp = Number(els.bossHp.value) || 0;
    if (els.cameraExtent.value === '') delete level.cameraExtent;
    else level.cameraExtent = Number(els.cameraExtent.value) || 0;
    level.roadWidth = Number(els.roadWidth.value) || DEFAULT_ROAD_WIDTH;
    level.startingScore = Math.max(0, Math.round(Number(els.startingScore.value) || 0));
    if (level.attackMode) {
        level.opponentBaseHp = Math.max(1, Math.round(Number(els.opponentBaseHp && els.opponentBaseHp.value) || 3));
        level.timeLimitMs = Math.max(5000, Math.round((Number(els.timeLimit && els.timeLimit.value) || 60) * 1000));
        level.incomeAmount = Math.max(0, Math.round(Number(els.incomeAmount && els.incomeAmount.value) || 0));
        level.incomeIntervalMs = Math.max(500, Math.round((Number(els.incomeInterval && els.incomeInterval.value) || 5) * 1000));
        level.enemyWaves = [];
        level.availableDefenseWeapons = [];
        ensureAttackRules(level);
    } else {
        delete level.attackMode;
    }
    normalizeDefenseRules(level);
    syncCardRuleFieldsToLevel(level);
    normalizeEnemyWaves(level);
}

function syncCardRuleFieldsToLevel(level) {
    if (!els.cardRulesList || !level.cardRules) return;
    normalizeCardRules(level);
    if (els.cardsEnabled) level.cardRules.enabled = els.cardsEnabled.checked;
    els.cardRulesList.querySelectorAll('.card-rule-row').forEach(row => {
        const rank = row.dataset.rank;
        if (!rank || !level.cardRules.cards[rank]) return;
        const card = level.cardRules.cards[rank];
        const enabledInput = row.querySelector('[data-card-field="enabled"]');
        const priceInput = row.querySelector('[data-card-field="price"]');
        const fireRateInput = row.querySelector('[data-card-field="fireRateBonus"]');
        const damageInput = row.querySelector('[data-card-field="damageBonus"]');
        const incomeInput = row.querySelector('[data-card-field="incomePerSecond"]');
        if (enabledInput) card.enabled = enabledInput.checked;
        if (priceInput) card.price = Math.max(0, Math.round(Number(priceInput.value) || 0));
        if (fireRateInput) card.fireRateBonus = Math.max(0, roundValue(fireRateInput.value));
        if (damageInput) card.damageBonus = Math.max(0, Math.round(Number(damageInput.value) || 0));
        if (incomeInput) card.incomePerSecond = Math.max(0, Math.round(Number(incomeInput.value) || 0));
    });
    normalizeCardRules(level);
}

function createNumberInput(value, onInput) {
    const input = document.createElement('input');
    input.type = 'number';
    input.step = '0.1';
    input.value = value;
    input.addEventListener('input', () => {
        onInput(roundValue(input.value));
        renderAll();
    });
    return input;
}

function renderPointRows() {
    const level = getLevel();
    els.pointsList.innerHTML = '';
    level.points.forEach((point, index) => {
        const row = document.createElement('div');
        row.className = 'data-row';
        const label = document.createElement('span');
        label.textContent = index === 0 ? '生' : (index === level.points.length - 1 ? '基' : index);
        const xInput = createNumberInput(point[0], value => { point[0] = value; });
        const zInput = createNumberInput(point[1], value => { point[1] = value; });
        const deleteBtn = document.createElement('button');
        deleteBtn.type = 'button';
        deleteBtn.textContent = '×';
        deleteBtn.disabled = level.points.length <= 2;
        deleteBtn.addEventListener('click', () => {
            level.points.splice(index, 1);
            renderAll();
        });
        row.append(label, xInput, zInput, deleteBtn);
        els.pointsList.appendChild(row);
    });
}

function renderSlotRows() {
    const level = getLevel();
    els.slotsList.innerHTML = '';
    level.slots.forEach((slot, index) => {
        const row = document.createElement('div');
        row.className = 'data-row';
        const label = document.createElement('span');
        label.textContent = index + 1;
        const xInput = createNumberInput(slot.x, value => { slot.x = value; });
        const zInput = createNumberInput(slot.z, value => { slot.z = value; });
        const deleteBtn = document.createElement('button');
        deleteBtn.type = 'button';
        deleteBtn.textContent = '×';
        deleteBtn.addEventListener('click', () => {
            level.slots.splice(index, 1);
            renderAll();
        });
        row.append(label, xInput, zInput, deleteBtn);
        els.slotsList.appendChild(row);
    });
}

function renderEnemyTowerRows() {
    const level = getLevel();
    if (!els.enemyTowersList) return;
    els.enemyTowersList.innerHTML = '';
    if (!level.attackMode) return;
    ensureAttackRules(level);
    level.enemyTowers.forEach((tower, index) => {
        const row = document.createElement('div');
        row.className = 'data-row enemy-tower-row';
        const label = document.createElement('span');
        label.textContent = index + 1;
        const typeButtons = createEnemyTowerTypeButtons(level, index, tower.type);
        const xInput = createNumberInput(tower.x, value => { tower.x = value; });
        const zInput = createNumberInput(tower.z, value => { tower.z = value; });
        const deleteBtn = document.createElement('button');
        deleteBtn.type = 'button';
        deleteBtn.textContent = '×';
        deleteBtn.addEventListener('click', () => {
            level.enemyTowers.splice(index, 1);
            renderAll();
        });
        row.append(label, typeButtons, xInput, zInput, deleteBtn);
        els.enemyTowersList.appendChild(row);
    });
}

function createEnemyTowerTypeButtons(level, towerIndex, currentType) {
    const wrap = document.createElement('div');
    wrap.className = 'tower-type-buttons';
    getEnemyTowerOptions().forEach(type => {
        const style = getEnemyTowerStyle(type);
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = style.label;
        button.style.setProperty('--tower-color', style.color);
        button.classList.toggle('active', Number(currentType) === type);
        button.addEventListener('click', () => {
            if (!level.enemyTowers[towerIndex]) return;
            level.enemyTowers[towerIndex].type = type;
            normalizeAttackRules(level);
            renderAll();
        });
        wrap.appendChild(button);
    });
    return wrap;
}

function createTextInput(value, onInput) {
    const input = document.createElement('input');
    input.type = 'text';
    input.value = value || '';
    input.addEventListener('input', () => {
        onInput(input.value);
        renderWaveTimeline();
        syncLevelFields();
    });
    return input;
}

function createSelectInput(options, value, onChange) {
    const select = document.createElement('select');
    options.forEach(optionValue => {
        const option = document.createElement('option');
        option.value = optionValue;
        option.textContent = optionValue;
        select.appendChild(option);
    });
    select.value = value;
    let lastValue = String(select.value);
    const commitValue = () => {
        if (String(select.value) === lastValue) return;
        lastValue = String(select.value);
        onChange(select.value);
        renderAll();
    };
    select.addEventListener('input', commitValue);
    select.addEventListener('change', commitValue);
    return select;
}

function createWaveField(labelText, control) {
    const label = document.createElement('label');
    const span = document.createElement('span');
    span.textContent = labelText;
    label.append(span, control);
    return label;
}

function createOptionalNumberInput(value, onInput) {
    const input = document.createElement('input');
    input.type = 'number';
    input.step = '0.01';
    input.value = value ?? '';
    input.addEventListener('input', () => {
        onInput(input.value === '' ? undefined : roundValue(input.value));
        renderWaveTimeline();
        syncLevelFields();
    });
    return input;
}

function createWaveNumberInput(value, step, onInput) {
    const input = document.createElement('input');
    input.type = 'number';
    input.step = step;
    input.value = value;
    input.addEventListener('input', () => {
        onInput(roundValue(input.value));
        normalizeEnemyWaves(getLevel());
        renderWaveTimeline();
        syncLevelFields();
    });
    return input;
}

function renderWaveRows() {
    const level = getLevel();
    normalizeEnemyWaves(level);
    els.wavesList.innerHTML = '';
    level.enemyWaves.forEach((wave, index) => {
        const row = document.createElement('div');
        row.className = 'wave-row';
        const deleteBtn = document.createElement('button');
        deleteBtn.type = 'button';
        deleteBtn.textContent = '×';
        deleteBtn.addEventListener('click', () => {
            level.enemyWaves.splice(index, 1);
            renderAll();
        });
        row.append(
            createWaveField('名称', createTextInput(wave.label, value => { wave.label = value; })),
            createWaveField('单位', createSelectInput(getEnemyModelOptions(), wave.modelType, value => { wave.modelType = value; })),
            createWaveField('数量', createWaveNumberInput(wave.count, 1, value => { wave.count = Math.max(0, Math.round(value)); })),
            createWaveField('开始(s)', createWaveNumberInput(roundValue(wave.startMs / 1000), 0.1, value => { wave.startMs = Math.max(0, Math.round(value * 1000)); })),
            createWaveField('间隔(ms)', createWaveNumberInput(wave.intervalMs, 10, value => { wave.intervalMs = Math.max(80, Math.round(value)); })),
            createWaveField('路径', createSelectInput(['main', 'alternate'], wave.path, value => { wave.path = value; })),
            createWaveField('HP', createOptionalNumberInput(wave.health, value => { if (value === undefined) delete wave.health; else wave.health = value; })),
            createWaveField('速度', createOptionalNumberInput(wave.speed ?? wave.speedMax ?? wave.speedMin, value => {
                delete wave.speedMin;
                delete wave.speedMax;
                if (value === undefined) delete wave.speed;
                else wave.speed = value;
            })),
            deleteBtn
        );
        els.wavesList.appendChild(row);
    });
}

function renderWeaponOptions() {
    const level = getLevel();
    normalizeDefenseRules(level);
    els.weaponOptions.innerHTML = '';
    if (level.attackMode) return;
    getWeaponEditorOptions().forEach(type => {
        const label = document.createElement('label');
        label.className = 'weapon-option';
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = level.availableDefenseWeapons.includes(type);
        checkbox.disabled = !!level.attackMode;
        checkbox.addEventListener('change', () => {
            if (checkbox.checked && !level.availableDefenseWeapons.includes(type)) {
                level.availableDefenseWeapons.push(type);
            } else if (!checkbox.checked) {
                level.availableDefenseWeapons = level.availableDefenseWeapons.filter(item => item !== type);
            }
            normalizeDefenseRules(level);
            renderWeaponOptions();
            syncLevelFields();
        });
        const name = document.createElement('span');
        name.textContent = getWeaponEditorName(type);
        const price = document.createElement('em');
        price.textContent = getWeaponEditorPrice(type) !== '' ? `${getWeaponEditorPrice(type)} pts` : '';
        label.append(checkbox, name, price);
        els.weaponOptions.appendChild(label);
    });
}

function createCardRuleNumberInput(value, step, onInput) {
    const input = document.createElement('input');
    input.type = 'number';
    input.step = step;
    input.value = value ?? 0;
    const commitValue = () => {
        onInput(roundValue(input.value));
        normalizeCardRules(getLevel());
        syncLevelFields();
    };
    input.addEventListener('input', commitValue);
    input.addEventListener('change', commitValue);
    input.addEventListener('blur', commitValue);
    return input;
}

function createCardRuleBoundNumberInput(field, value, step, onInput) {
    const input = createCardRuleNumberInput(value, step, onInput);
    input.dataset.cardField = field;
    return input;
}

function createCardRuleField(labelText, control) {
    const label = document.createElement('label');
    const span = document.createElement('span');
    span.textContent = labelText;
    label.append(span, control);
    return label;
}

function renderCardRules() {
    const level = getLevel();
    normalizeCardRules(level);
    if (els.cardsEnabled) {
        els.cardsEnabled.checked = level.cardRules.enabled;
    }
    if (!els.cardRulesList) return;
    els.cardRulesList.innerHTML = '';
    Object.keys(CARD_EDITOR_DEFAULTS).forEach(rank => {
        const card = level.cardRules.cards[rank];
        const row = document.createElement('div');
        row.className = 'card-rule-row';
        row.dataset.rank = rank;
        const rankLabel = document.createElement('span');
        rankLabel.className = 'card-rule-rank';
        rankLabel.textContent = rank;
        const enabledLabel = document.createElement('label');
        enabledLabel.className = 'card-rule-check';
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.dataset.cardField = 'enabled';
        checkbox.checked = card.enabled;
        checkbox.addEventListener('change', () => {
            normalizeCardRules(level);
            level.cardRules.cards[rank].enabled = checkbox.checked;
            syncCardsEnabledFromRows(level);
            syncLevelFields();
        });
        enabledLabel.append(checkbox, document.createTextNode('启用'));
        row.append(
            rankLabel,
            enabledLabel,
            createCardRuleField('价格', createCardRuleBoundNumberInput('price', card.price, 1, value => { card.price = Math.max(0, Math.round(value)); })),
            createCardRuleField('攻速', createCardRuleBoundNumberInput('fireRateBonus', card.fireRateBonus, 0.01, value => { card.fireRateBonus = Math.max(0, value); })),
            createCardRuleField('伤害', createCardRuleBoundNumberInput('damageBonus', card.damageBonus, 1, value => { card.damageBonus = Math.max(0, Math.round(value)); })),
            createCardRuleField('金币/s', createCardRuleBoundNumberInput('incomePerSecond', card.incomePerSecond, 1, value => { card.incomePerSecond = Math.max(0, Math.round(value)); }))
        );
        els.cardRulesList.appendChild(row);
    });
}

function renderAttackUnitOptions() {
    const level = getLevel();
    if (!els.attackUnitOptions) return;
    els.attackUnitOptions.innerHTML = '';
    if (els.attackUnitsList) els.attackUnitsList.innerHTML = '';
    if (els.attackUnitPicker) els.attackUnitPicker.innerHTML = '';
    if (!level.attackMode) return;
    ensureAttackRules(level);
    const options = getAttackUnitEditorOptions();
    const activeTypes = level.availableAttackUnits.map(unit => unit.modelType);
    if (els.attackUnitPicker) {
        options.forEach(option => {
            const item = document.createElement('option');
            item.value = option.key;
            item.textContent = option.label;
            item.disabled = activeTypes.includes(option.key);
            els.attackUnitPicker.appendChild(item);
        });
    }
    options.forEach(option => {
        const label = document.createElement('label');
        label.className = 'weapon-option';
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = activeTypes.includes(option.key);
        checkbox.addEventListener('change', () => {
            if (checkbox.checked && !level.availableAttackUnits.some(unit => unit.modelType === option.key)) {
                level.availableAttackUnits.push(createDefaultAttackUnit(option.key));
            } else if (!checkbox.checked) {
                level.availableAttackUnits = level.availableAttackUnits.filter(unit => unit.modelType !== option.key);
            }
            normalizeAttackRules(level);
            renderAttackUnitOptions();
            syncLevelFields();
        });
        const name = document.createElement('span');
        name.textContent = option.label;
        const price = document.createElement('em');
        price.textContent = `${option.price} pts`;
        label.append(checkbox, name, price);
        els.attackUnitOptions.appendChild(label);
    });
    renderAttackUnitRows();
}

function createAttackUnitField(labelText, control) {
    const label = document.createElement('label');
    const span = document.createElement('span');
    span.textContent = labelText;
    label.append(span, control);
    return label;
}

function createAttackUnitNumberInput(value, step, onInput) {
    const input = document.createElement('input');
    input.type = 'number';
    input.step = step;
    input.value = value ?? 0;
    input.addEventListener('input', () => {
        onInput(roundValue(input.value));
        normalizeAttackRules(getLevel());
        syncLevelFields();
    });
    return input;
}

function renderAttackUnitRows() {
    const level = getLevel();
    if (!els.attackUnitsList || !level.attackMode) return;
    els.attackUnitsList.innerHTML = '';
    level.availableAttackUnits.forEach((unit, index) => {
        const row = document.createElement('div');
        row.className = 'attack-unit-row';
        const typeSelect = createSelectInput(getEnemyModelOptions(), unit.modelType, value => {
            const replacement = createDefaultAttackUnit(value);
            level.availableAttackUnits[index] = replacement;
            normalizeAttackRules(level);
        });
        Array.from(typeSelect.options).forEach(option => {
            option.textContent = getEnemyModelLabel(option.value);
            option.disabled = option.value !== unit.modelType && level.availableAttackUnits.some(active => active.modelType === option.value);
        });
        const deleteBtn = document.createElement('button');
        deleteBtn.type = 'button';
        deleteBtn.textContent = '×';
        deleteBtn.addEventListener('click', () => {
            level.availableAttackUnits.splice(index, 1);
            normalizeAttackRules(level);
            renderAll();
        });
        row.append(
            createAttackUnitField('兵种', typeSelect),
            createAttackUnitField('价格', createAttackUnitNumberInput(unit.price, 1, value => { unit.price = Math.max(0, Math.round(value)); })),
            createAttackUnitField('HP', createAttackUnitNumberInput(unit.health, 1, value => { unit.health = Math.max(1, Math.round(value)); })),
            createAttackUnitField('速度', createAttackUnitNumberInput(unit.speed, 0.001, value => { unit.speed = Math.max(0, value); })),
            createAttackUnitField('比例', createAttackUnitNumberInput(unit.scale, 0.01, value => { unit.scale = Math.max(0.1, value); })),
            createAttackUnitField('次数(0不限)', createAttackUnitNumberInput(unit.maxPurchases, 1, value => { unit.maxPurchases = Math.max(0, Math.round(value)); })),
            deleteBtn
        );
        els.attackUnitsList.appendChild(row);
    });
}

function updatePanelVisibility() {
    const level = getLevel();
    const isAttack = !!level.attackMode;
    if (els.slotsCard) els.slotsCard.classList.toggle('is-hidden', isAttack);
    if (els.attackRulesCard) els.attackRulesCard.classList.toggle('is-hidden', !isAttack);
    if (els.enemyTowersCard) els.enemyTowersCard.classList.toggle('is-hidden', !isAttack);
    if (els.waveCard) els.waveCard.classList.toggle('is-hidden', isAttack);
    if (els.weaponOptions) els.weaponOptions.classList.toggle('is-hidden', isAttack);
    if (els.cardRulesCard) els.cardRulesCard.classList.toggle('is-hidden', isAttack);
    if (els.addSlot) els.addSlot.disabled = isAttack;
    if (els.addWave) els.addWave.disabled = isAttack;
}

function getWaveEndMs(wave) {
    return (Number(wave.startMs) || 0) + Math.max(0, (Number(wave.count) || 1) - 1) * (Number(wave.intervalMs) || 400);
}

function renderWaveTimeline() {
    const level = getLevel();
    normalizeEnemyWaves(level);
    els.waveTimeline.innerHTML = '';
    const label = document.createElement('div');
    label.className = 'wave-label';
    label.textContent = `${level.enemyWaves.length} 批 / ${level.enemies} 个单位`;
    els.waveTimeline.appendChild(label);
    const maxEnd = Math.max(10000, ...level.enemyWaves.map(getWaveEndMs));
    level.enemyWaves.forEach((wave, index) => {
        const bar = document.createElement('div');
        bar.className = 'wave-bar';
        const startPct = ((Number(wave.startMs) || 0) / maxEnd) * 100;
        const durationPct = Math.max(2, ((getWaveEndMs(wave) - (Number(wave.startMs) || 0) + 600) / maxEnd) * 100);
        bar.style.left = `${Math.min(96, startPct)}%`;
        bar.style.width = `${Math.min(100 - startPct, durationPct)}%`;
        bar.style.top = `${38 + (index % 5) * 10}px`;
        bar.title = `${wave.label}: ${wave.modelType} × ${wave.count}`;
        els.waveTimeline.appendChild(bar);
    });
}

function getBounds(level) {
    const values = [];
    level.points.forEach(point => values.push(point));
    level.slots.forEach(slot => values.push([slot.x, slot.z]));
    if (Array.isArray(level.enemyTowers)) level.enemyTowers.forEach(tower => values.push([tower.x, tower.z]));
    if (Array.isArray(level.altEnemyPoints)) level.altEnemyPoints.forEach(point => values.push(point));
    const extent = Math.max(12, ...values.flat().map(value => Math.abs(Number(value) || 0))) + 2;
    return { min: -extent, max: extent, extent };
}

function renderCanvas() {
    const level = getLevel();
    const canvas = els.canvas;
    const ctx = canvas.getContext('2d');
    const { min, max, extent } = getBounds(level);
    const size = canvas.width;
    const pad = 36;
    const scale = (size - pad * 2) / (max - min);
    const toCanvas = ([x, z]) => ({
        x: pad + (x - min) * scale,
        y: pad + (z - min) * scale
    });
    const toWorld = ({ x, y }) => [
        roundValue(min + (x - pad) / scale),
        roundValue(min + (y - pad) / scale)
    ];
    canvasView = { min, max, extent, size, pad, scale, toCanvas, toWorld };

    ctx.clearRect(0, 0, size, size);
    ctx.fillStyle = '#263238';
    ctx.fillRect(0, 0, size, size);

    ctx.strokeStyle = 'rgba(29, 209, 161, 0.18)';
    ctx.lineWidth = 1;
    for (let i = Math.ceil(min); i <= max; i += 4) {
        const x = pad + (i - min) * scale;
        const y = pad + (i - min) * scale;
        ctx.beginPath();
        ctx.moveTo(x, pad);
        ctx.lineTo(x, size - pad);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(pad, y);
        ctx.lineTo(size - pad, y);
        ctx.stroke();
    }

    const roadWidth = (level.roadWidth || DEFAULT_ROAD_WIDTH) * scale;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgba(255, 92, 103, 0.9)';
    ctx.lineWidth = roadWidth;
    ctx.beginPath();
    level.points.forEach((point, index) => {
        const c = toCanvas(point);
        if (index === 0) ctx.moveTo(c.x, c.y);
        else ctx.lineTo(c.x, c.y);
    });
    ctx.stroke();

    ctx.strokeStyle = 'rgba(120, 245, 255, 0.95)';
    ctx.lineWidth = 3;
    ctx.stroke();

    level.points.forEach((point, index) => {
        const c = toCanvas(point);
        if (index > 0 && index < level.points.length - 1) {
            ctx.fillStyle = 'rgba(255,255,255,0.34)';
            ctx.beginPath();
            ctx.arc(c.x, c.y, roadWidth * 0.42, 0, Math.PI * 2);
            ctx.fill();
        }
    });

    level.points.forEach((point, index) => {
        const c = toCanvas(point);
        const isSpawn = index === 0;
        const isBase = index === level.points.length - 1;
        const isActive = draggedNode && draggedNode.type === 'point' && draggedNode.index === index;
        ctx.save();
        ctx.lineWidth = isActive ? 5 : 3;
        ctx.strokeStyle = isActive ? '#ffffff' : 'rgba(255,255,255,0.82)';
        ctx.fillStyle = isSpawn ? '#26de81' : isBase ? '#ffd32a' : 'rgba(219, 234, 254, 0.94)';
        if (isBase) {
            ctx.beginPath();
            ctx.roundRect(c.x - 15, c.y - 15, 30, 30, 5);
            ctx.fill();
            ctx.stroke();
        } else {
            ctx.beginPath();
            ctx.arc(c.x, c.y, isSpawn ? 13 : 11, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        }
        ctx.restore();
    });

    level.slots.forEach(slot => {
        const c = toCanvas([slot.x, slot.z]);
        const isActive = draggedNode && draggedNode.type === 'slot' && draggedNode.index === level.slots.indexOf(slot);
        ctx.strokeStyle = '#1fb6ff';
        ctx.lineWidth = isActive ? 8 : 6;
        ctx.beginPath();
        ctx.arc(c.x, c.y, 18, 0, Math.PI * 2);
        ctx.stroke();
    });

    if (level.attackMode && Array.isArray(level.enemyTowers)) {
        level.enemyTowers.forEach((tower, index) => {
            const c = toCanvas([tower.x, tower.z]);
            const isActive = draggedNode && draggedNode.type === 'enemyTower' && draggedNode.index === index;
            ctx.save();
            ctx.translate(c.x, c.y);
            ctx.rotate(Math.PI / 4);
            ctx.fillStyle = tower.type === 2 ? '#ff4fd8' : (tower.type === 3 ? '#9b5cf6' : '#f97316');
            ctx.strokeStyle = isActive ? '#ffffff' : 'rgba(255,255,255,0.85)';
            ctx.lineWidth = isActive ? 5 : 3;
            ctx.fillRect(-14, -14, 28, 28);
            ctx.strokeRect(-14, -14, 28, 28);
            ctx.restore();
            ctx.fillStyle = '#ffffff';
            ctx.font = '900 11px Segoe UI';
            ctx.textAlign = 'center';
            ctx.fillText(getWeaponEditorName(tower.type).split(' ')[0], c.x, c.y + 4);
            ctx.textAlign = 'start';
        });
    }

    ctx.fillStyle = '#dbeafe';
    ctx.font = '900 12px Segoe UI';
    ctx.fillText(`extent ${extent.toFixed(1)}`, 12, 22);
}

function renderAll() {
    syncLevelFields();
    updatePanelVisibility();
    renderPointRows();
    renderSlotRows();
    renderEnemyTowerRows();
    renderWeaponOptions();
    renderCardRules();
    renderAttackUnitOptions();
    renderWaveRows();
    renderWaveTimeline();
    renderCanvas();
}

function applySimpleFields() {
    syncFieldsToLevel();
    syncLevelFields();
    updatePanelVisibility();
    renderCanvas();
}

function serializeValue(value, indent = 0) {
    const pad = ' '.repeat(indent);
    const nextPad = ' '.repeat(indent + 4);
    if (Array.isArray(value)) {
        if (value.length === 0) return '[]';
        if (value.every(item => Array.isArray(item) && item.length === 2 && item.every(Number.isFinite))) {
            return `[\n${value.map(item => `${nextPad}[${item[0]}, ${item[1]}]`).join(',\n')}\n${pad}]`;
        }
        return `[\n${value.map(item => `${nextPad}${serializeValue(item, indent + 4)}`).join(',\n')}\n${pad}]`;
    }
    if (value && typeof value === 'object') {
        const entries = Object.entries(value);
        if (entries.length === 0) return '{}';
        return `{\n${entries.map(([key, val]) => `${nextPad}${/^[A-Za-z_$][\w$]*$/.test(key) ? key : JSON.stringify(key)}: ${serializeValue(val, indent + 4)}`).join(',\n')}\n${pad}}`;
    }
    return JSON.stringify(value);
}

function generateMapsText() {
    const extracted = extractLevelsSource(mapsText);
    const serialized = `var LEVELS = ${serializeValue(levels, 0)};`;
    return `${mapsText.slice(0, extracted.start)}${serialized}${mapsText.slice(extracted.end)}`;
}

async function loadDefaultMaps() {
    const response = await fetch(MAPS_PATH, { cache: 'no-store' });
    mapsText = await response.text();
    levels = parseMapsText(mapsText);
    fileHandle = null;
    currentLevel = Object.keys(levels)[0] || '1';
    updateLevelSelect();
    renderAll();
    setStatus('已读取当前 js/maps.js。若要原地保存，请使用“打开本地 maps.js”。');
}

function loadMapsFromText(text, handle, label, canWrite) {
    mapsText = text;
    levels = parseMapsText(mapsText);
    fileHandle = canWrite ? handle : null;
    currentLevel = Object.keys(levels)[0] || '1';
    updateLevelSelect();
    renderAll();
    if (canWrite) {
        setStatus(`已打开 ${label}，现在可以直接保存。`);
    } else {
        setStatus(`已读取 ${label}。当前环境不允许原地保存，保存时会下载新的 maps.js。`);
    }
}

function openFileWithInputFallback() {
    return new Promise((resolve, reject) => {
        els.fallbackFile.value = '';
        els.fallbackFile.onchange = async () => {
            const file = els.fallbackFile.files && els.fallbackFile.files[0];
            if (!file) {
                reject(new Error('没有选择文件。'));
                return;
            }
            try {
                loadMapsFromText(await file.text(), null, file.name, false);
                resolve();
            } catch (error) {
                reject(error);
            }
        };
        els.fallbackFile.click();
    });
}

async function openLocalFile() {
    if (!window.showOpenFilePicker) {
        await openFileWithInputFallback();
        return;
    }
    try {
        const [handle] = await window.showOpenFilePicker({
            types: [{ description: 'JavaScript', accept: { 'text/javascript': ['.js'], 'application/javascript': ['.js'] } }]
        });
        const file = await handle.getFile();
        loadMapsFromText(await file.text(), handle, file.name, true);
    } catch (error) {
        if (error && error.name === 'AbortError') throw error;
        setStatus('当前页面无法取得文件句柄，已切换为普通文件读取模式。');
        await openFileWithInputFallback();
    }
}

async function saveMapsFile() {
    applySimpleFields();
    const output = generateMapsText();
    if (!fileHandle) {
        downloadMapsFile(output);
        setStatus('没有本地文件权限，已改为下载 maps.js。');
        return;
    }
    try {
        const writable = await fileHandle.createWritable();
        await writable.write(output);
        await writable.close();
        mapsText = output;
        setStatus('已保存到本地 maps.js。刷新游戏即可生效。');
    } catch (error) {
        fileHandle = null;
        downloadMapsFile(output);
        setStatus('当前环境不允许写回原文件，已改为下载新的 maps.js。');
    }
}

function downloadMapsFile(text = generateMapsText()) {
    applySimpleFields();
    const blob = new Blob([text], { type: 'text/javascript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'maps.js';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
}

function getSafeFileNamePart(value) {
    return String(value || 'level')
        .trim()
        .replace(/[\\/:*?"<>|]+/g, '-')
        .replace(/\s+/g, '-')
        .slice(0, 48) || 'level';
}

function generateSingleLevelText(levelKey = currentLevel) {
    applySimpleFields();
    const level = JSON.parse(JSON.stringify(getLevel()));
    const title = level.title || `Mission ${levelKey}`;
    const payload = {
        format: 'castle-defend-level',
        version: 1,
        key: String(levelKey),
        title,
        exportedAt: new Date().toISOString(),
        level
    };
    return `// Castle Defend single level export\n// ${title}\nvar CASTLE_DEFEND_LEVEL_EXPORT = ${serializeValue(payload, 0)};\n`;
}

function downloadCurrentLevelFile() {
    const level = getLevel();
    const title = level.title || `Mission ${currentLevel}`;
    const text = generateSingleLevelText(currentLevel);
    const blob = new Blob([text], { type: 'text/javascript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `castle-defend-level-${currentLevel}-${getSafeFileNamePart(title)}.js`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    setStatus(`已导出当前关卡：${title}`);
}

function parseSingleLevelText(text) {
    const sandbox = {};
    Function('sandbox', `
        ${text}
        sandbox.exported = typeof CASTLE_DEFEND_LEVEL_EXPORT !== 'undefined'
            ? CASTLE_DEFEND_LEVEL_EXPORT
            : (typeof CASTLE_DEFEND_LEVEL !== 'undefined' ? CASTLE_DEFEND_LEVEL : undefined);
    `)(sandbox);
    const exported = sandbox.exported;
    if (!exported) throw new Error('没有找到 CASTLE_DEFEND_LEVEL_EXPORT。');
    const level = exported.level || exported;
    if (!level || typeof level !== 'object' || !Array.isArray(level.points)) {
        throw new Error('关卡文件格式不正确，缺少 points 路径数据。');
    }
    if (!level.title && exported.title) level.title = exported.title;
    return JSON.parse(JSON.stringify(level));
}

function importSingleLevelFromText(text, label = '关卡文件') {
    applySimpleFields();
    const importedLevel = parseSingleLevelText(text);
    levels[currentLevel] = importedLevel;
    ensureLevelShape(levels[currentLevel]);
    updateLevelSelect();
    els.levelSelect.value = currentLevel;
    renderAll();
    setStatus(`已用 ${label} 覆盖当前 Mission ${currentLevel}。保存 maps.js 后游戏生效。`);
}

function openSingleLevelWithInput() {
    return new Promise((resolve, reject) => {
        els.levelImportFile.value = '';
        els.levelImportFile.onchange = async () => {
            const file = els.levelImportFile.files && els.levelImportFile.files[0];
            if (!file) {
                reject(new Error('没有选择关卡文件。'));
                return;
            }
            try {
                importSingleLevelFromText(await file.text(), file.name);
                resolve();
            } catch (error) {
                reject(error);
            }
        };
        els.levelImportFile.click();
    });
}

function applyLevelTypeChange() {
    const level = getLevel();
    const isAttack = els.levelType && els.levelType.value === 'attack';
    if (isAttack) {
        level.attackMode = true;
        level.enemyWaves = [];
        level.availableDefenseWeapons = [];
        if (!Array.isArray(level.availableAttackUnits)) level.availableAttackUnits = createDefaultAttackUnits();
        if (!Array.isArray(level.enemyTowers) || !level.enemyTowers.length) {
            level.enemyTowers = createDefaultEnemyTowers(level);
        }
        ensureAttackRules(level);
    } else {
        delete level.attackMode;
        delete level.opponentBaseHp;
        delete level.timeLimitMs;
        delete level.incomeAmount;
        delete level.incomeIntervalMs;
        delete level.availableAttackUnits;
        if (!Array.isArray(level.enemyWaves) || !level.enemyWaves.length) {
            level.enemyWaves = createDefaultEnemyWaves({ enemies: Math.max(20, Number(level.enemies) || 20) });
        }
        if (!Array.isArray(level.availableDefenseWeapons) || !level.availableDefenseWeapons.length) {
            level.availableDefenseWeapons = createDefaultDefenseWeapons(currentLevel, level);
        }
    }
    renderAll();
}

els.levelSelect.addEventListener('change', () => {
    applySimpleFields();
    currentLevel = els.levelSelect.value;
    renderAll();
});

[els.title, els.enemies, els.bossHp, els.cameraExtent, els.roadWidth, els.startingScore, els.opponentBaseHp, els.timeLimit, els.incomeAmount, els.incomeInterval].forEach(input => {
    if (input) input.addEventListener('input', applySimpleFields);
});

if (els.levelType) els.levelType.addEventListener('change', applyLevelTypeChange);
if (els.cardsEnabled) els.cardsEnabled.addEventListener('change', () => {
    const level = getLevel();
    normalizeCardRules(level);
    level.cardRules.enabled = els.cardsEnabled.checked;
    if (level.cardRules.enabled && !hasAnyEnabledCard(level)) {
        Object.keys(CARD_EDITOR_DEFAULTS).forEach(rank => {
            level.cardRules.cards[rank].enabled = true;
        });
    }
    renderCardRules();
    syncLevelFields();
});

els.addPoint.addEventListener('click', () => {
    const level = getLevel();
    const last = level.points[level.points.length - 1];
    level.points.splice(level.points.length - 1, 0, [roundValue(last[0] - 2), roundValue(last[1])]);
    renderAll();
});

els.addSlot.addEventListener('click', () => {
    const level = getLevel();
    if (level.attackMode) return;
    level.slots.push({ x: 0, z: 0 });
    renderAll();
});

if (els.addEnemyTower) els.addEnemyTower.addEventListener('click', () => {
    const level = getLevel();
    level.attackMode = true;
    ensureAttackRules(level);
    const points = level.points || [[0, 0]];
    const point = points[Math.max(0, Math.floor(points.length / 2))] || [0, 0];
    level.enemyTowers.push({ type: 1, x: roundValue(point[0] + 1.6), z: roundValue(point[1]) });
    renderAll();
});

if (els.addAttackUnit) els.addAttackUnit.addEventListener('click', () => {
    const level = getLevel();
    if (!level.attackMode) return;
    ensureAttackRules(level);
    const selected = els.attackUnitPicker && els.attackUnitPicker.value;
    const options = getEnemyModelOptions();
    const modelType = selected || options.find(type => !level.availableAttackUnits.some(unit => unit.modelType === type));
    if (!modelType || level.availableAttackUnits.some(unit => unit.modelType === modelType)) return;
    level.availableAttackUnits.push(createDefaultAttackUnit(modelType));
    normalizeAttackRules(level);
    renderAll();
});

els.addWave.addEventListener('click', () => {
    const level = getLevel();
    if (level.attackMode) return;
    normalizeEnemyWaves(level);
    const lastEnd = Math.max(0, ...level.enemyWaves.map(getWaveEndMs));
    level.enemyWaves.push({
        label: `Wave ${level.enemyWaves.length + 1}`,
        modelType: 'robot',
        count: 10,
        startMs: lastEnd + 2000,
        intervalMs: 500,
        path: 'main',
        health: 6,
        speed: 0.022,
        scale: 1
    });
    renderAll();
});

els.addLevel.addEventListener('click', () => {
    const keys = Object.keys(levels).map(Number).filter(Number.isFinite);
    const nextKey = String((Math.max(0, ...keys) || 0) + 1);
    const source = getLevel();
    const isAttack = !!source.attackMode;
    levels[nextKey] = JSON.parse(JSON.stringify({
        enemies: isAttack ? 0 : 24,
        bossHp: isAttack ? 0 : (source.bossHp || 250),
        title: isAttack ? `Mission ${nextKey} - Assault` : `Mission ${nextKey}`,
        attackMode: isAttack ? true : undefined,
        startingScore: createDefaultStartingScore(nextKey, source),
        opponentBaseHp: isAttack ? (source.opponentBaseHp || 3) : undefined,
        timeLimitMs: isAttack ? (source.timeLimitMs || 60000) : undefined,
        incomeAmount: isAttack ? (source.incomeAmount || 30) : undefined,
        incomeIntervalMs: isAttack ? (source.incomeIntervalMs || 5000) : undefined,
        availableDefenseWeapons: isAttack ? [] : createDefaultDefenseWeapons(nextKey, source),
        availableAttackUnits: isAttack ? (source.availableAttackUnits || createDefaultAttackUnits()) : undefined,
        cameraExtent: source.cameraExtent || 11,
        camera: source.camera,
        roadWidth: source.roadWidth || DEFAULT_ROAD_WIDTH,
        points: source.points,
        slots: isAttack ? [] : source.slots,
        enemyTowers: isAttack ? (source.enemyTowers || createDefaultEnemyTowers(source)) : undefined,
        enemyWaves: isAttack ? [] : createDefaultEnemyWaves({ enemies: 24 })
    }));
    currentLevel = nextKey;
    updateLevelSelect();
    renderAll();
    setStatus(`已新增 Mission ${nextKey}，保存 maps.js 后游戏调试列表会显示这个关卡。`);
});

els.applyAdvanced.addEventListener('click', () => {
    try {
        levels[currentLevel] = JSON.parse(els.advanced.value);
        ensureLevelShape(levels[currentLevel]);
        renderAll();
        setStatus('高级数据已应用。');
    } catch (error) {
        setStatus(`高级数据不是合法 JSON：${error.message}`, true);
    }
});

function getCanvasPointer(event) {
    const rect = els.canvas.getBoundingClientRect();
    const scaleX = els.canvas.width / rect.width;
    const scaleY = els.canvas.height / rect.height;
    return {
        x: (event.clientX - rect.left) * scaleX,
        y: (event.clientY - rect.top) * scaleY
    };
}

function distance(a, b) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
}

function findCanvasNodeAt(canvasPoint) {
    const level = getLevel();
    if (!canvasView) return null;
    if (level.attackMode && Array.isArray(level.enemyTowers)) {
        for (let i = level.enemyTowers.length - 1; i >= 0; i--) {
            const tower = level.enemyTowers[i];
            const center = canvasView.toCanvas([tower.x, tower.z]);
            if (distance(canvasPoint, center) <= 28) return { type: 'enemyTower', index: i };
        }
    }
    const slotHitRadius = 26;
    for (let i = level.slots.length - 1; i >= 0; i--) {
        const slot = level.slots[i];
        const center = canvasView.toCanvas([slot.x, slot.z]);
        if (distance(canvasPoint, center) <= slotHitRadius) return { type: 'slot', index: i };
    }

    for (let i = level.points.length - 1; i >= 0; i--) {
        const center = canvasView.toCanvas(level.points[i]);
        const isEndPoint = i === 0 || i === level.points.length - 1;
        const hitRadius = isEndPoint ? 25 : Math.max(22, ((level.roadWidth || DEFAULT_ROAD_WIDTH) * canvasView.scale) * 0.42);
        if (distance(canvasPoint, center) <= hitRadius) return { type: 'point', index: i };
    }
    return null;
}

function applyDraggedNode(canvasPoint) {
    if (!draggedNode || !draggedNode.view) return;
    const level = getLevel();
    const [x, z] = draggedNode.view.toWorld(canvasPoint);
    if (draggedNode.type === 'point' && level.points[draggedNode.index]) {
        level.points[draggedNode.index][0] = x;
        level.points[draggedNode.index][1] = z;
    } else if (draggedNode.type === 'slot' && level.slots[draggedNode.index]) {
        level.slots[draggedNode.index].x = x;
        level.slots[draggedNode.index].z = z;
    } else if (draggedNode.type === 'enemyTower' && level.enemyTowers && level.enemyTowers[draggedNode.index]) {
        level.enemyTowers[draggedNode.index].x = x;
        level.enemyTowers[draggedNode.index].z = z;
    }
    syncLevelFields();
    renderCanvas();
}

function finishCanvasDrag() {
    if (!draggedNode) return;
    draggedNode = null;
    els.canvas.classList.remove('dragging');
    renderAll();
}

els.canvas.addEventListener('pointerdown', event => {
    if (!Object.keys(levels).length) return;
    const canvasPoint = getCanvasPointer(event);
    const hit = findCanvasNodeAt(canvasPoint);
    if (!hit) return;
    draggedNode = {
        ...hit,
        pointerId: event.pointerId,
        view: canvasView
    };
    els.canvas.setPointerCapture(event.pointerId);
    els.canvas.classList.add('dragging');
    event.preventDefault();
    renderCanvas();
});

els.canvas.addEventListener('pointermove', event => {
    if (draggedNode && draggedNode.pointerId === event.pointerId) {
        applyDraggedNode(getCanvasPointer(event));
        event.preventDefault();
        return;
    }
    const hit = findCanvasNodeAt(getCanvasPointer(event));
    els.canvas.classList.toggle('can-drag', !!hit);
});

els.canvas.addEventListener('pointerup', event => {
    if (draggedNode && draggedNode.pointerId === event.pointerId) finishCanvasDrag();
});

els.canvas.addEventListener('pointercancel', finishCanvasDrag);
els.canvas.addEventListener('pointerleave', event => {
    if (!draggedNode) els.canvas.classList.remove('can-drag');
});

els.openFile.addEventListener('click', () => openLocalFile().catch(error => setStatus(error.message, true)));
els.saveFile.addEventListener('click', () => saveMapsFile().catch(error => setStatus(error.message, true)));
els.download.addEventListener('click', () => {
    try {
        downloadMapsFile();
        setStatus('已下载 maps.js。');
    } catch (error) {
        setStatus(error.message, true);
    }
});
if (els.downloadLevel) els.downloadLevel.addEventListener('click', () => {
    try {
        downloadCurrentLevelFile();
    } catch (error) {
        setStatus(error.message, true);
    }
});
if (els.importLevel) els.importLevel.addEventListener('click', () => {
    openSingleLevelWithInput().catch(error => setStatus(error.message, true));
});

if (window.location.protocol === 'file:') {
    setStatus('当前是 file:// 页面，浏览器不会允许自动读取项目文件。请点击“打开本地 maps.js”选择项目里的 js/maps.js。');
} else {
    loadDefaultMaps().catch(error => setStatus(error.message, true));
}
