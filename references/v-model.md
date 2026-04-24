# v-model 与 .sync 迁移指南

## 核心变化

Vue 3 中 `v-model` 在**组件**上的默认 prop/event 改变了：

| | Vue 2 | Vue 3 |
|---|---|---|
| 默认 prop | `value` | `modelValue` |
| 默认 event | `input` | `update:modelValue` |
| `.sync` | 支持 | **已移除**，用 `v-model:xxx` 替代 |
| 多 v-model | 不支持 | ✅ 支持 |
| v-model 修饰符 | 内置 `.lazy/.number/.trim` | 支持自定义修饰符 |

> 注意：原生表单元素（`<input>`, `<textarea>` 等）上的 `v-model` 行为**不变**。

---

## 场景 1：组件使用 v-model

```html
<!-- Vue 2 -->
<MyInput v-model="searchText" />

<!-- Vue 3（无需修改调用方，但组件内部必须改） -->
<MyInput v-model="searchText" />
```

**组件内部**需要修改：
```js
// Vue 2 组件内部
export default {
  props: ['value'],
  template: `<input :value="value" @input="$emit('input', $event.target.value)" />`
}

// Vue 3 组件内部
export default {
  props: ['modelValue'],
  emits: ['update:modelValue'],
  template: `<input :value="modelValue" @input="$emit('update:modelValue', $event.target.value)" />`
}

// Vue 3 Composition API + defineModel (Vue 3.4+，最简写法)
const model = defineModel()
// 模板：<input v-model="model" />
```

---

## 场景 2：自定义 model 选项（Vue 2）

```js
// Vue 2：自定义 v-model prop/event
export default {
  model: {
    prop: 'checked',
    event: 'change'
  },
  props: ['checked']
}

// Vue 3：直接命名 v-model
// 调用方：<MyCheckbox v-model:checked="isChecked" />
export default {
  props: ['checked'],
  emits: ['update:checked']
}
```

---

## 场景 3：.sync 修饰符迁移

```html
<!-- Vue 2 -->
<PageTitle :title.sync="pageTitle" />
<!-- 等价于 -->
<PageTitle :title="pageTitle" @update:title="pageTitle = $event" />

<!-- Vue 3：直接用 v-model:title -->
<PageTitle v-model:title="pageTitle" />
```

组件内部：
```js
// Vue 2
this.$emit('update:title', newTitle)

// Vue 3（完全相同的 emit，不用改！）
this.$emit('update:title', newTitle)
// 或 emits 声明更规范
emits: ['update:title']
```

---

## 场景 4：多个 v-model（Vue 3 新特性）

```html
<!-- Vue 3 -->
<UserForm
  v-model:name="user.name"
  v-model:email="user.email"
  v-model:age="user.age"
/>
```

```js
// Vue 3 组件
export default {
  props: ['name', 'email', 'age'],
  emits: ['update:name', 'update:email', 'update:age']
}
```

---

## 场景 5：自定义修饰符（Vue 3 新特性）

```html
<MyInput v-model.capitalize="text" />
```

```js
export default {
  props: {
    modelValue: String,
    modelModifiers: {
      default: () => ({})
    }
  },
  emits: ['update:modelValue'],
  created() {
    if (this.modelModifiers.capitalize) {
      // 处理 capitalize 修饰符
    }
  }
}
```

---

## 批量迁移策略

1. **全局搜索** `.sync` → 替换为 `v-model:xxx`
2. **全局搜索** `prop: 'value'` + `event: 'input'` → 改为 `modelValue` + `update:modelValue`
3. **全局搜索** `model:` 选项 → 重构为命名 v-model
4. **验证**：跑 `npx vue2to3 check` 确认无残留
