import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Debug: log the values
console.log('Supabase URL:', supabaseUrl ? 'loaded' : 'missing')
console.log('Supabase Key:', supabaseAnonKey ? 'loaded' : 'missing')

const isValidConfig = Boolean(supabaseUrl && supabaseAnonKey)

/**
 * 检查 localStorage 是否可用
 * 某些浏览器隐私模式下 localStorage 可能不可用
 */
function isLocalStorageAvailable(): boolean {
  try {
    const testKey = '__storage_test__'
    localStorage.setItem(testKey, testKey)
    localStorage.removeItem(testKey)
    return true
  } catch {
    console.warn('localStorage 不可用，将使用内存存储')
    return false
  }
}

/**
 * 内存存储实现（作为 localStorage 的后备）
 */
const memoryStorage: Storage = (() => {
  const store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value },
    removeItem: (key: string) => { delete store[key] },
    clear: () => { Object.keys(store).forEach(key => delete store[key]) },
    get length() { return Object.keys(store).length },
    key: (index: number) => Object.keys(store)[index] ?? null
  }
})()

// 选择可用的存储方式
const storage = isLocalStorageAvailable() ? localStorage : memoryStorage

let supabaseClient: SupabaseClient | null = null

if (isValidConfig) {
  try {
    supabaseClient = createClient(supabaseUrl as string, supabaseAnonKey as string, {
      auth: {
        // 启用会话持久化
        persistSession: true,
        // 使用可用的存储方式
        storage: storage,
        // 自动刷新令牌
        autoRefreshToken: true,
        // 检测 URL 中的会话信息（Magic Link 回调）
        detectSessionInUrl: true,
        // 存储键名
        storageKey: 'action-log-auth',
        // 使用 implicit 流程以支持跨设备 Magic Link 登录
        // 注意：PKCE 需要同一设备/浏览器保存的 code_verifier，跨设备会失败
        flowType: 'implicit'
      }
    })
  } catch (err) {
    console.error('Supabase 客户端初始化失败:', err)
  }
}

export const supabase = supabaseClient
export const isSupabaseConfigured = !!supabase
