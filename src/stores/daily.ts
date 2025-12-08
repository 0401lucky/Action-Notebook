import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Task, DailyRecord, Priority, MoodType, JournalEntry } from '@/types'
import { 
  addJournalEntry as addJournalEntryService,
  editJournalEntry as editJournalEntryService,
  deleteJournalEntry as deleteJournalEntryService,
  sortEntriesByTime,
  getOverallMood as getOverallMoodService,
  validateEntryContent
} from '@/services/journal'
import { unsealRecord } from '@/services/seal'

/**
 * Daily Store - 今日数据管理
 * 
 * 负责管理当日的任务列表、日记内容和心情记录。
 * 实现了以下核心功能：
 * - 任务的增删改查 (Requirements 1.1-1.5)
 * - 日记和心情管理 (Requirements 4.1-4.2)
 * - 封存功能 (Requirements 4.3-4.5)
 * - 完成率计算 (Requirements 3.1)
 * 
 * @module stores/daily
 */

/**
 * 生成 UUID v4 格式的唯一标识符
 * @returns 格式为 xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx 的 UUID 字符串
 */
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

/**
 * 获取今日日期字符串
 * @returns ISO 8601 日期格式字符串 (YYYY-MM-DD)
 */
function getTodayDateString(): string {
  return new Date().toISOString().split('T')[0]
}

/**
 * 创建空的每日记录
 * 初始化一个新的 DailyRecord 对象，包含默认值
 * @returns 新的空白每日记录
 */
function createEmptyDailyRecord(): DailyRecord {
  const today = getTodayDateString()
  return {
    id: today,
    date: today,
    tasks: [],
    journal: '',
    mood: null,
    journalEntries: [],
    isSealed: false,
    completionRate: 0,
    createdAt: new Date().toISOString(),
    sealedAt: null
  }
}

/**
 * 数据迁移：将旧的单一 journal 字段迁移到 journalEntries
 * 如果记录有 journal 内容但 journalEntries 为空，则创建一条日记条目
 * @param record - 要迁移的记录
 * @returns 迁移后的记录
 */
function migrateJournalData(record: DailyRecord): DailyRecord {
  // 确保 journalEntries 字段存在
  if (!record.journalEntries) {
    record.journalEntries = []
  }

  // 如果有旧的 journal 内容且 journalEntries 为空，则迁移
  if (record.journal && record.journal.trim().length > 0 && record.journalEntries.length === 0) {
    record.journalEntries = [{
      id: generateUUID(),
      content: record.journal,
      mood: record.mood,
      createdAt: record.createdAt
    }]
  }

  return record
}

/**
 * 最低日记字数要求
 */
const MIN_JOURNAL_LENGTH = 50

export const useDailyStore = defineStore('daily', () => {
  // State
  const currentRecord = ref<DailyRecord | null>(null)
  const isSealed = computed(() => currentRecord.value?.isSealed ?? false)
  // 本地变更版本，用于避免异步加载覆盖用户编辑
  const lastLocalChangeAt = ref<number>(Date.now())
  // 数据加载状态，加载中时禁止自动保存
  const isDataLoading = ref(false)

  /**
   * 标记本地数据已变更
   */
  function markModified(): void {
    lastLocalChangeAt.value = Date.now()
  }


  // Getters
  const taskCount = computed(() => currentRecord.value?.tasks.length ?? 0)

  const completedCount = computed(() => 
    currentRecord.value?.tasks.filter(t => t.completed).length ?? 0
  )

  const completionRate = computed(() => {
    if (!currentRecord.value || currentRecord.value.tasks.length === 0) {
      return 0
    }
    const total = currentRecord.value.tasks.length
    const completed = currentRecord.value.tasks.filter(t => t.completed).length
    return Math.round((completed / total) * 100)
  })

  const canSeal = computed(() => {
    if (!currentRecord.value || currentRecord.value.isSealed) {
      return false
    }
    
    const hasTasks = currentRecord.value.tasks.length > 0
    const allTasksCompleted = hasTasks && currentRecord.value.tasks.every(t => t.completed)
    const journalMeetsMinLength = currentRecord.value.journal.length >= MIN_JOURNAL_LENGTH
    const hasJournalContent = currentRecord.value.journal.trim().length > 0
    const hasMood = currentRecord.value.mood !== null
    // 新增：检查是否有日记条目
    const hasJournalEntries = (currentRecord.value.journalEntries?.length ?? 0) > 0
    
    // 封存条件：
    // 1. 有任务时：所有任务已完成 或 日记达到最低字数 或 有日记条目
    // 2. 无任务时：有日记内容（不限字数）或 选择了心情 或 有日记条目
    if (hasTasks) {
      return allTasksCompleted || journalMeetsMinLength || hasJournalEntries
    } else {
      return hasJournalContent || hasMood || hasJournalEntries
    }
  })

  /**
   * 获取整体心情
   * 返回最后一条带心情的日记条目的心情值
   * Requirements: 9.4
   */
  const overallMood = computed((): MoodType | null => {
    if (!currentRecord.value) {
      return null
    }

    const entries = currentRecord.value.journalEntries ?? []
    
    // 如果有日记条目，使用日记条目的心情
    if (entries.length > 0) {
      return getOverallMoodService(entries)
    }
    
    // 兼容旧数据：如果没有日记条目，返回旧的 mood 字段
    return currentRecord.value.mood
  })

  /**
   * 获取排序后的日记条目（最新的在前）
   * Requirements: 6.3
   */
  const sortedJournalEntries = computed((): JournalEntry[] => {
    if (!currentRecord.value) {
      return []
    }
    const entries = currentRecord.value.journalEntries ?? []
    return sortEntriesByTime(entries)
  })

  // Actions
  /**
   * 添加任务
   * @returns 新任务的ID，如果添加失败返回 null
   */
  function addTask(description: string, priority: Priority = 'medium', tags: string[] = []): string | null {
    // 验证：拒绝空描述或纯空白描述
    if (!description || description.trim().length === 0) {
      return null
    }

    // 如果已封存，拒绝修改
    if (currentRecord.value?.isSealed) {
      return null
    }

    // 确保有当前记录
    if (!currentRecord.value) {
      currentRecord.value = createEmptyDailyRecord()
    }

    const newTask: Task = {
      id: generateUUID(),
      description: description.trim(),
      completed: false,
      priority,
      tags,
      order: currentRecord.value.tasks.length,
      createdAt: new Date().toISOString(),
      completedAt: null
    }

    currentRecord.value.tasks.push(newTask)
    updateCompletionRate()
    markModified()
    return newTask.id
  }


  /**
   * 删除任务
   * @returns 是否删除成功
   */
  function removeTask(id: string): boolean {
    if (!currentRecord.value || currentRecord.value.isSealed) {
      return false
    }

    const index = currentRecord.value.tasks.findIndex(t => t.id === id)
    if (index === -1) {
      return false
    }

    currentRecord.value.tasks.splice(index, 1)
    // 更新剩余任务的 order
    currentRecord.value.tasks.forEach((task, idx) => {
      task.order = idx
    })
    updateCompletionRate()
    markModified()
    return true
  }

  /**
   * 切换任务完成状态
   * @returns 是否切换成功
   */
  function toggleTask(id: string): boolean {
    if (!currentRecord.value || currentRecord.value.isSealed) {
      return false
    }

    const task = currentRecord.value.tasks.find(t => t.id === id)
    if (!task) {
      return false
    }

    task.completed = !task.completed
    task.completedAt = task.completed ? new Date().toISOString() : null
    updateCompletionRate()
    markModified()
    return true
  }

  /**
   * 更新任务顺序（拖拽排序后）
   */
  function updateTaskOrder(tasks: Task[]): boolean {
    if (!currentRecord.value || currentRecord.value.isSealed) {
      return false
    }

    // 验证：确保任务ID集合相同（置换不变量）
    const currentIds = new Set(currentRecord.value.tasks.map(t => t.id))
    const newIds = new Set(tasks.map(t => t.id))
    
    if (currentIds.size !== newIds.size) {
      return false
    }
    
    for (const id of currentIds) {
      if (!newIds.has(id)) {
        return false
      }
    }

    // 更新顺序
    currentRecord.value.tasks = tasks.map((task, index) => ({
      ...task,
      order: index
    }))
    markModified()
    return true
  }


  /**
   * 更新日记内容
   */
  function updateJournal(content: string): boolean {
    if (!currentRecord.value) {
      currentRecord.value = createEmptyDailyRecord()
    }

    if (currentRecord.value.isSealed) {
      return false
    }

    currentRecord.value.journal = content
    markModified()
    return true
  }

  /**
   * 更新心情
   */
  function updateMood(mood: MoodType): boolean {
    if (!currentRecord.value) {
      currentRecord.value = createEmptyDailyRecord()
    }

    if (currentRecord.value.isSealed) {
      return false
    }

    currentRecord.value.mood = mood
    markModified()
    return true
  }

  // ==================== 日记条目管理 ====================

  /**
   * 添加日记条目
   * @param content - 日记内容
   * @param mood - 心情（可选）
   * @returns 新条目的 ID，如果添加失败返回 null
   * 
   * Requirements: 6.1, 6.2
   */
  function addJournalEntry(content: string, mood: MoodType | null = null): string | null {
    // 验证内容非空白
    if (!validateEntryContent(content)) {
      return null
    }

    // 如果已封存，拒绝修改
    if (currentRecord.value?.isSealed) {
      return null
    }

    // 确保有当前记录
    if (!currentRecord.value) {
      currentRecord.value = createEmptyDailyRecord()
    }

    // 确保 journalEntries 数组存在
    if (!currentRecord.value.journalEntries) {
      currentRecord.value.journalEntries = []
    }

    const result = addJournalEntryService(
      currentRecord.value.journalEntries,
      content,
      mood
    )

    if (!result) {
      return null
    }

    currentRecord.value.journalEntries = result.entries
    markModified()
    return result.newEntry.id
  }

  /**
   * 编辑日记条目
   * @param id - 条目 ID
   * @param content - 新内容
   * @returns 是否编辑成功
   * 
   * Requirements: 7.1, 7.2
   */
  function editJournalEntry(id: string, content: string): boolean {
    // 验证内容非空白
    if (!validateEntryContent(content)) {
      return false
    }

    // 如果已封存，拒绝修改
    if (!currentRecord.value || currentRecord.value.isSealed) {
      return false
    }

    const entries = currentRecord.value.journalEntries ?? []
    const result = editJournalEntryService(entries, id, content)

    if (!result) {
      return false
    }

    currentRecord.value.journalEntries = result
    markModified()
    return true
  }

  /**
   * 删除日记条目
   * @param id - 条目 ID
   * @returns 是否删除成功
   * 
   * Requirements: 7.3
   */
  function deleteJournalEntry(id: string): boolean {
    // 如果已封存，拒绝修改
    if (!currentRecord.value || currentRecord.value.isSealed) {
      return false
    }

    const entries = currentRecord.value.journalEntries ?? []
    const result = deleteJournalEntryService(entries, id)

    if (!result) {
      return false
    }

    currentRecord.value.journalEntries = result
    markModified()
    return true
  }

  // ==================== 解封功能 ====================

  /**
   * 解封今日记录
   * 将已封存的记录恢复为可编辑状态
   * @returns 是否解封成功
   * 
   * Requirements: 1.2, 1.5
   */
  function unsealDay(): boolean {
    if (!currentRecord.value || !currentRecord.value.isSealed) {
      return false
    }

    const result = unsealRecord(currentRecord.value)
    if (!result) {
      return false
    }

    currentRecord.value = result
    markModified()
    return true
  }

  /**
   * 加载指定记录并解封
   * 用于从归档详情页解封历史记录
   * @param record - 要加载的记录
   * @returns 是否加载并解封成功
   * 
   * Requirements: 4.2, 4.3
   */
  function loadAndUnsealRecord(record: DailyRecord): boolean {
    if (!record.isSealed) {
      return false
    }

    const result = unsealRecord(record)
    if (!result) {
      return false
    }

    currentRecord.value = result
    markModified()
    return true
  }

  /**
   * 封存今日记录
   * @returns 是否封存成功
   * 
   * Requirements: 5.2
   */
  function sealDay(): boolean {
    if (!currentRecord.value || currentRecord.value.isSealed) {
      return false
    }

    // 验证封存条件（与 canSeal 保持一致）
    const hasTasks = currentRecord.value.tasks.length > 0
    const allTasksCompleted = hasTasks && currentRecord.value.tasks.every(t => t.completed)
    const journalMeetsMinLength = currentRecord.value.journal.length >= MIN_JOURNAL_LENGTH
    const hasJournalContent = currentRecord.value.journal.trim().length > 0
    const hasMood = currentRecord.value.mood !== null
    // 新增：检查是否有日记条目
    const hasJournalEntries = (currentRecord.value.journalEntries?.length ?? 0) > 0

    // 封存条件：
    // 1. 有任务时：所有任务已完成 或 日记达到最低字数 或 有日记条目
    // 2. 无任务时：有日记内容（不限字数）或 选择了心情 或 有日记条目
    let canSealNow = false
    if (hasTasks) {
      canSealNow = allTasksCompleted || journalMeetsMinLength || hasJournalEntries
    } else {
      canSealNow = hasJournalContent || hasMood || hasJournalEntries
    }

    if (!canSealNow) {
      return false
    }

    currentRecord.value.isSealed = true
    currentRecord.value.sealedAt = new Date().toISOString()
    updateCompletionRate()
    markModified()
    return true
  }

  /**
   * 加载今日数据
   * 包含数据迁移逻辑：将旧 journal 字段迁移到 journalEntries
   */
  function loadToday(): void {
    // 标记正在加载，禁止自动保存
    isDataLoading.value = true

    // 先创建空记录，等待数据库加载
    currentRecord.value = createEmptyDailyRecord()

    // 异步从数据库加载数据
    loadTodayAsync()
  }

  /**
   * 异步从数据库加载今日数据
   * 数据库通过 user_id 过滤，确保只返回当前用户的数据
   */
  async function loadTodayAsync(): Promise<void> {
    const { StorageService } = await import('@/services/storage')
    const today = getTodayDateString()
    
    try {
      const result = await StorageService.loadDailyRecordAsync(today)
      if (result.success && result.data) {
        // 执行数据迁移
        currentRecord.value = migrateJournalData(result.data)
      }
      // 如果数据库没有数据，保持空记录
    } finally {
      // 加载完成，允许自动保存
      isDataLoading.value = false
      markModified()
    }
  }

  /**
   * 更新完成率
   */
  function updateCompletionRate(): void {
    if (currentRecord.value) {
      currentRecord.value.completionRate = completionRate.value
    }
  }

  /**
   * 批量更新任务（性能优化）
   * 用于一次性更新多个任务，减少响应式触发次数
   * @param updates - 任务更新数组，每个元素包含 id 和要更新的属性
   * @returns 成功更新的任务数量
   */
  function batchUpdateTasks(updates: Array<{ id: string; completed?: boolean }>): number {
    if (!currentRecord.value || currentRecord.value.isSealed) {
      return 0
    }

    let updatedCount = 0
    const now = new Date().toISOString()

    for (const update of updates) {
      const task = currentRecord.value.tasks.find(t => t.id === update.id)
      if (task && update.completed !== undefined) {
        task.completed = update.completed
        task.completedAt = update.completed ? now : null
        updatedCount++
      }
    }

    if (updatedCount > 0) {
      updateCompletionRate()
      markModified()
    }

    return updatedCount
  }

  /**
   * 重置 store（用于测试）
   */
  function $reset(): void {
    currentRecord.value = null
    markModified()
  }

  return {
    // State
    currentRecord,
    isSealed,
    isDataLoading,
    // Getters
    taskCount,
    completedCount,
    completionRate,
    canSeal,
    overallMood,
    sortedJournalEntries,
    // Actions
    addTask,
    removeTask,
    toggleTask,
    updateTaskOrder,
    updateJournal,
    updateMood,
    sealDay,
    loadToday,
    loadTodayAsync,
    batchUpdateTasks,
    // 日记条目管理
    addJournalEntry,
    editJournalEntry,
    deleteJournalEntry,
    // 解封功能
    unsealDay,
    loadAndUnsealRecord,
    $reset
  }
})
