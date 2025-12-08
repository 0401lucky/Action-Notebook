import { computed, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useSettingsStore } from '@/stores/settings'
import type { ThemeType } from '@/types'

/**
 * useTheme composable
 * Provides theme management functionality with CSS variable switching
 */
export function useTheme() {
  const settingsStore = useSettingsStore()
  const { theme } = storeToRefs(settingsStore)

  /**
   * Current theme value
   */
  const currentTheme = computed(() => theme.value)

  /**
   * Whether dark mode is active
   */
  const isDark = computed(() => theme.value === 'dark')

  /**
   * Whether light mode is active
   */
  const isLight = computed(() => theme.value === 'light')

  /**
   * Toggle between light and dark themes
   */
  const toggleTheme = () => {
    settingsStore.toggleTheme()
  }

  /**
   * Set a specific theme
   */
  const setTheme = (newTheme: ThemeType) => {
    settingsStore.setTheme(newTheme)
  }

  /**
   * Apply theme to document
   * This is called automatically by the settings store,
   * but can be called manually if needed
   */
  const applyTheme = () => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', theme.value)
    }
  }

  /**
   * Initialize theme from system preference if no saved preference exists
   */
  const initFromSystemPreference = () => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      // Only apply system preference if no saved theme exists
      const savedTheme = localStorage.getItem('settings_theme')
      if (!savedTheme) {
        setTheme(prefersDark ? 'dark' : 'light')
      }
    }
  }

  /**
   * Watch for system theme changes
   */
  const watchSystemTheme = () => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      const handler = (e: MediaQueryListEvent) => {
        // Only auto-switch if user hasn't set a preference
        const savedTheme = localStorage.getItem('settings_theme')
        if (!savedTheme) {
          setTheme(e.matches ? 'dark' : 'light')
        }
      }
      mediaQuery.addEventListener('change', handler)
      return () => mediaQuery.removeEventListener('change', handler)
    }
    return () => {}
  }

  // Watch theme changes and apply to DOM
  watch(theme, () => {
    applyTheme()
  }, { immediate: true })

  return {
    currentTheme,
    isDark,
    isLight,
    toggleTheme,
    setTheme,
    applyTheme,
    initFromSystemPreference,
    watchSystemTheme
  }
}

export default useTheme
