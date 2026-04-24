# Vuex → Pinia 迁移指南

## 为什么迁移到 Pinia？

| 对比项 | Vuex 4 | Pinia |
|---|---|---|
| 官方推荐 | 维护模式 | ✅ Vue 官方推荐 |
| TypeScript | 繁琐 | ✅ 一等公民 |
| Devtools | 支持 | ✅ 更好的支持 |
| 模块化 | Modules 嵌套 | ✅ 扁平 Store |
| Mutations | 必须 | ✅ 不需要 |
| 体积 | ~10kb | ~1.5kb |
| Composition API | 不原生 | ✅ 原生支持 |

> Vuex 4 仍然支持 Vue 3，如果项目大、迁移风险高，可以先升级到 Vuex 4 作为过渡，再择机迁移 Pinia。

---

## 安装

```bash
npm install pinia
npm uninstall vuex  # 确认完全迁移后再卸载
```

```js
// main.js
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'

const app = createApp(App)
app.use(createPinia())
app.mount('#app')
```

---

## 核心概念对比

### 定义 Store

```js
// Vuex Module
export default {
  namespaced: true,
  state: () => ({
    count: 0,
    user: null
  }),
  getters: {
    doubleCount: (state) => state.count * 2,
    isLoggedIn: (state) => !!state.user
  },
  mutations: {
    INCREMENT(state) { state.count++ },
    SET_USER(state, user) { state.user = user }
  },
  actions: {
    async fetchUser({ commit }, id) {
      const user = await api.getUser(id)
      commit('SET_USER', user)
    }
  }
}
```

```js
// Pinia Store（Options 风格，迁移成本低）
import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', {
  state: () => ({
    count: 0,
    user: null
  }),
  getters: {
    doubleCount: (state) => state.count * 2,
    isLoggedIn: (state) => !!state.user
  },
  actions: {
    increment() {
      this.count++  // 直接修改，无需 mutation！
    },
    setUser(user) {
      this.user = user
    },
    async fetchUser(id) {
      const user = await api.getUser(id)
      this.user = user  // 直接赋值
    }
  }
})
```

```js
// Pinia Store（Composition API 风格，更灵活）
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useUserStore = defineStore('user', () => {
  const count = ref(0)
  const user = ref(null)

  const doubleCount = computed(() => count.value * 2)
  const isLoggedIn = computed(() => !!user.value)

  function increment() { count.value++ }
  async function fetchUser(id) {
    user.value = await api.getUser(id)
  }

  return { count, user, doubleCount, isLoggedIn, increment, fetchUser }
})
```

---

### 组件中使用

```js
// Vuex 组件中
import { mapState, mapGetters, mapMutations, mapActions } from 'vuex'

export default {
  computed: {
    ...mapState('user', ['count', 'user']),
    ...mapGetters('user', ['doubleCount', 'isLoggedIn'])
  },
  methods: {
    ...mapMutations('user', ['INCREMENT', 'SET_USER']),
    ...mapActions('user', ['fetchUser'])
  }
}
```

```js
// Pinia 组件中（Composition API）
import { useUserStore } from '@/stores/user'

export default {
  setup() {
    const userStore = useUserStore()

    // 直接访问 state
    // userStore.count, userStore.user

    // 解构（需 storeToRefs 保持响应式）
    const { count, user, doubleCount } = storeToRefs(userStore)
    const { increment, fetchUser } = userStore  // actions 直接解构

    return { count, user, doubleCount, increment, fetchUser }
  }
}
```

```js
// Pinia 在 Options API 中（兼容性写法）
import { useUserStore } from '@/stores/user'
import { mapState, mapActions } from 'pinia'

export default {
  computed: {
    ...mapState(useUserStore, ['count', 'user', 'doubleCount'])
  },
  methods: {
    ...mapActions(useUserStore, ['increment', 'fetchUser'])
  }
}
```

---

## 迁移步骤

1. **安装 Pinia**，在 main.js 注册
2. **逐个迁移 Vuex Module** → Pinia Store（建议按业务模块一个个来）
3. **删除 mutations**，把逻辑合并进 actions
4. **更新组件引用**：把 `mapState/mapGetters/mapMutations/mapActions` 换成 `useXxxStore()`
5. **处理 store 间的调用**：Pinia 的 store 可以直接互相引用，不需要 rootGetters
6. **迁移完成后**卸载 Vuex

---

## 常见 Vuex 模式 → Pinia 对照

```js
// Vuex: commit mutation
this.$store.commit('user/INCREMENT')
store.commit('user/SET_USER', user)

// Pinia
const userStore = useUserStore()
userStore.increment()
userStore.user = user  // 可以直接赋值！

// Vuex: dispatch action
this.$store.dispatch('user/fetchUser', id)

// Pinia
await userStore.fetchUser(id)

// Vuex: getters
this.$store.getters['user/doubleCount']

// Pinia
userStore.doubleCount

// Vuex: $patch（批量修改，Pinia 也支持）
userStore.$patch({ count: 10, user: null })
userStore.$patch((state) => {
  state.count++
  state.user = null
})

// Vuex: subscribe
store.subscribe((mutation, state) => {})

// Pinia
userStore.$subscribe((mutation, state) => {})
```
