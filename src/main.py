"""
Deep Haven — Phase 1: Python CLI 原型
末日避难所生存游戏 · 核心循环

运行: python src/main.py
"""

from __future__ import annotations
import json
import random
import os
import sys
from dataclasses import dataclass, field
from typing import Optional

# ============================================================
#  路径工具
# ============================================================

def project_root() -> str:
    return os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def config_path(filename: str) -> str:
    return os.path.join(project_root(), "src", "config", filename)


# ============================================================
#  配置加载
# ============================================================

def load_json(filename: str) -> dict:
    with open(config_path(filename), "r", encoding="utf-8") as f:
        return json.load(f)


# ============================================================
#  游戏状态
# ============================================================

@dataclass
class GameState:
    """全局游戏状态"""
    # 时间
    day: int = 1
    month: int = 1

    # 角色状态
    health: int = 100
    stamina: int = 100
    max_stamina: int = 100

    # 资源
    food: int = 5        # 天数
    water: int = 7       # 天数
    materials: dict = field(default_factory=lambda: {
        "iron": 0, "wood": 0, "plastic": 0, "crystal": 0
    })

    # 双货币
    sp: int = 0             # 生存点 (人的货币)
    energy: int = 100       # 系统能量 (神的货币)
    max_energy: int = 100
    energy_regen: int = 5   # 每日恢复

    # 避难所
    shelter_level: int = 1
    comfort: int = 1
    facilities: dict = field(default_factory=dict)   # {id: level}

    # 探索
    explored_locations: list = field(default_factory=list)

    # 幸存者
    survivors: list = field(default_factory=list)
    max_survivors: int = 3

    # 日志
    log: list = field(default_factory=list)

    # 标志
    game_over: bool = False

    def add_log(self, msg: str) -> None:
        self.log.append(msg)


# ============================================================
#  配置数据（内联，后续迁移到 JSON）
# ============================================================

DISASTERS = {
    1:  {"name": "❄️ 极寒",   "penalty": "外出消耗双倍体力",       "bonus": "怪物活动减少，探索更安全"},
    2:  {"name": "🌧️ 酸雨",   "penalty": "露天设施受损",             "bonus": "酸雨中含稀有元素"},
    3:  {"name": "🧟 尸潮",   "penalty": "怪物主动进攻避难所",       "bonus": "击杀怪物获得晶核"},
    4:  {"name": "🌪️ 灵能风暴","penalty": "系统功能紊乱",            "bonus": "风暴中心掉落顶级材料"},
    5:  {"name": "🔥 热浪",   "penalty": "水消耗翻倍",               "bonus": "地下出现新矿脉"},
    6:  {"name": "🌑 永夜",   "penalty": "太阳能失效",               "bonus": "夜光植物疯长"},
    7:  {"name": "🦠 瘟疫",   "penalty": "角色可能生病",             "bonus": "研发疫苗永久免疫"},
    8:  {"name": "⚡ 电磁暴",  "penalty": "电子设备失效",             "bonus": "残留高能电池"},
    9:  {"name": "🌫️ 灵雾",   "penalty": "地图可见度极低",           "bonus": "雾中隐藏失落建筑"},
    10: {"name": "💀 死寂",   "penalty": "所有产出减半",             "bonus": "发现前代宿主遗产"},
    11: {"name": "🌊 洪水",   "penalty": "低层被淹",                 "bonus": "水中冲来物资"},
    12: {"name": "🌈 回光",   "penalty": "无",                       "bonus": "年末结算，大幅奖励"},
}

FACILITIES = {
    "bed":         {"name": "🛏️ 睡眠区", "levels": ["睡袋", "行军床", "简易卧室", "豪华套房"],
                    "comfort": [1, 3, 6, 10], "cost": {"iron": [0, 2, 5, 10], "wood": [1, 3, 6, 10]},
                    "sp_alternative": [50, 200, 500, 1000]},
    "water":       {"name": "💧 净水系统", "levels": ["简易过滤", "蒸馏器", "净水器", "水循环塔"],
                    "comfort": [2, 4, 7, 12], "daily_water": [1, 2, 4, 8],
                    "cost": {"iron": [2, 5, 10, 20], "plastic": [1, 3, 6, 12]},
                    "sp_alternative": [100, 300, 800, 1500]},
    "power":       {"name": "🔥 能源站", "levels": ["篝火", "发电机", "太阳能阵列", "聚变炉"],
                    "comfort": [1, 4, 8, 15],
                    "cost": {"iron": [3, 8, 15, 30], "crystal": [0, 1, 3, 8]},
                    "sp_alternative": [150, 400, 1000, 2000]},
    "kitchen":     {"name": "🍲 厨房", "levels": ["篝火烹饪", "简易灶台", "自动化厨房", "分子料理台"],
                    "comfort": [1, 3, 6, 10], "food_save": [0, 10, 25, 50],  # 节省食物百分比
                    "cost": {"iron": [1, 4, 8, 16], "wood": [2, 5, 10, 20]},
                    "sp_alternative": [80, 250, 600, 1200]},
    "workshop":    {"name": "🏭 工坊", "levels": ["手工台", "机械工坊", "3D打印车间", "纳米工厂"],
                    "comfort": [0, 2, 5, 10],
                    "cost": {"iron": [5, 12, 25, 50], "plastic": [2, 5, 12, 25]},
                    "sp_alternative": [200, 500, 1200, 2500]},
    "medical":     {"name": "🏥 医疗室", "levels": ["急救包", "简易诊所", "医疗舱", "再生舱"],
                    "comfort": [2, 5, 10, 18], "heal_per_day": [0, 3, 8, 20],
                    "cost": {"plastic": [2, 5, 10, 20], "crystal": [0, 1, 3, 6]},
                    "sp_alternative": [120, 350, 900, 1800]},
    "lab":         {"name": "🔬 实验室", "levels": ["工作台", "简易实验室", "研究所", "量子实验室"],
                    "comfort": [0, 2, 6, 12],
                    "cost": {"iron": [3, 8, 18, 35], "crystal": [1, 3, 6, 12]},
                    "sp_alternative": [180, 450, 1100, 2200]},
    "defense":     {"name": "🛡️ 防御工事", "levels": ["铁丝网", "混凝土墙", "激光栅栏", "能量护盾"],
                    "comfort": [0, 1, 3, 8],
                    "cost": {"iron": [5, 15, 30, 60], "crystal": [0, 2, 5, 10]},
                    "sp_alternative": [200, 600, 1500, 3000]},
}

LOCATIONS = [
    {"id": "supermarket", "name": "🏪 废弃超市",   "danger": 1, "base_food": (1, 3), "base_water": (1, 2),
     "base_iron": (0, 1), "base_plastic": (0, 2), "event_rate": 0.25},
    {"id": "police",      "name": "🚔 警察局",     "danger": 2, "base_iron": (1, 3), "base_plastic": (0, 1),
     "special": "武器零件", "event_rate": 0.35},
    {"id": "hospital",    "name": "🏥 中心医院",   "danger": 3, "base_plastic": (1, 3),
     "special": "药品", "event_rate": 0.30},
    {"id": "school",      "name": "🏫 废弃学校",   "danger": 1, "base_food": (0, 2), "base_wood": (1, 3),
     "special": "书籍（解锁配方）", "event_rate": 0.30},
    {"id": "factory",     "name": "🏭 工业区",     "danger": 4, "base_iron": (2, 5), "base_crystal": (0, 1),
     "event_rate": 0.40},
    {"id": "gas_station", "name": "⛽ 加油站",     "danger": 2, "base_plastic": (1, 3), "base_iron": (0, 2),
     "special": "燃料", "event_rate": 0.25},
]

POSITIVE_EVENTS = [
    "你发现了一个隐藏的地下室，里面堆满了罐头。",          {"food": 3},
    "货架后面倒着一个幸存者的背包，里面有些有用的东西。",    {"sp": 30},
    "你在废墟中发现了一枚发光的晶核，系统能量微微震动。",    {"crystal": 2, "sp": 50},
    "一只变异鼠被你吓跑了，但它留下了巢穴里的物资。",       {"food": 1, "plastic": 2},
    "墙上有人用粉笔写了避难所坐标，也许以后能联系上。",      {"sp": 20},
]

NEGATIVE_EVENTS = [
    "一只畸变体从阴影中扑了出来！你奋力击退了它，但受了伤。",        {"health": -15},
    "地板突然塌陷，你掉进了下层，扭伤了脚踝。",                      {"health": -10},
    "你吸入了有毒的孢子，剧烈咳嗽起来。",                            {"health": -8},
    "一群丧尸堵住了出口，你只能扔下部分物资翻窗逃走。",               {"food": -1, "water": -1},
    "酸雨突然加剧，你在返回途中被严重灼伤。",                        {"health": -20},
]

RARE_EVENTS = [
    {"text": "你发现了一个发光的金属箱子，上面刻着「创世系统·第3任宿主」。里面有大量晶核和一本笔记。",
     "reward": {"crystal": 5, "sp": 200},
     "note": "笔记上写着：「如果你看到这个，说明我已经死了。收割者比我们想象的更强大。不要相信系统的全部话。」"},
    {"text": "废墟深处有一个完好的机甲格纳库！你获得了一台还能运转的动力外骨骼。",
     "reward": {"iron": 10, "plastic": 5, "crystal": 3, "sp": 300}},
    {"text": "你找到了一块「系统碎片」。系统说：『这块碎片……是我的一部分。吸收它，我能恢复更多记忆。』",
     "reward": {"sp": 500, "energy_max": 20}},   # 永久提升能量上限
]


# ============================================================
#  引擎函数
# ============================================================

def current_disaster(state: GameState) -> dict:
    """获取当前月份的天灾"""
    m = ((state.day - 1) // 30) % 12 + 1
    state.month = m
    return DISASTERS[m]


def calc_comfort(state: GameState) -> int:
    """计算避难所舒适度"""
    total = 1  # 基础
    for fid, level in state.facilities.items():
        if fid in FACILITIES:
            total += FACILITIES[fid]["comfort"][level - 1]
    return total


def calc_food_save(state: GameState) -> int:
    """计算食物节省百分比"""
    if "kitchen" in state.facilities:
        lv = state.facilities["kitchen"]
        return FACILITIES["kitchen"]["food_save"][lv - 1]
    return 0


def calc_heal(state: GameState) -> int:
    """计算每日自动回血"""
    if "medical" in state.facilities:
        lv = state.facilities["medical"]
        return FACILITIES["medical"]["heal_per_day"][lv - 1]
    return 0


def daily_water_output(state: GameState) -> int:
    """净水系统每日产水"""
    if "water" in state.facilities:
        lv = state.facilities["water"]
        return FACILITIES["water"]["daily_water"][lv - 1]
    return 0


# ============================================================
#  行动：探索
# ============================================================

def action_explore(state: GameState) -> None:
    """大地图探索"""
    print("\n" + "=" * 50)
    print("  🗺️  探索大地图")
    print("=" * 50)

    # 显示可选地点
    available = [loc for loc in LOCATIONS if loc["id"] not in state.explored_locations[-3:]]
    if not available:
        available = LOCATIONS[:]

    for i, loc in enumerate(available, 1):
        danger_stars = "★" * loc["danger"]
        print(f"  [{i}] {loc['name']}  危险度: {danger_stars}")

    print(f"  [0] 返回")

    try:
        choice = int(input("\n  选择探索地点: ").strip())
    except ValueError:
        print("  ❌ 无效选择")
        return

    if choice == 0:
        return
    if choice < 1 or choice > len(available):
        print("  ❌ 无效选择")
        return

    loc = available[choice - 1]

    # 消耗体力（天灾影响）
    disaster = current_disaster(state)
    stamina_cost = 15 + loc["danger"] * 5
    if "极寒" in disaster["name"]:
        stamina_cost *= 2

    if state.stamina < stamina_cost:
        print(f"  ❌ 体力不足（需要 {stamina_cost}，当前 {state.stamina}）")
        return

    state.stamina -= stamina_cost

    print(f"\n  ⏳ 正在探索 {loc['name']}...")
    print(f"  体力 -{stamina_cost}")

    # 基础收获
    rewards = {}
    for key in ["food", "water", "iron", "wood", "plastic", "crystal"]:
        field_key = f"base_{key}"
        if field_key in loc:
            lo, hi = loc[field_key]
            amount = random.randint(lo, hi)
            if amount > 0:
                rewards[key] = amount

    # 应用收获
    apply_rewards(state, rewards, loc["name"])

    # 事件掷骰
    if random.random() < loc["event_rate"]:
        if random.random() < 0.8:
            # 正面事件
            event_text, event_rewards = random.choice(POSITIVE_EVENTS)
            state.add_log(f"  ✨ {event_text}")
            print(f"  ✨ {event_text}")
            apply_rewards(state, event_rewards, "")
        else:
            # 负面事件
            event_text, event_penalty = random.choice(NEGATIVE_EVENTS)
            state.add_log(f"  ⚠️ {event_text}")
            print(f"  ⚠️ {event_text}")
            apply_rewards(state, event_penalty, "")

    # 稀有掉落 (5%)
    if random.random() < 0.05:
        rare = random.choice(RARE_EVENTS)
        state.add_log(f"  💎 {rare['text']}")
        print(f"  💎 {rare['text']}")
        apply_rewards(state, rare["reward"], "")
        if "note" in rare:
            state.add_log(f"     📝 {rare['note']}")
            print(f"     📝 {rare['note']}")
        if "energy_max" in rare:
            state.max_energy += rare["energy_max"]
            state.energy += rare["energy_max"]
            print(f"     ⚡ 系统能量上限永久 +{rare['energy_max']}！")


def apply_rewards(state: GameState, rewards: dict, source: str) -> None:
    """应用奖励到状态"""
    for key, val in rewards.items():
        if val == 0:
            continue
        if key == "sp":
            state.sp += val
            if source:
                state.add_log(f"  SP +{val} (from {source})")
                print(f"  SP +{val}")
        elif key == "health":
            state.health = max(0, min(100, state.health + val))
            state.add_log(f"  健康 {'+' if val > 0 else ''}{val}")
            print(f"  健康 {'+' if val > 0 else ''}{val}")
        elif key in state.materials:
            state.materials[key] = max(0, state.materials[key] + val)
            state.add_log(f"  {key} {'+' if val > 0 else ''}{val}")
            print(f"  {key} {'+' if val > 0 else ''}{val}")
        elif key == "food":
            state.food = max(0, state.food + val)
            state.add_log(f"  食物 {'+' if val > 0 else ''}{val}天")
            print(f"  食物 {'+' if val > 0 else ''}{val}天")
        elif key == "water":
            state.water = max(0, state.water + val)
            state.add_log(f"  水 {'+' if val > 0 else ''}{val}天")
            print(f"  水 {'+' if val > 0 else ''}{val}天")


# ============================================================
#  行动：建造/升级设施
# ============================================================

def action_build(state: GameState) -> None:
    """建造或升级设施"""
    print("\n" + "=" * 50)
    print("  🏗️  避难所建设")
    print("=" * 50)

    # 列出所有设施
    items = []
    for fid, fac in FACILITIES.items():
        current_lv = state.facilities.get(fid, 0)
        if current_lv < len(fac["levels"]):
            next_lv = current_lv + 1
            items.append((fid, fac, current_lv, next_lv))

    for i, (fid, fac, cur_lv, next_lv) in enumerate(items, 1):
        target_idx = next_lv - 1
        name = fac["name"]
        level_name = fac["levels"][target_idx]
        costs = []
        for mat, amounts in fac["cost"].items():
            if target_idx < len(amounts):
                costs.append(f"{mat}x{amounts[target_idx]}")
        sp_cost = fac["sp_alternative"][target_idx]
        status = f"Lv.{cur_lv} → Lv.{next_lv}" if cur_lv > 0 else "新建"
        print(f"  [{i}] {name}  {status}: {level_name}")
        print(f"       材料: {', '.join(costs)}  或用 SP: {sp_cost}")

    print(f"  [0] 返回")

    try:
        choice = int(input("\n  选择建造项目: ").strip())
    except ValueError:
        print("  ❌ 无效选择")
        return

    if choice == 0:
        return
    if choice < 1 or choice > len(items):
        print("  ❌ 无效选择")
        return

    fid, fac, cur_lv, next_lv = items[choice - 1]
    target_idx = next_lv - 1
    sp_cost = fac["sp_alternative"][target_idx]

    # 检查是否用 SP
    use_sp = False
    has_materials = True
    for mat, amounts in fac["cost"].items():
        if target_idx < len(amounts) and amounts[target_idx] > 0:
            if state.materials.get(mat, 0) < amounts[target_idx]:
                has_materials = False
                break

    if not has_materials:
        print(f"\n  ⚠️ 材料不足。可以用 {sp_cost} SP 代替材料完成升级。")
        print(f"     当前 SP: {state.sp}")
        ans = input("  使用 SP 代替材料? (y/n): ").strip().lower()
        if ans == "y":
            use_sp = True
        else:
            return

    # 执行建造
    if not use_sp:
        for mat, amounts in fac["cost"].items():
            if target_idx < len(amounts):
                state.materials[mat] -= amounts[target_idx]
    else:
        if state.sp < sp_cost:
            print(f"  ❌ SP 不足（需要 {sp_cost}，当前 {state.sp}）")
            return
        state.sp -= sp_cost

    state.facilities[fid] = next_lv
    state.comfort = calc_comfort(state)
    level_name = fac["levels"][target_idx]
    state.add_log(f"  🏗️ {fac['name']} → {level_name} (Lv.{next_lv})")
    print(f"\n  ✅ {fac['name']} 已升级到 {level_name}！")


# ============================================================
#  行动：休息恢复
# ============================================================

def action_rest(state: GameState) -> None:
    """休息恢复体力"""
    print("\n" + "=" * 50)
    print("  😴 休息恢复")
    print("=" * 50)

    recovery = 40
    disaster = current_disaster(state)
    if "极寒" in disaster["name"]:
        recovery = 25

    if state.comfort >= 10:
        recovery += 10
        print(f"  🏠 高舒适度加成！恢复量 +10")

    state.stamina = min(state.max_stamina, state.stamina + recovery)
    state.add_log(f"  😴 休息了一天，体力 +{recovery}")
    print(f"\n  ✅ 体力恢复了 {recovery} 点（当前 {state.stamina}/{state.max_stamina}）")
    print(f"  💡 提示：休息会跳过当天的探索机会，但不会消耗额外资源")


# ============================================================
#  行动：派遣幸存者（Day 30+）
# ============================================================

def action_dispatch(state: GameState) -> None:
    """派遣幸存者探索"""
    if not state.survivors:
        print("\n  ❌ 没有可派遣的幸存者。")
        return

    print("\n" + "=" * 50)
    print("  👥 派遣幸存者")
    print("=" * 50)

    for i, sv in enumerate(state.survivors, 1):
        status = "🟢 待命" if sv["status"] == "idle" else "🔴 执行任务中"
        print(f"  [{i}] {sv['name']} Lv.{sv['level']} {status}")

    print(f"  [0] 返回")

    try:
        choice = int(input("\n  选择幸存者: ").strip())
    except ValueError:
        return

    if choice == 0:
        return
    if choice < 1 or choice > len(state.survivors):
        return

    sv = state.survivors[choice - 1]
    if sv["status"] != "idle":
        print(f"  ❌ {sv['name']} 正在执行任务中")
        return

    # 选择目标
    print("\n  选择探索目标:")
    for i, loc in enumerate(LOCATIONS, 1):
        print(f"  [{i}] {loc['name']} 危险度:{'★'*loc['danger']}")

    try:
        loc_choice = int(input("  > ").strip())
    except ValueError:
        return

    if loc_choice < 1 or loc_choice > len(LOCATIONS):
        return

    loc = LOCATIONS[loc_choice - 1]

    # 成功率计算
    success_rate = max(20, 80 - loc["danger"] * 10 + sv["level"] * 5)
    rolled = random.randint(1, 100)

    sv["status"] = "dispatched"
    print(f"\n  ⏳ {sv['name']} 出发前往 {loc['name']}...")

    if rolled <= success_rate:
        # 成功
        rewards = {}
        for key in ["food", "water", "iron", "wood", "plastic", "crystal"]:
            field_key = f"base_{key}"
            if field_key in loc:
                lo, hi = loc[field_key]
                amount = random.randint(lo, hi)
                if amount > 0:
                    rewards[key] = amount
        # 幸存者等级加成
        bonus = sv["level"] * random.randint(1, 3)
        rewards["sp"] = bonus
        apply_rewards(state, rewards, loc["name"])
        state.add_log(f"  ✅ {sv['name']} 从 {loc['name']} 安全返回！")
        print(f"  ✅ 任务成功！")
        sv["level"] += 1
    else:
        # 失败
        damage = random.randint(5, 20)
        sv["hp"] -= damage
        state.add_log(f"  ⚠️ {sv['name']} 遭遇怪物，受伤返回（-{damage} HP）")
        print(f"  ⚠️ 任务失败！{sv['name']} 受了伤")

    sv["status"] = "idle"


# ============================================================
#  每日结算
# ============================================================

def daily_settlement(state: GameState) -> None:
    """每日结算：消耗、产出、SP"""
    disaster = current_disaster(state)
    state.comfort = calc_comfort(state)

    print("\n" + "=" * 50)
    print(f"  🌙 Day {state.day} 结算")
    print("=" * 50)

    # 基础消耗
    food_cost = 1
    water_cost = 1
    if "热浪" in disaster["name"]:
        water_cost = 2

    # 厨房节省
    save_pct = calc_food_save(state)
    if save_pct > 0:
        saved = int(food_cost * save_pct / 100)
        food_cost -= saved
        print(f"  🍲 厨房节省了 {saved} 食物")

    state.food -= food_cost
    state.water -= water_cost
    print(f"  🍞 食物 -{food_cost}（剩余 {state.food} 天）")
    print(f"  💧 水 -{water_cost}（剩余 {state.water} 天）")

    # 净水系统产出
    water_out = daily_water_output(state)
    if water_out > 0:
        state.water += water_out
        print(f"  💧 净水系统产出 +{water_out}")

    # 医疗室回血
    heal = calc_heal(state)
    if heal > 0:
        state.health = min(100, state.health + heal)
        print(f"  🏥 医疗室恢复 +{heal} 健康")

    # 饥饿/口渴惩罚
    if state.food <= 0:
        state.health -= 20
        state.food = 0
        state.add_log("  ⚠️ 断粮了！健康 -20")
        print("  ⚠️ 断粮了！健康 -20")
    if state.water <= 0:
        state.health -= 15
        state.water = 0
        state.add_log("  ⚠️ 缺水了！健康 -15")
        print("  ⚠️ 缺水了！健康 -15")

    # SP 产出
    base_sp = 10
    comfort_sp = state.comfort * 3
    state.sp += base_sp + comfort_sp
    print(f"  💰 基础 SP +{base_sp}  |  舒适度({state.comfort}) SP +{comfort_sp}")

    # 系统能量恢复
    if state.energy < state.max_energy:
        regen = state.energy_regen
        state.energy = min(state.max_energy, state.energy + regen)
        print(f"  ⚡ 系统能量 +{regen}（{state.energy}/{state.max_energy}）")

    # 死亡判定
    if state.health <= 0:
        state.game_over = True
        print("\n" + "=" * 50)
        print("  💀 你死了。")
        print("  幸存天数:", state.day, "天")
        print("=" * 50)
        return

    # 体力恢复
    state.stamina = min(state.max_stamina, state.stamina + 20)


# ============================================================
#  状态面板
# ============================================================

def show_status(state: GameState) -> None:
    """显示状态面板"""
    disaster = current_disaster(state)
    print("\n" + "━" * 50)
    print(f"  📅 Day {state.day}  |  {disaster['name']}月")
    print(f"  💰 SP: {state.sp}  |  ⚡ 能量: {state.energy}/{state.max_energy}")
    print(f"  ❤️ 健康: {state.health}  |  ⚡ 体力: {state.stamina}/{state.max_stamina}")
    print(f"  🍞 食物: {state.food}天  |  💧 水: {state.water}天")
    print(f"  🏠 舒适度: {state.comfort}")
    mats = ", ".join(f"{k}:{v}" for k, v in state.materials.items() if v > 0)
    if mats:
        print(f"  📦 材料: {mats}")
    else:
        print(f"  📦 材料: 无")

    # 设施一览
    if state.facilities:
        fac_list = []
        for fid, lv in state.facilities.items():
            if fid in FACILITIES:
                name = FACILITIES[fid]["levels"][lv - 1]
                fac_list.append(f"{FACILITIES[fid]['name']}({name})")
        print(f"  🏗️ 设施: {', '.join(fac_list)}")
    else:
        print(f"  🏗️ 设施: 仅有一个睡袋")

    # 幸存者
    if state.survivors:
        sv_list = [f"{s['name']} Lv.{s['level']}" for s in state.survivors]
        print(f"  👥 幸存者: {len(state.survivors)}/{state.max_survivors} — {', '.join(sv_list)}")
    else:
        print(f"  👥 幸存者: 0/{state.max_survivors}（你孤身一人）")

    print(f"\n  🌪️ 天灾效果: {disaster['penalty']}")
    print(f"  🎁 天灾机遇: {disaster['bonus']}")
    print("━" * 50)


# ============================================================
#  主循环
# ============================================================

def main_menu(state: GameState) -> None:
    """每日行动菜单"""
    while not state.game_over:
        show_status(state)

        print("\n  选择行动:")
        print("  [1] 🗺️  外出探索")
        print("  [2] 🏗️  建造/升级设施")
        print("  [3] 😴 休息恢复")
        if state.day >= 30 and state.survivors:
            print("  [4] 👥 派遣幸存者")
        print("  [5] 🌙 结束今天")
        print("  [0] 💾 退出游戏")

        try:
            cmd = input("\n  > ").strip()
        except (EOFError, KeyboardInterrupt):
            print("\n  再见，宿主。")
            break

        if cmd == "1":
            action_explore(state)
        elif cmd == "2":
            action_build(state)
        elif cmd == "3":
            action_rest(state)
        elif cmd == "4" and state.day >= 30 and state.survivors:
            action_dispatch(state)
        elif cmd == "5":
            daily_settlement(state)
            if state.game_over:
                break
            state.day += 1
            state.log.clear()

            # Day 3: 日志模块解锁提示
            if state.day == 3:
                print("\n  🔓 系统提示：日志模块已解锁。现在每天结算后会看到详细的文本播报。")

            # Day 7: 改造模块解锁
            if state.day == 7:
                print("\n  🔓 系统提示：改造模块已解锁。现在可以为已有设施进行改造和附魔。")

            # Day 14: 制造模块解锁
            if state.day == 14:
                print("\n  🔓 系统提示：制造模块已解锁。现在可以用材料合成新物品。")

            # Day 21: 通讯模块解锁
            if state.day == 21:
                print("\n  🔓 系统提示：通讯模块已解锁。似乎接收到了外界的幸存者信号……")

            # Day 30: 招募模块 + 首个幸存者
            if state.day == 30:
                print("\n" + "=" * 50)
                print("  🔓 招募模块已解锁！")
                print("=" * 50)
                state.max_survivors = 3
                # 首个幸存者
                names = ["陈霜", "老王", "林雪", "赵铁柱", "苏晴"]
                name = random.choice(names)
                new_sv = {"name": name, "level": 1, "hp": 100, "status": "idle",
                          "atk": random.randint(5, 10), "def": random.randint(3, 8),
                          "speed": random.randint(8, 15)}
                state.survivors.append(new_sv)
                print(f"  📡 通讯塔接收到一个求救信号。你找到了 {name}，ta 决定加入你的避难所。")
                state.add_log(f"  📡 {name} 加入了避难所！")
                print("=" * 50)

            # Day 60: 扩张
            if state.day == 60:
                print("\n  🔓 系统提示：扩张模块已解锁。避难所可扩建至地下二层。")
                state.max_survivors = 5

            # Day 90: 深层功能
            if state.day == 90:
                print("\n  🔓 系统提示：系统深层功能正在觉醒……『创世系统』恢复了一部分记忆。")

        elif cmd == "0":
            print("\n  再见，宿主。")
            break
        else:
            print("  ❌ 无效选择")


# ============================================================
#  入口
# ============================================================

def intro() -> None:
    """游戏开场"""
    print("""
╔══════════════════════════════════════════════╗
║                                              ║
║          🌊  Deep Haven  深海庇护所           ║
║          末日避难所生存游戏 v0.2.0             ║
║                                              ║
║  系统流网文 × 地下建造 × 天灾生存              ║
║                                              ║
╚══════════════════════════════════════════════╝

  2035年，天启裂缝撕裂了天空。
  畸变体从裂缝中涌出，人类文明在三个月内崩溃。

  你——一个普通人——躲进了一座废弃的山体防空洞。
  在濒死之际，脑海中响起了一个声音：

  > "检测到适格者……「创世系统」正在绑定……"
  > "绑定完成。宿主，欢迎来到新世界。"

  你的避难所只是一个5×5的洞穴大厅。
  一箱过期的矿泉水（7天）、一盒压缩饼干（5天）、
  一个破睡袋、一把手电筒。

  系统说：『当前避难所存活指数：3%。建议立即行动。』

  活过第一天。然后活过每一天。
""")


if __name__ == "__main__":
    intro()
    input("  按 Enter 开始...")
    state = GameState()
    main_menu(state)
