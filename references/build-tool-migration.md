# 构建工具迁移：Vue CLI (Webpack) → Vite

> Vue 3 生态的标准构建工具已从 Vue CLI (Webpack) 切换为 Vite。Vite 利用浏览器原生 ESM，开发启动速度提升 10-100 倍。

## 安装

```bash
# 卸载 Vue CLI（可选）
npm uninstall -g @vue/cli

# 安装 Vite 及 Vue 插件
npm install -D vite @vitejs/plugin-vue

# 如果使用 JSX
npm install -D @vitejs/plugin-vue-jsx
```

---

## 一、配置文件迁移

### `vue.config.js` → `vite.config.ts`

```js
// ── Vue CLI: vue.config.js ──────────────────────────────────────────
const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  publicPath: '/my-app/',
  outputDir: 'dist',
  devServer: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
  chainWebpack: (config) => {
    config.resolve.alias.set('@', path.resolve(__dirname, 'src'))
  },
})
```

```ts
// ── Vite: vite.config.ts ────────────────────────────────────────────
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  base: '/my-app/',           // 对应 publicPath
  build: {
    outDir: 'dist',           // 对应 outputDir
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
})
```

### 配置项对照表

| Vue CLI (`vue.config.js`) | Vite (`vite.config.ts`) |
|---|---|
| `publicPath` | `base` |
| `outputDir` | `build.outDir` |
| `assetsDir` | `build.assetsDir` |
| `devServer.port` | `server.port` |
| `devServer.proxy` | `server.proxy` |
| `devServer.https` | `server.https` |
| `chainWebpack` / `configureWebpack` | `plugins` / `build.rollupOptions` |
| `css.loaderOptions.sass` | `css.preprocessorOptions.scss` |
| `transpileDependencies` | 不需要（Vite 默认处理） |
| `lintOnSave` | 使用 `vite-plugin-eslint` |

---

## 二、入口文件迁移

### `public/index.html` 变化

Vite 的 `index.html` 在项目根目录（不在 `public/`），且直接引用入口脚本：

```html
<!-- Vue CLI: public/index.html -->
<!DOCTYPE html>
<html>
  <head>
    <title><%= htmlWebpackPlugin.options.title %></title>
    <link rel="icon" href="<%= BASE_URL %>favicon.ico" />
  </head>
  <body>
    <div id="app"></div>
    <!-- 由 webpack 自动注入 bundle -->
  </body>
</html>
```

```html
<!-- Vite: index.html（根目录） -->
<!DOCTYPE html>
<html>
  <head>
    <title>My App</title>
    <link rel="icon" href="/favicon.ico" />
  </head>
  <body>
    <div id="app"></div>
    <!-- Vite 需要显式引用入口文件 -->
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

---

## 三、环境变量迁移（重要！）

### 前缀变化

```bash
# Vue CLI (.env)
VUE_APP_API_URL=https://api.example.com
VUE_APP_TITLE=My App

# Vite (.env)
VITE_API_URL=https://api.example.com
VITE_TITLE=My App
```

### 访问方式变化

```js
// Vue CLI (Webpack)
const apiUrl = process.env.VUE_APP_API_URL
const isDev  = process.env.NODE_ENV === 'development'

// Vite
const apiUrl = import.meta.env.VITE_API_URL
const isDev  = import.meta.env.DEV          // 布尔值
const isProd = import.meta.env.PROD         // 布尔值
const mode   = import.meta.env.MODE         // 'development' | 'production'
const base   = import.meta.env.BASE_URL     // 对应 vite.config.ts 的 base
```

### `.env` 文件规则（与 Vue CLI 相同）

```
.env                # 所有环境
.env.local          # 所有环境，本地覆盖（不提交 git）
.env.development    # 仅开发环境
.env.production     # 仅生产环境
```

> ⚠️ **自动修复**：运行 `npx vue2to3 fix env-vars ./src` 可自动替换所有 `process.env.VUE_APP_*` → `import.meta.env.VITE_*`

---

## 四、`require()` → `import` 迁移

Vite 是 ESM-first，**不支持** CommonJS `require()`。

### 静态资源

```js
// Vue CLI (Webpack)
const logo = require('@/assets/logo.png')
const data = require('./data.json')

// Vite
import logo from '@/assets/logo.png'
import data from './data.json'
```

### 动态导入

```js
// Vue CLI
const module = require(`./locales/${lang}`)

// Vite
const module = await import(`./locales/${lang}.json`)
```

### 图片在模板中

```html
<!-- Vue CLI：可以用 require -->
<img :src="require('@/assets/logo.png')" />

<!-- Vite：使用 import 或直接路径 -->
<script setup>
import logo from '@/assets/logo.png'
</script>
<template>
  <img :src="logo" />
</template>
```

### `require.context` → `import.meta.glob`

```js
// Vue CLI (Webpack)：批量导入
const modules = require.context('./modules', false, /\.js$/)
modules.keys().forEach(key => {
  store.registerModule(key.replace('./', '').replace('.js', ''), modules(key).default)
})

// Vite：使用 import.meta.glob
const modules = import.meta.glob('./modules/*.js', { eager: true })
Object.entries(modules).forEach(([path, module]) => {
  const name = path.replace('./modules/', '').replace('.js', '')
  store.registerModule(name, module.default)
})
```

---

## 五、CSS 预处理器配置

```js
// Vue CLI: vue.config.js
module.exports = {
  css: {
    loaderOptions: {
      sass: {
        additionalData: `@import "@/styles/variables.scss";`
      },
      less: {
        lessOptions: {
          modifyVars: { 'primary-color': '#1890ff' }
        }
      }
    }
  }
}
```

```ts
// Vite: vite.config.ts
export default defineConfig({
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@import "@/styles/variables.scss";`
      },
      less: {
        modifyVars: { 'primary-color': '#1890ff' }
      }
    }
  }
})
```

---

## 六、常用 Webpack Loader 对应关系

| Webpack Loader | Vite 处理方式 |
|---|---|
| `vue-loader` | `@vitejs/plugin-vue`（内置） |
| `babel-loader` | esbuild（内置，无需配置） |
| `ts-loader` | esbuild（内置） |
| `css-loader` + `style-loader` | 内置支持 |
| `sass-loader` | 安装 `sass` 即可，无需 loader |
| `less-loader` | 安装 `less` 即可，无需 loader |
| `url-loader` / `file-loader` | 内置资源处理（`assetsInclude`） |
| `raw-loader` | `?raw` 后缀：`import txt from './file.txt?raw'` |
| `worker-loader` | `?worker` 后缀：`import Worker from './worker.js?worker'` |
| `svg-inline-loader` | `?component` 后缀或 `vite-plugin-svg-icons` |

---

## 七、`package.json` scripts 更新

```json
// Vue CLI
{
  "scripts": {
    "serve": "vue-cli-service serve",
    "build": "vue-cli-service build",
    "lint":  "vue-cli-service lint"
  }
}

// Vite
{
  "scripts": {
    "dev":     "vite",
    "build":   "vue-tsc && vite build",
    "preview": "vite preview",
    "lint":    "eslint src --ext .vue,.js,.ts"
  }
}
```

---

## 八、完整迁移步骤

```bash
# 1. 安装 Vite 相关依赖
npm install -D vite @vitejs/plugin-vue vue-tsc

# 2. 删除 Vue CLI 依赖
npm uninstall @vue/cli-service @vue/cli-plugin-babel @vue/cli-plugin-eslint

# 3. 创建 vite.config.ts（参考上方示例）

# 4. 将 public/index.html 移到根目录，添加 <script type="module"> 入口

# 5. 重命名环境变量（VUE_APP_ → VITE_）
npx vue2to3 fix env-vars ./src

# 6. 替换所有 require() 为 import
# （需人工处理，或使用 codemod 工具）

# 7. 更新 package.json scripts

# 8. 验证构建
npm run dev
npm run build
```

---

## 九、常见报错与解决

| 报错 | 原因 | 解决 |
|---|---|---|
| `require is not defined` | Vite 不支持 CJS | 改为 `import` |
| `process is not defined` | Vite 中无 `process` 全局 | 改为 `import.meta.env` 或在 `vite.config.ts` 中 `define: { 'process.env': {} }` |
| `__dirname is not defined` | ESM 中无 `__dirname` | 改为 `import.meta.dirname`（Node 21+）或 `fileURLToPath(new URL('.', import.meta.url))` |
| `Cannot find module 'xxx'` | 路径别名未配置 | 在 `vite.config.ts` 的 `resolve.alias` 中配置 |
| `Failed to resolve import` | 文件扩展名缺失 | Vite 严格要求扩展名，补全 `.vue` / `.ts` |
