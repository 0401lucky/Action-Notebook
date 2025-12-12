/// <reference types="vite/client" />

// 使该 d.ts 成为模块，以便正确扩展 vue-router 的类型而非覆盖
import 'vue-router'

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

// Vue Router 路由元信息类型扩展
declare module 'vue-router' {
  interface RouteMeta {
    /** 页面标题 */
    title?: string
    /** 是否需要认证才能访问 */
    requiresAuth?: boolean
    /** 是否仅限未认证用户访问（如登录页） */
    guestOnly?: boolean
  }
}
