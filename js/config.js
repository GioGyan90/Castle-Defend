// Game configuration and balancing values.
// Mobile-first design: compact maps centered on screen
// Coordinates scaled to fit mobile viewport, then adapted for PC
// Mission map layouts and map-rendering helpers live in js/maps.js.
var PRICES = {
    1: getWeaponConfig(1).price,
    2: getWeaponConfig(2).price,
    3: getWeaponConfig(3).price,
    4: getWeaponConfig(4).price
};

var RAIL_TARGET_RANGE = getWeaponConfig(2).range;
