# 生命周期钩子迁移指南

## 重命名速查

| Vue 2 Options API | Vue 3 Options API | Vue 3 Composition API |
|---|---|---|
| `beforeCreate` | `beforeCreate` | `setup()` 本身 |
| `created` | `created` | `setup()` 本身 |
| `beforeMount` | `beforeMount` | `onBeforeMount()` |
| `mounted` | `mounted` | `onMounted()` |
| `beforeUpdate` | `beforeUpdate` | `onBeforeUpdate()` |
| `updated` | `updated` | `onUpdated()` |
| `beforeDestroy` ⚠️ | **`beforeUnmount`** | `onBeforeUnmount()` |
| `destroyed` ⚠️ | **`unmounted`** | `onUnmounted()` |
| `errorCaptured` | `errorCaptured` | `onErrorCaptured()` |
| `activated` | `activated` | `onActivated()` |
| `deactivated` | `deactivated` | `onDeactivated()` |

## Options API 迁移示例

```js
// Vue 2
export default {
  beforeDestroy() {
    this.timer && clearInterval(this.timer)
    window.removeEventListener('resize', this.onResize)
  },
  destroyed() {
    console.log('component destroyed')
  }
}

// Vue 3 Options API（直接重命名）
export default {
  beforeUnmount() {
    this.timer && clearInterval(this.timer)
    window.removeEventListener('resize', this.onResize)
  },
  unmounted() {
    console.log('component unmounted')
  }
}
```

## Composition API 迁移示例

```js
// Vue 3 Composition API
import { onMounted, onBeforeUnmount, onUnmounted } from 'vue'

export default {
  setup() {
    let timer = null

    onMounted(() => {
      timer = setInterval(() => {}, 1000)
      window.addEventListener('resize', onResize)
    })

    onBeforeUnmount(() => {
      clearInterval(timer)
      window.removeEventListener('resize', onResize)
    })

    onUnmounted(() => {
      console.log('component unmounted')
    })
  }
}
```

## 常见陷阱

### 陷阱 1：在 destroyed 里清理的定时器
Vue 2 的 `destroyed` 不会在服务端渲染时执行，迁移到 `unmounted` 时行为一致。

### 陷阱 2：父子组件生命周期顺序
Vue 3 中顺序保持不变：
```
父 beforeCreate → 父 created → 父 beforeMount
→ 子 beforeCreate → 子 created → 子 beforeMount → 子 mounted
→ 父 mounted
```

### 陷阱 3：`<keep-alive>` 组件
`activated` 和 `deactivated` 名字不变，但在 Composition API 中需要显式引入：
```js
import { onActivated, onDeactivated } from 'vue'
```
