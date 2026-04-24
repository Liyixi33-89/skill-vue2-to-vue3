/**
 * 集成测试：模拟完整的 Vue 2 → Vue 3 迁移流程
 */
import { describe, it, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { mkdirSync, writeFileSync, readFileSync, rmSync, existsSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
import { fixLifecycle } from '../../scripts/codemod/lifecycle.js'
import { fixListeners } from '../../scripts/codemod/listeners.js'
import { fixSync } from '../../scripts/codemod/sync-modifier.js'
import { fixRouter } from '../../scripts/codemod/router.js'
import { fixFilters } from '../../scripts/codemod/filters.js'
import { fixGlobalApi } from '../../scripts/codemod/global-api.js'

// ─── 测试工具函数 ────────────────────────────────────────────────────────────

const createTempDir = (): string => {
  const dir = join(tmpdir(), `vue2to3-test-${Date.now()}-${Math.random().toString(36).slice(2)}`)
  mkdirSync(dir, { recursive: true })
  return dir
}

const writeVueFile = (dir: string, name: string, content: string): string => {
  const filePath = join(dir, name)
  writeFileSync(filePath, content, 'utf-8')
  return filePath
}

const readVueFile = (filePath: string): string => readFileSync(filePath, 'utf-8')

// ─── 测试套件 ────────────────────────────────────────────────────────────────

describe('集成测试 — fixLifecycle 文件读写', () => {
  let tempDir: string

  before(() => {
    tempDir = createTempDir()
  })
  after(() => {
    rmSync(tempDir, { recursive: true, force: true })
  })

  it('应修改包含 beforeDestroy 的 .vue 文件', async () => {
    const filePath = writeVueFile(
      tempDir,
      'Comp.vue',
      `<script>\nexport default {\n  beforeDestroy() { clearInterval(this.timer) },\n  destroyed() { console.log('done') }\n}\n</script>`,
    )

    const result = await fixLifecycle(tempDir)

    assert.equal(result.fixedCount, 1)
    assert.equal(result.fixedFiles.length, 1)

    const content = readVueFile(filePath)
    assert.ok(content.includes('beforeUnmount()'))
    assert.ok(content.includes('unmounted()'))
    assert.ok(!content.includes('beforeDestroy'))
  })

  it('dryRun 模式不应写入文件', async () => {
    const original = `export default { beforeDestroy() {} }`
    const filePath = writeVueFile(tempDir, 'DryComp.vue', original)

    const result = await fixLifecycle(tempDir, { dryRun: true })

    assert.ok(result.fixedCount >= 1)
    // 文件内容不应改变
    assert.equal(readVueFile(filePath), original)
    // 不应生成备份文件
    assert.ok(!existsSync(`${filePath}.vue3.bak`))
  })

  it('应为修改的文件生成 .vue3.bak 备份', async () => {
    const dir2 = createTempDir()
    try {
      const filePath = writeVueFile(dir2, 'Comp.vue', `export default { beforeDestroy() {} }`)
      await fixLifecycle(dir2)
      assert.ok(existsSync(`${filePath}.vue3.bak`))
    } finally {
      rmSync(dir2, { recursive: true, force: true })
    }
  })

  it('不含 Vue 2 特征的文件不应被修改', async () => {
    const dir2 = createTempDir()
    try {
      const original = `export default { beforeUnmount() {}, unmounted() {} }`
      const filePath = writeVueFile(dir2, 'Clean.vue', original)
      const result = await fixLifecycle(dir2)
      assert.equal(result.fixedCount, 0)
      assert.equal(readVueFile(filePath), original)
    } finally {
      rmSync(dir2, { recursive: true, force: true })
    }
  })
})

describe('集成测试 — fixListeners 文件读写', () => {
  it('应修改包含 $listeners 的 .vue 文件', async () => {
    const dir = createTempDir()
    try {
      const filePath = writeVueFile(
        dir,
        'Wrapper.vue',
        `<template><div v-on="$listeners"><slot /></div></template>`,
      )
      const result = await fixListeners(dir)
      assert.equal(result.fixedCount, 1)
      const content = readVueFile(filePath)
      assert.ok(content.includes('v-bind="$attrs"'))
      assert.ok(!content.includes('$listeners'))
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })
})

describe('集成测试 — fixSync 文件读写', () => {
  it('应修改包含 .sync 的 .vue 文件', async () => {
    const dir = createTempDir()
    try {
      const filePath = writeVueFile(
        dir,
        'Dialog.vue',
        `<template><el-dialog :visible.sync="show" /></template>`,
      )
      const result = await fixSync(dir)
      assert.equal(result.fixedCount, 1)
      const content = readVueFile(filePath)
      assert.ok(content.includes('v-model:visible="show"'))
      assert.ok(!content.includes('.sync'))
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })
})

describe('集成测试 — fixRouter 文件读写', () => {
  it('应修改 Vue 2 router 文件', async () => {
    const dir = createTempDir()
    try {
      const filePath = writeVueFile(
        dir,
        'router.js',
        `import VueRouter from 'vue-router'\nVue.use(VueRouter)\nconst router = new VueRouter({ mode: 'history', routes: [] })\nexport default router`,
      )
      const result = await fixRouter(dir)
      assert.equal(result.fixedCount, 1)
      const content = readVueFile(filePath)
      assert.ok(content.includes('createRouter'))
      assert.ok(content.includes('createWebHistory'))
      assert.ok(!content.includes('new VueRouter'))
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })
})

describe('集成测试 — fixFilters 文件读写', () => {
  it('应修改包含 pipe filter 的 .vue 文件', async () => {
    const dir = createTempDir()
    try {
      const filePath = writeVueFile(
        dir,
        'Price.vue',
        `<template><span>{{ price | currency }}</span></template>`,
      )
      const result = await fixFilters(dir)
      assert.equal(result.fixedCount, 1)
      const content = readVueFile(filePath)
      assert.ok(content.includes('$filters.currency(price)'))
      assert.ok(!content.includes('| currency'))
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  it('应收集 filters 名称并返回', async () => {
    const dir = createTempDir()
    try {
      writeVueFile(dir, 'Comp.vue', `<template>{{ price | currency }}{{ name | trim }}</template>`)
      const result = await fixFilters(dir)
      assert.ok(result.collectedFilters.includes('currency'))
      assert.ok(result.collectedFilters.includes('trim'))
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })
})

describe('集成测试 — fixGlobalApi 文件读写', () => {
  it('应修改包含 Vue.prototype 的 main.js', async () => {
    const dir = createTempDir()
    try {
      const filePath = writeVueFile(
        dir,
        'main.js',
        `import Vue from 'vue'\nVue.prototype.$http = axios\nVue.use(ElementUI)\nconst app = new Vue({ render: h => h(App) }).$mount('#app')`,
      )
      const result = await fixGlobalApi(dir)
      assert.equal(result.fixedCount, 1)
      const content = readVueFile(filePath)
      assert.ok(content.includes('app.config.globalProperties.$http'))
      assert.ok(content.includes('TODO(vue3)'))
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })
})

describe('集成测试 — 完整迁移流程（多 codemod 串联）', () => {
  it('应按序执行所有 codemod 并完成迁移', async () => {
    const dir = createTempDir()
    try {
      const filePath = writeVueFile(
        dir,
        'App.vue',
        `<template>
  <div v-on="$listeners">
    <el-dialog :visible.sync="show" />
    <span>{{ price | currency }}</span>
  </div>
</template>
<script>
export default {
  filters: { currency(v) { return '$' + v } },
  beforeDestroy() { clearInterval(this.timer) }
}
</script>`,
      )

      // 按序执行所有 codemod
      await fixListeners(dir)
      await fixSync(dir)
      await fixFilters(dir)
      await fixLifecycle(dir)

      const content = readVueFile(filePath)

      assert.ok(!content.includes('$listeners'))
      assert.ok(!content.includes('.sync'))
      assert.ok(!content.includes('| currency'))
      assert.ok(!content.includes('beforeDestroy'))

      assert.ok(content.includes('v-bind="$attrs"'))
      assert.ok(content.includes('v-model:visible="show"'))
      assert.ok(content.includes('$filters.currency(price)'))
      assert.ok(content.includes('beforeUnmount()'))
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })
})
