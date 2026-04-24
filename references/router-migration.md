# Vue Router 3 → 4 迁移指南

## 安装

```bash
npm install vue-router@^4.3.0
```

## 核心 API 变化

### 创建路由实例

```js
// Vue Router 3 (Vue 2)
import VueRouter from 'vue-router'
import Vue from 'vue'
Vue.use(VueRouter)

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes: [...]
})

new Vue({ router, render: h => h(App) }).$mount('#app')
```

```js
// Vue Router 4 (Vue 3)
import { createRouter, createWebHistory, createWebHashHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),  // 对应 mode: 'history'
  // history: createWebHashHistory(),  // 对应 mode: 'hash'
  routes: [...]
})

const app = createApp(App)
app.use(router)
app.mount('#app')
```

### mode 选项变化

| Vue Router 3 | Vue Router 4 |
|---|---|
| `mode: 'history'` | `history: createWebHistory()` |
| `mode: 'hash'` | `history: createWebHashHistory()` |
| `mode: 'abstract'` | `history: createMemoryHistory()` |

---

## 组件内使用

### Options API（变化不大）

```js
// Vue 2 / 3 Options API 中，$router 和 $route 基本一致
this.$router.push('/home')
this.$router.replace({ name: 'user', params: { id: 1 } })
this.$route.params.id
this.$route.query.keyword
```

### Composition API（Vue Router 4 新增）

```js
import { useRouter, useRoute } from 'vue-router'

export default {
  setup() {
    const router = useRouter()
    const route = useRoute()

    console.log(route.params.id)
    console.log(route.query.keyword)

    function goHome() {
      router.push('/home')
    }

    // 监听路由变化
    watch(() => route.params.id, (newId) => {
      // 处理路由参数变化
    })

    return { goHome }
  }
}
```

---

## 破坏性变化

### 1. `<router-view>` 和 `<router-link>` 的 slot 变化

```html
<!-- Vue Router 3 -->
<router-link to="/" v-slot="{ href, route, navigate, isActive }">
  <a :href="href" @click="navigate">{{ route.fullPath }}</a>
</router-link>

<!-- Vue Router 4：custom 属性必须显式加 -->
<router-link to="/" custom v-slot="{ href, route, navigate, isActive }">
  <a :href="href" @click="navigate">{{ route.fullPath }}</a>
</router-link>
```

### 2. `router-view` 的 slot

```html
<!-- Vue Router 4 -->
<router-view v-slot="{ Component, route }">
  <transition :name="route.meta.transition || 'fade'">
    <component :is="Component" />
  </transition>
</router-view>
```

### 3. `keep-alive` 和 `router-view`

```html
<!-- Vue Router 3 -->
<keep-alive>
  <router-view />
</keep-alive>

<!-- Vue Router 4：必须放在 slot 里 -->
<router-view v-slot="{ Component }">
  <keep-alive>
    <component :is="Component" />
  </keep-alive>
</router-view>
```

### 4. 导航守卫的 `next` 参数（可选了）

```js
// Vue Router 3
router.beforeEach((to, from, next) => {
  if (!isAuthenticated) next('/login')
  else next()
})

// Vue Router 4（next 仍支持，但可以直接 return）
router.beforeEach((to, from) => {
  if (!isAuthenticated) return '/login'
  // return true / return undefined 表示放行
})
```

### 5. `router.getMatchedComponents()` 被移除

```js
// Vue Router 3
router.getMatchedComponents()

// Vue Router 4
router.currentRoute.value.matched.flatMap(record => Object.values(record.components))
```

### 6. `scrollBehavior` 返回值变化

```js
// Vue Router 3
scrollBehavior(to, from, savedPosition) {
  return { x: 0, y: 0 }
}

// Vue Router 4：x/y 改为 left/top
scrollBehavior(to, from, savedPosition) {
  return { left: 0, top: 0 }
  // 或者
  return savedPosition || { top: 0 }
}
```

---

## 迁移步骤

1. 替换 `new VueRouter()` → `createRouter()`
2. 替换 `mode: 'history'` → `history: createWebHistory()`
3. 从 `Vue.use(VueRouter)` 改为 `app.use(router)`
4. 检查所有 `<router-link>` 的 `v-slot` 用法，添加 `custom`
5. 检查所有 `<keep-alive>` + `<router-view>` 的组合写法
6. 更新 `scrollBehavior` 的 `x/y` → `left/top`
7. 将导航守卫的 `next()` 改为 `return`（可选但推荐）
