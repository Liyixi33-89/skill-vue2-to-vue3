# Options API → Composition API 迁移指南

> 注意：Composition API 迁移是**可选的**，Options API 在 Vue 3 中完全支持。
> 建议在完成破坏性变更修复后，再考虑是否进行此项迁移。

## 对照表

| Options API | Composition API |
|---|---|
| `data()` | `ref()` / `reactive()` |
| `computed` | `computed()` |
| `watch` | `watch()` / `watchEffect()` |
| `methods` | 普通函数 |
| `mounted` | `onMounted()` |
| `props` | `defineProps()` |
| `emits` | `defineEmits()` |
| `provide/inject` | `provide()` / `inject()` |
| `$refs` | `ref()` |
| `this` | 无需 this |

---

## 完整迁移示例

```vue
<!-- Vue 2 / Vue 3 Options API -->
<script>
import { mapState, mapActions } from 'vuex'
import ChildComp from './ChildComp.vue'

export default {
  name: 'UserProfile',
  components: { ChildComp },
  props: {
    userId: {
      type: Number,
      required: true
    }
  },
  data() {
    return {
      user: null,
      loading: false,
      searchText: ''
    }
  },
  computed: {
    ...mapState('auth', ['currentUser']),
    fullName() {
      return this.user ? `${this.user.firstName} ${this.user.lastName}` : ''
    },
    filteredList() {
      return this.list.filter(item =>
        item.name.includes(this.searchText)
      )
    }
  },
  watch: {
    userId: {
      immediate: true,
      handler(newId) {
        this.fetchUser(newId)
      }
    }
  },
  mounted() {
    document.title = 'User Profile'
  },
  beforeUnmount() {
    document.title = ''
  },
  methods: {
    ...mapActions('user', ['saveUser']),
    async fetchUser(id) {
      this.loading = true
      try {
        this.user = await api.getUser(id)
      } finally {
        this.loading = false
      }
    },
    handleSave() {
      this.saveUser(this.user)
    }
  }
}
</script>
```

```vue
<!-- Vue 3 Composition API + <script setup> -->
<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useUserStore } from '@/stores/user'
import { useAuthStore } from '@/stores/auth'
import ChildComp from './ChildComp.vue'

// Props & Emits
const props = defineProps({
  userId: {
    type: Number,
    required: true
  }
})

// Stores（Pinia）
const userStore = useUserStore()
const authStore = useAuthStore()
const { currentUser } = storeToRefs(authStore)

// State
const user = ref(null)
const loading = ref(false)
const searchText = ref('')

// Computed
const fullName = computed(() => {
  return user.value ? `${user.value.firstName} ${user.value.lastName}` : ''
})

const filteredList = computed(() => {
  return list.value.filter(item => item.name.includes(searchText.value))
})

// Methods
async function fetchUser(id) {
  loading.value = true
  try {
    user.value = await api.getUser(id)
  } finally {
    loading.value = false
  }
}

function handleSave() {
  userStore.saveUser(user.value)
}

// Watch
watch(() => props.userId, (newId) => {
  fetchUser(newId)
}, { immediate: true })

// Lifecycle
onMounted(() => {
  document.title = 'User Profile'
})

onBeforeUnmount(() => {
  document.title = ''
})
</script>
```

---

## Composables（可复用逻辑）

Composition API 最大的优势是可以把逻辑提取为 Composable：

```js
// composables/useUser.js
import { ref } from 'vue'

export function useUser(userId) {
  const user = ref(null)
  const loading = ref(false)
  const error = ref(null)

  async function fetchUser(id) {
    loading.value = true
    error.value = null
    try {
      user.value = await api.getUser(id)
    } catch (e) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  watch(userId, fetchUser, { immediate: true })

  return { user, loading, error, fetchUser }
}

// 组件中使用
import { useUser } from '@/composables/useUser'
const { user, loading } = useUser(toRef(props, 'userId'))
```

---

## `<script setup>` 语法糖

Vue 3.2+ 推荐使用 `<script setup>`，更简洁：

```vue
<script setup>
// 不需要 return，所有顶层绑定自动暴露给模板
const count = ref(0)
const double = computed(() => count.value * 2)

// defineProps / defineEmits 是编译器宏，不需要导入
const props = defineProps(['modelValue'])
const emit = defineEmits(['update:modelValue'])

// defineExpose：暴露给父组件通过 ref 访问
defineExpose({ count, reset: () => { count.value = 0 } })
</script>
```

---

## 迁移建议

1. **不要强制迁移**：Options API 在 Vue 3 完全可用
2. **新组件用 Composition API**：存量代码可以保持 Options API
3. **先提取 Mixins → Composables**：这是性价比最高的迁移
4. **逐文件迁移**：每次迁移一个组件，充分测试后再继续
