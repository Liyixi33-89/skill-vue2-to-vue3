/**
 * Codemod: Vue 2 Filters → Vue 3
 *
 * 策略：
 * 1. 模板中 {{ val | filter }} → {{ $filters.filter(val) }}
 * 2. 模板中 {{ val | filter(arg) }} → 标注 TODO
 * 3. 扫描所有 filters: {} 定义，汇总为 utils/filters.js 骨架
 * 4. 在 main.js 末尾添加 globalProperties.$filters 注入注释
 */
import { readFileSync, writeFileSync, copyFileSync, existsSync, mkdirSync } from 'fs'
import { resolve, relative } from 'path'
import fg from 'fast-glob'
import pc from 'picocolors'
import type { CodemodOptions, FiltersCodemodResult } from '../types.js'

// 匹配模板中的 {{ expr | filterName }} （无参数）
const PIPE_NO_ARG = /\{\{\s*([^|{}]+?)\s*\|\s*(\w+)\s*\}\}/g
// 匹配模板中的 {{ expr | filterName(args) }} （有参数）
const PIPE_WITH_ARG = /\{\{\s*([^|{}]+?)\s*\|\s*(\w+)\s*\(([^)]*)\)\s*\}\}/g

// 收集 filters 定义名称（支持嵌套花括号）
const FILTER_DEF = /filters\s*:\s*\{((?:[^{}]|\{[^{}]*\})*)\}/gs
const FILTER_NAME = /(\w+)\s*(?:\([^)]*\))?\s*\{|(\w+)\s*:/g

interface TransformFiltersResult {
  code: string
  changed: boolean
  collectedFilters: Set<string>
}

const transformFilters = (code: string): TransformFiltersResult => {
  let result = code
  let changed = false
  const collectedFilters = new Set<string>()

  // 先收集 filters 定义中的函数名
  const defMatches = [...code.matchAll(FILTER_DEF)]
  for (const m of defMatches) {
    const body = m[1]
    const names = [...body.matchAll(FILTER_NAME)]
    for (const n of names) {
      const name = n[1] ?? n[2]
      if (name && name !== 'function') {
        collectedFilters.add(name)
      }
    }
  }

  // 替换有参数的 pipe（标注 TODO）
  result = result.replace(
    PIPE_WITH_ARG,
    (_match, expr: string, filterName: string, args: string) => {
      changed = true
      return `/* TODO(vue3-filter): {{ ${expr.trim()} | ${filterName}(${args}) }} → {{ $filters.${filterName}(${expr.trim()}, ${args}) }} */ {{ $filters.${filterName}(${expr.trim()}, ${args}) }}`
    },
  )

  // 替换无参数的 pipe
  result = result.replace(PIPE_NO_ARG, (_match, expr: string, filterName: string) => {
    changed = true
    collectedFilters.add(filterName)
    return `{{ $filters.${filterName}(${expr.trim()}) }}`
  })

  // 标注 filters: {} 定义
  result = result.replace(/(\bfilters\s*:\s*\{)/g, (match) => {
    changed = true
    return `/* TODO(vue3-filter): 将以下 filters 迁移到 src/utils/filters.js 并注册到 app.config.globalProperties.$filters */\n  ${match}`
  })

  return { code: result, changed, collectedFilters }
}

export const fixFilters = async (
  targetDir: string,
  options: CodemodOptions = {},
): Promise<FiltersCodemodResult> => {
  const absDir = resolve(process.cwd(), targetDir)
  const dryRun = options.dryRun ?? false
  const allFilters = new Set<string>()

  const files = await fg(['**/*.vue', '**/*.html'], {
    cwd: absDir,
    absolute: true,
    ignore: ['**/node_modules/**', '**/dist/**', '**/*.bak'],
  })

  let fixedCount = 0
  const fixedFiles: string[] = []

  for (const file of files) {
    const original = readFileSync(file, 'utf-8')
    const { code, changed, collectedFilters } = transformFilters(original)
    collectedFilters.forEach((f) => allFilters.add(f))

    if (changed) {
      fixedFiles.push(file)
      fixedCount++
      if (!dryRun) {
        copyFileSync(file, `${file}.vue3.bak`)
        writeFileSync(file, code, 'utf-8')
      }
    }
  }

  // 生成 utils/filters.js 骨架
  if (!dryRun && allFilters.size > 0) {
    const utilsDir = resolve(absDir, 'utils')
    if (!existsSync(utilsDir)) {
      mkdirSync(utilsDir, { recursive: true })
    }

    const filtersPath = resolve(utilsDir, 'filters.js')
    if (!existsSync(filtersPath)) {
      const filterFunctions = [...allFilters]
        .map(
          (name) =>
            `export function ${name}(value) {\n  // TODO: 从 Vue 2 filters.${name} 迁移\n  return value\n}`,
        )
        .join('\n\n')

      const content = `/**\n * Vue 3 过滤器替代工具函数\n * 由 vue2to3 自动生成，请补充各函数实现\n */\n\n${filterFunctions}\n`
      writeFileSync(filtersPath, content, 'utf-8')
      console.log(pc.green(`✅ 已生成 ${relative(process.cwd(), filtersPath)}`))
    }

    // 提示 main.js 注入
    console.log(pc.yellow('\n  在 main.js 中添加以下代码以注册全局 $filters:'))
    console.log(
      pc.cyan(`
  import * as filters from './utils/filters'
  app.config.globalProperties.$filters = filters
`),
    )
  }

  if (dryRun) {
    console.log(pc.yellow(`[dry-run] Filters 迁移将影响 ${fixedCount} 个文件`))
  } else {
    console.log(pc.green(`✅ Filters 迁移完成: ${fixedCount} 个文件`))
    console.log(pc.yellow('  ⚠️  请补充 src/utils/filters.js 中各函数的具体实现'))
    fixedFiles.forEach((f) => console.log(`  ${pc.green('→')} ${pc.gray(f)}`))
  }

  return { fixedCount, fixedFiles, collectedFilters: [...allFilters] }
}

// 导出内部函数供测试使用
export { transformFilters }
