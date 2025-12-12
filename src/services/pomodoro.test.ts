import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import * as fc from 'fast-check'
import { PomodoroService } from './pomodoro'
import type { PomodoroSettings, FocusRecord } from '@/types'
import { DEFAULT_POMODORO_SETTINGS } from '@/types'

// ==================== 生成器 (Arbitraries) ====================

/**
 * 有效的番茄钟设置生成器
 * 专注时长: 1-60 分钟
 * 短休息时长: 1-30 分钟
 * 长休息时长: 1-30 分钟
 * 长休息前专注次数: 1-10 次
 */
const validPomodoroSettingsArb: fc.Arbitrary<PomodoroSettings> = fc.record({
  focusDuration: fc.integer({ min: 1, max: 60 }),
  shortBreakDuration: fc.integer({ min: 1, max: 30 }),
  longBreakDuration: fc.integer({ min: 1, max: 30 }),
  pomodorosUntilLongBreak: fc.integer({ min: 1, max: 10 })
})

/**
 * 今日专注记录生成器（日期固定为今天）
 */
const todayFocusRecordArb: fc.Arbitrary<FocusRecord> = fc.record({
  id: fc.uuid(),
  taskId: fc.option(fc.uuid(), { nil: null }),
  taskDescription: fc.option(
    fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
    { nil: null }
  ),
  duration: fc.integer({ min: 1, max: 60 }),
  completedAt: fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }).map(d => d.toISOString()),
  date: fc.constant(new Date().toISOString().split('T')[0])
})

describe('PomodoroService Property Tests', () => {
  // 每个测试前后清理 localStorage
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
  })

  /**
   * **Feature: pomodoro-timer, Property 7: 设置持久化往返一致性**
   * *对于任意*有效的设置配置，保存后重新加载应得到相同的配置值。
   * **Validates: Requirements 5.4**
   */
  it('Property 7: 设置持久化往返一致性', () => {
    fc.assert(
      fc.property(
        validPomodoroSettingsArb,
        (settings) => {
          // 保存设置
          const saveResult = PomodoroService.saveSettings(settings)
          expect(saveResult.success).toBe(true)

          // 重新加载设置
          const loadResult = PomodoroService.loadSettings()
          expect(loadResult.success).toBe(true)

          if (loadResult.success) {
            // 验证往返一致性
            expect(loadResult.data).toEqual(settings)
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * **Feature: pomodoro-timer, Property 8: 专注记录持久化往返一致性**
   * *对于任意*完成的专注记录，保存到本地存储后重新加载应得到相同的记录数据。
   * **Validates: Requirements 7.1, 7.3**
   */
  it('Property 8: 专注记录持久化往返一致性', () => {
    fc.assert(
      fc.property(
        todayFocusRecordArb,
        (record) => {
          // 保存专注记录
          const saveResult = PomodoroService.saveFocusRecord(record)
          expect(saveResult.success).toBe(true)

          // 重新加载今日记录
          const loadResult = PomodoroService.loadTodayRecordsFromLocal()
          expect(loadResult.success).toBe(true)

          if (loadResult.success) {
            // 验证记录存在且数据一致
            const savedRecord = loadResult.data.find(r => r.id === record.id)
            expect(savedRecord).toBeDefined()
            expect(savedRecord).toEqual(record)
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * 测试：未保存设置时返回默认设置
   */
  it('未保存设置时返回默认设置', () => {
    const result = PomodoroService.loadSettings()
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toEqual(DEFAULT_POMODORO_SETTINGS)
    }
  })

  /**
   * 测试：未保存记录时返回空数组
   */
  it('未保存记录时返回空数组', () => {
    const result = PomodoroService.loadTodayRecordsFromLocal()
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toEqual([])
    }
  })

  /**
   * 测试：多条专注记录保存后都能正确加载
   */
  it('多条专注记录保存后都能正确加载', () => {
    fc.assert(
      fc.property(
        fc.array(todayFocusRecordArb, { minLength: 1, maxLength: 10 }),
        (records) => {
          // 每次迭代前清理 localStorage
          localStorage.clear()

          // 确保每条记录有唯一 ID
          const uniqueRecords = records.map((r, i) => ({
            ...r,
            id: `${r.id}-${i}`
          }))

          // 保存所有记录
          for (const record of uniqueRecords) {
            const saveResult = PomodoroService.saveFocusRecord(record)
            expect(saveResult.success).toBe(true)
          }

          // 加载所有记录
          const loadResult = PomodoroService.loadTodayRecordsFromLocal()
          expect(loadResult.success).toBe(true)

          if (loadResult.success) {
            // 验证所有记录都存在
            expect(loadResult.data.length).toBe(uniqueRecords.length)
            
            for (const record of uniqueRecords) {
              const savedRecord = loadResult.data.find(r => r.id === record.id)
              expect(savedRecord).toBeDefined()
              expect(savedRecord).toEqual(record)
            }
          }
        }
      ),
      { numRuns: 50 }
    )
  })

  /**
   * 测试：只加载今日记录，过滤其他日期
   */
  it('只加载今日记录，过滤其他日期', () => {
    const today = new Date().toISOString().split('T')[0]
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]

    // 保存今日记录
    const todayRecord: FocusRecord = {
      id: 'today-record',
      taskId: null,
      taskDescription: null,
      duration: 25,
      completedAt: new Date().toISOString(),
      date: today
    }
    PomodoroService.saveFocusRecord(todayRecord)

    // 手动添加昨日记录到 localStorage
    const allRecords = JSON.parse(localStorage.getItem('pomodoro_focus_records') || '[]')
    allRecords.push({
      id: 'yesterday-record',
      taskId: null,
      taskDescription: null,
      duration: 25,
      completedAt: new Date(Date.now() - 86400000).toISOString(),
      date: yesterday
    })
    localStorage.setItem('pomodoro_focus_records', JSON.stringify(allRecords))

    // 加载今日记录
    const loadResult = PomodoroService.loadTodayRecordsFromLocal()
    expect(loadResult.success).toBe(true)

    if (loadResult.success) {
      // 应该只有今日记录
      expect(loadResult.data.length).toBe(1)
      expect(loadResult.data[0].id).toBe('today-record')
    }
  })
})
