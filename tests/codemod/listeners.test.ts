import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { transformListeners } from '../../scripts/codemod/listeners.js'

describe('transformListeners — $listeners → $attrs 转换', () => {
  it('应将 v-on="$listeners" 替换为 v-bind="$attrs"', () => {
    const input = `<MyComp v-on="$listeners" />`
    const { code, changed } = transformListeners(input)
    assert.equal(changed, true)
    assert.ok(code.includes('v-bind="$attrs"'))
    assert.ok(!code.includes('$listeners'))
  })

  it('应处理单引号的 v-on="$listeners"', () => {
    const input = `<MyComp v-on='$listeners' />`
    const { code, changed } = transformListeners(input)
    assert.equal(changed, true)
    assert.ok(code.includes('v-bind="$attrs"'))
  })

  it('应将 v-bind="$listeners" 替换为 v-bind="$attrs"', () => {
    const input = `<div v-bind="$listeners"></div>`
    const { code, changed } = transformListeners(input)
    assert.equal(changed, true)
    assert.ok(code.includes('v-bind="$attrs"'))
    assert.ok(!code.includes('$listeners'))
  })

  it('应将 JS 中的 $listeners 引用替换为 $attrs 并添加 TODO', () => {
    const input = `const listeners = this.$listeners`
    const { code, changed } = transformListeners(input)
    assert.equal(changed, true)
    assert.ok(code.includes('$attrs'))
    assert.ok(code.includes('TODO(vue3)'))
    assert.ok(!code.includes('this.$listeners'))
  })

  it('应处理 $listeners 在 computed 中的使用', () => {
    const input = `computed: {\n  allListeners() {\n    return { ...this.$listeners, click: this.handleClick }\n  }\n}`
    const { code, changed } = transformListeners(input)
    assert.equal(changed, true)
    assert.ok(code.includes('$attrs'))
    assert.ok(code.includes('TODO(vue3)'))
  })

  it('不含 $listeners 的代码不应被修改', () => {
    const input = `<div v-bind="$attrs"><slot /></div>`
    const { code, changed } = transformListeners(input)
    assert.equal(changed, false)
    assert.equal(code, input)
  })

  it('空字符串不应报错', () => {
    const { code, changed } = transformListeners('')
    assert.equal(changed, false)
    assert.equal(code, '')
  })

  it('应处理同一文件中多种 $listeners 用法', () => {
    const input = `<template>
  <div v-on="$listeners">
    <child v-bind="$listeners" />
  </div>
</template>
<script>
export default {
  computed: {
    myListeners() { return this.$listeners }
  }
}
</script>`
    const { code, changed } = transformListeners(input)
    assert.equal(changed, true)
    // v-on 和 v-bind 形式应被直接替换，不留 $listeners
    assert.ok(!code.includes('v-on="$listeners"'))
    assert.ok(!code.includes('v-bind="$listeners"'))
    // JS 中的 $listeners 被替换为 $attrs（注释中可能保留原词）
    assert.ok(code.includes('$attrs'))
  })
})
