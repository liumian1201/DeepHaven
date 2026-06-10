# Deep Haven — 更新日志

---

## v0.0.3 (2026-06-11)

### ✨ 新功能
- **数据层 JSON 重构**：config/*.js → config/*.json，8 个配置文件，类型安全
- **编辑器 v2** (`editor.html` + `editor.js`)：全面重写，8 Tab（物品/配方/设施/地点/天灾/事件/效果/系统）
- **系统升级面板** (`system.json`)：采集倍率、随身空间容量、能量上限、行动槽位，支持多等级
- **物品模型优化**：size（体积）+ stats（可选属性），有 stats = 成品，无 = 纯物资
- **响应式布局**：400px~1600px 自适应，窄屏列表可折叠
- **双下拉物品选择**：分类 → 物品 级联下拉框，全编辑器统一使用
- **配方产出多行化**：产出区域完全照搬输入材料结构，支持多产出 + 数量 + ✕ 删除 + 添加按钮
- **列表条目删除按钮**：配方/设施/地点/事件/效果 列表每条自带 🗑 按钮，无需进入编辑面板
- **工坊下拉动态化**：从 `DATA.facilities` 自动生成，新增设施即时可选

### 🔧 改进
- **服务器升级**：多线程支持（ThreadingHTTPServer），保存前自动备份到 `_backup/`
- **游戏加载**：fetch JSON 替代 `<script>` 加载，Phase 2 平滑过渡
- **配方数据格式统一**：`output` 改为 `{物品ID: 数量}` 对象格式，与游戏页对接
- **缓存穿透**：fetch 带 `?t=Date.now()` 参数，避免浏览器缓存旧数据
- **清理旧文件**：删除 JS 格式配置文件、main.py 等废弃代码

### 🐛 修复
- 编辑器左侧点击不触发右侧编辑（panel 变量作用域问题）
- 响应式布局字段溢出（select/min-width 约束）
- 中文编码兼容（Python 写入确保 UTF-8）
- 配方产出缺数量框 → 补全
- 配方保存后未持久化到服务器 → 所有 S_* / D_* 函数加 saveOne 调用

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
