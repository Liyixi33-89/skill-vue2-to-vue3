import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { transformVDeep } from '../../scripts/codemod/v-deep.js'

describe('transformVDeep — CSS 深度选择器迁移', () => {
  it('应将 ::v-deep .selector 替换为 :deep(.selector)', () => {
    const code = `<style scoped>\n.wrapper ::v-deep .el-input__inner { color: red; }\n</style>`
    const { code: result, changed, count } = transformVDeep(code)
    assert.ok(changed)
    assert.equal(count, 1)
    assert.ok(result.includes(':deep(.el-input__inner)'))
    assert.ok(!result.includes('::v-deep'))
  })

  it('应将 /deep/ .selector 替换为 :deep(.selector)', () => {
    const code = `<style scoped>\n.wrapper /deep/ .el-button { font-weight: bold; }\n</style>`
    const { code: result, changed } = transformVDeep(code)
    assert.ok(changed)
    assert.ok(result.includes(':deep(.el-button)'))
    assert.ok(!result.includes('/deep/'))
  })

  it('应将 >>> .selector 替换为 :deep(.selector)', () => {
    const code = `<style scoped>\n.wrapper >>> .child { color: blue; }\n</style>`
    const { code: result, changed } = transformVDeep(code)
    assert.ok(changed)
    assert.ok(result.includes(':deep(.child)'))
    assert.ok(!result.includes('>>>'))
  })

  it('应处理同一文件中的多种旧写法', () => {
    const code = `<style scoped>
.a ::v-deep .foo { color: red; }
.b /deep/ .bar { color: blue; }
.c >>> .baz { color: green; }
</style>`
    const { code: result, changed, count } = transformVDeep(code)
    assert.ok(changed)
    assert.equal(count, 3)
    assert.ok(result.includes(':deep(.foo)'))
    assert.ok(result.includes(':deep(.bar)'))
    assert.ok(result.includes(':deep(.baz)'))
  })

  it('应处理 Element Plus 常见场景', () => {
    const code = `<style scoped>
.my-dialog ::v-deep .el-dialog__header { background: #f5f5f5; }
.my-table ::v-deep .el-table__row { height: 48px; }
</style>`
    const { code: result, changed, count } = transformVDeep(code)
    assert.ok(changed)
    assert.equal(count, 2)
    assert.ok(result.includes(':deep(.el-dialog__header)'))
    assert.ok(result.includes(':deep(.el-table__row)'))
  })

  it('无参数的 ::v-deep {} 块应添加 TODO 注释', () => {
    const code = `<style scoped>\n.wrapper ::v-deep {\n  .foo { color: red; }\n}\n</style>`
    const { code: result, changed } = transformVDeep(code)
    assert.ok(changed)
    assert.ok(result.includes('TODO(vue3-deep)'))
  })

  it('不应修改 <style> 块之外的内容', () => {
    const code = `<template>
  <!-- ::v-deep 在模板注释中不应被修改 -->
  <div class="wrapper"></div>
</template>
<script>
// const x = '::v-deep' // 脚本中不应被修改
</script>
<style scoped>
.wrapper ::v-deep .child { color: red; }
</style>`
    const { code: result } = transformVDeep(code)
    // 模板和脚本中的 ::v-deep 不应被修改
    assert.ok(result.includes('<!-- ::v-deep 在模板注释中不应被修改 -->'))
    assert.ok(result.includes("// const x = '::v-deep'"))
    // style 中的应被修改
    assert.ok(result.includes(':deep(.child)'))
  })

  it('已使用 :deep() 的代码不应被修改', () => {
    const code = `<style scoped>\n.wrapper :deep(.child) { color: red; }\n</style>`
    const { changed } = transformVDeep(code)
    assert.ok(!changed)
  })

  it('不含 <style> 块的文件不应被修改', () => {
    const code = `<template><div>hello</div></template>`
    const { changed } = transformVDeep(code)
    assert.ok(!changed)
  })

  it('空字符串不应报错', () => {
    const { code, changed, count } = transformVDeep('')
    assert.equal(code, '')
    assert.ok(!changed)
    assert.equal(count, 0)
  })

  it('应处理多个 <style> 块', () => {
    const code = `<style>\n.global ::v-deep .foo { color: red; }\n</style>
<style scoped>\n.local ::v-deep .bar { color: blue; }\n</style>`
    const { code: result, changed, count } = transformVDeep(code)
    assert.ok(changed)
    assert.equal(count, 2)
    assert.ok(result.includes(':deep(.foo)'))
    assert.ok(result.includes(':deep(.bar)'))
  })
})
