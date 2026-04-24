/**
 * AST 工具函数 — 基于 @babel/parser
 */
import { parse, type ParseResult } from '@babel/parser'
import _traverse from '@babel/traverse'
import _generate from '@babel/generator'
import * as t from '@babel/types'
import type { File } from '@babel/types'

// ESM 兼容 CJS default export
const traverse = (_traverse as unknown as { default: typeof _traverse }).default ?? _traverse
const generate = (_generate as unknown as { default: typeof _generate }).default ?? _generate

export { t, traverse, generate }

export type BabelAST = ParseResult<File>

/**
 * 解析 JS/TS 代码为 AST
 */
export const parseCode = (code: string, isTS = false): BabelAST => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const plugins: any[] = [
    isTS ? 'typescript' : 'flow',
    'jsx',
    'decorators-legacy',
    'classProperties',
    'dynamicImport',
    'optionalChaining',
    'nullishCoalescingOperator',
  ]
  return parse(code, {
    sourceType: 'module',
    plugins,
    errorRecovery: true,
  })
}

/**
 * 从 AST 生成代码
 */
export const generateCode = (ast: BabelAST, originalCode: string): string => {
  const result = generate(
    ast,
    {
      retainLines: false,
      concise: false,
      comments: true,
    },
    originalCode,
  )
  return result.code
}

/**
 * 简单字符串替换（用于模板部分，不用 AST）
 */
export const replaceAll = (str: string, search: string, replacement: string): string => {
  return str.split(search).join(replacement)
}
