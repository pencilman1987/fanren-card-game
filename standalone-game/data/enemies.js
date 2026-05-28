window.GameEnemies = (() => {
  const profiles = [
    {
      key: "beast",
      name: "妖兽",
      trait: "高血量，常以护体拖长战斗。",
      hpMultiplier: 1.38,
      damageMultiplier: 0.9,
      weights: [
        { type: "attack", weight: 38 },
        { type: "maul", weight: 22 },
        { type: "guard", weight: 28 },
        { type: "meditate", weight: 12 }
      ]
    },
    {
      key: "demon",
      name: "魔修",
      trait: "攻击会吸血，越拖越难处理。",
      hpMultiplier: 1,
      damageMultiplier: 1,
      weights: [
        { type: "attack", weight: 34 },
        { type: "bloodDrain", weight: 34 },
        { type: "heavyAttack", weight: 18 },
        { type: "meditate", weight: 14 }
      ]
    },
    {
      key: "sword",
      name: "剑修",
      trait: "多段连击，伤害更容易穿透防御。",
      hpMultiplier: 0.9,
      damageMultiplier: 1.05,
      weights: [
        { type: "attack", weight: 30 },
        { type: "flurry", weight: 38 },
        { type: "heavyAttack", weight: 18 },
        { type: "guard", weight: 14 }
      ]
    },
    {
      key: "elder",
      name: "老怪",
      trait: "会频繁蓄力，下一击极重。",
      hpMultiplier: 1.12,
      damageMultiplier: 1.1,
      weights: [
        { type: "attack", weight: 30 },
        { type: "ultimate", weight: 30 },
        { type: "guard", weight: 16 },
        { type: "meditate", weight: 24 }
      ]
    }
  ];

  function realmName(stage) {
    if (stage <= 10) return "炼气期";
    if (stage <= 20) return "筑基期";
    if (stage <= 30) return "结丹级";
    if (stage <= 50) return "元婴期";
    if (stage <= 70) return "化神期";
    if (stage <= 90) return "炼虚期";
    if (stage <= 110) return "合体期";
    if (stage <= 130) return "大乘期";
    return "域外";
  }

  function getEnemyProfile(stage) {
    return profiles[(Math.max(1, stage) - 1) % profiles.length];
  }

  function getEnemyType(stage) {
    const profile = getEnemyProfile(stage);
    return `${realmName(stage)}${profile.name}`;
  }

  function getEnemyStats(stage) {
    const profile = getEnemyProfile(stage);
    const baseDamage = 4 + Math.floor(stage / 2);
    return {
      damage: Math.max(1, Math.floor(baseDamage * profile.damageMultiplier)),
      mana: Math.min(stage * 2, 10),
      actions: Math.min(stage, 3),
      hpMultiplier: profile.hpMultiplier,
      trait: profile.trait,
      profileKey: profile.key
    };
  }

  function weightedPick(items) {
    const total = items.reduce((sum, item) => sum + item.weight, 0);
    let roll = Math.random() * total;
    for (const item of items) {
      roll -= item.weight;
      if (roll <= 0) return item.type;
    }
    return items[0].type;
  }

  function createIntent(type, stage) {
    const stats = getEnemyStats(stage);
    if (type === "heavyAttack") {
      const damage = Math.ceil(stats.damage * 1.55);
      return { type, icon: "!", name: "重击", summary: `造成 ${damage} 伤害`, damage };
    }
    if (type === "maul") {
      const damage = Math.ceil(stats.damage * 1.25);
      const heal = Math.max(2, Math.floor(stats.damage * 0.45));
      return { type, icon: "爪", name: "兽性扑杀", summary: `造成 ${damage} 伤害，回复 ${heal}`, damage, heal };
    }
    if (type === "bloodDrain") {
      const damage = Math.ceil(stats.damage * 1.1);
      const drain = Math.max(2, Math.floor(damage * 0.7));
      return { type, icon: "血", name: "血炼术", summary: `造成 ${damage} 伤害，吸血 ${drain}`, damage, heal: drain };
    }
    if (type === "flurry") {
      const hitDamage = Math.max(2, Math.floor(stats.damage * 0.58));
      return { type, icon: "连", name: "飞剑连斩", summary: `连续 3 次，每次 ${hitDamage}`, damage: hitDamage, hits: 3 };
    }
    if (type === "ultimate") {
      const damage = Math.ceil(stats.damage * 2.25);
      return { type, icon: "劫", name: "蓄力大招", summary: `造成 ${damage} 伤害`, damage };
    }
    if (type === "guard") {
      const heal = Math.max(3, Math.floor(stats.damage * 0.85));
      return { type, icon: "盾", name: "护体", summary: `回复 ${heal} 生命`, heal };
    }
    if (type === "meditate") {
      const heal = Math.max(2, Math.floor(stats.damage * 0.45));
      return { type, icon: "息", name: "调息", summary: `回复 ${heal} 生命`, heal };
    }
    return { type: "attack", icon: "斩", name: "攻击", summary: `造成 ${stats.damage} 伤害`, damage: stats.damage };
  }

  function chooseIntent(stage, previousIntentType) {
    const profile = getEnemyProfile(stage);
    let pool = profile.weights;
    if (["heavyAttack", "ultimate"].includes(previousIntentType)) {
      pool = profile.weights.filter(intent => !["heavyAttack", "ultimate"].includes(intent.type));
    }
    return createIntent(weightedPick(pool), stage);
  }

  return {
    getEnemyProfile,
    getEnemyType,
    getEnemyStats,
    chooseIntent
  };
})();
