# ESLint 配置迁移：Vue 2 → Vue 3

> `eslint-plugin-vue` v7（Vue 2）→ v9（Vue 3）规则集名称和规则内容均有重大变化。

## 安装

```bash
# 卸载旧版本
npm uninstall eslint-plugin-vue @vue/eslint-config-standard @vue/eslint-config-prettier

# 安装新版本
npm install -D eslint eslint-plugin-vue @vue/eslint-config-typescript
# 如果使用 Prettier
npm install -D @vue/eslint-config-prettier prettier
```

---

## 一、规则集名称变化（最重要！）

| Vue 2 规则集 | Vue 3 对应规则集 | 说明 |
|---|---|---|
| `plugin:vue/essential` | `plugin:vue/vue3-essential` | 最低限度规则 |
| `plugin:vue/strongly-recommended` | `plugin:vue/vue3-strongly-recommended` | 强烈推荐 |
| `plugin:vue/recommended` | `plugin:vue/vue3-recommended` | 完整推荐 |

> ⚠️ 如果继续使用 `plugin:vue/essential`（不加 `vue3-` 前缀），ESLint 会用 Vue 2 规则检查 Vue 3 代码，导致大量误报！

---

## 二、完整配置迁移示例

### Vue 2 配置（`.eslintrc.js`）

```js
// Vue 2 + JavaScript
module.exports = {
  root: true,
  env: { node: true },
  extends: [
    'plugin:vue/essential',
    'eslint:recommended',
  ],
  parserOptions: {
    parser: 'babel-eslint',  // ← 已废弃
  },
  rules: {
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
  },
}
```

### Vue 3 配置（`eslint.config.js`，ESLint 9 Flat Config）

```js
// Vue 3 + TypeScript + ESLint 9
import pluginVue from 'eslint-plugin-vue'
import vueTsEslintConfig from '@vue/eslint-config-typescript'
import prettierConfig from '@vue/eslint-config-prettier'

export default [
  // Vue 3 推荐规则
  ...pluginVue.configs['flat/vue3-recommended'],

  // TypeScript 支持
  ...vueTsEslintConfig(),

  // Prettier 格式化（放最后，关闭冲突规则）
  prettierConfig,

  {
    files: ['**/*.vue', '**/*.ts', '**/*.js'],
    rules: {
      // Vue 3 特定规则
      'vue/multi-word-component-names': 'warn',
      'vue/no-deprecated-v-bind-sync': 'error',    // 禁止 .sync
      'vue/no-deprecated-filter': 'error',          // 禁止 filters
      'vue/no-deprecated-events-api': 'error',      // 禁止 $on/$off
      'vue/no-deprecated-destroyed-lifecycle': 'error', // 禁止 beforeDestroy/destroyed
      'vue/define-emits-declaration': 'warn',
      'vue/define-props-declaration': 'warn',
    },
  },

  {
    ignores: ['dist/**', 'node_modules/**'],
  },
]
```

### Vue 3 配置（旧版 `.eslintrc.js`，ESLint 8 兼容）

```js
// Vue 3 + TypeScript + ESLint 8
module.exports = {
  root: true,
  env: { node: true, es2022: true },
  extends: [
    'plugin:vue/vue3-recommended',          // ← 注意 vue3- 前缀
    '@vue/eslint-config-typescript',
    '@vue/eslint-config-prettier/skip-formatting',
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    parser: '@typescript-eslint/parser',    // ← 替代废弃的 babel-eslint
  },
  rules: {
    'vue/multi-word-component-names': 'warn',
    'vue/no-deprecated-v-bind-sync': 'error',
    'vue/no-deprecated-filter': 'error',
    'vue/no-deprecated-events-api': 'error',
    'vue/no-deprecated-destroyed-lifecycle': 'error',
  },
}
```

---

## 三、Vue 3 专用 ESLint 规则（新增）

以下规则在 `plugin:vue/vue3-recommended` 中默认启用，会检测 Vue 2 写法：

| 规则 | 检测内容 | 严重级别 |
|---|---|---|
| `vue/no-deprecated-v-bind-sync` | `:prop.sync` 用法 | error |
| `vue/no-deprecated-filter` | `filters` 选项和 `\|` 管道 | error |
| `vue/no-deprecated-events-api` | `$on` / `$off` / `$once` | error |
| `vue/no-deprecated-destroyed-lifecycle` | `beforeDestroy` / `destroyed` | error |
| `vue/no-deprecated-v-on-native-modifier` | `.native` 修饰符 | error |
| `vue/no-deprecated-inline-template` | `inline-template` | error |
| `vue/no-deprecated-scope-attribute` | `slot-scope` 属性 | error |
| `vue/no-deprecated-slot-attribute` | `slot` 属性 | error |
| `vue/no-deprecated-dollar-listeners-api` | `$listeners` | error |
| `vue/no-deprecated-html-element-is` | `<component is>` 旧写法 | error |
| `vue/no-v-for-template-key-on-child` | `v-for` key 位置 | error |
| `vue/require-explicit-emits` | 未声明 `emits` | warn |
| `vue/v-on-event-hyphenation` | 事件名连字符规范 | warn |

---

## 四、`babel-eslint` → `@typescript-eslint/parser`

`babel-eslint` 已废弃，Vue 3 项目统一使用 `@typescript-eslint/parser`：

```bash
npm uninstall babel-eslint
npm install -D @typescript-eslint/parser @typescript-eslint/eslint-plugin
```

```js
// 旧
parserOptions: { parser: 'babel-eslint' }

// 新
parserOptions: { parser: '@typescript-eslint/parser' }
```

---

## 五、`<script setup>` 相关规则

使用 `<script setup>` 时，需要关闭一些不适用的规则：

```js
rules: {
  // <script setup> 中组件无需注册，关闭此规则
  'vue/no-unused-vars': 'off',

  // <script setup> 中 defineProps/defineEmits 是编译器宏，无需导入
  'no-undef': 'off',  // 或使用 globals 配置

  // 推荐开启：确保 defineProps 有类型
  'vue/define-props-declaration': 'warn',
  'vue/define-emits-declaration': 'warn',
}
```

---

## 六、Volar（Vue - Official）替代 Vetur

ESLint 配置之外，IDE 插件也需要更新：

```
VSCode 扩展：
  ❌ 卸载：Vetur (octref.vetur)
  ✅ 安装：Vue - Official (Vue.volar)
```

`tsconfig.json` 中需要添加 Volar 的 takeover 模式支持：

```json
{
  "compilerOptions": {
    "types": ["vite/client"]
  },
  "vueCompilerOptions": {
    "target": 3
  }
}
```

---

## 七、迁移步骤

```bash
# 1. 更新 eslint-plugin-vue
npm install -D eslint-plugin-vue@latest

# 2. 将规则集名称加上 vue3- 前缀
# plugin:vue/essential → plugin:vue/vue3-essential

# 3. 替换 babel-eslint
npm uninstall babel-eslint
npm install -D @typescript-eslint/parser

# 4. 运行 ESLint 查看新增报错
npx eslint src --ext .vue,.ts,.js

# 5. 逐步修复 Vue 3 规则报错（配合 vue2to3 codemod）
npx vue2to3 fix all ./src

# 6. 卸载 Vetur，安装 Vue - Official 插件
```
