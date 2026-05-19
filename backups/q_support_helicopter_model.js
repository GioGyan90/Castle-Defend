(function(root) {
    'use strict';

    function requireThree(THREERef) {
        const THREE = THREERef || root.THREE;
        if (!THREE) throw new Error('THREE is required to create the Q support helicopter model.');
        return THREE;
    }

    function createQSupportHelicopterModel(THREERef) {
        const THREE = requireThree(THREERef);
        const heliGroup = new THREE.Group();

        const matBody = new THREE.MeshPhongMaterial({
            color: 0x1e7fe8,
            emissive: 0x083e8a,
            emissiveIntensity: 0.24,
            flatShading: true
        });
        const matBodyWhite = new THREE.MeshPhongMaterial({
            color: 0xf7fcff,
            emissive: 0x6bcfff,
            emissiveIntensity: 0.12,
            flatShading: true
        });
        const matBodyDark = new THREE.MeshPhongMaterial({
            color: 0x0c2f58,
            emissive: 0x03142b,
            emissiveIntensity: 0.16,
            flatShading: true
        });
        const matGlass = new THREE.MeshPhongMaterial({
            color: 0x96eaff,
            emissive: 0x2ec8ff,
            emissiveIntensity: 0.42,
            transparent: true,
            opacity: 0.72,
            shininess: 70
        });
        const matRotor = new THREE.MeshPhongMaterial({ color: 0x0c2f58 });
        const matGun = new THREE.MeshPhongMaterial({
            color: 0x143c67,
            emissive: 0x083e8a,
            emissiveIntensity: 0.22,
            specular: 0x666666,
            shininess: 55
        });
        const matCyanGlow = new THREE.MeshBasicMaterial({ color: 0x96eaff });

        const body = new THREE.Mesh(new THREE.CylinderGeometry(0.58, 0.68, 1.95, 6), matBody);
        body.rotation.set(Math.PI / 2, 0, 0);
        body.scale.set(1.55, 0.86, 1);
        body.position.y = 2.48;
        heliGroup.add(body);

        const coreFrame = new THREE.Mesh(new THREE.CylinderGeometry(0.58, 0.66, 0.08, 6), matBodyWhite);
        coreFrame.rotation.x = Math.PI / 2;
        coreFrame.position.set(0, 2.54, 0.1);
        heliGroup.add(coreFrame);

        const embeddedCore = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.54, 0.13, 6), matCyanGlow);
        embeddedCore.rotation.x = Math.PI / 2;
        embeddedCore.position.set(0, 2.56, 0.1);
        heliGroup.add(embeddedCore);

        const tailWedgeGeo = new THREE.BufferGeometry();
        tailWedgeGeo.setAttribute('position', new THREE.Float32BufferAttribute([
            -0.58, 0.00, -0.16, 0.58, 0.00, -0.16, -0.36, 0.00, 0.34, 0.36, 0.00, 0.34,
            -0.34, 0.38, -0.10, 0.34, 0.38, -0.10, -0.16, 0.12, 0.28, 0.16, 0.12, 0.28
        ], 3));
        tailWedgeGeo.setIndex([
            0, 2, 3, 0, 3, 1,
            4, 5, 7, 4, 7, 6,
            0, 1, 5, 0, 5, 4,
            2, 6, 7, 2, 7, 3,
            0, 4, 6, 0, 6, 2,
            1, 3, 7, 1, 7, 5
        ]);
        tailWedgeGeo.computeVertexNormals();
        const tailWedge = new THREE.Mesh(tailWedgeGeo, matBodyWhite);
        tailWedge.position.set(0, 2.42, -0.96);
        tailWedge.rotation.x = Math.PI;
        heliGroup.add(tailWedge);

        const noseGeo = new THREE.BufferGeometry();
        noseGeo.setAttribute('position', new THREE.Float32BufferAttribute([
            -0.62, 2.15, 0.80, 0.62, 2.15, 0.80, -0.46, 2.16, 1.48, 0.46, 2.16, 1.48,
            -0.62, 2.78, 0.80, 0.62, 2.78, 0.80, -0.36, 2.45, 1.48, 0.36, 2.45, 1.48
        ], 3));
        noseGeo.setIndex([
            0, 2, 3, 0, 3, 1,
            4, 5, 7, 4, 7, 6,
            0, 1, 5, 0, 5, 4,
            2, 6, 7, 2, 7, 3,
            0, 4, 6, 0, 6, 2,
            1, 3, 7, 1, 7, 5
        ]);
        noseGeo.computeVertexNormals();
        heliGroup.add(new THREE.Mesh(noseGeo, matBody));

        const cockpit = new THREE.Mesh(new THREE.BoxGeometry(0.86, 0.28, 0.42), matGlass);
        cockpit.position.set(0, 2.58, 1.23);
        cockpit.rotation.x = -0.22;
        heliGroup.add(cockpit);

        [-1, 1].forEach(side => {
            const x = side * 0.79;
            const sideWindow = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.3, 0.46), matGlass);
            sideWindow.position.set(x, 2.58, 0.16);
            sideWindow.rotation.z = side > 0 ? -0.04 : 0.04;
            heliGroup.add(sideWindow);

            const rearWindow = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.26, 0.36), matGlass);
            rearWindow.position.set(x, 2.56, -0.48);
            heliGroup.add(rearWindow);

            const tailSideWindow = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.24, 0.34), matGlass);
            tailSideWindow.position.set(side * 0.93, 2.44, -1.08);
            tailSideWindow.rotation.z = side > 0 ? -0.08 : 0.08;
            heliGroup.add(tailSideWindow);

            const cannonGroup = new THREE.Group();
            const mount = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.16, 0.28), matBodyWhite);
            mount.position.z = -0.06;
            const cannon = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.07, 0.84, 12), matGun);
            cannon.rotation.x = Math.PI / 2;
            cannon.position.z = 0.36;
            const muzzle = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.06, 0.16, 12), matCyanGlow);
            muzzle.rotation.x = Math.PI / 2;
            muzzle.position.z = 0.86;
            cannonGroup.add(mount, cannon, muzzle);
            cannonGroup.position.set(side * 0.92, 2.36, 0.82);
            heliGroup.add(cannonGroup);
        });

        const tailBoom = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.2, 2), matBody);
        tailBoom.rotation.x = Math.PI / 2;
        tailBoom.position.set(0, 2.42, -2.08);
        heliGroup.add(tailBoom);

        const tailFin = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.62, 0.42), matBodyDark);
        tailFin.position.set(0, 2.8, -3);
        heliGroup.add(tailFin);

        const tailRotorGroup = new THREE.Group();
        tailRotorGroup.position.set(0.08, 2.82, -3.24);
        const tailHub = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.08, 10), matGun);
        tailHub.rotation.x = Math.PI / 2;
        tailRotorGroup.add(tailHub);
        tailRotorGroup.add(new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.64, 0.03), matRotor));
        tailRotorGroup.add(new THREE.Mesh(new THREE.BoxGeometry(0.64, 0.08, 0.03), matRotor));
        heliGroup.add(tailRotorGroup);

        const mainRotorGroup = new THREE.Group();
        const rotorHub = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.2), matBodyDark);
        rotorHub.position.y = 3.4;
        mainRotorGroup.add(rotorHub);
        const rotorBlade1 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.02, 3.5), matRotor);
        rotorBlade1.position.y = 3.5;
        const rotorBlade2 = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.02, 0.1), matRotor);
        rotorBlade2.position.y = 3.5;
        mainRotorGroup.add(rotorBlade1, rotorBlade2);
        heliGroup.add(mainRotorGroup);

        const legMat = new THREE.MeshPhongMaterial({ color: 0xcdefff });
        const createLeg = (x, z) => {
            const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.62, 8), legMat);
            leg.position.set(x, 1.9, z);
            return leg;
        };
        const skidLeft = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.9, 8), legMat);
        skidLeft.rotation.x = Math.PI / 2;
        skidLeft.position.set(-0.56, 1.57, 0);
        const skidRight = skidLeft.clone();
        skidRight.position.x = 0.56;
        heliGroup.add(
            createLeg(-0.56, 0.72),
            createLeg(0.56, 0.72),
            createLeg(-0.56, -0.72),
            createLeg(0.56, -0.72),
            skidLeft,
            skidRight
        );

        const turretGroup = new THREE.Group();
        turretGroup.position.set(0, 2.3, 0.8);
        const barrelGroup = new THREE.Group();
        turretGroup.add(barrelGroup);
        heliGroup.add(turretGroup);

        heliGroup.scale.setScalar(0.5);
        heliGroup.rotation.y = Math.PI / 2;
        heliGroup.userData = {
            qSupport: true,
            mainRotor: mainRotorGroup,
            tailRotor: tailRotorGroup,
            turretGroup,
            barrelGroup,
            barrelBaseZ: 0,
            hasPhysics: false
        };

        return heliGroup;
    }

    root.createQSupportHelicopterModel = createQSupportHelicopterModel;

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = createQSupportHelicopterModel;
    }
})(typeof window !== 'undefined' ? window : globalThis);
