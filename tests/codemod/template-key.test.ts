import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { transformTemplateKey } from '../../scripts/codemod/template-key.js'

describe('transformTemplateKey — template v-for key 位置迁移', () => {
  it('应将子元素的 :key 移到 template 标签上', () => {
    const input = `<template v-for="item in list">
  <li :key="item.id">{{ item.name }}</li>
</template>`
    const { code, changed } = transformTemplateKey(input)
    assert.equal(changed, true)
    assert.ok(code.includes(':key="item.id"'))
    assert.ok(/<template[^>]*:key="item\.id"/.test(code))
  })

  it('应在文件顶部添加说明注释', () => {
    const input = `<template v-for="item in list">
  <div :key="item.id">{{ item.name }}</div>
</template>`
    const { code, changed } = transformTemplateKey(input)
    assert.equal(changed, true)
    assert.ok(code.includes('vue2to3'))
  })

  it('template 标签上已有 :key 时不应重复添加', () => {
    const input = `<template v-for="item in list" :key="item.id">
  <li>{{ item.name }}</li>
</template>`
    const { code, changed } = transformTemplateKey(input)
    assert.equal(changed, false)
    assert.equal(code, input)
  })

  it('template 标签上已有 v-bind:key 时不应重复添加', () => {
    const input = `<template v-for="item in list" v-bind:key="item.id">
  <li>{{ item.name }}</li>
</template>`
    const { code, changed } = transformTemplateKey(input)
    assert.equal(changed, false)
    assert.equal(code, input)
  })

  it('不含 v-for template 的代码不应被修改', () => {
    const input = `<ul><li v-for="item in list" :key="item.id">{{ item }}</li></ul>`
    const { code, changed } = transformTemplateKey(input)
    assert.equal(changed, false)
    assert.equal(code, input)
  })

  it('空字符串不应报错', () => {
    const { code, changed } = transformTemplateKey('')
    assert.equal(changed, false)
    assert.equal(code, '')
  })
})
