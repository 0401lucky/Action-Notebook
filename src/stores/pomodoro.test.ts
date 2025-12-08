import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import * as fc from 'fast-check'
import { usePomodoroStore, validateSettings } from './pomodoro'
import type { TimerMode, PomodoroSettings } from '@/types'

// ==================== 生成器 (Arbitraries) ====================

/**
 * 计时器操作类型
 */
type TimerAction = 'start' | 'pause' | 'resume' | 'reset'

/**
 * 计时器操作生成器
 */
const timerActionArb: fc.Arbitrary<TimerAction> = fc.constantFrom('start', 'pause', 'resume', 'reset')

/**
 * 计时器操作序列生成器
 */
const timerActionSequenceArb: fc.Arbitrary<TimerAction[]> = fc.array(timerActionArb, { minLength: 1, maxLength: 20 })

/**
 * 有效的专注时长生成器 (1-60 分钟)
 */
const validFocusDurationArb: fc.Arbitrary<number> = fc.integer({ min: 1, max: 60 })

/**
 * 无效的专注时长生成器 (超出范围)
 */
const invalidFocusDurationArb: fc.Arbitrary<number> = fc.oneof(
  fc.integer({ min: -100, max: 0 }),
  fc.integer({ min: 61, max: 200 })
)

/**
 * 有效的休息时长生成器 (1-30 分钟)
 */
const validBreakDurationArb: fc.Arbitrary<number> = fc.integer({ min: 1, max: 30 })

/**
 * 无效的休息时长生成器 (超出范围)
 */
const invalidBreakDurationArb: fc.Arbitrary<number> = fc.oneof(
  fc.integer({ min: -100, max: 0 }),
  fc.integer({ min: 31, max: 200 })
)

/**
 * 有效的番茄钟设置生成器
 */
const validPomodoroSettingsArb: fc.Arbitrary<PomodoroSettings> = fc.record({
  focusDuration: validFocusDurationArb,
  shortBreakDuration: validBreakDurationArb,
  longBreakDuration: validBreakDurationArb,
  pomodorosUntilLongBreak: fc.integer({ min: 1, max: 10 })
})

/**
 * 完成的专注次数生成器 (0-10)
 */
const completedPomodorosArb: fc.Arbitrary<number> = fc.integer({ min: 0, max: 10 })

describe('PomodoroStore Property Tests', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
  })

  /**
   * **Feature: pomodoro-timer, Property 1: 计时器状态转换一致性**
   * *对于任意*计时器状态和操作，状态转换应遵循以下规则：
   * - 空闲状态 + 开始 → 运行状态
   * - 运行状态 + 暂停 → 暂停状态（剩余时间不变）
   * - 暂停状态 + 继续 → 运行状态（从暂停位置继续）
   * - 任意状态 + 重置 → 空闲状态（时间重置为初始值）
   * **Validates: Requirements 2.1, 2.2, 2.3, 2.4**
   */
  it('Property 1: 计时器状态转换一致性', () => {
    fc.assert(
      fc.property(
        timerActionSequenceArb,
        validPomodoroSettingsArb,
        (actions, settings) => {
          const store = usePomodoroStore()
          store.$reset()
          store.updateSettings(settings)

          for (const action of actions) {
            const prevState = store.timerState
            const prevRemainingSeconds = store.remainingSeconds

            switch (action) {
              case 'start':
                if (prevState === 'idle') {
                  const result = store.start()
                  expect(result).toBe(true)
                  expect(store.timerState).toBe('focusing')
                  expect(store.remainingSeconds).toBe(settings.focusDuration * 60)
                } else {
                  const result = store.start()
                  expect(result).toBe(false)
                  expect(store.timerState).toBe(prevState)
                }
                break

              case 'pause':
                if (prevState === 'focusing' || prevState === 'break') {
                  const result = store.pause()
                  expect(result).toBe(true)
                  expect(store.timerState).toBe('paused')
                  // 剩余时间不变
                  expect(store.remainingSeconds).toBe(prevRemainingSeconds)
                } else {
                  const result = store.pause()
                  expect(result).toBe(false)
                  expect(store.timerState).toBe(prevState)
                }
                break

              case 'resume':
                if (prevState === 'paused') {
                  const result = store.resume()
                  expect(result).toBe(true)
                  // 恢复到运行状态（focusing 或 break）
                  expect(['focusing', 'break']).toContain(store.timerState)
                  // 从暂停位置继续，时间不变
                  expect(store.remainingSeconds).toBe(prevRemainingSeconds)
                } else {
                  const result = store.resume()
                  expect(result).toBe(false)
                  expect(store.timerState).toBe(prevState)
                }
                break

              case 'reset':
                store.reset()
                expect(store.timerState).toBe('idle')
                expect(store.remainingSeconds).toBe(0)
                break
            }
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * **Feature: pomodoro-timer, Property 6: 设置值验证**
   * *对于任意*设置值：
   * - 专注时长在 1-60 分钟范围内的整数应被接受
   * - 休息时长在 1-30 分钟范围内的整数应被接受
   * - 超出范围的值应被拒绝
   * **Validates: Requirements 5.2, 5.3, 5.5**
   */
  it('Property 6: 设置值验证 - 有效值应被接受', () => {
    fc.assert(
      fc.property(
        validPomodoroSettingsArb,
        (settings) => {
          const store = usePomodoroStore()
          store.$reset()

          const result = store.updateSettings(settings)
          expect(result).toBe(true)
          expect(store.settings).toEqual(settings)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('Property 6: 设置值验证 - 无效专注时长应被拒绝', () => {
    fc.assert(
      fc.property(
        invalidFocusDurationArb,
        (focusDuration) => {
          const store = usePomodoroStore()
          store.$reset()
          const originalSettings = { ...store.settings }

          const result = store.updateSettings({ focusDuration })
          expect(result).toBe(false)
          // 设置应保持不变
          expect(store.settings).toEqual(originalSettings)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('Property 6: 设置值验证 - 无效短休息时长应被拒绝', () => {
    fc.assert(
      fc.property(
        invalidBreakDurationArb,
        (shortBreakDuration) => {
          const store = usePomodoroStore()
          store.$reset()
          const originalSettings = { ...store.settings }

          const result = store.updateSettings({ shortBreakDuration })
          expect(result).toBe(false)
          expect(store.settings).toEqual(originalSettings)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('Property 6: 设置值验证 - 无效长休息时长应被拒绝', () => {
    fc.assert(
      fc.property(
        invalidBreakDurationArb,
        (longBreakDuration) => {
          const store = usePomodoroStore()
          store.$reset()
          const originalSettings = { ...store.settings }

          const result = store.updateSettings({ longBreakDuration })
          expect(result).toBe(false)
          expect(store.settings).toEqual(originalSettings)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('Property 6: 设置值验证 - 非整数值应被拒绝', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 1.1, max: 59.9, noNaN: true }).filter(n => !Number.isInteger(n)),
        (focusDuration) => {
          const validation = validateSettings({ focusDuration })
          expect(validation.valid).toBe(false)
          expect(validation.errors.length).toBeGreaterThan(0)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * **Feature: pomodoro-timer, Property 3: 专注完成后模式切换**
   * *对于任意*完成的专注时段：
   * - 如果已完成的专注次数 < pomodorosUntilLongBreak，则切换到短休息模式
   * - 如果已完成的专注次数 = pomodorosUntilLongBreak，则切换到长休息模式并重置计数
   * **Validates: Requirements 3.2, 3.3, 3.4**
   */
  it('Property 3: 专注完成后模式切换', async () => {
    await fc.assert(
      fc.asyncProperty(
        validPomodoroSettingsArb,
        completedPomodorosArb,
        async (settings, initialCompleted) => {
          const store = usePomodoroStore()
          store.$reset()
          store.updateSettings(settings)

          // 设置初始完成次数（模拟已完成的专注）
          // 确保不超过 pomodorosUntilLongBreak - 1
          const adjustedCompleted = initialCompleted % settings.pomodorosUntilLongBreak
          store.completedPomodoros = adjustedCompleted

          // 开始专注
          store.start()
          expect(store.timerState).toBe('focusing')
          expect(store.currentMode).toBe('focus')

          // 完成专注时段
          await store.completeFocusSession()

          // 验证模式切换
          expect(store.timerState).toBe('break')

          if (adjustedCompleted + 1 >= settings.pomodorosUntilLongBreak) {
            // 应该进入长休息并重置计数
            expect(store.currentMode).toBe('longBreak')
            expect(store.completedPomodoros).toBe(0)
            expect(store.remainingSeconds).toBe(settings.longBreakDuration * 60)
          } else {
            // 应该进入短休息
            expect(store.currentMode).toBe('shortBreak')
            expect(store.completedPomodoros).toBe(adjustedCompleted + 1)
            expect(store.remainingSeconds).toBe(settings.shortBreakDuration * 60)
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * **Feature: pomodoro-timer, Property 4: 休息完成后恢复专注**
   * *对于任意*完成的休息时段（短休息或长休息），系统应自动切换回专注模式。
   * **Validates: Requirements 3.5**
   */
  it('Property 4: 休息完成后恢复专注', () => {
    fc.assert(
      fc.property(
        validPomodoroSettingsArb,
        fc.constantFrom<TimerMode>('shortBreak', 'longBreak'),
        (settings, breakMode) => {
          const store = usePomodoroStore()
          store.$reset()
          store.updateSettings(settings)

          // 手动设置到休息状态
          store.start()
          // 模拟进入休息模式
          store.timerState = 'break'
          store.currentMode = breakMode
          store.remainingSeconds = breakMode === 'shortBreak' 
            ? settings.shortBreakDuration * 60 
            : settings.longBreakDuration * 60
          store.totalSeconds = store.remainingSeconds

          // 完成休息时段
          store.completeBreakSession()

          // 验证切换回专注模式
          expect(store.timerState).toBe('focusing')
          expect(store.currentMode).toBe('focus')
          expect(store.remainingSeconds).toBe(settings.focusDuration * 60)
        }
      ),
      { numRuns: 100 }
    )
  })
})

/**
 * 任务生成器
 */
const taskArb = fc.record({
  id: fc.uuid(),
  description: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
  completed: fc.boolean(),
  priority: fc.constantFrom('high', 'medium', 'low') as fc.Arbitrary<'high' | 'medium' | 'low'>,
  tags: fc.array(fc.string({ minLength: 1, maxLength: 20 }), { maxLength: 5 }),
  order: fc.integer({ min: 0, max: 100 }),
  createdAt: fc.date().map(d => d.toISOString()),
  completedAt: fc.option(fc.date().map(d => d.toISOString()), { nil: null })
})

describe('PomodoroStore Property Tests - Task Association', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
  })

  /**
   * **Feature: pomodoro-timer, Property 5: 任务关联记录一致性**
   * *对于任意*关联了任务的专注时段，完成后创建的专注记录应包含正确的任务 ID 和任务描述。
   * **Validates: Requirements 4.2, 4.4**
   */
  it('Property 5: 任务关联记录一致性', async () => {
    await fc.assert(
      fc.asyncProperty(
        taskArb,
        validPomodoroSettingsArb,
        async (task, settings) => {
          const store = usePomodoroStore()
          store.$reset()
          store.updateSettings(settings)

          // 关联任务
          store.selectTask(task)
          expect(store.selectedTaskId).toBe(task.id)
          expect(store.selectedTaskDescription).toBe(task.description)

          // 开始专注
          store.start()
          expect(store.timerState).toBe('focusing')

          // 记录完成前的记录数量
          const recordCountBefore = store.todayRecords.length

          // 完成专注时段
          await store.completeFocusSession()

          // 验证创建了新的专注记录
          expect(store.todayRecords.length).toBe(recordCountBefore + 1)

          // 获取最新的专注记录
          const latestRecord = store.todayRecords[store.todayRecords.length - 1]

          // 验证任务关联信息正确
          expect(latestRecord.taskId).toBe(task.id)
          expect(latestRecord.taskDescription).toBe(task.description)
          expect(latestRecord.duration).toBe(settings.focusDuration)
          expect(latestRecord.date).toBe(new Date().toISOString().split('T')[0])
          expect(latestRecord.id).toBeDefined()
          expect(latestRecord.completedAt).toBeDefined()
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * **Feature: pomodoro-timer, Property 5: 任务关联记录一致性 - 无任务关联**
   * *对于任意*未关联任务的专注时段，完成后创建的专注记录应包含 null 的任务 ID 和任务描述。
   * **Validates: Requirements 4.3**
   */
  it('Property 5: 任务关联记录一致性 - 无任务关联时记录应为 null', async () => {
    await fc.assert(
      fc.asyncProperty(
        validPomodoroSettingsArb,
        async (settings) => {
          const store = usePomodoroStore()
          store.$reset()
          store.updateSettings(settings)

          // 不关联任务（自由专注）
          expect(store.selectedTaskId).toBeNull()
          expect(store.selectedTaskDescription).toBeNull()

          // 开始专注
          store.start()

          // 完成专注时段
          await store.completeFocusSession()

          // 获取最新的专注记录
          const latestRecord = store.todayRecords[store.todayRecords.length - 1]

          // 验证任务关联信息为 null
          expect(latestRecord.taskId).toBeNull()
          expect(latestRecord.taskDescription).toBeNull()
        }
      ),
      { numRuns: 100 }
    )
  })
})

describe('PomodoroStore Property Tests - Statistics', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
  })

  /**
   * **Feature: pomodoro-timer, Property 9: 统计数据实时更新**
   * *对于任意*完成的专注时段，完成后统计数据（完成次数和累计时长）应立即反映该时段。
   * **Validates: Requirements 6.3**
   */
  it('Property 9: 统计数据实时更新', async () => {
    await fc.assert(
      fc.asyncProperty(
        validPomodoroSettingsArb,
        fc.integer({ min: 1, max: 5 }),
        async (settings, sessionsToComplete) => {
          const store = usePomodoroStore()
          store.$reset()
          store.updateSettings(settings)

          // 记录初始统计数据
          const initialCompletedPomodoros = store.todayCompletedPomodoros
          const initialTotalMinutes = store.totalFocusMinutes

          // 完成多个专注时段
          for (let i = 0; i < sessionsToComplete; i++) {
            // 开始专注
            store.start()
            expect(store.timerState).toBe('focusing')

            // 完成专注时段
            await store.completeFocusSession()

            // 验证统计数据立即更新
            expect(store.todayCompletedPomodoros).toBe(initialCompletedPomodoros + i + 1)
            expect(store.totalFocusMinutes).toBe(initialTotalMinutes + (i + 1) * settings.focusDuration)

            // 如果进入休息状态，完成休息以便继续下一个专注
            if (store.timerState === 'break') {
              store.completeBreakSession()
            }
          }

          // 最终验证
          expect(store.todayCompletedPomodoros).toBe(initialCompletedPomodoros + sessionsToComplete)
          expect(store.totalFocusMinutes).toBe(initialTotalMinutes + sessionsToComplete * settings.focusDuration)
          expect(store.todayRecords.length).toBe(sessionsToComplete)
        }
      ),
      { numRuns: 50 } // 减少运行次数因为每次测试完成多个时段
    )
  })

  /**
   * **Feature: pomodoro-timer, Property 9: 统计数据实时更新 - 记录数量一致性**
   * 完成的专注时段数量应与今日记录数量一致
   * **Validates: Requirements 6.1, 6.3**
   */
  it('Property 9: 统计数据实时更新 - 记录数量一致性', async () => {
    await fc.assert(
      fc.asyncProperty(
        validPomodoroSettingsArb,
        fc.integer({ min: 1, max: 3 }),
        async (settings, sessionsToComplete) => {
          const store = usePomodoroStore()
          store.$reset()
          store.updateSettings(settings)

          for (let i = 0; i < sessionsToComplete; i++) {
            store.start()
            await store.completeFocusSession()

            // 验证记录数量与完成次数一致
            expect(store.todayRecords.length).toBe(store.todayCompletedPomodoros)

            if (store.timerState === 'break') {
              store.completeBreakSession()
            }
          }
        }
      ),
      { numRuns: 50 }
    )
  })
})

describe('PomodoroStore Unit Tests', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('初始状态应为空闲', () => {
    const store = usePomodoroStore()
    expect(store.timerState).toBe('idle')
    expect(store.currentMode).toBe('focus')
    expect(store.remainingSeconds).toBe(0)
  })

  it('tick 应每秒减少剩余时间', () => {
    const store = usePomodoroStore()
    store.start()
    const initialSeconds = store.remainingSeconds

    store.tick()
    expect(store.remainingSeconds).toBe(initialSeconds - 1)
  })

  it('tick 在非运行状态下不应改变时间', () => {
    const store = usePomodoroStore()
    store.tick()
    expect(store.remainingSeconds).toBe(0)
  })

  it('formattedTime 应正确格式化时间', () => {
    const store = usePomodoroStore()
    store.start()
    // 默认 25 分钟 = 1500 秒
    expect(store.formattedTime).toBe('25:00')

    // 模拟经过 90 秒
    store.remainingSeconds = 1410
    expect(store.formattedTime).toBe('23:30')
  })

  it('progress 应正确计算进度百分比', () => {
    const store = usePomodoroStore()
    store.start()
    expect(store.progress).toBe(0)

    // 模拟完成一半
    store.remainingSeconds = store.totalSeconds / 2
    expect(store.progress).toBe(50)
  })

  it('selectTask 应正确设置任务关联', () => {
    const store = usePomodoroStore()
    const task = {
      id: 'task-1',
      description: '测试任务',
      completed: false,
      priority: 'medium' as const,
      tags: [],
      order: 0,
      createdAt: new Date().toISOString(),
      completedAt: null
    }

    store.selectTask(task)
    expect(store.selectedTaskId).toBe('task-1')
    expect(store.selectedTaskDescription).toBe('测试任务')

    store.selectTask(null)
    expect(store.selectedTaskId).toBeNull()
    expect(store.selectedTaskDescription).toBeNull()
  })
})
