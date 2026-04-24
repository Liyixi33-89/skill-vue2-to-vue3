/**
 * Codemod: Vue 2 Global API → Vue 3 app instance API
 *
 * 转换规则：
 *   new Vue({ el, render }) → createApp(App).mount(el)
 *   Vue.use(x)             → app.use(x)   [标注 TODO]
 *   Vue.mixin(x)           → app.mixin(x) [标注 TODO]
 *   Vue.component(n, c)    → app.component(n, c) [标注 TODO]
 *   Vue.directive(n, d)    → app.directive(n, d) [标注 TODO]
 *   Vue.prototype.$x = y   → app.config.globalProperties.$x = y
 *   Vue.observable(obj)    → reactive(obj)
 *   Vue.set(obj, k, v)     → obj[k] = v  [标注 TODO]
 *   Vue.delete(obj, k)     → delete obj[k] [标注 TODO]
 */
import { readFileSync, writeFileSync, copyFileSync } from 'fs'
import { resolve } from 'path'
import fg from 'fast-glob'
import pc from 'picocolors'
import type { CodemodOptions, CodemodResult } from '../types.js'

interface SimpleReplacement {
  from: RegExp
  to: string
  note: string
}

interface TodoReplacement {
  from: RegExp
  todo: string
}

// 简单的字符串级替换（适合大多数场景）
const SIMPLE_REPLACEMENTS: SimpleReplacement[] = [
  // Vue.observable → reactive (需要 import)
  {
    from: /\bVue\.observable\s*\(/g,
    to: 'reactive(',
    note: '⚠️ 请确认已从 vue 导入 reactive',
  },
  // Vue.prototype.$xxx → app.config.globalProperties.$xxx
  {
    from: /\bVue\.prototype\b/g,
    to: 'app.config.globalProperties',
    note: '⚠️ 确保 app 变量已定义（createApp 返回值）',
  },
]

// 需要注释标注的复杂替换
const TODO_REPLACEMENTS: TodoReplacement[] = [
  {
    from: /\bVue\.use\s*\(/g,
    todo: 'TODO(vue3): Vue.use() → app.use()',
  },
  {
    from: /\bVue\.mixin\s*\(/g,
    todo: 'TODO(vue3): Vue.mixin() → app.mixin()',
  },
  {
    from: /\bVue\.component\s*\(/g,
    todo: 'TODO(vue3): Vue.component() → app.component()',
  },
  {
    from: /\bVue\.directive\s*\(/g,
    todo: 'TODO(vue3): Vue.directive() → app.directive()',
  },
  {
    from: /\bVue\.set\s*\(/g,
    todo: 'TODO(vue3): Vue.set(obj, key, val) → obj[key] = val (Vue 3 Proxy 响应式，直接赋值即可)',
  },
  {
    from: /\bVue\.delete\s*\(/g,
    todo: 'TODO(vue3): Vue.delete(obj, key) → delete obj[key]',
  },
  {
    from: /new\s+Vue\s*\(\{/g,
    todo: 'TODO(vue3): new Vue({...}) → const app = createApp(App); app.mount("#app")',
  },
]

interface ApplyTransformsResult {
  code: string
  changed: boolean
}

const applyTransforms = (code: string): ApplyTransformsResult => {
  let result = code
  let changed = false

  // 应用简单替换
  for (const { from, to } of SIMPLE_REPLACEMENTS) {
    const next = result.replace(from, to)
    if (next !== result) {
      changed = true
    }
    result = next
  }

  // 应用 TODO 注释标注
  for (const { from, todo } of TODO_REPLACEMENTS) {
    const next = result.replace(from, (match) => {
      changed = true
      return `/* ${todo} */ ${match}`
    })
    result = next
  }

  return { code: result, changed }
}

export const fixGlobalApi = async (
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
    const { code, changed } = applyTransforms(original)

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
    console.log(pc.yellow(`[dry-run] Global API 修复将影响 ${fixedCount} 个文件`))
  } else {
    console.log(pc.green(`✅ Global API 修复完成: ${fixedCount} 个文件`))
    console.log(pc.yellow(`  ⚠️  含 TODO 注释，请手动核查 createApp 和 app.mount() 的改写`))
    fixedFiles.forEach((f) => console.log(`  ${pc.green('→')} ${pc.gray(f)}`))
  }

  return { fixedCount, fixedFiles }
}

// 导出内部函数供测试使用
export { applyTransforms }
