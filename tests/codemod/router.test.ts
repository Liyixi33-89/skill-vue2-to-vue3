import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { transformRouter } from '../../scripts/codemod/router.js'

describe('transformRouter — Vue Router 3 → 4 转换', () => {
  // ─── import 语句 ────────────────────────────────────────────────────────

  it("应将 import VueRouter from 'vue-router' 替换为 createRouter 导入", () => {
    const input = `import VueRouter from 'vue-router'`
    const { code, changed } = transformRouter(input)
    assert.equal(changed, true)
    assert.ok(code.includes('createRouter'))
    assert.ok(code.includes('createWebHistory'))
    assert.ok(!code.includes('import VueRouter'))
  })

  it('应支持双引号的 import 语句', () => {
    const input = `import VueRouter from "vue-router"`
    const { code, changed } = transformRouter(input)
    assert.equal(changed, true)
    assert.ok(code.includes('createRouter'))
  })

  // ─── new VueRouter ──────────────────────────────────────────────────────

  it('应将 new VueRouter({ 替换为 createRouter({ 并添加 TODO', () => {
    const input = `const router = new VueRouter({\n  routes: []\n})`
    const { code, changed } = transformRouter(input)
    assert.equal(changed, true)
    assert.ok(code.includes('createRouter({'))
    assert.ok(code.includes('TODO(vue3-router)'))
    assert.ok(!code.includes('new VueRouter'))
  })

  // ─── mode 转换 ──────────────────────────────────────────────────────────

  it("应将 mode: 'history' 替换为 history: createWebHistory()", () => {
    const input = `const router = createRouter({\n  mode: 'history',\n  routes: []\n})`
    const { code, changed } = transformRouter(input)
    assert.equal(changed, true)
    assert.ok(code.includes('history: createWebHistory('))
    assert.ok(!code.includes("mode: 'history'"))
  })

  it("应将 mode: 'hash' 替换为 history: createWebHashHistory()", () => {
    const input = `mode: 'hash'`
    const { code, changed } = transformRouter(input)
    assert.equal(changed, true)
    assert.ok(code.includes('history: createWebHashHistory()'))
  })

  // ─── Vue.use(VueRouter) ─────────────────────────────────────────────────

  it('应将 Vue.use(VueRouter) 替换为 TODO 注释', () => {
    const input = `Vue.use(VueRouter)`
    const { code, changed } = transformRouter(input)
    assert.equal(changed, true)
    assert.ok(code.includes('TODO(vue3-router)'))
    // 原语句被包裹在注释中，不再作为可执行代码
    assert.ok(code.startsWith('/*'))
  })

  // ─── scrollBehavior ─────────────────────────────────────────────────────

  it('应将 scrollBehavior 中的 x/y 替换为 left/top', () => {
    const input = `scrollBehavior() { return { x: 0, y: 0 } }`
    const { code, changed } = transformRouter(input)
    assert.equal(changed, true)
    assert.ok(code.includes('left: 0'))
    assert.ok(code.includes('top: 0'))
    assert.ok(!code.includes('x: 0'))
  })

  // ─── getMatchedComponents ───────────────────────────────────────────────

  it('应将 router.getMatchedComponents() 标注 TODO', () => {
    const input = `const components = router.getMatchedComponents()`
    const { code, changed } = transformRouter(input)
    assert.equal(changed, true)
    assert.ok(code.includes('TODO(vue3-router)'))
    assert.ok(code.includes('[]'))
  })

  // ─── 无变化场景 ─────────────────────────────────────────────────────────

  it('已是 Vue 3 router 语法的代码不应被修改', () => {
    const input = `import { createRouter, createWebHistory } from 'vue-router'\nconst router = createRouter({ history: createWebHistory(), routes: [] })`
    const { changed } = transformRouter(input)
    assert.equal(changed, false)
  })

  it('空字符串不应报错', () => {
    const { code, changed } = transformRouter('')
    assert.equal(changed, false)
    assert.equal(code, '')
  })

  // ─── 完整 router 文件场景 ───────────────────────────────────────────────

  it('应处理完整的 Vue 2 router 文件', () => {
    const input = `import Vue from 'vue'
import VueRouter from 'vue-router'
import Home from './views/Home.vue'

Vue.use(VueRouter)

const router = new VueRouter({
  mode: 'history',
  routes: [
    { path: '/', component: Home }
  ],
  scrollBehavior() {
    return { x: 0, y: 0 }
  }
})

export default router`

    const { code, changed } = transformRouter(input)
    assert.equal(changed, true)
    assert.ok(code.includes('createRouter'))
    assert.ok(code.includes('createWebHistory'))
    assert.ok(code.includes('left: 0'))
    assert.ok(code.includes('top: 0'))
    assert.ok(!code.includes('new VueRouter'))
    assert.ok(!code.includes("mode: 'history'"))
  })
})
