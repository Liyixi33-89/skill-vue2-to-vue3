/**
 * Codemod: beforeDestroy → beforeUnmount, destroyed → unmounted
 * 支持 .vue (script 块) 和 .js/.ts 文件
 */
import { readFileSync, writeFileSync, copyFileSync } from 'fs'
import { resolve } from 'path'
import fg from 'fast-glob'
import pc from 'picocolors'
import type { CodemodOptions, CodemodResult } from '../types.js'

interface LifecycleReplacement {
  from: RegExp
  to: string
}

const REPLACEMENTS: LifecycleReplacement[] = [
  // Options API 对象属性
  { from: /\bbeforeDestroy\s*\(/g, to: 'beforeUnmount(' },
  { from: /\bbeforeDestroy\s*:/g, to: 'beforeUnmount:' },
  // destroyed
  { from: /(?<!\w)destroyed\s*\(/g, to: 'unmounted(' },
  { from: /(?<!\w)destroyed\s*:/g, to: 'unmounted:' },
  // $options 动态访问
  { from: /\['beforeDestroy'\]/g, to: `['beforeUnmount']` },
  { from: /\["beforeDestroy"\]/g, to: `["beforeUnmount"]` },
  { from: /\['destroyed'\]/g, to: `['unmounted']` },
  { from: /\["destroyed"\]/g, to: `["unmounted"]` },
]

interface ApplyReplacementsResult {
  code: string
  changed: boolean
}

const applyReplacements = (code: string): ApplyReplacementsResult => {
  let result = code
  let changed = false
  for (const { from, to } of REPLACEMENTS) {
    const next = result.replace(from, to)
    if (next !== result) {
      changed = true
    }
    result = next
  }
  return { code: result, changed }
}

export const fixLifecycle = async (
  targetDir: string,
  options: CodemodOptions = {},
): Promise<CodemodResult> => {
  const absDir = resolve(process.cwd(), targetDir)
  const dryRun = options.dryRun ?? false

  const files = await fg(['**/*.vue', '**/*.js', '**/*.ts', '**/*.jsx', '**/*.tsx'], {
    cwd: absDir,
    absolute: true,
    ignore: ['**/node_modules/**', '**/dist/**', '**/*.d.ts', '**/*.bak'],
  })

  let fixedCount = 0
  const fixedFiles: string[] = []

  for (const file of files) {
    const original = readFileSync(file, 'utf-8')
    const { code, changed } = applyReplacements(original)

    if (changed) {
      fixedFiles.push(file)
      fixedCount++
      if (!dryRun) {
        // 备份原文件
        copyFileSync(file, `${file}.vue3.bak`)
        writeFileSync(file, code, 'utf-8')
      }
    }
  }

  if (dryRun) {
    console.log(pc.yellow(`[dry-run] 生命周期钩子修复将影响 ${fixedCount} 个文件:`))
    fixedFiles.forEach((f) => console.log(`  ${pc.gray(f)}`))
  } else {
    console.log(pc.green(`✅ 生命周期钩子修复完成: ${fixedCount} 个文件已更新`))
    fixedFiles.forEach((f) => console.log(`  ${pc.green('→')} ${pc.gray(f)}`))
  }

  return { fixedCount, fixedFiles }
}

// 导出内部函数供测试使用
export { applyReplacements }
