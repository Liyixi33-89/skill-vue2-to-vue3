/**
 * Codemod: VUE_APP_ 环境变量 → VITE_ (Vue CLI → Vite)
 *
 * 替换策略：
 * 1. process.env.VUE_APP_XXX → import.meta.env.VITE_XXX
 * 2. process.env.NODE_ENV    → import.meta.env.MODE
 * 3. process.env.BASE_URL    → import.meta.env.BASE_URL
 * 4. .env 文件中 VUE_APP_    → VITE_
 */
import { readFileSync, writeFileSync, copyFileSync } from 'fs'
import { resolve, relative } from 'path'
import fg from 'fast-glob'
import pc from 'picocolors'
import type { CodemodOptions, CodemodResult } from '../types.js'

interface EnvTransformResult {
  code: string
  changed: boolean
  replacements: string[]
}

const transformEnvVars = (code: string, isEnvFile = false): EnvTransformResult => {
  let result = code
  let changed = false
  const replacements: string[] = []

  if (isEnvFile) {
    // .env 文件：VUE_APP_XXX=value → VITE_XXX=value
    const next = result.replace(/^VUE_APP_/gm, () => {
      changed = true
      replacements.push('VUE_APP_ → VITE_')
      return 'VITE_'
    })
    result = next
    return { code: result, changed, replacements }
  }

  // JS/TS/Vue 文件：process.env.VUE_APP_XXX → import.meta.env.VITE_XXX
  result = result.replace(/process\.env\.VUE_APP_(\w+)/g, (_match, varName: string) => {
    changed = true
    replacements.push(`process.env.VUE_APP_${varName} → import.meta.env.VITE_${varName}`)
    return `import.meta.env.VITE_${varName}`
  })

  // process.env.NODE_ENV → import.meta.env.MODE
  result = result.replace(/process\.env\.NODE_ENV/g, () => {
    changed = true
    replacements.push('process.env.NODE_ENV → import.meta.env.MODE')
    return 'import.meta.env.MODE'
  })

  // process.env.BASE_URL → import.meta.env.BASE_URL
  result = result.replace(/process\.env\.BASE_URL/g, () => {
    changed = true
    replacements.push('process.env.BASE_URL → import.meta.env.BASE_URL')
    return 'import.meta.env.BASE_URL'
  })

  // 剩余的 process.env.XXX（非 VUE_APP_ 前缀）→ 添加 TODO 注释
  result = result.replace(/process\.env\.(\w+)/g, (_match, varName: string) => {
    changed = true
    replacements.push(`process.env.${varName} → TODO`)
    return `/* TODO(vue3-env): process.env.${varName} → import.meta.env.${varName} (需手动确认) */ import.meta.env.${varName}`
  })

  return { code: result, changed, replacements }
}

export const fixEnvVars = async (
  targetDir: string,
  options: CodemodOptions = {},
): Promise<CodemodResult> => {
  const absDir = resolve(process.cwd(), targetDir)
  const dryRun = options.dryRun ?? false

  // 扫描 JS/TS/Vue 源码文件
  const sourceFiles = await fg(['**/*.vue', '**/*.js', '**/*.ts', '**/*.jsx', '**/*.tsx'], {
    cwd: absDir,
    absolute: true,
    ignore: ['**/node_modules/**', '**/dist/**', '**/*.d.ts', '**/*.bak'],
  })

  // 扫描 .env 文件（在项目根目录，不在 targetDir 内）
  const rootDir = resolve(process.cwd())
  const envFiles = await fg(['.env', '.env.*'], {
    cwd: rootDir,
    absolute: true,
    ignore: ['**/*.bak'],
    dot: true,
  })

  const allFiles = [...sourceFiles, ...envFiles]

  let fixedCount = 0
  const fixedFiles: string[] = []

  for (const file of allFiles) {
    const isEnvFile = /\.env(\.\w+)?$/.test(file)
    const original = readFileSync(file, 'utf-8')
    const { code, changed, replacements } = transformEnvVars(original, isEnvFile)

    if (changed) {
      fixedFiles.push(file)
      fixedCount++

      if (!dryRun) {
        copyFileSync(file, `${file}.vue3.bak`)
        writeFileSync(file, code, 'utf-8')
      }

      const relPath = relative(process.cwd(), file)
      if (dryRun) {
        console.log(pc.yellow(`  [dry-run] ${relPath}`))
      } else {
        console.log(`  ${pc.green('→')} ${pc.gray(relPath)}`)
      }
      replacements.slice(0, 3).forEach((r) => console.log(`    ${pc.cyan('·')} ${r}`))
      if (replacements.length > 3) {
        console.log(pc.gray(`    ... 共 ${replacements.length} 处替换`))
      }
    }
  }

  if (dryRun) {
    console.log(pc.yellow(`\n[dry-run] 环境变量迁移将影响 ${fixedCount} 个文件`))
  } else {
    console.log(pc.green(`\n✅ 环境变量迁移完成: ${fixedCount} 个文件`))
    console.log(pc.yellow('  ⚠️  请同步重命名 .env 文件中的 VUE_APP_ 前缀为 VITE_'))
    console.log(pc.yellow('  ⚠️  检查 TODO(vue3-env) 注释，确认非 VUE_APP_ 变量的处理'))
  }

  return { fixedCount, fixedFiles }
}

// 导出内部函数供测试使用
export { transformEnvVars }
