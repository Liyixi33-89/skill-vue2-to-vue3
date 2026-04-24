# Vue 3 Breaking Changes — Complete Reference

> 来源：Vue 3 官方迁移指南 + 实战总结。按影响程度排序。

## 🔴 高频 / 高影响

### 1. Global API 重构
Vue 2 的所有全局 API 都挂在 `Vue` 构造函数上，Vue 3 改为应用实例：

```js
// Vue 2
import Vue from 'vue'
Vue.use(plugin)
Vue.mixin(mixin)
Vue.component('MyComp', MyComp)
Vue.directive('focus', directive)
Vue.prototype.$http = axios
new Vue({ el: '#app', render: h => h(App) })

// Vue 3
import { createApp } from 'vue'
const app = createApp(App)
app.use(plugin)
app.mixin(mixin)
app.component('MyComp', MyComp)
app.directive('focus', directive)
app.config.globalProperties.$http = axios
app.mount('#app')
```

### 2. v-model 变化（组件上）
```html
<!-- Vue 2：默认 prop=value, event=input -->
<MyInput v-model="text" />
<!-- 等价于 -->
<MyInput :value="text" @input="text = $event" />

<!-- Vue 3：默认 prop=modelValue, event=update:modelValue -->
<MyInput v-model="text" />
<!-- 等价于 -->
<MyInput :modelValue="text" @update:modelValue="text = $event" />

<!-- Vue 3：多个 v-model -->
<MyForm v-model:name="name" v-model:age="age" />
```

组件内部变化：
```js
// Vue 2
props: ['value'],
methods: {
  update(val) { this.$emit('input', val) }
}

// Vue 3
props: ['modelValue'],
emits: ['update:modelValue'],
methods: {
  update(val) { this.$emit('update:modelValue', val) }
}
```

### 3. .sync 修饰符被移除
```html
<!-- Vue 2 -->
<MyComp :title.sync="pageTitle" />

<!-- Vue 3（等价） -->
<MyComp v-model:title="pageTitle" />
```

### 4. 生命周期钩子重命名
| Vue 2 | Vue 3 | 说明 |
|---|---|---|
| `beforeCreate` | `beforeCreate` | 不变 |
| `created` | `created` | 不变 |
| `beforeMount` | `beforeMount` | 不变 |
| `mounted` | `mounted` | 不变 |
| `beforeUpdate` | `beforeUpdate` | 不变 |
| `updated` | `updated` | 不变 |
| `beforeDestroy` | **beforeUnmount** | ⚠️ 改名 |
| `destroyed` | **unmounted** | ⚠️ 改名 |
| `errorCaptured` | `errorCaptured` | 不变 |
| - | `renderTracked` | 🆕 新增 |
| - | `renderTriggered` | 🆕 新增 |

### 5. Filters 被彻底移除
```html
<!-- Vue 2 -->
<span>{{ price | currency }}</span>
<span>{{ date | formatDate('YYYY-MM-DD') }}</span>
```

```js
// Vue 3 替代方案 1：computed
computed: {
  formattedPrice() {
    return formatCurrency(this.price)
  }
}

// Vue 3 替代方案 2：全局工具函数
app.config.globalProperties.$filters = {
  currency: formatCurrency,
  formatDate: formatDate
}
// 模板中使用：{{ $filters.currency(price) }}

// Vue 3 替代方案 3（推荐）：独立工具函数 + 模板直接调用
// utils/format.js
export const currency = (val) => `¥${val.toFixed(2)}`

// 组件中
import { currency } from '@/utils/format'
// 模板：{{ currency(price) }}
```

### 6. $on / $off / $once 被移除（事件总线）
```js
// Vue 2：事件总线
const bus = new Vue()
bus.$on('event', handler)
bus.$emit('event', data)
bus.$off('event', handler)

// Vue 3：使用 mitt
import mitt from 'mitt'
const bus = mitt()
bus.on('event', handler)
bus.emit('event', data)
bus.off('event', handler)

// 在 app 中提供
app.config.globalProperties.$bus = mitt()
// 或用 provide/inject
```

---

## 🟡 中频 / 中影响

### 7. $listeners 被移除，合并入 $attrs
```html
<!-- Vue 2 -->
<inner-comp v-bind="$props" v-on="$listeners" />

<!-- Vue 3：$attrs 现在包含所有透传属性和事件 -->
<inner-comp v-bind="$attrs" />
```

注意：Vue 3 的 `$attrs` 也包含 class 和 style。

### 8. $children 被移除
```js
// Vue 2
this.$children[0].someMethod()

// Vue 3：使用 template refs
```
```html
<template>
  <ChildComp ref="child" />
</template>
<script>
// Options API
this.$refs.child.someMethod()

// Composition API
const child = ref(null)
child.value.someMethod()
</script>
```

### 9. `<template v-for>` 的 key 位置变化
```html
<!-- Vue 2：key 放在子元素上 -->
<template v-for="item in list">
  <li :key="item.id">{{ item.name }}</li>
</template>

<!-- Vue 3：key 放在 <template> 上 -->
<template v-for="item in list" :key="item.id">
  <li>{{ item.name }}</li>
</template>
```

### 10. v-if 和 v-for 优先级互换
```html
<!-- Vue 2：v-for 优先级高于 v-if -->
<!-- Vue 3：v-if 优先级高于 v-for（v-if 中访问不到 v-for 的变量）-->

<!-- 解决方案：用 computed 过滤 -->
<li v-for="item in activeItems" :key="item.id">{{ item.name }}</li>
```

### 11. 函数式组件写法变化
```js
// Vue 2
export default {
  functional: true,
  render(h, { props, listeners }) {
    return h('button', { on: listeners }, props.label)
  }
}

// Vue 3：普通函数即可
import { h } from 'vue'
export default function MyButton(props, { emit, slots }) {
  return h('button', { onClick: () => emit('click') }, slots.default?.())
}
```

### 12. 异步组件写法变化
```js
// Vue 2
const AsyncComp = () => import('./MyComp.vue')
const AsyncCompWithOptions = {
  component: () => import('./MyComp.vue'),
  loading: LoadingComp,
  error: ErrorComp,
  delay: 200
}

// Vue 3
import { defineAsyncComponent } from 'vue'
const AsyncComp = defineAsyncComponent(() => import('./MyComp.vue'))
const AsyncCompWithOptions = defineAsyncComponent({
  loader: () => import('./MyComp.vue'),
  loadingComponent: LoadingComp,
  errorComponent: ErrorComp,
  delay: 200
})
```

---

## 🟢 低频 / 需知晓

### 13. Vue.set / Vue.delete 被移除
```js
// Vue 2（响应式添加/删除属性）
Vue.set(obj, 'key', value)
Vue.delete(obj, 'key')
this.$set(obj, 'key', value)

// Vue 3：Proxy 响应式，直接赋值即可
obj.key = value
delete obj.key
```

### 14. `data` 选项必须是函数
```js
// Vue 2：根实例允许对象
new Vue({ data: { count: 0 } })

// Vue 3：必须是函数
createApp({ data() { return { count: 0 } } })
```

### 15. Transition class 名称变化
| Vue 2 | Vue 3 |
|---|---|
| `v-enter` | `v-enter-from` |
| `v-leave` | `v-leave-from` |

### 16. `<TransitionGroup>` 不再渲染默认根元素
```html
<!-- Vue 2：默认渲染 <span> 包裹 -->
<!-- Vue 3：必须显式指定 tag 或使用 CSS -->
<TransitionGroup tag="ul" name="list">
  <li v-for="item in items" :key="item.id">{{ item }}</li>
</TransitionGroup>
```

### 17. `$attrs` 包含 class 和 style
Vue 3 中 `$attrs` 包含所有透传属性，包括 `class` 和 `style`。
如果不希望自动继承，需要设置 `inheritAttrs: false`。

### 18. Render 函数 API 变化
```js
// Vue 2
render(h) {
  return h('div', { class: 'foo', on: { click: handler } }, 'text')
}

// Vue 3
import { h } from 'vue'
render() {
  return h('div', { class: 'foo', onClick: handler }, 'text')
}
```
