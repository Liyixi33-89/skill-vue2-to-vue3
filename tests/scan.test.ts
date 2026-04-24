import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { RULES, scanFile } from '../scripts/scan.js'

describe('RULES — 扫描规则完整性', () => {
  it('每条规则都应有 id、category、severity、label、pattern', () => {
    for (const rule of RULES) {
      assert.ok(rule.id, `规则 ${rule.id} 缺少 id`)
      assert.ok(rule.category, `规则 ${rule.id} 缺少 category`)
      assert.ok(['error', 'warning'].includes(rule.severity))
      assert.ok(rule.label, `规则 ${rule.id} 缺少 label`)
      assert.ok(rule.pattern instanceof RegExp)
    }
  })

  it('规则 id 应唯一', () => {
    const ids = RULES.map((r) => r.id)
    const uniqueIds = new Set(ids)
    assert.equal(uniqueIds.size, ids.length)
  })
})

describe('scanFile — 单文件扫描', () => {
  it('应检测到 new Vue()', () => {
    const code = `const app = new Vue({ render: h => h(App) })`
    const findings = scanFile('test.js', code)
    const found = findings.find((f) => f.ruleId === 'global-api')
    assert.ok(found)
    assert.equal(found?.severity, 'error')
  })

  it('应检测到 Vue.use()', () => {
    const code = `Vue.use(VueRouter)`
    const findings = scanFile('main.js', code)
    const found = findings.find((f) => f.ruleId === 'vue-use')
    assert.ok(found)
  })

  it('应检测到 Vue.prototype', () => {
    const code = `Vue.prototype.$http = axios`
    const findings = scanFile('main.js', code)
    const found = findings.find((f) => f.ruleId === 'vue-prototype')
    assert.ok(found)
  })

  it('应检测到 beforeDestroy 钩子', () => {
    const code = `export default { beforeDestroy() {} }`
    const findings = scanFile('comp.vue', code)
    const found = findings.find((f) => f.ruleId === 'lifecycle-before-destroy')
    assert.ok(found)
    assert.equal(found?.severity, 'error')
  })

  it('应检测到 destroyed 钩子', () => {
    const code = `export default { destroyed() {} }`
    const findings = scanFile('comp.vue', code)
    const found = findings.find((f) => f.ruleId === 'lifecycle-destroyed')
    assert.ok(found)
  })

  it('应检测到 filters: {} 选项', () => {
    const code = `export default { filters: { currency(v) { return v } } }`
    const findings = scanFile('comp.vue', code)
    const found = findings.find((f) => f.ruleId === 'filters-option')
    assert.ok(found)
    assert.equal(found?.fix, 'filters')
  })

  it('应检测到模板 pipe 过滤器', () => {
    const code = `<template>{{ price | currency }}</template>`
    const findings = scanFile('comp.vue', code)
    const found = findings.find((f) => f.ruleId === 'filter-pipe')
    assert.ok(found)
  })

  it('应检测到 new VueRouter()', () => {
    const code = `const router = new VueRouter({ routes: [] })`
    const findings = scanFile('router.js', code)
    const found = findings.find((f) => f.ruleId === 'vue-router-new')
    assert.ok(found)
    assert.equal(found?.fix, 'router')
  })

  it("应检测到 import VueRouter from 'vue-router'", () => {
    const code = `import VueRouter from 'vue-router'`
    const findings = scanFile('router.js', code)
    const found = findings.find((f) => f.ruleId === 'vue-router-import')
    assert.ok(found)
  })

  it('应检测到 $listeners', () => {
    const code = `<div v-on="$listeners"></div>`
    const findings = scanFile('comp.vue', code)
    const found = findings.find((f) => f.ruleId === 'listeners')
    assert.ok(found)
    assert.equal(found?.fix, 'listeners')
  })

  it('应检测到 .sync 修饰符', () => {
    const code = `<MyComp :visible.sync="show" />`
    const findings = scanFile('comp.vue', code)
    const found = findings.find((f) => f.ruleId === 'sync-modifier')
    assert.ok(found)
    assert.equal(found?.fix, 'sync')
  })

  it('应正确计算问题所在行号', () => {
    const code = `import Vue from 'vue'\n\nconst app = new Vue({ render: h => h(App) })`
    const findings = scanFile('main.js', code)
    const found = findings.find((f) => f.ruleId === 'global-api')
    assert.equal(found?.line, 3)
  })

  it('Vue 3 代码不应产生 error 级别的 findings', () => {
    const code = `import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'

const app = createApp(App)
const router = createRouter({ history: createWebHistory(), routes: [] })
app.use(router)
app.mount('#app')`
    const findings = scanFile('main.ts', code)
    const errors = findings.filter((f) => f.severity === 'error')
    assert.equal(errors.length, 0)
  })
})

// ─── scan() 集成测试 ─────────────────────────────────────────────────────────

import { mkdirSync, writeFileSync, rmSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
import { scan } from '../scripts/scan.js'

describe('scan() — 目录扫描集成测试', () => {
  const createTempDir = (): string => {
    const dir = join(tmpdir(), `scan-test-${Date.now()}-${Math.random().toString(36).slice(2)}`)
    mkdirSync(dir, { recursive: true })
    return dir
  }

  it('空目录应返回 null', async () => {
    const dir = createTempDir()
    try {
      const result = await scan(dir, { write: false })
      assert.equal(result, null)
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  it('应扫描 Vue 2 项目并返回报告', async () => {
    const dir = createTempDir()
    try {
      writeFileSync(
        join(dir, 'main.js'),
        `import Vue from 'vue'\nVue.use(VueRouter)\nnew Vue({ render: h => h(App) }).$mount('#app')`,
        'utf-8',
      )
      writeFileSync(
        join(dir, 'Comp.vue'),
        `<script>export default { beforeDestroy() {}, filters: { currency(v) { return v } } }</script>`,
        'utf-8',
      )

      const result = await scan(dir, { write: false })

      assert.ok(result !== null)
      assert.equal(result.totalFiles, 2)
      assert.ok(result.affectedFiles > 0)
      assert.ok(result.summary['Global API'] > 0)
      assert.ok(result.summary['Lifecycle'] > 0)
      assert.ok(result.summary['Filters'] > 0)
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  it('应正确判断迁移复杂度', async () => {
    const dir = createTempDir()
    try {
      // 写入超过 10 个 error 的文件
      const manyErrors = Array.from(
        { length: 5 },
        (_, i) => `new Vue({ render: h => h(App) })\nVue.use(plugin${i})\nnew VueRouter({})`,
      ).join('\n')
      writeFileSync(join(dir, 'main.js'), manyErrors, 'utf-8')

      const result = await scan(dir, { write: false })
      assert.ok(result !== null)
      assert.equal(result.complexity, 'HIGH')
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  it('应收集可自动修复的命令', async () => {
    const dir = createTempDir()
    try {
      writeFileSync(
        join(dir, 'router.js'),
        `import VueRouter from 'vue-router'\nnew VueRouter({ routes: [] })`,
        'utf-8',
      )

      const result = await scan(dir, { write: false })
      assert.ok(result !== null)
      assert.ok('router' in result.fixes)
      assert.ok(result.fixes['router'].includes('vue2to3 fix router'))
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  it('应收集需要人工处理的项', async () => {
    const dir = createTempDir()
    try {
      writeFileSync(
        join(dir, 'Comp.vue'),
        `<template>{{ price | currency }}</template><script>export default { filters: { currency(v) { return v } } }</script>`,
        'utf-8',
      )

      const result = await scan(dir, { write: false })
      assert.ok(result !== null)
      assert.ok(result.actionRequired.some((item) => item.includes('Filters')))
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  it('纯 Vue 3 项目复杂度应为 LOW', async () => {
    const dir = createTempDir()
    try {
      writeFileSync(
        join(dir, 'main.ts'),
        `import { createApp } from 'vue'\nimport App from './App.vue'\ncreateApp(App).mount('#app')`,
        'utf-8',
      )

      const result = await scan(dir, { write: false })
      assert.ok(result !== null)
      assert.equal(result.complexity, 'LOW')
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })
})
