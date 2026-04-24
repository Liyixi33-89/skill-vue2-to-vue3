# TypeScript 配置迁移：Vue 2 → Vue 3

> Vue 3 对 TypeScript 的支持是一等公民，无需额外插件即可获得完整类型推导。本指南覆盖 `tsconfig.json`、类型声明、组件写法等所有 TS 相关迁移点。

---

## 一、`tsconfig.json` 配置变化

### Vue 2 典型配置

```json
{
  "compilerOptions": {
    "target": "es5",
    "module": "commonjs",
    "strict": true,
    "jsx": "preserve",
    "importHelpers": true,
    "moduleResolution": "node",
    "experimentalDecorators": true,
    "skipLibCheck": true,
    "esModuleInterop": false,
    "allowSyntheticDefaultImports": true,
    "sourceMap": true,
    "baseUrl": ".",
    "types": ["webpack-env"],
    "paths": {
      "@/*": ["src/*"]
    },
    "lib": ["esnext", "dom", "dom.iterable", "scripthost"]
  },
  "include": ["src/**/*.ts", "src/**/*.tsx", "src/**/*.vue", "tests/**/*.ts"],
  "exclude": ["node_modules"]
}
```

### Vue 3 + Vite 推荐配置

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "module": "ESNext",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "skipLibCheck": true,

    /* 模块解析 */
    "moduleResolution": "bundler",       // ← Vue 3 + Vite 推荐，替代 "node"
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,                      // 由 Vite/vue-tsc 负责编译
    "jsx": "preserve",

    /* 严格模式 */
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,

    /* 路径别名 */
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src/**/*.ts", "src/**/*.tsx", "src/**/*.vue"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

### `tsconfig.node.json`（Vite 配置文件专用）

```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}
```

### 关键配置项对照

| 配置项 | Vue 2 | Vue 3 | 说明 |
|---|---|---|---|
| `target` | `"es5"` | `"ES2020"` | Vue 3 不支持 IE11 |
| `module` | `"commonjs"` | `"ESNext"` | ESM 优先 |
| `moduleResolution` | `"node"` | `"bundler"` | 配合 Vite/esbuild |
| `experimentalDecorators` | `true` | 可移除 | Class 组件已废弃 |
| `types` | `["webpack-env"]` | `["vite/client"]` | 环境类型声明 |
| `noEmit` | 无 | `true` | 由 vue-tsc 处理 |
| `useDefineForClassFields` | 无 | `true` | 与 ES2022 对齐 |

---

## 二、类型声明文件迁移

### `shims-vue.d.ts` 更新

```ts
// Vue 2：src/shims-vue.d.ts
declare module '*.vue' {
  import Vue from 'vue'
  export default Vue
}
```

```ts
// Vue 3：src/vite-env.d.ts（或 src/env.d.ts）
/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<object, object, unknown>
  export default component
}
```

### 移除不再需要的声明

```ts
// Vue 2 中常见，Vue 3 可删除
declare module 'vue/types/vue' {
  interface Vue {
    $http: AxiosInstance
    $bus: EventBus
  }
}

// Vue 3 替代方案：扩展 ComponentCustomProperties
declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    $http: AxiosInstance
    $bus: Emitter<Events>
    $t: (key: string) => string
  }
}
```

---

## 三、组件写法迁移

### `vue-class-component` / `vue-property-decorator` → `<script setup>`

这是 Vue 2 TS 项目最常见的写法，Vue 3 中装饰器方案已废弃：

```ts
// Vue 2：Class Component 写法
import Vue from 'vue'
import Component from 'vue-class-component'
import { Prop, Watch, Emit } from 'vue-property-decorator'

@Component({
  components: { MyChild }
})
export default class MyComp extends Vue {
  @Prop({ required: true }) title!: string
  @Prop({ default: 0 }) count!: number

  message = 'hello'
  loading = false

  get displayTitle(): string {
    return `${this.title} (${this.count})`
  }

  @Watch('count')
  onCountChange(newVal: number, oldVal: number): void {
    console.log(`count: ${oldVal} → ${newVal}`)
  }

  @Emit('update:count')
  increment(): number {
    return this.count + 1
  }

  async fetchData(): Promise<void> {
    this.loading = true
    // ...
    this.loading = false
  }

  mounted(): void {
    this.fetchData()
  }
}
```

```vue
<!-- Vue 3：<script setup> 写法（推荐） -->
<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'

interface Props {
  title: string
  count?: number
}

const props = withDefaults(defineProps<Props>(), {
  count: 0,
})

const emit = defineEmits<{
  'update:count': [value: number]
}>()

const message = ref('hello')
const loading = ref(false)

const displayTitle = computed(() => `${props.title} (${props.count})`)

watch(
  () => props.count,
  (newVal, oldVal) => {
    console.log(`count: ${oldVal} → ${newVal}`)
  },
)

const increment = () => {
  emit('update:count', props.count + 1)
}

const fetchData = async (): Promise<void> => {
  loading.value = true
  // ...
  loading.value = false
}

onMounted(() => {
  fetchData()
})
</script>
```

### Options API + TypeScript（保守迁移方案）

如果不想立即改为 `<script setup>`，可以用 `defineComponent` 保留 Options API 并获得类型支持：

```ts
// Vue 3 Options API + TypeScript
import { defineComponent, ref, computed } from 'vue'

export default defineComponent({
  name: 'MyComp',
  props: {
    title: { type: String, required: true },
    count: { type: Number, default: 0 },
  },
  emits: ['update:count'],
  setup(props, { emit }) {
    const loading = ref(false)

    const displayTitle = computed(() => `${props.title} (${props.count})`)

    const increment = () => emit('update:count', props.count + 1)

    return { loading, displayTitle, increment }
  },
})
```

---

## 四、`defineProps` / `defineEmits` 类型写法

### Props 类型定义

```ts
// 方式一：泛型语法（推荐，纯 TS）
const props = defineProps<{
  title: string
  count?: number
  items: string[]
  callback: (val: string) => void
}>()

// 方式二：带默认值（配合 withDefaults）
const props = withDefaults(
  defineProps<{
    title: string
    count?: number
    variant?: 'primary' | 'secondary'
  }>(),
  {
    count: 0,
    variant: 'primary',
  },
)

// 方式三：运行时声明（兼容 JS 项目）
const props = defineProps({
  title: { type: String, required: true },
  count: { type: Number, default: 0 },
})
```

### Emits 类型定义

```ts
// 方式一：泛型语法（推荐）
const emit = defineEmits<{
  change: [value: string]           // 具名元组参数
  'update:modelValue': [val: number]
  submit: [data: FormData, reset: () => void]
}>()

// 方式二：数组形式（无类型检查）
const emit = defineEmits(['change', 'update:modelValue'])
```

---

## 五、`ref` / `reactive` 类型推导

```ts
// ref：自动推导类型
const count = ref(0)           // Ref<number>
const name = ref('')           // Ref<string>
const user = ref<User | null>(null)  // 需要显式泛型

// reactive：自动推导
const state = reactive({
  count: 0,
  name: '',
  items: [] as string[],       // 空数组需要断言
})

// 复杂类型
interface UserState {
  id: number
  name: string
  roles: string[]
}
const userState = reactive<UserState>({
  id: 0,
  name: '',
  roles: [],
})
```

---

## 六、`provide` / `inject` 类型安全

```ts
// 使用 InjectionKey 保证类型安全
import type { InjectionKey, Ref } from 'vue'

// 定义 key（通常放在单独文件 keys.ts）
export const themeKey: InjectionKey<Ref<string>> = Symbol('theme')
export const userKey: InjectionKey<User> = Symbol('user')

// 父组件 provide
import { provide, ref } from 'vue'
import { themeKey } from './keys'

const theme = ref('dark')
provide(themeKey, theme)

// 子组件 inject（有类型推导）
import { inject } from 'vue'
import { themeKey } from './keys'

const theme = inject(themeKey)           // Ref<string> | undefined
const theme2 = inject(themeKey, ref('light'))  // Ref<string>（有默认值，非 undefined）
```

---

## 七、`vue-tsc` 类型检查

Vue 3 使用 `vue-tsc` 替代 `tsc` 进行 `.vue` 文件的类型检查：

```bash
# 安装
npm install -D vue-tsc

# 类型检查（不编译）
npx vue-tsc --noEmit

# 编译（生产构建前）
npx vue-tsc && vite build
```

```json
// package.json
{
  "scripts": {
    "typecheck": "vue-tsc --noEmit",
    "build": "vue-tsc --noEmit && vite build"
  }
}
```

---

## 八、常见 TS 报错与解决

| 报错 | 原因 | 解决 |
|---|---|---|
| `Property '$http' does not exist on type 'ComponentPublicInstance'` | 未扩展 `ComponentCustomProperties` | 在 `env.d.ts` 中扩展 `ComponentCustomProperties` |
| `Module '"*.vue"' has no exported member` | `shims-vue.d.ts` 未更新 | 更新为 Vue 3 的声明格式 |
| `Type 'string' is not assignable to type 'never'` | 空数组未指定类型 | 使用 `ref<string[]>([])` 或 `[] as string[]` |
| `Cannot find module '@/...'` | `tsconfig.json` 路径别名未配置 | 在 `paths` 中添加 `"@/*": ["./src/*"]` |
| `Experimental decorators` 警告 | `experimentalDecorators` 未开启 | 迁移到 `<script setup>`，或临时开启该选项 |
| `useDefineForClassFields` 冲突 | Class 字段初始化语义变化 | 迁移到 Composition API，或设为 `false`（不推荐） |

---

## 九、迁移步骤

```bash
# 1. 更新 tsconfig.json（参考上方配置）
# 2. 更新 shims-vue.d.ts → vite-env.d.ts
# 3. 安装 vue-tsc
npm install -D vue-tsc

# 4. 运行类型检查，查看报错
npx vue-tsc --noEmit

# 5. 逐步迁移 Class Component → <script setup>
#    优先迁移简单组件，复杂组件可先用 defineComponent Options API 过渡

# 6. 移除 vue-class-component / vue-property-decorator
npm uninstall vue-class-component vue-property-decorator
```
