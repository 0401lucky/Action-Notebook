import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import HomeView from './HomeView.vue'
import { useDailyStore } from '@/stores/daily'
import { StorageService } from '@/services/storage'
import type { Priority, MoodType } from '@/types'

// Create a minimal router for testing
const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: HomeView },
    { path: '/home', component: HomeView }
  ]
})

/**
 * Integration Tests for HomeView
 * Tests complete user flows including:
 * - Task management (add, toggle, delete)
 * - Journal and mood updates
 * - Seal functionality
 * - Data persistence
 * 
 * _Requirements: 1.1-1.5, 4.1-4.5, 5.1-5.2_
 */
describe('HomeView Integration Tests', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
  })

  /**
   * Test: Complete task management flow
   * Requirements: 1.1, 1.3, 1.4
   */
  it('should handle complete task management flow', async () => {
    const wrapper = mount(HomeView, {
      global: {
        plugins: [router]
      }
    })
    await flushPromises()

    const store = useDailyStore()
    
    // Add tasks via store (simulating TaskInput component interaction)
    const task1Id = store.addTask('完成项目报告', 'high', ['工作'])
    const task2Id = store.addTask('学习 Vue 3', 'medium', ['学习'])
    const task3Id = store.addTask('锻炼身体', 'low', ['生活'])

    expect(task1Id).not.toBeNull()
    expect(task2Id).not.toBeNull()
    expect(task3Id).not.toBeNull()
    expect(store.taskCount).toBe(3)
    expect(store.completedCount).toBe(0)
    expect(store.completionRate).toBe(0)

    // Toggle task completion
    store.toggleTask(task1Id!)
    expect(store.completedCount).toBe(1)
    expect(store.completionRate).toBe(33) // 1/3 = 33%

    store.toggleTask(task2Id!)
    expect(store.completedCount).toBe(2)
    expect(store.completionRate).toBe(67) // 2/3 = 67%

    // Delete a task
    store.removeTask(task3Id!)
    expect(store.taskCount).toBe(2)
    expect(store.completionRate).toBe(100) // 2/2 = 100%

    wrapper.unmount()
  })

  /**
   * Test: Empty task rejection
   * Requirements: 1.2
   */
  it('should reject empty task descriptions', async () => {
    const wrapper = mount(HomeView, {
      global: {
        plugins: [router]
      }
    })
    await flushPromises()

    const store = useDailyStore()
    
    // Try to add empty tasks
    expect(store.addTask('', 'medium', [])).toBeNull()
    expect(store.addTask('   ', 'medium', [])).toBeNull()
    expect(store.addTask('\t\n', 'medium', [])).toBeNull()
    
    expect(store.taskCount).toBe(0)

    wrapper.unmount()
  })

  /**
   * Test: Task completion animation trigger
   * Requirements: 1.4, 1.5
   */
  it('should toggle task completion state correctly', async () => {
    const wrapper = mount(HomeView, {
      global: {
        plugins: [router]
      }
    })
    await flushPromises()

    const store = useDailyStore()
    
    const taskId = store.addTask('测试任务', 'medium', [])
    expect(taskId).not.toBeNull()

    // Initial state
    let task = store.currentRecord?.tasks.find(t => t.id === taskId)
    expect(task?.completed).toBe(false)
    expect(task?.completedAt).toBeNull()

    // Toggle to completed
    store.toggleTask(taskId!)
    task = store.currentRecord?.tasks.find(t => t.id === taskId)
    expect(task?.completed).toBe(true)
    expect(task?.completedAt).not.toBeNull()

    // Toggle back to incomplete
    store.toggleTask(taskId!)
    task = store.currentRecord?.tasks.find(t => t.id === taskId)
    expect(task?.completed).toBe(false)
    expect(task?.completedAt).toBeNull()

    wrapper.unmount()
  })
})


/**
 * Integration Tests for Journal and Seal functionality
 * _Requirements: 4.1-4.5_
 */
describe('Journal and Seal Integration Tests', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
  })

  /**
   * Test: Journal content persistence
   * Requirements: 4.1
   */
  it('should persist journal content updates', async () => {
    const wrapper = mount(HomeView, {
      global: {
        plugins: [router]
      }
    })
    await flushPromises()

    const store = useDailyStore()
    
    // Update journal content
    const journalContent = '今天完成了很多工作，感觉很充实。学习了新的技术，也锻炼了身体。'
    store.updateJournal(journalContent)
    
    expect(store.currentRecord?.journal).toBe(journalContent)

    wrapper.unmount()
  })

  /**
   * Test: Mood selection persistence
   * Requirements: 4.2
   */
  it('should persist mood selection', async () => {
    const wrapper = mount(HomeView, {
      global: {
        plugins: [router]
      }
    })
    await flushPromises()

    const store = useDailyStore()
    
    // Update mood
    const moods: MoodType[] = ['happy', 'neutral', 'sad', 'excited', 'tired']
    
    for (const mood of moods) {
      store.updateMood(mood)
      expect(store.currentRecord?.mood).toBe(mood)
    }

    wrapper.unmount()
  })

  /**
   * Test: Seal validation - all tasks completed
   * Requirements: 4.3, 4.5
   */
  it('should allow seal when all tasks are completed', async () => {
    const wrapper = mount(HomeView, {
      global: {
        plugins: [router]
      }
    })
    await flushPromises()

    const store = useDailyStore()
    
    // Add and complete tasks
    const task1Id = store.addTask('任务1', 'high', [])
    const task2Id = store.addTask('任务2', 'medium', [])
    
    store.toggleTask(task1Id!)
    store.toggleTask(task2Id!)
    
    expect(store.canSeal).toBe(true)
    
    // Seal the day
    const result = store.sealDay()
    expect(result).toBe(true)
    expect(store.isSealed).toBe(true)
    expect(store.currentRecord?.sealedAt).not.toBeNull()

    wrapper.unmount()
  })

  /**
   * Test: Seal validation - journal meets minimum length
   * Requirements: 4.3, 4.5
   */
  it('should allow seal when journal meets minimum length', async () => {
    const wrapper = mount(HomeView, {
      global: {
        plugins: [router]
      }
    })
    await flushPromises()

    const store = useDailyStore()
    
    // Add incomplete task
    store.addTask('未完成任务', 'high', [])
    
    // Journal with 50+ characters (Chinese characters count as 1 each)
    const longJournal = '这是一段足够长的日记内容，用于测试封存功能。今天的工作很顺利，完成了很多任务。明天继续努力，争取做得更好！加油！'
    store.updateJournal(longJournal)
    
    expect(longJournal.length).toBeGreaterThanOrEqual(50)
    expect(store.canSeal).toBe(true)
    
    const result = store.sealDay()
    expect(result).toBe(true)
    expect(store.isSealed).toBe(true)

    wrapper.unmount()
  })

  /**
   * Test: Seal validation failure
   * Requirements: 4.3, 4.4
   */
  it('should reject seal when conditions not met', async () => {
    const wrapper = mount(HomeView, {
      global: {
        plugins: [router]
      }
    })
    await flushPromises()

    const store = useDailyStore()
    
    // Add incomplete task
    store.addTask('未完成任务', 'high', [])
    
    // Short journal (less than 50 characters)
    store.updateJournal('短日记')
    
    expect(store.canSeal).toBe(false)
    
    const result = store.sealDay()
    expect(result).toBe(false)
    expect(store.isSealed).toBe(false)

    wrapper.unmount()
  })

  /**
   * Test: Sealed record immutability
   * Requirements: 4.5
   */
  it('should prevent modifications to sealed records', async () => {
    const wrapper = mount(HomeView, {
      global: {
        plugins: [router]
      }
    })
    await flushPromises()

    const store = useDailyStore()
    
    // Create and seal a record
    const taskId = store.addTask('任务', 'high', [])
    store.toggleTask(taskId!)
    store.updateJournal('日记内容')
    store.updateMood('happy')
    store.sealDay()
    
    expect(store.isSealed).toBe(true)
    
    // Try to modify sealed record
    const newTaskId = store.addTask('新任务', 'medium', [])
    expect(newTaskId).toBeNull()
    
    const removeResult = store.removeTask(taskId!)
    expect(removeResult).toBe(false)
    
    const toggleResult = store.toggleTask(taskId!)
    expect(toggleResult).toBe(false)
    
    const journalResult = store.updateJournal('新日记')
    expect(journalResult).toBe(false)
    
    const moodResult = store.updateMood('sad')
    expect(moodResult).toBe(false)

    wrapper.unmount()
  })
})


/**
 * Integration Tests for Data Persistence
 * _Requirements: 5.1, 5.2_
 */
describe('Data Persistence Integration Tests', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
  })

  /**
   * Test: Storage round-trip for daily records
   * Requirements: 5.1, 5.2
   */
  it('should persist and restore daily records via StorageService', async () => {
    const store = useDailyStore()
    store.loadToday()
    
    // Add data
    const taskId = store.addTask('持久化测试任务', 'high', ['测试'])
    store.toggleTask(taskId!)
    store.updateJournal('这是持久化测试的日记内容')
    store.updateMood('happy')
    
    const originalRecord = { ...store.currentRecord }
    
    // Save to storage
    const saveResult = StorageService.saveDailyRecord(store.currentRecord!)
    expect(saveResult.success).toBe(true)
    
    // Load from storage
    const loadResult = StorageService.loadDailyRecord(store.currentRecord!.id)
    expect(loadResult.success).toBe(true)
    
    if (loadResult.success) {
      expect(loadResult.data.id).toBe(originalRecord.id)
      expect(loadResult.data.tasks.length).toBe(originalRecord.tasks?.length)
      expect(loadResult.data.journal).toBe(originalRecord.journal)
      expect(loadResult.data.mood).toBe(originalRecord.mood)
    }
  })

  /**
   * Test: Store loadToday restores data from localStorage
   * Requirements: 5.2
   * 
   * 注意：loadToday() 是异步加载数据的，会调用 loadDailyRecordAsync()
   * 在测试环境中，数据库不可用，会回退到 localStorage
   */
  it('should restore state from localStorage on loadToday', async () => {
    // First session: create and save data
    const store1 = useDailyStore()
    store1.loadToday()
    await flushPromises()
    
    store1.addTask('恢复测试任务', 'medium', [])
    store1.updateJournal('恢复测试日记')
    store1.updateMood('excited')
    
    // 使用 StorageService 保存数据（确保 key 格式正确）
    StorageService.saveDailyRecord(store1.currentRecord!)
    
    // Second session: create new store and load
    setActivePinia(createPinia())
    const store2 = useDailyStore()
    store2.loadToday()
    
    // 等待异步加载完成
    await flushPromises()
    
    // Verify data was restored
    expect(store2.currentRecord?.tasks.length).toBe(1)
    expect(store2.currentRecord?.tasks[0].description).toBe('恢复测试任务')
    expect(store2.currentRecord?.journal).toBe('恢复测试日记')
    expect(store2.currentRecord?.mood).toBe('excited')
  })

  /**
   * Test: Archive records persistence
   * Requirements: 5.1, 5.2
   */
  it('should persist and restore archive records', async () => {
    const store = useDailyStore()
    store.loadToday()
    
    // Create multiple records
    const records = [
      {
        ...store.currentRecord!,
        id: '2024-01-01',
        date: '2024-01-01',
        tasks: [{ 
          id: '1', 
          description: '任务1', 
          completed: true, 
          priority: 'high' as Priority, 
          tags: [], 
          order: 0, 
          createdAt: new Date().toISOString(), 
          completedAt: new Date().toISOString() 
        }],
        journal: '第一天日记',
        mood: 'happy' as MoodType,
        isSealed: true
      },
      {
        ...store.currentRecord!,
        id: '2024-01-02',
        date: '2024-01-02',
        tasks: [{ 
          id: '2', 
          description: '任务2', 
          completed: false, 
          priority: 'medium' as Priority, 
          tags: [], 
          order: 0, 
          createdAt: new Date().toISOString(), 
          completedAt: null 
        }],
        journal: '第二天日记',
        mood: 'neutral' as MoodType,
        isSealed: true
      }
    ]
    
    // Save archive
    const saveResult = StorageService.saveArchiveRecords(records)
    expect(saveResult.success).toBe(true)
    
    // Load archive
    const loadResult = StorageService.loadArchiveRecords()
    expect(loadResult.success).toBe(true)
    
    if (loadResult.success) {
      expect(loadResult.data.length).toBe(2)
      expect(loadResult.data[0].id).toBe('2024-01-01')
      expect(loadResult.data[1].id).toBe('2024-01-02')
    }
  })

  /**
   * Test: Empty archive returns empty array
   * Requirements: 5.2
   */
  it('should return empty array for non-existent archive', async () => {
    const loadResult = StorageService.loadArchiveRecords()
    expect(loadResult.success).toBe(true)
    
    if (loadResult.success) {
      expect(loadResult.data).toEqual([])
    }
  })
})
