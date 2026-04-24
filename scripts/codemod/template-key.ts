/**
 * Codemod: <template v-for> key 位置从子元素移到 template 上
 *
 * Vue 2:  <template v-for="item in list"><li :key="item.id">
 * Vue 3:  <template v-for="item in list" :key="item.id"><li>
 */
import { readFileSync, writeFileSync, copyFileSync } from 'fs'
import { resolve } from 'path'
import fg from 'fast-glob'
import pc from 'picocolors'
import type { CodemodOptions, CodemodResult } from '../types.js'

interface TransformTemplateKeyResult {
  code: string
  changed: boolean
}

/**
 * 处理 <template v-for="..."> ... <child :key="..."> 模式
 * 使用简单的字符串匹配，不用完整 HTML parser
 */
const transformTemplateKey = (code: string): TransformTemplateKeyResult => {
  let result = code
  let changed = false

  // 匹配 <template v-for="expr"> 后紧跟有 :key 的直接子元素
  // 这是一个启发式替换，会标注 TODO 让人工确认
  const pattern =
    /(<template\s[^>]*v-for="([^"]+)"[^>]*>)\s*\n(\s*)(<\w+)([^>]*):key="([^"]+)"([^>]*>)/gm

  result = result.replace(
    pattern,
    (
      match,
      templateTag: string,
      _forExpr: string,
      indent: string,
      childTag: string,
      beforeKey: string,
      keyExpr: string,
      afterKey: string,
    ) => {
      // 检查 template 标签上是否已经有 :key
      if (templateTag.includes(':key=') || templateTag.includes('v-bind:key=')) {
        return match // 已有 key，跳过
      }

      changed = true

      // 把 :key 移到 template 上，从子元素移除
      const newTemplateTag = templateTag.replace('>', ` :key="${keyExpr}">`)
      const childWithoutKey = `${childTag}${beforeKey}${afterKey}`

      return `${newTemplateTag}\n${indent}${childWithoutKey}`
    },
  )

  // 如果有变化，添加说明注释
  if (changed) {
    result =
      `<!-- vue2to3: <template v-for> key 已从子元素移至 template 标签，请确认位置正确 -->\n` +
      result
  }

  return { code: result, changed }
}

export const fixTemplateKey = async (
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
    const { code, changed } = transformTemplateKey(original)

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
    console.log(pc.yellow(`[dry-run] template-key 修复将影响 ${fixedCount} 个文件`))
  } else {
    console.log(pc.green(`✅ template-key 修复完成: ${fixedCount} 个文件`))
    console.log(pc.yellow('  ⚠️  请手动核查 key 位置是否正确'))
    fixedFiles.forEach((f) => console.log(`  ${pc.green('→')} ${pc.gray(f)}`))
  }

  return { fixedCount, fixedFiles }
}

// 导出内部函数供测试使用
export { transformTemplateKey }
