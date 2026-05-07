// Game configuration and balancing values.
var LEVELS = {
    1: { 
        enemies: 70, 
        bossHp: 100, 
        title: "Mission 1", 
        points: [[-10,7], [-10,-7], [-5,-7], [-5,4], [5,4], [5,-7], [10,-7], [10,8]], 
        slots: [{x:-7,z:-2}, {x:0,z:0}, {x:7,z:-2}] 
    },
    2: { 
        enemies: 100, 
        bossHp: 200, 
        title: "Mission 2", 
        points: [[-12,0], [-5,0], [-5,-8], [5,-8], [5,8], [10,8], [10,0], [14,0]], 
        slots: [{x:-8,z:3}, {x:-8,z:-3}, {x:0,z:0}, {x:7,z:4}, {x:7,z:-4}] 
    },
    3: { 
        enemies: 120, 
        bossHp: 240,  // 比第二关多 20%
        title: "Mission 3 - Final Boss", 
        points: [[-15,10], [-15,-10], [-8,-10], [-8,5], [0,5], [0,-8], [8,-8], [8,10], [16,10]], 
        slots: [{x:-10,z:0}, {x:-5,z:-5}, {x:3,z:0}, {x:5,z:-5}, {x:10,z:0}] 
    }
};

var PRICES = { 1: 3, 2: 6, 3: 25 };

