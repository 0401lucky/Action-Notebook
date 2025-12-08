import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import * as fc from 'fast-check'
import type { DailyRecord, Task, Priority, MoodType } from '@/types'

// Mock supabase 模块 - 使用工厂函数
vi.mock('./supabase', () => {
  const mockAuth = {
    getUser: vi.fn()
  }
  const mockFrom = vi.fn()
  
  return {
    supabase: {
      auth: mockAuth,
      from: mockFrom
    },
    isSupabaseConfigured: true
  }
})

// 导入被测试的模块（在 mock 之后）
import { DatabaseService, DbErrorCodes } from './database'
import { supabase } from './supabase'

// 类型断言获取 mock 函数
const mockSupabase = supabase as unknown as {
  auth: { getUser: ReturnType<typeof vi.fn> }
  from: ReturnType<typeof vi.fn>
}

// Arbitraries (生成器)
const priorityArb: fc.Arbitrary<Priority> = fc.constantFrom('high', 'medium', 'low')
const moodArb: fc.Arbitrary<MoodType> = fc.constantFrom('happy', 'neutral', 'sad', 'excited', 'tired')

const taskArb: fc.Arbitrary<Task> = fc.record({
  id: fc.uuid(),
  description: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
  completed: fc.boolean(),
  priority: priorityArb,
  tags: fc.array(fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0), { maxLength: 5 }),
  order: fc.nat({ max: 1000 }),
  createdAt: fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }).map(d => d.toISOString()),
  completedAt: fc.option(
    fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }).map(d => d.toISOString()),
    { nil: null }
  )
})

// 日记条目生成器
const journalEntryArb = fc.record({
  id: fc.uuid(),
  content: fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0),
  mood: fc.option(moodArb, { nil: null }),
  createdAt: fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }).map(d => d.toISOString())
})

const dailyRecordArb: fc.Arbitrary<DailyRecord> = fc.record({
  id: fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }).map(d => d.toISOString().split('T')[0]),
  date: fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }).map(d => d.toISOString().split('T')[0]),
  tasks: fc.array(taskArb, { maxLength: 10 }),
  journal: fc.string({ maxLength: 500 }),
  mood: fc.option(moodArb, { nil: null }),
  journalEntries: fc.array(journalEntryArb, { maxLength: 5 }),
  isSealed: fc.boolean(),
  completionRate: fc.integer({ min: 0, max: 100 }),
  createdAt: fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }).map(d => d.toISOString()),
  sealedAt: fc.option(
    fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }).map(d => d.toISOString()),
    { nil: null }
  )
})

// 用户 ID 生成器
const userIdArb: fc.Arbitrary<string> = fc.uuid()

/**
 * 设置完整的 mock 链，用于 saveDailyRecord
 * 
 * 注意：DatabaseService.saveDailyRecord 使用了复杂的链式调用：
 * - upsert() 直接返回 Promise
 * - delete().eq().eq().not() 链式调用
 * - upsert(..., { onConflict: 'id' }) 带选项的 upsert
 */
function setupSaveMocks(userId: string) {
  let capturedRecordData: any = null
  let capturedTasksData: any[] = []
  let capturedEntriesData: any[] = []

  mockSupabase.auth.getUser.mockResolvedValue({
    data: { user: { id: userId } }
  })

  mockSupabase.from.mockImplementation((table: string) => {
    if (table === 'daily_records') {
      return {
        upsert: (data: any) => {
          capturedRecordData = data
          return Promise.resolve({ error: null })
        }
      }
    }
    if (table === 'tasks') {
      return {
        delete: () => ({
          eq: (_field: string, _value: any) => ({
            eq: (_field2: string, _value2: any) => ({
              not: (_field3: string, _op: string, _value3: string) => Promise.resolve({ error: null })
            }),
            // 无任务时直接返回
            then: (resolve: any) => Promise.resolve({ error: null }).then(resolve)
          })
        }),
        upsert: (data: any, _options?: any) => {
          capturedTasksData = data
          return Promise.resolve({ error: null })
        }
      }
    }
    if (table === 'journal_entries') {
      return {
        delete: () => ({
          eq: (_field: string, _value: any) => ({
            eq: (_field2: string, _value2: any) => ({
              not: (_field3: string, _op: string, _value3: string) => Promise.resolve({ error: null })
            }),
            // 无条目时直接返回
            then: (resolve: any) => Promise.resolve({ error: null }).then(resolve)
          })
        }),
        upsert: (data: any, _options?: any) => {
          capturedEntriesData = data
          return Promise.resolve({ error: null })
        }
      }
    }
    return {}
  })

  return { 
    getCapturedRecordData: () => capturedRecordData, 
    getCapturedTasksData: () => capturedTasksData,
    getCapturedEntriesData: () => capturedEntriesData
  }
}

/**
 * 设置完整的 mock 链，用于 loadDailyRecord
 */
function setupLoadMocks(userId: string, dateId: string) {
  let recordQueryFilters: { field: string; value: any }[] = []
  let taskQueryFilters: { field: string; value: any }[] = []
  let entryQueryFilters: { field: string; value: any }[] = []

  mockSupabase.auth.getUser.mockResolvedValue({
    data: { user: { id: userId } }
  })

  mockSupabase.from.mockImplementation((table: string) => {
    if (table === 'daily_records') {
      return {
        select: () => ({
          eq: (field: string, value: any) => {
            recordQueryFilters.push({ field, value })
            return {
              eq: (field2: string, value2: any) => {
                recordQueryFilters.push({ field: field2, value: value2 })
                return {
                  single: () => Promise.resolve({
                    data: {
                      id: dateId,
                      date: dateId,
                      journal: '',
                      mood: null,
                      is_sealed: false,
                      completion_rate: 0,
                      created_at: new Date().toISOString(),
                      sealed_at: null,
                      user_id: userId
                    },
                    error: null
                  })
                }
              }
            }
          }
        })
      }
    }
    if (table === 'tasks') {
      return {
        select: () => ({
          eq: (field: string, value: any) => {
            taskQueryFilters.push({ field, value })
            return {
              eq: (field2: string, value2: any) => {
                taskQueryFilters.push({ field: field2, value: value2 })
                return {
                  order: () => Promise.resolve({ data: [], error: null })
                }
              }
            }
          }
        })
      }
    }
    if (table === 'journal_entries') {
      return {
        select: () => ({
          eq: (field: string, value: any) => {
            entryQueryFilters.push({ field, value })
            return {
              eq: (field2: string, value2: any) => {
                entryQueryFilters.push({ field: field2, value: value2 })
                return {
                  order: () => Promise.resolve({ data: [], error: null })
                }
              }
            }
          }
        })
      }
    }
    return {}
  })

  return { 
    getRecordFilters: () => recordQueryFilters, 
    getTaskFilters: () => taskQueryFilters,
    getEntryFilters: () => entryQueryFilters
  }
}

/**
 * 设置完整的 mock 链，用于 loadArchivedRecords
 */
function setupArchiveMocks(userId: string) {
  let queryFilters: { field: string; value: any }[] = []

  mockSupabase.auth.getUser.mockResolvedValue({
    data: { user: { id: userId } }
  })

  mockSupabase.from.mockImplementation((table: string) => {
    if (table === 'daily_records') {
      return {
        select: () => ({
          eq: (field: string, value: any) => {
            queryFilters.push({ field, value })
            return {
              eq: (field2: string, value2: any) => {
                queryFilters.push({ field: field2, value: value2 })
                return {
                  order: () => Promise.resolve({ data: [], error: null })
                }
              }
            }
          }
        })
      }
    }
    return {}
  })

  return { getFilters: () => queryFilters }
}

describe('DatabaseService Property Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  /**
   * **Feature: user-auth, Property 4: 用户数据隔离**
   * *对于任意*登录用户创建的每日记录，记录的 user_id 应等于认证用户的 ID，
   * 且查询应只返回匹配 user_id 的记录。
   * **Validates: Requirements 5.1, 5.2**
   */
  describe('Property 4: User Data Isolation', () => {
    it('saveDailyRecord attaches user_id to record', async () => {
      await fc.assert(
        fc.asyncProperty(
          userIdArb,
          dailyRecordArb,
          async (userId, record) => {
            const { getCapturedRecordData, getCapturedTasksData } = setupSaveMocks(userId)

            // 执行保存
            const result = await DatabaseService.saveDailyRecord(record)

            // 验证保存成功
            expect(result.success).toBe(true)

            // 验证 daily_records 包含正确的 user_id
            const capturedRecordData = getCapturedRecordData()
            expect(capturedRecordData).not.toBeNull()
            expect(capturedRecordData.user_id).toBe(userId)

            // 如果有任务，验证任务也包含正确的 user_id
            if (record.tasks.length > 0) {
              const capturedTasksData = getCapturedTasksData()
              expect(capturedTasksData.length).toBe(record.tasks.length)
              for (const task of capturedTasksData) {
                expect(task.user_id).toBe(userId)
              }
            }
          }
        ),
        { numRuns: 50 }
      )
    })

    it('loadDailyRecord filters by user_id', async () => {
      await fc.assert(
        fc.asyncProperty(
          userIdArb,
          fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }).map(d => d.toISOString().split('T')[0]),
          async (userId, dateId) => {
            const { getRecordFilters, getTaskFilters } = setupLoadMocks(userId, dateId)

            // 执行加载
            const result = await DatabaseService.loadDailyRecord(dateId)

            // 验证加载成功
            expect(result.success).toBe(true)

            // 验证查询包含 user_id 过滤
            const recordFilters = getRecordFilters()
            const taskFilters = getTaskFilters()
            expect(recordFilters.some(f => f.field === 'user_id' && f.value === userId)).toBe(true)
            expect(taskFilters.some(f => f.field === 'user_id' && f.value === userId)).toBe(true)
          }
        ),
        { numRuns: 50 }
      )
    })

    it('loadArchivedRecords filters by user_id', async () => {
      await fc.assert(
        fc.asyncProperty(
          userIdArb,
          async (userId) => {
            const { getFilters } = setupArchiveMocks(userId)

            // 执行加载
            const result = await DatabaseService.loadArchivedRecords()

            // 验证加载成功
            expect(result.success).toBe(true)

            // 验证查询包含 user_id 过滤
            const filters = getFilters()
            expect(filters.some(f => f.field === 'user_id' && f.value === userId)).toBe(true)
          }
        ),
        { numRuns: 50 }
      )
    })

    it('saveDailyRecord requires authentication', async () => {
      await fc.assert(
        fc.asyncProperty(
          dailyRecordArb,
          async (record) => {
            // 模拟未登录状态
            mockSupabase.auth.getUser.mockResolvedValue({
              data: { user: null }
            })

            // 执行保存
            const result = await DatabaseService.saveDailyRecord(record)

            // 验证返回认证错误
            expect(result.success).toBe(false)
            if (!result.success) {
              expect(result.error.code).toBe(DbErrorCodes.AUTH_REQUIRED)
            }
          }
        ),
        { numRuns: 20 }
      )
    })

    it('loadDailyRecord requires authentication', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }).map(d => d.toISOString().split('T')[0]),
          async (dateId) => {
            // 模拟未登录状态
            mockSupabase.auth.getUser.mockResolvedValue({
              data: { user: null }
            })

            // 执行加载
            const result = await DatabaseService.loadDailyRecord(dateId)

            // 验证返回认证错误
            expect(result.success).toBe(false)
            if (!result.success) {
              expect(result.error.code).toBe(DbErrorCodes.AUTH_REQUIRED)
            }
          }
        ),
        { numRuns: 20 }
      )
    })

    it('loadArchivedRecords requires authentication', async () => {
      // 模拟未登录状态
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null }
      })

      // 执行加载
      const result = await DatabaseService.loadArchivedRecords()

      // 验证返回认证错误
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.code).toBe(DbErrorCodes.AUTH_REQUIRED)
      }
    })
  })
})
