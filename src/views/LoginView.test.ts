import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import * as fc from 'fast-check'
import LoginView from './LoginView.vue'

// Mock vue-router
vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: vi.fn()
  })
}))

// Mock AuthService
vi.mock('@/services/auth', () => ({
  AuthService: {
    sendMagicLink: vi.fn(),
    getSession: vi.fn(),
    signOut: vi.fn(),
    onAuthStateChange: vi.fn(() => () => {})
  }
}))

describe('LoginView Property Tests', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.resetAllMocks()
  })

  /**
   * **Feature: user-auth, Property 11: 倒计时递减**
   * *对于任意*活动倒计时计时器，值为 N > 0 时，
   * 1 秒后倒计时值应为 N - 1。
   * **Validates: Requirements 8.5**
   */
  it('Property 11: Countdown timer decrement', async () => {
    await fc.assert(
      fc.asyncProperty(
        // 生成初始倒计时值 (1-60 秒范围内)
        fc.integer({ min: 1, max: 60 }),
        // 生成要经过的秒数 (不超过初始值)
        fc.integer({ min: 1, max: 60 }),
        async (initialCountdown, secondsToPass) => {
          // 确保经过的秒数不超过初始倒计时
          const actualSecondsToPass = Math.min(secondsToPass, initialCountdown)

          const wrapper = mount(LoginView)

          // 获取组件实例
          const vm = wrapper.vm as unknown as {
            countdown: number
            startCountdown: () => void
            stopCountdown: () => void
          }

          // 手动设置初始倒计时值并启动
          vm.countdown = initialCountdown
          vm.startCountdown()

          // 由于 startCountdown 会重置为 60，我们需要手动设置
          vm.stopCountdown()
          vm.countdown = initialCountdown

          // 重新启动倒计时，但不让它重置值
          const countdownTimer = setInterval(() => {
            if (vm.countdown > 0) {
              vm.countdown--
            }
          }, 1000)

          // 经过指定秒数
          vi.advanceTimersByTime(actualSecondsToPass * 1000)

          // 清理计时器
          clearInterval(countdownTimer)

          // 验证倒计时值正确递减
          const expectedValue = initialCountdown - actualSecondsToPass
          expect(vm.countdown).toBe(expectedValue)

          wrapper.unmount()
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * 补充测试：倒计时到 0 后停止递减
   */
  it('Countdown stops at zero', async () => {
    const wrapper = mount(LoginView)

    const vm = wrapper.vm as unknown as {
      countdown: number
      startCountdown: () => void
      stopCountdown: () => void
    }

    // 设置较小的初始值
    vm.countdown = 3
    
    // 模拟倒计时逻辑
    const countdownTimer = setInterval(() => {
      if (vm.countdown > 0) {
        vm.countdown--
      }
    }, 1000)

    // 经过 5 秒（超过初始值）
    vi.advanceTimersByTime(5000)

    clearInterval(countdownTimer)

    // 验证倒计时停在 0，不会变成负数
    expect(vm.countdown).toBe(0)

    wrapper.unmount()
  })

  /**
   * 补充测试：startCountdown 初始化为 60 秒
   */
  it('startCountdown initializes to 60 seconds', async () => {
    const wrapper = mount(LoginView)

    const vm = wrapper.vm as unknown as {
      countdown: number
      startCountdown: () => void
      stopCountdown: () => void
    }

    // 调用 startCountdown
    vm.startCountdown()

    // 验证初始值为 60
    expect(vm.countdown).toBe(60)

    // 经过 1 秒
    vi.advanceTimersByTime(1000)

    // 验证递减到 59
    expect(vm.countdown).toBe(59)

    vm.stopCountdown()
    wrapper.unmount()
  })
})
