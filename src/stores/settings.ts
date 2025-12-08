import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { ThemeType } from '@/types'

/**
 * Settings Store - 应用设置管理
 * 
 * 负责管理应用的全局设置，包括：
 * - 主题切换（浅色/深色模式）(Requirements 9.1-9.2)
 * - 自定义标签管理
 * 
 * 所有设置都会自动持久化到 LocalStorage
 * 
 * @module stores/settings
 */

/** LocalStorage 键名 - 主题设置 */
const STORAGE_KEY_THEME = 'settings_theme'

/** LocalStorage 键名 - 标签列表 */
const STORAGE_KEY_TAGS = 'settings_tags'

export const useSettingsStore = defineStore('settings', () => {
  // State
  const theme = ref<ThemeType>('light')
  const tags = ref<string[]>([])

  // Actions
  /**
   * 切换主题
   * 从浅色切换到深色，或从深色切换到浅色
   */
  function toggleTheme(): void {
    theme.value = theme.value === 'light' ? 'dark' : 'light'
    saveTheme()
    applyTheme()
  }

  /**
   * 设置主题
   */
  function setTheme(newTheme: ThemeType): void {
    theme.value = newTheme
    saveTheme()
    applyTheme()
  }

  /**
   * 添加标签
   * @returns 是否添加成功
   */
  function addTag(tag: string): boolean {
    const trimmedTag = tag.trim()
    if (!trimmedTag || tags.value.includes(trimmedTag)) {
      return false
    }
    tags.value.push(trimmedTag)
    saveTags()
    return true
  }

  /**
   * 删除标签
   * @returns 是否删除成功
   */
  function removeTag(tag: string): boolean {
    const index = tags.value.indexOf(tag)
    if (index === -1) {
      return false
    }
    tags.value.splice(index, 1)
    saveTags()
    return true
  }


  /**
   * 加载设置
   */
  function loadSettings(): void {
    // 加载主题
    try {
      const storedTheme = localStorage.getItem(STORAGE_KEY_THEME)
      if (storedTheme === 'light' || storedTheme === 'dark') {
        theme.value = storedTheme
      }
    } catch {
      // 使用默认值
    }

    // 加载标签
    try {
      const storedTags = localStorage.getItem(STORAGE_KEY_TAGS)
      if (storedTags) {
        tags.value = JSON.parse(storedTags)
      }
    } catch {
      // 使用默认值
    }

    applyTheme()
  }

  /**
   * 保存主题到本地存储
   */
  function saveTheme(): void {
    try {
      localStorage.setItem(STORAGE_KEY_THEME, theme.value)
    } catch {
      // 忽略存储错误
    }
  }

  /**
   * 保存标签到本地存储
   */
  function saveTags(): void {
    try {
      localStorage.setItem(STORAGE_KEY_TAGS, JSON.stringify(tags.value))
    } catch {
      // 忽略存储错误
    }
  }

  /**
   * 应用主题到 DOM
   */
  function applyTheme(): void {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', theme.value)
    }
  }

  /**
   * 重置 store（用于测试）
   */
  function $reset(): void {
    theme.value = 'light'
    tags.value = []
  }

  return {
    // State
    theme,
    tags,
    // Actions
    toggleTheme,
    setTheme,
    addTag,
    removeTag,
    loadSettings,
    $reset
  }
})
