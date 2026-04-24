# Global API 迁移指南

> Vue 3 将所有全局 API 从 `Vue` 构造函数迁移到应用实例（`app`），实现多实例隔离。

## 核心变化速查

| Vue 2 | Vue 3 | 说明 |
|---|---|---|
| `new Vue({ el, render })` | `createApp(App).mount('#app')` | 创建应用 |
| `Vue.use(plugin)` | `app.use(plugin)` | 安装插件 |
| `Vue.mixin(mixin)` | `app.mixin(mixin)` | 全局混入 |
| `Vue.component(name, comp)` | `app.component(name, comp)` | 全局组件 |
| `Vue.directive(name, dir)` | `app.directive(name, dir)` | 全局指令 |
| `Vue.prototype.$x = y` | `app.config.globalProperties.$x = y` | 全局属性 |
| `Vue.observable(obj)` | `reactive(obj)` | 响应式对象 |
| `Vue.set(obj, key, val)` | `obj[key] = val` | 直接赋值 |
| `Vue.delete(obj, key)` | `delete obj[key]` | 直接删除 |
| `Vue.nextTick(fn)` | `nextTick(fn)` 或 `import { nextTick }` | 下一帧 |
| `Vue.version` | `app.version` | 版本号 |

## 详细迁移示例

### main.js 完整迁移

```js
// ── Vue 2 ──────────────────────────────────────────────────────────
import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import ElementUI from 'element-ui'
import axios from 'axios'

Vue.use(ElementUI)
Vue.use(router)
Vue.prototype.$http = axios
Vue.config.productionTip = false

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app')

// ── Vue 3 ──────────────────────────────────────────────────────────
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import axios from 'axios'

const app = createApp(App)

app.use(ElementPlus)
app.use(router)
app.use(createPinia())
app.config.globalProperties.$http = axios

app.mount('#app')
```

### 全局组件注册

```js
// Vue 2
Vue.component('BaseButton', BaseButton)
Vue.component('BaseIcon', BaseIcon)

// Vue 3
app.component('BaseButton', BaseButton)
app.component('BaseIcon', BaseIcon)
```

### 全局自定义指令

```js
// Vue 2
Vue.directive('focus', {
  inserted(el) { el.focus() }
})

// Vue 3（钩子名称也有变化）
app.directive('focus', {
  mounted(el) { el.focus() }
})
```

### 全局混入（不推荐，尽量改用 Composable）

```js
// Vue 2
Vue.mixin({
  created() { console.log('mixin created') }
})

// Vue 3（仍支持，但不推荐）
app.mixin({
  created() { console.log('mixin created') }
})

// 推荐替代：Composable
// composables/useLogger.ts
export const useLogger = () => {
  onMounted(() => console.log('mounted'))
}
```

### Vue.observable → reactive

```js
// Vue 2
const state = Vue.observable({ count: 0 })

// Vue 3
import { reactive } from 'vue'
const state = reactive({ count: 0 })
```

### Vue.set / Vue.delete → 直接操作

```js
// Vue 2（需要 Vue.set 触发响应式）
Vue.set(this.obj, 'newKey', value)
Vue.delete(this.obj, 'key')
this.$set(this.arr, index, value)

// Vue 3（Proxy 响应式，直接操作即可）
this.obj.newKey = value
delete this.obj.key
this.arr[index] = value
```

## 自动修复

运行以下命令自动处理大部分 Global API 变更（会添加 TODO 注释标记需要人工确认的地方）：

```bash
npx vue2to3 fix global-api ./src
```

**自动处理：**
- `Vue.observable()` → `reactive()`
- `Vue.prototype.$x` → `app.config.globalProperties.$x`
- `Vue.use/mixin/component/directive/set/delete` → 添加 TODO 注释

**需要人工处理：**
- `new Vue({...}).$mount()` → `createApp(App).mount()` 的完整改写
- 确认 `app` 变量已正确定义并导出
