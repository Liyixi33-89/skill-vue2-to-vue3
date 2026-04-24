# 生态包版本对照表：Vue 2 → Vue 3

> 本表覆盖 Vue 2 项目迁移到 Vue 3 时所有常用依赖包的版本变化、包名变化和迁移说明。

---

## 一、核心框架

| 包名（Vue 2） | 版本 | 包名（Vue 3） | 版本 | 迁移说明 |
|---|---|---|---|---|
| `vue` | `^2.7.x` | `vue` | `^3.4.x` | 同包名，大版本升级 |
| `vue-template-compiler` | `^2.7.x` | `@vue/compiler-sfc` | `^3.4.x` | 随 `vue` 自动安装，无需单独安装 |
| `@vue/composition-api` | `^1.x` | 内置 | — | Vue 3 内置 Composition API，可移除 |

---

## 二、构建工具

| 包名（Vue 2） | 版本 | 包名（Vue 3） | 版本 | 迁移说明 |
|---|---|---|---|---|
| `@vue/cli-service` | `^5.x` | `vite` | `^5.x` | 详见 [build-tool-migration.md](./build-tool-migration.md) |
| `@vue/cli-plugin-babel` | `^5.x` | 移除 | — | Vite 内置 esbuild，无需 Babel |
| `@vue/cli-plugin-typescript` | `^5.x` | `vue-tsc` | `^2.x` | 类型检查工具 |
| `@vue/cli-plugin-eslint` | `^5.x` | 移除 | — | 直接使用 `eslint` |
| `@vue/cli-plugin-unit-jest` | `^5.x` | `vitest` | `^1.x` | 详见 [test-migration.md](./test-migration.md) |
| `webpack` | `^5.x` | `rollup` | 内置 | Vite 底层使用 Rollup，无需手动安装 |
| `babel-loader` | `^8.x` | 移除 | — | Vite 内置 esbuild 转译 |
| `vue-loader` | `^15.x` | `@vitejs/plugin-vue` | `^5.x` | Vite 的 Vue SFC 支持 |
| `vue-jest` / `@vue/vue2-jest` | `^27.x` | `@vue/vue3-jest` | `^29.x` | 仅在继续使用 Jest 时需要 |

---

## 三、路由

| 包名（Vue 2） | 版本 | 包名（Vue 3） | 版本 | 迁移说明 |
|---|---|---|---|---|
| `vue-router` | `^3.x` | `vue-router` | `^4.x` | 同包名，大版本升级；详见 [router-migration.md](./router-migration.md) |

**关键 API 变化速查：**

```js
// Vue Router 3
import VueRouter from 'vue-router'
new VueRouter({ mode: 'history', routes })

// Vue Router 4
import { createRouter, createWebHistory } from 'vue-router'
createRouter({ history: createWebHistory(), routes })
```

---

## 四、状态管理

| 包名（Vue 2） | 版本 | 包名（Vue 3） | 版本 | 迁移说明 |
|---|---|---|---|---|
| `vuex` | `^3.x` | `vuex` | `^4.x` | 同包名可升级，但 TS 支持差 |
| `vuex` | `^3.x` | `pinia` | `^2.x` | **推荐迁移**，TS 友好，详见 [vuex-to-pinia.md](./vuex-to-pinia.md) |
| `vuex-persistedstate` | `^4.x` | `pinia-plugin-persistedstate` | `^3.x` | 配合 Pinia 使用 |
| `vuex-module-decorators` | `^2.x` | 移除 | — | 迁移到 Pinia store |

---

## 五、UI 组件库

| 包名（Vue 2） | 版本 | 包名（Vue 3） | 版本 | 迁移说明 |
|---|---|---|---|---|
| `element-ui` | `^2.x` | `element-plus` | `^2.x` | 详见 [element-ui-migration.md](./element-ui-migration.md) |
| `ant-design-vue` | `^1.x` | `ant-design-vue` | `^4.x` | 同包名，大版本升级 |
| `vant` | `^2.x` | `vant` | `^4.x` | 移动端，同包名升级 |
| `vuetify` | `^2.x` | `vuetify` | `^3.x` | 同包名，大版本升级 |
| `naive-ui` | — | `naive-ui` | `^2.x` | Vue 3 原生，无 Vue 2 版本 |
| `arco-design-vue` | — | `@arco-design/web-vue` | `^2.x` | Vue 3 原生 |
| `tdesign-vue` | `^0.x` | `tdesign-vue-next` | `^1.x` | 包名变化 |
| `iview` / `view-ui-plus` | `^4.x` | `view-ui-plus` | `^1.x` | 支持 Vue 3 |

---

## 六、HTTP 请求

| 包名（Vue 2） | 版本 | 包名（Vue 3） | 版本 | 迁移说明 |
|---|---|---|---|---|
| `axios` | `^0.x` | `axios` | `^1.x` | 同包名，注意 v1.x 有破坏性变更 |
| `vue-axios` | `^3.x` | 移除 | — | Vue 3 推荐直接使用 axios 或 `provide/inject` |

**Vue 3 推荐的 axios 集成方式：**

```ts
// main.ts
import axios from 'axios'
const app = createApp(App)
app.config.globalProperties.$http = axios

// 或使用 provide（更推荐）
app.provide('axios', axios)

// 组件中
const axios = inject('axios')
```

---

## 七、国际化（i18n）

| 包名（Vue 2） | 版本 | 包名（Vue 3） | 版本 | 迁移说明 |
|---|---|---|---|---|
| `vue-i18n` | `^8.x` | `vue-i18n` | `^9.x` | 同包名，API 完全重写 |

**关键 API 变化：**

```js
// vue-i18n v8（Vue 2）
import VueI18n from 'vue-i18n'
Vue.use(VueI18n)
const i18n = new VueI18n({ locale: 'zh', messages })
new Vue({ i18n }).$mount('#app')

// vue-i18n v9（Vue 3）
import { createI18n } from 'vue-i18n'
const i18n = createI18n({ locale: 'zh', messages, legacy: false })
createApp(App).use(i18n).mount('#app')
```

---

## 八、表单验证

| 包名（Vue 2） | 版本 | 包名（Vue 3） | 版本 | 迁移说明 |
|---|---|---|---|---|
| `vuelidate` | `^0.x` | `@vuelidate/vuelidate` | `^2.x` | 包名变化，API 有调整 |
| `vee-validate` | `^3.x` | `vee-validate` | `^4.x` | 同包名，API 完全重写 |

**vee-validate v4 写法：**

```vue
<!-- v3（Vue 2） -->
<ValidationObserver v-slot="{ handleSubmit }">
  <ValidationProvider name="email" rules="required|email" v-slot="{ errors }">
    <input v-model="email" />
    <span>{{ errors[0] }}</span>
  </ValidationProvider>
</ValidationObserver>

<!-- v4（Vue 3） -->
<Form @submit="onSubmit">
  <Field name="email" rules="required|email" v-slot="{ field, errors }">
    <input v-bind="field" />
    <span>{{ errors[0] }}</span>
  </Field>
</Form>
```

---

## 九、工具库

| 包名（Vue 2） | 版本 | 包名（Vue 3） | 版本 | 迁移说明 |
|---|---|---|---|---|
| `vue-property-decorator` | `^9.x` | 移除 | — | 迁移到 `<script setup>` |
| `vue-class-component` | `^7.x` | 移除 | — | 迁移到 `<script setup>` |
| `@vue/composition-api` | `^1.x` | 移除 | — | Vue 3 内置 |
| `mitt` | `^3.x` | `mitt` | `^3.x` | 替代 `$on/$off` 事件总线，无变化 |
| `@vueuse/core` | — | `@vueuse/core` | `^10.x` | Vue 3 原生，强烈推荐 |
| `vue-demi` | `^0.x` | `vue-demi` | `^0.x` | 跨版本库开发，按需使用 |

---

## 十、测试

| 包名（Vue 2） | 版本 | 包名（Vue 3） | 版本 | 迁移说明 |
|---|---|---|---|---|
| `@vue/test-utils` | `^1.x` | `@vue/test-utils` | `^2.x` | 详见 [test-utils-migration.md](./test-utils-migration.md) |
| `jest` | `^27.x` | `vitest` | `^1.x` | 推荐迁移，详见 [test-migration.md](./test-migration.md) |
| `@types/jest` | `^27.x` | `@vitest/globals` | `^1.x` | 类型声明 |
| `babel-jest` | `^27.x` | 移除 | — | Vitest 内置 esbuild |
| `ts-jest` | `^27.x` | 移除 | — | Vitest 内置 TS 支持 |
| `flush-promises` | `^1.x` | 内置 | — | `@vue/test-utils` v2 直接导出 `flushPromises` |

---

## 十一、ESLint / 代码规范

| 包名（Vue 2） | 版本 | 包名（Vue 3） | 版本 | 迁移说明 |
|---|---|---|---|---|
| `eslint-plugin-vue` | `^7.x` | `eslint-plugin-vue` | `^9.x` | 规则集加 `vue3-` 前缀，详见 [eslint-migration.md](./eslint-migration.md) |
| `babel-eslint` | `^10.x` | `@typescript-eslint/parser` | `^7.x` | `babel-eslint` 已废弃 |
| `@vue/eslint-config-standard` | `^6.x` | `@vue/eslint-config-typescript` | `^13.x` | 配置包更新 |
| `prettier` | `^2.x` | `prettier` | `^3.x` | 注意 v3 有少量破坏性变更 |
| `@vue/eslint-config-prettier` | `^7.x` | `@vue/eslint-config-prettier` | `^9.x` | 同包名升级 |

---

## 十二、TypeScript

| 包名（Vue 2） | 版本 | 包名（Vue 3） | 版本 | 迁移说明 |
|---|---|---|---|---|
| `typescript` | `^4.x` | `typescript` | `^5.x` | 同包名升级 |
| `@types/node` | `^16.x` | `@types/node` | `^20.x` | 同包名升级 |
| `vue-tsc` | — | `vue-tsc` | `^2.x` | Vue 3 专用 TS 检查工具 |

---

## 十三、其他常用插件

| 包名（Vue 2） | 版本 | 包名（Vue 3） | 版本 | 迁移说明 |
|---|---|---|---|---|
| `vue-meta` | `^2.x` | `@vueuse/head` | `^2.x` | SEO meta 管理，API 变化 |
| `vue-lazyload` | `^1.x` | `vue3-lazyload` | `^0.x` | 图片懒加载 |
| `vue-clipboard2` | `^0.x` | `vue-clipboard3` | `^0.x` | 剪贴板 |
| `vue-draggable` | `^2.x` | `vuedraggable` | `^4.x` | 拖拽，同包名升级 |
| `vue-virtual-scroller` | `^1.x` | `vue-virtual-scroller` | `^2.x` | 虚拟滚动 |
| `vue-echarts` | `^6.x` | `vue-echarts` | `^6.x` | ECharts 封装，支持 Vue 3 |
| `vue-pdf` | `^4.x` | `vue-pdf-embed` | `^2.x` | PDF 预览 |
| `vue-qrcode-reader` | `^3.x` | `vue-qrcode-reader` | `^5.x` | 二维码扫描 |

---

## 十四、一键升级参考命令

```bash
# 核心框架
npm install vue@^3.4 vue-router@^4 pinia@^2

# 构建工具
npm install -D vite@^5 @vitejs/plugin-vue@^5 vue-tsc@^2
npm uninstall @vue/cli-service @vue/cli-plugin-babel @vue/cli-plugin-typescript

# UI 组件库（以 Element 为例）
npm install element-plus@^2
npm uninstall element-ui

# 测试
npm install -D vitest@^1 @vue/test-utils@^2 @vitest/coverage-v8
npm uninstall jest @types/jest babel-jest vue-jest

# ESLint
npm install -D eslint-plugin-vue@^9 @typescript-eslint/parser@^7
npm uninstall babel-eslint

# TypeScript
npm install -D typescript@^5 vue-tsc@^2
npm uninstall vue-class-component vue-property-decorator @vue/composition-api
```
