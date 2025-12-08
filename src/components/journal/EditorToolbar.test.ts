/**
 * EditorToolbar 组件属性测试
 * 
 * 使用 fast-check 进行属性测试，验证工具栏状态与光标位置的一致性
 * 
 * @module components/journal/EditorToolbar.test
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import * as fc from 'fast-check'
import { Editor } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'

// ==================== 测试辅助函数 ====================

/**
 * 创建测试用编辑器实例
 */
function createTestEditor(content: string = ''): Editor {
  return new Editor({
    content,
    extensions: [
      StarterKit.configure({
        heading: false,
        horizontalRule: false
      }),
      Placeholder.configure({
        placeholder: '测试占位符'
      })
    ]
  })
}

/**
 * 销毁编辑器实例
 */
function destroyEditor(editor: Editor): void {
  editor.destroy()
}

// ==================== 生成器 ====================

/**
 * 有效文本内容生成器
 * - 非空白
 * - 不包含 HTML 特殊字符
 * - 长度适中
 * - 只包含字母数字和基本标点
 */
const validTextArb = fc.stringOf(
  fc.constantFrom(...'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 ,.!?'),
  { minLength: 1, maxLength: 50 }
)
  .map(s => s.trim())
  .filter(s => s.length > 0)

/**
 * 文本格式类型生成器
 */
const textFormatArb = fc.constantFrom('bold', 'italic', 'strike') as fc.Arbitrary<'bold' | 'italic' | 'strike'>

/**
 * 列表格式类型生成器
 */
const listFormatArb = fc.constantFrom('bulletList', 'orderedList') as fc.Arbitrary<'bulletList' | 'orderedList'>

// ==================== 属性测试 ====================

describe('EditorToolbar Property Tests', () => {
  let editor: Editor | null = null

  beforeEach(() => {
    editor = null
  })

  afterEach(() => {
    if (editor) {
      destroyEditor(editor)
      editor = null
    }
  })

  /**
   * **Feature: rich-text-editor, Property 5: 工具栏状态与光标位置一致性**
   * 
   * *For any* 格式化类型，当光标位于该格式化内部时，对应的工具栏按钮应显示为激活状态。
   * 
   * **Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5**
   */
  describe('Property 5: 工具栏状态与光标位置一致性', () => {
    /**
     * Requirements 5.1: 当光标在加粗文本内时，加粗按钮应显示为激活状态
     * 
     * 测试策略：使用已格式化的 HTML 内容初始化编辑器，然后验证 isActive 状态
     */
    it('光标在加粗文本内时，isActive("bold") 应返回 true', () => {
      fc.assert(
        fc.property(
          validTextArb,
          (text) => {
            // 使用已加粗的内容初始化编辑器
            editor = createTestEditor(`<p><strong>${text}</strong></p>`)
            
            // 将光标移动到文本内部
            editor.commands.focus('end')
            
            // 验证 isActive 返回 true
            expect(editor.isActive('bold')).toBe(true)
            
            destroyEditor(editor)
            editor = null
          }
        ),
        { numRuns: 100 }
      )
    })

    /**
     * Requirements 5.2: 当光标在斜体文本内时，斜体按钮应显示为激活状态
     */
    it('光标在斜体文本内时，isActive("italic") 应返回 true', () => {
      fc.assert(
        fc.property(
          validTextArb,
          (text) => {
            // 使用已斜体的内容初始化编辑器
            editor = createTestEditor(`<p><em>${text}</em></p>`)
            
            // 将光标移动到文本内部
            editor.commands.focus('end')
            
            // 验证 isActive 返回 true
            expect(editor.isActive('italic')).toBe(true)
            
            destroyEditor(editor)
            editor = null
          }
        ),
        { numRuns: 100 }
      )
    })

    /**
     * Requirements 5.2 (扩展): 当光标在删除线文本内时，删除线按钮应显示为激活状态
     */
    it('光标在删除线文本内时，isActive("strike") 应返回 true', () => {
      fc.assert(
        fc.property(
          validTextArb,
          (text) => {
            // 使用已删除线的内容初始化编辑器
            editor = createTestEditor(`<p><s>${text}</s></p>`)
            
            // 将光标移动到文本内部
            editor.commands.focus('end')
            
            // 验证 isActive 返回 true
            expect(editor.isActive('strike')).toBe(true)
            
            destroyEditor(editor)
            editor = null
          }
        ),
        { numRuns: 100 }
      )
    })

    /**
     * Requirements 5.3: 当光标在列表内时，对应列表按钮应显示为激活状态
     */
    it('光标在无序列表内时，isActive("bulletList") 应返回 true', () => {
      fc.assert(
        fc.property(
          validTextArb,
          (text) => {
            // 使用已格式化的无序列表内容初始化编辑器
            editor = createTestEditor(`<ul><li><p>${text}</p></li></ul>`)
            
            // 将光标移动到列表项内部
            editor.commands.focus('end')
            
            // 验证 isActive 返回 true
            expect(editor.isActive('bulletList')).toBe(true)
            
            destroyEditor(editor)
            editor = null
          }
        ),
        { numRuns: 100 }
      )
    })

    it('光标在有序列表内时，isActive("orderedList") 应返回 true', () => {
      fc.assert(
        fc.property(
          validTextArb,
          (text) => {
            // 使用已格式化的有序列表内容初始化编辑器
            editor = createTestEditor(`<ol><li><p>${text}</p></li></ol>`)
            
            // 将光标移动到列表项内部
            editor.commands.focus('end')
            
            // 验证 isActive 返回 true
            expect(editor.isActive('orderedList')).toBe(true)
            
            destroyEditor(editor)
            editor = null
          }
        ),
        { numRuns: 100 }
      )
    })

    /**
     * Requirements 5.4: 当光标在引用块内时，引用块按钮应显示为激活状态
     */
    it('光标在引用块内时，isActive("blockquote") 应返回 true', () => {
      fc.assert(
        fc.property(
          validTextArb,
          (text) => {
            // 使用已格式化的引用块内容初始化编辑器
            editor = createTestEditor(`<blockquote><p>${text}</p></blockquote>`)
            
            // 将光标移动到引用块内部
            editor.commands.focus('end')
            
            // 验证 isActive 返回 true
            expect(editor.isActive('blockquote')).toBe(true)
            
            destroyEditor(editor)
            editor = null
          }
        ),
        { numRuns: 100 }
      )
    })

    /**
     * Requirements 5.5: 当光标在代码块内时，代码块按钮应显示为激活状态
     */
    it('光标在代码块内时，isActive("codeBlock") 应返回 true', () => {
      fc.assert(
        fc.property(
          validTextArb,
          (text) => {
            // 使用已格式化的代码块内容初始化编辑器
            editor = createTestEditor(`<pre><code>${text}</code></pre>`)
            
            // 将光标移动到代码块内部
            editor.commands.focus('end')
            
            // 验证 isActive 返回 true
            expect(editor.isActive('codeBlock')).toBe(true)
            
            destroyEditor(editor)
            editor = null
          }
        ),
        { numRuns: 100 }
      )
    })

    /**
     * 测试：未应用格式时，isActive 应返回 false
     */
    it('普通文本时，所有格式的 isActive 应返回 false', () => {
      fc.assert(
        fc.property(
          validTextArb,
          (text) => {
            // 使用普通段落内容初始化编辑器
            editor = createTestEditor(`<p>${text}</p>`)
            editor.commands.focus('end')
            
            // 验证所有格式的 isActive 都返回 false
            expect(editor.isActive('bold')).toBe(false)
            expect(editor.isActive('italic')).toBe(false)
            expect(editor.isActive('strike')).toBe(false)
            expect(editor.isActive('bulletList')).toBe(false)
            expect(editor.isActive('orderedList')).toBe(false)
            expect(editor.isActive('blockquote')).toBe(false)
            expect(editor.isActive('codeBlock')).toBe(false)
            
            destroyEditor(editor)
            editor = null
          }
        ),
        { numRuns: 100 }
      )
    })

    /**
     * 测试：文本格式应用后再移除，isActive 应返回 false
     */
    it('移除文本格式后，isActive 应返回 false', () => {
      fc.assert(
        fc.property(
          validTextArb,
          textFormatArb,
          (text, formatType) => {
            // 使用已格式化的内容初始化
            const tagMap: Record<string, string> = {
              bold: 'strong',
              italic: 'em',
              strike: 's'
            }
            const tag = tagMap[formatType]
            
            editor = createTestEditor(`<p><${tag}>${text}</${tag}></p>`)
            editor.commands.selectAll()
            
            // 移除格式（toggle off）
            switch (formatType) {
              case 'bold':
                editor.chain().focus().toggleBold().run()
                break
              case 'italic':
                editor.chain().focus().toggleItalic().run()
                break
              case 'strike':
                editor.chain().focus().toggleStrike().run()
                break
            }
            
            // 验证格式已被移除
            expect(editor.isActive(formatType)).toBe(false)
            
            destroyEditor(editor)
            editor = null
          }
        ),
        { numRuns: 100 }
      )
    })

    /**
     * 测试：多种文本格式可以同时激活
     */
    it('多种文本格式可以同时激活', () => {
      fc.assert(
        fc.property(
          validTextArb,
          (text) => {
            // 使用同时加粗和斜体的内容初始化
            editor = createTestEditor(`<p><strong><em>${text}</em></strong></p>`)
            editor.commands.focus('end')
            
            // 两种格式都应该激活
            expect(editor.isActive('bold')).toBe(true)
            expect(editor.isActive('italic')).toBe(true)
            
            destroyEditor(editor)
            editor = null
          }
        ),
        { numRuns: 100 }
      )
    })

    /**
     * 测试：列表内的文本格式状态
     */
    it('列表内的文本格式状态应正确反映', () => {
      fc.assert(
        fc.property(
          validTextArb,
          listFormatArb,
          textFormatArb,
          (text, listType, textFormat) => {
            // 构建带文本格式的列表内容
            const tagMap: Record<string, string> = {
              bold: 'strong',
              italic: 'em',
              strike: 's'
            }
            const textTag = tagMap[textFormat]
            const listTag = listType === 'bulletList' ? 'ul' : 'ol'
            
            editor = createTestEditor(`<${listTag}><li><p><${textTag}>${text}</${textTag}></p></li></${listTag}>`)
            editor.commands.focus('end')
            
            // 两种格式都应该激活
            expect(editor.isActive(listType)).toBe(true)
            expect(editor.isActive(textFormat)).toBe(true)
            
            destroyEditor(editor)
            editor = null
          }
        ),
        { numRuns: 100 }
      )
    })

    /**
     * 测试：引用块内的文本格式状态
     */
    it('引用块内的文本格式状态应正确反映', () => {
      fc.assert(
        fc.property(
          validTextArb,
          textFormatArb,
          (text, textFormat) => {
            // 构建带文本格式的引用块内容
            const tagMap: Record<string, string> = {
              bold: 'strong',
              italic: 'em',
              strike: 's'
            }
            const textTag = tagMap[textFormat]
            
            editor = createTestEditor(`<blockquote><p><${textTag}>${text}</${textTag}></p></blockquote>`)
            editor.commands.focus('end')
            
            // 两种格式都应该激活
            expect(editor.isActive('blockquote')).toBe(true)
            expect(editor.isActive(textFormat)).toBe(true)
            
            destroyEditor(editor)
            editor = null
          }
        ),
        { numRuns: 100 }
      )
    })

    /**
     * 测试：格式化类型到 HTML 标签的映射正确性
     */
    it('对任意文本格式类型，已格式化内容的 isActive 应返回 true', () => {
      fc.assert(
        fc.property(
          validTextArb,
          textFormatArb,
          (text, formatType) => {
            const tagMap: Record<string, string> = {
              bold: 'strong',
              italic: 'em',
              strike: 's'
            }
            const tag = tagMap[formatType]
            
            editor = createTestEditor(`<p><${tag}>${text}</${tag}></p>`)
            editor.commands.focus('end')
            
            expect(editor.isActive(formatType)).toBe(true)
            
            destroyEditor(editor)
            editor = null
          }
        ),
        { numRuns: 100 }
      )
    })
  })
})
