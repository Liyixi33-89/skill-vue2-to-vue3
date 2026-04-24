/**
 * Codemod: Vue Router 3 → Vue Router 4
 */
import { readFileSync, writeFileSync, copyFileSync } from 'fs'
import { resolve } from 'path'
import fg from 'fast-glob'
import pc from 'picocolors'
import type { CodemodOptions, CodemodResult } from '../types.js'

interface RouterReplacement {
  from: RegExp
  to: string
}

const REPLACEMENTS: RouterReplacement[] = [
  // import VueRouter from 'vue-router' → import { createRouter, createWebHistory } from 'vue-router'
  {
    from: /import\s+VueRouter\s+from\s+['"]vue-router['"]/g,
    to: "import { createRouter, createWebHistory, createWebHashHistory } from 'vue-router'",
  },
  // new VueRouter({ → createRouter({ (加 TODO)
  {
    from: /new\s+VueRouter\s*\(\{/g,
    to: '/* TODO(vue3-router): 替换为 createRouter({ history: createWebHistory(), routes: [...] }) */\ncreateRouter({',
  },
  // mode: 'history' → history: createWebHistory()
  {
    from: /mode\s*:\s*['"]history['"]/g,
    to: "history: createWebHistory(import.meta.env.BASE_URL ?? '/')",
  },
  // mode: 'hash' → history: createWebHashHistory()
  {
    from: /mode\s*:\s*['"]hash['"]/g,
    to: 'history: createWebHashHistory()',
  },
  // Vue.use(VueRouter) → 删除（加注释）
  {
    from: /Vue\.use\s*\(\s*VueRouter\s*\)/g,
    to: '/* TODO(vue3-router): 删除 Vue.use(VueRouter)，改为 app.use(router) */',
  },
  // scrollBehavior x/y → left/top
  {
    from: /\breturn\s*\{\s*x\s*:\s*(\d+)\s*,\s*y\s*:\s*(\d+)\s*\}/g,
    to: 'return { left: $1, top: $2 }',
  },
  // router.getMatchedComponents() → 标注 TODO
  {
    from: /router\.getMatchedComponents\s*\(\)/g,
    to: '/* TODO(vue3-router): getMatchedComponents 已移除，使用 router.currentRoute.value.matched.flatMap(r => Object.values(r.components)) */ []',
  },
]

interface TransformRouterResult {
  code: string
  changed: boolean
}

const transformRouter = (code: string): TransformRouterResult => {
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

export const fixRouter = async (
  targetDir: string,
  options: CodemodOptions = {},
): Promise<CodemodResult> => {
  const absDir = resolve(process.cwd(), targetDir)
  const dryRun = options.dryRun ?? false

  // 主要是 router/ 目录和 main.js
  const files = await fg(['**/*.js', '**/*.ts'], {
    cwd: absDir,
    absolute: true,
    ignore: ['**/node_modules/**', '**/dist/**', '**/*.d.ts', '**/*.bak'],
  })

  let fixedCount = 0
  const fixedFiles: string[] = []

  for (const file of files) {
    const original = readFileSync(file, 'utf-8')
    const { code, changed } = transformRouter(original)

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
    console.log(pc.yellow(`[dry-run] Vue Router 迁移将影响 ${fixedCount} 个文件`))
  } else {
    console.log(pc.green(`✅ Vue Router 迁移完成: ${fixedCount} 个文件`))
    console.log(pc.yellow('  ⚠️  请检查 TODO 注释，确认 createRouter / app.use(router) 已正确配置'))
    fixedFiles.forEach((f) => console.log(`  ${pc.green('→')} ${pc.gray(f)}`))
  }

  return { fixedCount, fixedFiles }
}

// 导出内部函数供测试使用
export { transformRouter }
