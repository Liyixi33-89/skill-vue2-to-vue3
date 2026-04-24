import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { transformEnvVars } from '../../scripts/codemod/env-vars.js'

describe('transformEnvVars — JS/TS 源码文件', () => {
  it('应将 process.env.VUE_APP_XXX 替换为 import.meta.env.VITE_XXX', () => {
    const code = `const apiUrl = process.env.VUE_APP_API_URL`
    const { code: result, changed } = transformEnvVars(code)
    assert.ok(changed)
    assert.ok(result.includes('import.meta.env.VITE_API_URL'))
    assert.ok(!result.includes('process.env.VUE_APP_API_URL'))
  })

  it('应处理多个不同的 VUE_APP_ 变量', () => {
    const code = `
      const api = process.env.VUE_APP_API_URL
      const title = process.env.VUE_APP_TITLE
      const key = process.env.VUE_APP_SECRET_KEY
    `
    const { code: result, changed, replacements } = transformEnvVars(code)
    assert.ok(changed)
    assert.ok(result.includes('import.meta.env.VITE_API_URL'))
    assert.ok(result.includes('import.meta.env.VITE_TITLE'))
    assert.ok(result.includes('import.meta.env.VITE_SECRET_KEY'))
    assert.equal(replacements.length, 3)
  })

  it('应将 process.env.NODE_ENV 替换为 import.meta.env.MODE', () => {
    const code = `if (process.env.NODE_ENV === 'development') { console.log('dev') }`
    const { code: result, changed } = transformEnvVars(code)
    assert.ok(changed)
    assert.ok(result.includes("import.meta.env.MODE === 'development'"))
    assert.ok(!result.includes('process.env.NODE_ENV'))
  })

  it('应将 process.env.BASE_URL 替换为 import.meta.env.BASE_URL', () => {
    const code = `const base = process.env.BASE_URL`
    const { code: result, changed } = transformEnvVars(code)
    assert.ok(changed)
    assert.ok(result.includes('import.meta.env.BASE_URL'))
    assert.ok(!result.includes('process.env.BASE_URL'))
  })

  it('应为未知的 process.env.XXX 添加 TODO 注释', () => {
    const code = `const val = process.env.SOME_OTHER_VAR`
    const { code: result, changed } = transformEnvVars(code)
    assert.ok(changed)
    assert.ok(result.includes('TODO(vue3-env)'))
    assert.ok(result.includes('import.meta.env.SOME_OTHER_VAR'))
  })

  it('不含 process.env 的代码不应被修改', () => {
    const code = `const x = import.meta.env.VITE_API_URL`
    const { changed } = transformEnvVars(code)
    assert.ok(!changed)
  })

  it('空字符串不应报错', () => {
    const { code, changed } = transformEnvVars('')
    assert.equal(code, '')
    assert.ok(!changed)
  })

  it('应同时处理多种 process.env 类型', () => {
    const code = `
      const api = process.env.VUE_APP_API_URL
      const env = process.env.NODE_ENV
      const base = process.env.BASE_URL
    `
    const { code: result, changed, replacements } = transformEnvVars(code)
    assert.ok(changed)
    assert.ok(result.includes('VITE_API_URL'))
    assert.ok(result.includes('import.meta.env.MODE'))
    assert.ok(result.includes('import.meta.env.BASE_URL'))
    assert.equal(replacements.length, 3)
  })
})

describe('transformEnvVars — .env 文件', () => {
  it('应将 .env 文件中的 VUE_APP_ 前缀替换为 VITE_', () => {
    const envContent = `VUE_APP_API_URL=https://api.example.com\nVUE_APP_TITLE=My App`
    const { code: result, changed } = transformEnvVars(envContent, true)
    assert.ok(changed)
    assert.ok(result.includes('VITE_API_URL=https://api.example.com'))
    assert.ok(result.includes('VITE_TITLE=My App'))
    assert.ok(!result.includes('VUE_APP_'))
  })

  it('非 VUE_APP_ 前缀的变量不应被修改', () => {
    const envContent = `NODE_ENV=development\nVUE_APP_API=https://api.example.com`
    const { code: result } = transformEnvVars(envContent, true)
    assert.ok(result.includes('NODE_ENV=development'))
    assert.ok(result.includes('VITE_API=https://api.example.com'))
  })

  it('空 .env 文件不应报错', () => {
    const { code, changed } = transformEnvVars('', true)
    assert.equal(code, '')
    assert.ok(!changed)
  })
})
