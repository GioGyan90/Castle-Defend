(function() {
    'use strict';

    const STORAGE_KEY = 'castleDefend.animationPresets.v1';

    const canvas = document.getElementById('stage');
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x071019);
    scene.fog = new THREE.Fog(0x071019, 18, 48);

    const camera = new THREE.PerspectiveCamera(48, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(8, 8, 12);
    camera.lookAt(0, 2.5, 0);

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);

    scene.add(new THREE.AmbientLight(0xffffff, 0.62));
    const keyLight = new THREE.DirectionalLight(0xffffff, 0.86);
    keyLight.position.set(8, 12, 6);
    scene.add(keyLight);

    const grid = new THREE.GridHelper(34, 34, 0x29ccd6, 0x15424d);
    grid.material.opacity = 0.32;
    grid.material.transparent = true;
    scene.add(grid);

    const marker = new THREE.Mesh(
        new THREE.CylinderGeometry(1.15, 1.15, 0.08, 48),
        new THREE.MeshBasicMaterial({ color: 0x4cecff, transparent: true, opacity: 0.22 })
    );
    marker.position.y = 0.02;
    scene.add(marker);

    window.currentLevel = 3;

    const registry = typeof window.getAnimationShowcaseAssets === 'function'
        ? window.getAnimationShowcaseAssets()
        : (window.ANIMATION_ASSET_REGISTRY || []);
    const state = {
        assetId: registry[0] ? registry[0].id : '',
        activeAnimation: null,
        saveTimer: null
    };

    const assetSelect = document.getElementById('assetSelect');
    const assetGroup = document.getElementById('assetGroup');
    const assetName = document.getElementById('assetName');
    const directionSlider = document.getElementById('directionSlider');
    const amplitudeSlider = document.getElementById('amplitudeSlider');
    const sizeSlider = document.getElementById('sizeSlider');
    const directionValue = document.getElementById('directionValue');
    const amplitudeValue = document.getElementById('amplitudeValue');
    const sizeValue = document.getElementById('sizeValue');
    const partPanel = document.getElementById('partPanel');
    const partName = document.getElementById('partName');
    const partControls = document.getElementById('partControls');
    const playButton = document.getElementById('playButton');
    const saveButton = document.getElementById('saveButton');
    const saveStatus = document.getElementById('saveStatus');
    const controlPanel = document.querySelector('.control-panel');
    const panelToggle = document.getElementById('panelToggle');

    const orbitState = {
        yaw: Math.atan2(camera.position.x, camera.position.z),
        pitch: 0.34,
        radius: 16,
        targetY: 2.5,
        dragging: false,
        lastX: 0,
        lastY: 0
    };

    function updateCameraOrbit() {
        const cosPitch = Math.cos(orbitState.pitch);
        camera.position.set(
            Math.sin(orbitState.yaw) * cosPitch * orbitState.radius,
            orbitState.targetY + Math.sin(orbitState.pitch) * orbitState.radius,
            Math.cos(orbitState.yaw) * cosPitch * orbitState.radius
        );
        camera.lookAt(0, orbitState.targetY, 0);
    }

    function loadPresets() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') || {};
        } catch (error) {
            return {};
        }
    }

    function writePresets(presets) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
            return true;
        } catch (error) {
            return false;
        }
    }

    function getActiveAsset() {
        return registry.find(asset => asset.id === state.assetId) || registry[0];
    }

    function getSavedConfig(assetId) {
        return loadPresets()[assetId] || {};
    }

    function getDefaultConfig(asset) {
        const config = Object.assign({}, asset && asset.defaults ? asset.defaults : {}, getSavedConfig(asset ? asset.id : ''));
        if (asset && asset.id === 'enemy-wheelbarrow') {
            config.wheelRotationAxis = ['x', 'y', 'z'].includes(config.wheelRotationAxis) ? config.wheelRotationAxis : 'x';
            config.wheelSpinSpeed = Number(config.wheelSpinSpeed);
            if (!Number.isFinite(config.wheelSpinSpeed)) config.wheelSpinSpeed = 0.15;
            if (config.turretSwingAmplitude === undefined) config.turretSwingAmplitude = 0.15;
            if (config.turretSwingSpeed === undefined) config.turretSwingSpeed = 0.003;
        }
        return config;
    }

    function toNumber(value, fallback) {
        const number = Number(value);
        return Number.isFinite(number) ? number : fallback;
    }

    function collectAnimationConfig() {
        const config = {
            directionAngle: toNumber(directionSlider.value, 35),
            amplitude: toNumber(amplitudeSlider.value, 1),
            radius: toNumber(sizeSlider.value, 6.5)
        };
        partControls.querySelectorAll('[data-control-id]').forEach(control => {
            config[control.dataset.controlId] = control.tagName === 'SELECT'
                ? control.value
                : toNumber(control.value, 0);
        });
        return config;
    }

    function syncLabels() {
        directionValue.textContent = Math.round(Number(directionSlider.value)) + ' deg';
        amplitudeValue.textContent = Number(amplitudeSlider.value).toFixed(2);
        sizeValue.textContent = Number(sizeSlider.value).toFixed(1);
        partControls.querySelectorAll('[data-control-id]').forEach(control => {
            const valueEl = partControls.querySelector(`[data-value-for="${control.dataset.controlId}"]`);
            if (!valueEl) return;
            valueEl.textContent = control.tagName === 'SELECT'
                ? control.selectedOptions[0].textContent
                : Number(control.value).toFixed(3).replace(/0$/, '').replace(/0$/, '');
        });
    }

    function updateAssetMeta() {
        const asset = getActiveAsset();
        if (!asset) return;
        assetName.textContent = asset.name;
        assetGroup.textContent = asset.group || 'Animation Assets';
    }

    function applyLiveConfig() {
        const config = collectAnimationConfig();
        if (!state.activeAnimation) return;
        if (Number.isFinite(config.directionAngle)) state.activeAnimation.directionAngle = config.directionAngle;
        if (Number.isFinite(config.amplitude)) state.activeAnimation.amplitude = Math.max(0.25, config.amplitude);
        if (typeof state.activeAnimation.setAnimationConfig === 'function') {
            state.activeAnimation.setAnimationConfig(config);
        }
    }

    function setSliderValues(config) {
        directionSlider.value = config.directionAngle ?? 35;
        amplitudeSlider.value = config.amplitude ?? 1;
        sizeSlider.value = config.radius ?? 6.5;
        syncLabels();
        updateAssetMeta();
    }

    function renderPartControls(asset, config) {
        const controls = asset && asset.animationControls ? asset.animationControls : [];
        partControls.innerHTML = '';
        partPanel.hidden = controls.length === 0;
        if (!controls.length) return;

        partName.textContent = controls[0].part || 'Part';
        controls.forEach(control => {
            const wrap = document.createElement('div');
            wrap.className = 'part-control';
            const value = config[control.id] ?? control.value ?? 0;
            if (control.type === 'select') {
                const options = (control.options || []).map(option => `
                    <option value="${option.value}" ${String(value) === String(option.value) ? 'selected' : ''}>${option.label}</option>
                `).join('');
                wrap.innerHTML = `
                    <label for="control-${control.id}">
                        ${control.part || 'Part'} ${control.label}
                        <span data-value-for="${control.id}">${String(value).toUpperCase()} Axis</span>
                    </label>
                    <select id="control-${control.id}" data-control-id="${control.id}">${options}</select>
                `;
            } else {
                wrap.innerHTML = `
                    <label for="control-${control.id}">
                        ${control.part || 'Part'} ${control.label}
                        <span data-value-for="${control.id}">${Number(value).toFixed(2)}</span>
                    </label>
                    <input
                        id="control-${control.id}"
                        data-control-id="${control.id}"
                        type="range"
                        min="${control.min}"
                        max="${control.max}"
                        step="${control.step || 0.01}"
                        value="${value}"
                    >
                `;
            }
            partControls.appendChild(wrap);
        });

        partControls.querySelectorAll('[data-control-id]').forEach(control => {
            control.addEventListener('input', () => {
                syncLabels();
                applyLiveConfig();
            });
            control.addEventListener('change', () => {
                syncLabels();
                applyLiveConfig();
            });
        });
        syncLabels();
    }

    function clearAnimation() {
        if (state.activeAnimation && typeof state.activeAnimation.dispose === 'function') {
            state.activeAnimation.dispose();
        }
        state.activeAnimation = null;
    }

    function playAnimation() {
        const asset = getActiveAsset();
        if (!asset) return;
        clearAnimation();
        const config = collectAnimationConfig();
        state.activeAnimation = asset.create(scene, new THREE.Vector3(0, 0.15, 0), {
            radius: config.radius,
            directionAngle: config.directionAngle,
            amplitude: config.amplitude,
            animationConfig: config,
            quality: window.innerWidth < 700 ? 0.55 : 0.72
        });
    }

    function saveCurrentAnimation() {
        const asset = getActiveAsset();
        if (!asset) return;
        const presets = loadPresets();
        presets[asset.id] = collectAnimationConfig();
        saveStatus.textContent = writePresets(presets) ? 'Saved' : 'Save failed';
        clearTimeout(state.saveTimer);
        state.saveTimer = setTimeout(() => {
            saveStatus.textContent = '';
        }, 1600);
    }

    function renderAssetSelect() {
        assetSelect.innerHTML = '';
        const groups = new Map();
        registry.forEach(asset => {
            const groupName = asset.group || 'Animation Assets';
            if (!groups.has(groupName)) {
                const optgroup = document.createElement('optgroup');
                optgroup.label = groupName;
                groups.set(groupName, optgroup);
                assetSelect.appendChild(optgroup);
            }
            const option = document.createElement('option');
            option.value = asset.id;
            option.textContent = asset.name;
            groups.get(groupName).appendChild(option);
        });
        assetSelect.value = state.assetId;
    }

    function setActiveAsset(assetId) {
        state.assetId = assetId;
        const asset = getActiveAsset();
        const config = getDefaultConfig(asset);
        setSliderValues(config);
        renderPartControls(asset, config);
        playAnimation();
    }

    [directionSlider, amplitudeSlider].forEach(input => {
        input.addEventListener('input', () => {
            syncLabels();
            applyLiveConfig();
        });
    });
    sizeSlider.addEventListener('input', syncLabels);
    sizeSlider.addEventListener('change', playAnimation);
    assetSelect.addEventListener('change', () => setActiveAsset(assetSelect.value));
    playButton.addEventListener('click', playAnimation);
    saveButton.addEventListener('click', saveCurrentAnimation);

    if (panelToggle && controlPanel) {
        panelToggle.addEventListener('click', () => {
            const collapsed = controlPanel.classList.toggle('collapsed');
            panelToggle.textContent = collapsed ? 'Expand Controls' : 'Collapse Controls';
            panelToggle.setAttribute('aria-expanded', String(!collapsed));
        });
    }

    canvas.addEventListener('pointerdown', event => {
        orbitState.dragging = true;
        orbitState.lastX = event.clientX;
        orbitState.lastY = event.clientY;
        canvas.classList.add('is-dragging');
        if (typeof canvas.setPointerCapture === 'function') {
            canvas.setPointerCapture(event.pointerId);
        }
    });

    canvas.addEventListener('pointermove', event => {
        if (!orbitState.dragging) return;
        const deltaX = event.clientX - orbitState.lastX;
        const deltaY = event.clientY - orbitState.lastY;
        orbitState.lastX = event.clientX;
        orbitState.lastY = event.clientY;
        orbitState.yaw -= deltaX * 0.008;
        orbitState.pitch = Math.max(-0.25, Math.min(1.12, orbitState.pitch - deltaY * 0.006));
        updateCameraOrbit();
    });

    function endOrbitDrag(event) {
        orbitState.dragging = false;
        canvas.classList.remove('is-dragging');
        if (event && typeof canvas.releasePointerCapture === 'function') {
            try {
                canvas.releasePointerCapture(event.pointerId);
            } catch (error) {
                // Pointer capture may already be released by the browser.
            }
        }
    }

    canvas.addEventListener('pointerup', endOrbitDrag);
    canvas.addEventListener('pointercancel', endOrbitDrag);
    canvas.addEventListener('wheel', event => {
        event.preventDefault();
        orbitState.radius = Math.max(5, Math.min(28, orbitState.radius + event.deltaY * 0.012));
        updateCameraOrbit();
    }, { passive: false });

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        updateCameraOrbit();
    });

    function animate(time) {
        requestAnimationFrame(animate);
        marker.rotation.y += 0.01;
        if (state.activeAnimation) {
            state.activeAnimation.update(time);
            if (state.activeAnimation.isComplete) {
                state.activeAnimation = null;
            }
        }
        renderer.render(scene, camera);
    }

    if (registry.length) {
        renderAssetSelect();
        setActiveAsset(state.assetId);
    }
    updateCameraOrbit();
    requestAnimationFrame(animate);
})();
