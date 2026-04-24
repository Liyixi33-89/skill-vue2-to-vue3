# @vue/test-utils v1 → v2 迁移指南

> `@vue/test-utils` v2 专为 Vue 3 设计，与 v1 有多处破坏性变更。本指南覆盖所有高频变更场景。

## 安装

```bash
# 卸载 v1
npm uninstall @vue/test-utils

# 安装 v2
npm install -D @vue/test-utils@^2.4.0

# 配套测试框架（推荐 Vitest，也支持 Jest）
npm install -D vitest
# 或
npm install -D jest @vue/vue3-jest babel-jest
```

> ⚠️ **自动修复**：运行 `npx vue2to3 fix test-utils ./tests` 可自动处理大部分变更

---

## 一、mount / shallowMount 选项变化

### `propsData` → `props`

```js
// v1
mount(MyComp, { propsData: { title: 'hello', count: 1 } })

// v2
mount(MyComp, { props: { title: 'hello', count: 1 } })
```

### `listeners` → `attrs`

v2 中 `$listeners` 已合并入 `$attrs`，对应挂载选项也随之变化：

```js
// v1
mount(MyComp, {
  listeners: {
    click: jest.fn(),
    'custom-event': handler,
  }
})

// v2
mount(MyComp, {
  attrs: {
    onClick: jest.fn(),          // 注意：事件名改为 camelCase
    onCustomEvent: handler,
  }
})
```

### `scopedSlots` → `slots`

v2 统一了普通 slot 和 scoped slot，全部使用 `slots`：

```js
// v1
mount(MyComp, {
  slots: { default: '<div>content</div>' },
  scopedSlots: {
    header: '<template #header="{ title }"><h1>{{ title }}</h1></template>'
  }
})

// v2：统一使用 slots
mount(MyComp, {
  slots: {
    default: '<div>content</div>',
    header: ({ title }) => `<h1>${title}</h1>`,  // 函数形式
  }
})
```

---

## 二、`createLocalVue` 已移除 → `config.global`

这是 v1→v2 最大的变化之一。v1 通过 `createLocalVue()` 隔离插件注册，v2 改为在 `mount` 选项中通过 `global` 配置：

```js
// v1
import { createLocalVue, mount } from '@vue/test-utils'
import VueRouter from 'vue-router'
import Vuex from 'vuex'

const localVue = createLocalVue()
localVue.use(VueRouter)
localVue.use(Vuex)
localVue.component('MyIcon', MyIcon)

mount(MyComp, { localVue })
```

```js
// v2
import { mount } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
import { createPinia } from 'pinia'

const router = createRouter({ history: createWebHistory(), routes: [] })

mount(MyComp, {
  global: {
    plugins: [router, createPinia()],
    components: { MyIcon },
    directives: { focus: vFocus },
    mocks: { $t: (key) => key },       // 模拟全局属性
    stubs: { MyHeavyComp: true },      // 存根组件
    provide: { theme: 'dark' },        // provide/inject
  }
})
```

### 全局默认配置（适用于所有测试）

```js
// v2：在 setup 文件中配置全局默认值
import { config } from '@vue/test-utils'
import { createPinia } from 'pinia'

config.global.plugins = [createPinia()]
config.global.mocks = { $t: (key) => key }
config.global.stubs = { RouterLink: true, RouterView: true }
```

---

## 三、Wrapper 方法变化

### `wrapper.destroy()` → `wrapper.unmount()`

```js
// v1
afterEach(() => { wrapper.destroy() })

// v2
afterEach(() => { wrapper.unmount() })
```

### `wrapper.setData()` → 直接操作 `wrapper.vm`

```js
// v1
await wrapper.setData({ count: 5, name: 'test' })

// v2：直接操作响应式数据
wrapper.vm.count = 5
wrapper.vm.name = 'test'
await nextTick()  // 等待 DOM 更新

// 或者使用 wrapper.setProps()（仅适用于 props）
await wrapper.setProps({ title: 'new title' })
```

### `wrapper.contains()` → `wrapper.find().exists()`

```js
// v1
expect(wrapper.contains('.my-class')).toBe(true)
expect(wrapper.contains(MyComponent)).toBe(true)

// v2
expect(wrapper.find('.my-class').exists()).toBe(true)
expect(wrapper.findComponent(MyComponent).exists()).toBe(true)
```

### `wrapper.isEmpty()` → 手动检查

```js
// v1
expect(wrapper.isEmpty()).toBe(true)

// v2
expect(wrapper.html()).toBe('')
// 或
expect(wrapper.element.children.length).toBe(0)
```

### `wrapper.is()` → 已移除

```js
// v1
expect(wrapper.is('div')).toBe(true)
expect(wrapper.is(MyComponent)).toBe(true)

// v2
expect(wrapper.element.tagName).toBe('DIV')
expect(wrapper.findComponent(MyComponent).exists()).toBe(true)
```

---

## 四、`findAll` 返回值变化

v1 返回 `WrapperArray`，v2 直接返回 `DOMWrapper[]` 数组：

```js
// v1
const items = wrapper.findAll('.item')
items.at(0).trigger('click')
items.wrappers.forEach(w => w.text())

// v2
const items = wrapper.findAll('.item')
items[0].trigger('click')          // 直接用数组下标
items.forEach(w => w.text())       // 普通数组方法
```

---

## 五、`flushPromises` 导入变化

```js
// v1：需要单独安装 flush-promises 包
import flushPromises from 'flush-promises'

// v2：直接从 @vue/test-utils 导入
import { flushPromises } from '@vue/test-utils'
```

---

## 六、TypeScript 类型变化

```ts
// v1
import { Wrapper } from '@vue/test-utils'
let wrapper: Wrapper<Vue>
let wrapper: Wrapper<MyComponent>

// v2
import { VueWrapper, DOMWrapper } from '@vue/test-utils'
let wrapper: VueWrapper<ComponentPublicInstance>
let wrapper: VueWrapper<InstanceType<typeof MyComponent>>
let domWrapper: DOMWrapper<HTMLElement>
```

---

## 七、`stubs` 格式变化

```js
// v1
mount(MyComp, {
  stubs: {
    MyChild: true,                    // 简单存根
    MyChild: { template: '<div />' }, // 自定义存根
    'my-child': true,                 // 字符串形式
  }
})

// v2（基本兼容，但推荐新写法）
mount(MyComp, {
  global: {
    stubs: {
      MyChild: true,
      MyChild: { template: '<div />' },
      // v2 新增：defineComponent 存根
      MyChild: defineComponent({ template: '<slot />' }),
    }
  }
})
```

---

## 八、完整迁移示例

```js
// ── v1 ──────────────────────────────────────────────────────────────────────
import { mount, createLocalVue, Wrapper } from '@vue/test-utils'
import VueRouter from 'vue-router'
import flushPromises from 'flush-promises'
import MyComp from './MyComp.vue'

const localVue = createLocalVue()
localVue.use(VueRouter)

describe('MyComp', () => {
  let wrapper: Wrapper<MyComp>

  beforeEach(() => {
    wrapper = mount(MyComp, {
      localVue,
      propsData: { title: 'test', count: 0 },
      listeners: { 'update:count': jest.fn() },
      scopedSlots: { default: '<span>{{ props.item }}</span>' },
    })
  })

  afterEach(() => { wrapper.destroy() })

  it('renders correctly', async () => {
    expect(wrapper.contains('.title')).toBe(true)
    await wrapper.setData({ loading: true })
    await flushPromises()
    expect(wrapper.isEmpty()).toBe(false)
  })
})
```

```js
// ── v2 ──────────────────────────────────────────────────────────────────────
import { mount, VueWrapper, flushPromises } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
import { ComponentPublicInstance, nextTick } from 'vue'
import MyComp from './MyComp.vue'

const router = createRouter({ history: createWebHistory(), routes: [] })

describe('MyComp', () => {
  let wrapper: VueWrapper<InstanceType<typeof MyComp>>

  beforeEach(() => {
    wrapper = mount(MyComp, {
      props: { title: 'test', count: 0 },
      attrs: { 'onUpdate:count': jest.fn() },
      slots: { default: ({ item }) => `<span>${item}</span>` },
      global: { plugins: [router] },
    })
  })

  afterEach(() => { wrapper.unmount() })

  it('renders correctly', async () => {
    expect(wrapper.find('.title').exists()).toBe(true)
    wrapper.vm.loading = true
    await nextTick()
    await flushPromises()
    expect(wrapper.html()).not.toBe('')
  })
})
```

---

## 九、迁移步骤

```bash
# 1. 升级 @vue/test-utils
npm install -D @vue/test-utils@^2.4.0

# 2. 自动迁移大部分变更
npx vue2to3 fix test-utils ./tests

# 3. 手动处理 TODO 注释
#    - createLocalVue → config.global
#    - setData → wrapper.vm.xxx = val
#    - isEmpty/is → 手动替换

# 4. 运行测试验证
npm test
```
