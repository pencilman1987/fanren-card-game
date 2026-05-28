window.GameMap = (() => {
  const nodeTypes = {
    battle: { label: "普通战斗", shortLabel: "战", icon: "剑", desc: "稳定获得卡牌成长与灵石。" },
    elite: { label: "精英", shortLabel: "英", icon: "煞", desc: "更危险，但奖励更丰厚。" },
    shop: { label: "商店", shortLabel: "商", icon: "市", desc: "用灵石换取补给。" },
    rest: { label: "休息", shortLabel: "息", icon: "炉", desc: "恢复生命，整理状态。" },
    event: { label: "事件", shortLabel: "缘", icon: "?", desc: "机缘与风险并存。" },
    boss: { label: "Boss", shortLabel: "首", icon: "劫", desc: "本段仙路的最终考验。" }
  };

  const floorTypes = [
    ["battle", "battle", "event"],
    ["battle", "shop", "battle"],
    ["elite", "battle", "event"],
    ["rest", "shop", "battle"],
    ["battle", "elite", "event"],
    ["battle", "rest", "shop"],
    ["elite", "battle", "event"],
    ["rest", "battle", "shop"],
    ["elite", "battle", "battle"],
    ["rest", "shop", "event"]
  ];

  const shuffle = array => [...array].sort(() => Math.random() - 0.5);

  function createNode(seed, floor, lane, type, totalLanes) {
    const center = totalLanes === 1 ? 50 : 20 + lane * (60 / (totalLanes - 1));
    const drift = totalLanes === 1 ? 0 : (Math.random() * 7 - 3.5);
    return {
      id: `node_${seed}_${floor}_${lane}`,
      floor,
      lane,
      type,
      x: Math.max(10, Math.min(90, Math.round(center + drift))),
      y: Math.round(92 - floor * 8.1),
      next: []
    };
  }

  function createMap() {
    const seed = Date.now().toString(36);
    const floors = floorTypes.map((types, floor) => {
      return shuffle(types).map((type, lane) => createNode(seed, floor, lane, type, types.length));
    });
    floors.push([createNode(seed, floorTypes.length, 0, "boss", 1)]);

    for (let floor = 0; floor < floors.length - 1; floor++) {
      floors[floor].forEach((node, lane) => {
        const nextRow = floors[floor + 1];
        const next = nextRow.filter(item => item.lane >= lane - 1 && item.lane <= lane + 1);
        node.next = (next.length ? next : [nextRow[Math.min(lane, nextRow.length - 1)]]).map(item => item.id);
      });
    }

    return {
      nodes: floors.flat(),
      completedNodeIds: [],
      currentNodeId: null,
      selectedNodeId: null
    };
  }

  function getNode(map, nodeId) {
    return map.nodes.find(node => node.id === nodeId) || null;
  }

  function availableNodeIds(map) {
    if (!map.currentNodeId) return map.nodes.filter(node => node.floor === 0).map(node => node.id);
    const current = getNode(map, map.currentNodeId);
    if (!current || !map.completedNodeIds.includes(current.id)) return [];
    return current.next || [];
  }

  function nodeStatus(map, nodeId) {
    if (map.completedNodeIds.includes(nodeId)) return "completed";
    if (map.selectedNodeId === nodeId) return "selected";
    if (availableNodeIds(map).includes(nodeId)) return "available";
    return "locked";
  }

  function completeNode(map, nodeId) {
    map.completedNodeIds = Array.from(new Set([...map.completedNodeIds, nodeId]));
    map.currentNodeId = nodeId;
    map.selectedNodeId = null;
  }

  return {
    nodeTypes,
    createMap,
    getNode,
    availableNodeIds,
    nodeStatus,
    completeNode
  };
})();
