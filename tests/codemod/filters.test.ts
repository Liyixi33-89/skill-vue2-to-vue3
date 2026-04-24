import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { transformFilters } from '../../scripts/codemod/filters.js'

describe('transformFilters — 模板 pipe 转换', () => {
  // ─── 无参数 pipe ────────────────────────────────────────────────────────

  it('应将 {{ value | currency }} 替换为 {{ $filters.currency(value) }}', () => {
    const input = `<template><span>{{ price | currency }}</span></template>`
    const { code, changed } = transformFilters(input)
    assert.equal(changed, true)
    assert.ok(code.includes('{{ $filters.currency(price) }}'))
    assert.ok(!code.includes('| currency'))
  })

  it('应将 {{ msg | uppercase }} 替换为 {{ $filters.uppercase(msg) }}', () => {
    const input = `<p>{{ msg | uppercase }}</p>`
    const { code, changed } = transformFilters(input)
    assert.equal(changed, true)
    assert.ok(code.includes('{{ $filters.uppercase(msg) }}'))
  })

  it('应处理表达式中有空格的 pipe', () => {
    const input = `{{ user.name  |  trim }}`
    const { code, changed } = transformFilters(input)
    assert.equal(changed, true)
    assert.ok(code.includes('$filters.trim(user.name)'))
  })

  // ─── 有参数 pipe ────────────────────────────────────────────────────────

  it('应将 {{ val | format(arg) }} 标注 TODO 并转换', () => {
    const input = `{{ date | formatDate('YYYY-MM-DD') }}`
    const { code, changed } = transformFilters(input)
    assert.equal(changed, true)
    assert.ok(code.includes('TODO(vue3-filter)'))
    assert.ok(code.includes("$filters.formatDate(date, 'YYYY-MM-DD')"))
  })

  // ─── filters 定义块 ─────────────────────────────────────────────────────

  it('应在 filters: {} 定义前添加 TODO 注释', () => {
    const input = `
export default {
  filters: {
    currency(val) { return '$' + val }
  }
}`
    const { code, changed } = transformFilters(input)
    assert.equal(changed, true)
    assert.ok(code.includes('TODO(vue3-filter)'))
    assert.ok(code.includes('filters:'))
  })

  it('应收集 filters 定义中的函数名', () => {
    const input = `
export default {
  filters: {
    currency(val) { return val },
    uppercase: (val) => val.toUpperCase()
  }
}`
    const { collectedFilters } = transformFilters(input)
    assert.ok(collectedFilters.has('currency'))
    assert.ok(collectedFilters.has('uppercase'))
  })

  // ─── 无变化场景 ─────────────────────────────────────────────────────────

  it('不含 pipe 的模板不应被修改', () => {
    const input = `<template><span>{{ price }}</span></template>`
    const { code, changed } = transformFilters(input)
    assert.equal(changed, false)
    assert.equal(code, input)
  })

  it('空字符串不应报错', () => {
    const { code, changed } = transformFilters('')
    assert.equal(changed, false)
    assert.equal(code, '')
  })

  // ─── 多个 pipe ──────────────────────────────────────────────────────────

  it('应处理同一文件中的多个 pipe', () => {
    const input = `
<template>
  <p>{{ price | currency }}</p>
  <p>{{ name | trim }}</p>
</template>`
    const { code, changed, collectedFilters } = transformFilters(input)
    assert.equal(changed, true)
    assert.ok(code.includes('$filters.currency(price)'))
    assert.ok(code.includes('$filters.trim(name)'))
    assert.equal(collectedFilters.size, 2)
  })
})
