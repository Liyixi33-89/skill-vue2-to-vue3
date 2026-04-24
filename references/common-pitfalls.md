# Vue 2 → Vue 3 迁移常见坑

## 坑 1：`@vue/compat` 兼容模式的陷阱

`@vue/compat` 让 Vue 3 以兼容模式运行 Vue 2 代码，但：
- **不是所有 API 都兼容**：filters、$on/$off 仍然移除
- **性能开销**：compat 模式有额外 runtime 检查，不适合生产
- **目的是过渡**：用完就删，不要依赖它

```js
// 使用 compat 模式
import { createCompatVue } from '@vue/compat'
const Vue = createCompatVue()
Vue.config.compatConfig = { MODE: 2 }  // 全部兼容 Vue 2
// 或精细控制
Vue.config.compatConfig = {
  GLOBAL_MOUNT: false,  // 关闭某个特定兼容
}
```

---

## 坑 2：Vetur → Volar

Vue 2 使用 Vetur 作为 VSCode 插件，Vue 3 必须用 Volar（现在叫 Vue - Official）：
- 卸载 Vetur，安装 `Vue - Official` 插件
- Volar 支持 `<script setup>` 和 TypeScript 类型检查
- 两个插件共存会导致诊断冲突

---

## 坑 3：Vue CLI → Vite 的环境变量

```js
// Vue CLI（webpack）
process.env.VUE_APP_API_URL
process.env.NODE_ENV

// Vite
import.meta.env.VITE_API_URL  // 前缀从 VUE_APP_ 改为 VITE_
import.meta.env.MODE           // 替代 NODE_ENV（在模板/逻辑中）
import.meta.env.DEV            // 布尔值
import.meta.env.PROD           // 布尔值
```

`.env` 文件前缀也要改：
```
# Vue CLI
VUE_APP_API_URL=https://api.example.com

# Vite
VITE_API_URL=https://api.example.com
```

---

## 坑 4：`require()` 在 Vite 中不可用

Vite 是 ESM-first，不支持 CommonJS `require()`：

```js
// Vue CLI（webpack）可以用
const img = require('@/assets/logo.png')
const { default: axios } = require('axios')

// Vite 必须用 import
import logo from '@/assets/logo.png'
import axios from 'axios'

// 动态 require → 动态 import
const module = await import(`./locales/${lang}.json`)
```

---

## 坑 5：TypeScript 中 `this` 类型丢失

Vue 2 的 TypeScript 支持依赖 `vue-class-component` 或 `this` 类型推导，Vue 3 推荐直接用 `<script setup>` + `defineProps`：

```ts
// Vue 2 Class Component
@Component
class MyComp extends Vue {
  @Prop() userId!: number
  message = ''
}

// Vue 3 推荐
const props = defineProps<{ userId: number }>()
const message = ref('')
```

---

## 坑 6：动态组件和异步组件混淆

```js
// Vue 2：箭头函数就是异步组件
components: {
  MyComp: () => import('./MyComp.vue')
}

// Vue 3：必须用 defineAsyncComponent
import { defineAsyncComponent } from 'vue'
components: {
  MyComp: defineAsyncComponent(() => import('./MyComp.vue'))
}
// 否则会被当作普通的函数式组件处理
```

---

## 坑 7：el-dialog 的 `append-to-body` 行为变化

Element Plus 中 `<el-dialog>` 默认渲染到 `body`，而 Element UI 默认在原位置。
如果 z-index 或弹层遮罩出现问题，检查此属性。

---

## 坑 8：Transition 动画 class 名

```css
/* Vue 2 */
.v-enter { opacity: 0; }
.v-leave-to { opacity: 0; }

/* Vue 3：.v-enter 变成 .v-enter-from */
.v-enter-from { opacity: 0; }
.v-leave-to { opacity: 0; }

/* 如果不改，动画初始状态会失效（入场动画瞬间出现而不是渐变）*/
```

---

## 坑 9：provide/inject 非响应式

```js
// Vue 2：inject 的值是一次性的，不响应式
provide() {
  return { color: this.color }  // ❌ color 变化不会同步到子孙组件
}

// Vue 3：使用 computed 或 ref 保持响应式
provide('color', computed(() => this.color))  // Options API
// 或
const color = ref('red')
provide('color', color)  // Composition API
```

---

## 坑 10：Vuex 4 中的 TypeScript 支持很差

如果项目用 TypeScript，迁移到 Pinia 是强烈建议的，因为：
- Vuex 4 的 `useStore()` 返回 `Store<any>`，无类型
- Pinia 的 `useXxxStore()` 有完整类型推导，无需额外配置
