# CSS Scoped 样式迁移：`::v-deep` → `:deep()`

> Vue 3 更新了 `<style scoped>` 中的深度选择器语法，旧写法在 Vue 3 中已废弃并会产生警告。

## 快速对照

| Vue 2 写法 | Vue 3 写法 | 状态 |
|---|---|---|
| `::v-deep .child` | `:deep(.child)` | ✅ 推荐 |
| `/deep/ .child` | `:deep(.child)` | ✅ 推荐 |
| `>>> .child` | `:deep(.child)` | ✅ 推荐 |
| `::v-slotted .child` | `:slotted(.child)` | 🆕 Vue 3 新增 |
| `::v-global .child` | `:global(.child)` | 🆕 Vue 3 新增 |

> ⚠️ **自动修复**：运行 `npx vue2to3 fix v-deep ./src` 可自动替换所有旧写法

---

## 一、深度选择器（穿透 scoped）

### `::v-deep` → `:deep()`

```scss
/* Vue 2 */
.wrapper ::v-deep .el-input__inner {
  border-color: red;
}

/* Vue 3 */
.wrapper :deep(.el-input__inner) {
  border-color: red;
}
```

### `/deep/` → `:deep()`（Sass/Less 项目常见）

```scss
/* Vue 2 (Sass) */
.wrapper /deep/ .el-input__inner {
  border-color: red;
}

/* Vue 3 */
.wrapper :deep(.el-input__inner) {
  border-color: red;
}
```

### `>>>` → `:deep()`（纯 CSS 项目）

```css
/* Vue 2 (纯 CSS) */
.wrapper >>> .el-input__inner {
  border-color: red;
}

/* Vue 3 */
.wrapper :deep(.el-input__inner) {
  border-color: red;
}
```

---

## 二、插槽内容选择器（新增）

`:slotted()` 用于选中从父组件传入的插槽内容：

```html
<!-- 子组件 MyCard.vue -->
<template>
  <div class="card">
    <slot />
  </div>
</template>

<style scoped>
/* Vue 3：选中插槽传入的 p 标签 */
:slotted(p) {
  color: #666;
  line-height: 1.6;
}

/* Vue 2 中需要用 ::v-deep，但会影响所有子孙，不够精确 */
/* ::v-deep p { color: #666; } */
</style>
```

---

## 三、全局样式（新增）

`:global()` 在 `<style scoped>` 中声明全局样式，无需单独写 `<style>` 块：

```html
<style scoped>
/* 只影响当前组件 */
.local-class {
  color: red;
}

/* Vue 3：在 scoped 中声明全局样式 */
:global(.global-class) {
  color: blue;
}

/* 等价于在单独的 <style> 块中写 */
</style>
```

---

## 四、常见场景示例

### Element UI / Element Plus 组件样式覆盖

```scss
/* Vue 2 */
.my-dialog ::v-deep .el-dialog__header {
  background: #f5f5f5;
}
.my-table ::v-deep .el-table__row:hover td {
  background: #e8f4ff;
}

/* Vue 3 */
.my-dialog :deep(.el-dialog__header) {
  background: #f5f5f5;
}
.my-table :deep(.el-table__row:hover td) {
  background: #e8f4ff;
}
```

### 嵌套写法（Sass/Less）

```scss
/* Vue 2 */
.wrapper {
  ::v-deep {
    .el-input__inner { border-radius: 8px; }
    .el-button { font-weight: bold; }
  }
}

/* Vue 3：不支持无参数的 :deep，必须每个选择器单独写 */
.wrapper {
  :deep(.el-input__inner) { border-radius: 8px; }
  :deep(.el-button) { font-weight: bold; }
}
```

### 动画过渡样式

```scss
/* Vue 2 */
.fade-enter-active ::v-deep .inner {
  transition: opacity 0.3s;
}

/* Vue 3 */
.fade-enter-active :deep(.inner) {
  transition: opacity 0.3s;
}
```

---

## 五、为什么要改？

Vue 3 的 `<style scoped>` 实现从 PostCSS 插件改为编译器内置处理：

1. **`>>>`** 只在纯 CSS 中有效，Sass/Less 不支持
2. **`/deep/`** 是非标准 CSS，已从 CSS 规范草案中移除
3. **`::v-deep`** 作为伪元素语义不准确
4. **`:deep()`** 是伪类函数语法，语义清晰，且明确指定要穿透的目标选择器

---

## 六、迁移步骤

```bash
# 自动替换所有旧写法
npx vue2to3 fix v-deep ./src

# 手动检查无参数的 ::v-deep {} 块（需改写为多个 :deep() 规则）
# 检查 :slotted() 和 :global() 是否有使用场景可以优化
```

### 需要人工处理的情况

```scss
/* 这种无参数块写法无法自动转换，需手动拆分 */
::v-deep {
  .foo { color: red; }
  .bar { color: blue; }
}

/* 改为 */
:deep(.foo) { color: red; }
:deep(.bar) { color: blue; }
```
