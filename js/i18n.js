// UI language strings and version metadata.

var APP_VERSION = 'V162';
var currentLanguage = localStorage.getItem('castle_defense_language') || 'zh';

var GAME_I18N = {
    zh: {
        versionLabel: APP_VERSION,
        menuKicker: APP_VERSION + ' 战术防线',
        title: 'Castle Defend',
        menuDesc: '部署炮塔、空袭与卡牌，在任务中守住基地并完成反攻。',
        startGame: '开始游戏',
        cardGallery: '卡片展示馆',
        debugMode: 'Debug 模式',
        enemyGallery: '敌方单位展示馆',
        towerGallery: '防御塔展示馆',
        leaderboard: '排行榜',
        levelSelect: '选择关卡',
        enterDebug: '进入调试',
        cancel: '取消',
        galleryTitle: '展示馆',
        galleryDesc: '模型预览',
        back: '返回',
        leaderboardTitle: '玩家得分排行榜',
        leaderboardDesc: '历史最高分记录（前 10 名）',
        clearLeaderboard: '清空排行榜',
        pauseTitle: '游戏暂停',
        resume: '继续游戏',
        home: '返回首页',
        restart: '重开本关',
        soundOff: '关闭声音',
        soundOn: '开启声音',
        nextLevel: '进入下一关',
        replayLevel: '重玩本关',
        restartCampaign: '重新开始战役',
        mission1Complete: '第一关守住了',
        mission2Complete: '第二关突破了',
        mission3Complete: '第三关也拿下',
        campaignCleared: '战役通关',
        timeUp: '时间到了',
        gameOver: '基地失守',
        levelStart1: '守住第一条防线',
        levelStart2: '敌人变多了，火力别断',
        levelStart3: '最后一关，大家伙要来了',
        levelStart4: '这次换你进攻',
        bossIncoming: '大家伙来了',
        chopperBoss: '直升机 Boss 来了',
        bossAlpha: 'Alpha Boss 进场',
        bossDown: 'Boss 倒了！',
        portalOpen: '传送门！',
        airPortalOpen: '空军门！',
        airstrike: '空袭！',
        explosion: '炸到了！',
        baseHit: '基地 {hp}HP',
        enemyBaseHit: '敌基 {hp}HP',
        weaponDeployed: '{name} 就位',
        attackUnitDeployed: '{name} 出击',
        cardActivated: '黑桃 {rank}'
    },
    en: {
        versionLabel: APP_VERSION,
        menuKicker: APP_VERSION + ' Tactical Defense',
        title: 'Castle Defend',
        menuDesc: 'Build towers, call airstrikes, play cards, and clear the missions.',
        startGame: 'Start Game',
        cardGallery: 'Card Gallery',
        debugMode: 'Debug Mode',
        enemyGallery: 'Enemy Gallery',
        towerGallery: 'Tower Gallery',
        leaderboard: 'Leaderboard',
        levelSelect: 'Select Level',
        enterDebug: 'Enter Debug',
        cancel: 'Cancel',
        galleryTitle: 'Gallery',
        galleryDesc: 'Model Preview',
        back: 'Back',
        leaderboardTitle: 'Player Leaderboard',
        leaderboardDesc: 'Best scores, top 10',
        clearLeaderboard: 'Clear Leaderboard',
        pauseTitle: 'Paused',
        resume: 'Resume',
        home: 'Home',
        restart: 'Restart Mission',
        soundOff: 'Sound Off',
        soundOn: 'Sound On',
        nextLevel: 'Next Mission',
        replayLevel: 'Replay Mission',
        restartCampaign: 'Restart Campaign',
        mission1Complete: 'Mission 1 held',
        mission2Complete: 'Mission 2 cleared',
        mission3Complete: 'Mission 3 cleared',
        campaignCleared: 'Campaign cleared',
        timeUp: 'Time is up',
        gameOver: 'Base lost',
        levelStart1: 'Hold the first line',
        levelStart2: 'More enemies incoming, keep firing',
        levelStart3: 'Final line. The big one is coming',
        levelStart4: 'Your turn to attack',
        bossIncoming: 'Big one incoming',
        chopperBoss: 'Chopper boss inbound',
        bossAlpha: 'Alpha boss entering',
        bossDown: 'Boss down!',
        portalOpen: 'Portal!',
        airPortalOpen: 'Air portal!',
        airstrike: 'Airstrike!',
        explosion: 'Boom hit!',
        baseHit: 'Base {hp}HP',
        enemyBaseHit: 'Enemy {hp}HP',
        weaponDeployed: '{name} ready',
        attackUnitDeployed: '{name} go',
        cardActivated: 'Spade {rank}'
    }
};

function t(key, vars) {
    var lang = GAME_I18N[currentLanguage] || GAME_I18N.zh;
    var text = lang[key] || GAME_I18N.zh[key] || key;
    if (vars) {
        Object.keys(vars).forEach(function(name) {
            text = text.replace(new RegExp('\\{' + name + '\\}', 'g'), vars[name]);
        });
    }
    return text;
}

function setGameLanguage(lang) {
    currentLanguage = lang === 'en' ? 'en' : 'zh';
    localStorage.setItem('castle_defense_language', currentLanguage);
    applyLanguage();
}

function applyLanguage() {
    document.documentElement.lang = currentLanguage === 'en' ? 'en' : 'zh-CN';
    document.querySelectorAll('[data-i18n]').forEach(function(el) {
        el.textContent = t(el.getAttribute('data-i18n'));
    });
    document.querySelectorAll('[data-i18n-title]').forEach(function(el) {
        el.title = t(el.getAttribute('data-i18n-title'));
        el.setAttribute('aria-label', t(el.getAttribute('data-i18n-title')));
    });
    document.querySelectorAll('[data-lang-option]').forEach(function(btn) {
        btn.classList.toggle('active', btn.getAttribute('data-lang-option') === currentLanguage);
    });
    if (typeof updateSoundButton === 'function') updateSoundButton();
}

window.addEventListener('DOMContentLoaded', applyLanguage);


