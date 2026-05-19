(function(root) {
    'use strict';

    function requireThree(THREERef) {
        const THREE = THREERef || root.THREE;
        if (!THREE) throw new Error('THREE is required to create the white robot model.');
        return THREE;
    }

    function createWhiteRobotModel(THREERef) {
        const THREE = requireThree(THREERef);
        const group = new THREE.Group();

        const bodyMat = new THREE.MeshPhongMaterial({
            color: 0xf7fbff,
            emissive: 0xb9eaff,
            emissiveIntensity: 0.1,
            flatShading: true
        });
        const jointMat = new THREE.MeshPhongMaterial({
            color: 0xaeb8c0,
            emissive: 0x25313a,
            emissiveIntensity: 0.08,
            flatShading: true
        });
        const eyeMat = new THREE.MeshBasicMaterial({ color: 0x46ff88 });

        const body = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.6, 0.35), bodyMat);
        body.position.y = 0.9;
        group.add(body);

        const head = new THREE.Mesh(new THREE.SphereGeometry(0.25, 12, 12), bodyMat);
        head.position.y = 1.4;
        group.add(head);

        const eye = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), eyeMat);
        eye.position.set(0, 1.42, 0.2);
        group.add(eye);

        const leftArm = new THREE.Group();
        const upperArmL = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.3), bodyMat);
        upperArmL.position.y = -0.15;
        const lowerArmL = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.04, 0.25), jointMat);
        lowerArmL.position.y = -0.28;
        leftArm.add(upperArmL, lowerArmL);
        leftArm.position.set(-0.35, 0.9, 0);
        leftArm.rotation.z = 0.3;
        group.add(leftArm);

        const rightArm = new THREE.Group();
        const upperArmR = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.3), bodyMat);
        upperArmR.position.y = -0.15;
        const lowerArmR = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.04, 0.25), jointMat);
        lowerArmR.position.y = -0.28;
        rightArm.add(upperArmR, lowerArmR);
        rightArm.position.set(0.35, 0.9, 0);
        rightArm.rotation.z = -0.3;
        group.add(rightArm);

        const leftLegGroup = new THREE.Group();
        const upperLegL = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.06, 0.35), bodyMat);
        upperLegL.position.y = -0.175;
        const lowerLegL = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.35), jointMat);
        lowerLegL.position.y = -0.35;
        leftLegGroup.add(upperLegL, lowerLegL);
        leftLegGroup.position.set(-0.15, 0.55, 0);
        group.add(leftLegGroup);

        const rightLegGroup = new THREE.Group();
        const upperLegR = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.06, 0.35), bodyMat);
        upperLegR.position.y = -0.175;
        const lowerLegR = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.35), jointMat);
        lowerLegR.position.y = -0.35;
        rightLegGroup.add(upperLegR, lowerLegR);
        rightLegGroup.position.set(0.15, 0.55, 0);
        group.add(rightLegGroup);

        group.userData = {
            whiteRobot: true,
            walkPhase: Math.random() * Math.PI * 2,
            body,
            head,
            leftArm,
            rightArm,
            leftLegGroup,
            rightLegGroup,
            leftEye: eye,
            rightEye: eye,
            hasPhysics: false
        };
        group.scale.setScalar(0.35);

        return group;
    }

    root.createWhiteRobotModel = createWhiteRobotModel;

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = createWhiteRobotModel;
    }
})(typeof window !== 'undefined' ? window : globalThis);
