#!/usr/bin/env node
/**
 * vue2to3 CLI
 *
 * Usage:
 *   vue2to3 scan ./src              扫描项目，生成迁移报告
 *   vue2to3 fix lifecycle ./src     修复生命周期钩子
 *   vue2to3 fix global-api ./src    修复 Global API
 *   vue2to3 fix sync ./src          修复 .sync 修饰符
 *   vue2to3 fix listeners ./src     修复 $listeners
 *   vue2to3 fix filters ./src       迁移过滤器
 *   vue2to3 fix template-key ./src  修复 template v-for key
 *   vue2to3 fix router ./src        迁移 Vue Router
 *   vue2to3 fix all ./src           执行所有修复
 *   vue2to3 check ./src             验证是否还有 Vue 2 残留
 */

import { cac } from 'cac'
import { scan } from '../scripts/scan.js'
import { check } from '../scripts/check.js'
import { fixLifecycle } from '../scripts/codemod/lifecycle.js'
import { fixGlobalApi } from '../scripts/codemod/global-api.js'
import { fixSync } from '../scripts/codemod/sync-modifier.js'
import { fixListeners } from '../scripts/codemod/listeners.js'
import { fixFilters } from '../scripts/codemod/filters.js'
import { fixTemplateKey } from '../scripts/codemod/template-key.js'
import { fixRouter } from '../scripts/codemod/router.js'
import { fixEnvVars } from '../scripts/codemod/env-vars.js'
import { fixVDeep } from '../scripts/codemod/v-deep.js'
import type { CodemodOptions } from '../scripts/types.js'
import pc from 'picocolors'

type FixerKey =
  | 'lifecycle'
  | 'global-api'
  | 'sync'
  | 'listeners'
  | 'filters'
  | 'template-key'
  | 'router'
  | 'env-vars'
  | 'v-deep'
  | 'all'

const cli = cac('vue2to3')

// ── scan ──────────────────────────────────────────────────────────────────────
cli
  .command('scan [dir]', '扫描项目，生成 Vue 2 → 3 迁移报告')
  .option('--no-report', '不写入 vue3-migration-report.json')
  .action(async (dir: string = './src', options: { report?: boolean }) => {
    await scan(dir, { write: options.report !== false })
  })

// ── fix ───────────────────────────────────────────────────────────────────────
cli
  .command('fix <type> [dir]', '执行指定类型的自动修复')
  .option('--dry-run', '预览修改（不写入文件）')
  .action(async (type: string, dir: string = './src', options: { dryRun?: boolean }) => {
    const opts: CodemodOptions = { dryRun: options.dryRun }

    const fixers: Record<FixerKey, () => Promise<void>> = {
      lifecycle: async () => {
        await fixLifecycle(dir, opts)
      },
      'global-api': async () => {
        await fixGlobalApi(dir, opts)
      },
      sync: async () => {
        await fixSync(dir, opts)
      },
      listeners: async () => {
        await fixListeners(dir, opts)
      },
      filters: async () => {
        await fixFilters(dir, opts)
      },
      'template-key': async () => {
        await fixTemplateKey(dir, opts)
      },
      router: async () => {
        await fixRouter(dir, opts)
      },
      'env-vars': async () => {
        await fixEnvVars(dir, opts)
      },
      'v-deep': async () => {
        await fixVDeep(dir, opts)
      },
      all: async () => {
        console.log(pc.bold('\n🚀 执行所有修复...\n'))
        console.log(pc.cyan('Step 1/7: 生命周期钩子'))
        await fixLifecycle(dir, opts)
        console.log(pc.cyan('\nStep 2/7: Global API'))
        await fixGlobalApi(dir, opts)
        console.log(pc.cyan('\nStep 3/7: .sync 修饰符'))
        await fixSync(dir, opts)
        console.log(pc.cyan('\nStep 4/7: $listeners'))
        await fixListeners(dir, opts)
        console.log(pc.cyan('\nStep 5/7: Filters'))
        await fixFilters(dir, opts)
        console.log(pc.cyan('\nStep 6/7: template-key'))
        await fixTemplateKey(dir, opts)
        console.log(pc.cyan('\nStep 7/7: Vue Router'))
        await fixRouter(dir, opts)
        console.log(pc.cyan('\nStep 8/9: 环境变量 (VUE_APP_ → VITE_)'))
        await fixEnvVars(dir, opts)
        console.log(pc.cyan('\nStep 9/9: CSS 深度选择器 (::v-deep → :deep())'))
        await fixVDeep(dir, opts)
        console.log(pc.bold(pc.green('\n✅ 所有自动修复完成！')))
        console.log(pc.yellow('\n⚠️  请运行 npx vue2to3 check ./src 验证结果'))
        console.log(pc.yellow('⚠️  并检查代码中的 TODO(vue3) 注释，完成剩余人工迁移'))
      },
    }

    if (!(type in fixers)) {
      console.error(pc.red(`\n未知修复类型: ${type}`))
      console.log(`可用类型: ${Object.keys(fixers).join(', ')}`)
      process.exit(1)
    }

    await fixers[type as FixerKey]()
  })

// ── check ─────────────────────────────────────────────────────────────────────
cli
  .command('check [dir]', '验证是否还存在 Vue 2 残留特征')
  .action(async (dir: string = './src') => {
    const passed = await check(dir)
    if (!passed) {
      process.exit(1)
    }
  })

// ── help & version ────────────────────────────────────────────────────────────
cli.help()
cli.version('0.1.0')

cli.parse()
