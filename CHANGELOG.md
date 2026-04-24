# Changelog

本项目遵循 [语义化版本](https://semver.org/lang/zh-CN/) 规范，变更记录格式参考 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)。

## [未发布]

### 计划中
- `vue2to3 fix vuex` — Vuex 3 → Pinia 自动迁移脚手架
- `vue2to3 fix event-bus` — 事件总线 → mitt 自动替换
- `vue2to3 fix composition` — Options API → Composition API 转换（实验性）

---

## [0.1.2] - 2026-04-24

### 新增
- **3 个参考文档（P2 完善度）**：
  - `references/typescript-migration.md` — TS 配置迁移指南（`tsconfig.json` 对照、Class Component → `<script setup>`、`defineProps/defineEmits` 类型写法、`vue-tsc` 使用）
  - `references/test-migration.md` — 测试框架迁移指南（Jest → Vitest 完整迁移、API 兼容对照、Mock 写法、Composable 测试最佳实践）
  - `references/ecosystem-packages.md` — 生态包版本对照表（14 个分类、60+ 个包的完整 Vue 2 → Vue 3 版本对照）
- **扫描规则新增 4 条（TypeScript 类别）**：检测 `@Component`、`@Prop/@Watch/@Emit`、`extends Vue`、`import Vue from 'vue'` 等 Class Component 写法

---

## [0.1.1] - 2026-04-24

### 新增
- **3 个新 Codemod**：
  - `fix env-vars` — `process.env.VUE_APP_*` → `import.meta.env.VITE_*`，同步处理 `.env` 文件前缀重命名
  - `fix v-deep` — `::v-deep` / `/deep/` / `>>>` → `:deep()`，仅处理 `.vue` 文件 `<style>` 块，精确避免误改模板
  - `fix test-utils` — `@vue/test-utils` v1 → v2（`propsData→props`、`wrapper.destroy()→unmount()`、`createLocalVue→config.global`、`Wrapper<T>→VueWrapper`）
- **扫描规则新增 15 条**：覆盖 Build Tool（`process.env`、`require.context`）、CSS Scoped（`::v-deep`、`/deep/`、`>>>`）、Test Utils（`propsData`、`wrapper.destroy`、`createLocalVue`）、TypeScript（`@Component`、`@Prop`、`extends Vue`）
- **测试用例**：新增 53 个测试用例，总计 160 个，覆盖所有新 codemod 的单元测试

### 修复
- `fix all` 步骤编号错误（写的 Step 7/7 但实际执行了 10 步）
- `filter-pipe` 正则误报：`{{ a | 0 }}` 按位或被错误识别为过滤器，现要求 `|` 后为标识符
- `check` 命令遗漏 `::v-deep` / `process.env.VUE_APP_*` 检查项
- CLI 版本号硬编码，现从 `package.json` 动态读取

### 文档
- `SKILL.md` 同步新增的 3 个 codemod 命令和参考文档表
- 快速参考表补充 `env-vars`、`v-deep`、`test-utils` 迁移对照

---

## [0.1.0] - 2026-04-24

### 新增
- **CLI 工具** `vue2to3`，支持 `scan`、`fix`、`check` 三个主命令
- **扫描器** (`scan`)：检测 Vue 2 特征，生成结构化 JSON 迁移报告，支持复杂度评估（LOW / MEDIUM / HIGH）
- **7 个自动化 Codemod**（均支持 `--dry-run` 预览和 `.vue3.bak` 自动备份）：
  - `fix lifecycle` — `beforeDestroy` → `beforeUnmount`，`destroyed` → `unmounted`
  - `fix global-api` — `Vue.prototype` → `app.config.globalProperties`，`Vue.observable` → `reactive`，全局 API 添加 TODO 标注
  - `fix sync` — `:prop.sync="x"` → `v-model:prop="x"`
  - `fix listeners` — `$listeners` → `$attrs`
  - `fix filters` — `{{ x | filter }}` → `{{ $filters.filter(x) }}`，自动生成 `utils/filters.js` 骨架
  - `fix template-key` — `<template v-for>` 的 `:key` 从子元素移至 `<template>` 标签
  - `fix router` — Vue Router 3 → 4（`new VueRouter` → `createRouter`，`mode` → `history`）
  - `fix all` — 按正确顺序一键执行所有修复
- **验证器** (`check`)：扫描残留 Vue 2 特征，CI 友好（非零退出码）
- **参考文档库** (`references/`)：9 份详细迁移指南，涵盖所有破坏性变更场景
- **Agent Skill** (`SKILL.md`)：AI 助手专用工作流，支持 Claude Code、CodeBuddy、Cursor、Cline
- **TypeScript 全量迁移**：所有脚本从 JS 迁移为 TS，strict 模式，完整类型定义
- **测试套件**：107 个测试用例，覆盖单元测试 + 集成测试（含真实文件系统读写）
- **工具链**：ESLint 9 flat config + Prettier + TypeScript 类型检查，`npm run ci` 一键验证

### 技术栈
- Node.js ≥ 18，ESM 模块
- TypeScript 5.5，strict 模式
- 测试：Node.js 内置 `node:test` + `tsx`
- 代码质量：ESLint 9 + Prettier 3 + TypeScript strict

[未发布]: https://github.com/Liyixi33-89/skill-vue2-to-vue3/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/Liyixi33-89/skill-vue2-to-vue3/releases/tag/v0.1.0
