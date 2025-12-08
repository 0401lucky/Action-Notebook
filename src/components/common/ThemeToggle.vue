<script setup lang="ts">
import { useSettingsStore } from '@/stores/settings'
import { storeToRefs } from 'pinia'

const settingsStore = useSettingsStore()
const { theme } = storeToRefs(settingsStore)

const toggleTheme = () => {
  settingsStore.toggleTheme()
}
</script>

<template>
  <button
    class="theme-toggle"
    :class="{ 'is-dark': theme === 'dark' }"
    @click="toggleTheme"
    :aria-label="theme === 'light' ? '切换到深色模式' : '切换到浅色模式'"
    :title="theme === 'light' ? '切换到深色模式' : '切换到浅色模式'"
  >
    <span class="icon sun-icon">☀️</span>
    <span class="icon moon-icon">🌙</span>
    <span class="toggle-slider"></span>
  </button>
</template>

<style scoped lang="scss">
.theme-toggle {
  position: relative;
  width: 56px;
  height: 28px;
  border-radius: var(--radius-full);
  background-color: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  cursor: pointer;
  transition: background-color var(--transition-normal), border-color var(--transition-normal);
  overflow: hidden;

  &:hover {
    border-color: var(--color-primary);
  }

  &:focus {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }

  .icon {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    font-size: 14px;
    transition: opacity var(--transition-normal);
  }

  .sun-icon {
    left: 6px;
    opacity: 1;
  }

  .moon-icon {
    right: 6px;
    opacity: 0.4;
  }

  .toggle-slider {
    position: absolute;
    top: 2px;
    left: 2px;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background-color: var(--color-primary);
    transition: transform var(--transition-normal);
  }

  &.is-dark {
    background-color: var(--bg-tertiary);

    .sun-icon {
      opacity: 0.4;
    }

    .moon-icon {
      opacity: 1;
    }

    .toggle-slider {
      transform: translateX(28px);
    }
  }
}
</style>
