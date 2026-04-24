# 测试框架迁移：Vue 2 → Vue 3

> Vue 3 生态推荐使用 **Vitest** 替代 Jest，两者 API 高度兼容，但配置方式和部分行为有差异。本指南覆盖 Jest → Vitest 迁移、`@vue/test-utils` v1→v2（详见 [test-utils-migration.md](./test-utils-migration.md)）以及测试文件的完整迁移流程。

---

## 一、测试框架选型

| 框架 | Vue 2 | Vue 3 | 说明 |
|---|---|---|---|
| **Jest** | ✅ 主流 | ⚠️ 可用但需额外配置 | 需要 `@vue/vue3-jest` 转换器 |
| **Vitest** | ❌ | ✅ 推荐 | 与 Vite 深度集成，零配置，API 兼容 Jest |
| **@vue/test-utils** | v1 | v2 | 详见 test-utils-migration.md |

> **推荐路径**：Jest → Vitest（API 几乎相同，迁移成本极低）

---

## 二、Jest → Vitest 迁移

### 安装

```bash
# 卸载 Jest 相关
npm uninstall jest @types/jest babel-jest vue-jest @vue/vue2-jest ts-jest jest-environment-jsdom

# 安装 Vitest
npm install -D vitest @vue/test-utils jsdom @vitest/coverage-v8

# 如果需要 UI 界面
npm install -D @vitest/ui
```

### 配置文件迁移

```js
// Jest: jest.config.js（Vue 2）
module.exports = {
  preset: '@vue/cli-plugin-unit-jest/presets/typescript-and-babel',
  transform: {
    '^.+\\.vue$': 'vue-jest',
    '^.+\\.[jt]sx?$': 'babel-jest',
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testEnvironment: 'jsdom',
  collectCoverageFrom: ['src/**/*.{js,ts,vue}'],
  coverageDirectory: 'coverage',
}
```

```ts
// Vitest: vite.config.ts（在 Vite 配置中内联）
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: { '@': resolve(__dirname, 'src') },
  },
  test: {
    environment: 'jsdom',           // 或 'happy-dom'（更快）
    globals: true,                  // 无需 import describe/it/expect
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['src/**/*.{ts,vue}'],
      exclude: ['src/**/*.d.ts'],
    },
  },
})
```

或者单独的 `vitest.config.ts`：

```ts
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: { '@': resolve(__dirname, 'src') },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
  },
})
```

### `package.json` scripts 更新

```json
// Jest
{
  "scripts": {
    "test":          "jest",
    "test:watch":    "jest --watch",
    "test:coverage": "jest --coverage"
  }
}

// Vitest
{
  "scripts": {
    "test":          "vitest run",
    "test:watch":    "vitest",
    "test:coverage": "vitest run --coverage",
    "test:ui":       "vitest --ui"
  }
}
```

---

## 三、API 兼容性对照

Vitest 的 API 与 Jest 高度兼容，大多数测试文件**无需修改**即可运行：

### 完全兼容（无需改动）

```ts
// 以下 API 在 Vitest 中完全兼容
describe / it / test
expect
beforeAll / afterAll / beforeEach / afterEach
vi.fn()          // 对应 jest.fn()
vi.spyOn()       // 对应 jest.spyOn()
vi.mock()        // 对应 jest.mock()
vi.useFakeTimers() // 对应 jest.useFakeTimers()
```

### 需要替换的 API

```ts
// jest.* → vi.*
jest.fn()              → vi.fn()
jest.spyOn()           → vi.spyOn()
jest.mock()            → vi.mock()
jest.clearAllMocks()   → vi.clearAllMocks()
jest.resetAllMocks()   → vi.resetAllMocks()
jest.restoreAllMocks() → vi.restoreAllMocks()
jest.useFakeTimers()   → vi.useFakeTimers()
jest.useRealTimers()   → vi.useRealTimers()
jest.runAllTimers()    → vi.runAllTimers()
jest.advanceTimersByTime(ms) → vi.advanceTimersByTime(ms)
```

### import 语句更新

```ts
// Jest（通常通过 globals: true 无需导入）
import { describe, it, expect, jest } from '@jest/globals'

// Vitest（开启 globals: true 后同样无需导入，但显式导入更清晰）
import { describe, it, expect, vi } from 'vitest'
```

---

## 四、Mock 写法变化

### 模块 Mock

```ts
// Jest
jest.mock('@/utils/api', () => ({
  fetchUser: jest.fn().mockResolvedValue({ id: 1, name: 'test' }),
}))

// Vitest（写法相同，替换 jest → vi）
vi.mock('@/utils/api', () => ({
  fetchUser: vi.fn().mockResolvedValue({ id: 1, name: 'test' }),
}))
```

### 自动 Mock

```ts
// Vitest 支持自动 mock（在 __mocks__ 目录放置同名文件）
// 或使用 vi.mock() 不传工厂函数
vi.mock('@/utils/api')  // 自动 mock 所有导出
```

### 定时器 Mock

```ts
// Jest
jest.useFakeTimers()
jest.advanceTimersByTime(1000)
jest.useRealTimers()

// Vitest（完全相同）
vi.useFakeTimers()
vi.advanceTimersByTime(1000)
vi.useRealTimers()
```

---

## 五、Setup 文件迁移

```ts
// tests/setup.ts（Vue 2 + Jest）
import Vue from 'vue'
import ElementUI from 'element-ui'
Vue.use(ElementUI)
```

```ts
// tests/setup.ts（Vue 3 + Vitest）
import { config } from '@vue/test-utils'
import ElementPlus from 'element-plus'
import { createPinia } from 'pinia'

// 全局配置（所有测试共享）
config.global.plugins = [ElementPlus, createPinia()]
config.global.mocks = {
  $t: (key: string) => key,  // i18n mock
}
config.global.stubs = {
  RouterLink: true,
  RouterView: true,
  Teleport: true,
}
```

---

## 六、快照测试

```ts
// Jest + Vue 2
import { shallowMount } from '@vue/test-utils'
it('matches snapshot', () => {
  const wrapper = shallowMount(MyComp, { propsData: { title: 'test' } })
  expect(wrapper.html()).toMatchSnapshot()
})

// Vitest + Vue 3
import { shallowMount } from '@vue/test-utils'
it('matches snapshot', () => {
  const wrapper = shallowMount(MyComp, { props: { title: 'test' } })
  expect(wrapper.html()).toMatchSnapshot()
  // 或使用内联快照
  expect(wrapper.html()).toMatchInlineSnapshot(`"<div class="title">test</div>"`)
})
```

---

## 七、覆盖率配置

```ts
// vitest.config.ts
{
  test: {
    coverage: {
      provider: 'v8',          // 或 'istanbul'
      reporter: ['text', 'html', 'lcov', 'json-summary'],
      include: ['src/**/*.{ts,vue}'],
      exclude: [
        'src/**/*.d.ts',
        'src/main.ts',
        'src/**/*.stories.ts',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 70,
        statements: 80,
      },
    },
  },
}
```

---

## 八、Composition API 测试最佳实践

### 测试 `<script setup>` 组件

```ts
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import MyComp from '@/components/MyComp.vue'

describe('MyComp', () => {
  it('响应 props 变化', async () => {
    const wrapper = mount(MyComp, {
      props: { count: 0 },
    })

    expect(wrapper.text()).toContain('0')

    await wrapper.setProps({ count: 5 })
    expect(wrapper.text()).toContain('5')
  })

  it('触发事件', async () => {
    const wrapper = mount(MyComp, { props: { count: 0 } })

    await wrapper.find('button').trigger('click')

    expect(wrapper.emitted('update:count')).toBeTruthy()
    expect(wrapper.emitted('update:count')![0]).toEqual([1])
  })
})
```

### 测试 Composable（组合式函数）

```ts
// composables/useCounter.ts
import { ref } from 'vue'

export const useCounter = (initial = 0) => {
  const count = ref(initial)
  const increment = () => count.value++
  const decrement = () => count.value--
  return { count, increment, decrement }
}

// tests/composables/useCounter.test.ts
import { useCounter } from '@/composables/useCounter'

describe('useCounter', () => {
  it('初始值正确', () => {
    const { count } = useCounter(5)
    expect(count.value).toBe(5)
  })

  it('increment 增加计数', () => {
    const { count, increment } = useCounter()
    increment()
    expect(count.value).toBe(1)
  })
})
```

---

## 九、完整迁移步骤

```bash
# 1. 安装 Vitest
npm install -D vitest @vitest/coverage-v8 jsdom

# 2. 更新 vite.config.ts，添加 test 配置块

# 3. 更新 package.json scripts（jest → vitest）

# 4. 全局替换 jest.* → vi.*
#    可用编辑器全局搜索替换

# 5. 更新 @vue/test-utils v1 → v2
npx vue2to3 fix test-utils ./tests

# 6. 更新 tests/setup.ts

# 7. 运行测试验证
npm test

# 8. 卸载 Jest 相关依赖
npm uninstall jest @types/jest babel-jest vue-jest ts-jest
```
