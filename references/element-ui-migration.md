# Element UI → Element Plus 迁移指南

## 安装

```bash
npm uninstall element-ui
npm install element-plus
# 可选：自动导入插件
npm install -D unplugin-vue-components unplugin-auto-import
```

## 注册方式变化

```js
// Vue 2 + Element UI
import Vue from 'vue'
import ElementUI from 'element-ui'
import 'element-ui/lib/theme-chalk/index.css'
Vue.use(ElementUI)

// Vue 3 + Element Plus（全量引入）
import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
const app = createApp(App)
app.use(ElementPlus)

// Vue 3 + Element Plus（按需引入，推荐）
// vite.config.ts
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'

export default {
  plugins: [
    AutoImport({ resolvers: [ElementPlusResolver()] }),
    Components({ resolvers: [ElementPlusResolver()] })
  ]
}
```

---

## 组件名变化

所有组件名都改为 `El` 前缀开头的 PascalCase（无连字符）：

| Element UI | Element Plus |
|---|---|
| `el-button` | `el-button` ✅ 不变 |
| `el-input` | `el-input` ✅ 不变 |
| `el-table` | `el-table` ✅ 不变 |

> 模板中的 kebab-case 用法大部分不变，但 JS 中导入改变。

---

## 重要 API 变化

### 1. 消息弹窗类（最常用）

```js
// Vue 2 + Element UI（挂在 Vue.prototype）
this.$message.success('操作成功')
this.$message({ message: '提示', type: 'warning', duration: 3000 })
this.$confirm('确认删除?', '提示', { type: 'warning' })
  .then(() => { /* 确认 */ })
  .catch(() => { /* 取消 */ })
this.$notify({ title: '标题', message: '内容' })
this.$loading({ lock: true, text: '加载中' })
```

```js
// Vue 3 + Element Plus（独立导入函数）
import { ElMessage, ElMessageBox, ElNotification, ElLoading } from 'element-plus'

ElMessage.success('操作成功')
ElMessage({ message: '提示', type: 'warning', duration: 3000 })

ElMessageBox.confirm('确认删除?', '提示', { type: 'warning' })
  .then(() => { /* 确认 */ })
  .catch(() => { /* 取消 */ })

ElNotification({ title: '标题', message: '内容' })

const loading = ElLoading.service({ lock: true, text: '加载中' })
loading.close()
```

如果想保持 `this.$message` 写法：
```js
app.config.globalProperties.$message = ElMessage
app.config.globalProperties.$confirm = ElMessageBox.confirm
app.config.globalProperties.$notify = ElNotification
```

### 2. el-form 校验

```js
// Vue 2（通过 $refs）
this.$refs.formRef.validate((valid) => {
  if (valid) { /* 提交 */ }
})
this.$refs.formRef.resetFields()

// Vue 3（ref 写法相同，但 Composition API 中需要 ref）
const formRef = ref(null)
await formRef.value.validate()
formRef.value.resetFields()
```

### 3. el-table 的 row-key

```html
<!-- Vue 3 中 row-key 更严格，必须是唯一值 -->
<el-table :data="tableData" row-key="id">
```

### 4. el-dialog 的 v-model

```html
<!-- Vue 2 + Element UI -->
<el-dialog :visible.sync="dialogVisible">

<!-- Vue 3 + Element Plus：用 v-model -->
<el-dialog v-model="dialogVisible">
```

### 5. el-dropdown 触发事件

```html
<!-- Vue 2：@command -->
<el-dropdown @command="handleCommand">

<!-- Vue 3：相同，但注意 el-dropdown-item 的 command 属性 -->
<el-dropdown @command="handleCommand">
  <el-dropdown-menu>
    <el-dropdown-item command="edit">编辑</el-dropdown-item>
  </el-dropdown-menu>
</el-dropdown>
```

---

## 样式变化

```css
/* Element UI CSS 变量前缀 */
--color-primary  →  --el-color-primary

/* 图标改为独立包 */
```

```bash
# Element Plus 图标独立成包
npm install @element-plus/icons-vue
```

```js
// 全局注册图标
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}
```

```html
<!-- Vue 2 -->
<i class="el-icon-edit"></i>
<el-button icon="el-icon-search">搜索</el-button>

<!-- Vue 3 -->
<el-icon><Edit /></el-icon>
<el-button :icon="Search">搜索</el-button>
```

---

## 批量迁移策略

1. 全局替换 `:visible.sync` → `v-model`
2. 全局替换 `this.$message` → `ElMessage`（或注入到 globalProperties）
3. 全局替换 `this.$confirm` → `ElMessageBox.confirm`
4. 全局替换 `el-icon-xxx` class → `<el-icon>` 组件
5. 运行 `npm run build` 检查剩余报错，逐一处理
