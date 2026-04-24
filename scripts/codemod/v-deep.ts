/**
 * Codemod: CSS 深度选择器迁移
 * ::v-deep .child  → :deep(.child)
 * /deep/ .child    → :deep(.child)
 * >>> .child       → :deep(.child)
 *
 * 仅处理 .vue 文件的 <style> 块
 */
import { readFileSync, writeFileSync, copyFileSync } from 'fs'
import { resolve, relative } from 'path'
import fg from 'fast-glob'
import pc from 'picocolors'
import type { CodemodOptions, CodemodResult } from '../types.js'

interface VDeepTransformResult {
  code: string
  changed: boolean
  count: number
}

const transformVDeep = (code: string): VDeepTransformResult => {
  let result = code
  let changed = false
  let count = 0

  // 策略：只处理 <style> 块内的内容，避免误改 JS/模板部分
  result = result.replace(
    /(<style[^>]*>)([\s\S]*?)(<\/style>)/g,
    (_match, openTag: string, styleContent: string, closeTag: string) => {
      let transformed = styleContent

      // 1. ::v-deep .selector → :deep(.selector)
      //    匹配 ::v-deep 后跟空格和选择器
      transformed = transformed.replace(
        /::v-deep\s+([^\s{,;]+)/g,
        (_m, selector: string) => {
          count++
          changed = true
          return `:deep(${selector.trim()})`
        },
      )

      // 2. ::v-deep { ... } 无参数块 → 添加 TODO（无法自动转换）
      transformed = transformed.replace(/::v-deep\s*\{/g, () => {
        count++
        changed = true
        return `/* TODO(vue3-deep): ::v-deep {} 块需手动拆分为多个 :deep(.selector) 规则 */ :deep(`
      })

      // 3. /deep/ .selector → :deep(.selector)
      transformed = transformed.replace(
        /\/deep\/\s+([^\s{,;]+)/g,
        (_m, selector: string) => {
          count++
          changed = true
          return `:deep(${selector.trim()})`
        },
      )

      // 4. >>> .selector → :deep(.selector)
      //    注意：>>> 只在纯 CSS 中有效，Sass/Less 不支持
      transformed = transformed.replace(
        />>>\s+([^\s{,;]+)/g,
        (_m, selector: string) => {
          count++
          changed = true
          return `:deep(${selector.trim()})`
        },
      )

      return `${openTag}${transformed}${closeTag}`
    },
  )

  return { code: result, changed, count }
}

export const fixVDeep = async (
  targetDir: string,
  options: CodemodOptions = {},
): Promise<CodemodResult> => {
  const absDir = resolve(process.cwd(), targetDir)
  const dryRun = options.dryRun ?? false

  // 只处理 .vue 文件（CSS 深度选择器只在 SFC 的 <style scoped> 中使用）
  const files = await fg(['**/*.vue'], {
    cwd: absDir,
    absolute: true,
    ignore: ['**/node_modules/**', '**/dist/**', '**/*.bak'],
  })

  let fixedCount = 0
  const fixedFiles: string[] = []
  let totalReplacements = 0

  for (const file of files) {
    const original = readFileSync(file, 'utf-8')
    const { code, changed, count } = transformVDeep(original)

    if (changed) {
      fixedFiles.push(file)
      fixedCount++
      totalReplacements += count

      if (!dryRun) {
        copyFileSync(file, `${file}.vue3.bak`)
        writeFileSync(file, code, 'utf-8')
      }

      const relPath = relative(process.cwd(), file)
      if (dryRun) {
        console.log(pc.yellow(`  [dry-run] ${relPath} (${count} 处)`))
      } else {
        console.log(`  ${pc.green('→')} ${pc.gray(relPath)} ${pc.cyan(`(${count} 处)`)}`)
      }
    }
  }

  if (dryRun) {
    console.log(
      pc.yellow(`\n[dry-run] CSS 深度选择器迁移将影响 ${fixedCount} 个文件，共 ${totalReplacements} 处`),
    )
  } else {
    console.log(pc.green(`\n✅ CSS 深度选择器迁移完成: ${fixedCount} 个文件，共 ${totalReplacements} 处`))
    console.log(pc.yellow('  ⚠️  检查 TODO(vue3-deep) 注释，手动拆分无参数的 ::v-deep {} 块'))
  }

  return { fixedCount, fixedFiles }
}

// 导出内部函数供测试使用
export { transformVDeep }
