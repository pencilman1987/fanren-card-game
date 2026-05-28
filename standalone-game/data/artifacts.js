window.GameArtifacts = (() => {
  const allArtifacts = [
    { id: "artifact_001", name: "烈焰之心", icon: "火", desc: "攻击卡伤害+2", effect: { type: "damageBonus", value: 2 }, level: 1 },
    { id: "artifact_002", name: "生命之露", icon: "露", desc: "治疗卡效果+3", effect: { type: "healBonus", value: 3 }, level: 1 },
    { id: "artifact_003", name: "疾风战靴", icon: "风", desc: "每回合行动力+1", effect: { type: "bonusAction", value: 1 }, level: 1 },
    { id: "artifact_004", name: "秘法卷轴", icon: "卷", desc: "魔力消耗-1", effect: { type: "reduceMana", value: 1 }, level: 1 },
    { id: "artifact_005", name: "吸血面具", icon: "血", desc: "攻击伤害20%转为生命", effect: { type: "lifesteal", value: 0.2 }, level: 1, baseRate: 0.2, perLevelRate: 0.05, maxRate: 0.5 },
    { id: "artifact_006", name: "守护圣盾", icon: "盾", desc: "受到伤害-2", effect: { type: "damageReduction", value: 2 }, level: 1 },
    { id: "artifact_008", name: "智慧指环", icon: "智", desc: "每回合抽牌+1", effect: { type: "bonusDraw", value: 1 }, level: 1 },
    { id: "artifact_010", name: "元素印章", icon: "印", desc: "每使用3张卡，下张卡伤害+50%", effect: { type: "comboBonus", value: 0.5, trigger: 3 }, level: 1 }
  ];

  return {
    allArtifacts
  };
})();
