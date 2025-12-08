import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { DailyRecord, SearchQuery } from '@/types'
import { getPrimaryMood } from '@/services/bookshelf'

/**
 * Archive Store - 历史归档管理
 * 
 * 负责管理已封存的历史记录，包括：
 * - 加载和存储归档记录 (Requirements 7.1)
 * - 按条件搜索和筛选 (Requirements 7.3)
 * - 按日期排序显示 (Requirements 7.4)
 * 
 * @module stores/archive
 */

/**
 * 创建默认搜索条件
 * @returns 包含所有筛选字段的默认 SearchQuery 对象
 */
function createDefaultSearchQuery(): SearchQuery {
  return {
    startDate: null,
    endDate: null,
    mood: null,
    keyword: '',
    tags: []
  }
}

export const useArchiveStore = defineStore('archive', () => {
  // State
  const records = ref<DailyRecord[]>([])
  const searchQuery = ref<SearchQuery>(createDefaultSearchQuery())
  const isLoading = ref(false)

  // Getters
  const sortedRecords = computed(() => {
    return [...records.value].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    )
  })

  // Actions
  /**
   * 加载所有归档记录
   * 直接从数据库加载，确保用户数据隔离
   */
  function loadRecords(): void {
    // 直接从数据库加载，不使用 localStorage（避免用户数据混淆）
    loadRecordsAsync()
  }

  /**
   * 异步从数据库加载归档记录
   * 数据库通过 user_id 过滤，确保只返回当前用户的数据
   * @returns Promise<void> 加载完成后 resolve
   */
  async function loadRecordsAsync(): Promise<void> {
    isLoading.value = true
    try {
      const { StorageService } = await import('@/services/storage')
      const result = await StorageService.loadArchiveRecordsAsync()
      if (result.success) {
        // 使用数据库数据（已按 user_id 过滤）
        records.value = result.data
        console.log('[Archive] 加载完成，记录数:', result.data.length)
        // 打印第一条记录的 journalEntries 用于调试
        if (result.data.length > 0) {
          console.log('[Archive] 第一条记录 journalEntries:', result.data[0].journalEntries?.length || 0)
        }
      }
    } finally {
      isLoading.value = false
    }
  }


  /**
   * 根据ID获取记录
   */
  function getRecordById(id: string): DailyRecord | null {
    return records.value.find(r => r.id === id) ?? null
  }

  /**
   * 搜索记录
   * 根据搜索条件筛选记录
   */
  function searchRecords(query: SearchQuery): DailyRecord[] {
    return records.value.filter(record => {
      // 日期范围筛选
      if (query.startDate) {
        const recordDate = new Date(record.date)
        const startDate = new Date(query.startDate)
        if (recordDate < startDate) {
          return false
        }
      }
      
      if (query.endDate) {
        const recordDate = new Date(record.date)
        const endDate = new Date(query.endDate)
        if (recordDate > endDate) {
          return false
        }
      }
      
      // 心情筛选
      if (query.mood) {
        const moodToCheck = getPrimaryMood(record)
        if (moodToCheck !== query.mood) {
          return false
        }
      }
      
      // 关键词筛选（搜索日记内容和任务描述）
      if (query.keyword && query.keyword.trim().length > 0) {
        const keyword = query.keyword.toLowerCase()
        const journalMatch = record.journal.toLowerCase().includes(keyword)
        const entryMatch = (record.journalEntries ?? []).some(entry =>
          entry.content.toLowerCase().includes(keyword)
        )
        const taskMatch = record.tasks.some(t => 
          t.description.toLowerCase().includes(keyword)
        )
        if (!journalMatch && !entryMatch && !taskMatch) {
          return false
        }
      }
      
      // 标签筛选
      if (query.tags && query.tags.length > 0) {
        const recordTags = new Set(record.tasks.flatMap(t => t.tags))
        const hasMatchingTag = query.tags.some(tag => recordTags.has(tag))
        if (!hasMatchingTag) {
          return false
        }
      }
      
      return true
    })
  }

  /**
   * 更新搜索条件
   */
  function updateSearchQuery(query: Partial<SearchQuery>): void {
    searchQuery.value = { ...searchQuery.value, ...query }
  }

  /**
   * 重置搜索条件
   */
  function resetSearchQuery(): void {
    searchQuery.value = createDefaultSearchQuery()
  }

  /**
   * 添加记录到归档（用于测试和内部使用）
   */
  function addRecord(record: DailyRecord): void {
    const existingIndex = records.value.findIndex(r => r.id === record.id)
    if (existingIndex >= 0) {
      records.value[existingIndex] = record
    } else {
      records.value.push(record)
    }
  }

  /**
   * 重置 store（用于测试）
   */
  function $reset(): void {
    records.value = []
    searchQuery.value = createDefaultSearchQuery()
  }

  return {
    // State
    records,
    searchQuery,
    isLoading,
    // Getters
    sortedRecords,
    // Actions
    loadRecords,
    loadRecordsAsync,
    getRecordById,
    searchRecords,
    updateSearchQuery,
    resetSearchQuery,
    addRecord,
    $reset
  }
})
