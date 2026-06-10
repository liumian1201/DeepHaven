var MAT_NAMES={"wood":"🪵 木材","scrap_iron":"🔩 废铁","plastic":"🧴 塑料","cloth":"🧵 布料","fuel":"⛽ 燃料","1jsq":"1级净水器","1jjsq":"1级净水器"};
var MAT_KEYS=["wood","scrap_iron","plastic","cloth","fuel","1jsq","1jjsq"];
var MAT_CATS={"wood":"原材料","scrap_iron":"原材料","plastic":"原材料","cloth":"原材料","fuel":"原材料","1jsq":"原材料","1jjsq":"建筑/1级建筑"};
var CATEGORIES=["加工品","武器","防具","工具","建筑","食物","药品","消耗品","书籍","建筑/1级建筑"];
var FACILITIES={
  "water": {
    "name": "💧 水资源",
    "lvs": [
      "破旧接水盆",
      "简易沙石过滤罐",
      "木炭净水桶"
    ],
    "sp": [
      20,
      50,
      100
    ],
    "cost": {
      "plastic": [
        2,
        2,
        3
      ],
      "cloth": [
        0,
        2,
        2
      ],
      "fuel": [
        0,
        0,
        3
      ]
    },
    "daily_output": {
      "water": [
        1,
        2,
        3
      ]
    },
    "effects": {
      "water_out": [
        1,
        2,
        3
      ]
    }
  },
  "defense": {
    "name": "🛡️ 防御",
    "lvs": [
      "破木板封窗",
      "铁丝网路障",
      "沙袋掩体"
    ],
    "sp": [
      30,
      60,
      120
    ],
    "cost": {
      "wood": [
        5
      ],
      "scrap_iron": [
        0,
        4
      ],
      "cloth": [
        0,
        0,
        5
      ]
    },
    "effects": {
      "defense": [
        5,
        12,
        20
      ]
    }
  },
  "living": {
    "name": "🛏️ 起居",
    "lvs": [
      "木板床"
    ],
    "sp": [
      40
    ],
    "cost": {
      "wood": [
        5
      ]
    },
    "effects": {
      "comfort": [
        2
      ]
    }
  },
  "energy": {
    "name": "🔥 能源",
    "lvs": [
      "蜡烛/油灯"
    ],
    "sp": [
      25
    ],
    "cost": {
      "cloth": [
        2
      ],
      "fuel": [
        1
      ]
    },
    "effects": {
      "comfort": [
        1
      ]
    }
  },
  "workbench": {
    "name": "⚙️ 工作台",
    "lvs": [
      "简易木制工作台"
    ],
    "sp": [
      50
    ],
    "cost": {
      "wood": [
        10
      ]
    }
  }
};
