import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { applyReplacements } from '../../scripts/codemod/lifecycle.js'

describe('applyReplacements — 生命周期钩子迁移', () => {
  it('应将 beforeDestroy() 方法替换为 beforeUnmount()', () => {
    const input = `export default {\n  beforeDestroy() { clearInterval(this.timer) }\n}`
    const { code, changed } = applyReplacements(input)
    assert.equal(changed, true)
    assert.ok(code.includes('beforeUnmount()'))
    assert.ok(!code.includes('beforeDestroy()'))
  })

  it('应将 beforeDestroy: 属性替换为 beforeUnmount:', () => {
    const input = `{ beforeDestroy: function() {} }`
    const { code, changed } = applyReplacements(input)
    assert.equal(changed, true)
    assert.ok(code.includes('beforeUnmount:'))
    assert.ok(!code.includes('beforeDestroy:'))
  })

  it('应将 destroyed() 方法替换为 unmounted()', () => {
    const input = `export default {\n  destroyed() { console.log('destroyed') }\n}`
    const { code, changed } = applyReplacements(input)
    assert.equal(changed, true)
    assert.ok(code.includes('unmounted()'))
    assert.ok(!code.includes('destroyed()'))
  })

  it('应将 destroyed: 属性替换为 unmounted:', () => {
    const input = `{ destroyed: function() {} }`
    const { code, changed } = applyReplacements(input)
    assert.equal(changed, true)
    assert.ok(code.includes('unmounted:'))
    assert.ok(!code.includes('destroyed:'))
  })

  it("应将 ['beforeDestroy'] 替换为 ['beforeUnmount']", () => {
    const input = `this.$options['beforeDestroy']`
    const { code, changed } = applyReplacements(input)
    assert.equal(changed, true)
    assert.ok(code.includes(`['beforeUnmount']`))
  })

  it('应将 ["destroyed"] 替换为 ["unmounted"]', () => {
    const input = `this.$options["destroyed"]`
    const { code, changed } = applyReplacements(input)
    assert.equal(changed, true)
    assert.ok(code.includes(`["unmounted"]`))
  })

  it('不应将 isDestroyed 等包含 destroyed 的单词误替换', () => {
    const input = `if (this.isDestroyed) return`
    const { code, changed } = applyReplacements(input)
    assert.equal(code, input)
    assert.equal(changed, false)
  })

  it('已使用 Vue 3 钩子的代码不应被修改', () => {
    const input = `export default {\n  beforeUnmount() {},\n  unmounted() {}\n}`
    const { changed } = applyReplacements(input)
    assert.equal(changed, false)
  })

  it('空字符串不应报错', () => {
    const { code, changed } = applyReplacements('')
    assert.equal(changed, false)
    assert.equal(code, '')
  })

  it('应同时处理 beforeDestroy 和 destroyed', () => {
    const input = `export default {\n  beforeDestroy() { this.cleanup() },\n  destroyed() { console.log('done') }\n}`
    const { code, changed } = applyReplacements(input)
    assert.equal(changed, true)
    assert.ok(code.includes('beforeUnmount()'))
    assert.ok(code.includes('unmounted()'))
    assert.ok(!code.includes('beforeDestroy'))
  })
})
