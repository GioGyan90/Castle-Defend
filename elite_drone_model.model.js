// Elite Drone Model Export - Three.js Code
// Generated on 2026/5/11

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
  if (body) {
    body.rotation.x = Math.PI / 2;
    body.position.set(0, 1.2, 0);
    group.add(body);
  }

  // Top armor plate (box)
  const topArmor = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.1, 0.48), armorMat);
  if (topArmor) {
    topArmor.position.set(0, 1.32, 0);
    group.add(topArmor);
  }

  // Front armor plate (box)
  const frontArmor = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.12, 0.18), armorMat);
  if (frontArmor) {
    frontArmor.position.set(0, 1.22, 0.42);
    group.add(frontArmor);
  }

  // Central glowing core (sphere)
  const core = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 8), coreMat);
  if (core) {
    core.position.set(0, 1.38, 0);
    group.add(core);
  }

  // Side light left (box)
  const sideLightLeft = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.07, 0.28), coreMat);
  if (sideLightLeft) {
    sideLightLeft.position.set(-0.42, 1.25, 0.12);
    group.add(sideLightLeft);
  }

  // Side light right (box)
  const sideLightRight = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.07, 0.28), coreMat);
  if (sideLightRight) {
    sideLightRight.position.set(0.42, 1.25, 0.12);
    group.add(sideLightRight);
  }

  // Rotor arm 1 (box)
  const arm1 = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.08, 0.36), bodyMat);
  if (arm1) {
    arm1.position.set(0.38, 1.2, 0.38);
    arm1.rotation.set(0, Math.PI / 4, 0);
    group.add(arm1);
  }

  // Propeller 1 hub (cylinder)
  const prop1Hub = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.04, 10), armorMat);
  if (prop1Hub) {
    prop1Hub.position.set(0.589, 1.41, 0.589);
    prop1Hub.rotation.set(0, 0, 0);
    group.add(prop1Hub);
  }

  // Propeller 1 blade1 (box)
  const prop1Blade1 = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.01, 0.52), propellerMat);
  if (prop1Blade1) {
    prop1Blade1.position.set(0.589, 1.4, 0.589);
    group.add(prop1Blade1);
  }

  // Propeller 1 blade2 (box)
  const prop1Blade2 = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.01, 0.035), propellerMat);
  if (prop1Blade2) {
    prop1Blade2.position.set(0.589, 1.4, 0.589);
    group.add(prop1Blade2);
  }

  // Rotor arm 2 (box)
  const arm2 = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.08, 0.36), bodyMat);
  if (arm2) {
    arm2.position.set(-0.38, 1.2, 0.38);
    arm2.rotation.set(0, -Math.PI / 4, 0);
    group.add(arm2);
  }

  // Propeller 2 hub (cylinder)
  const prop2Hub = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.04, 10), armorMat);
  if (prop2Hub) {
    prop2Hub.position.set(-0.589, 1.41, 0.589);
    prop2Hub.rotation.set(0, 0, 0);
    group.add(prop2Hub);
  }

  // Propeller 2 blade1 (box)
  const prop2Blade1 = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.01, 0.52), propellerMat);
  if (prop2Blade1) {
    prop2Blade1.position.set(-0.589, 1.4, 0.589);
    group.add(prop2Blade1);
  }

  // Propeller 2 blade2 (box)
  const prop2Blade2 = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.01, 0.035), propellerMat);
  if (prop2Blade2) {
    prop2Blade2.position.set(-0.589, 1.4, 0.589);
    group.add(prop2Blade2);
  }

  // Rotor arm 3 (box)
  const arm3 = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.08, 0.36), bodyMat);
  if (arm3) {
    arm3.position.set(0.38, 1.2, -0.38);
    arm3.rotation.set(0, -Math.PI / 4, 0);
    group.add(arm3);
  }

  // Propeller 3 hub (cylinder)
  const prop3Hub = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.04, 10), armorMat);
  if (prop3Hub) {
    prop3Hub.position.set(0.589, 1.41, -0.589);
    prop3Hub.rotation.set(0, 0, 0);
    group.add(prop3Hub);
  }

  // Propeller 3 blade1 (box)
  const prop3Blade1 = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.01, 0.52), propellerMat);
  if (prop3Blade1) {
    prop3Blade1.position.set(0.589, 1.4, -0.589);
    group.add(prop3Blade1);
  }

  // Propeller 3 blade2 (box)
  const prop3Blade2 = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.01, 0.035), propellerMat);
  if (prop3Blade2) {
    prop3Blade2.position.set(0.589, 1.4, -0.589);
    group.add(prop3Blade2);
  }

  // Rotor arm 4 (box)
  const arm4 = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.08, 0.36), bodyMat);
  if (arm4) {
    arm4.position.set(-0.38, 1.2, -0.38);
    arm4.rotation.set(0, Math.PI / 4, 0);
    group.add(arm4);
  }

  // Propeller 4 hub (cylinder)
  const prop4Hub = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.04, 10), armorMat);
  if (prop4Hub) {
    prop4Hub.position.set(-0.589, 1.41, -0.589);
    prop4Hub.rotation.set(0, 0, 0);
    group.add(prop4Hub);
  }

  // Propeller 4 blade1 (box)
  const prop4Blade1 = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.01, 0.52), propellerMat);
  if (prop4Blade1) {
    prop4Blade1.position.set(-0.589, 1.4, -0.589);
    group.add(prop4Blade1);
  }

  // Propeller 4 blade2 (box)
  const prop4Blade2 = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.01, 0.035), propellerMat);
  if (prop4Blade2) {
    prop4Blade2.position.set(-0.589, 1.4, -0.589);
    group.add(prop4Blade2);
  }

  // Bottom sensor/camera (cylinder)
  const sensor = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.06, 0.12, 8), sensorMat);
  if (sensor) {
    sensor.position.set(0, 1.04, 0);
    group.add(sensor);
  }

  return group;
}

// Usage:
// const eliteDrone = createEliteDroneModel(THREE);
// scene.add(eliteDrone);
