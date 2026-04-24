# skill-vue2-to-vue3

> 一个 **Agent Skill**，让你的 AI 助手成为 Vue 2 → Vue 3 迁移专家。  
> 支持 Claude Code、CodeBuddy、Cursor、Cline 以及任何支持 Skill/Rules 加载的 Agent。

## 什么是 Agent Skill？

Skill 是一个结构化目录，可按需将**专家知识 + SOP 工作流**加载到你的 AI 助手中。无需在每次对话中粘贴迁移文档，只需安装一次，AI 就能精准知道该怎么做。

## 功能特性

- **智能项目扫描器** — 检测所有 Vue 2 特征，生成结构化迁移报告
- **7 个自动化 Codemod** — 安全、备份优先的常见破坏性变更转换
- **完整参考文档** — 涵盖每种迁移场景的详细指南，按需加载
- **零误报** — 每次变更前自动创建 `.vue3.bak` 备份
- **AI 优化的 SKILL.md** — 告知 AI 正确的修复顺序及何时加载哪份参考文档

## 覆盖范围

| 迁移项 | 自动修复 | 参考文档 |
|---|---|---|
| `new Vue()` → `createApp()` | ⚠️ TODO 标注 | breaking-changes.md |
| 生命周期重命名（`beforeDestroy` → `beforeUnmount`） | ✅ | lifecycle.md |
| `.sync` → `v-model:xxx` | ✅ | v-model.md |
| `$listeners` → `$attrs` | ✅ | breaking-changes.md |
| Vue Router 3 → 4 | ✅ | router-migration.md |
| Filters → utils / globalProperties | ✅（脚手架） | filters.md |
| `template v-for` key 位置 | ✅ | breaking-changes.md |
| 事件总线 `$on/$off` → mitt | 📖 指南 | breaking-changes.md |
| Vuex → Pinia | 📖 指南 | vuex-to-pinia.md |
| Element UI → Element Plus | 📖 指南 | element-ui-migration.md |
| Options API → Composition API | 📖 指南 | composition-api-guide.md |
| 常见陷阱 | 📖 指南 | common-pitfalls.md |

## 安装

```bash
# 全局安装（在任意位置使用 CLI）
npm install -g skill-vue2-to-vue3

# 或直接通过 npx 使用
npx skill-vue2-to-vue3 scan ./src
```

### 作为 Agent Skill 加载

适用于 **Claude Code / CodeBuddy**：
```bash
# 添加到项目的 skills 目录
cp -r node_modules/skill-vue2-to-vue3 .codebuddy/skills/vue2-to-vue3
# 或
cp -r node_modules/skill-vue2-to-vue3 .claude/skills/vue2-to-vue3
```

然后直接告诉 AI：_"将这个 Vue 2 项目迁移到 Vue 3"_ — AI 会自动加载该 Skill。

## CLI 用法

```bash
# 第一步：扫描项目并生成报告
npx vue2to3 scan ./src
npx vue2to3 scan ./src --no-report   # 不写入 JSON 文件

# 第二步：运行自动修复（会创建 .vue3.bak 备份）
npx vue2to3 fix lifecycle ./src      # beforeDestroy → beforeUnmount
npx vue2to3 fix global-api ./src     # Vue.use → app.use（TODO 标注）
npx vue2to3 fix sync ./src           # .sync → v-model:xxx
npx vue2to3 fix listeners ./src      # $listeners → $attrs
npx vue2to3 fix filters ./src        # filters → $filters 脚手架
npx vue2to3 fix template-key ./src   # <template v-for> key 位置
npx vue2to3 fix router ./src         # Vue Router 3 → 4

# 一键执行所有修复
npx vue2to3 fix all ./src

# 预览模式（不写入文件）
npx vue2to3 fix all ./src --dry-run

# 第三步：验证无 Vue 2 特征残留
npx vue2to3 check ./src
```

## 迁移工作流

```
1. vue2to3 scan ./src          →  读取报告，了解迁移复杂度
2. vue2to3 fix all ./src       →  应用所有安全的自动修复
3. 检查 TODO 注释              →  处理 createApp、事件总线、$children
4. 更新依赖                    →  vue@3、vue-router@4、pinia、element-plus
5. vue2to3 check ./src         →  验证清洁度
6. npm run build               →  确认构建通过
7. （可选）Vuex → Pinia 迁移
8. （可选）Options API → Composition API
```

## 参考资料

- [Vue 3 迁移指南](https://v3-migration.vuejs.org/)
- [Vue Router 4 迁移](https://router.vuejs.org/guide/migration/)
- [Pinia 文档](https://pinia.vuejs.org/)
- [Element Plus 迁移](https://element-plus.org/en-US/guide/migration.html)

## 许可证

MIT
