<template>
  <div class="journal-entry-item">
    <!-- 时间标签 -->
    <div class="journal-entry-item__time">
      <span class="time-label">{{ formattedTime }}</span>
      <span v-if="entry.mood" class="mood-emoji">{{ moodEmoji }}</span>
    </div>
    
    <!-- 内容区域 - Requirements: 6.2, 6.3 -->
    <div class="journal-entry-item__content">
      <!-- 显示模式：使用 v-html 渲染富文本内容 -->
      <div 
        v-if="!isEditing" 
        class="content-text rich-text-content"
        v-html="normalizedContent"
      />
      <!-- 编辑模式：使用 RichTextEditor 替换 textarea -->
      <RichTextEditor
        v-else
        ref="editEditorRef"
        v-model="editContent"
        class="content-edit"
        :autofocus="true"
        @submit="saveEdit"
      />
    </div>
    
    <!-- 操作按钮（未封存时显示） -->
    <div v-if="!readonly" class="journal-entry-item__actions">
      <template v-if="!isEditing">
        <button
          type="button"
          class="action-btn action-btn--edit"
          title="编辑"
          @click="startEdit"
        >
          ✏️
        </button>
        <button
          type="button"
          class="action-btn action-btn--delete"
          title="删除"
          @click="handleDelete"
        >
          🗑️
        </button>
      </template>
      <template v-else>
        <button
          type="button"
          class="action-btn action-btn--save"
          title="保存"
          @click="saveEdit"
        >
          ✅
        </button>
        <button
          type="button"
          class="action-btn action-btn--cancel"
          title="取消"
          @click="cancelEdit"
        >
          ❌
        </button>
      </template>
    </div>
  </div>
</template>


<script setup lang="ts">
import { ref, computed } from 'vue'
import type { JournalEntry, MoodType } from '@/types'
import RichTextEditor from './RichTextEditor.vue'
import { normalizeContent, validateRichContent } from '@/services/richText'

/**
 * 日记条目项组件
 * 显示单条日记记录，包含时间标签、内容和心情 emoji
 * 支持富文本内容的显示和编辑
 * 
 * Requirements: 6.2, 6.3, 6.4, 7.1, 7.2
 */

interface Props {
  entry: JournalEntry
  readonly?: boolean
}

interface Emits {
  (e: 'edit', id: string, content: string): void
  (e: 'delete', id: string): void
}

const props = withDefaults(defineProps<Props>(), {
  readonly: false
})

const emit = defineEmits<Emits>()

// 心情 emoji 映射
const moodEmojiMap: Record<MoodType, string> = {
  happy: '😊',
  neutral: '😐',
  sad: '😢',
  excited: '🤩',
  tired: '😴'
}

// 编辑状态
const isEditing = ref(false)
const editContent = ref('')
const editEditorRef = ref<InstanceType<typeof RichTextEditor> | null>(null)

// 规范化内容（兼容旧的纯文本数据）- Requirements: 6.2
const normalizedContent = computed(() => {
  return normalizeContent(props.entry.content)
})

// 格式化时间（显示 HH:mm）
const formattedTime = computed(() => {
  const date = new Date(props.entry.createdAt)
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  return `${hours}:${minutes}`
})

// 获取心情 emoji
const moodEmoji = computed(() => {
  if (!props.entry.mood) return ''
  return moodEmojiMap[props.entry.mood] || ''
})

// 开始编辑 - 加载规范化后的内容到编辑器
function startEdit() {
  editContent.value = normalizedContent.value
  isEditing.value = true
  // RichTextEditor 组件会自动聚焦（autofocus prop）
}

// 保存编辑 - 使用富文本验证函数
// Requirements: 6.3
function saveEdit() {
  if (validateRichContent(editContent.value)) {
    emit('edit', props.entry.id, editContent.value)
  }
  isEditing.value = false
}

// 取消编辑
function cancelEdit() {
  isEditing.value = false
  editContent.value = ''
}

// 处理删除
function handleDelete() {
  emit('delete', props.entry.id)
}
</script>


<style scoped lang="scss">
@use '@/assets/styles/responsive.scss' as *;

.journal-entry-item {
  display: flex;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-color);
  transition: all var(--transition-normal);

  &:hover {
    border-color: var(--color-primary-light);
    box-shadow: var(--shadow-sm);
  }

  @include until-sm {
    flex-direction: column;
    gap: var(--spacing-sm);
  }

  &__time {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    min-width: 60px;
    flex-shrink: 0;

    @include until-sm {
      flex-direction: row;
      gap: var(--spacing-sm);
    }

    .time-label {
      font-size: var(--font-size-sm);
      font-weight: 600;
      color: var(--color-primary);
      background: var(--color-primary-fade);
      padding: 4px 8px;
      border-radius: var(--radius-md);
    }

    .mood-emoji {
      font-size: 1.2rem;
    }
  }

  &__content {
    flex: 1;
    min-width: 0;

    .content-text {
      color: var(--text-primary);
      font-size: var(--font-size-md);
      line-height: 1.6;
      word-break: break-word;
    }

    // 富文本内容样式使用全局 .rich-text-content 类
    // 定义在 src/assets/styles/editor.scss

    .content-edit {
      width: 100%;
    }
  }

  &__actions {
    display: flex;
    gap: var(--spacing-xs);
    flex-shrink: 0;

    @include until-sm {
      justify-content: flex-end;
    }
  }
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  border: none;
  border-radius: var(--radius-md);
  background: var(--bg-tertiary);
  cursor: pointer;
  font-size: 1rem;
  transition: all var(--transition-fast);

  &:hover {
    transform: scale(1.1);
  }

  &:active {
    transform: scale(0.95);
  }

  &--edit:hover {
    background: var(--color-primary-fade);
  }

  &--delete:hover {
    background: rgba(239, 68, 68, 0.1);
  }

  &--save:hover {
    background: rgba(16, 185, 129, 0.1);
  }

  &--cancel:hover {
    background: rgba(107, 114, 128, 0.1);
  }
}
</style>
