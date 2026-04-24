import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { transformSync } from '../../scripts/codemod/sync-modifier.js'

describe('transformSync — .sync 修饰符 → v-model:xxx 转换', () => {
  it('应将 :title.sync="x" 替换为 v-model:title="x"', () => {
    const input = `<MyDialog :title.sync="dialogTitle" />`
    const { code, changed } = transformSync(input)
    assert.equal(changed, true)
    assert.ok(code.includes('v-model:title="dialogTitle"'))
    assert.ok(!code.includes('.sync'))
  })

  it('应将 :value.sync="x" 替换为 v-model:value="x"', () => {
    const input = `<MyInput :value.sync="inputValue" />`
    const { code, changed } = transformSync(input)
    assert.equal(changed, true)
    assert.ok(code.includes('v-model:value="inputValue"'))
  })

  it('应将 :visible.sync="x" 替换为 v-model:visible="x"（el-dialog 场景）', () => {
    const input = `<el-dialog :visible.sync="dialogVisible" title="提示">`
    const { code, changed } = transformSync(input)
    assert.equal(changed, true)
    assert.ok(code.includes('v-model:visible="dialogVisible"'))
    assert.ok(!code.includes('.sync'))
  })

  it('应处理单引号绑定的 .sync', () => {
    const input = `:title.sync='myTitle'`
    const { code, changed } = transformSync(input)
    assert.equal(changed, true)
    assert.ok(code.includes('v-model:title="myTitle"'))
  })

  it('应处理对象路径的 prop 名', () => {
    const input = `:show.sync="modal.visible"`
    const { code, changed } = transformSync(input)
    assert.equal(changed, true)
    assert.ok(code.includes('v-model:show="modal.visible"'))
  })

  it('应处理同一标签中的多个 .sync', () => {
    const input = `<MyComp :title.sync="title" :visible.sync="show" />`
    const { code, changed } = transformSync(input)
    assert.equal(changed, true)
    assert.ok(code.includes('v-model:title="title"'))
    assert.ok(code.includes('v-model:visible="show"'))
    assert.ok(!code.includes('.sync'))
  })

  it('已使用 v-model 的代码不应被修改', () => {
    const input = `<MyComp v-model:title="title" />`
    const { code, changed } = transformSync(input)
    assert.equal(changed, false)
    assert.equal(code, input)
  })

  it('不含 .sync 的代码不应被修改', () => {
    const input = `<MyComp :title="title" @update:title="title = $event" />`
    const { code, changed } = transformSync(input)
    assert.equal(changed, false)
    assert.equal(code, input)
  })

  it('空字符串不应报错', () => {
    const { code, changed } = transformSync('')
    assert.equal(changed, false)
    assert.equal(code, '')
  })
})
