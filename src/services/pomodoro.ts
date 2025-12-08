import { supabase, isSupabaseConfigured } from './supabase'
import type { PomodoroSettings, FocusRecord, AppError } from '@/types'
import { DEFAULT_POMODORO_SETTINGS } from '@/types'

/**
 * 番茄钟存储键
 */
const STORAGE_KEYS = {
  SETTINGS: 'pomodoro_settings',
  FOCUS_RECORDS: 'pomodoro_focus_records'
} as const

/**
 * 番茄钟错误码
 */
export const PomodoroErrorCodes = {
  STORAGE_ERROR: 'POMODORO_STORAGE_ERROR',
  PARSE_ERROR: 'POMODORO_PARSE_ERROR',
  DB_ERROR: 'POMODORO_DB_ERROR',
  AUTH_REQUIRED: 'POMODORO_AUTH_REQUIRED'
} as const

/**
 * 创建错误对象
 */
function createError(code: string, message: string): AppError {
  return { code, message }
}

/**
 * 检查 localStorage 是否可用
 */
function isLocalStorageAvailable(): boolean {
  try {
    const testKey = '__pomodoro_test__'
    localStorage.setItem(testKey, testKey)
    localStorage.removeItem(testKey)
    return true
  } catch {
    return false
  }
}

/**
 * 获取当前登录用户的 ID
 */
async function getCurrentUserId(): Promise<string | null> {
  if (!supabase) return null
  const { data: { user } } = await supabase.auth.getUser()
  return user?.id || null
}

/**
 * 获取今日日期字符串 (YYYY-MM-DD)
 */
function getTodayDateString(): string {
  const now = new Date()
  return now.toISOString().split('T')[0]
}

/**
 * PomodoroService - 番茄钟服务
 * 处理设置和专注记录的持久化
 */
export const PomodoroService = {
  // ==================== 设置相关 ====================

  /**
   * 保存番茄钟设置到本地存储
   * @param settings - 番茄钟设置
   * @returns 操作结果
   */
  saveSettings(settings: PomodoroSettings): { success: true } | { success: false; error: AppError } {
    if (!isLocalStorageAvailable()) {
      return {
        success: false,
        error: createError(PomodoroErrorCodes.STORAGE_ERROR, '浏览器不支持本地存储')
      }
    }

    try {
      const serialized = JSON.stringify(settings)
      localStorage.setItem(STORAGE_KEYS.SETTINGS, serialized)
      return { success: true }
    } catch {
      return {
        success: false,
        error: createError(PomodoroErrorCodes.STORAGE_ERROR, '保存设置失败')
      }
    }
  },

  /**
   * 从本地存储加载番茄钟设置
   * @returns 设置数据或默认设置
   */
  loadSettings(): { success: true; data: PomodoroSettings } | { success: false; error: AppError } {
    if (!isLocalStorageAvailable()) {
      return {
        success: true,
        data: { ...DEFAULT_POMODORO_SETTINGS }
      }
    }

    try {
      const serialized = localStorage.getItem(STORAGE_KEYS.SETTINGS)
      if (serialized === null) {
        return {
          success: true,
          data: { ...DEFAULT_POMODORO_SETTINGS }
        }
      }
      const data = JSON.parse(serialized) as PomodoroSettings
      return { success: true, data }
    } catch {
      return {
        success: false,
        error: createError(PomodoroErrorCodes.PARSE_ERROR, '读取设置失败，数据格式错误')
      }
    }
  },

  // ==================== 专注记录相关 ====================

  /**
   * 保存专注记录到本地存储
   * @param record - 专注记录
   * @returns 操作结果
   */
  saveFocusRecord(record: FocusRecord): { success: true } | { success: false; error: AppError } {
    if (!isLocalStorageAvailable()) {
      return {
        success: false,
        error: createError(PomodoroErrorCodes.STORAGE_ERROR, '浏览器不支持本地存储')
      }
    }

    try {
      // 加载现有记录
      const existingResult = this.loadTodayRecordsFromLocal()
      const records = existingResult.success ? existingResult.data : []
      
      // 添加新记录
      records.push(record)
      
      // 保存回本地存储
      const serialized = JSON.stringify(records)
      localStorage.setItem(STORAGE_KEYS.FOCUS_RECORDS, serialized)
      
      return { success: true }
    } catch {
      return {
        success: false,
        error: createError(PomodoroErrorCodes.STORAGE_ERROR, '保存专注记录失败')
      }
    }
  },

  /**
   * 从本地存储加载今日专注记录
   * @returns 今日专注记录数组
   */
  loadTodayRecordsFromLocal(): { success: true; data: FocusRecord[] } | { success: false; error: AppError } {
    if (!isLocalStorageAvailable()) {
      return { success: true, data: [] }
    }

    try {
      const serialized = localStorage.getItem(STORAGE_KEYS.FOCUS_RECORDS)
      if (serialized === null) {
        return { success: true, data: [] }
      }
      
      const allRecords = JSON.parse(serialized) as FocusRecord[]
      const today = getTodayDateString()
      
      // 过滤出今日记录
      const todayRecords = allRecords.filter(record => record.date === today)
      
      return { success: true, data: todayRecords }
    } catch {
      return {
        success: false,
        error: createError(PomodoroErrorCodes.PARSE_ERROR, '读取专注记录失败，数据格式错误')
      }
    }
  },

  /**
   * 加载今日专注记录（优先从数据库）
   * @returns 今日专注记录数组
   */
  async loadTodayRecords(): Promise<{ success: true; data: FocusRecord[] } | { success: false; error: AppError }> {
    // 如果数据库可用，尝试从数据库加载
    if (isSupabaseConfigured && supabase) {
      const userId = await getCurrentUserId()
      if (userId) {
        try {
          const today = getTodayDateString()
          const { data, error } = await supabase
            .from('focus_records')
            .select('*')
            .eq('user_id', userId)
            .eq('date', today)
            .order('completed_at', { ascending: true })

          if (!error && data) {
            const records: FocusRecord[] = data.map(row => ({
              id: row.id,
              taskId: row.task_id,
              taskDescription: row.task_description,
              duration: row.duration,
              completedAt: row.completed_at,
              date: row.date
            }))
            return { success: true, data: records }
          }
        } catch (err) {
          console.warn('从数据库加载专注记录失败，使用本地数据:', err)
        }
      }
    }

    // 回退到本地存储
    return this.loadTodayRecordsFromLocal()
  },

  /**
   * 保存专注记录（同时保存到本地和数据库）
   * @param record - 专注记录
   * @returns 操作结果
   */
  async saveFocusRecordAsync(record: FocusRecord): Promise<{ success: true } | { success: false; error: AppError }> {
    // 先保存到本地存储（快速响应）
    const localResult = this.saveFocusRecord(record)
    if (!localResult.success) {
      return localResult
    }

    // 如果数据库可用，异步同步到数据库
    if (isSupabaseConfigured && supabase) {
      const userId = await getCurrentUserId()
      if (userId) {
        try {
          const { error } = await supabase
            .from('focus_records')
            .insert({
              id: record.id,
              task_id: record.taskId,
              task_description: record.taskDescription,
              duration: record.duration,
              completed_at: record.completedAt,
              date: record.date,
              user_id: userId
            })

          if (error) {
            console.warn('同步专注记录到数据库失败:', error)
            // 不返回错误，因为本地已保存成功
          }
        } catch (err) {
          console.warn('同步专注记录到数据库失败:', err)
        }
      }
    }

    return { success: true }
  },

  /**
   * 清理过期的本地专注记录（保留最近 7 天）
   */
  cleanupOldRecords(): void {
    if (!isLocalStorageAvailable()) return

    try {
      const serialized = localStorage.getItem(STORAGE_KEYS.FOCUS_RECORDS)
      if (serialized === null) return

      const allRecords = JSON.parse(serialized) as FocusRecord[]
      
      // 计算 7 天前的日期
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      const cutoffDate = sevenDaysAgo.toISOString().split('T')[0]
      
      // 过滤保留最近 7 天的记录
      const recentRecords = allRecords.filter(record => record.date >= cutoffDate)
      
      // 保存回本地存储
      localStorage.setItem(STORAGE_KEYS.FOCUS_RECORDS, JSON.stringify(recentRecords))
    } catch {
      // 清理失败不影响主流程
      console.warn('清理过期专注记录失败')
    }
  },

  /**
   * 检查数据库是否可用
   */
  isDatabaseAvailable(): boolean {
    return isSupabaseConfigured
  }
}

export default PomodoroService
