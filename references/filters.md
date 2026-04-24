# Filters 过滤器迁移指南

## 概述

Vue 3 **完全移除**了 `filters` 选项和 `|` 管道语法。官方建议用 **computed properties** 或 **普通函数** 替代。

---

## 迁移方案对比

### 方案 A：Computed Property（适合单个组件内使用）

```html
<!-- Vue 2 -->
<span>{{ price | currency }}</span>
<span>{{ price | currency('USD') }}</span>
```

```js
// Vue 3 — 无参数 filter → computed
computed: {
  formattedPrice() {
    return `¥${Number(this.price).toFixed(2)}`
  }
}
```

模板：
```html
<span>{{ formattedPrice }}</span>
```

---

### 方案 B：工具函数（推荐，可复用）

```js
// utils/filters.js
export function currency(value, symbol = '¥') {
  return `${symbol}${Number(value).toFixed(2)}`
}

export function formatDate(value, fmt = 'YYYY-MM-DD') {
  if (!value) return ''
  const d = new Date(value)
  return fmt
    .replace('YYYY', d.getFullYear())
    .replace('MM', String(d.getMonth() + 1).padStart(2, '0'))
    .replace('DD', String(d.getDate()).padStart(2, '0'))
}

export function truncate(value, length = 20, suffix = '...') {
  if (!value) return ''
  return value.length > length ? value.slice(0, length) + suffix : value
}
```

组件中直接导入使用：
```html
<script>
import { currency, formatDate } from '@/utils/filters'
export default {
  methods: { currency, formatDate }
}
</script>
<template>
  <span>{{ currency(price) }}</span>
  <span>{{ formatDate(date, 'YYYY/MM/DD') }}</span>
</template>
```

---

### 方案 C：globalProperties（快速迁移大型项目）

适合有大量 `{{ xxx | filter }}` 且短期内不想逐个改模板的情况：

```js
// main.js / main.ts
import { createApp } from 'vue'
import App from './App.vue'
import * as filters from './utils/filters'

const app = createApp(App)

// 注册全局 $filters
app.config.globalProperties.$filters = filters

app.mount('#app')
```

模板中：
```html
<!-- 把 {{ price | currency }} 改为 -->
<span>{{ $filters.currency(price) }}</span>
<span>{{ $filters.formatDate(date) }}</span>
```

> ⚠️ 全局 globalProperties 不推荐长期使用，会影响 TypeScript 类型推导。建议作为过渡方案，逐步迁移到方案 B。

---

### 方案 D：Composition API + `provide/inject`（共享逻辑）

```js
// composables/useFilters.js
import { currency, formatDate } from '@/utils/filters'
export function useFilters() {
  return { currency, formatDate }
}

// 组件中
import { useFilters } from '@/composables/useFilters'
const { currency, formatDate } = useFilters()
```

---

## 常见过滤器迁移对照表

| Vue 2 Filter 写法 | Vue 3 推荐替代 |
|---|---|
| `{{ val \| currency }}` | `{{ currency(val) }}` (utils) |
| `{{ val \| date('YYYY-MM-DD') }}` | `{{ formatDate(val, 'YYYY-MM-DD') }}` |
| `{{ val \| truncate(50) }}` | `{{ truncate(val, 50) }}` |
| `{{ val \| capitalize }}` | `{{ val.charAt(0).toUpperCase() + val.slice(1) }}` |
| `{{ val \| lowercase }}` | `{{ val.toLowerCase?.() }}` |
| `{{ val \| json }}` | `{{ JSON.stringify(val, null, 2) }}` |
| `{{ val \| pluralize }}` | computed / 工具函数 |

---

## 自动迁移脚本说明

`npx vue2to3 fix filters ./src` 会：
1. 扫描所有 `.vue` 文件中的 `{{ xxx | filterName }}` 语法
2. **标记**哪些 filter 有参数（需人工处理）
3. 对无参数的简单 filter，自动转换为 `{{ $filters.filterName(xxx) }}`
4. 汇总所有 filter 函数定义，生成 `src/utils/filters.js` 骨架
5. 在 `main.js` 中注入 `app.config.globalProperties.$filters`

> 注意：带参数的复杂 filter（如 `{{ val | date('YYYY-MM-DD') }}`）会被标记为 `// TODO: migrate filter`，需要手动处理。
