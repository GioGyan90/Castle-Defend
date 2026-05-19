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
        range: 8,
        sightRange: 10,
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
        sightRange: 11,
        fireIntervalMs: 1950,
        chargeTimeMs: 500,
        damage: 15,
        critDamageBonus: 5,
        critRate: 0.15,
        teslaMaxCharge: 20,
        teslaChargeDamage: 2,
        teslaFullChargeBonus: 25,
        teslaAoeRadius: 3,
        teslaLifeFrames: 10,
        teslaFrameDamageRatio: 0.1
    },
    4: {
        key: 'AIRSTRIKE',
        name: 'Airstrike',
        price: 30,
        damage: 15,
        cooldownMs: 15000,
        length: 9,
        width: 4.2,
        rows: 9
    },
    Q_HELICOPTER: {
        key: 'Q_HELICOPTER',
        name: 'Q Support Helicopter',
        range: 6,
        sightRange: 9,
        moveRadius: 9,
        moveSpeed: 0.055,
        fireIntervalMs: 1300,
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
    J_ROCKET_SQUAD: {
        key: 'J_ROCKET_SQUAD',
        name: 'J Rocket Squad',
        range: 4,
        sightRange: 9,
        moveRadius: 6,
        moveSpeed: 0.025,
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
