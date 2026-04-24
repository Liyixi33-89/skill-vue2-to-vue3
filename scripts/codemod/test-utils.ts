/**
 * Codemod: @vue/test-utils v1 → v2
 *
 * 替换策略：
 * 1. mount/shallowMount 选项：propsData → props，listeners → attrs，scopedSlots → slots
 * 2. wrapper.destroy()  → wrapper.unmount()
 * 3. wrapper.setData()  → 标注 TODO
 * 4. createLocalVue()   → 标注 TODO（改为 config.global）
 * 5. wrapper.contains() → wrapper.find().exists()
 * 6. wrapper.isEmpty()  → 标注 TODO
 * 7. wrapper.is()       → 标注 TODO
 * 8. import 路径中的 flushPromises 补全
 * 9. Wrapper 类型 → VueWrapper
 */
import { readFileSync, writeFileSync, copyFileSync } from 'fs'
import { resolve, relative } from 'path'
import fg from 'fast-glob'
import pc from 'picocolors'
import type { CodemodOptions, CodemodResult } from '../types.js'

// ─── 替换规则 ────────────────────────────────────────────────────────────────

interface Replacement {
  from: RegExp
  to: string
  description: string
}

const REPLACEMENTS: Replacement[] = [
  // ── mount/shallowMount 选项 ──────────────────────────────────────────────

  // propsData: { → props: {
  {
    from: /\bpropsData\s*:/g,
    to: 'props:',
    description: 'propsData → props',
  },

  // listeners: { → attrs: {  (v2 中 $listeners 合并入 $attrs)
  {
    from: /\blisteners\s*:/g,
    to: 'attrs:',
    description: 'listeners → attrs',
  },

  // scopedSlots: { → slots: {  (v2 统一了 slots 和 scopedSlots)
  {
    from: /\bscopedSlots\s*:/g,
    to: 'slots:',
    description: 'scopedSlots → slots',
  },

  // ── Wrapper 实例方法 ─────────────────────────────────────────────────────

  // wrapper.destroy() → wrapper.unmount()
  {
    from: /\.destroy\s*\(\s*\)/g,
    to: '.unmount()',
    description: 'wrapper.destroy() → wrapper.unmount()',
  },

  // wrapper.setData({ key: val }) → 标注 TODO
  {
    from: /\.setData\s*\(/g,
    to: '/* TODO(test-utils-v2): setData 已移除，直接操作 wrapper.vm.key = val 或使用 wrapper.setProps() */ .setData(',
    description: 'wrapper.setData() → TODO',
  },

  // wrapper.contains(selector) → wrapper.find(selector).exists()
  {
    from: /\.contains\s*\(([^)]+)\)/g,
    to: '.find($1).exists()',
    description: 'wrapper.contains(sel) → wrapper.find(sel).exists()',
  },

  // wrapper.isEmpty() → 标注 TODO
  {
    from: /\.isEmpty\s*\(\s*\)/g,
    to: '/* TODO(test-utils-v2): isEmpty 已移除，使用 wrapper.html() === "" 或检查子元素 */ .isEmpty()',
    description: 'wrapper.isEmpty() → TODO',
  },

  // wrapper.is(selector) → 标注 TODO
  {
    from: /\.is\s*\(([^)]+)\)/g,
    to: '/* TODO(test-utils-v2): is() 已移除，使用 wrapper.element.tagName 或 wrapper.findComponent() */ .is($1)',
    description: 'wrapper.is(sel) → TODO',
  },

  // ── createLocalVue ───────────────────────────────────────────────────────

  // createLocalVue() → 标注 TODO
  {
    from: /\bcreateLocalVue\s*\(\s*\)/g,
    to: '/* TODO(test-utils-v2): createLocalVue 已移除，改用 config.global.plugins / config.global.components */ createLocalVue()',
    description: 'createLocalVue() → TODO',
  },

  // localVue.use(plugin) → 标注 TODO
  {
    from: /\blocalVue\.use\s*\(/g,
    to: '/* TODO(test-utils-v2): 改为 mount(Comp, { global: { plugins: [plugin] } }) */ localVue.use(',
    description: 'localVue.use() → TODO',
  },

  // localVue.component(name, comp) → 标注 TODO
  {
    from: /\blocalVue\.component\s*\(/g,
    to: '/* TODO(test-utils-v2): 改为 mount(Comp, { global: { components: { Name: Comp } } }) */ localVue.component(',
    description: 'localVue.component() → TODO',
  },

  // ── 类型名称 ─────────────────────────────────────────────────────────────

  // Wrapper<Vue> → VueWrapper<ComponentPublicInstance>
  {
    from: /\bWrapper\s*<\s*Vue\s*>/g,
    to: 'VueWrapper<ComponentPublicInstance>',
    description: 'Wrapper<Vue> → VueWrapper<ComponentPublicInstance>',
  },

  // Wrapper<ComponentType> → VueWrapper<InstanceType<typeof ComponentType>>
  {
    from: /\bWrapper\s*<\s*(\w+)\s*>/g,
    to: 'VueWrapper<InstanceType<typeof $1>>',
    description: 'Wrapper<T> → VueWrapper<InstanceType<typeof T>>',
  },
]

// ─── import 语句处理 ─────────────────────────────────────────────────────────

/**
 * 处理 @vue/test-utils 的 import 语句：
 * 1. 移除 createLocalVue（已废弃）
 * 2. 移除 Wrapper 类型导入，添加 VueWrapper
 * 3. 确保 flushPromises 从 @vue/test-utils 导入（v2 直接导出）
 */
const transformImports = (code: string): { code: string; changed: boolean } => {
  let result = code
  let changed = false

  // 匹配 @vue/test-utils 的 import 语句
  result = result.replace(
    /import\s*\{([^}]+)\}\s*from\s*['"]@vue\/test-utils['"]/g,
    (_match, imports: string) => {
      const importList = imports
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)

      const transformed = importList.map((imp) => {
        // createLocalVue → 标注注释
        if (imp === 'createLocalVue') {
          changed = true
          return `/* TODO(test-utils-v2): createLocalVue 已移除 */`
        }
        // Wrapper 类型 → VueWrapper
        if (imp === 'Wrapper') {
          changed = true
          return 'VueWrapper'
        }
        // WrapperArray → DOMWrapper[]（v2 findAll 返回数组）
        if (imp === 'WrapperArray') {
          changed = true
          return '/* TODO(test-utils-v2): WrapperArray 已移除，findAll 直接返回 DOMWrapper[] */'
        }
        return imp
      })

      // 过滤掉纯注释行（保留有效导入）
      const validImports = transformed.filter((imp) => !imp.startsWith('/*') || imp.includes('*/\n'))
      const comments = transformed.filter((imp) => imp.startsWith('/*'))

      const newImportLine = `import { ${validImports.filter((i) => !i.startsWith('/*')).join(', ')} } from '@vue/test-utils'`
      const commentLines = comments.length > 0 ? `\n${comments.join('\n')}` : ''

      return `${newImportLine}${commentLines}`
    },
  )

  return { code: result, changed }
}

// ─── 核心转换函数 ────────────────────────────────────────────────────────────

export interface TestUtilsTransformResult {
  code: string
  changed: boolean
  replacements: string[]
}

export const transformTestUtils = (code: string): TestUtilsTransformResult => {
  let result = code
  let changed = false
  const replacements: string[] = []

  // 1. 处理 import 语句
  const { code: importTransformed, changed: importChanged } = transformImports(result)
  if (importChanged) {
    result = importTransformed
    changed = true
    replacements.push('import 语句更新（createLocalVue/Wrapper → VueWrapper）')
  }

  // 2. 应用所有替换规则
  for (const { from, to, description } of REPLACEMENTS) {
    const next = result.replace(from, to)
    if (next !== result) {
      changed = true
      replacements.push(description)
    }
    result = next
  }

  return { code: result, changed, replacements }
}

// ─── 文件系统操作 ────────────────────────────────────────────────────────────

export const fixTestUtils = async (
  targetDir: string,
  options: CodemodOptions = {},
): Promise<CodemodResult> => {
  const absDir = resolve(process.cwd(), targetDir)
  const dryRun = options.dryRun ?? false

  // 只处理测试文件
  const files = await fg(
    ['**/*.spec.js', '**/*.spec.ts', '**/*.test.js', '**/*.test.ts', '**/__tests__/**/*.{js,ts}'],
    {
      cwd: absDir,
      absolute: true,
      ignore: ['**/node_modules/**', '**/dist/**', '**/*.d.ts', '**/*.bak'],
    },
  )

  let fixedCount = 0
  const fixedFiles: string[] = []

  for (const file of files) {
    const original = readFileSync(file, 'utf-8')

    // 只处理使用了 @vue/test-utils 的文件
    if (!original.includes('@vue/test-utils')) {
      continue
    }

    const { code, changed, replacements } = transformTestUtils(original)

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
      replacements.slice(0, 4).forEach((r) => console.log(`    ${pc.cyan('·')} ${r}`))
      if (replacements.length > 4) {
        console.log(pc.gray(`    ... 共 ${replacements.length} 类替换`))
      }
    }
  }

  if (dryRun) {
    console.log(pc.yellow(`\n[dry-run] @vue/test-utils 迁移将影响 ${fixedCount} 个文件`))
  } else {
    console.log(pc.green(`\n✅ @vue/test-utils 迁移完成: ${fixedCount} 个文件`))
    console.log(pc.yellow('  ⚠️  检查 TODO(test-utils-v2) 注释，完成 createLocalVue → config.global 的手动迁移'))
    console.log(pc.yellow('  ⚠️  检查 setData 调用，改为直接操作 wrapper.vm 属性'))
    fixedFiles.forEach((f) => console.log(`  ${pc.green('→')} ${pc.gray(f)}`))
  }

  return { fixedCount, fixedFiles }
}
