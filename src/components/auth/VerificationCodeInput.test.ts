import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import * as fc from 'fast-check'
import VerificationCodeInput from './VerificationCodeInput.vue'

// 辅助函数：创建组件实例
function createWrapper(props = {}) {
  return mount(VerificationCodeInput, {
    props: {
      modelValue: [],
      length: 6,
      disabled: false,
      ...props
    },
    attachTo: document.body
  })
}

// 辅助函数：模拟输入事件
async function simulateInput(wrapper: VueWrapper, index: number, value: string) {
  const inputs = wrapper.findAll('input')
  const input = inputs[index]
  await input.setValue(value)
  await input.trigger('input')
}

// 辅助函数：模拟键盘事件
async function simulateKeydown(wrapper: VueWrapper, index: number, key: string) {
  const inputs = wrapper.findAll('input')
  const input = inputs[index]
  await input.trigger('keydown', { key })
}

// 辅助函数：模拟粘贴事件
async function simulatePaste(wrapper: VueWrapper, pastedText: string) {
  const inputs = wrapper.findAll('input')
  const input = inputs[0]
  const clipboardData = {
    getData: () => pastedText
  }
  await input.trigger('paste', { clipboardData })
}

// Arbitraries (生成器)
// 生成 0-4 范围内的索引（用于测试自动聚焦下一格）
const validIndexForNextFocusArb = fc.integer({ min: 0, max: 4 })

// 生成 1-5 范围内的索引（用于测试退格键聚焦上一格）
const validIndexForBackspaceArb = fc.integer({ min: 1, max: 5 })

// 生成单个数字字符
const digitArb = fc.integer({ min: 0, max: 9 }).map(n => n.toString())

// 生成 6 位数字字符串
const sixDigitCodeArb = fc.stringOf(fc.constantFrom('0', '1', '2', '3', '4', '5', '6', '7', '8', '9'), { minLength: 6, maxLength: 6 })


describe('VerificationCodeInput Property Tests', () => {
  let wrapper: VueWrapper

  beforeEach(() => {
    // 清理之前的 wrapper
    if (wrapper) {
      wrapper.unmount()
    }
  })

  /**
   * **Feature: user-auth, Property 7: 验证码自动聚焦下一格**
   * *对于任意*数字输入在验证码框（位置 0-4），输入数字后应自动聚焦下一个输入框。
   * **Validates: Requirements 8.1**
   */
  it('Property 7: 验证码自动聚焦下一格', async () => {
    await fc.assert(
      fc.asyncProperty(
        validIndexForNextFocusArb,
        digitArb,
        async (index, digit) => {
          wrapper = createWrapper()
          const inputs = wrapper.findAll('input')
          
          // 聚焦当前输入框
          await inputs[index].trigger('focus')
          
          // 输入数字
          await simulateInput(wrapper, index, digit)
          
          // 等待 nextTick
          await wrapper.vm.$nextTick()
          
          // 验证下一个输入框获得焦点
          const nextInput = inputs[index + 1].element as HTMLInputElement
          expect(document.activeElement).toBe(nextInput)
          
          wrapper.unmount()
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * **Feature: user-auth, Property 8: 验证码退格键聚焦上一格**
   * *对于任意*空的验证码输入框（位置 1-5），按退格键应聚焦上一个输入框。
   * **Validates: Requirements 8.2**
   */
  it('Property 8: 验证码退格键聚焦上一格', async () => {
    await fc.assert(
      fc.asyncProperty(
        validIndexForBackspaceArb,
        async (index) => {
          wrapper = createWrapper()
          const inputs = wrapper.findAll('input')
          
          // 聚焦当前输入框（确保为空）
          await inputs[index].trigger('focus')
          
          // 按退格键
          await simulateKeydown(wrapper, index, 'Backspace')
          
          // 等待 nextTick
          await wrapper.vm.$nextTick()
          
          // 验证上一个输入框获得焦点
          const prevInput = inputs[index - 1].element as HTMLInputElement
          expect(document.activeElement).toBe(prevInput)
          
          wrapper.unmount()
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * **Feature: user-auth, Property 9: 验证码粘贴分发**
   * *对于任意* 6 位数字字符串粘贴到验证码输入框，数字应按顺序分发到所有 6 个输入框。
   * **Validates: Requirements 8.3**
   */
  it('Property 9: 验证码粘贴分发', async () => {
    await fc.assert(
      fc.asyncProperty(
        sixDigitCodeArb,
        async (code) => {
          wrapper = createWrapper()
          
          // 粘贴验证码
          await simulatePaste(wrapper, code)
          
          // 等待 nextTick
          await wrapper.vm.$nextTick()
          
          // 验证每个输入框的值
          const inputs = wrapper.findAll('input')
          for (let i = 0; i < 6; i++) {
            const input = inputs[i].element as HTMLInputElement
            expect(input.value).toBe(code[i])
          }
          
          wrapper.unmount()
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * **Feature: user-auth, Property 10: 验证码自动提交**
   * *对于任意*状态下所有 6 位验证码数字都已填满，系统应自动触发验证提交。
   * **Validates: Requirements 8.4**
   */
  it('Property 10: 验证码自动提交', async () => {
    await fc.assert(
      fc.asyncProperty(
        sixDigitCodeArb,
        async (code) => {
          const onComplete = vi.fn()
          wrapper = mount(VerificationCodeInput, {
            props: {
              modelValue: [],
              length: 6,
              disabled: false,
              onComplete
            },
            attachTo: document.body
          })
          
          // 粘贴完整验证码
          await simulatePaste(wrapper, code)
          
          // 等待 nextTick
          await wrapper.vm.$nextTick()
          
          // 验证 complete 事件被触发，且参数为完整验证码
          expect(onComplete).toHaveBeenCalledWith(code)
          
          wrapper.unmount()
        }
      ),
      { numRuns: 100 }
    )
  })
})
