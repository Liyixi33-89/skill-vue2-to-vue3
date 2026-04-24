import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { CHECKS } from '../scripts/check.js'

describe('CHECKS — 检查规则完整性', () => {
  it('每条检查规则都应有 label 和 pattern', () => {
    for (const checkItem of CHECKS) {
      assert.ok(checkItem.label)
      assert.ok(checkItem.pattern instanceof RegExp)
    }
  })

  it('应包含所有关键的 Vue 2 特征检查', () => {
    const labels = CHECKS.map((c) => c.label)
    assert.ok(labels.includes('new Vue()'))
    assert.ok(labels.includes('beforeDestroy hook'))
    assert.ok(labels.includes('destroyed hook'))
    assert.ok(labels.includes('.sync modifier'))
    assert.ok(labels.includes('filters: {}'))
    assert.ok(labels.includes('pipe filter {{ | }}'))
    assert.ok(labels.includes('$listeners'))
    assert.ok(labels.includes('$on / $off / $once'))
    assert.ok(labels.includes('new VueRouter()'))
    assert.ok(labels.includes('Vue.observable()'))
    // 新增检查项
    assert.ok(labels.includes('process.env.VUE_APP_*'))
    assert.ok(labels.includes('::v-deep / /deep/'))
  })
})

describe('CHECKS patterns — 正则匹配验证', () => {
  const findCheck = (label: string) => CHECKS.find((c) => c.label === label)!

  it('new Vue() 规则应匹配 new Vue(', () => {
    const rule = findCheck('new Vue()')
    // 重置 lastIndex（全局正则）
    rule.pattern.lastIndex = 0
    assert.ok(rule.pattern.test('const app = new Vue({'))
    rule.pattern.lastIndex = 0
    assert.ok(!rule.pattern.test('createApp(App)'))
  })

  it('beforeDestroy hook 规则应匹配 beforeDestroy(', () => {
    const rule = findCheck('beforeDestroy hook')
    rule.pattern.lastIndex = 0
    assert.ok(rule.pattern.test('beforeDestroy() {'))
    rule.pattern.lastIndex = 0
    assert.ok(!rule.pattern.test('beforeUnmount() {'))
  })

  it('.sync modifier 规则应匹配 .sync', () => {
    const rule = findCheck('.sync modifier')
    rule.pattern.lastIndex = 0
    assert.ok(rule.pattern.test(':visible.sync="show"'))
    rule.pattern.lastIndex = 0
    assert.ok(!rule.pattern.test('v-model:visible="show"'))
  })

  it('pipe filter 规则应匹配 {{ x | filter }}', () => {
    const rule = findCheck('pipe filter {{ | }}')
    rule.pattern.lastIndex = 0
    assert.ok(rule.pattern.test('{{ price | currency }}'))
    rule.pattern.lastIndex = 0
    assert.ok(!rule.pattern.test('{{ price }}'))
  })

  it('$listeners 规则应匹配 $listeners', () => {
    const rule = findCheck('$listeners')
    rule.pattern.lastIndex = 0
    assert.ok(rule.pattern.test('v-on="$listeners"'))
    rule.pattern.lastIndex = 0
    // $attrs 不含 $listeners
    assert.ok(!rule.pattern.test('v-bind="$attrs"'))
  })

  it('$on / $off / $once 规则应匹配事件总线用法', () => {
    const rule = findCheck('$on / $off / $once')
    rule.pattern.lastIndex = 0
    assert.ok(rule.pattern.test('this.$on("event", handler)'))
    rule.pattern.lastIndex = 0
    assert.ok(rule.pattern.test('this.$off("event")'))
    rule.pattern.lastIndex = 0
    assert.ok(rule.pattern.test('this.$once("event", handler)'))
    rule.pattern.lastIndex = 0
    assert.ok(!rule.pattern.test('this.$emit("event")'))
  })

  it('new VueRouter() 规则应匹配 new VueRouter(', () => {
    const rule = findCheck('new VueRouter()')
    rule.pattern.lastIndex = 0
    assert.ok(rule.pattern.test('const router = new VueRouter({'))
    rule.pattern.lastIndex = 0
    assert.ok(!rule.pattern.test('createRouter({'))
  })

  it('Vue.observable() 规则应匹配 Vue.observable(', () => {
    const rule = findCheck('Vue.observable()')
    rule.pattern.lastIndex = 0
    assert.ok(rule.pattern.test('Vue.observable({ count: 0 })'))
    rule.pattern.lastIndex = 0
    assert.ok(!rule.pattern.test('reactive({ count: 0 })'))
  })
})

// ─── check() 集成测试 ────────────────────────────────────────────────────────

import { mkdirSync, writeFileSync, rmSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
import { check } from '../scripts/check.js'

describe('check() — 目录验证集成测试', () => {
  const createTempDir = (): string => {
    const dir = join(tmpdir(), `check-test-${Date.now()}-${Math.random().toString(36).slice(2)}`)
    mkdirSync(dir, { recursive: true })
    return dir
  }

  it('纯 Vue 3 项目应返回 true（通过）', async () => {
    const dir = createTempDir()
    try {
      writeFileSync(
        join(dir, 'main.ts'),
        `import { createApp } from 'vue'\nimport App from './App.vue'\ncreateApp(App).mount('#app')`,
        'utf-8',
      )
      writeFileSync(
        join(dir, 'Comp.vue'),
        `<script setup>\nimport { ref, onBeforeUnmount } from 'vue'\nconst count = ref(0)\nonBeforeUnmount(() => {})\n</script>`,
        'utf-8',
      )

      const result = await check(dir)
      assert.equal(result, true)
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  it('含 Vue 2 特征的项目应返回 false（未通过）', async () => {
    const dir = createTempDir()
    try {
      writeFileSync(
        join(dir, 'main.js'),
        `import Vue from 'vue'\nnew Vue({ render: h => h(App) }).$mount('#app')`,
        'utf-8',
      )

      const result = await check(dir)
      assert.equal(result, false)
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  it('含 beforeDestroy 的文件应返回 false', async () => {
    const dir = createTempDir()
    try {
      writeFileSync(
        join(dir, 'Comp.vue'),
        `<script>\nexport default {\n  beforeDestroy() { clearInterval(this.timer) }\n}\n</script>`,
        'utf-8',
      )

      const result = await check(dir)
      assert.equal(result, false)
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  it('含 .sync 修饰符的文件应返回 false', async () => {
    const dir = createTempDir()
    try {
      writeFileSync(
        join(dir, 'Dialog.vue'),
        `<template><el-dialog :visible.sync="show" /></template>`,
        'utf-8',
      )

      const result = await check(dir)
      assert.equal(result, false)
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  it('含 pipe filter 的文件应返回 false', async () => {
    const dir = createTempDir()
    try {
      writeFileSync(
        join(dir, 'Price.vue'),
        `<template><span>{{ price | currency }}</span></template>`,
        'utf-8',
      )

      const result = await check(dir)
      assert.equal(result, false)
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  it('含 $listeners 的文件应返回 false', async () => {
    const dir = createTempDir()
    try {
      writeFileSync(
        join(dir, 'Wrapper.vue'),
        `<template><div v-on="$listeners"><slot /></div></template>`,
        'utf-8',
      )

      const result = await check(dir)
      assert.equal(result, false)
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  it('含 new VueRouter() 的文件应返回 false', async () => {
    const dir = createTempDir()
    try {
      writeFileSync(
        join(dir, 'router.js'),
        `import VueRouter from 'vue-router'\nconst router = new VueRouter({ routes: [] })`,
        'utf-8',
      )

      const result = await check(dir)
      assert.equal(result, false)
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  it('空目录应返回 true（无文件即无问题）', async () => {
    const dir = createTempDir()
    try {
      const result = await check(dir)
      assert.equal(result, true)
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  it('.bak 备份文件应被忽略，不影响检查结果', async () => {
    const dir = createTempDir()
    try {
      // 写入已迁移的文件
      writeFileSync(
        join(dir, 'Comp.vue'),
        `<script setup>\nimport { onBeforeUnmount } from 'vue'\nonBeforeUnmount(() => {})\n</script>`,
        'utf-8',
      )
      // 写入备份文件（含 Vue 2 特征，应被忽略）
      writeFileSync(
        join(dir, 'Comp.vue.vue3.bak'),
        `<script>\nexport default { beforeDestroy() {} }\n</script>`,
        'utf-8',
      )

      const result = await check(dir)
      assert.equal(result, true)
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })
})
