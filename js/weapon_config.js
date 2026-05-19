// Weapon balance configuration.
// Edit this file locally, save it, then refresh the game page for changes to take effect.
// range is attack range. sightRange is longer and lets weapons pre-aim before enemies enter attack range.
// null means map-wide targeting for that specific range field.
var WEAPON_CONFIG = {
    1: {
        key: 'PULSE',
        name: 'Pulse Cannon',
        price: 3,
        range: 7,
        sightRange: 9,
        fireIntervalMs: 1200,
        damage: 3,
        critDamage: 5,
        critRate: 0.3,
        projectileSpeed: 0.12
    },
    2: {
        key: 'RAIL',
        name: 'Rail Laser',
        price: 12,
        range: 7,
        sightRange: 8,
        fireIntervalMs: 1300,
        burstTotal: 6,
        damage: 8,
        critDamage: 12,
        critRate: 0.25,
        projectileSpeed: 1.45,
        projectileSpeedDecay: 0.94,
        projectileMinSpeed: 0.28,
        projectileLife: 34
    },
    3: {
        key: 'TESLA',
        name: 'Tesla Coil',
        price: 25,
        range: 9,
        sightRange: 10,
        fireIntervalMs: 1950,
        chargeTimeMs: 2500,
        damage: 18,
        critDamageBonus: 5,
        critRate: 0.20,
        teslaMaxCharge: 20,
        teslaChargeDamage: 4,
        teslaFullChargeBonus: 35,
        teslaAoeRadius: 4,
        teslaLifeFrames: 10,
        teslaFrameDamageRatio: 0.1
    },
    4: {
        key: 'AIRSTRIKE',
        name: 'Airstrike',
        price: 30,
        damage: 18,
        cooldownMs: 6000,
        length: 8,
        width: 4.2,
        rows: 9
    },
    Q_HELICOPTER: {
        key: 'Q_HELICOPTER',
        name: 'Q Support Helicopter',
        range: 8,
        sightRange: 12,
        moveRadius: 12,
        moveSpeed: 0.012,
        facingYawOffset: -Math.PI / 2,
        takeoffDurationMs: 3420,
        returnDurationMs: 1280,
        enterDurationMs: 1450,
        lostTargetReturnDelayMs: 1100,
        rotorSpeed: 0.5,
        tailRotorSpeedRatio: 1.6,
        bodyBankAmplitude: 0.025,
        padSpinSpeed: 0.006,
        combatAltitude: 2.18,
        fireIntervalMs: 2400,
        burstTotal: 6,
        damage: 8,
        projectileSpeed: 1.35,
        projectileSpeedDecay: 0.94,
        projectileMinSpeed: 0.28,
        projectileLife: 36,
        projectileLength: 1.35,
        projectileCoreRadius: 0.08,
        projectileGlowRadius: 0.2
    },
    K_OIL_WELL: {
        key: 'K_OIL_WELL',
        name: 'K Oil Pump',
        scale: 0.64,
        offsetX: 0.46,
        offsetY: 0.4,
        offsetZ: -0.34,
        rotationOffset: 0.08,
        pumpSpeed: 0.0032,
        pumpAmplitude: 1,
        crankSpeed: 0.045,
        ringSpinSpeed: 0.012,
        palette: {
            dark: 0x243121,
            steel: 0x879b8b,
            accent: 0xf2b84b,
            joint: 0x8df06f,
            glow: 0xc7ff7a
        }
    },
    J_ROCKET_SQUAD: {
        key: 'J_ROCKET_SQUAD',
        name: 'J Rocket Squad',
        range: 8,
        sightRange: 10,
        moveRadius: 16,
        moveSpeed: 0.01,
        fireIntervalMs: 1200,
        damage: 3,
        count: 3,
        formation: [
            { pathOffset: 0, lateralOffset: 0 },
            { pathOffset: 0.72, lateralOffset: -0.58 },
            { pathOffset: 0.72, lateralOffset: 0.58 }
        ]
    }
};

function getWeaponConfig(type) {
    return WEAPON_CONFIG[type];
}
