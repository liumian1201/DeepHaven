# Deep Haven — 更新日志

---

## v0.0.2 (2026-06-10)

### ✨ 新功能
- **数据编辑器** (`src/editor.html`)：可视化编辑所有游戏配置，7个Tab（物品/效果/设施/配方/地点/天灾/事件）
- **本地数据服务器** (`server.py`)：Python 微服务，编辑器通过 POST /api/save 直接写入 config/*.js
- **一键启动** (`start-editor.bat`)：双击自动启动服务器+打开浏览器
- **嵌套分类系统**：物品支持多级分类（如 建筑/1级建筑），可视化树形管理
- **新增配置**：effects.js（7种效果）、crafting.js（配方系统）
- **自定义弹窗**：替换浏览器原生 prompt/confirm，支持中文输入
- **双保存模式**：💾 直接保存（服务器模式）+ 📥 下载全部（file://备用）

### 🐛 修复
- 分类树路径拼接 bug（`/` 位置错误导致父子分类粘连）
- 添加物品时重复 ID 检测缺失（同 ID 被 push 两次）
- MAT_CATS 分类映射未持久化到文件
- 编辑器缺少 effects.js / crafting.js 引用

### 🔧 改进
- MAT_CATS + CATEGORIES 随 facilities.js 一同保存
- 编辑器按钮改为三按钮布局：直接保存 / 下载全部 / 导出合并

---

## v0.0.1 (2026-06-10)

### ✨ 新功能
- 项目初始化
- 完成游戏世界观与系统设定文档（DESIGN.md）
- 确定废土写实风科技树 v2：9线×10级，5材料体系（木材/废铁/塑料/布料/燃料）
- Phase 1 HTML 可玩原型：时间槽系统、5设施建造、7地点探索、骰子事件、每日结算
- 数据层拆分：`src/config/` 独立配置文件（facilities.js / locations.js / disasters.js / events.js）

### 📋 参考项目
- [万界道友 (Daoyou)](https://github.com/ChurchTao/Daoyou) by [ChurchTao](https://github.com/ChurchTao) — Hono+React 全栈修仙游戏，参考分层架构和 AI 安全设计
- [修仙世界模拟器 (CWS)](https://github.com/4thfever/cultivation-world-simulator) by [4thfever](https://github.com/4thfever) — Python+Vue+PixiJS 世界模拟器，参考 PixiJS 渲染和配置驱动

### 📋 规划
- Phase 1: HTML 纯前端可玩原型 ← 当前
- Phase 2: React + PixiJS 2D 网格建造
- Phase 3: 全栈 + AI 叙事 + 持久化

---
