/**
 * 公共类型定义
 */

/** codemod 函数的通用选项 */
export interface CodemodOptions {
  /** 仅预览，不写入文件 */
  dryRun?: boolean
}

/** codemod 函数的通用返回结果 */
export interface CodemodResult {
  /** 修改的文件数量 */
  fixedCount: number
  /** 修改的文件路径列表 */
  fixedFiles: string[]
}

/** filters codemod 额外返回收集到的 filter 名称 */
export interface FiltersCodemodResult extends CodemodResult {
  collectedFilters: string[]
}

/** 单条扫描发现 */
export interface Finding {
  ruleId: string
  category: string
  severity: 'error' | 'warning'
  label: string
  line: number
  fix: string | null
  doc: string
}

/** 扫描报告 */
export interface ScanReport {
  scannedAt: string
  targetDir: string
  totalFiles: number
  affectedFiles: number
  summary: Record<string, number>
  complexity: 'LOW' | 'MEDIUM' | 'HIGH'
  findings: Record<string, Finding[]>
  fixes: Record<string, string>
  actionRequired: string[]
}

/** 单条检查规则 */
export interface ScanRule {
  id: string
  category: string
  severity: 'error' | 'warning'
  label: string
  pattern: RegExp
  fix: string | null
  doc: string
}

/** check 函数发现的问题 */
export interface CheckIssue {
  file: string
  label: string
  count: number
}
