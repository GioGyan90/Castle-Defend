(function(global) {
    'use strict';

    var sharedExplosionTexture = null;

    function getThree() {
        return global.THREE;
    }

    function createParticleTexture() {
        var THREE = getThree();
        if (!THREE) return null;
        if (sharedExplosionTexture) return sharedExplosionTexture;

        var canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        var ctx = canvas.getContext('2d');
        var gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
        gradient.addColorStop(0, 'rgba(255,255,255,1)');
        gradient.addColorStop(0.16, 'rgba(255,220,120,1)');
        gradient.addColorStop(0.42, 'rgba(255,80,10,0.72)');
        gradient.addColorStop(0.72, 'rgba(70,16,8,0.18)');
        gradient.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 64, 64);

        sharedExplosionTexture = new THREE.CanvasTexture(canvas);
        sharedExplosionTexture.needsUpdate = true;
        return sharedExplosionTexture;
    }

    function normalizePosition(position) {
        var THREE = getThree();
        if (position && position.isVector3) return position.clone();
        return new THREE.Vector3(
            position && Number.isFinite(position.x) ? position.x : 0,
            position && Number.isFinite(position.y) ? position.y : 0,
            position && Number.isFinite(position.z) ? position.z : 0
        );
    }

    function getHorizontalDirection(angleDeg) {
        var THREE = getThree();
        var angle = (Number.isFinite(angleDeg) ? angleDeg : 35) * Math.PI / 180;
        return new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle));
    }

    function easeOutCubic(t) {
        return 1 - Math.pow(1 - t, 3);
    }

    function clamp01(t) {
        return Math.max(0, Math.min(1, t));
    }

    function easeOutExpo(t) {
        return t >= 1 ? 1 : 1 - Math.pow(2, -10 * t);
    }

    function easeInOutSine(t) {
        return -(Math.cos(Math.PI * t) - 1) / 2;
    }

    function randomRange(min, max) {
        return min + Math.random() * (max - min);
    }

    function snap(value, step) {
        return Math.round(value / step) * step;
    }

    function pick(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    }

    function makeVoxelMaterial(color) {
        var THREE = getThree();
        return new THREE.MeshBasicMaterial({ color: color });
    }

    function randomUnitVector(upBias) {
        var THREE = getThree();
        var angle = Math.random() * Math.PI * 2;
        var y = randomRange(-0.15, 1) + (upBias || 0);
        var radial = Math.sqrt(Math.max(0.001, 1 - Math.min(0.95, y * y)));
        return new THREE.Vector3(Math.cos(angle) * radial, y, Math.sin(angle) * radial).normalize();
    }

    function disposeObject(object) {
        if (!object) return;
        if (object.geometry) object.geometry.dispose();
        if (object.material) object.material.dispose();
    }

    function disposeTree(root) {
        if (!root) return;
        root.traverse(function(child) {
            disposeObject(child);
        });
    }

    function BossExplosionAnimation(scene, position, options) {
        var THREE = getThree();
        options = options || {};
        this.scene = scene;
        this.position = normalizePosition(position);
        this.radius = Math.max(2.8, options.radius || 6);
        this.duration = Math.max(0.8, options.duration || 2.35);
        this.directionAngle = Number.isFinite(options.directionAngle) ? options.directionAngle : 35;
        this.amplitude = Math.max(0.25, options.amplitude || 1);
        this.directionStrength = Number.isFinite(options.directionStrength) ? options.directionStrength : 0.38;
        this.quality = Math.max(0.35, Math.min(options.quality || 0.72, 1));
        this.onComplete = options.onComplete;
        this.elapsedTime = 0;
        this.lastUpdateMs = null;
        this.isComplete = false;
        this.systems = [];
        this.scaleUnit = this.radius / 12;

        this.root = new THREE.Group();
        this.root.name = 'boss-explosion-animation';
        this.root.position.copy(this.position);
        this.scene.add(this.root);

        this._initSphereSystem();
        this._initFireSystem();
        this._initSmokeSystem();
        this._initShockwaveSystem();
    }

    BossExplosionAnimation.prototype._particleCount = function(baseCount) {
        return Math.max(24, Math.round(baseCount * this.quality));
    };

    BossExplosionAnimation.prototype._track = function(system, type) {
        system.frustumCulled = false;
        this.root.add(system);
        this.systems.push({ system: system, type: type });
    };

    BossExplosionAnimation.prototype._initSphereSystem = function() {
        var THREE = getThree();
        var particleCount = this._particleCount(880);
        var geometry = new THREE.BufferGeometry();
        var positions = new Float32Array(particleCount * 3);
        var dirs = new Float32Array(particleCount * 3);
        var speeds = new Float32Array(particleCount);
        var colors = new Float32Array(particleCount * 3);
        var baseColor = new THREE.Color(0xff510d);

        for (var i = 0; i < particleCount; i++) {
            var theta = Math.random() * Math.PI * 2;
            var phi = Math.acos((Math.random() * 2) - 1);
            var dx = Math.sin(phi) * Math.cos(theta);
            var dy = Math.abs(Math.sin(phi) * Math.sin(theta)) * 0.65 + 0.08;
            var dz = Math.cos(phi);
            dirs.set([dx, dy, dz], i * 3);
            speeds[i] = this.radius * (0.72 + Math.random() * 0.58);
            var color = baseColor.clone().lerp(new THREE.Color(0xffd86b), Math.random() * 0.45);
            colors.set([color.r, color.g, color.b], i * 3);
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('dir', new THREE.BufferAttribute(dirs, 3));
        geometry.setAttribute('speed', new THREE.BufferAttribute(speeds, 1));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        var material = new THREE.PointsMaterial({
            size: Math.max(0.28, 0.72 * this.scaleUnit),
            map: createParticleTexture(),
            vertexColors: true,
            transparent: true,
            opacity: 1,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        this._track(new THREE.Points(geometry, material), 'sphere');
    };

    BossExplosionAnimation.prototype._initFireSystem = function() {
        var THREE = getThree();
        var particleCount = this._particleCount(780);
        var geometry = new THREE.BufferGeometry();
        var positions = new Float32Array(particleCount * 3);
        var colors = new Float32Array(particleCount * 3);
        var ages = new Float32Array(particleCount);
        var speedYs = new Float32Array(particleCount);
        var offsets = new Float32Array(particleCount * 3);

        for (var i = 0; i < particleCount; i++) {
            ages[i] = Math.random();
            this._resetFireParticle(positions, speedYs, offsets, colors, i);
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute('age', new THREE.BufferAttribute(ages, 1));
        geometry.setAttribute('speedY', new THREE.BufferAttribute(speedYs, 1));
        geometry.setAttribute('offset', new THREE.BufferAttribute(offsets, 3));

        var material = new THREE.PointsMaterial({
            size: Math.max(1.2, 4.4 * this.scaleUnit),
            vertexColors: true,
            map: createParticleTexture(),
            transparent: true,
            opacity: 1,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        this._track(new THREE.Points(geometry, material), 'fire');
    };

    BossExplosionAnimation.prototype._resetFireParticle = function(positions, speedYs, offsets, colors, i) {
        var idx = i * 3;
        var theta = Math.random() * Math.PI * 2;
        var r = Math.pow(Math.random(), 1.8) * this.radius * 0.11;
        positions[idx] = Math.cos(theta) * r;
        positions[idx + 1] = (Math.random() - 0.35) * this.radius * 0.035;
        positions[idx + 2] = Math.sin(theta) * r;
        speedYs[i] = this.radius * (0.46 + Math.random() * 0.42);
        offsets[idx] = Math.random() * 100;
        offsets[idx + 1] = Math.random() * 100;
        offsets[idx + 2] = Math.random() * 100;
        colors.set([1, 0.92 + Math.random() * 0.08, 0.65 + Math.random() * 0.22], idx);
    };

    BossExplosionAnimation.prototype._initSmokeSystem = function() {
        var THREE = getThree();
        var particleCount = this._particleCount(980);
        var geometry = new THREE.BufferGeometry();
        var positions = new Float32Array(particleCount * 3);
        var angles = new Float32Array(particleCount);
        var expandSpeeds = new Float32Array(particleCount);
        var riseSpeeds = new Float32Array(particleCount);
        var randoms = new Float32Array(particleCount);
        var types = new Float32Array(particleCount);
        var sizes = new Float32Array(particleCount);

        for (var i = 0; i < particleCount; i++) {
            angles[i] = Math.random() * Math.PI * 2;
            randoms[i] = Math.random();
            sizes[i] = 0.62 + Math.random() * 0.92;
            if (Math.random() > 0.32) {
                types[i] = 0;
                expandSpeeds[i] = this.radius * (0.34 + Math.random() * 0.34);
                riseSpeeds[i] = this.radius * (0.9 + Math.random() * 0.68);
            } else {
                types[i] = 1;
                expandSpeeds[i] = this.radius * (0.48 + Math.random() * 0.38);
                riseSpeeds[i] = this.radius * (0.28 + Math.random() * 0.28);
            }
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('angle', new THREE.BufferAttribute(angles, 1));
        geometry.setAttribute('expandSpeed', new THREE.BufferAttribute(expandSpeeds, 1));
        geometry.setAttribute('riseSpeed', new THREE.BufferAttribute(riseSpeeds, 1));
        geometry.setAttribute('random', new THREE.BufferAttribute(randoms, 1));
        geometry.setAttribute('typeFlag', new THREE.BufferAttribute(types, 1));
        geometry.setAttribute('sizeSeed', new THREE.BufferAttribute(sizes, 1));

        var material = new THREE.PointsMaterial({
            size: Math.max(1.25, 3.8 * this.scaleUnit),
            color: 0x1b1718,
            map: createParticleTexture(),
            transparent: true,
            opacity: 0.46,
            blending: THREE.NormalBlending,
            depthWrite: false
        });

        this._track(new THREE.Points(geometry, material), 'smoke');
    };

    BossExplosionAnimation.prototype._initShockwaveSystem = function() {
        var THREE = getThree();
        var particleCount = this._particleCount(360);
        var geometry = new THREE.BufferGeometry();
        var positions = new Float32Array(particleCount * 3);
        var angles = new Float32Array(particleCount);
        var speeds = new Float32Array(particleCount);

        for (var i = 0; i < particleCount; i++) {
            angles[i] = Math.random() * Math.PI * 2;
            speeds[i] = this.radius * (1.45 + Math.random() * 0.62);
            positions.set([0, 0.05, 0], i * 3);
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('angle', new THREE.BufferAttribute(angles, 1));
        geometry.setAttribute('speed', new THREE.BufferAttribute(speeds, 1));

        var material = new THREE.PointsMaterial({
            size: Math.max(0.8, 2.8 * this.scaleUnit),
            color: 0xfff0d6,
            map: createParticleTexture(),
            transparent: true,
            opacity: 0.85,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        this._track(new THREE.Points(geometry, material), 'shockwave');
    };

    BossExplosionAnimation.prototype.update = function(timeMs) {
        if (this.isComplete) return;
        var now = Number.isFinite(timeMs) ? timeMs : performance.now();
        if (this.lastUpdateMs === null) this.lastUpdateMs = now;
        var delta = Math.min(0.05, Math.max(0.001, (now - this.lastUpdateMs) / 1000 || 1 / 60));
        this.lastUpdateMs = now;
        this.elapsedTime += delta;

        var progress = Math.min(this.elapsedTime / this.duration, 1);
        var ease = easeOutCubic(progress);
        var direction = getHorizontalDirection(this.directionAngle);
        var drift = this.radius * this.directionStrength * this.amplitude * ease;

        for (var s = 0; s < this.systems.length; s++) {
            var item = this.systems[s];
            var geometry = item.system.geometry;
            var material = item.system.material;
            var positions = geometry.attributes.position.array;

            if (item.type === 'sphere') {
                var dirs = geometry.attributes.dir.array;
                var speeds = geometry.attributes.speed.array;
                for (var i = 0; i < speeds.length; i++) {
                    var idx = i * 3;
                    var distance = speeds[i] * ease;
                    positions[idx] = dirs[idx] * distance + direction.x * drift * 0.35;
                    positions[idx + 1] = dirs[idx + 1] * distance * (0.72 + this.amplitude * 0.12);
                    positions[idx + 2] = dirs[idx + 2] * distance + direction.z * drift * 0.35;
                }
                material.opacity = Math.max(0, 1 - progress * 1.25);
            } else if (item.type === 'fire') {
                var ages = geometry.attributes.age.array;
                var speedYs = geometry.attributes.speedY.array;
                var offsets = geometry.attributes.offset.array;
                var colors = geometry.attributes.color.array;
                for (var f = 0; f < ages.length; f++) {
                    var fIdx = f * 3;
                    ages[f] += delta * (0.8 + this.amplitude * 0.25);
                    if (ages[f] > 1) {
                        ages[f] -= 1;
                        this._resetFireParticle(positions, speedYs, offsets, colors, f);
                    }
                    var age = ages[f];
                    var wobble = Math.sin(age * Math.PI * 4 + offsets[fIdx]) * this.radius * 0.05;
                    positions[fIdx] += (direction.x * 0.018 * this.radius + wobble * 0.08) * this.amplitude;
                    positions[fIdx + 1] += speedYs[f] * delta * (1.1 - age * 0.35);
                    positions[fIdx + 2] += (direction.z * 0.018 * this.radius + wobble * 0.08) * this.amplitude;
                    colors[fIdx] = 1;
                    colors[fIdx + 1] = Math.max(0.2, 0.96 - age * 0.65);
                    colors[fIdx + 2] = Math.max(0.05, 0.72 - age * 0.7);
                }
                geometry.attributes.color.needsUpdate = true;
                material.opacity = Math.max(0, 1 - progress * 0.88);
            } else if (item.type === 'smoke') {
                var angles = geometry.attributes.angle.array;
                var expandSpeeds = geometry.attributes.expandSpeed.array;
                var riseSpeeds = geometry.attributes.riseSpeed.array;
                var randoms = geometry.attributes.random.array;
                var typeFlags = geometry.attributes.typeFlag.array;
                var sizeSeeds = geometry.attributes.sizeSeed.array;
                var smokeEase = Math.min(1, progress * 1.15);
                for (var m = 0; m < angles.length; m++) {
                    var mIdx = m * 3;
                    var curl = Math.sin(progress * 8 + randoms[m] * 12) * this.radius * 0.055;
                    var spread = expandSpeeds[m] * smokeEase * (0.72 + sizeSeeds[m] * 0.24);
                    positions[mIdx] = Math.cos(angles[m]) * spread + direction.x * drift * (typeFlags[m] ? 0.46 : 0.72) + curl;
                    positions[mIdx + 1] = riseSpeeds[m] * smokeEase * (typeFlags[m] ? 0.42 : 0.92);
                    positions[mIdx + 2] = Math.sin(angles[m]) * spread + direction.z * drift * (typeFlags[m] ? 0.46 : 0.72) - curl;
                }
                material.opacity = Math.max(0, 0.48 * (1 - Math.max(0, progress - 0.28) / 0.72));
                material.size = Math.max(1.25, 3.8 * this.scaleUnit) * (0.8 + progress * 0.72);
            } else if (item.type === 'shockwave') {
                var waveAngles = geometry.attributes.angle.array;
                var waveSpeeds = geometry.attributes.speed.array;
                var waveEase = Math.min(1, progress * 1.7);
                for (var w = 0; w < waveAngles.length; w++) {
                    var wIdx = w * 3;
                    var waveRadius = waveSpeeds[w] * waveEase;
                    positions[wIdx] = Math.cos(waveAngles[w]) * waveRadius + direction.x * drift * 0.18;
                    positions[wIdx + 1] = 0.05;
                    positions[wIdx + 2] = Math.sin(waveAngles[w]) * waveRadius + direction.z * drift * 0.18;
                }
                material.opacity = Math.max(0, 0.86 * (1 - progress * 1.7));
            }

            geometry.attributes.position.needsUpdate = true;
        }

        if (progress >= 1) {
            this.isComplete = true;
            this.dispose();
            if (typeof this.onComplete === 'function') this.onComplete();
        }
    };

    BossExplosionAnimation.prototype.dispose = function() {
        if (!this.root) return;
        for (var i = 0; i < this.systems.length; i++) {
            disposeObject(this.systems[i].system);
        }
        if (this.root.parent) this.root.parent.remove(this.root);
        this.root = null;
        this.systems = [];
    };

    function CompactExplosionAnimation(scene, position, options) {
        options = options || {};
        BossExplosionAnimation.call(this, scene, position, {
            radius: options.radius || 2.2,
            duration: options.duration || 1.05,
            amplitude: options.amplitude || 0.55,
            directionAngle: options.directionAngle || 0,
            directionStrength: 0.16,
            quality: options.quality || 0.32,
            onComplete: options.onComplete
        });
        if (this.root) this.root.name = 'compact-explosion-animation';
    }
    CompactExplosionAnimation.prototype = Object.create(BossExplosionAnimation.prototype);
    CompactExplosionAnimation.prototype.constructor = CompactExplosionAnimation;

    function VoxelBossExplosionAnimation(scene, position, options) {
        var THREE = getThree();
        options = options || {};
        this.scene = scene;
        this.position = normalizePosition(position);
        this.radius = Math.max(2.8, options.radius || 6);
        this.duration = Math.max(1.4, options.duration || 2.85);
        this.directionAngle = Number.isFinite(options.directionAngle) ? options.directionAngle : 35;
        this.amplitude = Math.max(0.25, options.amplitude || 1);
        this.quality = Math.max(0.28, Math.min(options.quality || 0.58, 1));
        this.onComplete = options.onComplete;
        this.elapsedTime = 0;
        this.lastUpdateMs = null;
        this.isComplete = false;
        this.unit = this.radius / 6.5;

        this.root = new THREE.Group();
        this.root.name = 'voxel-boss-explosion-animation';
        this.root.position.copy(this.position);
        this.scene.add(this.root);

        this.coreMeshes = [];
        this.flashCubes = [];
        this.shockRings = [];
        this.firePuffs = [];
        this.debris = [];
        this.smokeBlocks = [];
        this.scorchBlocks = [];

        this._initFlash();
        this._initCore();
        this._initShockwaves();
        this._initFire();
        this._initDebris();
        this._initSmoke();
        this._initScorch();
    }

    VoxelBossExplosionAnimation.prototype._count = function(base) {
        return Math.max(8, Math.round(base * this.quality));
    };

    VoxelBossExplosionAnimation.prototype._cube = function(size, color) {
        var THREE = getThree();
        return new THREE.Mesh(new THREE.BoxGeometry(size, size, size), makeVoxelMaterial(color));
    };

    VoxelBossExplosionAnimation.prototype._flatCube = function(size, height, color) {
        var THREE = getThree();
        return new THREE.Mesh(new THREE.BoxGeometry(size, height, size), makeVoxelMaterial(color));
    };

    VoxelBossExplosionAnimation.prototype._makeCluster = function(config) {
        var THREE = getThree();
        var group = new THREE.Group();
        var geo = new THREE.BoxGeometry(config.cubeSize, config.cubeSize, config.cubeSize);
        var count = this._count(config.count);
        for (var i = 0; i < count; i++) {
            var cube = new THREE.Mesh(geo, makeVoxelMaterial(config.color));
            var theta = Math.random() * Math.PI * 2;
            var phi = Math.acos(2 * Math.random() - 1);
            var r = Math.cbrt(Math.random()) * config.spread;
            var x = Math.sin(phi) * Math.cos(theta) * r;
            var y = Math.cos(phi) * r;
            var z = Math.sin(phi) * Math.sin(theta) * r;
            cube.position.set(snap(x, config.cubeSize), snap(y, config.cubeSize), snap(z, config.cubeSize));
            cube.userData.local = cube.position.clone();
            cube.userData.scatter = randomUnitVector(0.25).multiplyScalar(randomRange(1.5, 4.5) * this.unit);
            cube.userData.spin = new THREE.Vector3(
                randomRange(-0.08, 0.08),
                randomRange(-0.08, 0.08),
                randomRange(-0.08, 0.08)
            );
            cube.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
            group.add(cube);
        }
        return group;
    };

    VoxelBossExplosionAnimation.prototype._initCore = function() {
        var layers = [
            { color: 0xffffff, delay: 0.00, formLife: 0.18, scatterStart: 0.16, scatterLife: 0.34, max: 1.25, count: 18, spread: 0.62, cubeSize: 0.145 },
            { color: 0xfff3a0, delay: 0.03, formLife: 0.22, scatterStart: 0.22, scatterLife: 0.42, max: 1.8, count: 28, spread: 1.05, cubeSize: 0.18 },
            { color: 0xffa32a, delay: 0.07, formLife: 0.28, scatterStart: 0.32, scatterLife: 0.54, max: 2.35, count: 40, spread: 1.5, cubeSize: 0.22 },
            { color: 0xff4a14, delay: 0.12, formLife: 0.34, scatterStart: 0.46, scatterLife: 0.68, max: 2.85, count: 48, spread: 2.0, cubeSize: 0.25 }
        ];
        for (var i = 0; i < layers.length; i++) {
            var layer = Object.assign({}, layers[i]);
            layer.cubeSize *= this.unit;
            layer.spread *= this.unit;
            var cluster = this._makeCluster(layer);
            cluster.position.y = this.radius * 0.28;
            cluster.scale.setScalar(0.001);
            this.root.add(cluster);
            this.coreMeshes.push(Object.assign({ mesh: cluster }, layers[i]));
        }
    };

    VoxelBossExplosionAnimation.prototype._initFlash = function() {
        var THREE = getThree();
        this.flashGroup = new THREE.Group();
        this.flashGroup.position.y = this.radius * 0.28;
        this.flashGroup.scale.setScalar(0.001);
        this.root.add(this.flashGroup);
        var count = this._count(36);
        for (var i = 0; i < count; i++) {
            var size = pick([0.08, 0.1, 0.12, 0.16]) * this.unit;
            var cube = this._cube(size, 0xffffff);
            var angle = Math.random() * Math.PI * 2;
            var y = randomRange(-0.5, 0.55) * this.unit;
            var r = randomRange(0.05, 0.9) * this.unit;
            cube.position.set(Math.cos(angle) * r, y, Math.sin(angle) * r);
            cube.userData.local = cube.position.clone();
            cube.userData.scatter = randomUnitVector(0.15).multiplyScalar(randomRange(3.5, 8.0) * this.unit);
            cube.userData.spin = new THREE.Vector3(
                randomRange(-0.14, 0.14),
                randomRange(-0.14, 0.14),
                randomRange(-0.14, 0.14)
            );
            this.flashGroup.add(cube);
            this.flashCubes.push(cube);
        }
    };

    VoxelBossExplosionAnimation.prototype._createVoxelRing = function(config) {
        var THREE = getThree();
        var group = new THREE.Group();
        var geo = new THREE.BoxGeometry(config.cubeSize, config.cubeSize, config.cubeSize);
        var pieces = this._count(config.pieces);
        for (var i = 0; i < pieces; i++) {
            var angle = (i / pieces) * Math.PI * 2;
            var cube = new THREE.Mesh(geo, makeVoxelMaterial(config.color));
            cube.userData.baseX = Math.cos(angle);
            cube.userData.baseZ = Math.sin(angle);
            cube.userData.seed = Math.random() * 100;
            cube.userData.scatterY = randomRange(0.0, 0.7) * this.unit;
            cube.position.set(cube.userData.baseX, 0, cube.userData.baseZ);
            cube.rotation.y = angle;
            group.add(cube);
        }
        return group;
    };

    VoxelBossExplosionAnimation.prototype._initShockwaves = function() {
        var configs = [
            { color: 0xffffff, pieces: 32, cubeSize: 0.09, delay: 0.00, life: 1.55, max: 2.15 },
            { color: 0xffd35a, pieces: 40, cubeSize: 0.13, delay: 0.04, life: 1.25, max: 1.55 },
            { color: 0xff6a1c, pieces: 46, cubeSize: 0.16, delay: 0.10, life: 1.75, max: 1.9 }
        ];
        for (var i = 0; i < configs.length; i++) {
            var cfg = Object.assign({}, configs[i], { cubeSize: configs[i].cubeSize * this.unit });
            var ring = this._createVoxelRing(cfg);
            ring.position.y = 0.12;
            ring.scale.setScalar(0.001);
            this.root.add(ring);
            this.shockRings.push({ mesh: ring, color: configs[i].color, delay: configs[i].delay, life: configs[i].life, max: configs[i].max * this.radius });
        }
    };

    VoxelBossExplosionAnimation.prototype._initFire = function() {
        this.fireGroup = new (getThree()).Group();
        this.root.add(this.fireGroup);
        var colors = [0xffffff, 0xfff06a, 0xffb12a, 0xff5a18, 0xd64512];
        var sizes = [0.055, 0.075, 0.1, 0.13, 0.17];
        var count = this._count(90);
        for (var i = 0; i < count; i++) {
            var cube = this._cube(pick(sizes) * this.unit, pick(colors));
            this.fireGroup.add(cube);
            this.firePuffs.push({
                cube: cube,
                angle: Math.random() * Math.PI * 2,
                radial: randomRange(1.5, 3.9) * this.radius,
                lift: randomRange(0.35, 1.8) * this.radius,
                delay: randomRange(0.02, 0.38),
                life: randomRange(1.25, 2.35),
                startY: randomRange(0.15, 0.4) * this.radius,
                lateralDrift: randomRange(-0.7, 0.7),
                spinX: randomRange(-0.1, 0.1),
                spinY: randomRange(-0.1, 0.1),
                spinZ: randomRange(-0.1, 0.1),
                baseScale: randomRange(0.75, 1.45),
                scatterDir: randomUnitVector(0.05).multiplyScalar(randomRange(0.35, 1.05) * this.radius)
            });
        }
    };

    VoxelBossExplosionAnimation.prototype._initDebris = function() {
        this.debrisGroup = new (getThree()).Group();
        this.root.add(this.debrisGroup);
        var colors = [0xffd75a, 0xff9a20, 0xb45c2c, 0x7d563d, 0x43342e];
        var sizes = [0.05, 0.07, 0.09, 0.12, 0.15];
        var count = this._count(80);
        for (var i = 0; i < count; i++) {
            var cube = this._cube(pick(sizes) * this.unit, pick(colors));
            this.debrisGroup.add(cube);
            this.debris.push({
                cube: cube,
                angle: Math.random() * Math.PI * 2,
                sideOffset: randomRange(-0.9, 0.9),
                speed: randomRange(0.9, 3.9) * this.radius,
                lift: randomRange(0.35, 1.6) * this.radius,
                delay: randomRange(0.04, 0.55),
                life: randomRange(0.9, 2.2),
                spinX: randomRange(-0.12, 0.12),
                spinY: randomRange(-0.12, 0.12),
                spinZ: randomRange(-0.12, 0.12)
            });
        }
    };

    VoxelBossExplosionAnimation.prototype._initSmoke = function() {
        var THREE = getThree();
        this.smokeGroup = new THREE.Group();
        this.root.add(this.smokeGroup);
        var colors = [0x302d2c, 0x3b352f, 0x4d433b, 0x65574d, 0x7a6b5e];
        var totalStem = this._count(45);
        var totalCap = this._count(60);
        var makeSmoke = function(owner, kind, index, total) {
            var size = (kind === 'stem' ? pick([0.12, 0.16, 0.2, 0.24]) : pick([0.16, 0.22, 0.3, 0.38])) * owner.unit;
            var mesh = owner._cube(size, pick(colors));
            owner.smokeGroup.add(mesh);
            var angle = Math.random() * Math.PI * 2;
            var layerT = index / Math.max(1, total - 1);
            var scatterAngle = angle + randomRange(-0.9, 0.9);
            var base = kind === 'stem'
                ? {
                    baseRadius: randomRange(0.04, 0.18) * owner.radius + layerT * 0.08 * owner.radius,
                    height: randomRange(0.12, 1.05) * owner.radius + layerT * 0.62 * owner.radius,
                    finalScale: randomRange(0.65, 1.15) + layerT * 0.32,
                    delay: randomRange(0.0, 0.1) + layerT * 0.025,
                    riseDrift: randomRange(0.85, 1.25),
                    scatterDir: new THREE.Vector3(Math.cos(scatterAngle) * randomRange(0.06, 0.18) * owner.radius, randomRange(0.16, 0.34) * owner.radius, Math.sin(scatterAngle) * randomRange(0.06, 0.18) * owner.radius)
                }
                : {
                    baseRadius: randomRange(0.24, 0.85) * owner.radius,
                    height: randomRange(1.12, 1.85) * owner.radius,
                    finalScale: randomRange(0.8, 1.55),
                    delay: randomRange(0.03, 0.18),
                    riseDrift: randomRange(0.85, 1.35),
                    scatterDir: new THREE.Vector3(Math.cos(scatterAngle) * randomRange(0.12, 0.32) * owner.radius, randomRange(0.16, 0.34) * owner.radius, Math.sin(scatterAngle) * randomRange(0.12, 0.32) * owner.radius)
                };
            owner.smokeBlocks.push(Object.assign(base, {
                mesh: mesh,
                kind: kind,
                angle: angle,
                layerT: layerT,
                swirl: randomRange(-0.85, 0.85)
            }));
        };
        for (var i = 0; i < totalStem; i++) makeSmoke(this, 'stem', i, totalStem);
        for (var c = 0; c < totalCap; c++) makeSmoke(this, 'cap', c, totalCap);
    };

    VoxelBossExplosionAnimation.prototype._initScorch = function() {
        this.scorchGroup = new (getThree()).Group();
        this.root.add(this.scorchGroup);
        var colors = [0x100d0b, 0x1d130e, 0x2a1a10, 0x3a2414];
        var count = this._count(30);
        for (var i = 0; i < count; i++) {
            var size = pick([0.22, 0.3, 0.4, 0.52]) * this.unit;
            var block = this._flatCube(size, 0.06 * this.unit, pick(colors));
            var angle = Math.random() * Math.PI * 2;
            var radius = Math.sqrt(Math.random()) * this.radius * 0.72;
            block.position.set(snap(Math.cos(angle) * radius, 0.18), 0.03, snap(Math.sin(angle) * radius, 0.18));
            block.rotation.y = Math.random() * Math.PI;
            this.scorchGroup.add(block);
            this.scorchBlocks.push(block);
        }
    };

    VoxelBossExplosionAnimation.prototype.update = function(timeMs) {
        if (this.isComplete) return;
        var now = Number.isFinite(timeMs) ? timeMs : performance.now();
        if (this.lastUpdateMs === null) this.lastUpdateMs = now;
        var delta = Math.min(0.05, Math.max(0.001, (now - this.lastUpdateMs) / 1000 || 1 / 60));
        this.lastUpdateMs = now;
        this.elapsedTime += delta;
        var t = this.elapsedTime;
        var direction = getHorizontalDirection(this.directionAngle);
        var directionScale = this.amplitude;

        var growP = clamp01(t / 0.18);
        var scatterP = clamp01((t - 0.12) / 0.34);
        var grow = easeOutExpo(growP);
        var scatter = easeOutCubic(scatterP);
        this.flashGroup.visible = t < 0.55;
        this.flashGroup.scale.setScalar(0.001 + grow * 3.2);
        this.flashCubes.forEach(function(cube) {
            var base = cube.userData.local;
            var move = cube.userData.scatter;
            cube.position.set(base.x + move.x * scatter, base.y + move.y * scatter, base.z + move.z * scatter);
            cube.rotation.x += cube.userData.spin.x;
            cube.rotation.y += cube.userData.spin.y;
            cube.rotation.z += cube.userData.spin.z;
            cube.scale.setScalar(Math.max(0.25, 1 - scatterP * 0.55));
        });

        this.coreMeshes.forEach(function(layer) {
            var layerGrowP = clamp01((t - layer.delay) / layer.formLife);
            var layerScatterP = clamp01((t - layer.scatterStart) / layer.scatterLife);
            var layerGrow = easeOutExpo(layerGrowP);
            var layerScatter = easeOutCubic(layerScatterP);
            layer.mesh.visible = layerGrowP > 0 && layerScatterP < 1;
            layer.mesh.scale.setScalar(0.001 + layerGrow * layer.max);
            layer.mesh.children.forEach(function(cube) {
                var base = cube.userData.local;
                var move = cube.userData.scatter;
                cube.position.set(
                    base.x + move.x * layerScatter + direction.x * layerScatter * directionScale * 0.12,
                    base.y + move.y * layerScatter,
                    base.z + move.z * layerScatter + direction.z * layerScatter * directionScale * 0.12
                );
                cube.rotation.x += cube.userData.spin.x;
                cube.rotation.y += cube.userData.spin.y;
                cube.rotation.z += cube.userData.spin.z;
                cube.scale.setScalar(Math.max(0.32, 1 - layerScatterP * 0.5));
            });
        });

        this.shockRings.forEach(function(ring) {
            var p = clamp01((t - ring.delay) / ring.life);
            var breakP = clamp01((t - ring.delay - ring.life * 0.52) / (ring.life * 0.48));
            var radius = 0.15 + easeOutCubic(p) * ring.max;
            ring.mesh.visible = p > 0 && breakP < 1;
            ring.mesh.scale.set(radius, 1, radius);
            ring.mesh.children.forEach(function(cube, i) {
                var ripple = 1 + Math.sin(i * 1.7 + t * 16 + cube.userData.seed) * 0.055;
                cube.position.x = cube.userData.baseX * ripple;
                cube.position.z = cube.userData.baseZ * ripple;
                cube.position.y = cube.userData.scatterY * easeOutCubic(breakP);
                cube.scale.y = 0.45 + p * 1.35;
                cube.scale.x = Math.max(0.35, 1 - breakP * 0.45);
                cube.scale.z = Math.max(0.35, 1 - breakP * 0.45);
            });
        });

        this.firePuffs.forEach(function(f) {
            var p = clamp01((t - f.delay) / f.life);
            var breakP = clamp01((t - f.delay - f.life * 0.48) / (f.life * 0.52));
            var r = easeOutCubic(p) * f.radial;
            var angle = f.angle + f.lateralDrift * p;
            var y = f.startY + Math.sin(p * Math.PI) * f.lift + p * this.radius * 0.32;
            var fireScatter = easeOutCubic(breakP);
            f.cube.visible = p > 0 && breakP < 1;
            f.cube.position.set(
                snap(Math.cos(angle) * r + f.scatterDir.x * fireScatter + direction.x * this.radius * 0.16 * p * directionScale, 0.08),
                snap(Math.max(0.12, y + f.scatterDir.y * fireScatter), 0.08),
                snap(Math.sin(angle) * r + f.scatterDir.z * fireScatter + direction.z * this.radius * 0.16 * p * directionScale, 0.08)
            );
            f.cube.scale.setScalar(Math.max(0.06, f.baseScale * (0.65 + Math.sin(p * Math.PI) * 1.2) * Math.max(0.22, 1 - breakP * 0.62)));
            f.cube.rotation.x += f.spinX;
            f.cube.rotation.y += f.spinY;
            f.cube.rotation.z += f.spinZ;
        }, this);

        this.debris.forEach(function(d) {
            var p = clamp01((t - d.delay) / d.life);
            var r = easeOutCubic(p) * d.speed;
            var y = this.radius * 0.1 + Math.sin(p * Math.PI) * d.lift - p * p * this.radius * 0.95;
            var spreadAngle = d.angle + d.sideOffset * p;
            d.cube.visible = p > 0 && p < 1 && y > 0;
            d.cube.position.set(
                snap(Math.cos(spreadAngle) * r + direction.x * this.radius * 0.12 * p * directionScale, 0.08),
                snap(Math.max(0.08, y), 0.08),
                snap(Math.sin(spreadAngle) * r + direction.z * this.radius * 0.12 * p * directionScale, 0.08)
            );
            d.cube.rotation.x += d.spinX;
            d.cube.rotation.y += d.spinY;
            d.cube.rotation.z += d.spinZ;
        }, this);

        this.smokeBlocks.forEach(function(s) {
            var formP = clamp01((t - s.delay) / 0.9);
            var form = easeInOutSine(formP);
            var riseP = clamp01((t - 0.55) / 3.2);
            var rise = easeOutCubic(riseP);
            var loosenP = clamp01((t - 0.95) / 1.35);
            var loosen = easeInOutSine(loosenP);
            var burstP = clamp01((t - 1.75) / 2.2);
            var burst = easeOutCubic(burstP);
            s.mesh.visible = formP > 0 && burstP < 1;
            var radius;
            var y;
            var verticalScale;
            var horizontalScale;
            if (s.kind === 'stem') {
                radius = (s.baseRadius + Math.sin(form * Math.PI) * this.radius * 0.04) * (1 - loosen * 0.18);
                y = form * s.height * 1.05 + rise * this.radius * 0.78 * s.riseDrift;
                verticalScale = 1 + rise * 0.26;
                horizontalScale = 1 - loosen * 0.14;
            } else {
                radius = (s.baseRadius * form + Math.sin(form * Math.PI) * this.radius * 0.16) * (1 - loosen * 0.14);
                y = s.height * form + Math.sin(form * Math.PI) * this.radius * 0.18 + rise * this.radius * 0.82 * s.riseDrift;
                verticalScale = 1 + rise * 0.18;
                horizontalScale = 1 + Math.sin(form * Math.PI) * 0.06 - loosen * 0.1;
            }
            var swirlAngle = s.angle + form * s.swirl * 0.8 + rise * 0.16;
            var x = Math.cos(swirlAngle) * radius + s.scatterDir.x * loosen * 1.1 + s.scatterDir.x * burst * 2.2 + direction.x * this.radius * 0.22 * rise * directionScale;
            var z = Math.sin(swirlAngle) * radius + s.scatterDir.z * loosen * 1.1 + s.scatterDir.z * burst * 2.2 + direction.z * this.radius * 0.22 * rise * directionScale;
            y += s.scatterDir.y * loosen * 0.95 + s.scatterDir.y * burst * 2.4;
            s.mesh.position.set(snap(x, 0.12), snap(y, 0.12), snap(z, 0.12));
            var baseScale = s.finalScale * (0.22 + form);
            var particleScale = Math.max(0.05, 1 - loosen * 0.24 - burst * 0.74);
            s.mesh.scale.set(
                Math.max(0.028, baseScale * horizontalScale * particleScale),
                Math.max(0.034, baseScale * verticalScale * particleScale),
                Math.max(0.028, baseScale * horizontalScale * particleScale)
            );
            s.mesh.rotation.x += loosen * 0.006 + burst * 0.014;
            s.mesh.rotation.y += 0.004 + rise * 0.004 + burst * 0.018;
            s.mesh.rotation.z += loosen * 0.005 + burst * 0.012;
        }, this);

        this.scorchBlocks.forEach(function(block) {
            var p = clamp01(t / 0.7);
            block.visible = p > 0.1;
            block.scale.y = 0.15 + p * 0.85;
        });

        if (t >= this.duration) {
            this.isComplete = true;
            this.dispose();
            if (typeof this.onComplete === 'function') this.onComplete();
        }
    };

    VoxelBossExplosionAnimation.prototype.dispose = function() {
        if (!this.root) return;
        disposeTree(this.root);
        if (this.root.parent) this.root.parent.remove(this.root);
        this.root = null;
    };

    function createBossExplosionAnimation(scene, position, bossSize, options) {
        options = options || {};
        var radius = options.radius || Math.max(2.8, Math.min(12, bossSize * 0.52));
        return new VoxelBossExplosionAnimation(scene, position, Object.assign({}, options, { radius: radius }));
    }

    var registry = [
        {
            id: 'boss-explosion',
            name: 'Voxel Boss Explosion',
            description: 'Voxel fireball, shockwave, debris, scorch, and mushroom-cloud blast for boss death.',
            defaults: { radius: 6.5, duration: 2.85, amplitude: 1, directionAngle: 35 },
            create: function(scene, position, options) {
                return new VoxelBossExplosionAnimation(scene, position, options || {});
            }
        },
        {
            id: 'compact-explosion',
            name: 'Compact Blast',
            description: 'Small reusable blast preview for lighter battle events.',
            defaults: { radius: 2.2, duration: 1.05, amplitude: 0.55, directionAngle: 0 },
            create: function(scene, position, options) {
                return new CompactExplosionAnimation(scene, position, options || {});
            }
        }
    ];

    global.BossExplosionAnimation = BossExplosionAnimation;
    global.VoxelBossExplosionAnimation = VoxelBossExplosionAnimation;
    global.CompactExplosionAnimation = CompactExplosionAnimation;
    global.createBossExplosionAnimation = createBossExplosionAnimation;
    global.ANIMATION_ASSET_REGISTRY = registry;
})(window);
