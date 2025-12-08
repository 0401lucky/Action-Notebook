import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import * as fc from 'fast-check'
import { useSettingsStore } from './settings'
import type { ThemeType } from '@/types'

// Arbitraries (生成器)
const themeArb: fc.Arbitrary<ThemeType> = fc.constantFrom('light', 'dark')

describe('settingsStore Property Tests', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  /**
   * **Feature: action-log, Property 18: Theme Toggle Consistency**
   * *对于任意*主题状态，切换主题应将其从浅色变为深色或从深色变为浅色，
   * 切换两次后应返回原始主题。
   * **Validates: Requirements 9.1**
   */
  it('Property 18: Theme Toggle Consistency', () => {
    fc.assert(
      fc.property(
        themeArb,
        (initialTheme) => {
          const store = useSettingsStore()
          store.$reset()
          
          // 设置初始主题
          store.setTheme(initialTheme)
          expect(store.theme).toBe(initialTheme)
          
          // 第一次切换
          store.toggleTheme()
          const afterFirstToggle = store.theme
          
          // 验证切换后主题改变
          if (initialTheme === 'light') {
            expect(afterFirstToggle).toBe('dark')
          } else {
            expect(afterFirstToggle).toBe('light')
          }
          
          // 第二次切换
          store.toggleTheme()
          const afterSecondToggle = store.theme
          
          // 验证切换两次后返回原始主题
          expect(afterSecondToggle).toBe(initialTheme)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * 额外测试：多次切换的一致性
   * 验证任意次数的切换都保持一致性
   */
  it('Theme toggle maintains consistency across multiple toggles', () => {
    fc.assert(
      fc.property(
        themeArb,
        fc.nat({ max: 20 }),
        (initialTheme, toggleCount) => {
          const store = useSettingsStore()
          store.$reset()
          
          // 设置初始主题
          store.setTheme(initialTheme)
          
          // 执行多次切换
          for (let i = 0; i < toggleCount; i++) {
            store.toggleTheme()
          }
          
          // 验证最终状态
          // 偶数次切换应返回原始主题，奇数次切换应为相反主题
          const expectedTheme = toggleCount % 2 === 0 
            ? initialTheme 
            : (initialTheme === 'light' ? 'dark' : 'light')
          
          expect(store.theme).toBe(expectedTheme)
        }
      ),
      { numRuns: 100 }
    )
  })
})
