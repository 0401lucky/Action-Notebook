import { supabase, isSupabaseConfigured } from './supabase'
import type { DailyRecord, Task, JournalEntry, AppError } from '@/types'

/**
 * 数据库错误码
 */
export const DbErrorCodes = {
  CONNECTION_ERROR: 'DB_CONNECTION_ERROR',
  QUERY_ERROR: 'DB_QUERY_ERROR',
  NOT_FOUND: 'DB_NOT_FOUND',
  AUTH_REQUIRED: 'DB_AUTH_REQUIRED'
} as const

/**
 * 获取当前登录用户的 ID
 * @returns 用户 ID 或 null
 */
async function getCurrentUserId(): Promise<string | null> {
  if (!supabase) return null
  const { data: { user } } = await supabase.auth.getUser()
  return user?.id || null
}

function createError(code: string, message: string): AppError {
  return { code, message }
}

/**
 * 将数据库行转换为 DailyRecord
 */
function rowToRecord(row: any, tasks: Task[], journalEntries: JournalEntry[] = []): DailyRecord {
  return {
    id: row.id,
    date: row.date,
    tasks,
    journal: row.journal || '',
    mood: row.mood,
    journalEntries,
    isSealed: row.is_sealed,
    completionRate: row.completion_rate,
    createdAt: row.created_at,
    sealedAt: row.sealed_at
  }
}

/**
 * 将数据库行转换为 JournalEntry
 */
function rowToJournalEntry(row: any): JournalEntry {
  return {
    id: row.id,
    content: row.content,
    mood: row.mood,
    createdAt: row.created_at
  }
}

/**
 * 将数据库行转换为 Task
 */
function rowToTask(row: any): Task {
  return {
    id: row.id,
    description: row.description,
    completed: row.completed,
    priority: row.priority,
    tags: row.tags || [],
    order: row.sort_order,
    createdAt: row.created_at,
    completedAt: row.completed_at
  }
}

/**
 * DatabaseService - Supabase 数据库操作
 */
export const DatabaseService = {
  /**
   * 检查数据库是否可用
   */
  isAvailable(): boolean {
    return isSupabaseConfigured
  },

  /**
   * 保存每日记录
   * 需求 5.1: 记录关联用户账户 ID
   */
  async saveDailyRecord(record: DailyRecord): Promise<{ success: true } | { success: false; error: AppError }> {
    if (!supabase) {
      return { success: false, error: createError(DbErrorCodes.CONNECTION_ERROR, '数据库未配置') }
    }

    // 获取当前用户 ID
    const userId = await getCurrentUserId()
    if (!userId) {
      return { success: false, error: createError(DbErrorCodes.AUTH_REQUIRED, '请先登录') }
    }

    // Supabase/PostgREST in 过滤器需要对字符串值加引号
    const buildInFilter = (ids: string[]): string => `(${ids.map(id => `"${id}"`).join(',')})`

    try {
      // 1. 保存/更新 daily_records，附加 user_id
      const { error: recordError } = await supabase
        .from('daily_records')
        .upsert({
          id: record.id,
          date: record.date,
          journal: record.journal,
          mood: record.mood,
          is_sealed: record.isSealed,
          completion_rate: record.completionRate,
          created_at: record.createdAt,
          sealed_at: record.sealedAt,
          user_id: userId
        })

      if (recordError) throw recordError

      // 2. 使用 upsert 更新任务（避免删除后插入的竞态条件）
      if (record.tasks.length > 0) {
        const tasksToUpsert = record.tasks.map(task => ({
          id: task.id,
          record_id: record.id,
          description: task.description,
          completed: task.completed,
          priority: task.priority,
          tags: task.tags,
          sort_order: task.order,
          created_at: task.createdAt,
          completed_at: task.completedAt,
          user_id: userId
        }))

        const { error: upsertError } = await supabase
          .from('tasks')
          .upsert(tasksToUpsert, { onConflict: 'id' })

        if (upsertError) throw upsertError
      }

      // 删除不在当前列表中的旧任务
      const currentTaskIds = record.tasks.map(t => t.id)
      if (currentTaskIds.length > 0) {
        const { error: deleteError } = await supabase
          .from('tasks')
          .delete()
          .eq('record_id', record.id)
          .eq('user_id', userId)
          .not('id', 'in', buildInFilter(currentTaskIds))

        if (deleteError) throw deleteError
      } else {
        // 如果没有任务，删除所有旧任务
        const { error: deleteAllError } = await supabase
          .from('tasks')
          .delete()
          .eq('record_id', record.id)
          .eq('user_id', userId)

        if (deleteAllError) throw deleteAllError
      }

      // 3. 使用 upsert 更新日记条目（避免删除后插入的竞态条件）
      if (record.journalEntries && record.journalEntries.length > 0) {
        const entriesToUpsert = record.journalEntries.map(entry => ({
          id: entry.id,
          record_id: record.id,
          content: entry.content,
          mood: entry.mood,
          created_at: entry.createdAt,
          user_id: userId
        }))

        const { error: upsertEntriesError } = await supabase
          .from('journal_entries')
          .upsert(entriesToUpsert, { onConflict: 'id' })

        if (upsertEntriesError) throw upsertEntriesError
      }

      // 删除不在当前列表中的旧日记条目
      const currentEntryIds = (record.journalEntries || []).map(e => e.id)
      if (currentEntryIds.length > 0) {
        const { error: deleteEntriesError } = await supabase
          .from('journal_entries')
          .delete()
          .eq('record_id', record.id)
          .eq('user_id', userId)
          .not('id', 'in', buildInFilter(currentEntryIds))

        if (deleteEntriesError) throw deleteEntriesError
      } else {
        // 如果没有日记条目，删除所有旧条目
        const { error: deleteAllEntriesError } = await supabase
          .from('journal_entries')
          .delete()
          .eq('record_id', record.id)
          .eq('user_id', userId)

        if (deleteAllEntriesError) throw deleteAllEntriesError
      }

      return { success: true }
    } catch (error) {
      console.error('保存记录失败:', error)
      return { success: false, error: createError(DbErrorCodes.QUERY_ERROR, '保存数据失败') }
    }
  },

  /**
   * 加载每日记录
   * 需求 5.2: 只返回属于当前用户的记录
   */
  async loadDailyRecord(date: string): Promise<{ success: true; data: DailyRecord } | { success: false; error: AppError }> {
    if (!supabase) {
      return { success: false, error: createError(DbErrorCodes.CONNECTION_ERROR, '数据库未配置') }
    }

    // 获取当前用户 ID
    const userId = await getCurrentUserId()
    if (!userId) {
      return { success: false, error: createError(DbErrorCodes.AUTH_REQUIRED, '请先登录') }
    }

    try {
      // 按 user_id 过滤查询，使用 maybeSingle（若不可用则回退 single）避免 406 错误
      const recordQuery = supabase
        .from('daily_records')
        .select('*')
        .eq('id', date)
        .eq('user_id', userId)

      const { data: record, error: recordError } =
        // @ts-ignore: 部分 mock/环境可能缺少 maybeSingle，运行时做能力检测
        typeof recordQuery.maybeSingle === 'function'
          ? await recordQuery.maybeSingle()
          : await recordQuery.single()

      if (recordError) {
        throw recordError
      }

      // 没有找到记录
      if (!record) {
        return { success: false, error: createError(DbErrorCodes.NOT_FOUND, '未找到记录') }
      }

      // 按 user_id 过滤任务查询
      const { data: tasks, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .eq('record_id', date)
        .eq('user_id', userId)
        .order('sort_order')

      if (tasksError) throw tasksError

      // 按 user_id 过滤日记条目查询
      const { data: journalEntries, error: entriesError } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('record_id', date)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (entriesError) throw entriesError

      return {
        success: true,
        data: rowToRecord(
          record, 
          (tasks || []).map(rowToTask),
          (journalEntries || []).map(rowToJournalEntry)
        )
      }
    } catch (error) {
      console.error('加载记录失败:', error)
      return { success: false, error: createError(DbErrorCodes.QUERY_ERROR, '加载数据失败') }
    }
  },

  /**
   * 加载所有已封存的记录
   * 需求 5.2: 只返回属于当前用户的记录
   */
  async loadArchivedRecords(): Promise<{ success: true; data: DailyRecord[] } | { success: false; error: AppError }> {
    if (!supabase) {
      return { success: false, error: createError(DbErrorCodes.CONNECTION_ERROR, '数据库未配置') }
    }

    // 获取当前用户 ID
    const userId = await getCurrentUserId()
    if (!userId) {
      return { success: false, error: createError(DbErrorCodes.AUTH_REQUIRED, '请先登录') }
    }

    try {
      // 按 user_id 过滤查询
      const { data: records, error: recordsError } = await supabase
        .from('daily_records')
        .select('*')
        .eq('is_sealed', true)
        .eq('user_id', userId)
        .order('date', { ascending: false })

      if (recordsError) throw recordsError

      if (!records || records.length === 0) {
        return { success: true, data: [] }
      }

      // 批量加载所有任务，按 user_id 过滤
      const recordIds = records.map(r => r.id)
      const { data: allTasks, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .in('record_id', recordIds)
        .eq('user_id', userId)
        .order('sort_order')

      if (tasksError) throw tasksError

      // 批量加载所有日记条目，按 user_id 过滤
      const { data: allEntries, error: entriesError } = await supabase
        .from('journal_entries')
        .select('*')
        .in('record_id', recordIds)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (entriesError) throw entriesError

      // 按 record_id 分组任务
      const tasksByRecord = new Map<string, Task[]>()
      for (const task of (allTasks || [])) {
        const tasks = tasksByRecord.get(task.record_id) || []
        tasks.push(rowToTask(task))
        tasksByRecord.set(task.record_id, tasks)
      }

      // 按 record_id 分组日记条目
      const entriesByRecord = new Map<string, JournalEntry[]>()
      for (const entry of (allEntries || [])) {
        const entries = entriesByRecord.get(entry.record_id) || []
        entries.push(rowToJournalEntry(entry))
        entriesByRecord.set(entry.record_id, entries)
      }

      const result = records.map(record => 
        rowToRecord(
          record, 
          tasksByRecord.get(record.id) || [],
          entriesByRecord.get(record.id) || []
        )
      )

      return { success: true, data: result }
    } catch (error) {
      console.error('加载归档失败:', error)
      return { success: false, error: createError(DbErrorCodes.QUERY_ERROR, '加载归档数据失败') }
    }
  },

  /**
   * 获取当前用户 ID（用于测试）
   */
  async getUserId(): Promise<string | null> {
    return getCurrentUserId()
  },

  // ==================== 日记条目 CRUD 操作 ====================

  /**
   * 添加日记条目
   * 需求 6.1: 创建新的日记条目
   */
  async addJournalEntry(
    recordId: string, 
    entry: JournalEntry
  ): Promise<{ success: true; data: JournalEntry } | { success: false; error: AppError }> {
    if (!supabase) {
      return { success: false, error: createError(DbErrorCodes.CONNECTION_ERROR, '数据库未配置') }
    }

    const userId = await getCurrentUserId()
    if (!userId) {
      return { success: false, error: createError(DbErrorCodes.AUTH_REQUIRED, '请先登录') }
    }

    try {
      const { data, error } = await supabase
        .from('journal_entries')
        .insert({
          id: entry.id,
          record_id: recordId,
          content: entry.content,
          mood: entry.mood,
          created_at: entry.createdAt,
          user_id: userId
        })
        .select()
        .single()

      if (error) throw error

      return { success: true, data: rowToJournalEntry(data) }
    } catch (error) {
      console.error('添加日记条目失败:', error)
      return { success: false, error: createError(DbErrorCodes.QUERY_ERROR, '添加日记条目失败') }
    }
  },

  /**
   * 更新日记条目
   * 需求 7.1: 编辑日记条目内容
   */
  async updateJournalEntry(
    entryId: string, 
    content: string,
    mood?: string | null
  ): Promise<{ success: true } | { success: false; error: AppError }> {
    if (!supabase) {
      return { success: false, error: createError(DbErrorCodes.CONNECTION_ERROR, '数据库未配置') }
    }

    const userId = await getCurrentUserId()
    if (!userId) {
      return { success: false, error: createError(DbErrorCodes.AUTH_REQUIRED, '请先登录') }
    }

    try {
      const updateData: { content: string; mood?: string | null } = { content }
      if (mood !== undefined) {
        updateData.mood = mood
      }

      const { error } = await supabase
        .from('journal_entries')
        .update(updateData)
        .eq('id', entryId)
        .eq('user_id', userId)

      if (error) throw error

      return { success: true }
    } catch (error) {
      console.error('更新日记条目失败:', error)
      return { success: false, error: createError(DbErrorCodes.QUERY_ERROR, '更新日记条目失败') }
    }
  },

  /**
   * 删除日记条目
   * 需求 7.3: 删除日记条目
   */
  async deleteJournalEntry(
    entryId: string
  ): Promise<{ success: true } | { success: false; error: AppError }> {
    if (!supabase) {
      return { success: false, error: createError(DbErrorCodes.CONNECTION_ERROR, '数据库未配置') }
    }

    const userId = await getCurrentUserId()
    if (!userId) {
      return { success: false, error: createError(DbErrorCodes.AUTH_REQUIRED, '请先登录') }
    }

    try {
      const { error } = await supabase
        .from('journal_entries')
        .delete()
        .eq('id', entryId)
        .eq('user_id', userId)

      if (error) throw error

      return { success: true }
    } catch (error) {
      console.error('删除日记条目失败:', error)
      return { success: false, error: createError(DbErrorCodes.QUERY_ERROR, '删除日记条目失败') }
    }
  },

  /**
   * 获取记录的所有日记条目
   * 需求 6.3: 按时间倒序获取日记条目
   */
  async getJournalEntries(
    recordId: string
  ): Promise<{ success: true; data: JournalEntry[] } | { success: false; error: AppError }> {
    if (!supabase) {
      return { success: false, error: createError(DbErrorCodes.CONNECTION_ERROR, '数据库未配置') }
    }

    const userId = await getCurrentUserId()
    if (!userId) {
      return { success: false, error: createError(DbErrorCodes.AUTH_REQUIRED, '请先登录') }
    }

    try {
      const { data, error } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('record_id', recordId)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error

      return { success: true, data: (data || []).map(rowToJournalEntry) }
    } catch (error) {
      console.error('获取日记条目失败:', error)
      return { success: false, error: createError(DbErrorCodes.QUERY_ERROR, '获取日记条目失败') }
    }
  }
}

export default DatabaseService
