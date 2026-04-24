import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { transformTestUtils } from '../../scripts/codemod/test-utils.js'

// ─── mount 选项迁移 ───────────────────────────────────────────────────────────

describe('transformTestUtils — mount 选项迁移', () => {
  it('应将 propsData 替换为 props', () => {
    const code = `mount(MyComp, { propsData: { title: 'hello' } })`
    const { code: result, changed } = transformTestUtils(code)
    assert.ok(changed)
    assert.ok(result.includes('props: { title:'))
    assert.ok(!result.includes('propsData'))
  })

  it('应将 listeners 替换为 attrs', () => {
    const code = `mount(MyComp, { listeners: { click: handler } })`
    const { code: result, changed } = transformTestUtils(code)
    assert.ok(changed)
    assert.ok(result.includes('attrs: { click:'))
    assert.ok(!result.includes('listeners:'))
  })

  it('应将 scopedSlots 替换为 slots', () => {
    const code = `mount(MyComp, { scopedSlots: { default: '<div />' } })`
    const { code: result, changed } = transformTestUtils(code)
    assert.ok(changed)
    assert.ok(result.includes('slots: {'))
    assert.ok(!result.includes('scopedSlots'))
  })

  it('应同时处理多个选项', () => {
    const code = `shallowMount(MyComp, {
  propsData: { value: 1 },
  listeners: { input: fn },
  scopedSlots: { default: '<span />' }
})`
    const { code: result, changed, replacements } = transformTestUtils(code)
    assert.ok(changed)
    assert.ok(result.includes('props:'))
    assert.ok(result.includes('attrs:'))
    assert.ok(result.includes('slots:'))
    assert.ok(replacements.length >= 3)
  })
})

// ─── Wrapper 实例方法迁移 ─────────────────────────────────────────────────────

describe('transformTestUtils — Wrapper 方法迁移', () => {
  it('应将 wrapper.destroy() 替换为 wrapper.unmount()', () => {
    const code = `wrapper.destroy()`
    const { code: result, changed } = transformTestUtils(code)
    assert.ok(changed)
    assert.ok(result.includes('wrapper.unmount()'))
    assert.ok(!result.includes('wrapper.destroy()'))
  })

  it('应将 wrapper.contains(sel) 替换为 wrapper.find(sel).exists()', () => {
    const code = `expect(wrapper.contains('.my-class')).toBe(true)`
    const { code: result, changed } = transformTestUtils(code)
    assert.ok(changed)
    assert.ok(result.includes(".find('.my-class').exists()"))
    assert.ok(!result.includes('.contains('))
  })

  it('应将 wrapper.contains(Component) 替换为 wrapper.find(Component).exists()', () => {
    const code = `wrapper.contains(MyComponent)`
    const { code: result, changed } = transformTestUtils(code)
    assert.ok(changed)
    assert.ok(result.includes('.find(MyComponent).exists()'))
  })

  it('应为 wrapper.setData() 添加 TODO 注释', () => {
    const code = `await wrapper.setData({ count: 1 })`
    const { code: result, changed } = transformTestUtils(code)
    assert.ok(changed)
    assert.ok(result.includes('TODO(test-utils-v2)'))
    assert.ok(result.includes('setData'))
  })

  it('应为 wrapper.isEmpty() 添加 TODO 注释', () => {
    const code = `expect(wrapper.isEmpty()).toBe(false)`
    const { code: result, changed } = transformTestUtils(code)
    assert.ok(changed)
    assert.ok(result.includes('TODO(test-utils-v2)'))
    assert.ok(result.includes('isEmpty'))
  })

  it('应为 wrapper.is(selector) 添加 TODO 注释', () => {
    const code = `expect(wrapper.is('div')).toBe(true)`
    const { code: result, changed } = transformTestUtils(code)
    assert.ok(changed)
    assert.ok(result.includes('TODO(test-utils-v2)'))
  })
})

// ─── createLocalVue 迁移 ──────────────────────────────────────────────────────

describe('transformTestUtils — createLocalVue 迁移', () => {
  it('应为 createLocalVue() 添加 TODO 注释', () => {
    const code = `const localVue = createLocalVue()`
    const { code: result, changed } = transformTestUtils(code)
    assert.ok(changed)
    assert.ok(result.includes('TODO(test-utils-v2)'))
    assert.ok(result.includes('createLocalVue'))
  })

  it('应为 localVue.use() 添加 TODO 注释', () => {
    const code = `localVue.use(VueRouter)`
    const { code: result, changed } = transformTestUtils(code)
    assert.ok(changed)
    assert.ok(result.includes('TODO(test-utils-v2)'))
    assert.ok(result.includes('global: { plugins:'))
  })

  it('应为 localVue.component() 添加 TODO 注释', () => {
    const code = `localVue.component('MyComp', MyComp)`
    const { code: result, changed } = transformTestUtils(code)
    assert.ok(changed)
    assert.ok(result.includes('TODO(test-utils-v2)'))
    assert.ok(result.includes('global: { components:'))
  })
})

// ─── import 语句迁移 ──────────────────────────────────────────────────────────

describe('transformTestUtils — import 语句迁移', () => {
  it('应将 Wrapper 类型替换为 VueWrapper', () => {
    const code = `import { mount, Wrapper } from '@vue/test-utils'`
    const { code: result, changed } = transformTestUtils(code)
    assert.ok(changed)
    assert.ok(result.includes('VueWrapper'))
    assert.ok(!result.includes(', Wrapper'))
  })

  it('应移除 createLocalVue 导入并添加注释', () => {
    const code = `import { mount, createLocalVue } from '@vue/test-utils'`
    const { code: result, changed } = transformTestUtils(code)
    assert.ok(changed)
    assert.ok(result.includes('mount'))
    assert.ok(result.includes('TODO(test-utils-v2)'))
  })

  it('应处理 WrapperArray 导入', () => {
    const code = `import { mount, WrapperArray } from '@vue/test-utils'`
    const { code: result, changed } = transformTestUtils(code)
    assert.ok(changed)
    assert.ok(result.includes('TODO(test-utils-v2)'))
  })

  it('不含 @vue/test-utils 的文件不应被修改', () => {
    const code = `import { ref } from 'vue'\nconst x = ref(0)`
    const { changed } = transformTestUtils(code)
    assert.ok(!changed)
  })
})

// ─── 类型名称迁移 ─────────────────────────────────────────────────────────────

describe('transformTestUtils — 类型名称迁移', () => {
  it('应将 Wrapper<Vue> 替换为 VueWrapper<ComponentPublicInstance>', () => {
    const code = `let wrapper: Wrapper<Vue>`
    const { code: result, changed } = transformTestUtils(code)
    assert.ok(changed)
    assert.ok(result.includes('VueWrapper<ComponentPublicInstance>'))
    assert.ok(!result.includes('Wrapper<Vue>'))
  })

  it('应将 Wrapper<MyComp> 替换为 VueWrapper<InstanceType<typeof MyComp>>', () => {
    const code = `let wrapper: Wrapper<MyComp>`
    const { code: result, changed } = transformTestUtils(code)
    assert.ok(changed)
    assert.ok(result.includes('VueWrapper<InstanceType<typeof MyComp>>'))
  })
})

// ─── 综合场景 ─────────────────────────────────────────────────────────────────

describe('transformTestUtils — 综合场景', () => {
  it('应处理完整的 Vue 2 测试文件', () => {
    const code = `import { mount, createLocalVue, Wrapper } from '@vue/test-utils'
import MyComp from './MyComp.vue'

const localVue = createLocalVue()
localVue.use(VueRouter)

describe('MyComp', () => {
  let wrapper: Wrapper<MyComp>

  beforeEach(() => {
    wrapper = mount(MyComp, {
      localVue,
      propsData: { title: 'test' },
      listeners: { click: jest.fn() },
    })
  })

  afterEach(() => {
    wrapper.destroy()
  })

  it('should render', () => {
    expect(wrapper.contains('.title')).toBe(true)
    expect(wrapper.isEmpty()).toBe(false)
  })
})`
    const { code: result, changed, replacements } = transformTestUtils(code)
    assert.ok(changed)
    // mount 选项
    assert.ok(result.includes('props:'))
    assert.ok(result.includes('attrs:'))
    // wrapper 方法
    assert.ok(result.includes('.unmount()'))
    assert.ok(result.includes('.find('))
    // createLocalVue
    assert.ok(result.includes('TODO(test-utils-v2)'))
    // 类型
    assert.ok(result.includes('VueWrapper'))
    // 替换数量
    assert.ok(replacements.length >= 5)
  })

  it('空字符串不应报错', () => {
    const { code, changed } = transformTestUtils('')
    assert.equal(code, '')
    assert.ok(!changed)
  })

  it('已迁移的 v2 代码不应被修改', () => {
    const code = `import { mount } from '@vue/test-utils'
mount(MyComp, { props: { title: 'test' } })`
    const { changed } = transformTestUtils(code)
    assert.ok(!changed)
  })
})
