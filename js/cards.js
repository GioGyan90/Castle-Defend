// Simple card system for defensive missions.
const CARD_CONFIGS = {
    J: {
        rank: 'J',
        suit: 'SPADE',
        price: 15,
        fireRateBonus: 0.25,
        damageBonus: 0,
        incomePerSecond: 0,
        description: 'Tower fire rate +25%'
    },
    Q: {
        rank: 'Q',
        suit: 'SPADE',
        price: 25,
        fireRateBonus: 0.15,
        damageBonus: 5,
        incomePerSecond: 0,
        description: 'Tower damage +5, fire rate +15%'
    },
    K: {
        rank: 'K',
        suit: 'SPADE',
        price: 35,
        fireRateBonus: 0.2,
        damageBonus: 10,
        incomePerSecond: 5,
        description: 'Tower damage +10, fire rate +20%, +5 PTS/s'
    }
};

const activeCards = new Set();

function createCardFaceElement(rank, compact = false) {
    const config = CARD_CONFIGS[rank];
    const card = document.createElement('div');
    card.className = compact ? 'playing-card compact' : 'playing-card';
    card.dataset.rank = rank;

    const top = document.createElement('span');
    top.className = 'card-corner top';
    top.textContent = rank;

    const suit = document.createElement('span');
    suit.className = 'card-suit';
    suit.innerHTML = '&spades;';

    const bottom = document.createElement('span');
    bottom.className = 'card-corner bottom';
    bottom.textContent = rank;

    card.appendChild(top);
    card.appendChild(suit);
    card.appendChild(bottom);
    if (config && !compact) {
        card.title = `${rank} ${config.description}`;
    }
    return card;
}

function updateCardPanelUI() {
    const panel = document.getElementById('cardPanel');
    if (!panel) return;
    const shouldShow = typeof gameStarted !== 'undefined'
        && gameStarted
        && !gameOver
        && (typeof isAttackMode !== 'function' || !isAttackMode());
    panel.style.display = shouldShow ? 'flex' : 'none';

    Object.keys(CARD_CONFIGS).forEach(rank => {
        const cfg = CARD_CONFIGS[rank];
        const btn = document.getElementById('cardBtn' + rank);
        if (!btn) return;
        btn.style.display = activeCards.has(rank) ? 'none' : '';
        btn.disabled = !shouldShow || activeCards.has(rank) || typeof score === 'undefined' || score < cfg.price;
        btn.classList.toggle('owned', activeCards.has(rank));
        const priceEl = btn.querySelector('.card-price');
        if (priceEl) priceEl.textContent = activeCards.has(rank) ? 'ON' : cfg.price;
    });

    const activeList = document.getElementById('activeCards');
    if (!activeList) return;
    activeList.innerHTML = '';
    activeCards.forEach(rank => activeList.appendChild(createCardFaceElement(rank, true)));
}

function resetCardSystem() {
    activeCards.clear();
    updateCardPanelUI();
}

function buyCard(rank) {
    const cfg = CARD_CONFIGS[rank];
    if (!cfg || activeCards.has(rank)) return;
    if (typeof isAttackMode === 'function' && isAttackMode()) return;
    if (typeof gameOver !== 'undefined' && gameOver) return;
    if (typeof isPaused !== 'undefined' && isPaused) return;
    if (typeof score === 'undefined' || score < cfg.price) return;

    score -= cfg.price;
    activeCards.add(rank);
    if (typeof announceHighlight === 'function') {
        announceHighlight('card-' + rank, t('cardActivated', { rank }));
    }
    if (typeof playTone === 'function') {
        playTone(rank === 'K' ? 620 : 520, 'triangle', 0.16, 0.045);
    }
    updateCardPanelUI();
    if (typeof updateUI === 'function') updateUI();
}

function getActiveCardEffects() {
    const effects = {
        fireRateBonus: 0,
        damageBonus: 0,
        incomePerSecond: 0
    };
    activeCards.forEach(rank => {
        const cfg = CARD_CONFIGS[rank];
        if (!cfg) return;
        effects.fireRateBonus += cfg.fireRateBonus || 0;
        effects.damageBonus += cfg.damageBonus || 0;
        effects.incomePerSecond += cfg.incomePerSecond || 0;
    });
    return effects;
}

function getCardFireIntervalMultiplier(sourceWeapon) {
    if (sourceWeapon && sourceWeapon.isEnemyTower) return 1;
    if (typeof isAttackMode === 'function' && isAttackMode()) return 1;
    const bonus = getActiveCardEffects().fireRateBonus;
    return bonus > 0 ? 1 / (1 + bonus) : 1;
}

function getCardDamageBonus(sourceWeapon) {
    if (sourceWeapon && sourceWeapon.isEnemyTower) return 0;
    if (typeof isAttackMode === 'function' && isAttackMode()) return 0;
    return getActiveCardEffects().damageBonus;
}

function getCardIncomePerSecond() {
    if (typeof isAttackMode === 'function' && isAttackMode()) return 0;
    return getActiveCardEffects().incomePerSecond;
}

function showCardIncomeText(amount) {
    const pop = document.createElement('div');
    pop.className = 'card-income-pop';
    pop.textContent = `+${amount}`;
    document.body.appendChild(pop);
    window.setTimeout(() => pop.remove(), 1050);
}

function createCardCanvasTexture(rank) {
    const canvas = document.createElement('canvas');
    canvas.width = 320;
    canvas.height = 448;
    const ctx = canvas.getContext('2d');
    const radius = 28;

    ctx.fillStyle = '#f8fbff';
    ctx.strokeStyle = '#151923';
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.moveTo(radius, 6);
    ctx.lineTo(canvas.width - radius, 6);
    ctx.quadraticCurveTo(canvas.width - 6, 6, canvas.width - 6, radius);
    ctx.lineTo(canvas.width - 6, canvas.height - radius);
    ctx.quadraticCurveTo(canvas.width - 6, canvas.height - 6, canvas.width - radius, canvas.height - 6);
    ctx.lineTo(radius, canvas.height - 6);
    ctx.quadraticCurveTo(6, canvas.height - 6, 6, canvas.height - radius);
    ctx.lineTo(6, radius);
    ctx.quadraticCurveTo(6, 6, radius, 6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#111827';
    ctx.font = '900 74px Arial';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(rank, 30, 24);
    ctx.save();
    ctx.translate(canvas.width - 30, canvas.height - 24);
    ctx.rotate(Math.PI);
    ctx.fillText(rank, 0, 0);
    ctx.restore();

    ctx.font = '900 178px Georgia';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String.fromCharCode(0x2660), canvas.width / 2, canvas.height / 2 + 8);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
}

function createPlayingCardModel(rank) {
    const group = new THREE.Group();
    const texture = createCardCanvasTexture(rank);
    const material = new THREE.MeshBasicMaterial({ map: texture, side: THREE.FrontSide });
    const backMaterial = new THREE.MeshBasicMaterial({ color: 0x17213a });
    const card = new THREE.Mesh(new THREE.BoxGeometry(1.65, 2.32, 0.045), [
        backMaterial,
        backMaterial,
        backMaterial,
        backMaterial,
        material,
        backMaterial
    ]);
    card.position.y = 1.12;
    group.add(card);
    return group;
}
