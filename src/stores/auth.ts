import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { AuthService } from '@/services/auth'
import type { Session, User } from '@supabase/supabase-js'

/**
 * Auth Store - 用户认证状态管理
 * 
 * 负责管理用户认证状态，包括：
 * - 用户信息和会话管理 (Requirements 3.1, 3.4)
 * - 发送和验证 OTP (Requirements 1.1, 2.1)
 * - 登出功能 (Requirements 4.1, 4.2)
 * - 加载状态和错误处理 (Requirements 6.1, 6.2)
 * 
 * @module stores/auth
 */

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref<User | null>(null)
  const session = ref<Session | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const isAuthenticated = computed(() => !!session.value && !!user.value)

  // Actions

  /**
   * 发送邮箱验证码（OTP）到邮箱
   * @param email - 用户邮箱
   * @returns 是否发送成功
   */
  async function sendEmailOtp(email: string): Promise<boolean> {
    isLoading.value = true
    error.value = null

    try {
      const result = await AuthService.sendEmailOtp(email)
      
      if (!result.success) {
        error.value = result.error?.message || '发送登录链接失败'
        return false
      }

      return true
    } catch (err) {
      error.value = '网络连接失败，请检查网络'
      return false
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 验证邮箱验证码（OTP）
   * @param email - 用户邮箱
   * @param code - 6 位验证码
   */
  async function verifyEmailOtp(email: string, code: string): Promise<boolean> {
    isLoading.value = true
    error.value = null

    try {
      const result = await AuthService.verifyEmailOtp(email, code)

      if (!result.success || !result.data) {
        error.value = result.error?.message || '验证码验证失败'
        return false
      }

      session.value = result.data.session
      user.value = result.data.user
      return true
    } catch (err) {
      error.value = '网络连接失败，请检查网络'
      return false
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 登出
   */
  async function signOut(): Promise<void> {
    isLoading.value = true
    error.value = null

    try {
      await AuthService.signOut()
    } catch (err) {
      // 即使登出失败，也清除本地状态
      console.error('Sign out error:', err)
    } finally {
      // 清除所有会话数据
      session.value = null
      user.value = null
      isLoading.value = false
      
      // 清理用户相关的 localStorage 缓存
      clearUserLocalStorage()
    }
  }

  /**
   * 清理用户相关的 localStorage 缓存
   * 防止切换用户后看到上一个用户的数据
   */
  function clearUserLocalStorage(): void {
    const keysToRemove: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && (key.startsWith('daily_') || key === 'archive_records')) {
        keysToRemove.push(key)
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key))
  }

  /**
   * 初始化认证状态
   * 在应用启动时调用，恢复会话状态并处理认证回调
   */
  async function initialize(): Promise<void> {
    isLoading.value = true
    error.value = null

    try {
      // 先设置监听器，确保能捕获认证回调
      AuthService.onAuthStateChange((newSession, newUser) => {
        session.value = newSession
        user.value = newUser
      })

      // 获取当前会话（会自动处理 URL 中的认证信息）
      const currentSession = await AuthService.getSession()
      
      if (currentSession) {
        session.value = currentSession
        user.value = currentSession.user
      }
    } catch (err) {
      error.value = '初始化认证状态失败'
      console.error('Auth initialization error:', err)
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 清除错误信息
   */
  function clearError(): void {
    error.value = null
  }

  /**
   * 重置 store（用于测试）
   */
  function $reset(): void {
    user.value = null
    session.value = null
    isLoading.value = false
    error.value = null
  }

  return {
    // State
    user,
    session,
    isLoading,
    error,
    // Getters
    isAuthenticated,
    // Actions
    sendEmailOtp,
    verifyEmailOtp,
    signOut,
    initialize,
    clearError,
    $reset
  }
})
