/**
 * 富文本编辑器 Composable
 * 
 * 封装 Tiptap Editor 实例的创建、销毁和常用操作
 * 
 * @module composables/useRichTextEditor
 * 
 * Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 3.1, 4.1
 */

import { shallowRef, computed, onBeforeUnmount, type ShallowRef, type ComputedRef } from 'vue'
import { Editor } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { TextStyle } from '@tiptap/extension-text-style'
import { Extension } from '@tiptap/core'

/**
 * 字体大小选项
 */
export const FONT_SIZE_OPTIONS = [
  { label: '小', value: '14px' },
  { label: '默认', value: '16px' },
  { label: '中', value: '18px' },
  { label: '大', value: '20px' },
  { label: '特大', value: '24px' }
] as const

export type FontSizeValue = typeof FONT_SIZE_OPTIONS[number]['value']

/**
 * 自定义字体大小扩展
 */
const FontSize = Extension.create({
  name: 'fontSize',

  addOptions() {
    return {
      types: ['textStyle']
    }
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontSize: {
            default: null,
            parseHTML: element => element.style.fontSize || null,
            renderHTML: attributes => {
              if (!attributes.fontSize) {
                return {}
              }
              return {
                style: `font-size: ${attributes.fontSize}`
              }
            }
          }
        }
      }
    ]
  },

  addCommands() {
    return {
      setFontSize: (fontSize: string) => ({ chain }) => {
        return chain().setMark('textStyle', { fontSize }).run()
      },
      unsetFontSize: () => ({ chain }) => {
        return chain().setMark('textStyle', { fontSize: null }).removeEmptyTextStyle().run()
      }
    }
  }
})

/**
 * useRichTextEditor 配置选项
 */
export interface UseRichTextEditorOptions {
  /** 初始内容（HTML 格式） */
  content?: string
  /** 占位符文本 */
  placeholder?: string
  /** 是否可编辑 */
  editable?: boolean
  /** 内容更新回调 */
  onUpdate?: (html: string) => void
  /** 提交回调（Ctrl+Enter） */
  onSubmit?: () => void
}

/**
 * useRichTextEditor 返回值
 */
export interface UseRichTextEditorReturn {
  /** Tiptap Editor 实例 */
  editor: ShallowRef<Editor | null>
  /** 编辑器内容是否为空 */
  isEmpty: ComputedRef<boolean>
  /** 获取 HTML 内容 */
  getHTML: () => string
  /** 设置内容 */
  setContent: (html: string) => void
  /** 聚焦编辑器 */
  focus: () => void
  /** 清空内容 */
  clear: () => void
  /** 切换加粗格式 */
  toggleBold: () => void
  /** 切换斜体格式 */
  toggleItalic: () => void
  /** 切换删除线格式 */
  toggleStrike: () => void
  /** 切换无序列表 */
  toggleBulletList: () => void
  /** 切换有序列表 */
  toggleOrderedList: () => void
  /** 切换引用块 */
  toggleBlockquote: () => void
  /** 切换代码块 */
  toggleCodeBlock: () => void
  /** 检查格式是否激活 */
  isActive: (name: string, attributes?: Record<string, unknown>) => boolean
  /** 设置字体大小 */
  setFontSize: (size: string) => void
  /** 获取当前字体大小 */
  getCurrentFontSize: () => string | null
}

/**
 * 富文本编辑器 Composable
 * 
 * 封装 Tiptap Editor 的创建、销毁和常用操作方法
 * 
 * @param options - 配置选项
 * @returns 编辑器实例和操作方法
 * 
 * @example
 * ```typescript
 * const { editor, getHTML, setContent, focus, clear } = useRichTextEditor({
 *   content: '<p>初始内容</p>',
 *   placeholder: '请输入内容...',
 *   onUpdate: (html) => console.log('内容更新:', html)
 * })
 * ```
 */
export function useRichTextEditor(options: UseRichTextEditorOptions = {}): UseRichTextEditorReturn {
  const {
    content = '',
    placeholder = '',
    editable = true,
    onUpdate,
    onSubmit
  } = options

  const editor = shallowRef<Editor | null>(null)

  // 创建编辑器实例
  editor.value = new Editor({
    content,
    editable,
    extensions: [
      StarterKit.configure({
        // 配置 StarterKit 包含的扩展
        heading: false, // 不需要标题
        horizontalRule: false, // 不需要分隔线
        codeBlock: {
          HTMLAttributes: {
            class: 'code-block'
          }
        },
        blockquote: {
          HTMLAttributes: {
            class: 'blockquote'
          }
        }
      }),
      Placeholder.configure({
        placeholder,
        emptyEditorClass: 'is-editor-empty'
      }),
      TextStyle,
      FontSize
    ],
    onUpdate: ({ editor: editorInstance }) => {
      if (onUpdate) {
        onUpdate(editorInstance.getHTML())
      }
    },
    editorProps: {
      handleKeyDown: (_view, event) => {
        // Ctrl+Enter 提交
        if (event.ctrlKey && event.key === 'Enter') {
          if (onSubmit) {
            onSubmit()
            return true
          }
        }
        return false
      }
    }
  })

  // 计算属性：编辑器是否为空
  const isEmpty = computed(() => {
    if (!editor.value) return true
    return editor.value.isEmpty
  })

  /**
   * 获取 HTML 内容
   */
  const getHTML = (): string => {
    if (!editor.value) return ''
    return editor.value.getHTML()
  }

  /**
   * 设置内容
   */
  const setContent = (html: string): void => {
    if (!editor.value) return
    editor.value.commands.setContent(html)
  }

  /**
   * 聚焦编辑器
   */
  const focus = (): void => {
    if (!editor.value) return
    editor.value.commands.focus()
  }

  /**
   * 清空内容
   */
  const clear = (): void => {
    if (!editor.value) return
    editor.value.commands.clearContent()
  }

  /**
   * 切换加粗格式
   * Requirements: 1.1, 1.4
   */
  const toggleBold = (): void => {
    if (!editor.value) return
    editor.value.chain().focus().toggleBold().run()
  }

  /**
   * 切换斜体格式
   * Requirements: 1.2, 1.5
   */
  const toggleItalic = (): void => {
    if (!editor.value) return
    editor.value.chain().focus().toggleItalic().run()
  }

  /**
   * 切换删除线格式
   * Requirements: 1.3
   */
  const toggleStrike = (): void => {
    if (!editor.value) return
    editor.value.chain().focus().toggleStrike().run()
  }

  /**
   * 切换无序列表
   * Requirements: 2.1
   */
  const toggleBulletList = (): void => {
    if (!editor.value) return
    editor.value.chain().focus().toggleBulletList().run()
  }

  /**
   * 切换有序列表
   * Requirements: 2.2
   */
  const toggleOrderedList = (): void => {
    if (!editor.value) return
    editor.value.chain().focus().toggleOrderedList().run()
  }

  /**
   * 切换引用块
   * Requirements: 3.1, 3.2
   */
  const toggleBlockquote = (): void => {
    if (!editor.value) return
    editor.value.chain().focus().toggleBlockquote().run()
  }

  /**
   * 切换代码块
   * Requirements: 4.1
   */
  const toggleCodeBlock = (): void => {
    if (!editor.value) return
    editor.value.chain().focus().toggleCodeBlock().run()
  }

  /**
   * 检查格式是否激活
   * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
   */
  const isActive = (name: string, attributes?: Record<string, unknown>): boolean => {
    if (!editor.value) return false
    return editor.value.isActive(name, attributes)
  }

  /**
   * 设置字体大小
   */
  const setFontSize = (size: string): void => {
    if (!editor.value) return
    // 使用类型断言来调用自定义命令
    ;(editor.value.chain().focus() as any).setFontSize(size).run()
  }

  /**
   * 获取当前字体大小
   */
  const getCurrentFontSize = (): string | null => {
    if (!editor.value) return null
    const attrs = editor.value.getAttributes('textStyle')
    return attrs.fontSize || null
  }

  // 组件卸载时销毁编辑器
  onBeforeUnmount(() => {
    if (editor.value) {
      editor.value.destroy()
      editor.value = null
    }
  })

  return {
    editor,
    isEmpty,
    getHTML,
    setContent,
    focus,
    clear,
    toggleBold,
    toggleItalic,
    toggleStrike,
    toggleBulletList,
    toggleOrderedList,
    toggleBlockquote,
    toggleCodeBlock,
    isActive,
    setFontSize,
    getCurrentFontSize
  }
}
