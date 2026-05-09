// Prism3D Scene Export - Three.js Code
// Generated on 2026/5/9 12:31:32

function createImportedChopperModel(THREE) {
  const group = new THREE.Group();

  // Js_object 4 (js_object)
  const mesh_bf7f6e70_f0ab_48ff_b9fb_f39339354530 = (() => {
    // Direct import version for tools that execute the file body and expect `return meshOrGroup;`
    const heliGroup = new THREE.Group();
    
            const matBody = new THREE.MeshPhongMaterial({
                color: 0x101018,
                emissive: 0x160014,
                emissiveIntensity: 0.42,
                flatShading: true
            });
            const matBodyDark = new THREE.MeshPhongMaterial({
                color: 0x050507,
                emissive: 0x080005,
                emissiveIntensity: 0.18,
                flatShading: true
            });
            const matArmor = new THREE.MeshPhongMaterial({
                color: 0x262634,
                emissive: 0x120010,
                emissiveIntensity: 0.28,
                flatShading: true
            });
            const matGlass = new THREE.MeshPhongMaterial({
                color: 0xff4fd8,
                emissive: 0xff2fb8,
                emissiveIntensity: 0.38,
                transparent: true,
                opacity: 0.72,
                shininess: 70
            });
            const matRotor = new THREE.MeshPhongMaterial({ color: 0x050507 });
            const matGun = new THREE.MeshPhongMaterial({
                color: 0x262634,
                emissive: 0x120010,
                emissiveIntensity: 0.22,
                specular: 0x666666,
                shininess: 55
            });
            const matPinkGlow = new THREE.MeshBasicMaterial({ color: 0xff4fd8 });
    
            const body = new THREE.Mesh(new THREE.CylinderGeometry(0.58, 0.68, 1.95, 6), matBody);
            body.rotation.set(Math.PI / 2, 0, 0);
            body.scale.set(1.55, 0.86, 1.0);
            body.position.y = 2.48;
            heliGroup.add(body);
    
            const coreFrame = new THREE.Mesh(new THREE.CylinderGeometry(0.58, 0.66, 0.08, 6), matArmor);
            coreFrame.rotation.x = Math.PI / 2;
            coreFrame.position.set(0, 2.54, 0.1);
            heliGroup.add(coreFrame);
    
            const embeddedCore = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.54, 0.13, 6), matPinkGlow);
            embeddedCore.rotation.x = Math.PI / 2;
            embeddedCore.position.set(0, 2.56, 0.1);
            heliGroup.add(embeddedCore);
    
            const tailWedgeGeo = new THREE.BufferGeometry();
            tailWedgeGeo.setAttribute('position', new THREE.Float32BufferAttribute([
                -0.58, 0.00, -0.16,   0.58, 0.00, -0.16,  -0.36, 0.00, 0.34,   0.36, 0.00, 0.34,
                -0.34, 0.38, -0.10,   0.34, 0.38, -0.10,  -0.16, 0.12, 0.28,   0.16, 0.12, 0.28
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
            const tailWedge = new THREE.Mesh(tailWedgeGeo, matArmor);
            tailWedge.position.set(0, 2.42, -0.96);
            tailWedge.rotation.x = Math.PI;
            heliGroup.add(tailWedge);
    
            const noseGeo = new THREE.BufferGeometry();
            noseGeo.setAttribute('position', new THREE.Float32BufferAttribute([
                -0.62, 2.15, 0.80,   0.62, 2.15, 0.80,  -0.46, 2.16, 1.48,   0.46, 2.16, 1.48,
                -0.62, 2.78, 0.80,   0.62, 2.78, 0.80,  -0.36, 2.45, 1.48,   0.36, 2.45, 1.48
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
            const nose = new THREE.Mesh(noseGeo, matBody);
            heliGroup.add(nose);
    
            const cockpit = new THREE.Mesh(new THREE.BoxGeometry(0.86, 0.28, 0.42), matGlass);
            cockpit.position.set(0, 2.58, 1.23);
            cockpit.rotation.x = -0.22;
            heliGroup.add(cockpit);
    
            [-1, 1].forEach((side) => {
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
                const mount = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.16, 0.28), matArmor);
                mount.position.z = -0.06;
    
                const cannon = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.07, 0.84, 12), matGun);
                cannon.rotation.x = Math.PI / 2;
                cannon.position.z = 0.36;
    
                const cannonMuzzle = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.06, 0.16, 12), matPinkGlow);
                cannonMuzzle.rotation.x = Math.PI / 2;
                cannonMuzzle.position.z = 0.86;
    
                cannonGroup.add(mount, cannon, cannonMuzzle);
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
            const tailBlade1 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.64, 0.03), matRotor);
            const tailBlade2 = new THREE.Mesh(new THREE.BoxGeometry(0.64, 0.08, 0.03), matRotor);
            tailRotorGroup.add(tailBlade1, tailBlade2);
            heliGroup.add(tailRotorGroup);
    
            const mainRotorGroup = new THREE.Group();
            const rotorHub = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.2), matBodyDark);
            rotorHub.position.y = 3.4;
            mainRotorGroup.add(rotorHub);
    
            const rotorBlade1 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.02, 3.5), matRotor);
            rotorBlade1.position.y = 3.5;
            mainRotorGroup.add(rotorBlade1);
    
            const rotorBlade2 = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.02, 0.1), matRotor);
            rotorBlade2.position.y = 3.5;
            mainRotorGroup.add(rotorBlade2);
            heliGroup.add(mainRotorGroup);
    
            const legMat = new THREE.MeshPhongMaterial({ color: 0x555555 });
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
    heliGroup.userData.mainRotor = mainRotorGroup;
    heliGroup.userData.tailRotor = tailRotorGroup;
    return heliGroup;
    
    
  })();
  if (mesh_bf7f6e70_f0ab_48ff_b9fb_f39339354530) {
    mesh_bf7f6e70_f0ab_48ff_b9fb_f39339354530.position.set(0, 0, 0);
    mesh_bf7f6e70_f0ab_48ff_b9fb_f39339354530.rotation.set(0, 0, 0);
    mesh_bf7f6e70_f0ab_48ff_b9fb_f39339354530.scale.set(1, 1, 1);
    group.add(mesh_bf7f6e70_f0ab_48ff_b9fb_f39339354530);
  }

  // Polygon 3 (polygon)
  const material_0543831b_f81d_4c36_9dce_ba40d1347a1a = new THREE.MeshStandardMaterial({ color: '#02020d' });
  const geometry_0543831b_f81d_4c36_9dce_ba40d1347a1a = new THREE.CylinderGeometry(0.5, 0.5, 0.1, 6);
  const mesh_0543831b_f81d_4c36_9dce_ba40d1347a1a = new THREE.Mesh(geometry_0543831b_f81d_4c36_9dce_ba40d1347a1a, material_0543831b_f81d_4c36_9dce_ba40d1347a1a);
  if (mesh_0543831b_f81d_4c36_9dce_ba40d1347a1a) {
    mesh_0543831b_f81d_4c36_9dce_ba40d1347a1a.position.set(0, 2.5590910564200193, -1.0124376404016748);
    mesh_0543831b_f81d_4c36_9dce_ba40d1347a1a.rotation.set(1.1693705988362006, 1.5707963267948966, 1.5707963267948966);
    mesh_0543831b_f81d_4c36_9dce_ba40d1347a1a.scale.set(1.4, 1.1, 5);
    group.add(mesh_0543831b_f81d_4c36_9dce_ba40d1347a1a);
  }

  // Polygon 3 (Copy) (polygon)
  const material_0ffb5649_551d_4bb7_bc22_4187e7032d8a = new THREE.MeshStandardMaterial({ color: '#02020d' });
  const geometry_0ffb5649_551d_4bb7_bc22_4187e7032d8a = new THREE.CylinderGeometry(0.5, 0.5, 0.1, 6);
  const mesh_0ffb5649_551d_4bb7_bc22_4187e7032d8a = new THREE.Mesh(geometry_0ffb5649_551d_4bb7_bc22_4187e7032d8a, material_0ffb5649_551d_4bb7_bc22_4187e7032d8a);
  if (mesh_0ffb5649_551d_4bb7_bc22_4187e7032d8a) {
    mesh_0ffb5649_551d_4bb7_bc22_4187e7032d8a.position.set(0, 2.4239367535271175, -1.6654861512573158);
    mesh_0ffb5649_551d_4bb7_bc22_4187e7032d8a.rotation.set(1.5707963267948966, 1.5707963267948966, 1.5707963267948966);
    mesh_0ffb5649_551d_4bb7_bc22_4187e7032d8a.scale.set(2.5, 0.5, 1.8);
    group.add(mesh_0ffb5649_551d_4bb7_bc22_4187e7032d8a);
  }

  // Polygon 3 (Copy) (polygon)
  const material_44379e67_d900_4a8b_bba6_b2d226a7e1b6 = new THREE.MeshStandardMaterial({ color: '#02020d' });
  const geometry_44379e67_d900_4a8b_bba6_b2d226a7e1b6 = new THREE.CylinderGeometry(0.5, 0.5, 0.1, 6);
  const mesh_44379e67_d900_4a8b_bba6_b2d226a7e1b6 = new THREE.Mesh(geometry_44379e67_d900_4a8b_bba6_b2d226a7e1b6, material_44379e67_d900_4a8b_bba6_b2d226a7e1b6);
  if (mesh_44379e67_d900_4a8b_bba6_b2d226a7e1b6) {
    mesh_44379e67_d900_4a8b_bba6_b2d226a7e1b6.position.set(0, 2.862326201556286, -0.18466102278956498);
    mesh_44379e67_d900_4a8b_bba6_b2d226a7e1b6.rotation.set(1.1693705988362006, 1.5707963267948966, 1.5707963267948966);
    mesh_44379e67_d900_4a8b_bba6_b2d226a7e1b6.scale.set(1.4, 0.8, 2.3);
    group.add(mesh_44379e67_d900_4a8b_bba6_b2d226a7e1b6);
  }

  return group;
}

// Usage:
// const myScene = createImportedChopperModel(THREE);
// scene.add(myScene);
