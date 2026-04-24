/**
 * Vue 2 → Vue 3 项目扫描器
 * 分析项目中的 Vue 2 特征，生成迁移报告
 */
import { readFileSync, writeFileSync } from 'fs'
import { resolve, relative } from 'path'
import fg from 'fast-glob'
import pc from 'picocolors'
import type { Finding, ScanReport, ScanRule } from './types.js'

// ─── 检测规则定义 ───────────────────────────────────────────────────────────

const RULES: ScanRule[] = [
  // 全局 API
  {
    id: 'global-api',
    category: 'Global API',
    severity: 'error',
    label: 'new Vue()',
    pattern: /new\s+Vue\s*\(/g,
    fix: 'global-api',
    doc: 'references/breaking-changes.md#1-global-api-重构',
  },
  {
    id: 'vue-use',
    category: 'Global API',
    severity: 'error',
    label: 'Vue.use()',
    pattern: /\bVue\.use\s*\(/g,
    fix: 'global-api',
    doc: 'references/breaking-changes.md',
  },
  {
    id: 'vue-mixin',
    category: 'Global API',
    severity: 'warning',
    label: 'Vue.mixin()',
    pattern: /\bVue\.mixin\s*\(/g,
    fix: 'global-api',
    doc: 'references/breaking-changes.md',
  },
  {
    id: 'vue-component-global',
    category: 'Global API',
    severity: 'warning',
    label: 'Vue.component()',
    pattern: /\bVue\.component\s*\(/g,
    fix: 'global-api',
    doc: 'references/breaking-changes.md',
  },
  {
    id: 'vue-directive-global',
    category: 'Global API',
    severity: 'warning',
    label: 'Vue.directive()',
    pattern: /\bVue\.directive\s*\(/g,
    fix: 'global-api',
    doc: 'references/breaking-changes.md',
  },
  {
    id: 'vue-prototype',
    category: 'Global API',
    severity: 'warning',
    label: 'Vue.prototype',
    pattern: /\bVue\.prototype\b/g,
    fix: 'global-api',
    doc: 'references/breaking-changes.md',
  },
  {
    id: 'vue-observable',
    category: 'Global API',
    severity: 'error',
    label: 'Vue.observable()',
    pattern: /\bVue\.observable\s*\(/g,
    fix: 'global-api',
    doc: 'references/breaking-changes.md',
  },
  {
    id: 'vue-set',
    category: 'Global API',
    severity: 'warning',
    label: 'Vue.set / this.$set',
    pattern: /\bVue\.set\s*\(|this\.\$set\s*\(/g,
    fix: null,
    doc: 'references/breaking-changes.md#13-vueset--vuedelete-被移除',
  },
  {
    id: 'vue-delete',
    category: 'Global API',
    severity: 'warning',
    label: 'Vue.delete / this.$delete',
    pattern: /\bVue\.delete\s*\(|this\.\$delete\s*\(/g,
    fix: null,
    doc: 'references/breaking-changes.md',
  },

  // 生命周期
  {
    id: 'lifecycle-before-destroy',
    category: 'Lifecycle',
    severity: 'error',
    label: 'beforeDestroy hook',
    pattern: /\bbeforeDestroy\s*[(:]/g,
    fix: 'lifecycle',
    doc: 'references/lifecycle.md',
  },
  {
    id: 'lifecycle-destroyed',
    category: 'Lifecycle',
    severity: 'error',
    label: 'destroyed hook',
    pattern: /\bdestroyed\s*[(:]/g,
    fix: 'lifecycle',
    doc: 'references/lifecycle.md',
  },

  // v-model / .sync
  {
    id: 'sync-modifier',
    category: 'v-model',
    severity: 'error',
    label: '.sync modifier',
    pattern: /\.\bsync\b/g,
    fix: 'sync',
    doc: 'references/v-model.md',
  },
  {
    id: 'model-option',
    category: 'v-model',
    severity: 'warning',
    label: 'model: {} option',
    pattern: /\bmodel\s*:\s*\{/g,
    fix: null,
    doc: 'references/v-model.md',
  },

  // Filters
  {
    id: 'filters-option',
    category: 'Filters',
    severity: 'error',
    label: 'filters: {} option',
    pattern: /\bfilters\s*:\s*\{/g,
    fix: 'filters',
    doc: 'references/filters.md',
  },
  {
    id: 'filter-pipe',
    category: 'Filters',
    severity: 'error',
    label: 'template pipe {{ x | filter }}',
    pattern: /\{\{[^}]+\|[^}]+\}\}/g,
    fix: 'filters',
    doc: 'references/filters.md',
  },

  // 事件总线
  {
    id: 'event-bus-on',
    category: 'Event Bus',
    severity: 'error',
    label: '$on / $off / $once',
    pattern: /\$on\s*\(|\$off\s*\(|\$once\s*\(/g,
    fix: 'event-bus',
    doc: 'references/breaking-changes.md#6-on--off--once-被移除事件总线',
  },

  // $listeners
  {
    id: 'listeners',
    category: '$attrs/$listeners',
    severity: 'error',
    label: '$listeners',
    pattern: /\$listeners\b/g,
    fix: 'listeners',
    doc: 'references/breaking-changes.md',
  },

  // $children
  {
    id: 'children',
    category: '$children',
    severity: 'warning',
    label: '$children',
    pattern: /\$children\b/g,
    fix: null,
    doc: 'references/breaking-changes.md#8-children-被移除',
  },

  // Vue Router
  {
    id: 'vue-router-new',
    category: 'Vue Router',
    severity: 'error',
    label: 'new VueRouter()',
    pattern: /new\s+VueRouter\s*\(/g,
    fix: 'router',
    doc: 'references/router-migration.md',
  },
  {
    id: 'vue-router-import',
    category: 'Vue Router',
    severity: 'error',
    label: "import VueRouter from 'vue-router'",
    pattern: /import\s+VueRouter\s+from\s+['"]vue-router['"]/g,
    fix: 'router',
    doc: 'references/router-migration.md',
  },

  // Vuex
  {
    id: 'vuex-new-store',
    category: 'Vuex',
    severity: 'warning',
    label: 'new Vuex.Store()',
    pattern: /new\s+Vuex\.Store\s*\(/g,
    fix: null,
    doc: 'references/vuex-to-pinia.md',
  },

  // Element UI
  {
    id: 'element-ui-import',
    category: 'Element UI',
    severity: 'warning',
    label: "from 'element-ui'",
    pattern: /from\s+['"]element-ui['"]/g,
    fix: null,
    doc: 'references/element-ui-migration.md',
  },
  {
    id: 'element-visible-sync',
    category: 'Element UI',
    severity: 'warning',
    label: ':visible.sync (el-dialog)',
    pattern: /:visible\.sync/g,
    fix: null,
    doc: 'references/element-ui-migration.md',
  },

  // 构建工具：Vue CLI → Vite 环境变量
  {
    id: 'env-vue-app',
    category: 'Build Tool',
    severity: 'error',
    label: 'process.env.VUE_APP_*',
    pattern: /process\.env\.VUE_APP_\w+/g,
    fix: 'env-vars',
    doc: 'references/build-tool-migration.md',
  },
  {
    id: 'env-node-env',
    category: 'Build Tool',
    severity: 'warning',
    label: 'process.env.NODE_ENV',
    pattern: /process\.env\.NODE_ENV/g,
    fix: 'env-vars',
    doc: 'references/build-tool-migration.md',
  },
  {
    id: 'env-base-url',
    category: 'Build Tool',
    severity: 'warning',
    label: 'process.env.BASE_URL',
    pattern: /process\.env\.BASE_URL/g,
    fix: 'env-vars',
    doc: 'references/build-tool-migration.md',
  },
  {
    id: 'require-call',
    category: 'Build Tool',
    severity: 'warning',
    label: 'require() 调用',
    pattern: /\brequire\s*\(/g,
    fix: null,
    doc: 'references/build-tool-migration.md',
  },
  {
    id: 'require-context',
    category: 'Build Tool',
    severity: 'error',
    label: 'require.context()',
    pattern: /require\.context\s*\(/g,
    fix: null,
    doc: 'references/build-tool-migration.md',
  },

  // CSS 深度选择器
  {
    id: 'v-deep-old',
    category: 'CSS Scoped',
    severity: 'error',
    label: '::v-deep 旧写法',
    pattern: /::v-deep\b/g,
    fix: 'v-deep',
    doc: 'references/css-scoped-migration.md',
  },
  {
    id: 'deep-slash',
    category: 'CSS Scoped',
    severity: 'error',
    label: '/deep/ 旧写法',
    pattern: /\/deep\//g,
    fix: 'v-deep',
    doc: 'references/css-scoped-migration.md',
  },
  {
    id: 'deep-arrow',
    category: 'CSS Scoped',
    severity: 'warning',
    label: '>>> 深度选择器',
    pattern: />>>/g,
    fix: 'v-deep',
    doc: 'references/css-scoped-migration.md',
  },

  // @vue/test-utils v1
  {
    id: 'test-utils-propsdata',
    category: 'Test Utils',
    severity: 'error',
    label: 'propsData 选项（test-utils v1）',
    pattern: /\bpropsData\s*:/g,
    fix: 'test-utils',
    doc: 'references/test-utils-migration.md',
  },
  {
    id: 'test-utils-destroy',
    category: 'Test Utils',
    severity: 'error',
    label: 'wrapper.destroy()',
    pattern: /\.destroy\s*\(\s*\)/g,
    fix: 'test-utils',
    doc: 'references/test-utils-migration.md',
  },
  {
    id: 'test-utils-create-local-vue',
    category: 'Test Utils',
    severity: 'error',
    label: 'createLocalVue()',
    pattern: /\bcreateLocalVue\s*\(\s*\)/g,
    fix: 'test-utils',
    doc: 'references/test-utils-migration.md',
  },
  {
    id: 'test-utils-contains',
    category: 'Test Utils',
    severity: 'warning',
    label: 'wrapper.contains()',
    pattern: /\.contains\s*\(/g,
    fix: 'test-utils',
    doc: 'references/test-utils-migration.md',
  },
  {
    id: 'test-utils-set-data',
    category: 'Test Utils',
    severity: 'warning',
    label: 'wrapper.setData()',
    pattern: /\.setData\s*\(/g,
    fix: 'test-utils',
    doc: 'references/test-utils-migration.md',
  },
]

// ─── 扫描单个文件 ────────────────────────────────────────────────────────────

const scanFile = (_filePath: string, content: string): Finding[] => {
  const findings: Finding[] = []

  for (const rule of RULES) {
    const matches = [...content.matchAll(rule.pattern)]
    if (matches.length > 0) {
      // 计算每个 match 的行号
      const lines = content.split('\n')
      for (const match of matches) {
        let lineNum = 1
        let charCount = 0
        for (const line of lines) {
          charCount += line.length + 1
          if (charCount > (match.index ?? 0)) {
            break
          }
          lineNum++
        }
        findings.push({
          ruleId: rule.id,
          category: rule.category,
          severity: rule.severity,
          label: rule.label,
          line: lineNum,
          fix: rule.fix,
          doc: rule.doc,
        })
      }
    }
  }

  return findings
}

// ─── 主扫描函数 ──────────────────────────────────────────────────────────────

export interface ScanOptions {
  /** 是否写入报告文件 */
  write?: boolean
}

export const scan = async (
  targetDir: string,
  options: ScanOptions = {},
): Promise<ScanReport | null> => {
  const absDir = resolve(process.cwd(), targetDir)

  console.log(pc.cyan(`\n🔍 扫描目录: ${absDir}\n`))

  // 收集文件
  const files = await fg(['**/*.vue', '**/*.js', '**/*.ts', '**/*.jsx', '**/*.tsx'], {
    cwd: absDir,
    absolute: true,
    ignore: ['**/node_modules/**', '**/dist/**', '**/*.d.ts', '**/*.bak'],
  })

  if (files.length === 0) {
    console.log(pc.yellow('未找到 Vue/JS/TS 文件。'))
    return null
  }

  console.log(pc.gray(`共找到 ${files.length} 个文件\n`))

  // 按文件扫描
  const report: ScanReport = {
    scannedAt: new Date().toISOString(),
    targetDir: absDir,
    totalFiles: files.length,
    affectedFiles: 0,
    summary: {},
    complexity: 'LOW',
    findings: {},
    fixes: {},
    actionRequired: [],
  }

  let totalIssues = 0
  let errorCount = 0

  for (const file of files) {
    const content = readFileSync(file, 'utf-8')
    const findings = scanFile(file, content)

    if (findings.length > 0) {
      const relPath = relative(absDir, file)
      report.findings[relPath] = findings
      report.affectedFiles++
      totalIssues += findings.length

      for (const f of findings) {
        // 汇总分类
        report.summary[f.category] = (report.summary[f.category] ?? 0) + 1
        if (f.severity === 'error') {
          errorCount++
        }
        // 需要运行的 fix 命令
        if (f.fix && !report.fixes[f.fix]) {
          report.fixes[f.fix] = `npx vue2to3 fix ${f.fix} ./src`
        }
      }
    }
  }

  // 判断复杂度
  if (errorCount === 0) {
    report.complexity = 'LOW'
  } else if (errorCount < 10) {
    report.complexity = 'MEDIUM'
  } else {
    report.complexity = 'HIGH'
  }

  // 需要人工处理的项
  if (report.summary['Filters']) {
    report.actionRequired.push('Filters → computed/utils（需人工改写）')
  }
  if (report.summary['Event Bus']) {
    report.actionRequired.push('Event Bus → mitt（需引入依赖并重构）')
  }
  if (report.summary['$children']) {
    report.actionRequired.push('$children → template refs（需重构）')
  }
  if (report.summary['Vuex']) {
    report.actionRequired.push('Vuex → Pinia（建议迁移，参考 references/vuex-to-pinia.md）')
  }
  if (report.summary['Element UI']) {
    report.actionRequired.push(
      'Element UI → Element Plus（参考 references/element-ui-migration.md）',
    )
  }
  if (report.summary['Build Tool']) {
    report.actionRequired.push('process.env.VUE_APP_* → import.meta.env.VITE_*（运行 fix env-vars 自动替换）')
    report.actionRequired.push('require() → import（需人工改写，参考 references/build-tool-migration.md）')
  }
  if (report.summary['CSS Scoped']) {
    report.actionRequired.push('::v-deep / /deep/ / >>> → :deep()（运行 fix v-deep 自动替换）')
  }
  if (report.summary['Test Utils']) {
    report.actionRequired.push('@vue/test-utils v1 → v2（运行 fix test-utils 自动替换，参考 references/test-utils-migration.md）')
  }

  // 输出报告
  printReport(report, totalIssues, errorCount)

  // 写入文件
  if (options.write !== false) {
    const outPath = resolve(process.cwd(), 'vue3-migration-report.json')
    writeFileSync(outPath, JSON.stringify(report, null, 2), 'utf-8')
    console.log(pc.green(`\n✅ 报告已写入: ${outPath}\n`))
  }

  return report
}

// ─── 打印报告 ────────────────────────────────────────────────────────────────

const printReport = (report: ScanReport, totalIssues: number, errorCount: number): void => {
  const complexityColor = {
    LOW: pc.green,
    MEDIUM: pc.yellow,
    HIGH: pc.red,
  }[report.complexity]

  console.log(pc.bold('━━━ 扫描结果 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'))
  console.log(`  文件总数:    ${pc.cyan(String(report.totalFiles))}`)
  console.log(`  受影响文件:  ${pc.yellow(String(report.affectedFiles))}`)
  console.log(`  问题总数:    ${pc.red(String(totalIssues))} (${pc.red(errorCount + ' errors')})`)
  console.log(`  迁移复杂度:  ${complexityColor(report.complexity)}`)

  console.log(pc.bold('\n━━━ 问题分类 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'))
  for (const [cat, count] of Object.entries(report.summary)) {
    const icon = count > 5 ? '🔴' : count > 2 ? '🟡' : '🟢'
    console.log(`  ${icon} ${cat.padEnd(25)} ${count} 处`)
  }

  if (Object.keys(report.fixes).length > 0) {
    console.log(pc.bold('\n━━━ 可自动修复（建议按序执行）━━━━━━━━━━━━━━━━━━━━━'))
    for (const cmd of Object.values(report.fixes)) {
      console.log(`  ${pc.cyan('$')} ${cmd}`)
    }
    console.log(`  ${pc.cyan('$')} npx vue2to3 fix all ./src  ${pc.gray('(一键执行所有修复)')}`)
  }

  if (report.actionRequired.length > 0) {
    console.log(pc.bold('\n━━━ 需要人工处理 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'))
    for (const item of report.actionRequired) {
      console.log(`  ⚠️  ${item}`)
    }
  }

  console.log(pc.bold('\n━━━ 受影响文件 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'))
  const entries = Object.entries(report.findings).slice(0, 20)
  for (const [file, findings] of entries) {
    console.log(`  ${pc.gray(file)}`)
    const grouped: Record<string, number> = {}
    for (const f of findings) {
      grouped[f.label] = (grouped[f.label] ?? 0) + 1
    }
    for (const [label, count] of Object.entries(grouped)) {
      console.log(`    ${pc.yellow('→')} ${label} ×${count}`)
    }
  }
  if (Object.keys(report.findings).length > 20) {
    console.log(
      pc.gray(
        `  ... 还有 ${Object.keys(report.findings).length - 20} 个文件，见 vue3-migration-report.json`,
      ),
    )
  }
}

// 导出内部函数和数据供测试使用
export { RULES, scanFile, printReport }
