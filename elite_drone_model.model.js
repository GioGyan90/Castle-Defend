// Elite Drone Model Export - Three.js Code
// Generated from js/enemies.js

function createEliteDroneModel(THREE) {
  const group = new THREE.Group();

  // Materials
  const bodyMat = new THREE.MeshPhongMaterial({ 
    color: 0x101018,
    emissive: 0x160014,
    emissiveIntensity: 0.45,
    flatShading: true
  });

  const armorMat = new THREE.MeshPhongMaterial({ 
    color: 0x262634,
    emissive: 0x120010,
    emissiveIntensity: 0.25,
    flatShading: true
  });

  const propellerMat = new THREE.MeshPhongMaterial({ 
    color: 0x050507,
    flatShading: true
  });

  const coreMat = new THREE.MeshBasicMaterial({ 
    color: 0xff4fd8
  });

  const sensorMat = new THREE.MeshBasicMaterial({ 
    color: 0xff2fb8
  });

  // Main body (flat hexagon cylinder)
  const bodyGeo = new THREE.CylinderGeometry(0.5, 0.58, 0.24, 6);
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.rotation.x = Math.PI / 2;
  body.position.y = 1.2;
  group.add(body);

  // Top armor plate
  const topArmor = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.1, 0.48), armorMat);
  topArmor.position.y = 1.32;
  group.add(topArmor);

  // Front armor plate
  const frontArmor = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.12, 0.18), armorMat);
  frontArmor.position.set(0, 1.22, 0.42);
  group.add(frontArmor);

  // Central glowing core
  const core = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 8), coreMat);
  core.position.y = 1.38;
  group.add(core);

  // Side lights
  const sideLights = [];
  [-1, 1].forEach(side => {
    const light = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.07, 0.28), coreMat);
    light.position.set(side * 0.42, 1.25, 0.12);
    group.add(light);
    sideLights.push(light);
  });

  // Four rotor arms and propellers
  const armPositions = [
    { x: 0.38, z: 0.38, rot: Math.PI / 4 },
    { x: -0.38, z: 0.38, rot: -Math.PI / 4 },
    { x: 0.38, z: -0.38, rot: -Math.PI / 4 },
    { x: -0.38, z: -0.38, rot: Math.PI / 4 }
  ];

  const propellers = [];

  armPositions.forEach((pos) => {
    // Rotor arm
    const arm = new THREE.Mesh(
      new THREE.BoxGeometry(0.14, 0.08, 0.36),
      bodyMat
    );
    arm.position.set(pos.x, 1.2, pos.z);
    arm.rotation.y = pos.rot;
    group.add(arm);

    // Propeller assembly
    const propellerGroup = new THREE.Group();
    propellerGroup.position.set(pos.x * 1.55, 1.42, pos.z * 1.55);

    const hub = new THREE.Mesh(
      new THREE.CylinderGeometry(0.1, 0.1, 0.04, 10),
      armorMat
    );
    hub.position.y = -0.01;

    const blade1 = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.01, 0.52), propellerMat);
    const blade2 = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.01, 0.035), propellerMat);

    propellerGroup.add(hub, blade1, blade2);
    group.add(propellerGroup);
    propellers.push(propellerGroup);
  });

  // Bottom sensor/camera
  const sensor = new THREE.Mesh(
    new THREE.CylinderGeometry(0.09, 0.06, 0.12, 8),
    sensorMat
  );
  sensor.position.y = 1.04;
  group.add(sensor);

  // Store references for animation
  group.userData = {
    propellers: propellers,
    core: core,
    sideLights: sideLights,
    spinSpeed: 0.3
  };

  return group;
}

// Usage:
// const eliteDrone = createEliteDroneModel(THREE);
// scene.add(eliteDrone);
