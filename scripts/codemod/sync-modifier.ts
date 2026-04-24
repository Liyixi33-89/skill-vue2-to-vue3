/**
 * Codemod: .sync modifier → v-model:xxx
 *
 * 转换规则：
 *   :title.sync="x"   →  v-model:title="x"
 *   :value.sync="x"   →  v-model:value="x"
 *
 * 只处理模板部分（.vue 文件的 <template> 或 .html 文件）
 */
import { readFileSync, writeFileSync, copyFileSync } from 'fs'
import { resolve } from 'path'
import fg from 'fast-glob'
import pc from 'picocolors'
import type { CodemodOptions, CodemodResult } from '../types.js'

interface TransformSyncResult {
  code: string
  changed: boolean
}

const transformSync = (code: string): TransformSyncResult => {
  let changed = false

  // 处理单引号和双引号两种情况
  const result = code.replace(
    /:(\w[\w.]*?)\.sync\s*=\s*(["'])([^"']+)\2/g,
    (_match, prop: string, _quote: string, expr: string) => {
      changed = true
      return `v-model:${prop}="${expr}"`
    },
  )

  return { code: result, changed }
}

export const fixSync = async (
  targetDir: string,
  options: CodemodOptions = {},
): Promise<CodemodResult> => {
  const absDir = resolve(process.cwd(), targetDir)
  const dryRun = options.dryRun ?? false

  const files = await fg(['**/*.vue', '**/*.html'], {
    cwd: absDir,
    absolute: true,
    ignore: ['**/node_modules/**', '**/dist/**', '**/*.bak'],
  })

  let fixedCount = 0
  const fixedFiles: string[] = []

  for (const file of files) {
    const original = readFileSync(file, 'utf-8')
    const { code, changed } = transformSync(original)

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
    console.log(pc.yellow(`[dry-run] .sync → v-model:xxx 修复将影响 ${fixedCount} 个文件`))
  } else {
    console.log(pc.green(`✅ .sync 修饰符修复完成: ${fixedCount} 个文件`))
    fixedFiles.forEach((f) => console.log(`  ${pc.green('→')} ${pc.gray(f)}`))
  }

  return { fixedCount, fixedFiles }
}

// 导出内部函数供测试使用
export { transformSync }
