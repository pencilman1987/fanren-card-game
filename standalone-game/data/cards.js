window.GameCards = (() => {
  const initialDeck = [
    { name: "青元剑芒", type: "attack", cost: 1, manaCost: 0, damage: 5, desc: "造成5点伤害", level: 1 },
    { name: "火弹术", type: "attack", cost: 1, manaCost: 2, damage: 10, desc: "造成10点伤害", level: 1 },
    { name: "长春回元术", type: "heal", cost: 1, manaCost: 0, heal: 4, desc: "恢复4点生命", level: 1 }
  ];

  const allCards = [
    ...initialDeck,
    { name: "辟邪重剑", type: "attack", cost: 1, manaCost: 1, damage: 10, desc: "造成10点伤害，并具有暴击效果", level: 1, hasCrit: true },
    { name: "三转青元斩", type: "attack", cost: 1, manaCost: 0, damage: 5, hits: 2, desc: "造成5点伤害x2次，并具有暴击效果", level: 1, hasCrit: true },
    { name: "长春冥想术", type: "heal", cost: 1, manaCost: 0, heal: 1, manaRestore: 1, desc: "恢复1点生命，并恢复1点魔力", level: 1 },
    { name: "梵圣真魔焚", type: "attack", cost: 1, manaCost: 3, damage: 20, desc: "造成20点伤害，并附带灼烧效果", level: 1, hasBurn: true },
    { name: "疾风九变", type: "attack", cost: 0, manaCost: 0, damage: 6, desc: "造成6点伤害", level: 1 },
    { name: "涅槃金身", type: "heal", cost: 1, manaCost: 3, heal: 15, desc: "恢复15点生命", level: 1 },
    { name: "煞影千幻诀", type: "attack", cost: 1, manaCost: 0, healthCost: 5, damageFormula: "lossHealth", baseDamage: 8, damagePercent: 50, desc: "造成损失生命值的50%加8点伤害", level: 1, upgradePerLevel: 2 },
    { name: "惊蛰化龙", type: "buff", cost: 1, manaCost: 5, healthCost: 5, effectType: "maxHealth", effectPercent: 10, desc: "提升生命上限10%", level: 1, upgradePerLevel: 2 },
    { name: "天煞镇狱功", type: "attack", cost: 1, manaCost: 0, damage: 4, heal: 4, desc: "造成4点伤害并回复4点生命", level: 1, upgradePerLevel: 2 },
    { name: "十方真魄", type: "attack", cost: 1, manaCost: 0, damage: 10, desc: "造成10点伤害；生命高于80%时必定暴击", level: 1, critCondition: "health>80", upgradePerLevel: 2 }
  ];

  return {
    initialDeck,
    allCards
  };
})();
