// Deep Haven — 探索地点 (Phase 1: v2 废土风)
// ============================================================

var LOCATIONS = [

  // ★ 低危险
  {
    id: 'supermarket',
    name: '🏪 废弃超市',
    danger: 1,
    rewards: {
      food:   [1, 3],
      water:  [0, 1],
      plastic:[1, 2],
      cloth:  [1, 2],
    },
    eventRate: 0.25,
  },

  // ★★
  {
    id: 'police',
    name: '🚔 警察局',
    danger: 2,
    rewards: {
      scrap_iron: [2, 4],
      cloth:      [1, 2],
    },
    special: '有概率找到弹药',
    eventRate: 0.30,
  },

  // ★★★
  {
    id: 'hospital',
    name: '🏥 中心医院',
    danger: 3,
    rewards: {
      plastic: [2, 3],
      cloth:   [2, 3],
      fuel:    [1, 2],
    },
    special: '抗生素（极稀有）',
    eventRate: 0.25,
  },

  // ★
  {
    id: 'school',
    name: '🏫 废弃学校',
    danger: 1,
    rewards: {
      food: [1, 2],
      wood: [2, 4],
      cloth:[1, 2],
    },
    special: '书籍（解锁配方）',
    eventRate: 0.30,
  },

  // ★★★★
  {
    id: 'factory',
    name: '🏭 工业区',
    danger: 4,
    rewards: {
      scrap_iron: [3, 6],
      wood:       [1, 4],
    },
    special: '零件、电机',
    eventRate: 0.40,
  },

  // ★★
  {
    id: 'gas_station',
    name: '⛽ 加油站',
    danger: 2,
    rewards: {
      scrap_iron: [1, 3],
      plastic:    [1, 2],
      fuel:       [2, 4],
    },
    eventRate: 0.25,
  },

  // ★★★
  {
    id: 'tower',
    name: '📡 通讯塔废墟',
    danger: 3,
    rewards: {
      scrap_iron: [2, 4],
      plastic:    [1, 2],
    },
    special: '电子元件',
    eventRate: 0.35,
  },

];
