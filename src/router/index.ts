import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

// 认证初始化状态标记
let authInitialized = false
let authInitPromise: Promise<void> | null = null

/**
 * 初始化认证状态（确保只执行一次）
 */
export async function initializeAuth(): Promise<void> {
  if (authInitialized) return
  
  if (!authInitPromise) {
    const authStore = useAuthStore()
    authInitPromise = authStore.initialize().then(() => {
      authInitialized = true
    })
  }
  
  return authInitPromise
}

/**
 * 路由配置
 * 
 * meta.requiresAuth: 是否需要认证才能访问
 * meta.guestOnly: 是否仅限未认证用户访问（如登录页）
 */
const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/dashboard'
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/LoginView.vue'),
    meta: { title: '登录', guestOnly: true }
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: () => import('@/views/DashboardView.vue'),
    meta: { title: '仪表盘', requiresAuth: true }
  },
  {
    path: '/home',
    name: 'home',
    component: () => import('@/views/HomeView.vue'),
    meta: { title: '今日', requiresAuth: true }
  },
  {
    path: '/archive',
    name: 'archive',
    component: () => import('@/views/ArchiveView.vue'),
    meta: { title: '归档', requiresAuth: true }
  },
  {
    path: '/detail/:id',
    name: 'detail',
    component: () => import('@/views/DetailView.vue'),
    meta: { title: '详情', requiresAuth: true }
  },
  {
    path: '/stats',
    name: 'stats',
    component: () => import('@/views/StatsView.vue'),
    meta: { title: '统计', requiresAuth: true }
  },
  {
    path: '/profile',
    name: 'profile',
    component: () => import('@/views/ProfileView.vue'),
    meta: { title: '个人中心', requiresAuth: true }
  },
  {
    path: '/pomodoro',
    name: 'pomodoro',
    component: () => import('@/views/PomodoroView.vue'),
    meta: { title: '番茄钟', requiresAuth: true }
  },
  {
    path: '/journals',
    name: 'journals',
    component: () => import('@/views/JournalBookshelfView.vue'),
    meta: { title: '日记本', requiresAuth: true }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    redirect: '/dashboard'
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

/**
 * 导航守卫 - 认证检查
 * 
 * 实现需求:
 * - 5.3: 未认证用户重定向到登录页
 * - 4.3: 登出后重定向到登录页
 * - 已认证用户从登录页重定向到首页
 * 
 * 关键：在检查认证状态前，先等待认证初始化完成
 */
router.beforeEach(async (to, _from, next) => {
  // 更新页面标题
  const title = to.meta.title as string | undefined
  document.title = title ? `${title} - 行动手账` : '行动手账'
  
  // 检查是否需要认证
  const requiresAuth = to.meta.requiresAuth as boolean | undefined
  const guestOnly = to.meta.guestOnly as boolean | undefined
  
  // 如果路由需要认证检查，先等待认证初始化完成
  if (requiresAuth || guestOnly) {
    await initializeAuth()
  }
  
  const authStore = useAuthStore()
  
  // 未认证用户访问受保护路由 -> 重定向到登录页
  if (requiresAuth && !authStore.isAuthenticated) {
    next({ name: 'login', query: { redirect: to.fullPath } })
    return
  }
  
  // 已认证用户访问仅限游客页面（如登录页）-> 重定向到仪表盘
  if (guestOnly && authStore.isAuthenticated) {
    next({ name: 'dashboard' })
    return
  }
  
  next()
})

export default router
