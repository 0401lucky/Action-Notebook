<template>
  <div class="editor-toolbar" v-if="editor">
    <!-- 字体大小选择器 -->
    <div class="toolbar-group">
      <select
        class="font-size-select"
        :value="currentFontSize"
        @change="handleFontSizeChange"
        title="字体大小"
      >
        <option 
          v-for="option in fontSizeOptions" 
          :key="option.value" 
          :value="option.value"
        >
          {{ option.label }}
        </option>
      </select>
    </div>

    <div class="toolbar-divider" />

    <!-- 文本格式组 -->
    <div class="toolbar-group">
      <button
        v-for="btn in textFormatButtons"
        :key="btn.name"
        class="toolbar-btn"
        :class="{ 'toolbar-btn--active': btn.isActive() }"
        :title="btn.tooltip"
        @click="btn.action"
        type="button"
      >
        <span class="toolbar-btn__icon">{{ btn.icon }}</span>
      </button>
    </div>

    <div class="toolbar-divider" />

    <!-- 列表组 -->
    <div class="toolbar-group">
      <button
        v-for="btn in listButtons"
        :key="btn.name"
        class="toolbar-btn"
        :class="{ 'toolbar-btn--active': btn.isActive() }"
        :title="btn.tooltip"
        @click="btn.action"
        type="button"
      >
        <span class="toolbar-btn__icon">{{ btn.icon }}</span>
      </button>
    </div>

    <div class="toolbar-divider" />

    <!-- 区块组 -->
    <div class="toolbar-group">
      <button
        v-for="btn in blockButtons"
        :key="btn.name"
        class="toolbar-btn"
        :class="{ 'toolbar-btn--active': btn.isActive() }"
        :title="btn.tooltip"
        @click="btn.action"
        type="button"
      >
        <span class="toolbar-btn__icon">{{ btn.icon }}</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 编辑器工具栏组件
 * 
 * 提供富文本格式化按钮，包括文本格式、列表和区块格式
 * 
 * @module components/journal/EditorToolbar
 * 
 * Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 3.1, 4.1, 5.1, 5.2, 5.3, 5.4, 5.5
 */

import { computed, ref, watch } from 'vue'
import type { Editor } from '@tiptap/vue-3'
import { FONT_SIZE_OPTIONS } from '@/composables/useRichTextEditor'

/**
 * 工具栏按钮配置
 */
interface ToolbarButton {
  /** 按钮名称 */
  name: string
  /** 显示图标 */
  icon: string
  /** 点击动作 */
  action: () => void
  /** 是否激活状态 */
  isActive: () => boolean
  /** 快捷键提示 */
  tooltip: string
}

const props = defineProps<{
  /** Tiptap Editor 实例 */
  editor: Editor | null
}>()

// 字体大小选项
const fontSizeOptions = FONT_SIZE_OPTIONS

// 当前字体大小
const currentFontSize = ref('16px')

// 监听编辑器选区变化，更新当前字体大小
watch(() => props.editor, (newEditor) => {
  if (newEditor) {
    newEditor.on('selectionUpdate', () => {
      const attrs = newEditor.getAttributes('textStyle')
      currentFontSize.value = attrs.fontSize || '16px'
    })
    newEditor.on('transaction', () => {
      const attrs = newEditor.getAttributes('textStyle')
      currentFontSize.value = attrs.fontSize || '16px'
    })
  }
}, { immediate: true })

/**
 * 处理字体大小变化
 */
const handleFontSizeChange = (event: Event) => {
  const target = event.target as HTMLSelectElement
  const size = target.value
  if (props.editor) {
    ;(props.editor.chain().focus() as any).setFontSize(size).run()
  }
}

/**
 * 文本格式按钮组
 * Requirements: 1.1, 1.2, 1.3, 5.1, 5.2
 */
const textFormatButtons = computed<ToolbarButton[]>(() => {
  if (!props.editor) return []
  
  return [
    {
      name: 'bold',
      icon: 'B',
      action: () => props.editor?.chain().focus().toggleBold().run(),
      isActive: () => props.editor?.isActive('bold') ?? false,
      tooltip: '加粗 (Ctrl+B)'
    },
    {
      name: 'italic',
      icon: 'I',
      action: () => props.editor?.chain().focus().toggleItalic().run(),
      isActive: () => props.editor?.isActive('italic') ?? false,
      tooltip: '斜体 (Ctrl+I)'
    },
    {
      name: 'strike',
      icon: 'S',
      action: () => props.editor?.chain().focus().toggleStrike().run(),
      isActive: () => props.editor?.isActive('strike') ?? false,
      tooltip: '删除线 (Ctrl+Shift+S)'
    }
  ]
})

/**
 * 列表按钮组
 * Requirements: 2.1, 2.2, 5.3
 */
const listButtons = computed<ToolbarButton[]>(() => {
  if (!props.editor) return []
  
  return [
    {
      name: 'bulletList',
      icon: '•',
      action: () => props.editor?.chain().focus().toggleBulletList().run(),
      isActive: () => props.editor?.isActive('bulletList') ?? false,
      tooltip: '无序列表 (Ctrl+Shift+8)'
    },
    {
      name: 'orderedList',
      icon: '1.',
      action: () => props.editor?.chain().focus().toggleOrderedList().run(),
      isActive: () => props.editor?.isActive('orderedList') ?? false,
      tooltip: '有序列表 (Ctrl+Shift+7)'
    }
  ]
})

/**
 * 区块按钮组
 * Requirements: 3.1, 4.1, 5.4, 5.5
 */
const blockButtons = computed<ToolbarButton[]>(() => {
  if (!props.editor) return []
  
  return [
    {
      name: 'blockquote',
      icon: '"',
      action: () => props.editor?.chain().focus().toggleBlockquote().run(),
      isActive: () => props.editor?.isActive('blockquote') ?? false,
      tooltip: '引用块 (Ctrl+Shift+B)'
    },
    {
      name: 'codeBlock',
      icon: '</>',
      action: () => props.editor?.chain().focus().toggleCodeBlock().run(),
      isActive: () => props.editor?.isActive('codeBlock') ?? false,
      tooltip: '代码块 (Ctrl+Alt+C)'
    }
  ]
})
</script>

<style lang="scss" scoped>
.editor-toolbar {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm);
  background: var(--bg-tertiary);
  border-radius: var(--radius-md) var(--radius-md) 0 0;
  border-bottom: 1px solid var(--border-color);
}

.toolbar-group {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.toolbar-divider {
  width: 1px;
  height: 20px;
  background: var(--border-color);
  margin: 0 var(--spacing-xs);
}

.toolbar-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
  font-family: inherit;
  
  &:hover {
    background: var(--bg-hover);
    color: var(--text-primary);
  }
  
  &:active {
    transform: scale(0.95);
  }
  
  &--active {
    background: var(--color-primary-fade);
    color: var(--color-primary);
    
    &:hover {
      background: var(--color-primary-fade);
      color: var(--color-primary);
    }
  }
}

.toolbar-btn__icon {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  line-height: 1;
  
  // 斜体按钮样式
  .toolbar-btn[title*="斜体"] & {
    font-style: italic;
  }
  
  // 删除线按钮样式
  .toolbar-btn[title*="删除线"] & {
    text-decoration: line-through;
  }
}

// 字体大小选择器
.font-size-select {
  height: 32px;
  padding: 0 var(--spacing-sm);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  background: var(--bg-primary);
  color: var(--text-primary);
  font-size: var(--font-size-sm);
  cursor: pointer;
  transition: all var(--transition-fast);
  outline: none;
  
  &:hover {
    border-color: var(--color-primary-light);
    background: var(--bg-hover);
  }
  
  &:focus {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 2px var(--color-primary-fade);
  }
  
  option {
    background: var(--bg-primary);
    color: var(--text-primary);
  }
}

// 响应式：移动端工具栏
@media (max-width: 480px) {
  .editor-toolbar {
    flex-wrap: wrap;
    gap: var(--spacing-xs);
  }
  
  .toolbar-btn {
    width: 36px;
    height: 36px;
  }
  
  .toolbar-divider {
    display: none;
  }
  
  .font-size-select {
    height: 36px;
    font-size: 16px; // 防止 iOS 缩放
  }
}
</style>
