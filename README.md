# Deep Haven

<p align="center">
  <strong>末日避难所生存游戏</strong>
</p>

<p align="center">
  废土捡垃圾 × 地下建造 × 天灾生存
</p>

---

## 📖 简介

末日降临，你躲进废弃山体防空洞。收集废墟中的废铁、木材、塑料，一步步把洞穴改造成能活的避难所。每天面对饥饿、口渴、怪物和极端天灾的威胁——活下去，然后活得更好。

### ✨ 核心特色

- 🏗️ **9线科技树**：水资源、防御、起居、能源、工作台等，从睡袋→木板床→恒温舱
- 🌪️ **12 种月更天灾**：极寒、酸雨、尸潮、毒雾……每种改变全局规则
- 🎲 **骰子驱动探索**：7个地点，基础收获 + 随机事件 + 稀有掉落
- 🕐 **每日3时间槽**：早晨/午间/傍晚分配行动，过夜结算
- 💰 **双货币**：SP（生存点）来自结算，能量来自系统——用途完全不同
- 📦 **数据驱动**：设施、地点、事件全在 `config/*.json`，改数值无需动代码

---

## 🚀 快速开始

### 玩游戏
浏览器直接打开 `src/index.html`

### 改数据
双击 `start-editor.bat` 或运行 `python server.py` → 浏览器打开编辑器 → 💾 直接保存

（需要 Python 3.10+，编辑器为 8 Tab 可视化界面，支持物品/配方/设施/地点/天灾/事件/效果/系统升级配置）

---

## 🛠️ 技术栈

| 阶段 | 技术 | 状态 |
|------|------|:--:|
| Phase 1 | HTML/CSS/JS 纯前端 + config 数据层 | ✅ 当前 |
| Phase 2 | React 19 + TypeScript + Vite + PixiJS | 🔒 待定 |
| Phase 3 | FastAPI + SQLite + LLM API | 🔒 待定 |

---

## 📁 项目结构

```
src/
├── index.html              ← 游戏主页面（UI + 引擎逻辑）
├── editor.html             ← 数据编辑器 v2（8Tab 可视化编辑）
├── editor.js               ← 编辑器核心逻辑
└── config/
    ├── items.json          ← 物品池（size + stats）
    ├── recipes.json        ← 配方规则（输入→输出）
    ├── facilities.json     ← 设施定义（多等级）
    ├── locations.json      ← 探索地点（掉落表）
    ├── disasters.json      ← 12月天灾
    ├── events.json         ← 正/负/稀有事件池
    ├── effects.json        ← 效果定义
    └── system.json         ← 系统升级（采集/空间/能量/行动）
server.py                   ← 本地数据服务器（多线程 + 自动备份）
start-editor.bat            ← 一键启动编辑器
```

---

## 📋 项目状态

🟢 **v0.0.3** — 数据层 JSON 重构，编辑器 v2，系统升级面板

---

## 📄 许可

MIT License
