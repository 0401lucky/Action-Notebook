<script setup lang="ts">
import { ref } from 'vue'
import { useArchiveStore } from '@/stores/archive'
import { ExportService, type ExportFormat } from '@/services/export'

const archiveStore = useArchiveStore()

const showDropdown = ref(false)
const isExporting = ref(false)
const exportError = ref<string | null>(null)

const toggleDropdown = () => {
  showDropdown.value = !showDropdown.value
  exportError.value = null
}

const closeDropdown = () => {
  showDropdown.value = false
}

const handleExport = async (format: ExportFormat) => {
  isExporting.value = true
  exportError.value = null

  try {
    // Load records if not already loaded
    if (archiveStore.records.length === 0) {
      archiveStore.loadRecords()
    }

    const records = archiveStore.records
    
    if (records.length === 0) {
      exportError.value = '没有可导出的数据'
      return
    }

    const result = ExportService.exportAndDownload(records, format)
    
    if (!result.success) {
      exportError.value = result.error.message
    } else {
      closeDropdown()
    }
  } catch {
    exportError.value = '导出失败，请重试'
  } finally {
    isExporting.value = false
  }
}

// Close dropdown when clicking outside
const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement
  if (!target.closest('.export-button-wrapper')) {
    closeDropdown()
  }
}

// Add/remove click listener
import { onMounted, onUnmounted } from 'vue'

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<template>
  <div class="export-button-wrapper">
    <button
      class="export-button"
      @click.stop="toggleDropdown"
      :disabled="isExporting"
      aria-label="导出数据"
      title="导出数据"
    >
      <span class="export-icon">📥</span>
      <span class="export-label">导出</span>
    </button>

    <Transition name="fade">
      <div v-if="showDropdown" class="export-dropdown">
        <div class="dropdown-header">选择导出格式</div>
        
        <button
          class="dropdown-item"
          @click="handleExport('json')"
          :disabled="isExporting"
        >
          <span class="item-icon">📄</span>
          <span class="item-text">
            <span class="item-title">JSON 格式</span>
            <span class="item-desc">适合数据备份和导入</span>
          </span>
        </button>

        <button
          class="dropdown-item"
          @click="handleExport('markdown')"
          :disabled="isExporting"
        >
          <span class="item-icon">📝</span>
          <span class="item-text">
            <span class="item-title">Markdown 格式</span>
            <span class="item-desc">适合阅读和分享</span>
          </span>
        </button>

        <div v-if="exportError" class="export-error">
          {{ exportError }}
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped lang="scss">
.export-button-wrapper {
  position: relative;
}

.export-button {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-md);
  background-color: var(--bg-secondary);
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  border: 1px solid var(--border-color);
  transition: all var(--transition-fast);

  &:hover:not(:disabled) {
    background-color: var(--bg-hover);
    color: var(--text-primary);
    border-color: var(--color-primary);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .export-icon {
    font-size: var(--font-size-md);
  }
}

.export-dropdown {
  position: absolute;
  top: calc(100% + var(--spacing-xs));
  right: 0;
  min-width: 220px;
  background-color: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  z-index: 200;
  overflow: hidden;
}

.dropdown-header {
  padding: var(--spacing-sm) var(--spacing-md);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  color: var(--text-tertiary);
  background-color: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
}

.dropdown-item {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-sm);
  width: 100%;
  padding: var(--spacing-sm) var(--spacing-md);
  text-align: left;
  transition: background-color var(--transition-fast);

  &:hover:not(:disabled) {
    background-color: var(--bg-hover);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .item-icon {
    font-size: var(--font-size-lg);
    flex-shrink: 0;
  }

  .item-text {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .item-title {
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    color: var(--text-primary);
  }

  .item-desc {
    font-size: var(--font-size-xs);
    color: var(--text-tertiary);
  }
}

.export-error {
  padding: var(--spacing-sm) var(--spacing-md);
  font-size: var(--font-size-xs);
  color: var(--color-danger);
  background-color: var(--color-danger-light);
  border-top: 1px solid var(--border-color);
}

// Responsive
@media (max-width: 768px) {
  .export-label {
    display: none;
  }

  .export-dropdown {
    right: -50px;
  }
}
</style>
