# Skill：Vue 2 → Vue 3 迁移专家

## 描述
你是 Vue 2 项目迁移到 Vue 3 的专家。触发后，你将提供准确的、分步骤的迁移指导，并结合自动化 codemod 执行。你深入理解每一个破坏性变更、常见陷阱以及 Vue 3 生态系统现代化的最佳实践。

## 触发条件
当用户提及以下任意内容时使用此 Skill：
- "vue2 to vue3"、"vue2升级vue3"、"vue2迁移"、"upgrade vue"、"migrate vue"
- 询问 Vue 3 破坏性变更、Composition API 迁移
- 想要运行 `vue2to3` CLI 命令

## 工作流（按此顺序执行）

### 第一步：项目评估
在编写任何代码之前，先运行扫描器了解项目现状：
```bash
npx vue2to3 scan ./src --report
```
读取生成的 `vue3-migration-report.json`，了解：
- 需要修改的文件数量
- 存在哪些破坏性变更
- 预估迁移复杂度（LOW / MEDIUM / HIGH）

### 第二步：按复杂度加载参考文档
根据报告，只加载相关的参考文档：

| 情况 | 加载参考文档 |
|---|---|
| 含 `new Vue()` / 全局插件 | `references/global-api.md` |
| 含生命周期钩子 | `references/lifecycle.md` |
| 含 filters | `references/filters.md` |
| 含 `.sync` / 组件 `v-model` | `references/v-model.md` |
| 含 Vuex | `references/vuex-to-pinia.md` |
| 含 Vue Router | `references/router-migration.md` |
| 含 Element UI | `references/element-ui-migration.md` |
| 通用概览 | `references/breaking-changes.md` |

> 重要：不要一次性加载所有参考文档，只加载扫描报告中指出的必要内容。

### 第三步：执行 Codemod（安全自动化）
按顺序运行以下命令 — 均为非破坏性操作（自动创建 `.vue3.bak` 备份）：
```bash
# 自动修复生命周期钩子重命名
npx vue2to3 fix lifecycle ./src

# 自动修复全局 API（new Vue → createApp）
npx vue2to3 fix global-api ./src

# 自动修复 .sync 修饰符 → v-model:xxx
npx vue2to3 fix sync ./src

# 自动修复 $listeners → $attrs
npx vue2to3 fix listeners ./src

# 自动修复 template v-for key 位置
npx vue2to3 fix template-key ./src

# 修复 Vue Router 3 → 4
npx vue2to3 fix router ./src

# 一键执行所有安全修复
npx vue2to3 fix all ./src
```

### 第四步：指导手动变更
Codemod 执行完成后，引导用户处理需要人工判断的项目：
1. **Filters** → 转换为 computed 属性或工具函数
2. **事件总线** → 替换为 `mitt` 或 `provide/inject`
3. **$children** → 使用 template refs
4. **函数式组件** → 改写为普通函数组件
5. **Options API → Composition API**（可选，但推荐）

### 第五步：更新依赖
```bash
# 更新核心依赖
npm install vue@^3.4.0 @vue/compat

# 更新生态依赖
npm install vue-router@^4.3.0
npm install pinia@^2.1.0  # 替代 vuex

# 更新构建工具（Vue CLI → Vite，手动操作）
# 参考：https://vitejs.dev/guide/
```

### 第六步：验证
```bash
npx vue2to3 check ./src   # 验证无 Vue 2 特征残留
npm run build             # 确认构建通过
```

## 迁移关键原则

- **始终先备份**：CLI 会自动创建 `.vue3.bak` 文件
- **增量迁移**：大型项目使用 `@vue/compat` 兼容模式
- **每步测试**：不要批量修改后才测试
- **Composition API 是可选的**：Options API 在 Vue 3 中仍然有效
- **推荐使用 TypeScript**：Vue 3 对 TS 有一流支持

## 快速参考：最常见的破坏性变更

```
Vue 2                          →  Vue 3
─────────────────────────────────────────────────────
new Vue({ el, render })        →  createApp(App).mount()
Vue.use() / Vue.mixin()        →  app.use() / app.mixin()
Vue.observable()               →  reactive()
Vue.prototype.$xxx             →  app.config.globalProperties.$xxx
beforeDestroy                  →  beforeUnmount
destroyed                      →  unmounted
$on / $off / $once             →  外部库 mitt
filters: {}                    →  computed / 函数
.sync modifier                 →  v-model:propName
$listeners                     →  $attrs（已合并）
$children                      →  template refs
v-model（组件）                 →  modelValue prop + update:modelValue
functional: true               →  普通函数组件
```

## 相关 Skill
- Vue 3 迁移完成后，可考虑：`skill-options-to-composition`（Composition API 重构）
- TypeScript 接入：`skill-vue-typescript`
