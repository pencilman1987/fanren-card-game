(() => {
  const { initialDeck, allCards } = window.GameCards;
  const { allArtifacts } = window.GameArtifacts;
  const EnemySystem = window.GameEnemies;
  const MapSystem = window.GameMap;

  const state = {
    screen: 'map',
    map: MapSystem.createMap(),
    currentNode: null,
    stage: 1,
    playerHP: 30,
    playerMaxHP: 30,
    enemyHP: 30,
    enemyMaxHP: 30,
    mana: 2,
    playerMaxMana: 10,
    actions: 1,
    level: 1,
    xp: 0,
    talents: { mana: 0, draw: 0, actions: 0, maxHP: 0, manaRegen: 0 },
    playerDeck: initialDeck.map(card => ({ ...card })),
    hand: [],
    logs: [],
    spiritStones: 0,
    ownedArtifacts: [],
    activeArtifacts: [],
    maxArtifactSlots: 1,
    cardUseCount: 0,
    enemyIntent: null,
    previousIntentType: null
  };

  const $ = id => document.getElementById(id);
  const pick = array => array[Math.floor(Math.random() * array.length)];
  const shuffle = array => [...array].sort(() => Math.random() - 0.5);
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

  function log(message) {
    state.logs.unshift(message);
    state.logs = state.logs.slice(0, 50);
    render();
  }

  function playerStage() {
    const level = state.level;
    if (level <= 5) return '炼气期';
    if (level <= 10) return '筑基期';
    if (level <= 15) return '结丹期';
    if (level <= 20) return '元婴期';
    if (level <= 25) return '化神期';
    if (level <= 30) return '炼虚期';
    return '合体期';
  }

  function canPlay(card) {
    if (state.actions < (card.cost || 0)) return false;
    if (card.manaCost && state.mana < card.manaCost) return false;
    if (card.healthCost && state.playerHP <= card.healthCost) return false;
    return true;
  }

  function setNextIntent() {
    state.enemyIntent = EnemySystem.chooseIntent(state.stage, state.previousIntentType);
    state.previousIntentType = state.enemyIntent.type;
  }

  function encounterMultiplier(type) {
    if (type === 'boss') return 1.85;
    if (type === 'elite') return 1.35;
    return 1;
  }

  function prepareCombat(node) {
    const stats = EnemySystem.getEnemyStats(node.floor + 1);
    state.currentNode = node;
    state.screen = 'battle';
    state.stage = Math.max(state.stage, node.floor + 1);
    state.enemyMaxHP = Math.floor((30 + state.stage * 5) * encounterMultiplier(node.type) * (stats.hpMultiplier || 1));
    state.enemyHP = state.enemyMaxHP;
    state.mana = Math.min(state.playerMaxMana, state.mana + (state.talents.mana || 0));
    state.previousIntentType = null;
    state.logs = [];
    setNextIntent();
    drawHand();
    log(`${MapSystem.nodeTypes[node.type].label}开始！`);
  }

  function cardLabel(card) {
    if (card.type === 'heal') return '回复';
    if (card.type === 'buff') return '秘术';
    return '攻击';
  }

  function cardSigil(card) {
    if (card.type === 'heal') return '春';
    if (card.type === 'buff') return '诀';
    if (card.name.includes('火')) return '火';
    return '剑';
  }

  function cardHtml(card, index, inHand) {
    const disabled = inHand && !canPlay(card);
    const cls = card.type === 'heal' ? 'heal' : card.type === 'buff' ? 'buff' : '';
    return `<button class="card ${cls} ${disabled ? 'disabled' : ''}" ${inHand ? `data-play="${index}"` : ''}>
      <div class="frame"><div class="cost">${card.cost || 0}</div><div class="level">Lv${card.level || 1}</div><div class="banner">${cardLabel(card)}</div>
      <div class="art"><div class="sigil">${cardSigil(card)}</div></div><div class="info"><div><div class="card-title">${card.name}</div><div class="desc">${card.desc || ''}</div></div>
      <div class="costs"><span>行动 ${card.cost || 0}</span>${card.manaCost ? `<span>魔力 ${card.manaCost}</span>` : ''}${card.healthCost ? `<span>生命 ${card.healthCost}</span>` : ''}</div></div></div>
    </button>`;
  }

  function intentHtml() {
    const intent = state.enemyIntent;
    if (!intent) return '';
    return `<div class="intent-card intent-${intent.type}"><div class="intent-icon">${intent.icon}</div><div class="intent-name">${intent.name}</div><div class="intent-summary">${intent.summary}</div></div>`;
  }

  function renderMap() {
    const available = MapSystem.availableNodeIds(state.map);
    if (!state.map.selectedNodeId && available[0]) state.map.selectedNodeId = available[0];
    const nodes = state.map.nodes.map(node => ({ ...node, status: MapSystem.nodeStatus(state.map, node.id) }));
    const selected = MapSystem.getNode(state.map, state.map.selectedNodeId);
    const edges = state.map.nodes.flatMap(node => (node.next || []).map(nextId => {
      const target = MapSystem.getNode(state.map, nextId);
      if (!target) return '';
      const dx = target.x - node.x;
      const dy = target.y - node.y;
      const length = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx) * 180 / Math.PI;
      const active = state.map.completedNodeIds.includes(node.id) || available.includes(target.id);
      return `<div class="route-line ${active ? 'active' : ''}" style="left:${node.x}%;top:${node.y}%;width:${length}%;transform:rotate(${angle}deg)"></div>`;
    })).join('');

    $('app').innerHTML = `<section class="map-screen"><div class="map-header"><div><div class="eyebrow">第一幕 · 乱星海边境</div><h1>仙路行程</h1></div><div class="resources"><div class="pill">生命 ${state.playerHP}/${state.playerMaxHP}</div><div class="pill">灵石 ${state.spiritStones}</div><div class="pill">Lv${state.level}</div><button class="pill artifact-map-button" data-bag>法宝 ${state.activeArtifacts.length}/${state.maxArtifactSlots}</button></div></div>
      <div class="map-layout"><div class="route-panel"><div class="route-head"><b>选择下一处机缘</b><span>已完成 ${state.map.completedNodeIds.length} 处</span></div><div class="route-canvas">${edges}${nodes.map(node => {
        const meta = MapSystem.nodeTypes[node.type];
        return `<button class="map-node type-${node.type} status-${node.status}" style="left:${node.x}%;top:${node.y}%" data-map-node="${node.id}" ${['locked', 'completed'].includes(node.status) ? 'disabled' : ''}><span>${meta.icon}</span><small>${meta.shortLabel}</small></button>`;
      }).join('')}</div></div><aside class="map-side">
      ${selected ? `<div class="side-card"><small>当前选择</small><b>${MapSystem.nodeTypes[selected.type].icon} ${MapSystem.nodeTypes[selected.type].label}</b><p>${MapSystem.nodeTypes[selected.type].desc}</p><button class="primary" data-enter-node="${selected.id}" ${['locked', 'completed'].includes(MapSystem.nodeStatus(state.map, selected.id)) ? 'disabled' : ''}>进入</button></div>` : ''}
      <div class="side-card"><small>装备加成</small><b>法宝 ${state.activeArtifacts.length}/${state.maxArtifactSlots}</b><p>${state.activeArtifacts.length ? state.activeArtifacts.map(item => `${item.name}：${item.desc}`).join('；') : '暂无装备法宝，可在这里查看或调整。'}</p><button class="primary secondary" data-bag>调整法宝</button></div>
      <div class="side-card legend-card">${Object.values(MapSystem.nodeTypes).map(type => `<span>${type.icon} ${type.label}</span>`).join('')}</div></aside></div></section>`;
  }

  function renderBattle() {
    const stats = EnemySystem.getEnemyStats(state.stage);
    const playerHp = clamp(Math.floor(state.playerHP / state.playerMaxHP * 100), 0, 100);
    const enemyHp = clamp(Math.floor(state.enemyHP / state.enemyMaxHP * 100), 0, 100);
    $('app').innerHTML = `<section class="topbar"><div class="stage">第 ${state.stage} 关</div><div class="resources"><div class="pill">魔力 ${state.mana}/${state.playerMaxMana}</div><div class="pill">行动 ${state.actions}</div><div class="pill">灵石 ${state.spiritStones}</div><div class="pill">卡组 ${state.playerDeck.length}/15</div></div></section>
      <section class="artifact-strip"><b>已装备法宝</b><div class="artifact-relics">${state.activeArtifacts.length ? state.activeArtifacts.map(item => `<button class="artifact-relic" data-bag><span>${item.icon || '器'}</span><strong>${item.name}</strong><small>${item.desc}</small></button>`).join('') : '<button class="artifact-empty" data-bag>暂无装备</button>'}</div></section>
      <section class="board"><div class="fighter"><div class="portrait"></div><div class="fighter-body"><div class="kicker">修仙者</div><div class="name">韩立</div><div class="stage-line">${playerStage()} · Lv${state.level}</div><div class="hp-line"><div class="hp-track"><div class="hp-fill player-hp" style="width:${playerHp}%"></div></div><span class="hp-text">${state.playerHP}/${state.playerMaxHP}</span></div></div></div><div class="versus"><div class="gem">VS</div>${intentHtml()}</div><div class="fighter enemy"><div class="portrait"></div><div class="fighter-body"><div class="kicker">敌人</div><div class="name">${EnemySystem.getEnemyType(state.stage)}</div><div class="stage-line">${stats.trait}</div><div class="hp-line"><div class="hp-track"><div class="hp-fill enemy-hp" style="width:${enemyHp}%"></div></div><span class="hp-text">${state.enemyHP}/${state.enemyMaxHP}</span></div></div></div></section>
      <section class="hand"><div class="hand-head"><div class="hand-title">手牌</div><div class="hand-count">${state.hand.length} 张</div></div><div class="cards">${state.hand.map((card, index) => cardHtml(card, index, true)).join('') || '<p>卡牌区为空，等待下回合抽牌</p>'}</div></section>
      <section class="dock"><button class="end" data-end>结束回合</button><div class="log"><div class="log-title">战斗记录</div>${state.logs.map(msg => `<p>${msg}</p>`).join('')}</div></section>`;
  }

  function render() {
    if (state.screen === 'map') renderMap();
    else renderBattle();
  }

  function drawHand() {
    state.hand = [];
    const actionBonus = state.activeArtifacts.filter(item => item.effect.type === 'bonusAction').reduce((sum, item) => sum + item.effect.value, 0);
    const drawBonus = state.activeArtifacts.filter(item => item.effect.type === 'bonusDraw').reduce((sum, item) => sum + item.effect.value, 0);
    state.actions = 1 + (state.talents.actions || 0) + actionBonus;
    const drawCount = 3 + (state.talents.draw || 0) + drawBonus;
    for (let i = 0; i < drawCount; i++) state.hand.push({ ...pick(state.playerDeck) });
    render();
  }

  function applyArtifacts(card, context) {
    const result = { ...context };
    state.activeArtifacts.forEach(artifact => {
      const effect = artifact.effect;
      if (card.type === 'attack' && effect.type === 'damageBonus') { result.damage += effect.value; log(`${artifact.name}生效：伤害+${effect.value}`); }
      if (card.type === 'heal' && effect.type === 'healBonus') { result.heal += effect.value; log(`${artifact.name}生效：治疗+${effect.value}`); }
      if (card.type === 'attack' && effect.type === 'comboBonus' && state.cardUseCount > 0 && state.cardUseCount % effect.trigger === 0) { const bonus = Math.floor(result.damage * effect.value); result.damage += bonus; log(`${artifact.name}生效：连击伤害+${bonus}`); }
    });
    return result;
  }

  function playCard(index) {
    const card = state.hand[index];
    if (!card || !canPlay(card)) { log('资源不足，无法使用该卡牌！'); return; }
    state.cardUseCount++;
    if (card.healthCost) state.playerHP -= card.healthCost;
    if (card.type === 'attack') {
      let damage = card.damage || 0;
      if (card.damageFormula === 'lossHealth') damage = Math.floor((state.playerMaxHP - state.playerHP) * (card.damagePercent / 100)) + card.baseDamage;
      damage = applyArtifacts(card, { damage, heal: 0 }).damage;
      if (card.critCondition === 'health>80' && state.playerHP / state.playerMaxHP > 0.8) damage = Math.floor(damage * 1.5);
      const hits = card.hits || 1;
      for (let i = 0; i < hits; i++) {
        let hitDamage = damage;
        if (card.hasCrit && Math.random() < 0.3) { hitDamage = Math.floor(hitDamage * 1.5); log('暴击！'); }
        state.enemyHP = Math.max(0, state.enemyHP - hitDamage);
        log(hits > 1 ? `你使用 ${card.name} 第${i + 1}段造成 ${hitDamage} 伤害` : `你使用 ${card.name} 造成 ${hitDamage} 伤害`);
      }
      if (card.heal) state.playerHP = Math.min(state.playerMaxHP, state.playerHP + card.heal);
      const lifesteal = state.activeArtifacts.filter(item => item.effect.type === 'lifesteal').reduce((sum, item) => sum + Math.round(damage * item.effect.value), 0);
      if (lifesteal) { state.playerHP = Math.min(state.playerMaxHP, state.playerHP + lifesteal); log(`吸血回复 ${lifesteal}`); }
    }
    if (card.type === 'heal') {
      const heal = applyArtifacts(card, { damage: 0, heal: card.heal || 0 }).heal;
      state.playerHP = Math.min(state.playerMaxHP, state.playerHP + heal);
      if (card.manaRestore) state.mana = Math.min(state.playerMaxMana, state.mana + card.manaRestore);
      log(`你使用 ${card.name} 恢复 ${heal} 生命`);
    }
    if (card.type === 'buff') {
      if (card.effectType === 'maxHealth') { const bonus = Math.floor(state.playerMaxHP * (card.effectPercent / 100)); state.playerMaxHP += bonus; state.playerHP += bonus; log(`生命上限提升 ${bonus}`); }
      else { state.actions += 1; log(`${card.name} 生效：行动+1`); }
    }
    state.actions -= card.cost || 0;
    if (card.manaCost) {
      let cost = card.manaCost;
      state.activeArtifacts.forEach(item => { if (item.effect.type === 'reduceMana') cost = Math.max(0, cost - item.effect.value); });
      state.mana -= cost;
    }
    state.hand.splice(index, 1);
    if (!checkVictory()) render();
  }

  function resolveEnemyIntent() {
    const intent = state.enemyIntent || EnemySystem.chooseIntent(state.stage);
    log(`敌人执行：${intent.name}`);
    if (intent.damage) {
      let damage = intent.damage;
      state.activeArtifacts.forEach(item => { if (item.effect.type === 'damageReduction') damage = Math.max(0, damage - item.effect.value); });
      for (let i = 0; i < (intent.hits || 1); i++) { state.playerHP = Math.max(0, state.playerHP - damage); log((intent.hits || 1) > 1 ? `敌人第${i + 1}段造成 ${damage} 伤害` : `敌人造成 ${damage} 伤害`); }
    }
    if (intent.heal) { state.enemyHP = Math.min(state.enemyMaxHP, state.enemyHP + intent.heal); log(`敌人回复 ${intent.heal} 生命`); }
  }

  function endTurn() {
    resolveEnemyIntent();
    state.mana = Math.min(state.playerMaxMana, state.mana + 1 + (state.talents.manaRegen || 0));
    state.cardUseCount = 0;
    if (checkVictory()) return;
    setNextIntent();
    drawHand();
  }

  function checkVictory() {
    if (state.playerHP <= 0) { alert('你失败了！'); location.reload(); return true; }
    if (state.enemyHP <= 0) {
      const stones = Math.floor(Math.random() * 4) + 2;
      state.spiritStones += stones;
      if (state.currentNode?.type === 'elite') state.spiritStones += 8;
      if (state.currentNode?.type === 'boss') state.spiritStones += 18;
      if (Math.random() < 0.08) gainArtifact();
      showUpgrade();
      return true;
    }
    return false;
  }

  function gainXP(value) {
    state.xp += value;
    while (state.xp >= state.level * 10) {
      state.xp -= state.level * 10;
      state.level++;
      showTalents();
      if (state.level >= 11) state.maxArtifactSlots = 2;
    }
  }

  function showModal(html) {
    $('modal').className = 'modal show';
    $('modal').innerHTML = `<div class="panel">${html}</div>`;
  }

  function closeModal() {
    $('modal').className = 'modal';
    $('modal').innerHTML = '';
    render();
  }

  function showUpgrade() {
    const options = shuffle(allCards).slice(0, 2);
    showModal(`<h2>胜利！选择一张卡</h2><p class="sub">新卡加入，已有卡升级</p><div class="cards">${options.map((card, index) => `<div data-upgrade="${index}">${cardHtml(card, index, false)}</div>`).join('')}</div>`);
    document.querySelectorAll('[data-upgrade]').forEach(button => button.onclick = () => selectUpgrade(options[Number(button.dataset.upgrade)]));
  }

  function selectUpgrade(card) {
    const existing = state.playerDeck.find(item => item.name === card.name);
    if (existing) { existing.level = (existing.level || 1) + 1; if (existing.damage) existing.damage += existing.upgradePerLevel || 2; if (existing.heal) existing.heal += existing.upgradePerLevel || 2; }
    else state.playerDeck.push({ ...card });
    showDeckEditor();
  }

  function showDeckEditor() {
    showModal(`<h2>卡组编辑器</h2><p class="sub">点击卡牌可移除，卡组数量不超过 15 时可继续路线</p><div>卡组数量：${state.playerDeck.length} / 15</div><div class="deck-grid">${state.playerDeck.map((card, index) => `<button class="deck-card" data-remove="${index}"><b>${card.name}</b><br>Lv${card.level || 1}<br>${card.desc}<br><small>点击移除</small></button>`).join('')}</div><button class="primary" ${state.playerDeck.length > 15 ? 'disabled' : ''} data-next>确认并返回路线</button>`);
    document.querySelectorAll('[data-remove]').forEach(button => button.onclick = () => { state.playerDeck.splice(Number(button.dataset.remove), 1); showDeckEditor(); });
    document.querySelector('[data-next]').onclick = () => { closeModal(); gainXP(10); state.stage++; if (state.currentNode) MapSystem.completeNode(state.map, state.currentNode.id); state.currentNode = null; state.screen = 'map'; render(); };
  }

  function showTalents() {
    const talents = [
      { type: 'mana', name: '初始魔力 +1', desc: '每关开始时魔力值增加1点' },
      { type: 'draw', name: '每回合抽牌 +1', desc: '每回合额外抽1张牌' },
      { type: 'actions', name: '每回合行动力 +1', desc: '每回合行动点增加1' },
      { type: 'maxHP', name: '最大生命值 +10', desc: '提升生命上限并恢复10点' }
    ];
    showModal(`<h2>升级成功！选择永久天赋</h2><div class="choice-grid">${talents.map((talent, index) => `<button class="talent-item" data-talent="${index}"><b>${talent.name}</b><br>${talent.desc}</button>`).join('')}</div>`);
    document.querySelectorAll('[data-talent]').forEach(button => button.onclick = () => { const type = talents[Number(button.dataset.talent)].type; if (type === 'maxHP') { state.playerMaxHP += 10; state.playerHP += 10; } if (type === 'actions') state.talents.actions++; if (type === 'draw') state.talents.draw++; if (type === 'mana') state.talents.mana++; closeModal(); });
  }

  function gainArtifact() {
    const artifact = { ...pick(allArtifacts) };
    state.ownedArtifacts.push(artifact);
    if (state.activeArtifacts.length < state.maxArtifactSlots) state.activeArtifacts.push(artifact);
    log(`获得法宝：${artifact.name}`);
  }

  function showBag() {
    showModal(`<h2>法宝装备</h2><p class="sub">法宝是可切换装备，不占用永久天赋。可装备${state.maxArtifactSlots}件（已装备${state.activeArtifacts.length}件）</p><div class="choice-grid">${state.ownedArtifacts.map((artifact, index) => `<button class="artifact-item" data-equip="${index}"><h3>${artifact.icon} ${artifact.name}</h3><p>${artifact.desc}</p><small>${state.activeArtifacts.some(active => active.id === artifact.id) ? '点击卸下' : '点击装备'}</small></button>`).join('') || '<p class="sub">背包为空，击败敌人或事件可获得法宝</p>'}</div><button class="primary" data-close>关闭</button>`);
    document.querySelector('[data-close]').onclick = closeModal;
    document.querySelectorAll('[data-equip]').forEach(button => button.onclick = () => { const artifact = state.ownedArtifacts[Number(button.dataset.equip)]; if (state.activeArtifacts.some(active => active.id === artifact.id)) state.activeArtifacts = state.activeArtifacts.filter(active => active.id !== artifact.id); else if (state.activeArtifacts.length < state.maxArtifactSlots) state.activeArtifacts.push(artifact); else state.activeArtifacts[0] = artifact; showBag(); });
  }

  function resolveMapNode(node) {
    if (['battle', 'elite', 'boss'].includes(node.type)) { prepareCombat(node); return; }
    if (node.type === 'event') { showEventRoom(node); return; }
    if (node.type === 'rest') { const heal = Math.max(8, Math.floor(state.playerMaxHP * 0.32)); state.playerHP = Math.min(state.playerMaxHP, state.playerHP + heal); alert(`调息恢复 ${heal} 点生命`); }
    if (node.type === 'shop') { if (state.spiritStones >= 10) { state.spiritStones -= 10; state.playerHP = Math.min(state.playerMaxHP, state.playerHP + 10); alert('花费 10 灵石补给，恢复 10 点生命'); } else { state.spiritStones += 3; alert('商队赠予盘缠，获得 3 灵石'); } }
    MapSystem.completeNode(state.map, node.id);
    render();
  }

  function showEventRoom(node) {
    const options = [
      { id: 'caveCard', name: '洞府奇遇', desc: '获得一张随机功法卡。' },
      { id: 'demonTrade', name: '魔道交易', desc: '损失 8 生命，获得 18 灵石。', disabled: state.playerHP <= 8, disabledReason: '生命不足' },
      { id: 'spiritGarden', name: '灵药园', desc: '恢复 14 点生命。' },
      { id: 'ancientRelic', name: '古修遗迹', desc: '花费 16 灵石，获得 1 件随机法宝。', disabled: state.spiritStones < 16, disabledReason: '灵石不足' },
      { id: 'forgetCard', name: '焚毁旧术', desc: '花费 8 灵石，删除一张随机卡。', disabled: state.spiritStones < 8 || state.playerDeck.length <= 1, disabledReason: '条件不足' }
    ].sort(() => Math.random() - 0.5).slice(0, 3);
    showModal(`<h2>事件房间</h2><p class="sub">机缘当前，择其一而行。</p><div class="choice-grid">${options.map((option, index) => `<button class="choice" data-event="${index}" ${option.disabled ? 'disabled' : ''}><b>${option.name}</b><br>${option.desc}${option.disabled ? `<br><small>${option.disabledReason}</small>` : ''}</button>`).join('')}</div>`);
    document.querySelectorAll('[data-event]').forEach(button => button.onclick = () => selectEventOption(options[Number(button.dataset.event)], node));
  }

  function selectEventOption(option, node) {
    if (!option || option.disabled) return;
    if (option.id === 'caveCard') state.playerDeck.push({ ...pick(allCards) });
    if (option.id === 'demonTrade') { state.playerHP -= 8; state.spiritStones += 18; }
    if (option.id === 'spiritGarden') state.playerHP = Math.min(state.playerMaxHP, state.playerHP + 14);
    if (option.id === 'ancientRelic') { state.spiritStones -= 16; gainArtifact(); }
    if (option.id === 'forgetCard') { state.spiritStones -= 8; state.playerDeck.splice(Math.floor(Math.random() * state.playerDeck.length), 1); }
    MapSystem.completeNode(state.map, node.id);
    closeModal();
    state.screen = 'map';
    render();
  }

  document.addEventListener('click', event => {
    const mapButton = event.target.closest('[data-map-node]');
    if (mapButton) { const node = MapSystem.getNode(state.map, mapButton.dataset.mapNode); if (node && ['available', 'selected'].includes(MapSystem.nodeStatus(state.map, node.id))) { state.map.selectedNodeId = node.id; render(); } return; }
    const enterButton = event.target.closest('[data-enter-node]');
    if (enterButton) { const node = MapSystem.getNode(state.map, enterButton.dataset.enterNode); if (node && MapSystem.nodeStatus(state.map, node.id) !== 'locked') resolveMapNode(node); return; }
    const playButton = event.target.closest('[data-play]');
    if (playButton) { playCard(Number(playButton.dataset.play)); return; }
    if (event.target.closest('[data-end]')) { endTurn(); return; }
    if (event.target.closest('[data-bag]')) showBag();
  });

  render();
})();
