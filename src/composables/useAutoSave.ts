import { watch, ref, onUnmounted } from 'vue'
import type { Ref } from 'vue'
import { StorageService } from '@/services/storage'
import type { DailyRecord } from '@/types'

/**
 * 防抖延迟时间（毫秒）
 * 根据需求 5.1，数据变更应在 500ms 内持久化
 * 设置为 300ms 以确保在 500ms 限制内完成保存
 */
const DEBOUNCE_DELAY = 300

/**
 * useAutoSave - 自动保存 Composable
 * 
 * 实现数据自动持久化功能，优化 LocalStorage 读写频率。
 * 
 * 功能特性：
 * - 防抖机制：减少频繁写入，提升性能
 * - 自动监听：监听数据变化，自动触发保存
 * - 卸载保护：组件卸载时确保最后的更改被保存
 * - 手动保存：提供 saveNow 方法用于立即保存
 * - 加载保护：数据加载期间不触发保存
 * 
 * 性能优化：
 * - 使用 300ms 防抖延迟，平衡响应性和性能
 * - 深度监听确保嵌套数据变化被捕获
 * 
 * @param record - 要监听的每日记录 Ref 对象
 * @param isLoading - 可选的加载状态 Ref，为 true 时禁止保存
 * @returns 包含保存状态和手动保存方法的对象
 * 
 * @example
 * ```typescript
 * const store = useDailyStore()
 * const { isSaving, saveNow } = useAutoSave(
 *   toRef(store, 'currentRecord'),
 *   toRef(store, 'isDataLoading')
 * )
 * 
 * // 立即保存
 * saveNow()
 * ```
 * 
 * @see Requirements 5.1 - 数据变更应在 500ms 内持久化
 */
export function useAutoSave(
  record: Ref<DailyRecord | null>,
  isLoading?: Ref<boolean>
) {
  const isSaving = ref(false)
  const lastSaveTime = ref<number | null>(null)
  let debounceTimer: ReturnType<typeof setTimeout> | null = null

  /**
   * 执行保存操作
   */
  function doSave() {
    // 如果正在加载数据，不保存
    if (isLoading?.value) {
      console.log('[AutoSave] 跳过保存：数据正在加载中')
      return
    }
    
    if (!record.value) return

    isSaving.value = true
    const result = StorageService.saveDailyRecord(record.value)
    isSaving.value = false

    if (result.success) {
      lastSaveTime.value = Date.now()
    }
  }

  /**
   * 防抖保存
   */
  function debouncedSave() {
    // 如果正在加载数据，不触发保存
    if (isLoading?.value) {
      return
    }
    
    if (debounceTimer) {
      clearTimeout(debounceTimer)
    }

    debounceTimer = setTimeout(() => {
      doSave()
      debounceTimer = null
    }, DEBOUNCE_DELAY)
  }

  /**
   * 立即保存（跳过防抖）
   */
  function saveNow() {
    if (debounceTimer) {
      clearTimeout(debounceTimer)
      debounceTimer = null
    }
    doSave()
  }

  // 监听记录变化，自动保存
  const stopWatch = watch(
    record,
    () => {
      debouncedSave()
    },
    { deep: true }
  )

  // 组件卸载时确保数据保存
  onUnmounted(() => {
    stopWatch()
    if (debounceTimer) {
      clearTimeout(debounceTimer)
      doSave() // 确保最后的更改被保存
    }
  })

  return {
    isSaving,
    lastSaveTime,
    saveNow
  }
}

export default useAutoSave
