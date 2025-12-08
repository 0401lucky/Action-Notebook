import type { DailyRecord, AppError } from '@/types'
import { DatabaseService, DbErrorCodes } from './database'

// 日志开关：开发环境输出详细日志，测试/生产静默冗余信息
const isTestEnv = typeof process !== 'undefined' && process.env.NODE_ENV === 'test'
const isDevEnv = typeof process !== 'undefined' && process.env.NODE_ENV === 'development'
const verboseLog = isDevEnv && !isTestEnv

/**
 * Storage key prefixes
 */
const STORAGE_KEYS = {
  DAILY_PREFIX: 'daily_',
  ARCHIVE: 'archive_records',
  SETTINGS: 'settings'
} as const

/**
 * Storage error codes
 */
export const StorageErrorCodes = {
  QUOTA_EXCEEDED: 'STORAGE_QUOTA',
  READ_ERROR: 'STORAGE_READ_ERROR',
  WRITE_ERROR: 'STORAGE_WRITE_ERROR',
  PARSE_ERROR: 'STORAGE_PARSE_ERROR',
  NOT_FOUND: 'STORAGE_NOT_FOUND'
} as const

/**
 * Check if localStorage is available
 */
function isLocalStorageAvailable(): boolean {
  try {
    const testKey = '__storage_test__'
    localStorage.setItem(testKey, testKey)
    localStorage.removeItem(testKey)
    return true
  } catch {
    return false
  }
}

/**
 * Create an AppError object
 */
function createError(code: string, message: string, details?: Record<string, unknown>): AppError {
  return { code, message, details }
}

/**
 * StorageService - Handles localStorage operations with error handling
 */
export const StorageService = {
  /**
   * Save data to localStorage
   * @param key - Storage key
   * @param data - Data to save (will be JSON stringified)
   * @returns Success or error
   */
  save<T>(key: string, data: T): { success: true } | { success: false; error: AppError } {
    if (!isLocalStorageAvailable()) {
      return {
        success: false,
        error: createError(StorageErrorCodes.WRITE_ERROR, '浏览器不支持本地存储')
      }
    }

    try {
      const serialized = JSON.stringify(data)
      localStorage.setItem(key, serialized)
      return { success: true }
    } catch (error) {
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        return {
          success: false,
          error: createError(
            StorageErrorCodes.QUOTA_EXCEEDED,
            '存储空间不足，请导出并清理历史数据'
          )
        }
      }
      return {
        success: false,
        error: createError(StorageErrorCodes.WRITE_ERROR, '保存数据失败，请检查浏览器设置')
      }
    }
  },

  /**
   * Load data from localStorage
   * @param key - Storage key
   * @returns Data or error
   */
  load<T>(key: string): { success: true; data: T } | { success: false; error: AppError } {
    if (!isLocalStorageAvailable()) {
      return {
        success: false,
        error: createError(StorageErrorCodes.READ_ERROR, '浏览器不支持本地存储')
      }
    }

    try {
      const serialized = localStorage.getItem(key)
      if (serialized === null) {
        return {
          success: false,
          error: createError(StorageErrorCodes.NOT_FOUND, '未找到该数据')
        }
      }
      const data = JSON.parse(serialized) as T
      return { success: true, data }
    } catch {
      return {
        success: false,
        error: createError(StorageErrorCodes.PARSE_ERROR, '读取数据失败，数据格式错误')
      }
    }
  },

  /**
   * Remove data from localStorage
   * @param key - Storage key
   * @returns Success or error
   */
  remove(key: string): { success: true } | { success: false; error: AppError } {
    if (!isLocalStorageAvailable()) {
      return {
        success: false,
        error: createError(StorageErrorCodes.WRITE_ERROR, '浏览器不支持本地存储')
      }
    }

    try {
      localStorage.removeItem(key)
      return { success: true }
    } catch {
      return {
        success: false,
        error: createError(StorageErrorCodes.WRITE_ERROR, '删除数据失败')
      }
    }
  },

  /**
   * Save a daily record (同时保存到 localStorage 和数据库)
   * @param record - Daily record to save
   */
  saveDailyRecord(record: DailyRecord): { success: true } | { success: false; error: AppError } {
    // 同步保存到 localStorage（快速响应，离线可用）
    this.save(`${STORAGE_KEYS.DAILY_PREFIX}${record.id}`, record)
    
    // 异步保存到数据库（主要存储）
    if (DatabaseService.isAvailable()) {
      if (verboseLog) {
        console.log('[Storage] 保存到数据库:', record.id, 'journalEntries:', record.journalEntries?.length || 0)
      }
      DatabaseService.saveDailyRecord(record).then(result => {
        if (result.success) {
          if (verboseLog) {
            console.log('[Storage] 数据库保存成功:', record.id)
          }
        } else {
          console.error('[Storage] 数据库保存失败:', result.error)
        }
      }).catch(err => {
        console.error('[Storage] 数据库保存异常:', err)
      })
    }
    
    return { success: true }
  },

  /**
   * Load a daily record by date (优先使用数据库)
   * @param date - Date string (YYYY-MM-DD)
   */
  loadDailyRecord(date: string): { success: true; data: DailyRecord } | { success: false; error: AppError } {
    // 先从 localStorage 加载（快速响应）
    return this.load<DailyRecord>(`${STORAGE_KEYS.DAILY_PREFIX}${date}`)
  },

  /**
   * 异步从数据库加载每日记录
   */
  async loadDailyRecordAsync(date: string): Promise<{ success: true; data: DailyRecord } | { success: false; error: AppError }> {
    if (DatabaseService.isAvailable()) {
      if (verboseLog) {
        console.log('[Storage] 从数据库加载:', date)
      }
      const dbResult = await DatabaseService.loadDailyRecord(date)
      if (dbResult.success) {
        if (verboseLog) {
          console.log('[Storage] 数据库加载成功:', date, 'journalEntries:', dbResult.data.journalEntries?.length || 0)
        }
        // 同步到 localStorage
        this.save(`${STORAGE_KEYS.DAILY_PREFIX}${date}`, dbResult.data)
        return dbResult
      }
      if (verboseLog) {
        console.log('[Storage] 数据库加载失败:', dbResult.error.code, dbResult.error.message)
        if (dbResult.error.code !== DbErrorCodes.NOT_FOUND) {
          console.warn('数据库加载失败，使用本地数据')
        }
      }
    }
    return this.load<DailyRecord>(`${STORAGE_KEYS.DAILY_PREFIX}${date}`)
  },

  /**
   * Save all archive records
   * @param records - Array of daily records
   */
  saveArchiveRecords(records: DailyRecord[]): { success: true } | { success: false; error: AppError } {
    return this.save(STORAGE_KEYS.ARCHIVE, records)
  },

  /**
   * Load all archive records (同步版本，从 localStorage)
   */
  loadArchiveRecords(): { success: true; data: DailyRecord[] } | { success: false; error: AppError } {
    const result = this.load<DailyRecord[]>(STORAGE_KEYS.ARCHIVE)
    if (!result.success && result.error.code === StorageErrorCodes.NOT_FOUND) {
      return { success: true, data: [] }
    }
    return result
  },

  /**
   * 异步从数据库加载归档记录
   */
  async loadArchiveRecordsAsync(): Promise<{ success: true; data: DailyRecord[] } | { success: false; error: AppError }> {
    if (DatabaseService.isAvailable()) {
      const dbResult = await DatabaseService.loadArchivedRecords()
      if (dbResult.success) {
        return dbResult
      }
      if (verboseLog) {
        console.warn('数据库加载归档失败，使用本地数据')
      }
    }
    return this.loadArchiveRecords()
  },

  /**
   * Check available storage quota (approximate)
   * @returns Estimated available bytes or -1 if unknown
   */
  getAvailableQuota(): number {
    if (!isLocalStorageAvailable()) {
      return 0
    }

    try {
      // Estimate current usage
      let totalSize = 0
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key) {
          const value = localStorage.getItem(key)
          if (value) {
            totalSize += key.length + value.length
          }
        }
      }
      // Most browsers have 5MB limit (5 * 1024 * 1024 = 5242880 bytes)
      // Characters are stored as UTF-16, so multiply by 2
      const estimatedUsed = totalSize * 2
      const estimatedLimit = 5 * 1024 * 1024
      return Math.max(0, estimatedLimit - estimatedUsed)
    } catch {
      return -1
    }
  },

  /**
   * Check if storage quota is low (less than 100KB available)
   */
  isQuotaLow(): boolean {
    const available = this.getAvailableQuota()
    return available >= 0 && available < 100 * 1024
  }
}

export default StorageService
