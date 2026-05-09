// Castle model construction.
function createCastleModel(THREE) {
    const castle = new THREE.Group();

    const mainTowerMat = new THREE.MeshPhongMaterial({ color: 0x2c3e50, emissive: 0x1a252f, emissiveIntensity: 0.2 });
    const towerTopMat = new THREE.MeshPhongMaterial({ color: 0x34495e, emissive: 0x2c3e50, emissiveIntensity: 0.3 });
    const wallMat = new THREE.MeshPhongMaterial({ color: 0x34495e, emissive: 0x1a252f, emissiveIntensity: 0.1 });
    const gateMat = new THREE.MeshPhongMaterial({ color: 0x1a1a2e, emissive: 0x0f0f1a, emissiveIntensity: 0.2 });
    const accentMat = new THREE.MeshPhongMaterial({ color: 0x00d2d3, emissive: 0x00d2d3, emissiveIntensity: 0.5 });
    const floorMat = new THREE.MeshPhongMaterial({ color: 0x2c3e50, emissive: 0x1a252f, emissiveIntensity: 0.1 });

    const mainTower = new THREE.Group();
    const mainTowerBody = new THREE.Mesh(
        new THREE.BoxGeometry(3, 8, 3),
        mainTowerMat
    );
    mainTowerBody.position.y = 4;
    mainTower.add(mainTowerBody);

    const mainTowerRoof = new THREE.Mesh(
        new THREE.ConeGeometry(2.5, 3, 4),
        towerTopMat
    );
    mainTowerRoof.position.y = 9.5;
    mainTowerRoof.rotation.y = Math.PI / 4;
    mainTower.add(mainTowerRoof);

    const towerLightStrip1 = new THREE.Mesh(
        new THREE.BoxGeometry(3.2, 0.1, 3.2),
        accentMat
    );
    towerLightStrip1.position.y = 7.5;
    mainTower.add(towerLightStrip1);

    const towerLightStrip2 = new THREE.Mesh(
        new THREE.BoxGeometry(3.1, 0.1, 3.1),
        accentMat
    );
    towerLightStrip2.position.y = 5;
    mainTower.add(towerLightStrip2);

    const windowGeo = new THREE.BoxGeometry(0.4, 0.6, 0.1);
    const windowMat = new THREE.MeshBasicMaterial({ color: 0x00ffff });
    for (let i = 0; i < 2; i++) {
        const win1 = new THREE.Mesh(windowGeo, windowMat);
        win1.position.set(-0.8, 6, 1.5);
        mainTower.add(win1);
        const win2 = win1.clone();
        win2.position.set(0.8, 6, 1.5);
        mainTower.add(win2);
        const win3 = win1.clone();
        win3.position.set(0, 3, 1.5);
        mainTower.add(win3);
    }

    castle.add(mainTower);

    const turretPositions = [
        { x: -4, z: -2 },
        { x: 4, z: -2 },
        { x: -4, z: 2 },
        { x: 4, z: 2 }
    ];

    turretPositions.forEach(pos => {
        const turret = new THREE.Group();
        const turretBase = new THREE.Mesh(
            new THREE.CylinderGeometry(0.8, 1, 4, 8),
            wallMat
        );
        turretBase.position.y = 2;
        turret.add(turretBase);

        const turretRoof = new THREE.Mesh(
            new THREE.ConeGeometry(1.2, 2, 8),
            towerTopMat
        );
        turretRoof.position.y = 5;
        turret.add(turretRoof);

        const turretLight = new THREE.Mesh(
            new THREE.TorusGeometry(1.1, 0.08, 8, 16),
            accentMat
        );
        turretLight.rotation.x = Math.PI / 2;
        turretLight.position.y = 3.8;
        turret.add(turretLight);

        turret.position.set(pos.x, 0, pos.z);
        castle.add(turret);
    });

    const frontWallLeft = new THREE.Mesh(
        new THREE.BoxGeometry(3.5, 3, 0.8),
        wallMat
    );
    frontWallLeft.position.set(-2.25, 1.5, -4);
    castle.add(frontWallLeft);

    const frontWallRight = new THREE.Mesh(
        new THREE.BoxGeometry(3.5, 3, 0.8),
        wallMat
    );
    frontWallRight.position.set(2.25, 1.5, -4);
    castle.add(frontWallRight);

    const backWall = new THREE.Mesh(
        new THREE.BoxGeometry(9, 3, 0.8),
        wallMat
    );
    backWall.position.set(0, 1.5, 4);
    castle.add(backWall);

    const leftWall = new THREE.Mesh(
        new THREE.BoxGeometry(0.8, 3, 6),
        wallMat
    );
    leftWall.position.set(-5, 1.5, 0);
    castle.add(leftWall);

    const rightWall = new THREE.Mesh(
        new THREE.BoxGeometry(0.8, 3, 6),
        wallMat
    );
    rightWall.position.set(5, 1.5, 0);
    castle.add(rightWall);

    const wallTopMat = new THREE.MeshBasicMaterial({ color: 0x00d2d3 });
    const frontWallTopL = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.1, 0.9), wallTopMat);
    frontWallTopL.position.set(-2.25, 3, -4);
    castle.add(frontWallTopL);

    const frontWallTopR = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.1, 0.9), wallTopMat);
    frontWallTopR.position.set(2.25, 3, -4);
    castle.add(frontWallTopR);

    const backWallTop = new THREE.Mesh(new THREE.BoxGeometry(9, 0.1, 0.9), wallTopMat);
    backWallTop.position.set(0, 3, 4);
    castle.add(backWallTop);

    const leftWallTop = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.1, 6), wallTopMat);
    leftWallTop.position.set(-5, 3, 0);
    castle.add(leftWallTop);

    const rightWallTop = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.1, 6), wallTopMat);
    rightWallTop.position.set(5, 3, 0);
    castle.add(rightWallTop);

    const gateLeft = new THREE.Mesh(
        new THREE.BoxGeometry(1.5, 2.5, 0.3),
        gateMat
    );
    gateLeft.position.set(-1, 1.25, -3.5);
    castle.add(gateLeft);

    const gateRight = new THREE.Mesh(
        new THREE.BoxGeometry(1.5, 2.5, 0.3),
        gateMat
    );
    gateRight.position.set(1, 1.25, -3.5);
    castle.add(gateRight);

    const gateArch = new THREE.Mesh(
        new THREE.TorusGeometry(1.8, 0.2, 8, 16, Math.PI),
        wallMat
    );
    gateArch.position.set(0, 2.5, -3.5);
    gateArch.rotation.x = Math.PI / 2;
    castle.add(gateArch);

    const gateLight = new THREE.Mesh(
        new THREE.BoxGeometry(2, 0.15, 0.5),
        accentMat
    );
    gateLight.position.set(0, 3.2, -3.6);
    castle.add(gateLight);

    const courtyard = new THREE.Mesh(
        new THREE.BoxGeometry(8, 0.2, 6),
        floorMat
    );
    courtyard.position.set(0, 0.1, 0);
    castle.add(courtyard);

    const gridLines = new THREE.Group();
    for (let i = -4; i <= 4; i += 1) {
        const line1 = new THREE.Mesh(
            new THREE.BoxGeometry(0.05, 0.21, 6),
            new THREE.MeshBasicMaterial({ color: 0x00d2d3, transparent: true, opacity: 0.3 })
        );
        line1.position.set(i, 0, 0);
        gridLines.add(line1);
    }
    for (let i = -3; i <= 3; i += 1) {
        const line2 = new THREE.Mesh(
            new THREE.BoxGeometry(8, 0.21, 0.05),
            new THREE.MeshBasicMaterial({ color: 0x00d2d3, transparent: true, opacity: 0.3 })
        );
        line2.position.set(0, 0, i);
        gridLines.add(line2);
    }
    castle.add(gridLines);

    return castle;
}
