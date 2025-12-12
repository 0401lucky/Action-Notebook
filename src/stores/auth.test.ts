import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import * as fc from 'fast-check'
import { useAuthStore } from './auth'
import type { Session, User } from '@supabase/supabase-js'

// Mock AuthService
vi.mock('@/services/auth', () => ({
  AuthService: {
    sendEmailOtp: vi.fn(),
    verifyEmailOtp: vi.fn(),
    getSession: vi.fn(),
    signOut: vi.fn(),
    onAuthStateChange: vi.fn(() => () => {})
  }
}))

import { AuthService } from '@/services/auth'

// Arbitraries (生成器)

/**
 * 生成有效的 User 对象
 */
const userArb: fc.Arbitrary<User> = fc.record({
  id: fc.uuid(),
  email: fc.emailAddress(),
  created_at: fc.date().map(d => d.toISOString()),
  app_metadata: fc.constant({}),
  user_metadata: fc.constant({}),
  aud: fc.constant('authenticated'),
  role: fc.constant('authenticated')
}) as fc.Arbitrary<User>

/**
 * 生成有效的 Session 对象
 */
const sessionArb: fc.Arbitrary<Session> = fc.record({
  access_token: fc.string({ minLength: 20, maxLength: 100 }),
  refresh_token: fc.string({ minLength: 20, maxLength: 100 }),
  expires_in: fc.integer({ min: 3600, max: 86400 }),
  expires_at: fc.integer({ min: Math.floor(Date.now() / 1000), max: Math.floor(Date.now() / 1000) + 86400 }),
  token_type: fc.constant('bearer'),
  user: userArb
}) as fc.Arbitrary<Session>

/**
 * 生成有效邮箱
 */
const validEmailArb = fc.emailAddress()



describe('AuthStore Property Tests', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  /**
   * **Feature: user-auth, Property 2: 会话持久化往返测试**
   * *对于任意*存储在本地存储中的有效会话，重新加载应用程序应恢复
   * 具有匹配用户 ID 和令牌的相同会话。
   * **Validates: Requirements 3.1, 3.4**
   */
  it('Property 2: Session persistence round trip', async () => {
    await fc.assert(
      fc.asyncProperty(
        sessionArb,
        async (mockSession) => {
          const store = useAuthStore()
          store.$reset()

          // 模拟 getSession 返回存储的会话
          vi.mocked(AuthService.getSession).mockResolvedValue(mockSession)
          vi.mocked(AuthService.onAuthStateChange).mockReturnValue(() => {})

          // 初始化 store（模拟应用重新加载）
          await store.initialize()

          // 验证会话被正确恢复
          expect(store.session).not.toBeNull()
          expect(store.session?.access_token).toBe(mockSession.access_token)
          expect(store.session?.refresh_token).toBe(mockSession.refresh_token)
          expect(store.user?.id).toBe(mockSession.user.id)
          expect(store.user?.email).toBe(mockSession.user.email)
          expect(store.isAuthenticated).toBe(true)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * **Feature: user-auth, Property 3: 登出清除所有会话数据**
   * *对于任意*已认证用户，调用 signOut 后应导致：session 为 null，
   * user 为 null，且本地存储不包含会话数据。
   * **Validates: Requirements 4.1, 4.2**
   */
  it('Property 3: Logout clears all session data', async () => {
    await fc.assert(
      fc.asyncProperty(
        sessionArb,
        async (mockSession) => {
          const store = useAuthStore()
          store.$reset()

          // 设置初始认证状态
          vi.mocked(AuthService.getSession).mockResolvedValue(mockSession)
          vi.mocked(AuthService.onAuthStateChange).mockReturnValue(() => {})
          vi.mocked(AuthService.signOut).mockResolvedValue({ success: true })

          // 初始化并验证已登录
          await store.initialize()
          expect(store.isAuthenticated).toBe(true)
          expect(store.session).not.toBeNull()
          expect(store.user).not.toBeNull()

          // 执行登出
          await store.signOut()

          // 验证所有会话数据被清除
          expect(store.session).toBeNull()
          expect(store.user).toBeNull()
          expect(store.isAuthenticated).toBe(false)
          expect(store.error).toBeNull()
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * **Feature: user-auth, Property 5: 异步操作期间的加载状态**
   * *对于任意*异步认证操作（sendEmailOtp），
   * 操作进行中 isLoading 状态应为 true，完成后应为 false。
   * **Validates: Requirements 6.1, 6.2**
   */
  describe('Property 5: Loading state during async operations', () => {
    it('sendEmailOtp sets loading state correctly', async () => {
      await fc.assert(
        fc.asyncProperty(
          validEmailArb,
          async (email) => {
            const store = useAuthStore()
            store.$reset()

            // 创建一个可控的 Promise
            let resolvePromise: (value: { success: boolean }) => void
            const controlledPromise = new Promise<{ success: boolean }>((resolve) => {
              resolvePromise = resolve
            })

            vi.mocked(AuthService.sendEmailOtp).mockReturnValue(controlledPromise)

            // 开始操作
            const sendPromise = store.sendEmailOtp(email)

            // 操作进行中，isLoading 应为 true
            expect(store.isLoading).toBe(true)

            // 完成操作
            resolvePromise!({ success: true })
            await sendPromise

            // 操作完成后，isLoading 应为 false
            expect(store.isLoading).toBe(false)
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  /**
   * 补充测试：发送邮箱验证码失败应设置错误消息
   */
  it('Failed sendEmailOtp sets error message', async () => {
    await fc.assert(
      fc.asyncProperty(
        validEmailArb,
        fc.string({ minLength: 1 }),
        async (email, errorMessage) => {
          const store = useAuthStore()
          store.$reset()

          vi.mocked(AuthService.sendEmailOtp).mockResolvedValue({
            success: false,
            error: { code: 'SEND_FAILED', message: errorMessage }
          })

          const result = await store.sendEmailOtp(email)

          expect(result).toBe(false)
          expect(store.error).toBe(errorMessage)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * 补充测试：clearError 应清除错误状态
   */
  it('clearError clears error state', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }),
        (errorMessage) => {
          const store = useAuthStore()
          store.$reset()

          // 设置错误
          store.error = errorMessage
          expect(store.error).toBe(errorMessage)

          // 清除错误
          store.clearError()
          expect(store.error).toBeNull()
        }
      ),
      { numRuns: 100 }
    )
  })
})
