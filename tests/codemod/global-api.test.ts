import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { applyTransforms } from '../../scripts/codemod/global-api.js'

describe('applyTransforms — Vue 2 Global API → Vue 3', () => {
  // ─── Vue.observable ─────────────────────────────────────────────────────

  it('应将 Vue.observable() 替换为 reactive()', () => {
    const input = `const state = Vue.observable({ count: 0 })`
    const { code, changed } = applyTransforms(input)
    assert.equal(changed, true)
    assert.ok(code.includes('reactive('))
    assert.ok(!code.includes('Vue.observable'))
  })

  // ─── Vue.prototype ──────────────────────────────────────────────────────

  it('应将 Vue.prototype.$http 替换为 app.config.globalProperties.$http', () => {
    const input = `Vue.prototype.$http = axios`
    const { code, changed } = applyTransforms(input)
    assert.equal(changed, true)
    assert.ok(code.includes('app.config.globalProperties.$http'))
    assert.ok(!code.includes('Vue.prototype'))
  })

  // ─── TODO 标注 ──────────────────────────────────────────────────────────

  it('应在 Vue.use() 前添加 TODO 注释', () => {
    const input = `Vue.use(ElementUI)`
    const { code, changed } = applyTransforms(input)
    assert.equal(changed, true)
    assert.ok(code.includes('TODO(vue3)'))
    assert.ok(code.includes('Vue.use(ElementUI)'))
  })

  it('应在 Vue.mixin() 前添加 TODO 注释', () => {
    const input = `Vue.mixin(myMixin)`
    const { code, changed } = applyTransforms(input)
    assert.equal(changed, true)
    assert.ok(code.includes('TODO(vue3)'))
  })

  it('应在 Vue.component() 前添加 TODO 注释', () => {
    const input = `Vue.component('MyComp', MyComp)`
    const { code, changed } = applyTransforms(input)
    assert.equal(changed, true)
    assert.ok(code.includes('TODO(vue3)'))
  })

  it('应在 Vue.directive() 前添加 TODO 注释', () => {
    const input = `Vue.directive('focus', { mounted(el) { el.focus() } })`
    const { code, changed } = applyTransforms(input)
    assert.equal(changed, true)
    assert.ok(code.includes('TODO(vue3)'))
  })

  it('应在 Vue.set() 前添加 TODO 注释', () => {
    const input = `Vue.set(obj, 'key', value)`
    const { code, changed } = applyTransforms(input)
    assert.equal(changed, true)
    assert.ok(code.includes('TODO(vue3)'))
    assert.ok(code.includes('Vue.set('))
  })

  it('应在 Vue.delete() 前添加 TODO 注释', () => {
    const input = `Vue.delete(obj, 'key')`
    const { code, changed } = applyTransforms(input)
    assert.equal(changed, true)
    assert.ok(code.includes('TODO(vue3)'))
  })

  it('应在 new Vue({ 前添加 TODO 注释', () => {
    const input = `const app = new Vue({ render: h => h(App) })`
    const { code, changed } = applyTransforms(input)
    assert.equal(changed, true)
    assert.ok(code.includes('TODO(vue3)'))
    assert.ok(code.includes('new Vue({'))
  })

  // ─── 无变化场景 ─────────────────────────────────────────────────────────

  it('不含 Vue 2 API 的代码不应被修改', () => {
    const input = `const app = createApp(App)\napp.mount('#app')`
    const { changed } = applyTransforms(input)
    assert.equal(changed, false)
  })

  it('空字符串不应报错', () => {
    const { code, changed } = applyTransforms('')
    assert.equal(changed, false)
    assert.equal(code, '')
  })

  // ─── 组合场景 ───────────────────────────────────────────────────────────

  it('应处理 main.js 中的多种 Vue 2 API', () => {
    const input = `import Vue from 'vue'
import App from './App.vue'
import ElementUI from 'element-ui'

Vue.use(ElementUI)
Vue.prototype.$bus = new Vue()

const app = new Vue({
  render: h => h(App)
}).$mount('#app')`

    const { code, changed } = applyTransforms(input)
    assert.equal(changed, true)
    assert.ok(code.includes('app.config.globalProperties.$bus'))
    assert.ok(code.includes('TODO(vue3)'))
  })
})
