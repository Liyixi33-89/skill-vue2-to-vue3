/**
 * Codemod: $listeners → $attrs
 * Vue 3 中 $listeners 已合并入 $attrs
 */
import { readFileSync, writeFileSync, copyFileSync } from 'fs'
import { resolve } from 'path'
import fg from 'fast-glob'
import pc from 'picocolors'
import type { CodemodOptions, CodemodResult } from '../types.js'

interface TransformListenersResult {
  code: string
  changed: boolean
}

const transformListeners = (code: string): TransformListenersResult => {
  let changed = false

  // v-on="$listeners" → v-bind="$attrs"（含事件的场景）
  let result = code.replace(/v-on\s*=\s*["']\$listeners["']/g, () => {
    changed = true
    return 'v-bind="$attrs"'
  })

  // v-bind="$listeners" → v-bind="$attrs"
  result = result.replace(/v-bind\s*=\s*["']\$listeners["']/g, () => {
    changed = true
    return 'v-bind="$attrs"'
  })

  // 其他 $listeners 引用 → $attrs（加注释）
  result = result.replace(/\$listeners\b/g, () => {
    changed = true
    return '/* TODO(vue3): $listeners 已合并入 $attrs，请使用 $attrs */ $attrs'
  })

  return { code: result, changed }
}

export const fixListeners = async (
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
    const { code, changed } = transformListeners(original)

    if (changed) {
      fixedFiles.push(file)
      fixedCount++
      if (!dryRun) {
        copyFileSync(file, `${file}.vue3.bak`)
        writeFileSync(file, code, 'utf-8')
      }
    }
  }

  if (dryRun) {
    console.log(pc.yellow(`[dry-run] $listeners → $attrs 修复将影响 ${fixedCount} 个文件`))
  } else {
    console.log(pc.green(`✅ $listeners 修复完成: ${fixedCount} 个文件`))
    fixedFiles.forEach((f) => console.log(`  ${pc.green('→')} ${pc.gray(f)}`))
  }

  return { fixedCount, fixedFiles }
}

// 导出内部函数供测试使用
export { transformListeners }
