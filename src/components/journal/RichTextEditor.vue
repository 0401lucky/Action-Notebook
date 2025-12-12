<template>
  <div 
    class="rich-text-editor"
    :class="{ 
      'rich-text-editor--readonly': readonly,
      'rich-text-editor--focused': isFocused
    }"
  >
    <!-- 工具栏（只读模式隐藏） -->
    <EditorToolbar 
      v-if="!readonly" 
      :editor="editor" 
    />
    
    <!-- 编辑区域 -->
    <div class="editor-content-wrapper">
      <EditorContent 
        :editor="editor || undefined" 
        class="editor-content"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 富文本编辑器组件
 * 
 * 集成 Tiptap 编辑器，提供富文本编辑功能
 * 支持 v-model 双向绑定、只读模式和快捷键
 * 
 * @module components/journal/RichTextEditor
 * 
 * Requirements: 1.4, 1.5, 7.1, 7.4, 8.1, 8.2, 8.3, 8.4, 8.5
 */

import { ref, watch, onMounted } from 'vue'
import { EditorContent } from '@tiptap/vue-3'
import EditorToolbar from './EditorToolbar.vue'
import { useRichTextEditor } from '@/composables/useRichTextEditor'

/**
 * 组件属性
 */
interface Props {
  /** HTML 内容 (v-model) */
  modelValue?: string
  /** 占位符文本 */
  placeholder?: string
  /** 只读模式 - Requirements: 7.1 */
  readonly?: boolean
  /** 自动聚焦 */
  autofocus?: boolean
}

/**
 * 组件事件
 */
interface Emits {
  (e: 'update:modelValue', value: string): void
  /** Ctrl+Enter 提交 - Requirements: 8.5 */
  (e: 'submit'): void
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  placeholder: '记录此刻的想法、感受或事件...',
  readonly: false,
  autofocus: false
})

const emit = defineEmits<Emits>()

// 聚焦状态
const isFocused = ref(false)

// 初始化富文本编辑器
const { 
  editor, 
  getHTML, 
  setContent 
} = useRichTextEditor({
  content: props.modelValue,
  placeholder: props.placeholder,
  editable: !props.readonly,
  onUpdate: (html: string) => {
    emit('update:modelValue', html)
  },
  onSubmit: () => {
    emit('submit')
  }
})

// 监听 modelValue 变化，同步到编辑器
watch(() => props.modelValue, (newValue) => {
  // 避免循环更新：只有当内容不同时才更新
  if (editor.value && getHTML() !== newValue) {
    setContent(newValue || '')
  }
})

// 监听 readonly 变化，更新编辑器可编辑状态
watch(() => props.readonly, (newReadonly) => {
  if (editor.value) {
    editor.value.setEditable(!newReadonly)
  }
})

// 监听编辑器聚焦状态
watch(editor, (newEditor) => {
  if (newEditor) {
    newEditor.on('focus', () => {
      isFocused.value = true
    })
    newEditor.on('blur', () => {
      isFocused.value = false
    })
  }
}, { immediate: true })

// 自动聚焦
onMounted(() => {
  if (props.autofocus && editor.value && !props.readonly) {
    editor.value.commands.focus()
  }
})

// 暴露方法供父组件调用
defineExpose({
  /** 获取 HTML 内容 */
  getHTML,
  /** 设置内容 */
  setContent,
  /** 聚焦编辑器 */
  focus: () => editor.value?.commands.focus(),
  /** 清空内容 */
  clear: () => editor.value?.commands.clearContent(),
  /** 编辑器实例 */
  editor
})
</script>

<style lang="scss" scoped>
.rich-text-editor {
  display: flex;
  flex-direction: column;
  background: var(--glass-bg);
  backdrop-filter: var(--backdrop-blur);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-xl);
  overflow: hidden;
  transition: all var(--transition-normal);
  
  &:hover:not(&--readonly) {
    box-shadow: var(--shadow-lg);
  }
  
  &--focused:not(&--readonly) {
    border-color: var(--color-primary-light);
    box-shadow: var(--shadow-xl);
  }
  
  &--readonly {
    background: transparent;
    border-color: transparent;
    backdrop-filter: none;
  }
}

.editor-content-wrapper {
  padding: var(--spacing-md);
}

// 编辑器内容区域样式
.editor-content {
  min-height: 120px;
  
  // 只读模式下减少最小高度
  .rich-text-editor--readonly & {
    min-height: auto;
  }
  
  // Tiptap 编辑器样式
  :deep(.tiptap) {
    outline: none;
    min-height: inherit;
    color: var(--text-primary);
    font-size: var(--font-size-md);
    line-height: 1.8;
    
    // 段落样式
    p {
      margin: 0 0 var(--spacing-sm) 0;
      
      &:last-child {
        margin-bottom: 0;
      }
    }
    
    // 加粗
    strong {
      font-weight: var(--font-weight-bold);
    }
    
    // 斜体
    em {
      font-style: italic;
    }
    
    // 删除线
    s {
      text-decoration: line-through;
    }
    
    // 无序列表
    ul {
      padding-left: var(--spacing-xl);
      margin: var(--spacing-sm) 0;
      list-style-type: disc;
      
      li {
        margin: var(--spacing-xs) 0;
      }
    }
    
    // 有序列表
    ol {
      padding-left: var(--spacing-xl);
      margin: var(--spacing-sm) 0;
      list-style-type: decimal;
      
      li {
        margin: var(--spacing-xs) 0;
      }
    }
    
    // 引用块样式 - Requirements: 3.3
    blockquote {
      border-left: 3px solid var(--color-primary);
      background: var(--color-primary-fade);
      padding: var(--spacing-sm) var(--spacing-md);
      margin: var(--spacing-sm) 0;
      border-radius: 0 var(--radius-md) var(--radius-md) 0;
      font-style: italic;
      color: var(--text-secondary);
      
      p {
        margin: 0;
      }
    }
    
    // 代码块样式 - Requirements: 4.2
    pre {
      background: var(--bg-tertiary);
      padding: var(--spacing-md);
      border-radius: var(--radius-md);
      font-family: 'Fira Code', 'Consolas', 'Monaco', monospace;
      font-size: var(--font-size-sm);
      overflow-x: auto;
      margin: var(--spacing-sm) 0;
      white-space: pre;
      
      code {
        background: transparent;
        padding: 0;
        font-family: inherit;
        font-size: inherit;
      }
    }
    
    // 占位符样式 - Requirements: 7.4
    &.is-editor-empty::before {
      content: attr(data-placeholder);
      float: left;
      color: var(--text-placeholder);
      font-style: italic;
      pointer-events: none;
      height: 0;
    }
  }
}

// 响应式：移动端
@media (max-width: 480px) {
  .editor-content-wrapper {
    padding: var(--spacing-sm);
  }
  
  .editor-content {
    min-height: 100px;
    
    :deep(.tiptap) {
      font-size: 16px; // 防止 iOS 缩放
    }
  }
}
</style>
