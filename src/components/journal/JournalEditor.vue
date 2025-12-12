<template>
  <div class="journal-editor">
    <div class="journal-editor__header">
      <div class="title-wrapper">
        <span class="icon">✍️</span>
        <h3 class="journal-editor__title">今日复盘</h3>
      </div>
      <div class="entry-count" v-if="entries.length > 0">
        <span class="count">{{ entries.length }}</span>
        <span class="label">条记录</span>
      </div>
    </div>
    
    <!-- 输入区域（未封存时显示） -->
    <div v-if="!readonly" class="input-section">
      <div class="input-wrapper">
        <!-- 使用富文本编辑器替换 textarea - Requirements: 6.1, 8.5 -->
        <RichTextEditor
          ref="editorRef"
          v-model="newContent"
          :placeholder="placeholder"
          @submit="handleAdd"
        />
        <div class="input-footer">
          <MoodPicker
            v-model="selectedMood"
            :disabled="readonly"
          />
          <button
            type="button"
            class="add-btn"
            :disabled="!canAdd"
            @click="handleAdd"
          >
            <span class="add-icon">➕</span>
            <span class="add-text">添加日记</span>
          </button>
        </div>
      </div>
      <p class="input-hint">提示：Ctrl+Enter 快速添加</p>
    </div>
    
    <!-- 日记条目列表 -->
    <div class="entries-section">
      <JournalEntryList
        :entries="entries"
        :readonly="readonly"
        @edit="handleEdit"
        @delete="handleDeleteRequest"
      />
    </div>
    
    <!-- 删除确认对话框 -->
    <ConfirmDialog
      v-model:visible="showDeleteConfirm"
      title="删除日记"
      message="确定要删除这条日记吗？此操作无法撤销。"
      confirm-text="删除"
      cancel-text="取消"
      @confirm="confirmDelete"
      @cancel="cancelDelete"
    />
  </div>
</template>


<script setup lang="ts">
import { ref, computed } from 'vue'
import type { JournalEntry, MoodType } from '@/types'
import MoodPicker from './MoodPicker.vue'
import JournalEntryList from './JournalEntryList.vue'
import RichTextEditor from './RichTextEditor.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import { validateRichContent } from '@/services/richText'

/**
 * 日记编辑器组件（多条目模式）
 * 支持添加多条日记条目，每条可带心情
 * 使用富文本编辑器支持格式化内容
 * 
 * Requirements: 6.1, 8.5, 9.1, 9.2, 9.3
 */

interface Props {
  entries: JournalEntry[]
  readonly?: boolean
  placeholder?: string
}

interface Emits {
  (e: 'add', entry: { content: string; mood: MoodType | null }): void
  (e: 'edit', id: string, content: string): void
  (e: 'delete', id: string): void
}

withDefaults(defineProps<Props>(), {
  readonly: false,
  placeholder: '记录此刻的想法、感受或事件...'
})

const emit = defineEmits<Emits>()

// 输入状态 - 使用富文本编辑器引用
const editorRef = ref<InstanceType<typeof RichTextEditor> | null>(null)
const newContent = ref('')
const selectedMood = ref<MoodType | null>(null)

// 删除确认状态
const showDeleteConfirm = ref(false)
const pendingDeleteId = ref<string | null>(null)

// 是否可以添加（使用富文本验证函数检查 HTML 内容非空白）
// Requirements: 6.1
const canAdd = computed(() => {
  return validateRichContent(newContent.value)
})

// 添加日记条目 - 使用 HTML 内容
// Requirements: 6.1, 8.5
function handleAdd() {
  if (!canAdd.value) return
  
  // 发送 HTML 格式的内容
  emit('add', {
    content: newContent.value,
    mood: selectedMood.value
  })
  
  // 清空输入
  newContent.value = ''
  selectedMood.value = null
  
  // 聚焦富文本编辑器
  editorRef.value?.focus()
}

// 编辑日记条目
function handleEdit(id: string, content: string) {
  emit('edit', id, content)
}

// 请求删除（显示确认对话框）
function handleDeleteRequest(id: string) {
  pendingDeleteId.value = id
  showDeleteConfirm.value = true
}

// 确认删除
function confirmDelete() {
  if (pendingDeleteId.value) {
    emit('delete', pendingDeleteId.value)
  }
  pendingDeleteId.value = null
  showDeleteConfirm.value = false
}

// 取消删除
function cancelDelete() {
  pendingDeleteId.value = null
  showDeleteConfirm.value = false
}
</script>


<style scoped lang="scss">
@use '@/assets/styles/responsive.scss' as *;

.journal-editor {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 var(--spacing-xs);
  }

  .title-wrapper {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    
    .icon {
      font-size: 1.2rem;
    }
  }

  &__title {
    margin: 0;
    font-size: var(--font-size-lg);
    font-weight: 700;
    color: var(--text-primary);
    letter-spacing: 0.5px;
  }

  .entry-count {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px 12px;
    border-radius: var(--radius-full);
    background: var(--color-primary-fade);
    font-size: var(--font-size-xs);
    font-weight: 600;
    color: var(--color-primary);

    .count {
      font-weight: 700;
    }
  }
}

.input-section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.input-wrapper {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.input-footer {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-top: var(--spacing-lg);
  padding-top: var(--spacing-lg);
  border-top: 1px dashed var(--border-color);
  gap: var(--spacing-md);

  @include until-sm {
    flex-direction: column;
    align-items: stretch;
  }
}

.add-btn {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-lg);
  border: none;
  border-radius: var(--radius-lg);
  background: var(--color-primary);
  color: white;
  font-size: var(--font-size-sm);
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-bounce);
  white-space: nowrap;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
  }

  &:active:not(:disabled) {
    transform: scale(0.98);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .add-icon {
    font-size: 1rem;
  }

  @include until-sm {
    justify-content: center;
    padding: var(--spacing-md);
  }
}

.input-hint {
  margin: 0;
  padding: 0 var(--spacing-xs);
  font-size: var(--font-size-xs);
  color: var(--text-tertiary);
}

.entries-section {
  margin-top: var(--spacing-sm);
}
</style>
