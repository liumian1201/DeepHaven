// Deep Haven — 设施数据 (Phase 1: v2 废土风)
// ============================================================

// 材料中文名映射
var MAT_NAMES = {
  wood:       '🪵 木材',
  scrap_iron: '🔩 废铁',
  plastic:    '🧴 塑料',
  cloth:      '🧵 布料',
  fuel:       '⛽ 燃料',
};

var MAT_KEYS = ['wood', 'scrap_iron', 'plastic', 'cloth', 'fuel'];

// ============================================================
//  设施定义  { id: { name, lvs:[], 属性键: [每级值], cost:{材料:[每级量]}, sp:[SP替代每级] } }
// ============================================================

var FACILITIES = {

  // ── 💧 水资源 (Phase 1: Lv.0~3) ──
  water: {
    name: '💧 水资源',
    lvs: ['破旧接水盆', '简易沙石过滤罐', '木炭净水桶'],
    daily_water: [1, 2, 3],
    cost: {
      plastic:    [2, 2, 3],
      cloth:      [0, 2, 2],
      fuel:       [0, 0, 3],
    },
    sp: [20, 50, 100],
  },

  // ── 🛡️ 防御 (Phase 1: Lv.0~3) ──
  defense: {
    name: '🛡️ 防御',
    lvs: ['破木板封窗', '铁丝网路障', '沙袋掩体'],
    defense: [5, 12, 20],
    cost: {
      wood:       [5, 0, 0],
      scrap_iron: [0, 4, 0],
      cloth:      [0, 0, 5],
      fuel:       [0, 0, 0],
    },
    sp: [30, 60, 120],
  },

  // ── 🛏️ 起居 (Phase 1: Lv.0~1) ──
  living: {
    name: '🛏️ 起居',
    lvs: ['木板床'],
    comfort: [2],
    cost: {
      wood: [5],
      scrap_iron: [0],
    },
    sp: [40],
  },

  // ── 🔥 能源 (Phase 1: Lv.0~1) ──
  energy: {
    name: '🔥 能源',
    lvs: ['蜡烛/油灯'],
    comfort: [1],
    cost: {
      cloth: [2],
      fuel:  [1],
    },
    sp: [25],
  },

  // ── ⚙️ 工作台 (Phase 1: Lv.0~1) ──
  workbench: {
    name: '⚙️ 工作台',
    lvs: ['简易木制工作台'],
    comfort: [0],
    cost: {
      wood:       [10],
      scrap_iron: [0],
    },
    sp: [50],
    // Lv.1 解锁：木炭制造
  },

};
