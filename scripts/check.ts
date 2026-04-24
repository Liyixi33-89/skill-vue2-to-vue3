/**
 * 验证器：检查是否还残留 Vue 2 特征
 */
import { readFileSync } from 'fs'
import { resolve, relative } from 'path'
import fg from 'fast-glob'
import pc from 'picocolors'
import type { CheckIssue } from './types.js'

interface CheckPattern {
  label: string
  pattern: RegExp
}

const CHECKS: CheckPattern[] = [
  { label: 'new Vue()', pattern: /new\s+Vue\s*\(/g },
  { label: 'beforeDestroy hook', pattern: /\bbeforeDestroy\s*[(:]/g },
  { label: 'destroyed hook', pattern: /(?<!\w)destroyed\s*[(:]/g },
  { label: '.sync modifier', pattern: /\.\bsync\b/g },
  { label: 'filters: {}', pattern: /\bfilters\s*:\s*\{/g },
  { label: 'pipe filter {{ | }}', pattern: /\{\{[^}]+\|[^}]+\}\}/g },
  { label: '$listeners', pattern: /\$listeners\b/g },
  { label: '$on / $off / $once', pattern: /\$on\s*\(|\$off\s*\(|\$once\s*\(/g },
  { label: 'new VueRouter()', pattern: /new\s+VueRouter\s*\(/g },
  { label: 'Vue.observable()', pattern: /\bVue\.observable\s*\(/g },
]

export const check = async (targetDir: string): Promise<boolean> => {
  const absDir = resolve(process.cwd(), targetDir)

  const files = await fg(['**/*.vue', '**/*.js', '**/*.ts', '**/*.jsx', '**/*.tsx'], {
    cwd: absDir,
    absolute: true,
    ignore: ['**/node_modules/**', '**/dist/**', '**/*.d.ts', '**/*.bak'],
  })

  const issues: CheckIssue[] = []

  for (const file of files) {
    const content = readFileSync(file, 'utf-8')
    const relPath = relative(absDir, file)

    for (const checkItem of CHECKS) {
      const matches = [...content.matchAll(checkItem.pattern)]
      if (matches.length > 0) {
        issues.push({ file: relPath, label: checkItem.label, count: matches.length })
      }
    }
  }

  if (issues.length === 0) {
    console.log(pc.green('\n✅ 未发现 Vue 2 残留特征，迁移检查通过！\n'))
    return true
  }

  console.log(pc.red(`\n❌ 发现 ${issues.length} 处 Vue 2 残留特征:\n`))
  for (const { file, label, count } of issues) {
    console.log(`  ${pc.gray(file)}: ${pc.yellow(label)} ×${count}`)
  }
  console.log('')
  return false
}

// 导出内部数据供测试使用
export { CHECKS }
export type { CheckPattern, CheckIssue }
