const MAPS_PATH = 'js/maps.js';
const DEFAULT_ROAD_WIDTH = 3.5;

let mapsText = '';
let levels = {};
let currentLevel = '1';
let fileHandle = null;

const els = {
    status: document.getElementById('statusLine'),
    levelSelect: document.getElementById('levelSelect'),
    title: document.getElementById('titleInput'),
    enemies: document.getElementById('enemiesInput'),
    bossHp: document.getElementById('bossHpInput'),
    cameraExtent: document.getElementById('cameraExtentInput'),
    roadWidth: document.getElementById('roadWidthInput'),
    spawn: document.getElementById('spawnInput'),
    base: document.getElementById('baseInput'),
    canvas: document.getElementById('mapCanvas'),
    pointsList: document.getElementById('pointsList'),
    slotsList: document.getElementById('slotsList'),
    advanced: document.getElementById('advancedJson'),
    loadDefault: document.getElementById('loadDefaultBtn'),
    openFile: document.getElementById('openFileBtn'),
    saveFile: document.getElementById('saveFileBtn'),
    download: document.getElementById('downloadBtn'),
    fallbackFile: document.getElementById('fallbackFileInput'),
    addPoint: document.getElementById('addPointBtn'),
    addSlot: document.getElementById('addSlotBtn'),
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
    els.title.value = level.title || '';
    els.enemies.value = level.enemies ?? 0;
    els.bossHp.value = level.bossHp ?? 0;
    els.cameraExtent.value = level.cameraExtent ?? '';
    els.roadWidth.value = level.roadWidth ?? DEFAULT_ROAD_WIDTH;
    const spawn = level.points[0];
    const base = level.points[level.points.length - 1];
    els.spawn.value = `${spawn[0]}, ${spawn[1]}`;
    els.base.value = `${base[0]}, ${base[1]}`;
    els.advanced.value = JSON.stringify(level, null, 2);
}

function syncFieldsToLevel() {
    const level = getLevel();
    level.title = els.title.value;
    level.enemies = Number(els.enemies.value) || 0;
    level.bossHp = Number(els.bossHp.value) || 0;
    if (els.cameraExtent.value === '') delete level.cameraExtent;
    else level.cameraExtent = Number(els.cameraExtent.value) || 0;
    level.roadWidth = Number(els.roadWidth.value) || DEFAULT_ROAD_WIDTH;
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

function getBounds(level) {
    const values = [];
    level.points.forEach(point => values.push(point));
    level.slots.forEach(slot => values.push([slot.x, slot.z]));
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

    level.slots.forEach(slot => {
        const c = toCanvas([slot.x, slot.z]);
        ctx.strokeStyle = '#1fb6ff';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.arc(c.x, c.y, 18, 0, Math.PI * 2);
        ctx.stroke();
    });

    const spawn = toCanvas(level.points[0]);
    ctx.fillStyle = '#26de81';
    ctx.beginPath();
    ctx.arc(spawn.x, spawn.y, 13, 0, Math.PI * 2);
    ctx.fill();

    const base = toCanvas(level.points[level.points.length - 1]);
    ctx.fillStyle = '#ffd32a';
    ctx.fillRect(base.x - 16, base.y - 16, 32, 32);

    ctx.fillStyle = '#dbeafe';
    ctx.font = '900 12px Segoe UI';
    ctx.fillText(`extent ${extent.toFixed(1)}`, 12, 22);
}

function renderAll() {
    syncLevelFields();
    renderPointRows();
    renderSlotRows();
    renderCanvas();
}

function applySimpleFields() {
    syncFieldsToLevel();
    syncLevelFields();
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

els.levelSelect.addEventListener('change', () => {
    applySimpleFields();
    currentLevel = els.levelSelect.value;
    renderAll();
});

[els.title, els.enemies, els.bossHp, els.cameraExtent, els.roadWidth].forEach(input => {
    input.addEventListener('input', applySimpleFields);
});

els.addPoint.addEventListener('click', () => {
    const level = getLevel();
    const last = level.points[level.points.length - 1];
    level.points.splice(level.points.length - 1, 0, [roundValue(last[0] - 2), roundValue(last[1])]);
    renderAll();
});

els.addSlot.addEventListener('click', () => {
    const level = getLevel();
    level.slots.push({ x: 0, z: 0 });
    renderAll();
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

els.loadDefault.addEventListener('click', () => loadDefaultMaps().catch(error => setStatus(error.message, true)));
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

if (window.location.protocol === 'file:') {
    setStatus('当前是 file:// 页面，浏览器不会允许自动读取项目文件。请点击“打开本地 maps.js”选择项目里的 js/maps.js。');
} else {
    loadDefaultMaps().catch(error => setStatus(error.message, true));
}
