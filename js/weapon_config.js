// Weapon balance configuration.
// Edit this file locally, save it, then refresh the game page for changes to take effect.
// range: null means map-wide targeting. A number means the weapon only targets enemies within that distance.
var WEAPON_CONFIG = {
    1: {
        key: 'PULSE',
        name: 'Pulse Cannon',
        price: 3,
        range: 7,
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
    }
};

function getWeaponConfig(type) {
    return WEAPON_CONFIG[type];
}
